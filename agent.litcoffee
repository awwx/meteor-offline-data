    return unless Offline.persistent

    database = Offline._database

    Offline._test or= {}


    unless Offline.isWebWorker
      {nowAgent, thisWindowId} = Offline._windows
    {windowsAreDead} = Offline._windows


    Offline._messageAgent = (topic, args...) ->
      if Offline.isWebWorker
        throw new Error("oops, messaging agent from agent");
      else if Offline._usingSharedWebWorker
        Offline._sharedWebWorker.post {msg: topic, args}
      else if Offline._windows.currentlyTheAgent()
        Errors.defer -> handlers[topic]?(args...)
      else
        broadcast topic, args...
      return


    if Offline.isWebWorker

      WebWorker.addMessageHandler 'update', (sourcePort, data) ->
        for port in WebWorker.ports
          unless port is sourcePort
            port.postMessage({msg: 'update'})
        return


      addMessageHandler = (topic, callback) ->
        WebWorker.addMessageHandler topic, (sourcePort, data) ->
          callback()
          return


      broadcastUpdate = ->
        for port in WebWorker.ports
          port.postMessage({msg: 'update'})
        return


    else

      handlers = {}

      addMessageHandler = (topic, callback) ->
        handlers[topic] = callback
        broadcast.listen topic, callback
        return


      broadcastUpdate = ->
        broadcast.includingSelf 'update'
        return


    addUpdate = (tx, trackUpdate, update) ->
      trackUpdate.madeUpdate = true if trackUpdate?
      database.addUpdate(tx, update)


    broadcastStatusOfSubscription = (tx, trackUpdate, subscription) ->
      addUpdate tx, trackUpdate, {
        update: 'subscriptionStatus'
        subscription: {
          connection: subscription.connection
          name: subscription.name
          args: subscription.args
        }
        status: Offline._subscriptionStatus(subscription)
      }


    broadcastSubscriptionStatus = (tx, trackUpdate, connection, name, args) ->
      database.readSubscription(tx, connection, name, args)
      .then((subscription) =>
        broadcastStatusOfSubscription(tx, trackUpdate, subscription)
      )


A subscription is ready when we have received a DDP "ready" message
from the server *and* there are no outstanding method calls that
were made after the subscription was started.

A subscription becomes loaded when it is ready, and stays loaded until
the subscription is unsubscribed or has an error.

    updateSubscriptionsReady = (tx, trackUpdate) ->
      Context.withContext "updateSubscriptionsReady", ->
        Result.join([
          database.readSubscriptions(tx)
          database.readSubscriptionsHeldUp(tx)
        ])
        .then(([subscriptions, subscriptionsHeldUp]) ->
          newlyReady = []
          for {connection, name, args, serverReady, status} in subscriptions
            if (serverReady and
                status is 'subscribing' and
                not contains(subscriptionsHeldUp, {connection, name, args}))
              newlyReady.push {connection, name, args}
          Result.map(
            newlyReady,
            (({connection, name, args}) ->
              database.setSubscriptionReady(tx, connection, name, args)
              .then(->
                broadcastSubscriptionStatus(tx, trackUpdate, connection, name, args)
              )
            )
          )
        )


    Offline._test.updateSubscriptionsReady = updateSubscriptionsReady


    justNameAndArgs = (subscription) ->
      {name: subscription.name, args: subscription.args}


If we're running in the shared web worker, we're always the
agent. Otherwise, running in a browser window, we need to check if
we're still the agent in the transaction.

TODO because we're no longer passing the agent role from window to
window, once this window becomes the agent it stays the agent for as
long as it's alive.

    if Offline.isWebWorker

      asAgentWindow = (fn) ->
        database.transaction(fn)

    else

      asAgentWindow = (fn) ->
        database.transaction((tx) =>
          database.readAgentWindow(tx)
          .then((agentWindowId) =>
            if agentWindowId is thisWindowId
              return fn(tx)
            else
              return Result.failed()
          )
        )


Mapping of connection name to ConnectionAgents.

    @connectionAgents = {}


    class ConnectionAgent

      constructor: (@connectionName, @meteorConnection) ->
        if connectionAgents[@connectionName]?
          throw new Error(
            "a ConnectionAgent has already been constructed for this connection name: #{@connectionName}"
          )

        connectionAgents[@connectionName] = this

        @methodHandlers = {}

collection name -> collectionAgent

        @collectionAgents = {}


A mapping of `methodId -> true` for methods in the database list of
queued methods that the agent has sent.

        @methodsSent = {}

serialized subscription -> Meteor subscription handle

        @meteorSubscriptionHandles = {}

        @_nMeteorSubscriptionsReady = 0

        @_deletedRemovedDocs = false


TODO this is wrong: this only deletes documents for collections that
we've already seen.

      deleteRemovedDocuments: (tx) ->
        if @_deletedRemovedDocs
          return Result.completed()
        else
          @_deletedRemovedDocs = true
          return @_eachCollectionAgent((collectionAgent) ->
            collectionAgent.deleteDocumentsGoneFromServer(tx)
          )


      checkIfReadyToDeleteDocs: (tx) ->
        if @allMeteorSubscriptionsReady()
          @deleteRemovedDocuments(tx)


      _alreadyHaveMeteorSubscription: (subscription) ->
        !! @meteorSubscriptionHandles[stringify(subscription)]


      allMeteorSubscriptionsReady: ->
        @_nMeteorSubscriptionsReady is _.size(@meteorSubscriptionHandles)


      _eachCollectionAgent: (fn) ->
        results = []
        for name, collectionAgent of @collectionAgents
          results.push fn(collectionAgent)
        return Result.join(results)


      instantiateCollectionAgent: (collectionName) ->
        @collectionAgents[collectionName] or=
          new CollectionAgent(
            this,
            collectionName,
            new Meteor.Collection(collectionName)
          )
        return


      instantiateCollectionAgents: (collectionNames) ->
        for collectionName in collectionNames
          @instantiateCollectionAgent(collectionName)
        return


      meteorSubscriptionReady: (subscription) ->
        @instantiateCollectionAgents(_.keys(
          @meteorConnection._updatesForUnknownStores
        ))
        asAgentWindow (tx) =>
          database.setSubscriptionServerReady(
            tx,
            @connectionName,
            subscription.name,
            subscription.args,
          )
          .then(=>
            broadcastSubscriptionStatus(
              tx, null, @connectionName, subscription.name, subscription.args
            )
          )
          .then(=>
            updateSubscriptionsReady(tx, null)
          )
          .then(=>
            ++@_nMeteorSubscriptionsReady
            @checkIfReadyToDeleteDocs(tx)
          )
          .then(->
            broadcastUpdate()
          )


      currentSubscriptions: ->
        _.map(_.keys(@meteorSubscriptionHandles), EJSON.parse)


      oldSubscriptions: (subscriptions) ->
        _.reject(
          @currentSubscriptions(),
          ((subscription) => contains(subscriptions, subscription))
        )


      newSubscriptions: (subscriptions) ->
        _.reject(
          subscriptions,
          (subscription) => @_alreadyHaveMeteorSubscription(subscription)
        )


      stopOldSubscriptions: (tx, trackUpdate, subscriptions) ->
        writes = []
        for subscription in @oldSubscriptions(subscriptions)
          serialized = stringify(subscription)
          @meteorSubscriptionHandles[serialized].stop()
          delete @meteorSubscriptionHandles[serialized]
          trackUpdate.madeUpdate = true
          writes.push(
            database.addUpdate(tx, {
              update: 'subscriptionStatus'
              subscription: {
                connection: @connectionName
                name: subscription.name
                args: subscription.args
              }
              status: {
                status: 'unsubscribed'
                loaded: false
              }
            })
          )
        return Result.join(writes)


      subscriptionError: (subscription, error) ->
        database.transaction((tx) =>
          database.setSubscriptionError(
            tx,
            @connectionName,
            subscription.name,
            subscription.args,
            error
          )
          .then(=>
            broadcastSubscriptionStatus(
              tx,
              null,
              @connectionName,
              subscription.name,
              subscription.args
            )
          )
        )
        .then(=>
          broadcastUpdate()
        )
        return


      startNewSubscription: (subscription) ->
        @_deletedRemovedDocs = false
        {name, args} = subscription
        handle = Meteor.subscribe name, args...,
          onError: (err) =>
            @subscriptionError subscription, err
            return
          onReady: =>
            @meteorSubscriptionReady(subscription)
            return
        @meteorSubscriptionHandles[stringify(subscription)] = handle
        return


      startNewSubscriptions: (tx, trackUpdate, subscriptions) ->
        Result.map(
          @newSubscriptions(subscriptions),
          ((subscription) =>
            @startNewSubscription(subscription)
            database.ensureSubscription(
              tx,
              @connectionName,
              subscription.name,
              subscription.args
            )
            .then(=>
              database.setSubscriptionStatus(
                tx,
                @connectionName,
                subscription.name,
                subscription.args,
                'subscribing'
              )
            )
            .then(=>
              broadcastSubscriptionStatus(
                tx,
                trackUpdate,
                @connectionName,
                subscription.name,
                subscription.args
              )
            )
          )
        )


      subscribeToSubscriptions: (tx, trackUpdate, subscriptions) ->
        subscriptions = _.map(subscriptions, justNameAndArgs)
        return Result.join([
          @stopOldSubscriptions(tx, trackUpdate, subscriptions)
          @startNewSubscriptions(tx, trackUpdate, subscriptions)
        ])


      checkIfDocumentNowFree: (tx, collectionName, docId) ->
        @collectionAgents[collectionName].updateDocFromServerIfFree(
          tx,
          docId,
        )


      methodCompleted: (methodId) ->
        docsWhichWereWrittenByStub = null
        asAgentWindow((tx) =>
          database.removeQueuedMethod(tx, @connectionName, methodId)
          .then(->
            database.readDocsWrittenByStub(tx, @connectionName, methodId)
          )
          .then((docs) =>
            docsWhichWereWrittenByStub = docs

            database.removeDocumentsWrittenByStub(
              tx, @connectionName, methodId
            )
          )
          .then(=>
            writes = []
            for {collectionName, docId} in docsWhichWereWrittenByStub
              writes.push @checkIfDocumentNowFree tx, collectionName, docId
            return Result.join(writes)
          )
          .then(->
            database.removeMethodHoldingUpSubscriptions(tx, methodId)
          )
          .then(->
            updateSubscriptionsReady(tx, null)
          )
        )
        .then(->
          broadcastUpdate()
        )
        return


      sendQueuedMethod: (methodId, name, args) ->
        return if @methodsSent[methodId]
        @methodsSent[methodId] = true
        Meteor.call '/awwx/offline-data/apply', methodId, name, args, (error, result) =>
          if error
            Meteor._debug 'offline method error', name, error
          @methodCompleted(methodId)
          return
        return


    newConnectionAgent = (connectionName) ->
      meteorConnection = if connectionName is '/'
        Meteor.default_connection
      else
        Meteor.connect(connectionName)
      return new ConnectionAgent(connectionName, meteorConnection)


    connectionAgentFor = (connectionName) ->
      connectionAgents[connectionName] or= newConnectionAgent(connectionName)


    sendQueuedMethodsInTx = (tx) ->
      database.readQueuedMethods(tx)
      .then((methods) ->
        for {connection, methodId, name, args} in methods
          connectionAgentFor(connection).sendQueuedMethod(methodId, name, args)
        return
      )


    sendQueuedMethods = ->
      asAgentWindow (tx) ->
        sendQueuedMethodsInTx tx


Make the subscriptions we're subscribing to (and not subscribing to)
match what we should be subscribing to according to the database.

    subscribeToSubscriptions = (tx, trackUpdate) ->
      database.readMergedSubscriptions(tx)
      .then((subscriptions) ->
        for subscription in subscriptions
          connectionAgentFor subscription.connection

        writes = []
        for connectionName, connectionAgent of connectionAgents
          writes.push connectionAgent.subscribeToSubscriptions(
            tx,
            trackUpdate,
            _.filter(
              subscriptions,
              (subscription) -> subscription.connection is connectionName
            )
          )
        Result.join(writes)
        .then(->
          if trackUpdate.madeUpdate
            broadcastUpdate()
          return
        )
        return
      )


    class CollectionAgent

      constructor: (@connectionAgent, @collectionName, @serverCollection) ->
        @connectionName = @connectionAgent.connectionName
        @watchServer()


      offlineDocumentsNotInServerCollection: (tx) ->
        database.readDocIdsOfCollection(tx, @connectionName, @collectionName)
        .then((docIds) =>
          _.reject(
            docIds,
            ((docId) => @serverCollection.findOne(docId))
          )
        )


We have a full and complete set of data from the server (our
subscriptions are ready).  We can now delete documents in the offline
collection which are no longer present on the server.

      deleteDocUnlessWrittenByStub: (tx, docId) ->
        database.isDocumentWrittenByAnyStub(
          tx,
          @connectionName,
          @collectionName,
          docId
        )
        .then((wasWritten) =>
          if wasWritten
            return
          else
            database.deleteDoc(tx, @connectionName, @collectionName, docId)
            .then(=>
              @addDocumentUpdate tx, docId, null
            )
        )


      deleteDocumentsGoneFromServer: (tx) ->
        @offlineDocumentsNotInServerCollection(tx)
        .then((docIds) =>
          # TODO Result.map
          writes = []
          for docId in docIds
            writes.push @deleteDocUnlessWrittenByStub(tx, docId)
          return Result.join(writes)
        )


      addDocumentUpdate: (tx, docId, doc) ->
        database.addUpdate tx, {
          update: 'documentUpdated'
          connectionName: @connectionName
          collectionName: @collectionName
          docId
          doc
        }


      updateDocIfFree: (tx, docId, doc) ->
        database.isDocumentWrittenByAnyStub(
          tx,
          @connectionName,
          @collectionName,
          docId
        )
        .then((wasWritten) =>
          return if wasWritten
          (if doc?
            database.writeDoc tx, @connectionName, @collectionName, doc
          else
            database.deleteDoc tx, @connectionName, @collectionName, docId
          )
          .then(=>
            @addDocumentUpdate(tx, docId, doc)
          )
        )


      updateDocFromServerIfFree: (tx, docId) ->
        @updateDocIfFree(tx, docId, @serverCollection.findOne(docId))


      serverDocUpdated: (docId, doc) ->
        asAgentWindow((tx) =>
          @updateDocIfFree(tx, docId, doc)
        )
        .then(=>
          broadcastUpdate()
        )
        return


TODO can we batch updates into one transaction?

      watchServer: ->
        @serverCollection.find().observe
          added:   (doc) => @serverDocUpdated doc._id, doc
          changed: (doc) => @serverDocUpdated doc._id, doc
          removed: (doc) => @serverDocUpdated doc._id, null
        return


    # meteorConnectionName = (meteorConnection) ->
    #   if @meteorConection is Meteor.default_connection
    #     '/'
    #   else
    #     meteorConnection._stream.rawUrl


    withUpdateTracking = (fn) ->
      trackUpdate = {madeUpdate: false}
      database.transaction((tx) ->
        fn(tx, trackUpdate)
      )
      .then(->
        if trackUpdate.madeUpdate
          broadcastUpdate()
        return
      )

    windowSubscriptionsUpdated = ->
      withUpdateTracking((tx, trackUpdate) ->
        subscribeToSubscriptions(tx, trackUpdate)
      )
      return


    initialized = new Result()


    cleanSubscriptions = (tx, trackUpdate) ->
      database.cleanSubscriptions(tx)
      .then((deletedSubscriptions) ->
        Result.map(
          deletedSubscriptions,
          ((subscription) ->
            trackUpdate.madeUpdate = true
            database.addUpdate(tx, {
              update: 'subscriptionStatus'
              subscription
              status: {
                status: 'unsubscribed'
                loaded: false
              }
            })
          )
        )
      )


    initializeAgent = ->
      withUpdateTracking((tx, trackUpdate) ->
        cleanSubscriptions(tx, trackUpdate)
        .then(->
          database.initializeSubscriptions(tx)
        )
        .then(->
          database.readSubscriptions(tx)
        )
        .then((subscriptions)->
          Result.map(
            subscriptions,
            ((subscription) ->
              broadcastStatusOfSubscription(tx, trackUpdate, subscription)
            )
          )
        )
        .then(->
          sendQueuedMethodsInTx(tx)
        )
      )
      .then(->
        initialized.complete()
      )
      return


    windowsAreDead.listen (deadWindowIds) ->
      initialized.then(->
        trackUpdate = {madeUpdate: false}
        asAgentWindow((tx) ->
          database.deleteWindows(tx, deadWindowIds)
          .then(->
            cleanSubscriptions(tx, trackUpdate)
          )
          .then(->
            subscribeToSubscriptions(tx, trackUpdate)
          )
        )
        .then(->
          if trackUpdate.madeUpdate
            broadcastUpdate()
        )
        return
      )
      return


    Meteor.startup ->

      return if not Offline.isWebWorker and Offline._usingSharedWebWorker

      addMessageHandler 'windowSubscriptionsUpdated', ->
        windowSubscriptionsUpdated()
        return

      addMessageHandler 'newQueuedMethod', ->
        sendQueuedMethods()
        return

      if Offline.isWebWorker
        initializeAgent()
      else
        nowAgent.listen initializeAgent

      return

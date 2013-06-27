If we're running in a browser window and we're using a shared web
worker for the agent, then we're not the agent.

    if Offline?._usingSharedWebWorker

      Offline._messageAgent = (topic, args...) ->
        Offline._sharedWebWorker.post {msg: topic, args}
        return

      return


    {contains, Result} = awwx
    {withContext} = awwx.Context
    broadcast = Offline._broadcast
    {defer} = awwx.Error
    {nowAgent, thisWindowId} = Offline._windows
    serialize = awwx.canonicalStringify
    database = Offline._database

    Offline._test or= {}


    if @Agent?

      Agent.addMessageHandler 'update', (sourcePort, data) ->
        for port in Agent.ports
          unless port is sourcePort
            port.postMessage({msg: 'update'})
        return


      addMessageHandler = (topic, callback) ->
        Agent.addMessageHandler topic, (sourcePort, data) ->
          callback()
          return


      broadcastUpdate = ->
        for port in Agent.ports
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


      Offline._messageAgent = (topic, args...) ->
        if Offline._windows.currentlyTheAgent()
          handlers[topic]?(args...)
        else
          broadcast topic, args...
        return


    updateSubscriptionsReadyInTx = (tx) ->
      withContext "updateSubscriptionsReadyInTx", ->
        Result.join([
          database.readSubscriptions(tx)
          database.readSubscriptionsHeldUp(tx)
        ])
        .then(([subscriptions, subscriptionsHeldUp]) ->
          newlyReady = []
          for {connection, name, args, readyFromServer, ready} in subscriptions
            if (not ready and
                readyFromServer and
                not contains(subscriptionsHeldUp, {connection, name, args}))
              newlyReady.push {connection, name, args}
          if newlyReady.length is 0
            return false
          writes = []
          for {connection, name, args} in newlyReady
            writes.push database.setSubscriptionReady(tx, connection, name, args)
            writes.push database.addUpdate(tx, {
              update: 'subscriptionReady',
              subscription: {connection, name, args}
            })
          Result.join(writes)
        )
        .then(-> return true)


    Offline._test.updateSubscriptionsReadyInTx = updateSubscriptionsReadyInTx


TODO what we really want here for broadcasting updates is to have an
"after transaction" callback that would broadcast an update iff an
update was added to the database during the transaction.

    updateSubscriptionsReady = ->
      withContext "updateSubscriptionsReady", ->
        database.transaction((tx) ->
          updateSubscriptionsReadyInTx(tx)
        )
        .then((someNewlyReady) ->
          if someNewlyReady
            broadcastUpdate()
          return
        )


    addNewSubscriptionToDatabase = (tx, connection, name, args) ->
      withContext "addNewSubscriptionToDatabase", ->
        database.readMethodsWithDocsWritten(tx, connection)
        .then((methodIds) ->
          database.addSubscriptionWaitingOnMethods(
            tx,
            connection,
            name,
            args,
            methodIds
          )
        )
        .then(->
          database.ensureSubscription(tx, connection, name, args)
        )


    justNameAndArgs = (subscription) ->
      {name: subscription.name, args: subscription.args}


If we're running in the shared web worker, we're always the agent.

    if @Agent?

      asAgentWindow = (fn) ->
        database.transaction(fn)

Otherwise, running in a browser window, we need to check if we're
still the agent in the transaction.

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
        !! @meteorSubscriptionHandles[serialize(subscription)]

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
          # processUpdatesInTx(tx)
          # .then(->
          database.setSubscriptionReadyFromServer(
            tx,
            @connectionName,
            subscription.name
            subscription.args
          )
          # )
          .then(->
            updateSubscriptionsReadyInTx(tx)
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

      stopOldSubscriptions: (subscriptions) ->
        for subscription in @oldSubscriptions(subscriptions)
          serialized = serialize(subscription)
          @meteorSubscriptionHandles[serialized].stop()
          delete @meteorSubscriptionHandles[serialized]
        return

      startNewSubscription: (subscription) ->
        @_deletedRemovedDocs = false
        {name, args} = subscription
        handle = Meteor.subscribe name, args..., =>
          @meteorSubscriptionReady(subscription)
          return
        @meteorSubscriptionHandles[serialize(subscription)] = handle
        return

      newSubscriptions: (subscriptions) ->
        _.reject(
          subscriptions,
          (subscription) => @_alreadyHaveMeteorSubscription(subscription)
        )

      startNewSubscriptions: (subscriptions) ->
        for subscription in @newSubscriptions(subscriptions)
          @startNewSubscription(subscription)
        return

      updateSubscriptions: (subscriptions) ->
        subscriptions = _.map(subscriptions, justNameAndArgs)
        @stopOldSubscriptions(subscriptions)
        @startNewSubscriptions(subscriptions)
        return Result.completed()


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
            updateSubscriptionsReadyInTx(tx)
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


    sendQueuedMethods = ->
      asAgentWindow (tx) ->
        database.readQueuedMethods(tx)
        .then((methods) ->
          for {connection, methodId, name, args} in methods
            connectionAgentFor(connection).sendQueuedMethod(methodId, name, args)
          return
        )


TODO rename

    subscribeToNewSubscriptions = (subscriptions) ->

      for subscription in subscriptions
        connectionAgentFor subscription.connection

      results = []
      for connectionName, connectionAgent of connectionAgents
        connectionSubscriptions =
          _.filter(
            subscriptions,
            (subscription) -> subscription.connection is connectionName
          )
        results.push connectionAgent.updateSubscriptions(connectionSubscriptions)
      return Result.join(results)


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
            database.deleteDoc tx, @connectionname, @collectionName, docId
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


    updateSubscriptions = ->
      updateSubscriptionsReady()
      subscriptionsUpdated()


    subscriptionsUpdated = ->
      asAgentWindow((tx) ->
        database.readMergedSubscriptions(tx)
      )
      .then((subscriptions) ->
        subscribeToNewSubscriptions(subscriptions)
      )
      return


    addMessageHandler 'subscriptionsUpdated', ->
      updateSubscriptions()
      return


    nowAgent.listen ->
      updateSubscriptions()
      sendQueuedMethods()
      return


    addMessageHandler 'newQueuedMethod', ->
      sendQueuedMethods()
      return


    unless @Agent?
      broadcast.listen 'deadWindows', ->
        subscriptionsUpdated()
        return

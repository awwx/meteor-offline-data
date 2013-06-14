    {contains, Result} = awwx
    broadcast = Offline._broadcast
    {defer} = awwx.Error
    serialize = awwx.canonicalStringify
    database = Offline._database
    {thisWindowId} = Offline._windows
    {withContext} = awwx.Context


An offline subscription is ready when:

* the underlying Meteor subscription is ready

* server documents have been stored in the database

* database documents have been copied to the local collection

    subscriptionReadyDeps = {}
    subscriptionReady = {}

    getSubscriptionReady = (subscription) ->
      serialized = serialize(subscription)
      dep = (subscriptionReadyDeps[serialized] or= new Deps.Dependency)
      dep.depend()
      unless subscriptionReady[serialized]?
        subscriptionReady[serialized] = false
      return subscriptionReady[serialized]

    setSubscriptionReady = (serializedSubscription, ready) ->
      dep = (subscriptionReadyDeps[serializedSubscription] or= new Deps.Dependency)
      if subscriptionReady[serializedSubscription] isnt ready
        subscriptionReady[serializedSubscription] = ready
        dep.changed()
      return


    addWindowSubscription = (connection, name, args) ->
      database.transaction((tx) ->
        database.addSubscriptionForWindow(
          tx,
          thisWindowId,
          connection,
          name,
          args
        )
      )
      .then(->
        broadcast 'subscriptionsUpdated'
      )


connection name -> OfflineConnection

    offlineConnections = {}


    class OfflineConnection

      constructor: (@connectionName) ->
        if offlineConnections[@connectionName]?
          throw new Error(
            "an OfflineConnection has already been constructed for this connection: #{@connectionName}"
          )
        offlineConnections[@connectionName] = this
        @_methodHandlers = {}
        @_offlineCollections = {}
        @_initialized = new Result()
        @_initialize()


      _initialize: ->
        withContext "initialize offline connection #{@connectionName}", =>
          Meteor.startup =>
            database.transaction((tx) =>
              database.readDocs(tx, @connectionName)
            )
            .then((connectionDocs) =>
              for collectionName, docs of connectionDocs
                for docId, doc of docs
                  updateLocal @connectionName, collectionName, docId, doc
              return
            )
            .then(=>
              @_initialized.complete()
            )
            return

      _addCollection: (offlineCollection) ->
        name = offlineCollection._collectionName
        if @_offlineCollections[name]?
          throw new Error("already have an offline collection for: #{name}")
        @_offlineCollections[name] = offlineCollection
        return

      registerStore: (name, wrappedStore) ->
        return wrappedStore

      userId: ->
        return null

TODO is setUserId defined on the client?

      setUserId: (userId) ->
        throw new Error('not implemented yet')


Add to this window's list of offline subscriptions.

"ready" means we've finished loading saved data from the browser
database, or, if this is a first subscription and we don't have data in
the database yet, that we've finished loaded data from the server (the
underlying server subscription is ready).

TODO support `onError` (will need to store error in database)

      subscribe: (name, args...) ->

        last = _.last(args)
        if _.isFunction(last)
          args = _.initial(args)
          onReady = last
          onError = (->)
        else if last? and (_.isFunction(last.onReady) or _.isFunction(last.onError))
          args = _.initial(args)
          onReady = last.onReady ? (->)
          onError = last.onError ? (->)
        else
          onReady = (->)
          onError = (->)

        if Deps.active
          throw new Error(
            'reactive offline subscriptions are not yet implemented'
          )

        addWindowSubscription @connectionName, name, args

        stopped = false

        handle = {
          ready: =>
            if stopped
              return false
            else
              return getSubscriptionReady({connection: @connectionName, name, args})

          stop: =>
            return if stopped
            stopped = true
            database.transaction((tx) =>
              database.removeWindowSubscription(
                tx,
                thisWindowId,
                @connectionName,
                name,
                args
              )
              .then(=>
                database.cleanSubscriptions(tx)
              )
            ).then(->
              defer -> broadcast 'subscriptionsUpdated'
            )
            return
        }

        computation = Deps.autorun ->
          if handle.ready()
            onReady()
            computation.stop()
          return

        return handle


https://github.com/meteor/meteor/blob/release/0.6.1/packages/livedata/livedata_connection.js#L525

      methods: (methods) ->
        _.each methods, (func, name) =>
          if @_methodHandlers[name]
            throw new Error("A method named '" + name + "' is already defined")
          @_methodHandlers[name] = func
        return


      _saveOriginals: ->
        for name, offlineCollection of @_offlineCollections
          offlineCollection._saveOriginals()
        return


      _writeChanges: (tx, methodId) ->
        writes = []
        for name, offlineCollection of @_offlineCollections
          writes.push offlineCollection._writeMethodChanges(tx, methodId)
        return Result.join(writes)


https://github.com/meteor/meteor/blob/release/0.6.1/packages/livedata/livedata_connection.js#L584

      _runStub: (methodId, alreadyInSimulation, name, args) ->
        stub = @_methodHandlers[name]
        return unless stub

        # TODO sessionData

        invocation = new Meteor._MethodInvocation({
          isSimulation: true
          userId: @userId()
          setUserId: (userId) => @setUserId(userId)
        })

        if alreadyInSimulation
          try
            ret = Meteor._CurrentInvocation.withValue(invocation, ->
              return stub.apply(invocation, EJSON.clone(args))
            )
          catch e
            exception = e
          if exception
            return Result.failed(exception)
          else
            return Result.completed(ret)

        # Not already in simulation... run the method stub in
        # a database transaction.

        database.transaction((tx) =>
          processUpdatesInTx(tx)
          .then(=>
            @_saveOriginals()
            try
              ret = Meteor._CurrentInvocation.withValue(invocation, ->
                return stub.apply(invocation, EJSON.clone(args))
              )
            catch e
              exception = e
            return @_writeChanges(tx, methodId)
          )
        )
        .then(=>
          broadcast 'update'
          if exception
            return Result.failed(exception)
          else
            return Result.completed(ret)
        )


https://github.com/meteor/meteor/blob/release/0.6.1/packages/livedata/livedata_connection.js#L534

      call: (name, args...) ->
        if args.length and typeof args[args.length - 1] is 'function'
          callback = args.pop()
        return @apply(name, args, callback)


https://github.com/meteor/meteor/blob/release/0.6.1/packages/livedata/livedata_connection.js#L543

      apply: (name, args, options, callback) ->
        if not callback and typeof options is 'function'
          callback = options
          options = {}

        if callback
          callback = Meteor.bindEnvironment callback, (e) ->
            Meteor._debug("Exception while delivering result of invoking '" +
                          name + "'", e, e.stack)

        methodId = Random.id()

        enclosing = Meteor._CurrentInvocation.get()
        alreadyInSimulation = enclosing and enclosing.isSimulation

        @_runStub(methodId, alreadyInSimulation, name, args)
        .onFailure((exception) =>
          unless exception.expected
            Meteor._debug(
              "Exception while simulating the effect of invoking '" +
              name + "'", exception, exception.stack
            )
          return
        )
        .always(=>
          return if alreadyInSimulation
          database.transaction((tx) =>
            database.addQueuedMethod(
              tx, @connectionName, methodId, name, args
            )
          )
          .then(=>
            broadcast 'newQueuedMethod'
            return
          )
        )

        return


    offlineConnectionFor = (connectionName) ->
      offlineConnections[connectionName] or
        new OfflineConnection(connectionName)


    Offline._defaultOfflineConnection = defaultOfflineConnection =
      new OfflineConnection('/')


    Offline.subscribe = (name, args...) ->
      defaultOfflineConnection.subscribe(name, args...)


connectionName -> collectionName -> LocalCollection

    Offline._localCollections = localCollections = {}


    getLocalCollection = (connectionName, collectionName) ->
      (localCollections[connectionName] or= {})[collectionName] or=
        new LocalCollection()


    updateLocal = (connectionName, collectionName, docId, doc) ->
      localCollection = getLocalCollection(connectionName, collectionName)
      if doc?
        if doc._id isnt docId
          throw new Error("oops, document id doesn't match")
        if localCollection.findOne(docId)?
          localCollection.update(docId, doc)
        else
          localCollection.insert(doc)
      else
        localCollection.remove(docId)
      return


connection name -> collection name -> OfflineCollection

    offlineCollections = {}


    class OfflineCollection

      constructor: (@_collectionName, options = {}) ->

        @_connectionName = options.connectionName ? '/'
        offlineConnection = offlineConnectionFor(@_connectionName)

        offlineConnection._addCollection(this)

        @_localCollection = getLocalCollection(@_connectionName, @_collectionName)

        driver =
          open: (_name) =>
            unless _name is @_collectionName
              throw new Error(
                "oops, driver is being called with the wrong name
                 for this collection: #{_name}"
              )
            return @_localCollection

        @_collection = new Meteor.Collection(
          @_collectionName,
          {connection: offlineConnection, _driver: driver}
        )

      find: (args...) ->
        @_localCollection.find(args...)

      findOne: (args...) ->
        @_localCollection.findOne(args...)

      _saveOriginals: ->
        @_localCollection.saveOriginals()

      _writeDoc: (tx, docId) ->
        doc = @_localCollection.findOne(docId)
        if doc?
          database.writeDoc(tx, @_connectionName, @_collectionName, doc)
        else
          database.deleteDoc(tx, @_connectionName, @_collectionName, docId)

      _writeMethodChanges: (tx, methodId) ->
        originals = @_localCollection.retrieveOriginals()
        writes = []
        for docId of originals
          writes.push @_writeDoc(tx, docId)
          writes.push database.addDocumentWrittenByStub(
            tx, @_connectionName, methodId, @_collectionName, docId
          )
          writes.push database.addUpdate tx, {
            update: 'documentUpdated',
            connectionName: @_connectionName,
            collectionName: @_collectionName,
            docId,
            doc: @_localCollection.findOne(docId)
          }
        return Result.join(writes)

      insert: (doc, callback) ->
        if callback?
          Meteor._debug "Warning: the insert `callback` argument will not called for an Offline collection"
        return @_collection.insert(doc)

      update: (selector, modifier, options, callback) ->
        if typeof(options) is 'function' or typeof(callback) is 'function'
          Meteor._debug "Warning: the update `callback` argument will not called for an Offline collection"
        if typeof(options) is 'function'
          options = undefined
        return @_collection.update(selector, modifier, options)

      remove: (selector, callback) ->
        if callback?
          Meteor._debug "Warning: the remove `callback` argument will not called for an Offline collection"
        return @_collection.remove(selector)


## Updates

All windows listen for updates from the agent window.

    processDocumentUpdated = (update) ->
      {connectionName, collectionName, docId, doc} = update
      updateLocal connectionName, collectionName, docId, doc
      return

    processSubscriptionReady = (update) ->
      {subscription} = update
      setSubscriptionReady serialize(subscription), true
      return

    processUpdate = (update) ->
      switch update.update
        when 'documentUpdated'   then processDocumentUpdated(update)
        when 'subscriptionReady' then processSubscriptionReady(update)
        else
          throw new Error "unknown update: " + serialize(update)
      return


TODO getting called a lot

    processUpdatesInTx = (tx) ->
      database.pullUpdatesForWindow(tx, thisWindowId)
      .then((updates) ->
        database.removeUpdatesProcessedByAllWindows(tx)
        .then(->
          processUpdate(update) for update in updates
          return
        )
      )

    processUpdates = ->
      database.transaction((tx) ->
        processUpdatesInTx(tx)
      )
      return


    broadcast.listen 'update', processUpdates


    Meteor.startup ->
      database.transaction((tx) ->
        database.readSubscriptions(tx)
      )
      .then((subscriptions) ->
        for subscription in subscriptions
          if subscription.ready
            setSubscriptionReady serialize(_.pick(subscription, ['connection', 'name', 'args'])), true
        return
      )


    Offline.Collection = OfflineCollection

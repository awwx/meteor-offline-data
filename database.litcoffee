    return unless Offline.persistent


    DATABASE_NAME = 'awwx/offline-data'
    DATABASE_VERSION = '8'


The global environment is `window` in a regular web page, but `self`
in a shared web worker.

    global = this


    sqlRows = (sqlResultSet) ->
      array = []
      r = sqlResultSet.rows
      for i in [0 ... r.length]
        array.push(r.item(i))
      return array


    placeholders = (array) ->
      _.map(array, -> "?").join(",")


    now = -> new Date().getTime()


    andthen = (result, fns...) ->
      while fns.length > 0
        fn = fns.shift()
        do (fn) =>
          result = result.then((args...) => fn(args...))
      return result


    begin = (description, steps...) ->
      Context.withContext description, =>
        andthen(Result.completed(), steps...)


    # begin = (description, steps...) ->
    #   Context.withContext description, ->
    #     Result.sequence(null, steps)


    class SQLStore

      constructor: ->
        @databaseOpen = new Result()


      implementation: 'SQL'


      processTransaction: (fn, runtx) ->
        unless _.isFunction(fn)
          throw new Error('fn should be a function')

        txDone = new Result()
        inTxResult = new Result()

        runtx(
          Errors.bind((tx) =>
            Context.withContext('SQL transaction', => fn(tx))
            .into(inTxResult)
            return
          ),
          # TODO more bind, report error
          ((error) =>
            Errors.reportError(error)
            txDone.fail()
            return
          ),
          (=>
            txDone.complete()
            return
          )
        )

        result = new Result()
        Result.join([inTxResult, txDone])
        .onSuccess(([inValue, txValue]) ->
          result.complete(inValue)
        )
        .onFailure(->
          result.fail()
        )
        return result

      _transaction: (fn) ->
        @processTransaction(fn, (withTx, onError, onSuccess) =>
          @sqldb.transaction(withTx, onError, onSuccess)
        )

      transaction: (fn) ->
        @databaseOpen.then(=>
          @_transaction(fn)
        )

      changeVersion: (newVersion, fn) ->
        @processTransaction(fn, (withTx, onError, onSuccess) =>
          @sqldb.changeVersion(@sqldb.version, newVersion, withTx, onError, onSuccess)
        )


TODO do any browsers pay attention to the size argument?

      openDatabase: (options = {}) ->
        Context.withContext 'open SQL database', =>
          @sqldb = global.openDatabase(DATABASE_NAME, '', '', 1024 * 1024)
          return


      sql: (tx, sqlStatement, args) ->
        Context.withContext "execute SQL statement: #{sqlStatement}", =>
          result = new Result()
          tx.executeSql(
            sqlStatement,
            args,
            Errors.bind((tx, sqlResultSet) ->
              result.complete(sqlRows(sqlResultSet))
              return
            ),
            Errors.bind((tx, sqlError) ->
              Errors.reportError sqlError
              result.fail()
              return
            )
          )
          return result


      listTables: (tx) ->
        begin "listTables",
          (=> @sql(tx,
            """
              SELECT * FROM sqlite_master
                WHERE type="table" AND
                      name NOT LIKE "!_%" ESCAPE "!" AND
                      name NOT LIKE "sqlite!_%" ESCAPE "!"
            """
          )),
          ((tables) =>
            return (table.name for table in tables).sort()
          )


      dropTable: (tx, tableName) ->
        begin "dropTable #{tableName}",
          (=> @sql(tx, "DROP TABLE #{tableName}"))


      dropAllTables: (tx) ->
        begin "dropAllTables",
          (=> @listTables(tx)),
          ((names) =>
            Result.join(@dropTable(tx, name) for name in names)
          ),
          (=>)


      eraseDatabase: ->
        begin "eraseDatabase",
          (=>
            @openDatabase()
            @changeVersion('', (tx) =>
              @dropAllTables(tx)
            )
          )

      createTables: (tx) ->
        begin "createTables", =>
          Result.join([
            @sql(tx, """
              CREATE TABLE windows (
                windowId TEXT PRIMARY KEY NOT NULL,
                updateId INTEGER NOT NULL
              )
            """),

            @sql(tx, """
              CREATE TABLE agentWindow (
                singleton INTEGER PRIMARY KEY NOT NULL,
                windowId TEXT NOT NULL
              )
            """)

            @sql(tx, """
              CREATE TABLE docs (
                connection TEXT NOT NULL,
                collectionName TEXT NOT NULL,
                docId TEXT NOT NULL,
                doc TEXT NOT NULL,
                PRIMARY KEY (connection, collectionName, docId)
              )
            """)

            @sql(tx, """
              CREATE TABLE stubDocs (
                connection TEXT NOT NULL,
                methodId TEXT NOT NULL,
                collectionName TEXT NOT NULL,
                docId TEXT NOT NULL,
                PRIMARY KEY (connection, methodId, collectionName, docId)
              )
            """)

            @sql(tx, """
              CREATE TABLE queuedMethods (
                connection TEXT NOT NULL,
                methodId TEXT NOT NULL,
                method TEXT NOT NULL,
                PRIMARY KEY (connection, methodId)
              )
            """)

            @sql(tx, """
              CREATE TABLE windowSubscriptions (
                windowId TEXT NOT NULL,
                connection TEXT NOT NULL,
                subscription TEXT NOT NULL,
                PRIMARY KEY (windowId, connection, subscription)
              )
            """)

            @sql(tx, """
              CREATE TABLE subscriptions (
                connection TEXT NOT NULL,
                subscription TEXT NOT NULL,
                serverReady INTEGER NOT NULL,
                status TEXT NOT NULL,
                error TEXT NOT NULL,
                loaded INTEGER NOT NULL,
                PRIMARY KEY (connection, subscription)
              )
            """)

            @sql(tx, """
              CREATE TABLE methodsHoldingUpSubscriptions (
                connection TEXT NOT NULL,
                subscription TEXT NOT NULL,
                methodId TEXT NOT NULL,
                PRIMARY KEY (connection, subscription, methodId)
              )
            """)

            @sql(tx, """
              CREATE TABLE updates (
                id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                theUpdate TEXT NOT NULL
              )
            """)
          ])


      initializeNewDatabase: ->
        begin "initializeNewDatabase", =>
          @changeVersion(
            DATABASE_VERSION,
            ((tx) =>
              @createTables(tx)
            )
          )


      resetDatabase: ->
        begin "resetDatabase",
          (=> @eraseDatabase()),
          (=> @initializeNewDatabase())


      upgradeDatabaseIfNeeded: ->
        begin "upgradeDatabaseIfNeeded", =>
          if @sqldb.version is DATABASE_VERSION
            Result.completed()
          else
            @resetDatabase()


      open: ->
        begin "open", =>
          @openDatabase()
          @upgradeDatabaseIfNeeded().into(@databaseOpen)
          return @databaseOpen


      ensureWindow: (tx, windowId) ->
        begin "ensureWindow",
          (=> @highestUpdateId(tx)),
          ((updateId) =>
            @sql(tx,
              """
                INSERT OR IGNORE INTO windows (windowId, updateId)
                  VALUES (?, ?)
              """,
              [windowId, updateId]
            )
          )


      readAllWindowIds: (tx) ->
        begin "readKnownWindowIds",
          (=> @sql(tx,
            """
              SELECT windowId FROM windows UNION
              SELECT windowId FROM windowSubscriptions UNION
              SELECT windowId FROM agentWindow
            """
          )),
          ((rows) ->
            row.windowId for row in rows
          )


      deleteWindows: (tx, windowIds) ->
        begin "deleteWindows",
          (=> @sql(tx,
            """
               DELETE FROM windows
                 WHERE windowId IN (#{placeholders(windowIds)})
            """,
            windowIds
          )),
          (=> @sql(tx,
            """
              DELETE FROM windowSubscriptions
                WHERE windowId IN (#{placeholders(windowIds)})
            """,
            windowIds
          )),
          (=> @sql(tx,
            """
              DELETE FROM agentWindow
                WHERE windowId IN (#{placeholders(windowIds)})
            """,
            windowIds
          ))


      readAgentWindow: (tx) ->
        begin "readAgentWindow",
          (=>
            @sql(tx,
              """
                SELECT windowId FROM agentWindow
              """
            )
          ),
          ((rows) =>
            if rows.length is 0
              return null
            else if rows.length is 1
              return rows[0].windowId
            else
              Errors.reportError(
                'agentWindow table does not contain a singleton row'
              )
              return Result.failed()
          )


      writeAgentWindow: (tx, windowId) ->
        begin "writeAgentWindow",
          (=> @sql(tx,
            """
              INSERT OR REPLACE INTO agentWindow
                (singleton, windowId) VALUES (0, ?)
            """,
            [windowId]
          ))


Documents are a mirror of the server collection plus local
modifications made by stubs.

Write a document in the database.

      writeDoc: (tx, connection, collectionName, doc) ->
        begin "writeDoc",
          (=> @sql(tx,
            """
              INSERT OR REPLACE INTO docs
                (connection, collectionName, docId, doc)
                VALUES (?, ?, ?, ?)
            """,
            [connection, collectionName, doc._id, EJSON.stringify(doc)]
          ))


Read all documents belonging to `connection`.  Returns a mapping
`collectionName -> docId -> doc`.

      readDocs: (tx, connection) ->
        begin "readDocs",
          (=> @sql(tx,
            """
              SELECT collectionName, doc FROM docs WHERE connection=?
            """,
            [connection]
          )),
          ((rows) =>
            output = {}
            for row in rows
              doc = EJSON.parse(row.doc)
              Meteor._ensure(
                output,
                row.collectionName
              )[doc._id] = doc
            return output
          )


Return the document ids of all documents belonging to a collection.

      readDocIdsOfCollection: (tx, connection, collectionName) ->
        begin 'readDocIdsOfCollection',
          (=> @sql(tx,
            """
              SELECT docId FROM docs
                WHERE connection = ? AND
                      collectionName = ?
            """,
            [connection, collectionName]
          )),
          ((rows) =>
            _.map(rows, (row) -> row.docId)
          )


      deleteDoc: (tx, connection, collectionName, docId) ->
        begin "deleteDoc",
          (=> @sql(tx,
            """
              DELETE FROM docs
                WHERE connection=? AND
                      collectionName=? AND
                      docID=?
            """,
            [connection, collectionName, docId]
          ))


Documents written by a method stub.  Cleared once the method call
completes.

      addDocumentWrittenByStub: (
        tx,
        connection,
        methodId,
        collectionName,
        docId
      ) ->
        begin "addDocumentWrittenByStub",
          (=> @sql(tx,
            """
              INSERT INTO stubDocs
                (connection, methodId, collectionName, docId)
                VALUES (?, ?, ?, ?)
            """,
            [connection, methodId, collectionName, docId]
          ))


      isDocumentWrittenByAnyStub: (
        tx,
        connection,
        collectionName,
        docId
      ) ->
        begin "isDocumentWrittenByAnyStub",
          (=> @sql(tx,
            """
              SELECT 1 FROM stubDocs
                WHERE connection=? AND
                      collectionName=? AND
                      docID=?
                LIMIT 1
            """,
            [connection, collectionName, docId]
          )),
          ((rows) =>
            return rows.length > 0
          )


      readDocsWrittenByStub: (tx, connection, methodId) ->
        begin "readDocsWrittenByStub",
          (=> @sql(tx,
            """
              SELECT collectionName, docId FROM stubDocs
                WHERE connection=? AND
                      methodId=?
            """,
            [connection, methodId]
          ))


      removeDocumentsWrittenByStub: (tx, connection, methodId) ->
        begin "removeDocumentsWrittenByStub",
          (=> @sql(tx,
            """
              DELETE FROM stubDocs
                WHERE connection=? AND
                      methodId=?
            """,
            [connection, methodId]
          ))


      readMethodsWithDocsWritten: (tx, connection) ->
        begin "readMethodsWithDocsWritten",
          (=> @sql(tx,
            """
              SELECT DISTINCT methodId FROM stubDocs
                WHERE connection=?
                ORDER BY methodId
            """,
            [connection]
          )),
          ((rows) =>
            return (row.methodId for row in rows)
          )


Queued methods are method calls made from the client to the server.
They are removed once they have been acknowledged by the server.

      addQueuedMethod: (
        tx,
        connection,
        methodId,
        name,
        args
      ) ->
        begin "addQueuedMethod",
          (=>
            method = stringify({name, args})
            @sql(tx,
              """
                INSERT INTO queuedMethods
                  (connection, methodId, method)
                  VALUES (?, ?, ?)
              """,
              [connection, methodId, method]
            )
          )


Read all queued methods across all connections.

      readQueuedMethods: (tx) ->
        begin "readQueuedMethods",
          (=> @sql(tx,
            """
              SELECT connection, methodId, method FROM queuedMethods
            """
          )),
          ((rows) =>
            output = []
            for row in rows
              {name, args} = EJSON.parse(row.method)
              output.push({
                connection: row.connection,
                methodId: row.methodId,
                name: name,
                args: args
              })
            return output
          )


      removeQueuedMethod: (tx, connection, methodId) ->
        begin "removedQueuedMethod",
          (=> @sql(tx,
            """
               DELETE FROM queuedMethods
                 WHERE connection=? AND
                       methodId=?
            """,
            [connection, methodId]
          ))

      addWindowSubscription: (
        tx,
        windowId,
        connection,
        name,
        args
      ) ->
        begin "addWindowSubscription",
          (=>
            subscription = stringify({name, args})
            @sql(tx,
              """
                INSERT OR IGNORE INTO windowSubscriptions
                  (windowId, connection, subscription)
                  VALUES (?, ?, ?)
              """,
              [windowId, connection, subscription]
            )
          )


      setWindowSubscriptions: (tx, windowId, connection, subscriptions) ->
        begin "setWindowSubscriptions",
          (=>
            @sql(tx,
              """
                DELETE FROM windowSubscriptions
                  WHERE windowId = ? AND connection = ?
              """,
              [windowId, connection]
            )
          ),
          (=>
            Result.map(
              subscriptions,
              ((subscription) =>
                serialized = stringify({
                  name: subscription[0]
                  args: subscription[1..]
                })
                @sql(tx,
                  """
                    INSERT INTO windowSubscriptions
                      (windowId, connection, subscription)
                      VALUES (?, ?, ?)
                  """,
                  [windowId, connection, serialized]
                )
              )
            )
          )


      _testReadWindowSubscriptions: (tx) ->
        begin "_testReadWindowSubscriptions",
          (=> @sql(tx, """
            SELECT windowId, connection, subscription
              FROM windowSubscriptions
              ORDER BY windowId, connection, subscription
          """)),
          ((rows) ->
            output = []
            for row in rows
              {name, args} = EJSON.parse(row.subscription)
              output.push {
                windowId: row.windowId,
                connection: row.connection,
                name: name,
                args: args
              }
            return output
          )


      readMergedSubscriptions: (tx) ->
        begin "readMergedSubscriptions",
          (=> @sql(tx, """
            SELECT DISTINCT connection, subscription
              FROM windowSubscriptions
              ORDER BY connection, subscription
          """)),
          ((rows) =>
            output = []
            for row in rows
              {name, args} = EJSON.parse(row.subscription)
              output.push {
                connection: row.connection,
                name: name,
                args: args
              }
            return output
          )


      removeWindowSubscription: (
        tx,
        windowId,
        connection,
        name,
        args
      ) ->
        begin "removeWindowSubscription",
          (=>
            subscription = stringify({name, args})
            @sql(tx, """
              DELETE FROM windowSubscriptions
                WHERE windowId=? AND
                      connection=? AND
                      subscription=?
            """,
            [windowId, connection, subscription])
          )

      ensureSubscription: (tx, connection, name, args) ->
        begin "ensureSubscription",
          (=>
            subscription = stringify({name, args})
            @sql(tx,
              """
                INSERT OR IGNORE INTO subscriptions
                  (connection, subscription, serverReady, loaded, status, error)
                  VALUES (?, ?, 0, 0, 'subscribing', '')
              """,
              [connection, subscription]
            )
          )


      initializeSubscriptions: (tx) ->
        begin "initializeSubscriptions",
          (=>
            @sql(tx,
              """
                UPDATE subscriptions
                  SET serverReady = 0,
                      status = 'unsubscribed',
                      error = ''
              """
            )
          )


      removeSubscription: (tx, connection, name, args) ->
        begin "removeSubscription",
          (=>
            subscription = stringify({name, args})
            @sql(tx,
              """
                DELETE FROM subscriptions
                  WHERE connection = ? AND
                        subscription = ?
              """,
              [connection, subscription]
            )
          )


      cleanSubscriptions: (tx) ->
        begin "cleanSubscriptions",
          (=>
            Result.join([
              @readMergedSubscriptions(tx)
              @readSubscriptions(tx)
            ])
          ),
          (([mergedSubscriptions, subscriptions]) =>
            toDelete = []
            for {connection, name, args} in subscriptions
              unless contains(mergedSubscriptions, {connection, name, args})
                toDelete.push {connection, name, args}
            # TODO Result.map
            writes = []
            for {connection, name, args} in toDelete
              writes.push @removeSubscription tx, connection, name, args
            Result.join(writes)
            .then(=> toDelete)
          )


      _loadSubscription: (row) ->
        {name, args} = EJSON.parse(row.subscription)
        o = {
          connection: row.connection
          name
          args
          serverReady: row.serverReady is 1
          status: row.status
          loaded: row.loaded is 1
        }
        o.error = EJSON.parse(row.error) if row.error isnt ''
        return o


      readSubscription: (tx, connection, name, args) ->
        begin "readSubscription",
          (=>
            subscription = stringify({name, args})
            @sql(tx,
              """
                SELECT connection, subscription, serverReady, status,
                       error, loaded
                  FROM subscriptions
                  WHERE connection=? AND subscription=?
              """,
              [connection, subscription]
            )
          ),
          ((rows) =>
            if rows.length is 0
              null
            else
              @_loadSubscription(rows[0])
          )

      readSubscriptions: (tx) ->
        begin "readSubscriptions",
          (=> @sql(tx, """
            SELECT connection, subscription, serverReady, status,
                   error, loaded
              FROM subscriptions
              ORDER BY connection, subscription
          """)),
          ((rows) =>
            _.map(rows, @_loadSubscription)
          )


      haveSubscription: (tx, connection, name, args) ->
        begin "haveSubscription",
          (=>
            subscription = stringify({name, args})
            @sql(tx,
              """
                SELECT 1 FROM subscriptions
                  WHERE connection=? AND
                        subscription=?
              """,
              [connection, subscription]
            )
          ),
          ((rows) ->
            return rows.length > 0
          )


      setSubscriptionServerReady: (tx, connection, name, args) ->
        begin "setSubscriptionServerReady",
          (=>
            subscription = stringify({name, args})
            @sql(tx,
              """
                UPDATE subscriptions SET serverReady = 1
                  WHERE connection=? AND
                        subscription=?
              """,
              [connection, subscription]
            )
          )


      setSubscriptionStatus: (tx, connection, name, args, status) ->
        begin "setSubscriptionStatus",
          (=>
            subscription = stringify({name, args})
            @sql(tx,
              """
                UPDATE subscriptions SET status=?
                  WHERE connection=? AND
                        subscription=?
              """,
              [status, connection, subscription]
            )
          )


      setSubscriptionReady: (tx, connection, name, args) ->
        begin "setSubscriptionReady",
          (=>
            subscription = stringify({name, args})
            @sql(tx,
              """
                UPDATE subscriptions SET status = 'ready', loaded = 1
                  WHERE connection = ? AND subscription = ?
              """,
              [connection, subscription]
            )
          )


      setSubscriptionError: (tx, connection, name, args, error) ->
        begin "setSubscriptionError",
          (=>
            subscription = stringify({name, args})
            @sql(tx,
              """
                UPDATE subscriptions
                  SET serverReady = 0, status = 'error', error = ?, loaded = 0
                  WHERE connection = ? AND
                        subscription = ?
              """,
              [EJSON.stringify(error), connection, subscription]
            )
          )


      setSubscriptionLoaded: (tx, connection, name, args) ->
        begin "setSubscriptionLoaded",
          (=>
            subscription = stringify({name, args})
            @sql(tx,
              """
                UPDATE subscriptions SET loaded = 1
                  WHERE connection=? AND
                        subscription=?
              """,
              [connection, subscription]
            )
          )


      _testReadMethodsHoldingUpSubscriptions: (tx) ->
        begin "_testReadMethodsHoldingUpSubscriptions",
          (=> @sql(tx, """
            SELECT connection, subscription, methodId
              FROM methodsHoldingUpSubscriptions
              ORDER BY connection, subscription, methodId
          """)),
          ((rows) =>
            output = []
            for row in rows
              {name, args} = EJSON.parse(row.subscription)
              output.push {
                connection: row.connection,
                name,
                args,
                methodId: row.methodId
              }
            return output
          )


      readSubscriptionsHeldUp: (tx) ->
        begin "readSubscriptionsHeldUp",
          (=> @sql(tx, """
            SELECT DISTINCT connection, subscription
              FROM methodsHoldingUpSubscriptions
              ORDER BY connection, subscription
          """)),
          ((rows) =>
            output = []
            for row in rows
              {name, args} = EJSON.parse(row.subscription)
              output.push {connection: row.connection, name, args}
            return output
          )


      addSubscriptionWaitingOnMethods: (
        tx,
        connection,
        name,
        args,
        methodIds
      ) ->
        begin "addSubscriptionWaitingOnMethods",
          (=>
            subscription = stringify({name, args})
            # TODO Result.map
            writes = []
            for methodId in methodIds
              do (methodId) =>
                writes.push(
                  @sql(tx,
                    """
                      INSERT OR IGNORE INTO methodsHoldingUpSubscriptions
                        (connection, subscription, methodId)
                        VALUES (?, ?, ?)
                    """,
                    [connection, subscription, methodId]
                  )
                )
            return Result.join(writes)
          )


      removeMethodHoldingUpSubscriptions: (tx, methodId) ->
        begin "removeMethodHoldingUpSubscriptions",
          (=> @sql(tx,
            """
              DELETE FROM methodsHoldingUpSubscriptions
                WHERE methodId=?
            """,
            [methodId]
          ))


      addUpdate: (tx, update) ->
        begin "addUpdate",
          (=>
            serialized = EJSON.stringify(update)
            @sql(tx,
              """
                INSERT INTO updates (theUpdate) VALUES (?)
              """,
              [serialized]
            )
          )


      _loadUpdates: (rows) ->
        output = []
        for row in rows
          output.push {id: row.id, update: EJSON.parse(row.theUpdate)}
        return output


      _testReadUpdates: (tx) ->
        begin "_testReadUpdates",
          (=> @sql(tx, """
             SELECT id, theUpdate FROM updates ORDER BY id
          """)),
          ((rows) =>
            return @_loadUpdates(rows)
          )


      highestUpdateId: (tx) ->
        begin "highestUpdateId",
          (=> @sql(tx, """
              SELECT MAX(id) AS id FROM updates
          """)),
          ((rows) =>
            return rows[0].id ? 0
          )


      writeWindowUpdateIndex: (tx, windowId, updateId) ->
        begin "writeWindowUpdateIndex",
          (=> @sql(tx,
            """
              UPDATE windows SET updateId = ?
                WHERE windowId = ?
            """
            [updateId, windowId]
          ))


      initializeWindowUpdateIndex: (tx, windowId) ->
        begin "initializeWindowUpdateIndex",
          (=> @highestUpdateId(tx)),
          ((updateId) =>
            @writeWindowUpdateIndex(tx, windowId, updateId)
          )


      _testReadWindows: (tx) ->
        begin "_testReadWindows",
          (=> @sql(tx, """
            SELECT windowId, updateId FROM windows
              ORDER BY windowId
          """))


      removeUpdatesProcessedByAllWindows: (tx) ->
        begin "removeUpdatesProcessedByAllWindows",
          (=> @sql(tx, """
              SELECT MIN(updateId) AS minUpdateId FROM windows
          """)),
          ((rows) =>
            minUpdateId = rows[0]?.minUpdateId ? 0
            @sql(tx,
              """
                DELETE FROM updates WHERE id <= ?
              """,
              [minUpdateId]
            )
          )


      pullUpdatesForWindow: (tx, windowId) ->
        updates = null
        begin "pullUpdatesForWindow",
          (=>
            @sql(tx,
              """
                SELECT updateId FROM windows WHERE windowId=?
              """,
              [windowId]
            )
          ),
          ((rows) =>
            updateId = rows[0]?.updateId ? 0
            @sql(tx,
              """
                SELECT theUpdate FROM updates WHERE id > ?
              """,
              [updateId]
            )
          ),
          ((rows) =>
            updates = (update.update for update in @_loadUpdates(rows))
            @initializeWindowUpdateIndex(tx, windowId)
          ),
          (=>
            return updates
          )


    store = new SQLStore()
    Offline._SQLStore = SQLStore
    Offline._database = store
    Offline._databaseName = DATABASE_NAME
    Offline._databaseVersion = DATABASE_VERSION
    Offline.resetDatabase = ->
      store.resetDatabase()

    Meteor.startup ->
      return if Offline._disableStartupForTesting or not Offline.persistent
      store.open()
      return

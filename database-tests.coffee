Result = awwx.Result
{beginTest, withTx} = Offline._test
Context = awwx.Context
{contains} = awwx

newDB = -> new Offline._SQLStore()

expectedTables = [
  'agentWindow'
  'docs'
  'methodsHoldingUpSubscriptions'
  'queuedMethods'
  'stubDocs'
  'subscriptions'
  'updates'
  'windowSubscriptions'
  'windows'
]


Tinytest.addAsync "database - erase database", (test, onComplete) ->
  db = newDB()
  db.eraseDatabase()
  .then(->
    db._transaction((tx) -> db.listTables(tx))
  )
  .then((tables) ->
    test.equal db.sqldb.version, ''
    test.equal tables, []
    onComplete()
  )

Tinytest.addAsync "database - add table", (test, onComplete) ->
  db = newDB()
  db.eraseDatabase()
  .then(->
    db._transaction((tx) ->
      db.sql(tx, "CREATE TABLE abc (x int)")
    )
  )
  .then(->
    db._transaction((tx) -> db.listTables(tx))
  )
  .then((tables) ->
    test.equal tables, ['abc']
    onComplete()
  )

Tinytest.addAsync "database - open", (test, onComplete) ->
  db = newDB()
  db.eraseDatabase()
  .then(-> db.open())
  .then(->
    test.equal db.sqldb.version, Offline._databaseVersion
    onComplete()
  )

Tinytest.addAsync "database - unknown database version erased", (test, onComplete) ->
  db = newDB()
  db.eraseDatabase()
  .then(->
    db.changeVersion('foreign version', (tx) ->
      db.sql(tx, "CREATE TABLE oceanWaves (x int)")
    )
  )
  .then(->
    db._transaction((tx) -> db.listTables(tx))
  )
  .then((tables) ->
    test.equal tables, ['oceanWaves']
    db.open()
  )
  .then(->
    test.equal db.sqldb.version, Offline._databaseVersion
    db.transaction((tx) -> db.listTables(tx))
  )
  .then((tables) ->
    test.equal tables, expectedTables
    onComplete()
  )


Tinytest.addAsync "database - agent window", (test, onComplete) ->
  db = newDB()
  db.eraseDatabase()
  .then(->
    db.open()
    db.transaction((tx) ->
      db.readAgentWindow(tx)
    )
  )
  .then((windowId) ->
    test.equal windowId, null

    db.transaction((tx) ->
      db.writeAgentWindow(tx, 'abc')
    )
  )
  .then(->
    db.transaction((tx) ->
      db.readAgentWindow(tx)
    )
  )
  .then((windowId) ->
    test.equal windowId, 'abc'

    db.transaction((tx) ->
      db.writeAgentWindow(tx, 'def')
    )
  )
  .then(->
    db.transaction((tx) ->
      db.readAgentWindow(tx)
    )
  )
  .then((windowId) ->
    test.equal windowId, 'def'

    onComplete()
  )


Tinytest.addAsync "database - docs", (test, onComplete) ->
  db = newDB()
  db.eraseDatabase()
  .then(->
    db.open()

    db.transaction((tx) ->
      Result.join([
        db.writeDoc(tx, '/', 'lists', {_id: 'x7g6', name: 'one'})
        db.writeDoc(tx,
          'madewith.meteor.com',
          'madewith_apps',
          {_id: 'ky65', name: 'example.com', vote_count: 1067}
        )
      ])
    )
  )
  .then(->
    db.transaction((tx) -> db.readDocs(tx, '/'))
  )
  .then((docs) ->
    test.equal docs, {lists: {x7g6: {_id: 'x7g6', name: 'one'}}}

    db.transaction((tx) -> db.readDocs(tx, 'madewith.meteor.com'))
  )
  .then((docs) ->
    test.equal(
      docs,
      {
        madewith_apps: {
          ky65: {_id: 'ky65', name: 'example.com', vote_count: 1067}
        }
      }
    )

    db.transaction((tx) ->
      db.deleteDoc(tx, '/', 'lists', 'x7g6')
    )
  )
  .then(->
    db.transaction((tx) -> db.readDocs(tx, '/'))
  )
  .then((docs) ->
    test.equal docs, {}

    onComplete()
  )


threeDocumentsWrittenByStubs = (db) ->
  withTx db, (tx) ->
    Result.join([
      db.addDocumentWrittenByStub(tx, '/', 'a8ek', 'lists', 'x7g6')
      db.addDocumentWrittenByStub(tx, '/', 'a8ek', 'lists', 'm88m')
      db.addDocumentWrittenByStub(tx, '/', 'yrtc', 'lists', 'x7g6')
    ])

Tinytest.addAsync "database - isDocumentWrittenByAnyStub", (test, onComplete) ->
  beginTest()
  .then((db) ->
    threeDocumentsWrittenByStubs(db)
    .then(->
      withTx(db,
        ((tx) -> db.isDocumentWrittenByAnyStub(tx, '/', 'lists', 'x7g6')),
        ((wasWritten) ->
          test.isTrue wasWritten
        )
      )
    )
    .then(->
      withTx(db,
        ((tx) -> db.isDocumentWrittenByAnyStub(tx, '/', 'lists', 'qpwq')),
        ((wasWritten) -> test.isFalse wasWritten)
      )
    )
    .then(->
      onComplete()
    )
  )


Tinytest.addAsync "database - removeDocumentsWrittenByStub", (test, onComplete) ->
  beginTest()
  .then((db) ->
    threeDocumentsWrittenByStubs(db)
    .then(->
      withTx(db, (tx) -> db.removeDocumentsWrittenByStub(tx, '/', 'a8ek'))
    )
    .then(->
      withTx(db,
        ((tx) -> db.isDocumentWrittenByAnyStub(tx, '/', 'lists', 'm88m'))
        ((wasWritten) -> test.isFalse wasWritten)
      )
    )
    .then(->
      onComplete()
    )
  )


Tinytest.addAsync "database - readMethodsWithDocsWritten", (test, onComplete) ->
  beginTest()
  .then((db) ->
    threeDocumentsWrittenByStubs(db)
    .then(->
      withTx(db,
        ((tx) -> db.readMethodsWithDocsWritten(tx, '/'))
        ((methods) ->
          test.equal methods, ['a8ek', 'yrtc']
        )
      )
    )
    .then(->
      onComplete()
    )
  )


Tinytest.addAsync "database - readQueuedMethods", (test, onComplete) ->
  beginTest()
  .then((db) ->
    withTx(db, (tx) -> db.addQueuedMethod(tx, '/', '5y77', "ping", [9, 7]))
    .then(->
      withTx(db,
        ((tx) -> db.readQueuedMethods(tx)),
        ((methods) ->
          test.equal methods, [
            {
              connection: '/',
              methodId: '5y77',
              name: 'ping',
              args: [9, 7]
            }
          ]
        )
      )
    )
    .then(->
      onComplete()
    )
  )


Tinytest.addAsync "database - removeQueuedMethod", (test, onComplete) ->
  beginTest()
  .then((db) ->
    withTx(db, (tx) ->
      Result.join([
        db.addQueuedMethod(tx, '/', '5y77', "ping", [9, 7]),
        db.addQueuedMethod(tx, '/', '99kk', "incr", [])
      ])
    )
    .then(->
      withTx(db, (tx) -> db.removeQueuedMethod(tx, '/', '5y77'))
    )
    .then(->
      withTx(db,
        ((tx) -> db.readQueuedMethods(tx)),
        ((methods) ->
          test.equal methods, [
            {connection: '/', methodId: '99kk', name: 'incr', args: []}
          ]
        )
      )
    )
    .then(->
      onComplete()
    )
  )


Tinytest.addAsync "database - addWindowSubscription", (test, onComplete) ->
  beginTest()
  .then((db) ->
    withTx(db, (tx) ->
      db.addWindowSubscription(tx, 'window1', '/', 'tasks', ['mq22'])
    )
    .then(->
      withTx(db,
        ((tx) -> db._testReadWindowSubscriptions(tx)),
        ((subscriptions) ->
          test.equal subscriptions, [{
            windowId: 'window1',
            connection: '/',
            name: 'tasks',
            args: ['mq22']
          }]
        )
      )
    )
    .then(-> onComplete())
  )


fourWindowSubscriptions = (db) ->
  withTx(db, (tx) ->
    Result.join([
      db.addWindowSubscription(tx, 'window1', '/', 'tasks', ['mq22']),
      db.addWindowSubscription(tx, 'window1', '/', 'projects', []),
      db.addWindowSubscription(tx, 'window2', '/', 'tasks', ['mq22']),
      db.addWindowSubscription(tx, 'window3', '/', 'tasks', ['ax9q'])
    ])
  )

# first and third subscriptions are merged

Tinytest.addAsync "database - readMergedSubscriptions", (test, onComplete) ->
  beginTest()
  .then((db) ->
    fourWindowSubscriptions(db)
    .then(->
      withTx(db,
        ((tx) -> db.readMergedSubscriptions(tx))
        ((subscriptions) ->
          test.equal subscriptions, [
            {connection: '/', name: 'tasks', args: ['ax9q']},
            {connection: '/', name: 'tasks', args: ['mq22']},
            {connection: '/', name: 'projects', args: []}
          ]
        )
      )
    )
    .then(-> onComplete())
  )


Tinytest.addAsync "database - removeWindowSubscription", (test, onComplete) ->
  beginTest().then((db) ->
    fourWindowSubscriptions(db)
    .then(->
      withTx(db, (tx) ->
        db.removeWindowSubscription(tx, 'window1', '/', 'tasks', ['mq22'])
      )
    )
    .then(->
      withTx(db,
        ((tx) -> db._testReadWindowSubscriptions(tx))
        ((subscriptions) ->
          test.equal subscriptions, [
            {windowId: 'window1', connection: '/', name: 'projects', args: []},
            {windowId: 'window2', connection: '/', name: 'tasks', args: ['mq22']},
            {windowId: 'window3', connection: '/', name: 'tasks', args: ['ax9q']}
          ]
        )
      )
    )
    .then(-> onComplete())
  )


Tinytest.addAsync "database - deleteWindows with subscriptions", (test, onComplete) ->
  beginTest().then((db) ->
    fourWindowSubscriptions(db)
    .then(->
      withTx(db, (tx) ->
        db.deleteWindows(tx, ['window1', 'window3'])
      )
    )
    .then(->
      withTx(db,
        ((tx) -> db._testReadWindowSubscriptions(tx))
        ((subscriptions) ->
          test.equal subscriptions, [
            {windowId: 'window2', connection: '/', name: 'tasks', args: ['mq22']},
          ]
        )
      )
    )
    .then(-> onComplete())
  )


Tinytest.addAsync "database - ensureSubscription", (test, onComplete) ->
  beginTest().then((db) ->
    withTx(db, (tx) ->
      db.ensureSubscription(tx, '/', 'tasks', ['mq22'])
    )
    .then(->
      withTx(db,
        ((tx) -> db.readSubscriptions(tx)),
        ((subscriptions) ->
          test.equal subscriptions, [{
            connection: '/',
            name: 'tasks',
            args: ['mq22'],
            readyFromServer: false,
            ready: false
          }]
        )
      )
    )
    .then(-> onComplete())
  )


Tinytest.addAsync "database - haveSubscription", (test, onComplete) ->
  beginTest().then((db) ->
    withTx(db, (tx) ->
      db.ensureSubscription(tx, '/', 'tasks', ['mq22'])
      db.ensureSubscription(tx, '/', 'lists', [])
    )
    .then(->
      withTx(db,
        ((tx) -> db.haveSubscription(tx, '/', 'tasks', ['x', 'y']))
        ((exists) ->
          test.isFalse exists
        )
      )
    )
    .then(->
      withTx(db,
        ((tx) -> db.haveSubscription(tx, '/', 'tasks', ['mq22']))
        ((exists) ->
          test.isTrue exists
        )
      )
    )
    .then(-> onComplete())
  )


Tinytest.addAsync "database - setSubscriptionReadyFromServer", (test, onComplete) ->
  beginTest().then((db) ->
    withTx(db, (tx) ->
      db.ensureSubscription(tx, '/', 'lists', [])
    )
    .then(->
      withTx(db,
        ((tx) -> db.setSubscriptionReadyFromServer(tx, '/', 'lists', []))
      )
    )
    .then(->
      withTx(db,
        ((tx) -> db.readSubscriptions(tx)),
        ((subscriptions) ->
          test.equal subscriptions, [
            {
              connection: '/',
              name: 'lists',
              args: [],
              readyFromServer: true,
              ready: false
            }
          ]
        )
      )
    )
    .then(-> onComplete())
  )


Tinytest.addAsync "database - setSubscriptionReady", (test, onComplete) ->
  beginTest().then((db) ->
    withTx(db, (tx) ->
      db.ensureSubscription(tx, '/', 'lists', [])
    )
    .then(->
      withTx(db,
        ((tx) -> db.setSubscriptionReady(tx, '/', 'lists', []))
      )
    )
    .then(->
      withTx(db,
        ((tx) -> db.readSubscriptions(tx)),
        ((subscriptions) ->
          test.equal subscriptions, [
            {
              connection: '/',
              name: 'lists',
              args: [],
              readyFromServer: false,
              ready: true
            }
          ]
        )
      )
    )
    .then(-> onComplete())
  )


Tinytest.addAsync "database - addSubscriptionWaitingOnMethods", (test, onComplete) ->
  beginTest().then((db) ->
    withTx(db, (tx) ->
      db.addSubscriptionWaitingOnMethods(
        tx, '/', 'lists', [], ['abc', 'def', 'ghi']
      )
    )
    .then(->
      withTx(db,
        ((tx) -> db._testReadMethodsHoldingUpSubscriptions(tx)),
        ((methods) ->
          test.equal methods, [
            {connection: '/', name: 'lists', args: [], methodId: 'abc'},
            {connection: '/', name: 'lists', args: [], methodId: 'def'},
            {connection: '/', name: 'lists', args: [], methodId: 'ghi'}
          ]
        )
      )
    )
    .then(-> onComplete())
  )


Tinytest.addAsync "database - readSubscriptionsHeldUp", (test, onComplete) ->
  beginTest().then((db) ->
    withTx(db, (tx) ->
      db.addSubscriptionWaitingOnMethods(tx, '/', 'lists', [], ['abc', 'def'])
    )
    .then(->
      withTx(db,
        ((tx) -> db.readSubscriptionsHeldUp(tx)),
        ((subscriptions) ->
          test.equal subscriptions, [{connection: '/', name: 'lists', args: []}]
        )
      )
    )
    .then(-> onComplete())
  )

Tinytest.addAsync "database - removeMethodHoldingUpSubscriptions", (test, onComplete) ->
  beginTest().then((db) ->
    withTx(db, (tx) ->
      Result.join([
        db.addSubscriptionWaitingOnMethods(
          tx, '/', 'lists', [], ['abc', 'def', 'ghi']
        ),
        db.addSubscriptionWaitingOnMethods(
          tx, '/', 'tasks', ['yt4q'], ['def', 'jkl']
        )
      ])
    )
    .then(->
      withTx(db, (tx) ->
        db.removeMethodHoldingUpSubscriptions(
          tx, 'def'
        )
      )
    )
    .then(->
      withTx(db,
        ((tx) -> db._testReadMethodsHoldingUpSubscriptions(tx)),
        ((methods) ->
          test.equal methods, [
            {connection: '/', name: 'tasks', args: ['yt4q'], methodId: 'jkl'},
            {connection: '/', name: 'lists', args: [], methodId: 'abc'},
            {connection: '/', name: 'lists', args: [], methodId: 'ghi'}
          ]
        )
      )
    )
    .then(-> onComplete())
  )

firstInsertHasIdOne = (db, test) ->
  withTx(db, (tx) ->
    db.addUpdate(tx, {update: 'foo'})
  )
  .then(->
    withTx(db,
      ((tx) -> db._testReadUpdates(tx))
      ((updates) ->
        test.equal updates, [{id: 1, update: {update: 'foo'}}]
      )
    )
  )


Tinytest.addAsync "database - auto increment reset when table dropped", (test, onComplete) ->
  beginTest().then((db) ->
    firstInsertHasIdOne(db, test)
  )
  .then(->
    beginTest().then((db) ->
      firstInsertHasIdOne(db, test)
    )
  )
  .then(-> onComplete())


Tinytest.addAsync "database - highestUpdateId", (test, onComplete) ->
  beginTest().then((db) ->
    withTx(db, (tx) ->
      db.highestUpdateId(tx)
    )
    .then((id) ->
      test.equal id, 0
    )
    .then(->
      withTx(db, (tx) ->
        db.addUpdate(tx, {update: 'one'})
        .then(->
          db.addUpdate(tx, {update: 'two'})
        )
      )
    )
    .then(->
      withTx(db, (tx) ->
        db.highestUpdateId(tx)
      )
      .then((id) ->
        test.equal id, 2
      )
    )
    .then(-> onComplete())
  )


Tinytest.addAsync "database - initializeWindowUpdateIndex", (test, onComplete) ->
  beginTest().then((db) ->
    withTx(db, (tx) ->
      db.ensureWindow(tx, 'window1')
      .then(->
        db.initializeWindowUpdateIndex(tx, 'window1')
      )
    )
    .then(->
      withTx(db,
        ((tx) -> db._testReadWindows(tx)),
        ((indexes) ->
          test.equal indexes, [{windowId: 'window1', updateId: 0}]
        )
      )
    )
    .then(->
      withTx(db, (tx) -> db.addUpdate(tx, {update: 'one'}))
    )
    .then(->
      withTx(db, (tx) -> db.initializeWindowUpdateIndex(tx, 'window1'))
    )
    .then(->
      withTx(db,
        ((tx) -> db._testReadWindows(tx)),
        ((indexes) ->
          test.equal indexes, [{windowId: 'window1', updateId: 1}]
        )
      )
    )
    .then(-> onComplete())
  )

Tinytest.addAsync "database - removeUpdatesProcessedByAllWindows", (test, onComplete) ->
  beginTest().then((db) ->
    withTx(db, (tx) ->
      db.ensureWindow(tx, 'window1')
      .then(-> db.ensureWindow(tx, 'window2'))
      .then(-> db.addUpdate(tx, {update: 'one'}))
      .then(-> db.addUpdate(tx, {update: 'two'}))
      .then(-> db.initializeWindowUpdateIndex(tx, 'window1'))
      .then(-> db.addUpdate(tx, {update: 'three'}))
      .then(-> db.initializeWindowUpdateIndex(tx, 'window2'))
    )
    .then(->
      withTx(db, (tx) -> db.removeUpdatesProcessedByAllWindows(tx))
    )
    .then(->
      withTx(db,
        ((tx) -> db._testReadUpdates(tx))
        ((updates) ->
          test.equal updates, [{id: 3, update: {update: 'three'}}]
        )
      )
    )
    .then(-> onComplete())
  )


Tinytest.addAsync "database - pullUpdatesForWindow", (test, onComplete) ->
  beginTest().then((db) ->
    withTx(db, (tx) ->
      db.ensureWindow(tx, 'window1')
      .then(-> db.addUpdate(tx, {update: 'one'}))
      .then(-> db.addUpdate(tx, {update: 'two'}))
      .then(-> db.addUpdate(tx, {update: 'three'}))
    )
    .then(->
      withTx(db,
        ((tx) ->
          db.pullUpdatesForWindow(tx, 'window1')
          .then((updates) ->
            test.equal updates, [
              {update: 'one'}
              {update: 'two'}
              {update: 'three'}
            ]
          )
          .then(->
            db._testReadWindows(tx)
          )
          .then((windows) ->
            test.equal windows, [{windowId: 'window1', updateId: 3}]
          )
        )
      )
    )
    .then(-> onComplete())
  )


Tinytest.addAsync "database - cleanSubscriptions", (test, onComplete) ->
  beginTest()
  .then((db) ->
    withTx(db, (tx) ->
      db.addSubscriptionForWindow(tx, 'window1', '/', 'lists', [])
    )
    .then(->
      withTx(db, (tx) -> db.cleanSubscriptions(tx))
    )
    .then(->
      withTx(db, (tx) -> db.readSubscriptions(tx))
    )
    .then((subscriptions) ->
      test.equal subscriptions, [{
        connection: '/'
        name: 'lists'
        args: []
        readyFromServer: false
        ready: false
      }]
    )
    .then(->
      withTx(db, (tx) ->
        db.deleteWindows(tx, ['window1'])
      )
    )
    .then(->
      withTx(db, (tx) -> db.cleanSubscriptions(tx))
    )
    .then(->
      withTx(db, (tx) -> db.readSubscriptions(tx))
    )
    .then((subscriptions) ->
      test.equal subscriptions, []
    )
    .then(-> onComplete())
  )


Tinytest.addAsync "database - default database was not opened in testing", (test, onComplete) ->
  test.isFalse Offline._database.databaseOpen._done
  onComplete()

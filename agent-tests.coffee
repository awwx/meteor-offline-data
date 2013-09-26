{beginTest, withTx} = Offline._test


Tinytest.addAsync "offline data - updateSubscriptionsReady", (test, onComplete) ->
  beginTest()
  .then((db) ->
    withTx(db, (tx) ->
      db.ensureSubscription(tx, '/', 'lists', [])
      .then(->
        db.setSubscriptionServerReady(tx, '/', 'lists', [])
      )
      .then(->
        db.ensureSubscription(tx, '/', 'tasks', [])
      )
      .then(->
        db.setSubscriptionServerReady(tx, '/', 'tasks', [])
      )
      .then(->
        db.addSubscriptionWaitingOnMethods(tx, '/', 'tasks', [], ['abc'])
      )
    )
    .then(->
      withTx(db, (tx) ->
        Offline._test.updateSubscriptionsReady(tx, null)
      )
    )
    .then(->
      withTx(db, (tx) ->
        db.readSubscriptions(tx)
        .then((subscriptions) ->
          test.equal subscriptions, [
            {
              connection: '/'
              name: 'lists'
              args: []
              serverReady: true
              status: 'ready'
              loaded: true
            }
            {
              connection: '/'
              name: 'tasks'
              args: []
              serverReady: true
              status: 'subscribing'
              loaded: false
            }
          ]
        )
      )
    )
    .then(->
      withTx(db,
        ((tx) -> db._testReadUpdates(tx)),
        ((updates) ->
          test.equal updates[0].update, {
            update: 'subscriptionStatus'
            subscription: {connection: '/', name: 'lists', args: []}
            status: {
              status: 'ready'
              loaded: true
            }
          }
        )
      )
    )
    .then(-> onComplete())
  )

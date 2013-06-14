{beginTest, withTx} = Offline._test


Tinytest.addAsync "offline data - updateSubscriptionsReadyInTx", (test, onComplete) ->
  beginTest()
  .then((db) ->
    withTx(db, (tx) ->
      db.ensureSubscription(tx, '/', 'lists', [])
      .then(->
        db.setSubscriptionReadyFromServer(tx, '/', 'lists', [])
      )
      .then(->
        db.ensureSubscription(tx, '/', 'tasks', [])
      )
      .then(->
        db.setSubscriptionReadyFromServer(tx, '/', 'tasks', [])
      )
      .then(->
        db.addSubscriptionWaitingOnMethods(tx, '/', 'tasks', [], ['abc'])
      )
    )
    .then(->
      withTx(db, (tx) ->
        Offline._test.updateSubscriptionsReadyInTx(tx)
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
              readyFromServer: true
              ready: true
            }
            {
              connection: '/'
              name: 'tasks'
              args: []
              readyFromServer: true
              ready: false
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
            update: 'subscriptionReady'
            subscription: {connection: '/', name: 'lists', args: []}
          }
        )
      )
    )
    .then(-> onComplete())
  )

    return if Offline.persistent


    subscriptionKey = (subscription) ->
      stringify(subscription)


{connection, name, args} -> handle

    currentSubscriptions = {}


    Offline.subscriptions = (subscriptions) ->
      subscriptions = _.map(
        subscriptions,
        ((subscriptionArray) ->
          stringify({
            name: subscriptionArray[0]
            args: subscriptionArray[1..]
          })
        )
      )

      for subscription in currentSubscriptions
        unless subscription in subscriptions
          subscription.stop()
          delete currentSubscriptions[subscription]

      for subscription in subscriptions
        unless currentSubscriptions[subscription]
          {name, args} = EJSON.parse(subscription)
          currentSubscriptions[subscription] =
            Meteor.subscribe(name, args...)

      return


    Offline.Collection = Meteor.Collection


    Offline.subscriptionLoaded = (name, args...) ->


connection name -> OfflineConnection

    offlineConnections = {}


    class OfflineConnection

      constructor: (@connectionName, @meteorConnection) ->
        if offlineConnections[@connectionName]?
          throw new Error(
            "an OfflineConnection has already been constructed for this connection: #{@connectionName}"
          )
        offlineConnections[@connectionName] = this
        @currentSubscriptions = {}
        @subscriptionStatusVariables = {}


      subscriptions: (subscriptions) ->
        unless _.isArray(subscriptions)
          throw new Error('`subscriptions` argument should be an array')
        for subscription in subscriptions
          unless _.isArray(subscription)
            throw new Error('each individual subscription should be an array')
          unless subscription.length > 0
            throw new Error('a subscription should include at least the subscription name')
          unless _.isString(subscription[0])
            throw new Error('the subscription name should be a string')

          subscriptions = _.map(subscriptions,
            (array) -> {name: array[0], args: array[1..]}
          )

          subscriptionKeys = _.map(subscriptions, subscriptionKey)

          for key, handle of @currentSubscriptions
            unless key in subscriptionKeys
              handle.stop()
              delete @currentSubscriptions[key]
              @setSubscriptionStatus(
                EJSON.parse(key),
                {status: 'stopped', loaded: false}
              )

          for subscription in subscriptions
            do (subscription) =>
              key = subscriptionKey(subscription)
              unless @currentSubscriptions[key]
                @currentSubscriptions[key] =
                  @meteorConnection.subscribe(
                    subscription.name,
                    subscription.args...,
                    {
                      onError: (err) =>
                        @setSubscriptionStatus(
                          subscription,
                          {
                            status: 'error'
                            loaded: false
                            error: err
                          }
                        )
                        return
                      onReady: =>
                        @setSubscriptionStatus(
                          subscription,
                          {
                            status: 'ready'
                            loaded: true
                          }
                        )
                    }
                  )

          return


      subscriptionStatusVariable: (subscription) ->
        @subscriptionStatusVariables[stringify(subscription)] or=
          Variable({
            status: 'unsubscribed'
            loaded: false
          })


      subscriptionStatus: (name, args...) ->
        @subscriptionStatusVariable({name, args})()


      setSubscriptionStatus: (subscription, status) ->
        @subscriptionStatusVariable(subscription).set(status)


      subscriptionLoaded: (name, args...) ->
        isolateValue(=> @subscriptionStatus(name, args...).loaded)


      call: (args...) ->
        @meteorConnection.call(args...)


    Offline._defaultOfflineConnection = defaultOfflineConnection =
      new OfflineConnection('/', Meteor.connection)


    Offline.subscriptions = (subscriptions) ->
      defaultOfflineConnection.subscriptions(subscriptions)


    Offline.subscriptionStatus = (name, args...) ->
      defaultOfflineConnection.subscriptionStatus(name, args...)


    Offline.subscriptionLoaded = (name, args...) ->
      defaultOfflineConnection.subscriptionLoaded(name, args...)


    Offline.methods = (methods) ->
      defaultOfflineConnection.methods(methods)


    Offline.call = (args...) ->
      defaultOfflineConnection.call(args...)


    Offline.resetDatabase = ->

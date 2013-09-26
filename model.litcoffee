    Offline._subscriptionStatus = (subscription) ->
      status = {
        status: subscription.status
        loaded: subscription.loaded
      }
      status.error = subscription.error if subscription.error?
      return status

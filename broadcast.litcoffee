    {Fanout} = awwx
    {defer} = awwx.Error
    {withContext} = awwx.Context

    topics = {}

    topic = (messageTopic) ->
      topics[messageTopic] or= new Fanout()

    Meteor.BrowserMsg.listen
      '/awwx/offline-data/broadcast': (messageTopic, args) ->
        withContext "received broadcast msg #{messageTopic}", ->
          topic(messageTopic)(args...)
          return
        return

    broadcast = (messageTopic, args...) ->
      Meteor.BrowserMsg.send('/awwx/offline-data/broadcast', messageTopic, args);
      defer -> topic(messageTopic)(args...)
      return

    broadcast.listen = (messageTopic, callback) ->
      topic(messageTopic).listen callback
      return

    (@Offline or= {})._broadcast = broadcast

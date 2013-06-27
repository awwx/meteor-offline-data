    {Fanout} = awwx
    {defer} = awwx.Error
    {withContext} = awwx.Context


If we're using a shared web worker for the agent, then we don't need
to broadcast (we message through the worker instead).

    return if Offline?._usingSharedWebWorker


    topics = {}

    topic = (messageTopic) ->
      topics[messageTopic] or= new Fanout()

    onMessage = (messageTopic, args) ->
      withContext "received broadcast msg #{messageTopic}", ->
        topic(messageTopic)(args...)
        return
      return

    Meteor.BrowserMsg.listen
      '/awwx/offline-data/broadcast': (messageTopic, args) ->
        onMessage messageTopic, args
        return

    broadcast = (messageTopic, args...) ->
      Meteor.BrowserMsg.send('/awwx/offline-data/broadcast', messageTopic, args)
      return

    broadcast.includingSelf = (messageTopic, args...) ->
      Meteor.BrowserMsg.send('/awwx/offline-data/broadcast', messageTopic, args)
      defer -> topic(messageTopic)(args...)
      return

    broadcast.listen = (messageTopic, callback) ->
      topic(messageTopic).listen callback
      return

    (@Offline or= {})._broadcast = broadcast

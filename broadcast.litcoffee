The shared web worker uses messaging instead of browser-msg.

    return if Offline.isWebWorker


    topics = {}

    topic = (messageTopic) ->
      topics[messageTopic] or= new Fanout()

    onMessage = (messageTopic, args) ->
      Context.withContext "received broadcast msg #{messageTopic}", ->
        topic(messageTopic)(args...)
        return
      return

    Meteor.startup ->
      unless Offline._usingSharedWebWorker
        BrowserMsg.listen
          '/awwx/offline-data/broadcast': (messageTopic, args) ->
            onMessage messageTopic, args
            return
      return

    broadcast = (messageTopic, args...) ->
      BrowserMsg.send('/awwx/offline-data/broadcast', messageTopic, args)
      return

    broadcast.includingSelf = (messageTopic, args...) ->
      BrowserMsg.send('/awwx/offline-data/broadcast', messageTopic, args)
      Errors.defer -> topic(messageTopic)(args...)
      return

    broadcast.listen = (messageTopic, callback) ->
      topic(messageTopic).listen callback
      return

    return unless Offline.persistent

    db = Offline._database


    Offline._windows = {}
    Offline._windows.windowsAreDead = windowsAreDead = new Fanout()


    now = -> +(new Date())


## Running in a shared web worker

    if Offline.isWebWorker

TODO once we get going we don't need to report that no windows are
dead (we could call `windowsAreDead` only when the `windowIds` array
wasn't empty). But do we need to the first time in order to know that
it's safe to clear out old subscriptions?  For now always call
`windowsAreDead`, even with an empty array.

      deadWindows = (windowIds) ->
        WebWorker.windowIsDead(windowId) for windowId in windowIds
        windowsAreDead(windowIds)
        return


      checking = false
      lastPing = null
      testingWindows = {}


      WebWorker.addMessageHandler 'goodbye', (port, data) ->
        deadWindows([data.windowId])
        return


      WebWorker.addMessageHandler 'pong', (port, data) ->
        delete testingWindows?[data.windowId]
        return


      checkPongs = ->
        deadWindows(_.keys(testingWindows))
        checking = false
        testingWindows = null


      check = ->
        Context.withContext "window check", ->
          return if checking or lastPing? and now() - lastPing < 9000
          checking = true

          db.transaction((tx) ->
            db.readAllWindowIds(tx)
          )
          .then((windowIds) ->
            testingWindows = {}
            testingWindows[windowId] = true for windowId in WebWorker.windowIds
            testingWindows[windowId] = true for windowId in windowIds
            lastPing = now()
            for port in WebWorker.ports
              port.postMessage({msg: 'ping'})
            Meteor.setTimeout checkPongs, 4000
            return
          )
          return


      Meteor.startup ->
        check()
        Meteor.setInterval check, 10000


## Running in a browser window

    else

      Offline._windows.thisWindowId = thisWindowId = Random.id()

      Offline._windows.nowAgent = nowAgent = new Fanout()
      # nowAgent.listen -> Meteor._debug "now the agent"


      testingWindows = null
      lastPing = null
      checking = false


      deadWindows = (deadWindowIds) ->
        Context.withContext "deadWindows", ->
          db.transaction((tx) ->
            db.readAgentWindow(tx)
            .then((agentWindowId) ->
              if not agentWindowId? or _.contains(deadWindowIds, agentWindowId)
                becomeTheAgentWindow(tx)
              else
                Result.completed()
            )
          )
          .then(->
            windowsAreDead(deadWindowIds)
          )


      currentlyTheAgent = false

      Offline._windows.currentlyTheAgent = -> currentlyTheAgent


      becomeTheAgentWindow = (tx) ->
        Context.withContext "becomeTheAgentWindow", ->
          currentlyTheAgent = true
          Errors.defer -> nowAgent()
          db.writeAgentWindow(tx, thisWindowId)


On startup, if there isn't an agentWindow in the database or if the
agent window is marked as closed in local storage, we can become the
agent window right away.

      startupCheck = ->
        Context.withContext "startupCheck", ->
          db.transaction((tx) ->
            db.readAgentWindow(tx)
            .then((agentWindowId) ->
              if not agentWindowId?
                becomeTheAgentWindow(tx)
              else
                closedAgentWindow = localStorage.getItem(
                  '/awwx/offline-data/agentWindowClosed'
                )
                if closedAgentWindow is agentWindowId
                  becomeTheAgentWindow(tx)
            )
            .then(->
              localStorage.removeItem(
                '/awwx/offline-data/agentWindowClosed'
              )
              return
            )
          )


      check = ->
        Context.withContext "window check", ->
          return if checking
          checking = true
          db.transaction((tx) ->
            db.readAllWindowIds(tx)
          )
          .then((windowIds) ->
            if lastPing? and now() - lastPing < 9000
              return

            testingWindows = {}
            for windowId in windowIds
              unless windowId is thisWindowId
                testingWindows[windowId] = true
            broadcast 'ping'
            Result.delay(4000).then(-> windowIds)
          )
          .then((windowIds) ->
            deadWindows(_.keys(testingWindows))
          )
          .then(->
            checking = false
          )


      Meteor.startup ->
        Context.withContext "windows startup", ->

          return if Offline._disableStartupForTesting

          if Offline._usingSharedWebWorker

            db.transaction((tx) ->
              db.ensureWindow(tx, thisWindowId)
            )

          else

            broadcast.listen 'ping', ->
              Context.withContext "listen ping", ->
                broadcast 'pong', thisWindowId
                return

            broadcast.listen 'pong', (windowId) ->
              Context.withContext "listen pong", ->
                if testingWindows?
                  delete testingWindows[windowId]
                return

            broadcast.listen 'goodbye', (windowId) ->
              deadWindows([windowId])

            db.transaction((tx) ->
              db.ensureWindow(tx, thisWindowId)
            )
            .then(->
              startupCheck()
            )
            .then(->
              check()
              Meteor.setInterval check, 10000
            )
            return


When a window is closing and gets an unload event, it doesn't survive
long enough to write anything to the database (it gets no more ticks
of the event loop).  But we are able to write to local storage.

      unload = ->
        Context.withContext "unload", ->
          if Offline._usingSharedWebWorker
            Offline._sharedWebWorker.post {
              msg: 'goodbye',
              windowId: thisWindowId
            }
          else
            if currentlyTheAgent
              localStorage.setItem(
                '/awwx/offline-data/agentWindowClosed',
                thisWindowId
              )
            broadcast 'goodbye', thisWindowId
          return


      if window.addEventListener?
        window.addEventListener('unload', unload, false)

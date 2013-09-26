    Offline = {}


True if we're running inside of a
[web worker](http://www.w3.org/TR/workers/).

    Offline.isWebWorker =
      Meteor.isClient and
      not window? and not document? and importScripts?


On the client, offline data is supported if

1. the browser supports Web SQL Database (`openDatabase`); and

2. we have a way to communicate between windows: either the browser
   supports shared web workers (and the developer hasn't disabled
   using them with Meteor.settings), or the browser supports
   browser-msg.

    if Offline.isWebWorker

      Offline.persistent = true


    else if Meteor.isClient

      Offline.persistent =
        (not Meteor.settings?.public?.offlineData?.disable) and
        openDatabase? and
        ((not Meteor.settings?.public?.offlineData?.disableWorker and
          SharedWorker?) or
         BrowserMsg?.supported)

    else if Meteor.isServer

      Offline.persistent = true

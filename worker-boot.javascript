// This code is run first in the shared web worker environment.

(function () {

  var global = self;


  var WebWorker = {};
  global.WebWorker = WebWorker;


  WebWorker.id = (''+Math.random()).substr(2);



  // List of ports from browser windows connecting to us.

  WebWorker.ports = [];

  // List of the windowId of each window connecting to us, in the same
  // order as the ports list.

  WebWorker.windowIds = [];

  // There's no console log in the shared web worker environment, so
  // we'll have Meteor._debug call the log function here.

  // Store any startup errors or debug messages until we have a
  // connection from a window to pass the log messages to.  Make
  // global because sometimes it can be helpful to be able to view in
  // the browser debugger if startup errors prevent getting to the
  // point of listening to window connections.

  WebWorker.logs = [];


  // Log a debug message.  Pass on to connected windows if we have any
  // yet, otherwise store in `logs` until we have a connection.

  WebWorker.log = function (msg) {
    if (WebWorker.ports.length > 0) {
      for (var i = 0;  i < WebWorker.ports.length;  ++i) {
        WebWorker.ports[i].postMessage({msg: 'log', log: [msg]});
      }
    }
    else {
      WebWorker.logs.push(msg);
    }
  };


  // Handle uncaught exceptions.
  // https://developer.mozilla.org/en-US/docs/Web/API/window.onerror

  global.onerror = function(errorMessage, url, lineNumber) {
    WebWorker.log("error: " + errorMessage + " " + url + ":" + lineNumber);
  };


  // Call `fn`, and log any uncaught exceptions thrown.

  // var catcherr = function (fn) {
  //   try {
  //     return fn();
  //   }
  //   catch (error) {
  //     log("error: " + (error != null ? error.stack : ''));
  //   }
  // };


  // Handlers for messages from windows.
  // msg -> handler

  var messageHandlers = {};


  WebWorker.addMessageHandler = function (msg, callback) {
    messageHandlers[msg] = callback;
  };


  // Not dynamically including the Meteor runtime config in this
  // JavaScript source allows it to be served statically.  Instead,
  // connecting windows send a "boot" message with the config, and we
  // delay loading the package code until we get the config.

  var booted = false;

  WebWorker.addMessageHandler('boot', function (port, data) {
    var i = WebWorker.ports.indexOf(port);
    if (i !== -1)
      WebWorker.windowIds[i] = data.windowId;

    if (booted)
      return;

    global.__meteor_runtime_config__ = data.__meteor_runtime_config__;

    // We will at least hear about syntax errors now because of the
    // onerror handler above, but there doesn't seem to be a way to
    // get the line number of the syntax error (the lineNumber
    // reported is the this importScripts line here, not the line of
    // the syntax error).

    importScripts(
      __meteor_runtime_config__.offlineDataWorker.urls['worker-packages.javascript']
    );
    booted = true;

    Package.meteor.Meteor._start();
  });


  // Incoming message from a window.

  var onmessage = function (port, event) {
    var data = event.data;

    if (WebWorker.ports.indexOf(port) === -1) {
      WebWorker.log(
        'Message ' + data.msg + ' received from "dead" window: ' +
        data.windowId
      );
      return;
    }

    var handler = messageHandlers[data.msg];

    if (handler) {
      handler(port, data);
    }
    else {
      WebWorker.log("Error: Unknown message type: " + data.msg);
    }
  };


  global.onconnect = function (event) {
    var port = event.ports[0];

    if (WebWorker.logs.length > 0) {
      port.postMessage({log: WebWorker.logs});
      WebWorker.logs = [];
    }

    port.onmessage = function (event) {
      onmessage(port, event);
    };

    WebWorker.ports.push(port);
  };

  // Weirdly, shared web workers have no way of detecting when the
  // windows they're communicating with have closed.  (!)  We make
  // do by pinging windows to see if they're still alive, and
  // `windowIsDead` here gets called when we don't get a response.

  WebWorker.windowIsDead = function (windowId) {
    var i = WebWorker.windowIds.indexOf(windowId);
    if (i !== -1) {
      WebWorker.ports.splice(i, 1);
      WebWorker.windowIds.splice(i, 1);
    }
  };

})();

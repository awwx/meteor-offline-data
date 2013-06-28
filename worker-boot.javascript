// This is the first code run inside the shared web worker
// environment.

(function () {

  var global = self;


  var Agent = {};
  global.Agent = Agent;

  // List of ports from browser windows connecting to us.

  Agent.ports = [];


  // There's no console log in the shared web worker environment, so
  // we'll have Meteor._debug call the log function here.

  // Store any startup errors or debug messages until we have a
  // connection from a window to pass the log messages to.  Make
  // global because sometimes it can be helpful to be able to view in
  // the browser debugger if startup errors prevent getting to the
  // point of listening to window connections.

  Agent.logs = [];


  // Log a debug message.  Pass on to connected windows if we have any
  // yet, otherwise store in `logs` until we have a connection.

  Agent.log = function (msg) {
    if (Agent.ports.length > 0) {
      for (var i = 0;  i < Agent.ports.length;  ++i) {
        Agent.ports[i].postMessage({msg: 'log', log: [msg]});
      }
    }
    else {
      Agent.logs.push(msg);
    }
  };


  // Handle uncaught exceptions.
  // https://developer.mozilla.org/en-US/docs/Web/API/window.onerror

  global.onerror = function(errorMessage, url, lineNumber) {
    Agent.log("error: " + errorMessage + " " + url + ":" + lineNumber);
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


  Agent.addMessageHandler = function (msg, callback) {
    messageHandlers[msg] = callback;
  };


  // Not dynamically including the runtime config in this JavaScript
  // source allows it to be served statically.  Instead, connecting
  // windows send a "boot" message with the config, and we delay
  // loading the package code until we get the config.

  var booted = false;

  Agent.addMessageHandler('boot', function (port, data) {
    if (! booted) {
      global.__meteor_runtime_config__ = data.__meteor_runtime_config__;

      // We will at least hear about syntax errors now because of the
      // onerror handler above, but there doesn't seem to be a way to
      // get the line number of the syntax error (the lineNumber
      // reported is the this importScripts line here, not the line of
      // the syntax error).

      importScripts(
        '/packages/offline-data/worker-packages.javascript?' +
        __meteor_runtime_config__.offlineDataWorker.hashes.packages
      );
      booted = true;

      // start() is defined in the startup package, and it runs
      // the Meteor.startup callbacks.
      Agent.start();
    }
  });


  // Incoming message from a window.

  var onmessage = function (port, event) {
    var data = event.data;

    var handler = messageHandlers[data.msg];

    if (handler) {
      handler(port, data);
    }
    else {
      Agent.log("Error: Unknown message type: " + data.msg);
    }
  };


  global.onconnect = function (event) {
    var port = event.ports[0];

    if (Agent.logs.length > 0) {
      port.postMessage({log: Agent.logs});
      Agent.logs = [];
    }

    port.onmessage = function (event) {
      onmessage(port, event);
    };

    Agent.ports.push(port);
  };

})();

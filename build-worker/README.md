# Shared Web Worker Agent

This directory contains the
[Offline Data](https://github.com/awwx/meteor-offline-data#readme)
agent code which runs inside of the shared web
worker, implementing the offline agent for browsers which support
shared web workers.

If you find bugs, please report them over in
[Offline Data Issues](https://github.com/awwx/meteor-offline-data/issues)
so that they're all collected in one place.

The shared web worker envionment has no access to `window`,
`document`, `console`, or the DOM.  Thus the module needs to be built
using only code needed to implement the agent, leaving out browser
window specific packages such as templating and jQuery, etc.

Shared web workers have no built in or default error handling (for
example, uncaught exceptions aren't reported back to a browser window
like they are with dedicated web workers).  Thus, aside from running
the shared web worker in a debugger, the only way to get notified of
errors is to have successfully gotten to the point of having accepted
a connection from the browser window and to be able to post an error
message back; otherwise the shared web worker fails silently.

`worker-boot.javascript` is loaded into the shared web worker first,
and it attempts to do the minimum possible to catch errors, accept the
connection from the browser window, and report any errors back.  It
then loads `worker-packages.javascript`, which contains the Meteor
packages used by and implementing the agent.

While this means that syntax errors are at least reported,
unfortunately the displayed error line number for a syntax error is
the line in `boot.javascript` which loads the code, instead of the
line of the actual syntax error.


## Building

`worker-packages.javascript` is built via:

```
$ mrt install
$ ./build.sh
```

The build script can be passed the `--debug` option which will be
passed to `meteor bundle`, and the created
`worker-packages.javascript` file won't be minified.

The `.javascript` extension is used to have the files included as
static resources instead of being bundled into the main application's
JavaScript code.

The following Meteor packages are rewritten or modified to run in the
shared web worker environment:

* logging: shared web workers have no `console`, so this package
  overrides Meteor's `logging` package to send `Meteor._debug`
  messages back to the connecting windows.

* meteor: shared web workers don't have a `load` event, so the
  package implements `Meteor.startup` to simply call the startup
  callbacks once all the packages have been loaded.

* reload: shared web workers have no mechanism to reload with new code
  like browser windows do with `window.location.reload()`, so this
  reload package does nothing.  Instead, when a browser window
  instantiates the shared web worker, it does so with a URL which
  includes the hash of the boot code.  Shared web workers are
  identified by URL, so if the code has changed, the reloaded window
  will get a new instance of the shared web worker.

* livedata: SockJS is modified to run in the shared web worker
  environment.

* json: the shared web worker environment always has native JSON, so
  there's no need to include the json2 implementation in the bundle.

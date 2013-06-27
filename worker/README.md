# Shared Web Worker Agent

This directory contains the code which runs inside of the shared web
worker, implementing the offline agent for browsers which support
shared web workers.

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

`boot.javascript` is loaded into the shared web worker first, and it
attempts to do the minimum possible to catch errors, accept the
connection from the browser window, and report any errors back.  It
then loads `packages.javascript`, which contains the Meteor packages
used by and implementing the agent.

While this means that syntax errors are at least reported,
unfortunately the displayed error line number for a syntax error is
the line in `boot.javascript` which loads the code, instead of the
line of the actual syntax error.

As a horrible hack :-), the `packages.javascript` is built via:

```
$ mrt install
$ meteor
[[[[[ ~/offline-data/worker ]]]]]

=> Meteor server running on: http://localhost:3000/
^C
$ coffee build.coffee
```

which extracts the particular packages used by the shared web worker
from the local build and saves them to `packages.javascript`.  (If the
currently-under-development Meteor linker eventually supports building
separate client programs, that will probably be the preferred way to
do the build in the future).

The `.javascript` extension is used to have the files included as
static resources instead of being bundled into the main application's
JavaScript code.

The packages directory contains the following packages:

* logging: shared web workers have no `console`, so this package
  overrides Meteor's `logging` package to send `Meteor._debug`
  messages back to the connecting windows.

* startup: shared web workers don't have a `load` event, so the
  package implements `Meteor.startup` to simply call the startup
  callbacks once all the packages have been loaded.

* reload: shared web workers have no mechanism to reload with new code
  like browser windows do with `window.location.reload()`, so this
  reload package does nothing.  Instead, when a browser window
  instantiates the shared web worker, it does so with a URL which
  includes the hash of the boot code.  Shared web workers are
  identified by URL, so if the code has changed, the reloaded window
  will get a new instance of the shared web worker.  (TODO: this needs
  to include the hash of the package code to catch changes made to the
  agent implementation).

* livedata: SockJS is modified to run in the shared web worker
  environment.

* worker-agent: implements the offline agent.

## v0.1.1

Update for Meteor 0.6.5.

Fix subscription status.

Ensure Offline.supported is false if we're using browser-msg and
BrowserMsg.supported is false.


## v0.1.0

Implement Offline.subscriptions, subscriptionLoaded, and
subscriptionStatus.

Clean up the interaction between the client and the agent for
subscribing to subscriptions and reporting subscription status back to
the client.

#8, #7, #4.


## v0.0.5

Implement dead window detection for the shared web worker, fixing #19.

Use canonical-stringify v1.1


## v0.0.4

Fix problem with confusing Meteorite.  Move common code used by both
the offline data client and the shared web worker agent into
offline-common, and the app to build the shared web worker into
offline-worker.  #20.


## v0.0.3

Use a shared web worker when supported for the agent.  #17


## v0.0.2

* Fix "Match error: not a transaction" in iOS.  #16


## v0.0.1

* Initial release.

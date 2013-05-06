# Meteor Offline Data #

Home of the Meteor offline data project.

The project will implement an "Offline Collection" which wraps a `Meteor.Collection`:

* Data from the server is stored persistently in the browser database, making it available to the
application even if the application starts up offline.

* Changes made by the user are also saved in the browser database, preserving them if the browser
is closed and reopened. The next time the application goes online the changes are sent up to the
server.

* Updates are reactively shared across browser tabs open on the same application, even while
offline.


## Fundraiser ##

This work is being made possible by contributors to the
[Meteor Offline Data Campaign](http://offline-data.meteor.com/).


## Limitations and API Changes ##

* The implementation only supports idempotent updates (updates that can be applied more than once without 
changing the result: for example, `{$set: {a: 1}}` is idempotent but `{$inc: {a: 1}}` is not).

* In standard Meteor logging in and logging out is supported in a general purpose way by having the "wait"
option to method calls (one method call will log the user in, and other method calls will wait until the
first one is done so that they run with the permissions of the newly logged in user).  Offline collections
will also support accounts (so that, for example, if an application connects after being offline it will
first authenticate and then send updates, so that the updates run with the user's permissions), but
this implementation will be special purpose to accounts (since method calls can't wait while offline).

* For offline collections, the API for reporting method completion will change from using a function
callback, since methods can be start in one instance of the application while offline and complete after
the application has been closed and opened again... and a function callback would no longer exist in
JavaScript memory.

* Unnamed subscriptions (such as published by the `autopublish` package) are not supported.  You
will need to use [Meteor.publish](http://docs.meteor.com/#meteor_publish) with a non-null `name`
argument to publish subscriptions for use by offline collections.


## Current Progress ##

A [simulator](https://github.com/awwx/meteor-offline-sim#readme) is available for a part of
the offline data algorithm.

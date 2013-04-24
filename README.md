# Meteor Offline Data #

Home of the Meteor offline data project.

The offline-data package implements an "Offline Collection" which can be used in place of a regular Meteor.Collection.
It adds the following capabilities:

* A copy of the data from the server, and local changes made by the user not yet sent to the server,
are stored persistently in the browser.  This makes the data available for use while offline, and
avoids having losing user updates if the application is closed while offline or if the application
tab is unloaded from memory on mobile devices.

* Changes made by the user are reactively shared across browser tabs open on the same application,
even when offline.

Limitations and API changes:

* The implementation only supports idempotent updates (updates that can be applied more than once without 
changing the result: for example, `{$set: {a: 1}}` is idempotent but `{$inc: {a: 1}}` is not).

* In standard Meteor logging in and logging out is supported in a general purpose way by having the "wait"
option to method calls (one method call will log the user in, and other method calls will wait until the
first one is done so that they run with the permissions of the newly logged in user).  Offline collections
will also support accounts (so that, for example, if an application connects after being offline it will
first authenticate and then send updates, so that the updates run with the user's permissions), but
this implementation will be special purpose to accounts (since method calls can't wait while offline).

* For offline collections, the API for reporting method completion will change from using a function
callback, since methods can be start in one instance of the application while offline and complete afte
the application has been closed and opened again... and a function callback would no longer exist in
JavaScript memory.

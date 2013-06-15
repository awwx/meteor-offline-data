# Meteor Offline Data #

Home of the Meteor offline data project, implementing an "Offline
Collection" which wraps a `Meteor.Collection`:

* Data from the server is stored persistently in the browser database,
making it available to the application even if the application starts
up offline.

* Changes made by the user are also saved in the browser database,
preserving them if the browser is closed and reopened. The next time
the application goes online the changes are sent up to the server.

* Updates are reactively shared across browser windows open on the same
application, even while offline.


## Version

0.0.2 early alpha release.

Major gaps:

* [slow startup](https://github.com/awwx/meteor-offline-data/issues/4)

* [iOS only works in one tab](https://github.com/awwx/meteor-offline-data/issues/17)

* [no support yet for IE and Firefox](https://github.com/awwx/meteor-offline-data/issues/5)

* [no fallback if the browser database isn't available](https://github.com/awwx/meteor-offline-data/issues/6)

* [no support for accounts](https://github.com/awwx/meteor-offline-data/issues/2)

See the [issues list](https://github.com/awwx/meteor-offline-data/issues)
for the full known TODO list.


## Fundraising Campaign ##

This work is being made possible by contributors to the
[Meteor Offline Data Campaign](http://offline-data.meteor.com/).


## Offline Data Package

Offline data is a client side smart package which runs on top of
standard, unmodified Meteor.

On the server, collections are standard Meteor collections and methods
are standard Meteor methods: the server doesn't know or care that the
client is persisting data for offline use or not.  (In fact some
clients could be using the offline package and other clients might
not; it's all the same to the server).

On the client, an "Offline Collection" is used in place of a standard
`Meteor.Collection` for collections that the developer wants to
persist in the browser's database for offline usage.  Regular Meteor
collections can still be used, so an application can choose to make
some collections available for offline use while leaving others in
memory.

When using offline collections the major architectural differences to
the application are that offline collections and subscriptions are
reactively shared across browser windows open on the same application,
and method calls can complete in a different instance of the
application.


## Limitations ##

* Unnamed subscriptions (such as published by the `autopublish`
package) are not supported.  You will need to use
[Meteor.publish](http://docs.meteor.com/#meteor_publish) with a
non-null `name` argument to publish subscriptions for use by offline
collections.


## Example

The Meteor "todos" example,
[modified to use offline-data](https://github.com/awwx/meteor-offline-todos#readme).


## Offline API

**Offline.subscribe(name [, arg1, arg2, ... ] [, callbacks])**
*client*

In standard Meteor, each browser window has its own set of
collections, independent of the other windows.  A change to a
collection in one window will be reactively shared with other windows
by making a round trip through the server; but when offline, one
window will not see a change made by another window.

In constrast offline collections are shared across browser windows, so
that a change in one window is seen in another window -- even when
offline.  This means that subscriptions are also shared: making a
subscription in one window will cause documents delivered for that
subscription to be seen by all windows.

An application that was relying on filtering subscriptions on the
server ("send me the items for the selected project") may need to
re-apply the filter on the client when using an offline collections
(two different windows could each have a subscription to a different
project, and then with an offline collection both windows will see
items for both projects).  However an application designed to be used
offline may want to filter less on the server anyway, so that more
data is persisted locally for offline use.

Internally, only one window actually subscribes to the subscriptions
on the server at a time.  Since all windows are getting the same data,
there's no need to use additional bandwidth to retrieve the same
documents multiple times.  The browser windows cooperatively select
one of themselves to be the "agent", the window that the other windows
use to fetch data from the server.  The agent can change over time if
the window that is currently the agent window is closed or becomes
inactive.


<br>
**Offline.methods(methods)**  *client*

Define client stubs for methods that can be called offline.

On the server, use `Meteor.methods` as usual to define the methods.

In standard Meteor, if an application temporarily doesn't have a
connection to the server, method calls will be queued up in memory.
Meteor will automatically keep trying to reconnect and will send the
method calls to the server when it is connected again.  However,
undelivered method calls will be lost if the browser window is closed, or
if on a mobile device the window is unloaded to save memory when
switching between windows or applications.

Offline methods are saved persistently in the browser's database, and
will be delivered when the browser goes online -- even if the
application was closed or unloaded in the meantime.

In Meteor, the collection modification methods
(<em>collection</em>.insert, <em>collection</em>.update,
<em>collection</em>.remove) are translated into method calls
internally, and so this is the mechanism by which changes to offline
collections are persisted (if needed) until the application has a
connection.


<br>
**Offline.call(name, param1, param2, ...)**  *client*

Calls an offline method.

There is no `asyncCallback` argument because it is quite normal for an
offline method to be started in one instance of the application while
offline, have the window be closed or unloaded, and then for the method
call to complete in another instance of the application when the
browser is online again.  (This is how changes the user makes to
collections are saved until the application goes online again).

Instead you can listen for method complete events.

*TODO: `Offline.apply`, and doing something for `wait`.*


<br>
**Offline.methodCompleted([ name, ] callback)**  *client*

To be implemented.

Registers a callback to be called when an offline method `name` has
completed: the method has returned a result and the server's writes
have replaced the stub's writes in the local cache.  If `name` is not
specified then the callback is called for all offline methods.

The callback is called with the name, parameters as an array, and
error or result returned:

    callback(name, params, error, result)

Note that method completion is broadcast to all listening windows.

*TODO: This is a straightforward conversion of the Meteor method
completion API to support resumed applications, but it would be good
to walk through some use cases to see if this is what we really
want.*


<br>
**new Offline.Collection(<i>name</i>)**  *client*

Creates and returns an offline collection.  `name` is the name of a
regular `Meteor.Collection` on the server.

(The server doesn't know or care if a client is using a collection as
an offline collection or not).


<br>
**offlineCollection.find**
<br>**offlineCollection.findOne**

These work the same as the `Meteor.Collection` methods.

<br>
**offlineCollection.insert(doc)**
<br>**offlineCollection.update(selector, modifier, [options])**
<br>**offlineCollection.remove(selector)**

These methods work the same as their corresponding `Meteor.Collection`
methods, except for the lack of a callback since the methods may
complete in a later instance of the application.

*TODO: Naturally we'd like to have an API to get notified on method
completion; it would be helpful to think of a use case to help see
what the API could look like.*

There is no `allow` or `deny` methods on an offline collection as
these are server-only methods.

<br>
**Offline.resetDatabase()**

Clears the browser database.


## Other Offline Functionality

There's other functionality that might be useful or important for an
offline application, but isn't part of the offline-data package.


### Conflict resolution

Conflict resolution can become more important when some updates are
delayed in time by applications being offline.  A conflict resolution
strategy might involve for example adding a last modified timestamp to
server documents, and then accepting, rejecting, or perhaps merging
updates in a server method.


### Incremental loading of large data sets

The offline-data package makes a standard Meteor subscription to
receive data, which means that just like with a regular Meteor
application all the documents in the subscription are sent down to the
client each time the application is opened.  For larger data sets
(with some kind of support on the server to keep track of versioning)
it would be nice to only need to download new and changed documents.

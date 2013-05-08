# Meteor Offline Data #

Home of the Meteor offline data project, implementing an "Offline
Collection" which wraps a `Meteor.Collection`:

* Data from the server is stored persistently in the browser database,
making it available to the application even if the application starts
up offline.

* Changes made by the user are also saved in the browser database,
preserving them if the browser is closed and reopened. The next time
the application goes online the changes are sent up to the server.

* Updates are reactively shared across browser tabs open on the same
application, even while offline.


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
reactively shared across browser tabs open on the same application,
and method calls can complete in a different instance of the
application.

There are other aspects of offline functionality not addressed
by this API.  For example, conflict resolution can become more
important when some updates are delayed in time by applications being
offline.  Unlike simply persisting data in the client with offline
collections (which doesn't need participation by the server), a
conflict resolution strategy might involve for example adding a last
modified timestamp to server documents and then accepting, rejecting,
or merging updates in a server method.


## Offline API

**Offline.subscribe(name [, arg1, arg2, ... ] [, callbacks])**

In standard Meteor, each browser tab has its own set of collections,
independent of the other tabs.  A change to a collection in one tab
will be reactively shared with other tabs by making a round trip
through the server.  When offline, one tab will not see a change made
by another tab.

Offline collections are shared across browser tabs, so that a change
in one tab is seen in another tab -- even when offline.  This means
that subscriptions are also shared: making a subscription in one tab
will cause documents delivered for that subscription to be seen by all
tabs.

An application that was relying on filtering subscriptions on the
server ("send me the items for the selected project") may need to
re-apply the filter on the client when using an offline collections
(two different tabs could each have a subscription to a different
project, and then with an offline collection both tabs will see items
for both projects).  However an application designed to be used
offline may want to filter less on the server anyway, so that more
data is persisted locally for offline use.

Internally, only one tab actually makes the subscriptions to the
server at a time.  Since all the tabs are getting the same data,
there's no need to use additional bandwidth to retrieve the same
documents multiple times.  The browser tabs cooperatively select one
of themselves as the "proxy tab", the tab that the other tabs use to
fetch data from the server.  The proxy tab can change over time if the
tab that is currently the proxy tab is closed or becomes inactive.


<br>
**Offline.Methods(methods)**  *client*

Define client stubs for methods that can be called offline.

On the server, use `Meteor.methods` as usual to define the methods.

In standard Meteor, if an application temporarily doesn't have a
connection to the server, method calls will be queued up in memory.
Meteor will automatically keep trying to reconnect and will send the
method calls to the server when it is connected again.  However,
undelivered method calls will be lost if the browser tab is closed, or
if on a mobile device the tab is unloaded to save memory when
switching between tabs or applications.

Offline methods are saved persistently in the browser's database, and
will be delivered when the browser goes online -- even if the
application was closed or unloaded in the meantime.

In Meteor, the collection modification methods (*collection*.insert,
*collection*.update, *collection*.remove) are translated into method
calls internally, and so this is the mechanism by which changes to
offline collections are persisted if needed until the application has
a connection.

A limitation of offline methods is that they need to be *idempotent*:
running a method more than once needs to produce the same result as
running it one time.  For example,

Good:
<pre>collection.update(docId, {<b>$set</b>: {foo: 5}});</pre>

Bad:
<pre>collection.update(docId, {<b>$inc</b>: {foo: 1}});</pre>

The first is idempotent because you can set `foo` to `5` multiple
times and get the same result (`foo` will still end up being `5`).
The second is not idempotent because incrementing `foo` more than once
produces a different value than incrementing it only once.

You may be able to change method calls to make them idempotent.  For
example, a method call to increment the vote on something might be
changed to "user X likes Y", with the vote count calculated from the
number of users who like Y.  The later is idempotent because saying
that "X likes Y" more than once doesn't change the result.


<br>
**Offline.call(name, param1, param2, ...)**  *client*

Calls an offline method.

There is no `asyncCallback` argument because it is quite normal for an
offline method to be started in one instance of the application while
offline, have the tab be closed or unloaded, and then for the method
call to complete in another instance of the application.  (This is how
changes the user makes to collections are saved until the application
goes online again).

Instead you can listen for method complete events.

*TODO: `Offline.apply`, and doing something or another with `wait`.*


<br>
**Offline.methodComplete([ name, ] callback)**  *client*

Registers a callback to be called when an offline method `name` has
completed: the method has returned a result and the server's writes
have replaced the stub's writes in the local cache.  If `name` is not
specified then the callback is called for all offline methods.

The callback is called with the name, parameters as an array, and
error or result returned:

    callback(name, params, error, result)

Note that method completion is broadcast to all listening tabs.

*TODO: This is a straightforward conversion of the Meteor method
 completion API to support resumed applications, but it would be good
 to walk through some use cases.*


<br>
**new Offline.Collection(*name*)**  *client*

Creates and returns an offline collection.  `name` is the name of a
regular `Meteor.Collection` on the server.

(The server doesn't know or care if a client is using a collection as
an offline collection or not).

Internally, an `Offline.Collection` wraps a `Meteor.Collection` of the
same name, but changing the collection modification method calls to be
offline calls.

(Note that because `Offline.Collection` opens the `Meteor.Collection`
itself, a client can't create an `Offline.Collection` and a
`Meteor.Collection` for the same collection).

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


## TODO ##

In standard Meteor logging in and logging out is supported in a
general purpose way by having the "wait" option to method calls (one
method call will log the user in, and other method calls will wait
until the first one is done so that they run with the permissions of
the newly logged in user).

I'm unclear yet whether anything special or different needs to be done
to support the interaction of offline methods / wait methods /
accounts.


## Limitations ##

* Unnamed subscriptions (such as published by the `autopublish`
package) are not supported.  You will need to use
[Meteor.publish](http://docs.meteor.com/#meteor_publish) with a
non-null `name` argument to publish subscriptions for use by offline
collections.


## Current Progress ##

A [simulator](https://github.com/awwx/meteor-offline-sim#readme) is
available for the offline data algorithm implemented so far.


## Fundraising Campaign ##

This work is being made possible by contributors to the
[Meteor Offline Data Campaign](http://offline-data.meteor.com/).

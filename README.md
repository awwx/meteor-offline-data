# On Hold

This project is currently on hold, awaiting time for me (or someone)
to redesign to address the problems with the current approach.

I'd like the thank the many supporters of the project.  While I
regret the first attempt didn't result in a workable implementation,
I hope that post the 1.0 Meteor release we'll be able to revisit
and come up with a new design.


## Meteor Offline Data

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


See the
[two minute video introducing Offline Data](http://vimeo.com/64803472)


## A Big Problem

The architecture used by Offline Data avoids three-way merges.

In Offline Data, windows need to share updates between themselves to
give a good user experience when offline.  (Otherwise if the user
comes back to a different window without realizing it, they'll be
alarmed when something they entered has appeared to have vanished).

In standard Meteor, each browser window has its own connection to the
server.  If we did this *and* had windows sharing updates as well,
we'd have to deal with three-way merges.  We'd have updates coming
from other windows, and updates coming from the server, and we'd need
to merge them correctly.

The approach taken by Offline Data is to have *one* connection to the
server, shared by the windows open on an application.  Now updates
flow in a linear fashion.  Windows talk to the agent, which talks to
the server.  This is easy to figure out how to do right, and is easy
to debug when something strange happens.  We don't have obscure race
conditions to avoid, and we don't need to be proving proofs to ensure
that we're not going to occasionally mess up a three-way merge.

The easy way to do this is with a shared web worker.  We put the agent
in the shared web worker, which is shared between windows, the shared
web worker talks to the server, and everything works.

For browsers which don't support shared web workers, the browser
windows elect one of their number to act as the agent and make the
connection to the server.  It's more complicated than just using a
shared web worker because the window acting as the agent might be
closed and another window has to take over.  But the end result is the
same.

This approach of having one browser window make the connection to the
server on behalf of the other windows doesn't work on iOS because iOS
suppresses timer events in inactive tabs.  But that's OK, because iOS
supports shared web workers.

Until now.  iOS 7 [has dropped support for shared web
workers](http://caniuse.com/sharedworkers).

This is a big problem for the current architecture of Offline Data.

So what's next?  Maybe we change the architecture.  Currently, Offline
Data runs on standard DDP.  The server doesn't know or care that the
client is storing data offline.  On the server, it's plain unmodifed
Meteor collections.  But we could add server support for offline data, use timestamps or whatever, extend DDP if we need to.

Or maybe there will be some clever way to get the "one connection to
the server" agent working in iOS 7.  I don't know yet.


## Version

0.1.2

Use 0.1.2 with Meteor 0.6.5.1 or 0.6.5 only.

(Offline data is closely tied to Meteor's internal livedata
implementation, and the shared web worker loads Meteor 0.6.5.1 code
modified to run in the web worker environment, so new releases of
Meteor require a new release of offline data).

For Meteor 0.6.4.1, use Offline Data version 0.1.0.


Current gaps:

* [no support yet for IE and Firefox](https://github.com/awwx/meteor-offline-data/issues/5)

* [no support for accounts](https://github.com/awwx/meteor-offline-data/issues/2)

See the [issues list](https://github.com/awwx/meteor-offline-data/issues)
for the full known TODO list.


## Community Funded

Development of the Offline Data package is funded by contributors through
[Gittip](https://www.gittip.com/awwx/).


## Offline Data Package

Offline data is a client side package which runs on top of standard,
unmodified Meteor.

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


## Limitations

* Unnamed subscriptions (such as published by the `autopublish`
package) are not supported.  You will need to use
[Meteor.publish](http://docs.meteor.com/#meteor_publish) with a
non-null `name` argument to publish subscriptions for use by offline
collections.


## Example

The Meteor "todos" example,
[modified to use offline-data](https://github.com/awwx/meteor-offline-todos#readme).


## Offline Subscriptions

In standard Meteor, subscriptions are dynamic: you start a
subscription with `Meteor.subscribe`, and you can later stop the
subscription by calling `stop` on the subscription handle.  Each call
to `Meteor.subscribe` creates a new subscription, and it can only last
for as long as the window is loaded.

In offline data, subscriptions are shared across browser windows, and
persist across reloads.  A window declares the subscriptions it wants
the agent to subscribe to, but there isn't a one-to-one correspondence
between the window's declared subscriptions and the agent's Meteor
subscriptions.  If the window requests a subscription that is already
being subscribed to, the existing subscription is reused instead of
starting a new subscription.  And the agent's Meteor subscription may
need to be restarted if the agent window changes or the application is
reloaded.

Another difference is that *not* subscribing to a subscription
actively causes the documents unique to that subscription to be
deleted.  This is because the only way to tell that document persisted
in the browser was deleted while the client was offline is to wait for
subscriptions to become ready, and to see what documents we got from
the server.  (Any documents we *didn't* receive can and should now be
deleted on the client, since we now know they were deleted on the
server while we were offline).

Thus we don't want to subscribe for example to "lists" and then later
subscribe to "tasks"... we could end up deleting all our task
documents and then reloading them.  Instead we want to subscribe to "lists" and "tasks" together,


## Offline API

**Offline.persistent**
*client*

This constant is `true` if data can be stored offline in this browser
(for example, the browser supports the Web SQL Database).

When `false`, the Offline Data API falls back to using Meteor
collections, and stores data in memory only.


**Offline.subscriptions([
<br> &nbsp; [name, arg1, arg2, ... ]
<br> &nbsp; [name, arg1, arg2, ... ]
<br> &nbsp; ...
<br>])**
*client*

Specifies the set of subscriptions to subscribe to.  Any subscriptions
not listed in any window's subscription set are unsubscribed.

Thus calling `subscriptions` *replaces* the set of subscriptions
subscribed to, instead of adding to them.

In standard Meteor a common pattern is to *select* a set of documents
to retrieve from the server and display:

```
Meteor.subscribe("projects");
Deps.autorun(function () {
  Meteor.subscribe("tasks", Session.get("currentProjectId"));
});
```

With offline data it is common to subscribe to a larger set of
documents that we want to have *available* while offline,

```
Offline.subscriptions([["projects"], ["tasks"]]);
```

and then display a particular subset:

```
Tasks.find({projectId: Session.get("currentProjectId")})
```


<br>
**Offline.subscriptionLoaded(name, [, arg1, arg2, ...])**
*client*

Returns `true` or `false` indicating whether the documents for a
subscription have been loaded.  A reactive data source.

For a new subscription, the subscription is "loaded" when it becomes
ready.  However the "loaded" status persists across reloads of the
application, and so a loaded subscription will still show as loaded
even if the application starts up offline.

A subscription will transition to not being loaded if it is
unsubscribed, or if the offline agent's Meteor subscription reports an
error (through the Meteor.subscribe onError callback).


<br>
**Offline.subscriptionStatus(name, [, arg1, arg2, ...])**
*client*

Returns an object describing the dynamic status of the Meteor
subscription made by the offline agent.  A reactive data source.

The object will contain a `status` field which
can be one of the strings `unsubscribed`, `subscribing`, `error`, or
`ready`.  When the status is "error" the object will also contain an
`error` field with the subscription error.

(The subscription error will be an object containing the same fields
as the
[`Meteor.Error`](http://docs.meteor.com/#meteor_error)
object returned for the Meteor subscription, but will not be an
instance of the `Meteor.Error` class because of EJSON serialization).

It's normal for the status to transition from `ready` back to
`subscribing` if the agent window changes.

If a subscription is loaded but not ready, that means the client has a
complete set of old documents (from the last time we were online and
got synced up), but hasn't received the latest updates from the server
yet.


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


## Offline Functionality Not Included

There's other functionality that might be useful or important for an
offline application, but isn't part of the offline-data package.


### Conflict resolution

Conflict resolution can become more important when some updates are
delayed in time by applications being offline.  A conflict resolution
strategy might involve for example adding a last modified timestamp to
server documents, and then accepting, rejecting, or perhaps merging
updates in a server method.


### Incremental Loading of Large Data Sets

The offline-data package makes a standard Meteor subscription to
receive data, which means that just like with a regular Meteor
application all the documents in the subscription are sent down to the
client each time the application is opened.  For larger data sets
(with some kind of support on the server to keep track of versioning)
it would be nice to only need to download new and changed documents.


## Architecture

Offline subscriptions are made from the "offline agent" in the client,
which connects to the server on behalf of the browser windows.  This
allows updates from the server to be delivered to the browser over one
connection, instead of redundantly delivered to every browser window;
and as offline collections are shared across browser windows, ensures
that the browser sees a consistent view of updates from the server.

In browsers which support
[shared web workers](http://caniuse.com/#feat=sharedworkers),
the agent runs inside of a shared web worker.  Otherwise, the browser
windows cooperatively elect one of their number to act as the agent
for the other windows.

(In iOS, timeout and interval events are not delivered to tabs other
than the active tab, which would make it hard for a tab to act as the
agent for the other tabs when it wasn't the active tab; but iOS Safari
does support shared web workers.  The Android browser doesn't support
shared web workers, but timer events are delivered to all tabs and so
there's no problem on Android having one tab act as the agent for the
other tabs.)

While in theory it might be possible for individual browser windows
not to make any connection to the server at all and to channel all
communication through the agent, the offline-data package is designed
to run on top of standard Meteor and so browser windows do each have
their own livedata connection to the server.

Communication for regular (non-offline) Meteor collections, Meteor
methods, and the hot code reload notification go through the
individual window's livedata connection as usual, in the same way as
when the offline-data packages isn't being used.

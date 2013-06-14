This allows us to invoke a method on the server without running the
stub on the client.  (We've already run the stub using the offline
algorithm).

      Meteor.methods
        '/awwx/offline-data/apply': (methodId, name, params) ->
          return Meteor.apply name, params


For convenience on the server, Offline.methods etc. delegate to their
Meteor counterpart.

      @Offline or= {}

      Offline.methods = (methods) ->
        Meteor.methods methods

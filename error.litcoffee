    {getContext} = awwx.Context


    ensureString = (x) ->
      if x is null
        return 'null'
      if typeof x is 'undefined'
        return 'undefined'
      if typeof x is 'string'
        return x
      try
        return x.toString()
      catch error
        return JSON.stringify(describeError(error))


Return a plain Javascript object, guaranteed to be JSON
serializable, which describes an exception or error.

(In particular, the returned description will not a subclass of
Error or DOMException etc., even if the exception being described
is).

The error description object will have an `error` field, set to
`true`.

It is guaranteed to contain a `message` field, which will always
be a string.  (The string may be empty, but it will be a string
and it will be present).

The error object will have a `stack` field if a stack trace is
available in the original exception.  If present, `stack` will be
a string.  (Typically it will consist of multiple lines separated
by newlines).

    class ErrorDescription


    describeError = (err, context) ->
      # Here's a weird edge case... `throw null` is legal in Javascript.
      if err is null
        message = "null"

      else if typeof err is 'undefined'
        message = 'undefined'

      else
        # Now we know `err` is an object.  It may not be an instance of
        # Error; and it could even be a simple value such as a number
        # or a string... but even numbers and strings are objects in
        # Javascript.

        if err.message isnt null and typeof err.message isnt 'undefined'
          message = ensureString(err.message)
        else
          message = ensureString(err)

        if err.stack isnt null and typeof err.stack isnt 'undefined'
          stack = ensureString(err.stack)

        if err instanceof Error
          constructorName = err.constructor?.name
          type = ensureString(constructorName) if constructorName?

      description = new ErrorDescription()
      description.message = message
      description.type = type if type?
      description.stack = stack if stack?
      description.context = context if context?

      return description


    logError = (description) ->
      if description.stack?
        Meteor._debug description.stack
      else
        Meteor._debug description.message
      if description.context?
        for entry in description.context
          Meteor._debug '-', entry
      return


    reportError = (error) ->
      logError(describeError(error, getContext()))
      return


    class Failed
      constructor: (@reason) ->


    catcherr = (fn, failureReason) ->
      try
        return fn()
      catch error
        reportError error unless error instanceof Failed
        throw new Failed(failureReason)


    defer = (fn) ->
      unless typeof(fn) is 'function'
        throw new Error("not a function: #{fn}")
      Meteor.defer(-> catcherr(fn))


    bind = (fn) ->
      Meteor.bindEnvironment(fn, reportError, this)


    _.extend ((@awwx or= {}).Error or= {}), {
      bind
      catcherr
      defer
      Failed
      reportError
    }

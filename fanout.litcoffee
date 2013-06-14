Various event emitter libraries like Node.js' EventEmitter seem
weirdly complicated to me.  I'll do something simple until I find a
reason to use something more complicated.

This implementation generalizes the idea of calling a function.
Normally when a function is called, a single function is called.  When
a fanout is called, multiple functions (the callbacks) are called.


Returns a function that when called, calls each of the listening
callbacks with the function arguments.

`fn = Fanout()`
`fn.listen(callback1)`
`fn.listen(callback2)`
`fn('abc', 123)`


    {catcherr} = awwx.Error


    Fanout = ->

      listeners = []

      fn = (args...) ->
        if listeners?
          for callback in listeners
            catcherr -> callback(args...)
        return

      fn.listen = (callback) ->
        if listeners?
          listeners.push callback
        return

      fn.dispose = ->
        listeners = null
        return

      return fn

    (@awwx or= {}).Fanout = Fanout

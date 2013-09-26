    class ContextEntry

      constructor: (@entry, @parentContext) ->

      add: (entry) ->
        return new ContextEntry(entry, this)

      toArray: ->
        array = []
        context = this
        while context?
          entry = context.entry
          if entry?
            array.push(entry)
          context = context.parentContext
        return array.reverse()


    contextVar = new Meteor.EnvironmentVariable()


    getContext = ->
      context = contextVar.get()
      if context?
        context.toArray()
      else
        []


    withContext = (entry, fn) ->
      if typeof fn isnt 'function'
        throw new Error "withContext: fn arg is not a function: #{fn}"
      context = new ContextEntry(entry, contextVar.get())
      return contextVar.withValue(context, fn)


    resetContext = (fn) ->
      contextVar.withValue(null, fn)


    Context = {
      getContext
      resetContext
      withContext
    }

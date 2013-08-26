    Variable = (initialValue) ->

      value = initialValue
      dep = new Deps.Dependency()

      fn = ->
        dep.depend()
        return value

      fn.set = (newValue) ->
        unless EJSON.equals(newValue, value)
          value = newValue
          dep.changed()
        return

      return fn

    contains = (list, value) ->
      for item in list
        if EJSON.equals(item, value)
          return true
      return false

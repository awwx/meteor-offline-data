Offline._disableStartupForTesting = true


test = (Offline._test or= {})

test.beginTest = ->
  db = new Offline._SQLStore()
  db.eraseDatabase()
  .then(-> db.open())
  .then(-> db)

test.withTx = (db, fn, tests) ->
  db.transaction(fn)
  .then((value) ->
    if tests?
      return tests(value)
    else
      return value
  )

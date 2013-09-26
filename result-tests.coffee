{getContext, resetContext, withContext} = Context


Tinytest.addAsync 'result - complete', (test, onComplete) ->
  new Result().complete(3).callback (failed, value) ->
    test.isFalse failed
    test.equal value, 3
    onComplete()


Tinytest.addAsync 'result - join', (test, onComplete) ->
  r1 = Result.delay 10, 'one'
  r2 = Result.delay 20, 'two'
  r3 = Result.delay 30, 'three'
  Result.join([r1, r2, r3]).callback (failure, value) ->
    test.isFalse failure
    test.equal value, ['one', 'two', 'three']
    onComplete()

Tinytest.addAsync 'result - sequence', (test, onComplete) ->
  add3 = (x) -> Result.value(x + 3)
  add5 = (x) -> Result.value(x + 5)
  add7 = (x) -> Result.value(x + 7)
  Result.sequence(0, [add3, add5, add7]).callback (failure, value) ->
    test.isFalse failure
    test.equal value, 15
    onComplete()

Tinytest.addAsync 'result - context post complete', (test, onComplete) ->
  resetContext ->
    withContext 'abc', ->
      r = new Result()
      withContext 'def', ->
        r.callback (failed, value) ->
          test.isFalse failed
          test.equal getContext(), ['abc', 'def']
          onComplete()
          return
      withContext 'ghi', -> r.complete()
      return

Tinytest.addAsync 'result - context pre complete', (test, onComplete) ->
  resetContext ->
    withContext 'abc', ->
      r = new Result()
      withContext 'def', ->
        withContext 'ghi', -> r.complete()
        r.callback (failed, value) ->
          test.isFalse failed
          test.equal getContext(), ['abc', 'def']
          onComplete()
          return
        return

Tinytest.addAsync 'result - context post then', (test, onComplete) ->
  resetContext ->
    withContext 'abc', ->
      r1 = new Result()
      withContext 'def', ->
        r1.then(->
          test.equal getContext(), ['abc', 'def']
          onComplete()
        )
      withContext 'ghi', ->
       r1.complete()

Tinytest.addAsync 'result - context pre then', (test, onComplete) ->
  resetContext ->
    withContext 'abc', ->
      r1 = new Result()
      withContext 'ghi', ->
       r1.complete()
      withContext 'def', ->
        r1.then(->
          test.equal getContext(), ['abc', 'def']
          onComplete()
        )

Tinytest.addAsync 'result - context join pre complete', (test, onComplete) ->
  resetContext ->
    withContext 'c1', ->
      r1 = new Result()
      r2 = new Result()
      withContext 'c2', -> r1.complete()
      withContext 'c3', -> r2.complete()
      withContext 'c4', ->
        Result.join([r1, r2])
        .then(->
          test.equal getContext(), ['c1', 'c4']
          onComplete()
        )

Tinytest.addAsync 'result - context join post complete', (test, onComplete) ->
  resetContext ->
    withContext 'c1', ->
      r1 = new Result()
      r2 = new Result()
      withContext 'c4', ->
        Result.join([r1, r2])
        .then(->
          test.equal getContext(), ['c1', 'c4']
          onComplete()
        )
      withContext 'c2', -> r1.complete()
      withContext 'c3', -> r2.complete()

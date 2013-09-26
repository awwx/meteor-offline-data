{getContext, resetContext, withContext} = Context


Tinytest.add "context - synchronous", (test) ->
  withContext 'abc', ->
    test.equal getContext(), ['abc']

  withContext 'abc', ->
    test.equal getContext(), ['abc']
    withContext 'def', ->
      test.equal getContext(), ['abc', 'def']
    test.equal getContext(), ['abc']
  test.equal getContext(), []


Tinytest.addAsync "context - asynchronous", (test, onComplete) ->
  resetContext ->
    withContext 'abc', ->
      Meteor.setTimeout(
        (->
          test.equal getContext(), ['abc']
          onComplete()
        ),
        10
      )


Tinytest.addAsync "context - asynchronous nested", (test, onComplete) ->
  step2 = ->
    test.equal getContext(), ['abc', 'def']
    onComplete()

  step1 = ->
    test.equal getContext(), ['abc']
    withContext 'def', ->
      Meteor.setTimeout(step2, 10)

  resetContext ->
    withContext 'abc', ->
      Meteor.setTimeout(step1, 10)

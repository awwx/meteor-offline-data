Tinytest.add 'fanout - call', (test) ->
  fanout = new Fanout()

  oneCalled = false
  twoCalled = false

  fanout.listen (x) -> oneCalled = x
  fanout.listen (x) -> twoCalled = x

  fanout(123)

  test.equal oneCalled, 123
  test.equal twoCalled, 123

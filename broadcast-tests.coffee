broadcast = Offline._broadcast


# Note this test will fail if multiple browser windows are running the
# test at the same time.

Tinytest.addAsync "broadcast", (test, onComplete) ->
  broadcast.listen 'ready', (x, y) ->
    test.equal x, 3
    test.equal y, 4
    onComplete()

  broadcast 'ready', 3, 4

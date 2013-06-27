loaded = false
queue = []


Meteor.startup = (cb) ->
  if loaded
    cb()
  else
    queue.push(cb)
  return


Agent.start = ->
  while queue.length > 0
    (queue.shift())()
  loaded = true
  return

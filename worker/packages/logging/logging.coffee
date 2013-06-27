str = (x) ->
  if typeof x is 'string'
    x
  else
    JSON.stringify(x)

Meteor._debug = (args...) ->
  Agent.log(_.map(args, str).join(' '))

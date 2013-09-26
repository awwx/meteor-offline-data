str = (x) ->
  if typeof x is 'string'
    x
  else
    JSON.stringify(x)

zeropad = (n, s) ->
  while s.length < n
    s = '0' + s
  return s

time = ->
  d = new Date()
  return (
    zeropad(2, '' + d.getSeconds()) +
    '.' +
    zeropad(3, '' + d.getMilliseconds())
  )

Meteor._debug = (args...) ->
  WebWorker.log(time() + ': ' + _.map(args, str).join(' '))

Log = {}

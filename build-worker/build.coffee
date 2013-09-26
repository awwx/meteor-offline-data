fs = require 'fs'
path = require 'path'
join = path.join

debugMode = '--debug' in process.argv

# These are the packages we load in the shared web worker with
# `--debug`.

workerPackages = """
  underscore
  meteor
  deps
  json
  ejson
  logging
  reload
  check
  random
  ordered-dict
  minimongo
  livedata
  mongo-livedata
  canonical-stringify
  isolate-value
  variable
  offline-data
""".split(/\s/)


clientDir = path.join(__dirname, 'tests', 'bundle', 'programs', 'client')

if debugMode
  code = ''
  for packageName in workerPackages
    code += fs.readFileSync(
      join(clientDir, 'packages', packageName + '.js'),
      'utf8'
    )
else
  for filename in fs.readdirSync(clientDir)
    if path.extname(filename) is '.js'
      code = fs.readFileSync(join(clientDir, filename), 'utf8')

fs.writeFileSync('worker-packages.js', code);

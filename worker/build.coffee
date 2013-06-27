_ = require 'underscore'
fs = require 'fs'


# These are the packages we load in the shared web worker.

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
  livedata
  ordered-dict
  minimongo
  mongo-livedata
  startup
  canonical-stringify
  worker-agent
""".split(/\s/)

buildDir = __dirname + '/.meteor/local/build'

app = JSON.parse(
  fs.readFileSync(buildDir + '/app.json', 'utf-8')
)

manifest = app.manifest

startsWith = (s1, s2) ->
  s1.indexOf(s2) is 0

jsFilesInPackage = (packageName) ->
  entries = _.filter(
    manifest,
    (entry) ->
      (startsWith(entry.path, "static_cacheable/packages/#{packageName}/") and
       /\.js$/.test(entry.path))
  )
  unless entries.length > 0
    throw new Error("no manifest entries found for package: #{packageName}")
  return _.map(entries, (entry) -> entry.path)

jsFiles = _.flatten(
  (jsFilesInPackage(packageName) for packageName in workerPackages)
)

packageCode = ''
for filename in jsFiles
  contents = fs.readFileSync(buildDir + '/' + filename, 'utf-8')
  path = filename.substr("static_cacheable/".length)
  packageCode +=
    "\n\n\n" +
    "// ------------------------------------------------------------------------\n" +
    "// " + path + "\n\n" +
    contents

fs.writeFileSync('packages.javascript', packageCode);

    connect = Npm.require 'connect'
    bundle = __meteor_bootstrap__.bundle

    connect.static.mime.define 'application/javascript': ['javascript']

    hashFor = (path) ->
      _.find(bundle.manifest, (entry) -> entry.path is path)?.hash

    __meteor_runtime_config__.offlineDataWorker = {
      hashes: {
        boot: hashFor('static/packages/offline-data/worker/boot.javascript')
        packages: hashFor('static/packages/offline-data/worker/packages.javascript')
      }
    }

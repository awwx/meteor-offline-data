    files = [
      'worker-boot.js'
      'worker-packages.js'
    ]


Map filename to the file's url in the appcache manifest (which
includes the "cache busting" hash as the url's query parameter).

    urls = {}

    for file in files
      entry = _.find(
        WebApp.clientProgram.manifest,
        (entry) -> entry.url is "/packages/offline-data/#{file}"
      )
      unless entry?
        throw new Error("#{file} not found in WebApp.clientProgram.manifest")
      urls[file] = entry.url + "?" + entry.hash


Save in the runtime config delivered to the client, so the client
can look up the url to use.

    __meteor_runtime_config__.offlineDataWorker = {urls}

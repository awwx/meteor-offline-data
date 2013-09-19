Package.describe({
  summary: "offline data"
});


Package.on_use(function (api) {
  api.use(
    [
      'coffeescript',
      'livedata',
      'underscore',
      'offline-common'
    ],
    ['client', 'server']
  );

  api.use(
    [
      'ejson',
      'minimongo',
      'isolate-value',
      'canonical-stringify',
      'variable',
      'mongo-livedata'
    ],
    'client'
  );

  api.use(
    [
      'webapp'
    ],
    'server'
  );

  api.add_files([
    'worker-boot.js',
    'worker-packages.js'
  ], 'client', {isAsset: true});

  api.export('Offline', ['client', 'server']);

  api.add_files('worker-server.litcoffee', 'server');
  api.add_files('worker-client.litcoffee', 'client');

  api.add_files('proxy.litcoffee', 'client');
  api.add_files('fallback.litcoffee', 'client');

  api.add_files('server.litcoffee', 'server');
});

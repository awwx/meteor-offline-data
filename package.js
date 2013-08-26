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
      'variable'
    ],
    'client'
  );

  api.use(
    [
      'webapp'
    ],
    'server'
  );

  // Name these files with '.javascript' so that they get added as
  // static files instead of bundled with the JavaScript source code.

  api.add_files([
    'worker-boot.javascript',
    'worker-packages.javascript'
  ], 'client');

  api.export('Offline', ['client', 'server']);

  api.add_files('worker-server.litcoffee', 'server');
  api.add_files('worker-client.litcoffee', 'client');

  api.add_files('proxy.litcoffee', 'client');

  api.add_files('server.litcoffee', 'server');
});

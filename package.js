Package.describe({
  summary: "offline data"
});

Package.on_use(function (api) {
  api.use('coffeescript', ['client', 'server']);
  api.use('offline-common', ['client', 'server']);

  // As a hack, name these files with '.javascript' so that they
  // get added as static files instead of bundled with the JavaScript
  // source code.  TODO: use Asset when available.
  api.add_files([
    'worker-boot.javascript',
    'worker-packages.javascript'
  ], 'client');

  api.add_files('worker-server.litcoffee', 'server');
  api.add_files('worker-client.litcoffee', 'client');
  api.add_files('proxy.litcoffee', 'client');
  api.add_files('server.litcoffee', 'server');
});

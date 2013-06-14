Package.describe({
  summary: "offline data"
});

Package.on_use(function (api) {
  api.use('coffeescript', ['client', 'server']);

  api.use([
    'browser-msg',
    'canonical-stringify'
  ], 'client');

  api.add_files([
    'context.litcoffee',
    'error.litcoffee',
    'fanout.litcoffee',
    'result.litcoffee',
  ], ['client', 'server']);

  api.add_files([
    'broadcast.litcoffee',
    'contains.litcoffee',
    'database.litcoffee',
    'windows.litcoffee',
    'agent.litcoffee',
    'proxy.litcoffee'
  ], 'client');

  api.add_files('server.litcoffee', 'server');
});

Package.on_test(function(api) {
  api.use('offline-data');
  api.add_files([
    'context-tests.coffee',
    'fanout-tests.coffee',
    'result-tests.coffee'
  ], ['client', 'server']);
  api.add_files([
    'broadcast-tests.coffee',
    'test-helpers.coffee',
    'database-tests.coffee',
    'agent-tests.coffee'
  ], 'client');
});

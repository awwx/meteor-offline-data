Package.describe({
  summary: "offline data"
});


Package.on_use(function (api) {
  api.use(
    [
      'webapp'
    ],
    'server'
  );

  api.use(
    [
      'coffeescript',
      'ejson',
      'livedata',
      'underscore',
    ],
    ['client', 'server']
  );

  api.use(
    [
      'browser-msg',
      'canonical-stringify',
      'ejson',
      'isolate-value',
      'minimongo',
      'mongo-livedata',
      'random',
      'variable'
    ],
    'client'
  );

  api.add_files([
    'worker-boot.js',
    'worker-packages.js'
  ], 'client', {isAsset: true});

  api.export('Context', ['client', 'server'], {testOnly: true});
  api.add_files('context.litcoffee', ['client', 'server']);

  api.export('Errors', ['client', 'server'], {testOnly: true});
  api.add_files('errors.litcoffee', ['client', 'server']);

  api.export('Fanout', ['client', 'server'], {testOnly: true});
  api.add_files('fanout.litcoffee', ['client', 'server']);

  api.export('Result', ['client', 'server'], {testOnly: true});
  api.add_files('result.litcoffee', ['client', 'server']);

  api.export('contains', 'client', {testOnly:true});
  api.add_files('contains.litcoffee', 'client');

  api.export('Offline', ['client', 'server']);
  api.add_files('offline.litcoffee', ['client', 'server']);

  api.export('broadcast', 'client', {testOnly: true});
  api.add_files('broadcast.litcoffee', 'client');

  api.add_files(
    [
      'database.litcoffee',
      'windows.litcoffee',
      'model.litcoffee',
      'agent.litcoffee'
    ],
    'client'
  );

  api.add_files('worker-server.litcoffee', 'server');
  api.add_files('worker-client.litcoffee', 'client');

  api.add_files('proxy.litcoffee', 'client');
  api.add_files('fallback.litcoffee', 'client');

  api.add_files('server.litcoffee', 'server');
});

Package.on_test(function(api) {
  api.use(['coffeescript', 'ejson', 'tinytest', 'offline-data']);

  api.add_files(
    [
      'context-tests.coffee',
      'fanout-tests.coffee',
      'result-tests.coffee'
    ],
    ['client', 'server']
  );

  api.add_files(
    [
      'contains-tests.coffee',
      'test-helpers.coffee',
      'database-tests.coffee',
      'agent-tests.coffee'
    ],
    'client'
  );
});

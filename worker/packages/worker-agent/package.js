Package.describe({
  summary: "Code which runs inside the shared web worker"
});

Package.on_use(function (api) {
  api.use('coffeescript', 'client');
  api.add_files([
    'context.litcoffee',
    'error.litcoffee',
    'fanout.litcoffee',
    'result.litcoffee',
    'contains.litcoffee',
    'database.litcoffee',
    'windows.litcoffee',
    'agent.litcoffee',
  ], 'client');
});

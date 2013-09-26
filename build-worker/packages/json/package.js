Package.on_use(function (api) {
  // Node always has JSON; we only need this in some browsers.
  api.export('JSON', 'client');
  api.add_files('json_native.js', 'client');
});

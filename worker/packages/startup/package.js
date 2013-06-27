Package.describe({
  summary: "Meteor.startup in the shared web worker environment"
});

Package.on_use(function (api) {
  api.use('coffeescript');
  api.add_files('startup.coffee', 'client');
});

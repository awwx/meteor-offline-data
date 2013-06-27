Meteor._reload = {};

var old_data = {};

var providers = [];

////////// External API //////////

// Packages that support migration should register themselves by
// calling this function. When it's time to migrate, callback will
// be called with one argument, the "retry function." If the package
// is ready to migrate, it should return [true, data], where data is
// its migration data, an arbitrary JSON value (or [true] if it has
// no migration data this time). If the package needs more time
// before it is ready to migrate, it should return false. Then, once
// it is ready to migrating again, it should call the retry
// function. The retry function will return immediately, but will
// schedule the migration to be retried, meaning that every package
// will be polled once again for its migration data. If they are all
// ready this time, then the migration will happen. name must be set if there
// is migration data.
Meteor._reload.onMigrate = function (name, callback) {
  if (!callback) {
    // name not provided, so first arg is callback.
    callback = name;
    name = undefined;
  }
  providers.push({name: name, callback: callback});
};

// Called by packages when they start up.
// Returns the object that was saved, or undefined if none saved.
Meteor._reload.migrationData = function (name) {
  return old_data[name];
};

// Migrating reload: reload this page (presumably to pick up a new
// version of the code or assets), but save the program state and
// migrate it over. This function returns immediately. The reload
// will happen at some point in the future once all of the packages
// are ready to migrate.
var reloading = false;
Meteor._reload.reload = function () {
  if (reloading)
    return;
  reloading = true;

  Meteor._debug("*** reload request");
};

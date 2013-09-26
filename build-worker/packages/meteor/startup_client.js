var queue = [];
var loaded = false;

Meteor.startup = function (cb) {
  if (loaded)
    cb();
  else
    queue.push(cb);
};

Meteor._start = function () {
  while (queue.length > 0)
    (queue.shift())();
  loaded = true;
};

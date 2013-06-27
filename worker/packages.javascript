


// ------------------------------------------------------------------------
// packages/underscore/underscore.js

(function(){ //     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

}).call(this);



// ------------------------------------------------------------------------
// packages/meteor/client_environment.js

(function(){ Meteor = {
  isClient: true,
  isServer: false
};

if (typeof __meteor_runtime_config__ !== 'undefined' &&
    __meteor_runtime_config__ &&
    __meteor_runtime_config__.PUBLIC_SETTINGS) {
  Meteor.settings = { public: __meteor_runtime_config__.PUBLIC_SETTINGS };
}

}).call(this);



// ------------------------------------------------------------------------
// packages/meteor/helpers.js

(function(){ // XXX namespacing -- find a better home for these?

if (__meteor_runtime_config__.meteorRelease)
  Meteor.release = __meteor_runtime_config__.meteorRelease;

_.extend(Meteor, {
  // _get(a,b,c,d) returns a[b][c][d], or else undefined if a[b] or
  // a[b][c] doesn't exist.
  _get: function (obj /*, arguments */) {
    for (var i = 1; i < arguments.length; i++) {
      if (!(arguments[i] in obj))
        return undefined;
      obj = obj[arguments[i]];
    }
    return obj;
  },

  // _ensure(a,b,c,d) ensures that a[b][c][d] exists. If it does not,
  // it is created and set to {}. Either way, it is returned.
  _ensure: function (obj /*, arguments */) {
    for (var i = 1; i < arguments.length; i++) {
      var key = arguments[i];
      if (!(key in obj))
        obj[key] = {};
      obj = obj[key];
    }

    return obj;
  },

  // _delete(a, b, c, d) deletes a[b][c][d], then a[b][c] unless it
  // isn't empty, then a[b] unless it isn't empty.
  _delete: function (obj /*, arguments */) {
    var stack = [obj];
    var leaf = true;
    for (var i = 1; i < arguments.length - 1; i++) {
      var key = arguments[i];
      if (!(key in obj)) {
        leaf = false;
        break;
      }
      obj = obj[key];
      if (typeof obj !== "object")
        break;
      stack.push(obj);
    }

    for (var i = stack.length - 1; i >= 0; i--) {
      var key = arguments[i+1];

      if (leaf)
        leaf = false;
      else
        for (var other in stack[i][key])
          return; // not empty -- we're done

      delete stack[i][key];
    }
  }
});

}).call(this);



// ------------------------------------------------------------------------
// packages/meteor/setimmediate.js

(function(){ // Chooses one of three setImmediate implementations:
//
// * Native setImmediate (IE 10, Node 0.9+)
//
// * postMessage (many browsers)
//
// * setTimeout  (fallback)
//
// The postMessage implementation is based on
// https://github.com/NobleJS/setImmediate/tree/1.0.1
//
// Don't use `nextTick` for Node since it runs its callbacks before
// I/O, which is stricter than we're looking for.
//
// Not installed as a polyfill, as our public API is `Meteor.defer`.
// Since we're not trying to be a polyfill, we have some
// simplifications:
//
// If one invocation of a setImmediate callback pauses itself by a
// call to alert/prompt/showModelDialog, the NobleJS polyfill
// implementation ensured that no setImmedate callback would run until
// the first invocation completed.  While correct per the spec, what it
// would mean for us in practice is that any reactive updates relying
// on Meteor.defer would be hung in the main window until the modal
// dialog was dismissed.  Thus we only ensure that a setImmediate
// function is called in a later event loop.
//
// We don't need to support using a string to be eval'ed for the
// callback, arguments to the function, or clearImmediate.

"use strict";

var global = this;


// IE 10, Node >= 9.1

function useSetImmediate() {
  if (! global.setImmediate)
    return null;
  else {
    var setImmediate = function (fn) {
      global.setImmediate(fn);
    };
    setImmediate.implementation = 'setImmediate';
    return setImmediate;
  }
}


// Android 2.3.6, Chrome 26, Firefox 20, IE 8-9, iOS 5.1.1 Safari

function usePostMessage() {
  // The test against `importScripts` prevents this implementation
  // from being installed inside a web worker, where
  // `global.postMessage` means something completely different and
  // can't be used for this purpose.

  if (!global.postMessage || global.importScripts) {
    return null;
  }

  // Avoid synchronous post message implementations.

  var postMessageIsAsynchronous = true;
  var oldOnMessage = global.onmessage;
  global.onmessage = function () {
      postMessageIsAsynchronous = false;
  };
  global.postMessage("", "*");
  global.onmessage = oldOnMessage;

  if (! postMessageIsAsynchronous)
    return null;

  var funcIndex = 0;
  var funcs = {};

  // Installs an event handler on `global` for the `message` event: see
  // * https://developer.mozilla.org/en/DOM/window.postMessage
  // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

  // XXX use Random.id() here?
  var MESSAGE_PREFIX = "Meteor._setImmediate." + Math.random() + '.';

  function isStringAndStartsWith(string, putativeStart) {
    return (typeof string === "string" &&
            string.substring(0, putativeStart.length) === putativeStart);
  }

  function onGlobalMessage(event) {
    // This will catch all incoming messages (even from other
    // windows!), so we need to try reasonably hard to avoid letting
    // anyone else trick us into firing off. We test the origin is
    // still this window, and that a (randomly generated)
    // unpredictable identifying prefix is present.
    if (event.source === global &&
        isStringAndStartsWith(event.data, MESSAGE_PREFIX)) {
      var index = event.data.substring(MESSAGE_PREFIX.length);
      try {
        if (funcs[index])
          funcs[index]();
      }
      finally {
        delete funcs[index];
      }
    }
  }

  if (global.addEventListener) {
    global.addEventListener("message", onGlobalMessage, false);
  } else {
    global.attachEvent("onmessage", onGlobalMessage);
  }

  var setImmediate = function (fn) {
    // Make `global` post a message to itself with the handle and
    // identifying prefix, thus asynchronously invoking our
    // onGlobalMessage listener above.
    ++funcIndex;
    funcs[funcIndex] = fn;
    global.postMessage(MESSAGE_PREFIX + funcIndex, "*");
  };
  setImmediate.implementation = 'postMessage';
  return setImmediate;
}


function useTimeout() {
  var setImmediate = function (fn) {
    global.setTimeout(fn, 0);
  };
  setImmediate.implementation = 'setTimeout';
  return setImmediate;
}


Meteor._setImmediate =
  useSetImmediate() ||
  usePostMessage() ||
  useTimeout();

}).call(this);



// ------------------------------------------------------------------------
// packages/meteor/timers.js

(function(){ var withoutInvocation = function (f) {
  if (Meteor._CurrentInvocation) {
    if (Meteor._CurrentInvocation.get() && Meteor._CurrentInvocation.get().isSimulation)
      throw new Error("Can't set timers inside simulations");
    return function () { Meteor._CurrentInvocation.withValue(null, f); };
  }
  else
    return f;
};

var bindAndCatch = function (context, f) {
  return Meteor.bindEnvironment(withoutInvocation(f), function (e) {
    // XXX report nicely (or, should we catch it at all?)
    Meteor._debug("Exception from " + context + ":", e);
  });
};

_.extend(Meteor, {
  // Meteor.setTimeout and Meteor.setInterval callbacks scheduled
  // inside a server method are not part of the method invocation and
  // should clear out the CurrentInvocation environment variable.

  setTimeout: function (f, duration) {
    return setTimeout(bindAndCatch("setTimeout callback", f), duration);
  },

  setInterval: function (f, duration) {
    return setInterval(bindAndCatch("setInterval callback", f), duration);
  },

  clearInterval: function(x) {
    return clearInterval(x);
  },

  clearTimeout: function(x) {
    return clearTimeout(x);
  },

  // XXX consider making this guarantee ordering of defer'd callbacks, like
  // Deps.afterFlush or Node's nextTick (in practice). Then tests can do:
  //    callSomethingThatDefersSomeWork();
  //    Meteor.defer(expect(somethingThatValidatesThatTheWorkHappened));
  defer: function (f) {
    Meteor._setImmediate(bindAndCatch("defer callback", f));
  }
});

}).call(this);



// ------------------------------------------------------------------------
// packages/meteor/errors.js

(function(){ // http://davidshariff.com/blog/javascript-inheritance-patterns/
var inherits = function (child, parent) {
  var tmp = function () {};
  tmp.prototype = parent.prototype;
  child.prototype = new tmp;
  child.prototype.constructor = child;
};

// Makes an error subclass which properly contains a stack trace in most
// environments. constructor can set fields on `this` (and should probably set
// `message`, which is what gets displayed at the top of a stack trace).
Meteor.makeErrorType = function (name, constructor) {
  var errorClass = function (/*arguments*/) {
    var self = this;

    // Ensure we get a proper stack trace in most Javascript environments
    if (Error.captureStackTrace) {
      // V8 environments (Chrome and Node.js)
      Error.captureStackTrace(self, errorClass);
    } else {
      // Firefox
      var e = new Error;
      e.__proto__ = errorClass.prototype;
      if (e instanceof errorClass)
        self = e;
    }
    // Safari magically works.

    constructor.apply(self, arguments);

    self.errorType = name;

    return self;
  };

  inherits(errorClass, Error);

  return errorClass;
};

}).call(this);



// ------------------------------------------------------------------------
// packages/meteor/fiber_stubs_client.js

(function(){ // This file is a partial analogue to fiber_helpers.js, which allows the client
// to use a queue too, and also to call noYieldsAllowed.

// The client has no ability to yield, so noYieldsAllowed is a noop.
Meteor._noYieldsAllowed = function (f) {
  return f();
};

// An even simpler queue of tasks than the fiber-enabled one.  This one just
// runs all the tasks when you call runTask or flush, synchronously.
Meteor._SynchronousQueue = function () {
  var self = this;
  self._tasks = [];
  self._running = false;
};

_.extend(Meteor._SynchronousQueue.prototype, {
  runTask: function (task) {
    var self = this;
    if (!self.safeToRunTask())
      throw new Error("Could not synchronously run a task from a running task");
    self._tasks.push(task);
    var tasks = self._tasks;
    self._tasks = [];
    self._running = true;
    try {
      while (!_.isEmpty(tasks)) {
        var t = tasks.shift();
        try {
          t();
        } catch (e) {
          if (_.isEmpty(tasks)) {
            // this was the last task, that is, the one we're calling runTask
            // for.
            throw e;
          } else {
            Meteor._debug("Exception in queued task: " + e.stack);
          }
        }
      }
    } finally {
      self._running = false;
    }
  },

  queueTask: function (task) {
    var self = this;
    var wasEmpty = _.isEmpty(self._tasks);
    self._tasks.push(task);
    // Intentionally not using Meteor.setTimeout, because it doesn't like runing
    // in stubs for now.
    if (wasEmpty)
      setTimeout(_.bind(self.flush, self), 0);
  },

  flush: function () {
    var self = this;
    self.runTask(function () {});
  },

  drain: function () {
    var self = this;
    if (!self.safeToRunTask())
      return;
    while (!_.isEmpty(self._tasks)) {
      self.flush();
    }
  },

  safeToRunTask: function () {
    var self = this;
    return !self._running;
  }
});

}).call(this);



// ------------------------------------------------------------------------
// packages/meteor/dynamics_browser.js

(function(){ // Simple implementation of dynamic scoping, for use in browsers

var nextSlot = 0;
var currentValues = [];

Meteor.EnvironmentVariable = function () {
  this.slot = nextSlot++;
};

_.extend(Meteor.EnvironmentVariable.prototype, {
  get: function () {
    return currentValues[this.slot];
  },

  withValue: function (value, func) {
    var saved = currentValues[this.slot];
    try {
      currentValues[this.slot] = value;
      var ret = func();
    } finally {
      currentValues[this.slot] = saved;
    }
    return ret;
  }
});

Meteor.bindEnvironment = function (func, onException, _this) {
  // needed in order to be able to create closures inside func and
  // have the closed variables not change back to their original
  // values
  var boundValues = _.clone(currentValues);

  if (!onException)
    throw new Error("onException must be supplied");

  return function (/* arguments */) {
    var savedValues = currentValues;
    try {
      currentValues = boundValues;
      var ret = func.apply(_this, _.toArray(arguments));
    } catch (e) {
      onException(e);
    } finally {
      currentValues = savedValues;
    }
    return ret;
  };
};

}).call(this);



// ------------------------------------------------------------------------
// packages/meteor/url_common.js

(function(){ Meteor.absoluteUrl = function (path, options) {
  // path is optional
  if (!options && typeof path === 'object') {
    options = path;
    path = undefined;
  }
  // merge options with defaults
  options = _.extend({}, Meteor.absoluteUrl.defaultOptions, options || {});

  var url = options.rootUrl;
  if (!url)
    throw new Error("Must pass options.rootUrl or set ROOT_URL in the server environment");

  if (!/^http[s]?:\/\//i.test(url)) // url starts with 'http://' or 'https://'
    url = 'http://' + url; // we will later fix to https if options.secure is set

  if (!/\/$/.test(url)) // url ends with '/'
    url += '/';

  if (path)
    url += path;

  // turn http to http if secure option is set, and we're not talking
  // to localhost.
  if (options.secure &&
      /^http:/.test(url) && // url starts with 'http:'
      !/http:\/\/localhost[:\/]/.test(url) && // doesn't match localhost
      !/http:\/\/127\.0\.0\.1[:\/]/.test(url)) // or 127.0.0.1
    url = url.replace(/^http:/, 'https:');

  if (options.replaceLocalhost)
    url = url.replace(/^http:\/\/localhost([:\/].*)/, 'http://127.0.0.1$1');

  return url;
};

// allow later packages to override default options
Meteor.absoluteUrl.defaultOptions = { };
if (__meteor_runtime_config__ && __meteor_runtime_config__.ROOT_URL)
  Meteor.absoluteUrl.defaultOptions.rootUrl = __meteor_runtime_config__.ROOT_URL;

}).call(this);



// ------------------------------------------------------------------------
// packages/deps/deps.js

(function(){ Deps = {};
Deps.active = false;
Deps.currentComputation = null;

var setCurrentComputation = function (c) {
  Deps.currentComputation = c;
  Deps.active = !! c;
};

var _debugFunc = function () {
  // lazy evaluation because `Meteor` does not exist right away
  return (typeof Meteor !== "undefined" ? Meteor._debug :
          ((typeof console !== "undefined") && console.log ? console.log :
           function () {}));
};

var nextId = 1;
// computations whose callbacks we should call at flush time
var pendingComputations = [];
// `true` if a Deps.flush is scheduled, or if we are in Deps.flush now
var willFlush = false;
// `true` if we are in Deps.flush now
var inFlush = false;
// `true` if we are computing a computation now, either first time
// or recompute.  This matches Deps.active unless we are inside
// Deps.nonreactive, which nullfies currentComputation even though
// an enclosing computation may still be running.
var inCompute = false;

var afterFlushCallbacks = [];

var requireFlush = function () {
  if (! willFlush) {
    setTimeout(Deps.flush, 0);
    willFlush = true;
  }
};

// Deps.Computation constructor is visible but private
// (throws an error if you try to call it)
var constructingComputation = false;

Deps.Computation = function (f, parent) {
  if (! constructingComputation)
    throw new Error(
      "Deps.Computation constructor is private; use Deps.autorun");
  constructingComputation = false;

  var self = this;
  self.stopped = false;
  self.invalidated = false;
  self.firstRun = true;

  self._id = nextId++;
  self._onInvalidateCallbacks = [];
  // the plan is at some point to use the parent relation
  // to constrain the order that computations are processed
  self._parent = parent;
  self._func = f;
  self._recomputing = false;

  var errored = true;
  try {
    self._compute();
    errored = false;
  } finally {
    self.firstRun = false;
    if (errored)
      self.stop();
  }
};

_.extend(Deps.Computation.prototype, {

  onInvalidate: function (f) {
    var self = this;

    if (typeof f !== 'function')
      throw new Error("onInvalidate requires a function");

    var g = function () {
      Deps.nonreactive(function () {
        f(self);
      });
    };

    if (self.invalidated)
      g();
    else
      self._onInvalidateCallbacks.push(g);
  },

  invalidate: function () {
    var self = this;
    if (! self.invalidated) {
      // if we're currently in _recompute(), don't enqueue
      // ourselves, since we'll rerun immediately anyway.
      if (! self._recomputing && ! self.stopped) {
        requireFlush();
        pendingComputations.push(this);
      }

      self.invalidated = true;

      // callbacks can't add callbacks, because
      // self.invalidated === true.
      for(var i = 0, f; f = self._onInvalidateCallbacks[i]; i++)
        f(); // already bound with self as argument
      self._onInvalidateCallbacks = [];
    }
  },

  stop: function () {
    if (! this.stopped) {
      this.stopped = true;
      this.invalidate();
    }
  },

  _compute: function () {
    var self = this;
    self.invalidated = false;

    var previous = Deps.currentComputation;
    setCurrentComputation(self);
    var previousInCompute = inCompute;
    inCompute = true;
    try {
      self._func(self);
    } finally {
      setCurrentComputation(previous);
      inCompute = false;
    }
  },

  _recompute: function () {
    var self = this;

    self._recomputing = true;
    while (self.invalidated && ! self.stopped) {
      try {
        self._compute();
      } catch (e) {
        _debugFunc()("Exception from Deps recompute:", e.stack || e.message);
      }
      // If _compute() invalidated us, we run again immediately.
      // A computation that invalidates itself indefinitely is an
      // infinite loop, of course.
      //
      // We could put an iteration counter here and catch run-away
      // loops.
    }
    self._recomputing = false;
  }
});

Deps.Dependency = function () {
  this._dependentsById = {};
};

_.extend(Deps.Dependency.prototype, {
  // Adds `computation` to this set if it is not already
  // present.  Returns true if `computation` is a new member of the set.
  // If no argument, defaults to currentComputation, or does nothing
  // if there is no currentComputation.
  depend: function (computation) {
    if (! computation) {
      if (! Deps.active)
        return false;

      computation = Deps.currentComputation;
    }
    var self = this;
    var id = computation._id;
    if (! (id in self._dependentsById)) {
      self._dependentsById[id] = computation;
      computation.onInvalidate(function () {
        delete self._dependentsById[id];
      });
      return true;
    }
    return false;
  },
  changed: function () {
    var self = this;
    for (var id in self._dependentsById)
      self._dependentsById[id].invalidate();
  },
  hasDependents: function () {
    var self = this;
    for(var id in self._dependentsById)
      return true;
    return false;
  }
});

_.extend(Deps, {
  flush: function () {
    // Nested flush could plausibly happen if, say, a flush causes
    // DOM mutation, which causes a "blur" event, which runs an
    // app event handler that calls Deps.flush.  At the moment
    // Spark blocks event handlers during DOM mutation anyway,
    // because the LiveRange tree isn't valid.  And we don't have
    // any useful notion of a nested flush.
    //
    // https://app.asana.com/0/159908330244/385138233856
    if (inFlush)
      throw new Error("Can't call Deps.flush while flushing");

    if (inCompute)
      throw new Error("Can't flush inside Deps.autorun");

    inFlush = true;
    willFlush = true;

    while (pendingComputations.length ||
           afterFlushCallbacks.length) {

      // recompute all pending computations
      var comps = pendingComputations;
      pendingComputations = [];

      for (var i = 0, comp; comp = comps[i]; i++)
        comp._recompute();

      if (afterFlushCallbacks.length) {
        // call one afterFlush callback, which may
        // invalidate more computations
        var func = afterFlushCallbacks.shift();
        try {
          func();
        } catch (e) {
          _debugFunc()("Exception from Deps afterFlush function:",
                       e.stack || e.message);
        }
      }
    }

    inFlush = false;
    willFlush = false;
  },

  // Run f(). Record its dependencies. Rerun it whenever the
  // dependencies change.
  //
  // Returns a new Computation, which is also passed to f.
  //
  // Links the computation to the current computation
  // so that it is stopped if the current computation is invalidated.
  autorun: function (f) {
    if (typeof f !== 'function')
      throw new Error('Deps.autorun requires a function argument');

    constructingComputation = true;
    var c = new Deps.Computation(f, Deps.currentComputation);

    if (Deps.active)
      Deps.onInvalidate(function () {
        c.stop();
      });

    return c;
  },

  // Run `f` with no current computation, returning the return value
  // of `f`.  Used to turn off reactivity for the duration of `f`,
  // so that reactive data sources accessed by `f` will not result in any
  // computations being invalidated.
  nonreactive: function (f) {
    var previous = Deps.currentComputation;
    setCurrentComputation(null);
    try {
      return f();
    } finally {
      setCurrentComputation(previous);
    }
  },

  // Wrap `f` so that it is always run nonreactively.
  _makeNonreactive: function (f) {
    if (f.$isNonreactive) // avoid multiple layers of wrapping.
      return f;
    var nonreactiveVersion = function (/*arguments*/) {
      var self = this;
      var args = _.toArray(arguments);
      var ret;
      Deps.nonreactive(function () {
        ret = f.apply(self, args);
      });
      return ret;
    };
    nonreactiveVersion.$isNonreactive = true;
    return nonreactiveVersion;
  },

  onInvalidate: function (f) {
    if (! Deps.active)
      throw new Error("Deps.onInvalidate requires a currentComputation");

    Deps.currentComputation.onInvalidate(f);
  },

  afterFlush: function (f) {
    afterFlushCallbacks.push(f);
    requireFlush();
  }
});

}).call(this);



// ------------------------------------------------------------------------
// packages/json/json2.js

(function(){ /*
    json2.js
    2012-10-08

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

}).call(this);



// ------------------------------------------------------------------------
// packages/ejson/ejson.js

(function(){ EJSON = {}; // Global!
var customTypes = {};
// Add a custom type, using a method of your choice to get to and
// from a basic JSON-able representation.  The factory argument
// is a function of JSON-able --> your object
// The type you add must have:
// - A clone() method, so that Meteor can deep-copy it when necessary.
// - A equals() method, so that Meteor can compare it
// - A toJSONValue() method, so that Meteor can serialize it
// - a typeName() method, to show how to look it up in our type table.
// It is okay if these methods are monkey-patched on.
EJSON.addType = function (name, factory) {
  if (_.has(customTypes, name))
    throw new Error("Type " + name + " already present");
  customTypes[name] = factory;
};

var builtinConverters = [
  { // Date
    matchJSONValue: function (obj) {
      return _.has(obj, '$date') && _.size(obj) === 1;
    },
    matchObject: function (obj) {
      return obj instanceof Date;
    },
    toJSONValue: function (obj) {
      return {$date: obj.getTime()};
    },
    fromJSONValue: function (obj) {
      return new Date(obj.$date);
    }
  },
  { // Binary
    matchJSONValue: function (obj) {
      return _.has(obj, '$binary') && _.size(obj) === 1;
    },
    matchObject: function (obj) {
      return typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array
        || (obj && _.has(obj, '$Uint8ArrayPolyfill'));
    },
    toJSONValue: function (obj) {
      return {$binary: EJSON._base64Encode(obj)};
    },
    fromJSONValue: function (obj) {
      return EJSON._base64Decode(obj.$binary);
    }
  },
  { // Escaping one level
    matchJSONValue: function (obj) {
      return _.has(obj, '$escape') && _.size(obj) === 1;
    },
    matchObject: function (obj) {
      if (_.isEmpty(obj) || _.size(obj) > 2) {
        return false;
      }
      return _.any(builtinConverters, function (converter) {
        return converter.matchJSONValue(obj);
      });
    },
    toJSONValue: function (obj) {
      var newObj = {};
      _.each(obj, function (value, key) {
        newObj[key] = EJSON.toJSONValue(value);
      });
      return {$escape: newObj};
    },
    fromJSONValue: function (obj) {
      var newObj = {};
      _.each(obj.$escape, function (value, key) {
        newObj[key] = EJSON.fromJSONValue(value);
      });
      return newObj;
    }
  },
  { // Custom
    matchJSONValue: function (obj) {
      return _.has(obj, '$type') && _.has(obj, '$value') && _.size(obj) === 2;
    },
    matchObject: function (obj) {
      return EJSON._isCustomType(obj);
    },
    toJSONValue: function (obj) {
      return {$type: obj.typeName(), $value: obj.toJSONValue()};
    },
    fromJSONValue: function (obj) {
      var typeName = obj.$type;
      var converter = customTypes[typeName];
      return converter(obj.$value);
    }
  }
];

EJSON._isCustomType = function (obj) {
  return obj &&
    typeof obj.toJSONValue === 'function' &&
    typeof obj.typeName === 'function' &&
    _.has(customTypes, obj.typeName());
};


//for both arrays and objects, in-place modification.
var adjustTypesToJSONValue =
EJSON._adjustTypesToJSONValue = function (obj) {
  if (obj === null)
    return null;
  var maybeChanged = toJSONValueHelper(obj);
  if (maybeChanged !== undefined)
    return maybeChanged;
  _.each(obj, function (value, key) {
    if (typeof value !== 'object' && value !== undefined)
      return; // continue
    var changed = toJSONValueHelper(value);
    if (changed) {
      obj[key] = changed;
      return; // on to the next key
    }
    // if we get here, value is an object but not adjustable
    // at this level.  recurse.
    adjustTypesToJSONValue(value);
  });
  return obj;
};

// Either return the JSON-compatible version of the argument, or undefined (if
// the item isn't itself replaceable, but maybe some fields in it are)
var toJSONValueHelper = function (item) {
  for (var i = 0; i < builtinConverters.length; i++) {
    var converter = builtinConverters[i];
    if (converter.matchObject(item)) {
      return converter.toJSONValue(item);
    }
  }
  return undefined;
};

EJSON.toJSONValue = function (item) {
  var changed = toJSONValueHelper(item);
  if (changed !== undefined)
    return changed;
  if (typeof item === 'object') {
    item = EJSON.clone(item);
    adjustTypesToJSONValue(item);
  }
  return item;
};

//for both arrays and objects. Tries its best to just
// use the object you hand it, but may return something
// different if the object you hand it itself needs changing.
var adjustTypesFromJSONValue =
EJSON._adjustTypesFromJSONValue = function (obj) {
  if (obj === null)
    return null;
  var maybeChanged = fromJSONValueHelper(obj);
  if (maybeChanged !== obj)
    return maybeChanged;
  _.each(obj, function (value, key) {
    if (typeof value === 'object') {
      var changed = fromJSONValueHelper(value);
      if (value !== changed) {
        obj[key] = changed;
        return;
      }
      // if we get here, value is an object but not adjustable
      // at this level.  recurse.
      adjustTypesFromJSONValue(value);
    }
  });
  return obj;
};

// Either return the argument changed to have the non-json
// rep of itself (the Object version) or the argument itself.

// DOES NOT RECURSE.  For actually getting the fully-changed value, use
// EJSON.fromJSONValue
var fromJSONValueHelper = function (value) {
  if (typeof value === 'object' && value !== null) {
    if (_.size(value) <= 2
        && _.all(value, function (v, k) {
          return typeof k === 'string' && k.substr(0, 1) === '$';
        })) {
      for (var i = 0; i < builtinConverters.length; i++) {
        var converter = builtinConverters[i];
        if (converter.matchJSONValue(value)) {
          return converter.fromJSONValue(value);
        }
      }
    }
  }
  return value;
};

EJSON.fromJSONValue = function (item) {
  var changed = fromJSONValueHelper(item);
  if (changed === item && typeof item === 'object') {
    item = EJSON.clone(item);
    adjustTypesFromJSONValue(item);
    return item;
  } else {
    return changed;
  }
};

EJSON.stringify = function (item) {
  return JSON.stringify(EJSON.toJSONValue(item));
};

EJSON.parse = function (item) {
  return EJSON.fromJSONValue(JSON.parse(item));
};

EJSON.isBinary = function (obj) {
  return !!((typeof Uint8Array !== 'undefined' && obj instanceof Uint8Array) ||
    (obj && obj.$Uint8ArrayPolyfill));
};

EJSON.equals = function (a, b, options) {
  var i;
  var keyOrderSensitive = !!(options && options.keyOrderSensitive);
  if (a === b)
    return true;
  if (!a || !b) // if either one is falsy, they'd have to be === to be equal
    return false;
  if (!(typeof a === 'object' && typeof b === 'object'))
    return false;
  if (a instanceof Date && b instanceof Date)
    return a.valueOf() === b.valueOf();
  if (EJSON.isBinary(a) && EJSON.isBinary(b)) {
    if (a.length !== b.length)
      return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i])
        return false;
    }
    return true;
  }
  if (typeof (a.equals) === 'function')
    return a.equals(b, options);
  if (a instanceof Array) {
    if (!(b instanceof Array))
      return false;
    if (a.length !== b.length)
      return false;
    for (i = 0; i < a.length; i++) {
      if (!EJSON.equals(a[i], b[i], options))
        return false;
    }
    return true;
  }
  // fall back to structural equality of objects
  var ret;
  if (keyOrderSensitive) {
    var bKeys = [];
    _.each(b, function (val, x) {
        bKeys.push(x);
    });
    i = 0;
    ret = _.all(a, function (val, x) {
      if (i >= bKeys.length) {
        return false;
      }
      if (x !== bKeys[i]) {
        return false;
      }
      if (!EJSON.equals(val, b[bKeys[i]], options)) {
        return false;
      }
      i++;
      return true;
    });
    return ret && i === bKeys.length;
  } else {
    i = 0;
    ret = _.all(a, function (val, key) {
      if (!_.has(b, key)) {
        return false;
      }
      if (!EJSON.equals(val, b[key], options)) {
        return false;
      }
      i++;
      return true;
    });
    return ret && _.size(b) === i;
  }
};

EJSON.clone = function (v) {
  var ret;
  if (typeof v !== "object")
    return v;
  if (v === null)
    return null; // null has typeof "object"
  if (v instanceof Date)
    return new Date(v.getTime());
  if (EJSON.isBinary(v)) {
    ret = EJSON.newBinary(v.length);
    for (var i = 0; i < v.length; i++) {
      ret[i] = v[i];
    }
    return ret;
  }
  if (_.isArray(v) || _.isArguments(v)) {
    // For some reason, _.map doesn't work in this context on Opera (weird test
    // failures).
    ret = [];
    for (i = 0; i < v.length; i++)
      ret[i] = EJSON.clone(v[i]);
    return ret;
  }
  // handle general user-defined typed Objects if they have a clone method
  if (typeof v.clone === 'function') {
    return v.clone();
  }
  // handle other objects
  ret = {};
  _.each(v, function (value, key) {
    ret[key] = EJSON.clone(value);
  });
  return ret;
};

}).call(this);



// ------------------------------------------------------------------------
// packages/ejson/base64.js

(function(){ // Base 64 encoding

var BASE_64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

var BASE_64_VALS = {};

for (var i = 0; i < BASE_64_CHARS.length; i++) {
  BASE_64_VALS[BASE_64_CHARS.charAt(i)] = i;
};

EJSON._base64Encode = function (array) {
  var answer = [];
  var a = null;
  var b = null;
  var c = null;
  var d = null;
  for (var i = 0; i < array.length; i++) {
    switch (i % 3) {
    case 0:
      a = (array[i] >> 2) & 0x3F;
      b = (array[i] & 0x03) << 4;
      break;
    case 1:
      b = b | (array[i] >> 4) & 0xF;
      c = (array[i] & 0xF) << 2;
      break;
    case 2:
      c = c | (array[i] >> 6) & 0x03;
      d = array[i] & 0x3F;
      answer.push(getChar(a));
      answer.push(getChar(b));
      answer.push(getChar(c));
      answer.push(getChar(d));
      a = null;
      b = null;
      c = null;
      d = null;
      break;
    }
  }
  if (a != null) {
    answer.push(getChar(a));
    answer.push(getChar(b));
    if (c == null)
      answer.push('=');
    else
      answer.push(getChar(c));
    if (d == null)
      answer.push('=');
  }
  return answer.join("");
};

var getChar = function (val) {
  return BASE_64_CHARS.charAt(val);
};

var getVal = function (ch) {
  if (ch === '=') {
    return -1;
  }
  return BASE_64_VALS[ch];
};

EJSON.newBinary = function (len) {
  if (typeof Uint8Array === 'undefined' || typeof ArrayBuffer === 'undefined') {
    var ret = [];
    for (var i = 0; i < len; i++) {
      ret.push(0);
    }
    ret.$Uint8ArrayPolyfill = true;
    return ret;
  }
  return new Uint8Array(new ArrayBuffer(len));
};

EJSON._base64Decode = function (str) {
  var len = Math.floor((str.length*3)/4);
  if (str.charAt(str.length - 1) == '=') {
    len--;
    if (str.charAt(str.length - 2) == '=')
      len--;
  }
  var arr = EJSON.newBinary(len);

  var one = null;
  var two = null;
  var three = null;

  var j = 0;

  for (var i = 0; i < str.length; i++) {
    var c = str.charAt(i);
    var v = getVal(c);
    switch (i % 4) {
    case 0:
      if (v < 0)
        throw new Error('invalid base64 string');
      one = v << 2;
      break;
    case 1:
      if (v < 0)
        throw new Error('invalid base64 string');
      one = one | (v >> 4);
      arr[j++] = one;
      two = (v & 0x0F) << 4;
      break;
    case 2:
      if (v >= 0) {
        two = two | (v >> 2);
        arr[j++] = two;
        three = (v & 0x03) << 6;
      }
      break;
    case 3:
      if (v >= 0) {
        arr[j++] = three | v;
      }
      break;
    }
  }
  return arr;
};

}).call(this);



// ------------------------------------------------------------------------
// packages/logging/logging.coffee.js

(function(){ var str,
  __slice = [].slice;

str = function(x) {
  if (typeof x === 'string') {
    return x;
  } else {
    return JSON.stringify(x);
  }
};

Meteor._debug = function() {
  var args;

  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  return Agent.log(_.map(args, str).join(' '));
};

}).call(this);



// ------------------------------------------------------------------------
// packages/reload/reload.js

(function(){ Meteor._reload = {};

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

}).call(this);



// ------------------------------------------------------------------------
// packages/check/match.js

(function(){ // XXX docs
// XXX on linker branch, export Match and check

// Things we explicitly do NOT support:
//    - heterogenous arrays

var currentArgumentChecker = new Meteor.EnvironmentVariable;

check = function (value, pattern) {
  // Record that check got called, if somebody cared.
  var argChecker = currentArgumentChecker.get();
  if (argChecker)
    argChecker.checking(value);
  checkSubtree(value, pattern);
};

Match = {
  Optional: function (pattern) {
    return new Optional(pattern);
  },
  OneOf: function (/*arguments*/) {
    return new OneOf(_.toArray(arguments));
  },
  Any: ['__any__'],
  Where: function (condition) {
    return new Where(condition);
  },
  ObjectIncluding: function (pattern) {
    return new ObjectIncluding(pattern);
  },

  // XXX should we record the path down the tree in the error message?
  // XXX matchers should know how to describe themselves for errors
  Error: Meteor.makeErrorType("Match.Error", function (msg) {
    this.message = "Match error: " + msg;
    // If this gets sent over DDP, don't give full internal details but at least
    // provide something better than 500 Internal server error.
    this.sanitizedError = new Meteor.Error(400, "Match failed");
  }),

  // Tests to see if value matches pattern. Unlike check, it merely returns true
  // or false (unless an error other than Match.Error was thrown). It does not
  // interact with _failIfArgumentsAreNotAllChecked.
  // XXX maybe also implement a Match.match which returns more information about
  //     failures but without using exception handling or doing what check()
  //     does with _failIfArgumentsAreNotAllChecked and Meteor.Error conversion
  test: function (value, pattern) {
    try {
      checkSubtree(value, pattern);
      return true;
    } catch (e) {
      if (e instanceof Match.Error)
        return false;
      // Rethrow other errors.
      throw e;
    }
  },

  // Runs `f.apply(context, args)`. If check() is not called on every element of
  // `args` (either directly or in the first level of an array), throws an error
  // (using `description` in the message).
  _failIfArgumentsAreNotAllChecked: function (f, context, args, description) {
    var argChecker = new ArgumentChecker(args, description);
    var result = currentArgumentChecker.withValue(argChecker, function () {
      return f.apply(context, args);
    });
    // If f didn't itself throw, make sure it checked all of its arguments.
    argChecker.throwUnlessAllArgumentsHaveBeenChecked();
    return result;
  }
};

var Optional = function (pattern) {
  this.pattern = pattern;
};

var OneOf = function (choices) {
  if (_.isEmpty(choices))
    throw new Error("Must provide at least one choice to Match.OneOf");
  this.choices = choices;
};

var Where = function (condition) {
  this.condition = condition;
};

var ObjectIncluding = function (pattern) {
  this.pattern = pattern;
};

var typeofChecks = [
  [String, "string"],
  [Number, "number"],
  [Boolean, "boolean"],
  // While we don't allow undefined in EJSON, this is good for optional
  // arguments with OneOf.
  [undefined, "undefined"]
];

var checkSubtree = function (value, pattern) {
  // Match anything!
  if (pattern === Match.Any)
    return;

  // Basic atomic types.
  // Do not match boxed objects (e.g. String, Boolean)
  for (var i = 0; i < typeofChecks.length; ++i) {
    if (pattern === typeofChecks[i][0]) {
      if (typeof value === typeofChecks[i][1])
        return;
      throw new Match.Error("Expected " + typeofChecks[i][1] + ", got " +
                            typeof value);
    }
  }
  if (pattern === null) {
    if (value === null)
      return;
    throw new Match.Error("Expected null, got " + EJSON.stringify(value));
  }

  // "Object" is shorthand for Match.ObjectIncluding({});
  if (pattern === Object)
    pattern = Match.ObjectIncluding({});

  // Array (checked AFTER Any, which is implemented as an Array).
  if (pattern instanceof Array) {
    if (pattern.length !== 1)
      throw Error("Bad pattern: arrays must have one type element" +
                  EJSON.stringify(pattern));
    if (!_.isArray(value) && !_.isArguments(value)) {
      throw new Match.Error("Expected array, got " + EJSON.stringify(value));
    }

    _.each(value, function (valueElement) {
      checkSubtree(valueElement, pattern[0]);
    });
    return;
  }

  // Arbitrary validation checks. The condition can return false or throw a
  // Match.Error (ie, it can internally use check()) to fail.
  if (pattern instanceof Where) {
    if (pattern.condition(value))
      return;
    // XXX this error is terrible
    throw new Match.Error("Failed Match.Where validation");
  }


  if (pattern instanceof Optional)
    pattern = Match.OneOf(undefined, pattern.pattern);

  if (pattern instanceof OneOf) {
    for (var i = 0; i < pattern.choices.length; ++i) {
      try {
        checkSubtree(value, pattern.choices[i]);
        // No error? Yay, return.
        return;
      } catch (err) {
        // Other errors should be thrown. Match errors just mean try another
        // choice.
        if (!(err instanceof Match.Error))
          throw err;
      }
    }
    // XXX this error is terrible, esp if it was converted from Optional
    throw new Match.Error("Failed Match.OneOf validation");
  }

  // A function that isn't something we special-case is assumed to be a
  // constructor.
  if (pattern instanceof Function) {
    if (value instanceof pattern)
      return;
    // XXX what if .name isn't defined
    throw new Match.Error("Expected " + pattern.name);
  }

  var unknownKeysAllowed = false;
  if (pattern instanceof ObjectIncluding) {
    unknownKeysAllowed = true;
    pattern = pattern.pattern;
  }

  if (typeof pattern !== "object")
    throw Error("Bad pattern: unknown pattern type");

  // An object, with required and optional keys. Note that this does NOT do
  // structural matches against objects of special types that happen to match
  // the pattern: this really needs to be a plain old {Object}!
  if (typeof value !== 'object')
    throw new Match.Error("Expected object, got " + typeof value);
  if (value === null)
    throw new Match.Error("Expected object, got null");
  if (value.constructor !== Object)
    throw new Match.Error("Expected plain object");

  var requiredPatterns = {};
  var optionalPatterns = {};
  _.each(pattern, function (subPattern, key) {
    if (subPattern instanceof Optional)
      optionalPatterns[key] = subPattern.pattern;
    else
      requiredPatterns[key] = subPattern;
  });

  _.each(value, function (subValue, key) {
    if (_.has(requiredPatterns, key)) {
      checkSubtree(subValue, requiredPatterns[key]);
      delete requiredPatterns[key];
    } else if (_.has(optionalPatterns, key)) {
      checkSubtree(subValue, optionalPatterns[key]);
    } else {
      if (!unknownKeysAllowed)
        throw new Match.Error("Unknown key '" + key + "'");
    }
  });

  _.each(requiredPatterns, function (subPattern, key) {
    throw new Match.Error("Missing key '" + key + "'");
  });
};

var ArgumentChecker = function (args, description) {
  var self = this;
  // Make a SHALLOW copy of the arguments. (We'll be doing identity checks
  // against its contents.)
  self.args = _.clone(args);
  // Since the common case will be to check arguments in order, and we splice
  // out arguments when we check them, make it so we splice out from the end
  // rather than the beginning.
  self.args.reverse();
  self.description = description;
};

_.extend(ArgumentChecker.prototype, {
  checking: function (value) {
    var self = this;
    if (self._checkingOneValue(value))
      return;
    // Allow check(arguments, [String]) or check(arguments.slice(1), [String])
    // or check([foo, bar], [String]) to count... but only if value wasn't
    // itself an argument.
    if (_.isArray(value) || _.isArguments(value)) {
      _.each(value, _.bind(self._checkingOneValue, self));
    }
  },
  _checkingOneValue: function (value) {
    var self = this;
    for (var i = 0; i < self.args.length; ++i) {
      // Is this value one of the arguments? (This can have a false positive if
      // the argument is an interned primitive, but it's still a good enough
      // check.)
      if (value === self.args[i]) {
        self.args.splice(i, 1);
        return true;
      }
    }
    return false;
  },
  throwUnlessAllArgumentsHaveBeenChecked: function () {
    var self = this;
    if (!_.isEmpty(self.args))
      throw new Error("Did not check() all arguments during " +
                      self.description);
  }
});

}).call(this);



// ------------------------------------------------------------------------
// packages/random/random.js

(function(){ // see http://baagoe.org/en/wiki/Better_random_numbers_for_javascript
// for a full discussion and Alea implementation.
var Alea = function () {
  function Mash() {
    var n = 0xefc8249d;

    var mash = function(data) {
      data = data.toString();
      for (var i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        var h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; // 2^32
      }
      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };

    mash.version = 'Mash 0.9';
    return mash;
  }

  return (function (args) {
    var s0 = 0;
    var s1 = 0;
    var s2 = 0;
    var c = 1;

    if (args.length == 0) {
      args = [+new Date];
    }
    var mash = Mash();
    s0 = mash(' ');
    s1 = mash(' ');
    s2 = mash(' ');

    for (var i = 0; i < args.length; i++) {
      s0 -= mash(args[i]);
      if (s0 < 0) {
        s0 += 1;
      }
      s1 -= mash(args[i]);
      if (s1 < 0) {
        s1 += 1;
      }
      s2 -= mash(args[i]);
      if (s2 < 0) {
        s2 += 1;
      }
    }
    mash = null;

    var random = function() {
      var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
      s0 = s1;
      s1 = s2;
      return s2 = t - (c = t | 0);
    };
    random.uint32 = function() {
      return random() * 0x100000000; // 2^32
    };
    random.fract53 = function() {
      return random() +
        (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
    };
    random.version = 'Alea 0.9';
    random.args = args;
    return random;

  } (Array.prototype.slice.call(arguments)));
};

var UNMISTAKABLE_CHARS = "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz";

var create = function (/* arguments */) {

  var random = Alea.apply(null, arguments);

  var self = {};

  var bind = function (fn) {
    return _.bind(fn, self);
  };

  return _.extend(self, {
    _Alea: Alea,

    create: create,

    fraction: random,

    choice: bind(function (arrayOrString) {
      var index = Math.floor(this.fraction() * arrayOrString.length);
      if (typeof arrayOrString === "string")
        return arrayOrString.substr(index, 1);
      else
        return arrayOrString[index];
    }),

    id: bind(function() {
      var digits = [];
      // Length of 17 preserves around 96 bits of entropy, which is the
      // amount of state in our PRNG
      for (var i = 0; i < 17; i++) {
        digits[i] = this.choice(UNMISTAKABLE_CHARS);
      }
      return digits.join("");
    }),

    hexString: bind(function (digits) {
      var hexDigits = [];
      for (var i = 0; i < digits; ++i) {
        hexDigits.push(this.choice("0123456789abcdef"));
      }
      return hexDigits.join('');
    })
  });
};

// instantiate RNG.  Heuristically collect entropy from various sources

// client sources
var height = (typeof window !== 'undefined' && window.innerHeight) ||
      (typeof document !== 'undefined'
       && document.documentElement
       && document.documentElement.clientHeight) ||
      (typeof document !== 'undefined'
       && document.body
       && document.body.clientHeight) ||
      1;

var width = (typeof window !== 'undefined' && window.innerWidth) ||
      (typeof document !== 'undefined'
       && document.documentElement
       && document.documentElement.clientWidth) ||
      (typeof document !== 'undefined'
       && document.body
       && document.body.clientWidth) ||
      1;

var agent = (typeof navigator !== 'undefined' && navigator.userAgent) || "";

// server sources
var pid = (typeof process !== 'undefined' && process.pid) || 1;

// XXX On the server, use the crypto module (OpenSSL) instead of this PRNG.
//     (Make Random.fraction be generated from Random.hexString instead of the
//     other way around, and generate Random.hexString from crypto.randomBytes.)
Random = create([
  new Date(), height, width, agent, pid, Math.random()
]);

}).call(this);



// ------------------------------------------------------------------------
// packages/livedata/sockjs-0.3.4.js

(function(){ // XXX METEOR changes in <METEOR>

/* SockJS client, version 0.3.4, http://sockjs.org, MIT License

Copyright (c) 2011-2012 VMware, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// JSON2 by Douglas Crockford (minified).
// var JSON;JSON||(JSON={}),function(){function str(a,b){var c,d,e,f,g=gap,h,i=b[a];i&&typeof i=="object"&&typeof i.toJSON=="function"&&(i=i.toJSON(a)),typeof rep=="function"&&(i=rep.call(b,a,i));switch(typeof i){case"string":return quote(i);case"number":return isFinite(i)?String(i):"null";case"boolean":case"null":return String(i);case"object":if(!i)return"null";gap+=indent,h=[];if(Object.prototype.toString.apply(i)==="[object Array]"){f=i.length;for(c=0;c<f;c+=1)h[c]=str(c,i)||"null";e=h.length===0?"[]":gap?"[\n"+gap+h.join(",\n"+gap)+"\n"+g+"]":"["+h.join(",")+"]",gap=g;return e}if(rep&&typeof rep=="object"){f=rep.length;for(c=0;c<f;c+=1)typeof rep[c]=="string"&&(d=rep[c],e=str(d,i),e&&h.push(quote(d)+(gap?": ":":")+e))}else for(d in i)Object.prototype.hasOwnProperty.call(i,d)&&(e=str(d,i),e&&h.push(quote(d)+(gap?": ":":")+e));e=h.length===0?"{}":gap?"{\n"+gap+h.join(",\n"+gap)+"\n"+g+"}":"{"+h.join(",")+"}",gap=g;return e}}function quote(a){escapable.lastIndex=0;return escapable.test(a)?'"'+a.replace(escapable,function(a){var b=meta[a];return typeof b=="string"?b:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'}function f(a){return a<10?"0"+a:a}"use strict",typeof Date.prototype.toJSON!="function"&&(Date.prototype.toJSON=function(a){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null},String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(a){return this.valueOf()});var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},rep;typeof JSON.stringify!="function"&&(JSON.stringify=function(a,b,c){var d;gap="",indent="";if(typeof c=="number")for(d=0;d<c;d+=1)indent+=" ";else typeof c=="string"&&(indent=c);rep=b;if(!b||typeof b=="function"||typeof b=="object"&&typeof b.length=="number")return str("",{"":a});throw new Error("JSON.stringify")}),typeof JSON.parse!="function"&&(JSON.parse=function(text,reviver){function walk(a,b){var c,d,e=a[b];if(e&&typeof e=="object")for(c in e)Object.prototype.hasOwnProperty.call(e,c)&&(d=walk(e,c),d!==undefined?e[c]=d:delete e[c]);return reviver.call(a,b,e)}var j;text=String(text),cx.lastIndex=0,cx.test(text)&&(text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)}));if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver=="function"?walk({"":j},""):j}throw new SyntaxError("*JSON.parse")})}()


//     [*] Including lib/index.js
// Public object
var notImpl = function (name) {
  return function () {
    Meteor._debug(new Error('not implemented: ' + name).stack);
  };
};

SockJS = (function(){
              var _document = (typeof document !== 'undefined') ? document : {
  location: location,
  attachEvent: notImpl('attachEvent'),
  detachEvent: notImpl('detachEvent'),
  createElement: notImpl('createElement'),
  domain: location.hostname
};

              var _window = (typeof window !== 'undefined') ? window : {
  location: location,
  WebSocket: WebSocket,
  XMLHttpRequest: XMLHttpRequest
};

              var utils = {};


//         [*] Including lib/reventtarget.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

/* Simplified implementation of DOM2 EventTarget.
 *   http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventTarget
 */
var REventTarget = function() {};
REventTarget.prototype.addEventListener = function (eventType, listener) {
    if(!this._listeners) {
         this._listeners = {};
    }
    if(!(eventType in this._listeners)) {
        this._listeners[eventType] = [];
    }
    var arr = this._listeners[eventType];
    if(utils.arrIndexOf(arr, listener) === -1) {
        arr.push(listener);
    }
    return;
};

REventTarget.prototype.removeEventListener = function (eventType, listener) {
    if(!(this._listeners && (eventType in this._listeners))) {
        return;
    }
    var arr = this._listeners[eventType];
    var idx = utils.arrIndexOf(arr, listener);
    if (idx !== -1) {
        if(arr.length > 1) {
            this._listeners[eventType] = arr.slice(0, idx).concat( arr.slice(idx+1) );
        } else {
            delete this._listeners[eventType];
        }
        return;
    }
    return;
};

REventTarget.prototype.dispatchEvent = function (event) {
    var t = event.type;
    var args = Array.prototype.slice.call(arguments, 0);
    if (this['on'+t]) {
        this['on'+t].apply(this, args);
    }
    if (this._listeners && t in this._listeners) {
        for(var i=0; i < this._listeners[t].length; i++) {
            this._listeners[t][i].apply(this, args);
        }
    }
};
//         [*] End of lib/reventtarget.js


//         [*] Including lib/simpleevent.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var SimpleEvent = function(type, obj) {
    this.type = type;
    if (typeof obj !== 'undefined') {
        for(var k in obj) {
            if (!obj.hasOwnProperty(k)) continue;
            this[k] = obj[k];
        }
    }
};

SimpleEvent.prototype.toString = function() {
    var r = [];
    for(var k in this) {
        if (!this.hasOwnProperty(k)) continue;
        var v = this[k];
        if (typeof v === 'function') v = '[function]';
        r.push(k + '=' + v);
    }
    return 'SimpleEvent(' + r.join(', ') + ')';
};
//         [*] End of lib/simpleevent.js


//         [*] Including lib/eventemitter.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var EventEmitter = function(events) {
    var that = this;
    that._events = events || [];
    that._listeners = {};
};
EventEmitter.prototype.emit = function(type) {
    var that = this;
    that._verifyType(type);
    if (that._nuked) return;

    var args = Array.prototype.slice.call(arguments, 1);
    if (that['on'+type]) {
        that['on'+type].apply(that, args);
    }
    if (type in that._listeners) {
        for(var i = 0; i < that._listeners[type].length; i++) {
            that._listeners[type][i].apply(that, args);
        }
    }
};

EventEmitter.prototype.on = function(type, callback) {
    var that = this;
    that._verifyType(type);
    if (that._nuked) return;

    if (!(type in that._listeners)) {
        that._listeners[type] = [];
    }
    that._listeners[type].push(callback);
};

EventEmitter.prototype._verifyType = function(type) {
    var that = this;
    if (utils.arrIndexOf(that._events, type) === -1) {
        utils.log('Event ' + JSON.stringify(type) +
                  ' not listed ' + JSON.stringify(that._events) +
                  ' in ' + that);
    }
};

EventEmitter.prototype.nuke = function() {
    var that = this;
    that._nuked = true;
    for(var i=0; i<that._events.length; i++) {
        delete that[that._events[i]];
    }
    that._listeners = {};
};
//         [*] End of lib/eventemitter.js


//         [*] Including lib/utils.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var random_string_chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
utils.random_string = function(length, max) {
    max = max || random_string_chars.length;
    var i, ret = [];
    for(i=0; i < length; i++) {
        ret.push( random_string_chars.substr(Math.floor(Math.random() * max),1) );
    }
    return ret.join('');
};
utils.random_number = function(max) {
    return Math.floor(Math.random() * max);
};
utils.random_number_string = function(max) {
    var t = (''+(max - 1)).length;
    var p = Array(t+1).join('0');
    return (p + utils.random_number(max)).slice(-t);
};

// Assuming that url looks like: http://asdasd:111/asd
utils.getOrigin = function(url) {
    url += '/';
    var parts = url.split('/').slice(0, 3);
    return parts.join('/');
};

utils.isSameOriginUrl = function(url_a, url_b) {
    // location.origin would do, but it's not always available.
    if (!url_b) url_b = _window.location.href;

    return (url_a.split('/').slice(0,3).join('/')
                ===
            url_b.split('/').slice(0,3).join('/'));
};

// <METEOR>
// https://github.com/sockjs/sockjs-client/issues/79
utils.isSameOriginScheme = function(url_a, url_b) {
    if (!url_b) url_b = _window.location.href;

    return (url_a.split(':')[0]
                ===
            url_b.split(':')[0]);
};
// </METEOR>


utils.getParentDomain = function(url) {
    // ipv4 ip address
    if (/^[0-9.]*$/.test(url)) return url;
    // ipv6 ip address
    if (/^\[/.test(url)) return url;
    // no dots
    if (!(/[.]/.test(url))) return url;

    var parts = url.split('.').slice(1);
    return parts.join('.');
};

utils.objectExtend = function(dst, src) {
    for(var k in src) {
        if (src.hasOwnProperty(k)) {
            dst[k] = src[k];
        }
    }
    return dst;
};

var WPrefix = '_jp';

utils.polluteGlobalNamespace = function() {
    if (!(WPrefix in _window)) {
        _window[WPrefix] = {};
    }
};

utils.closeFrame = function (code, reason) {
    return 'c'+JSON.stringify([code, reason]);
};

utils.userSetCode = function (code) {
    return code === 1000 || (code >= 3000 && code <= 4999);
};

// See: http://www.erg.abdn.ac.uk/~gerrit/dccp/notes/ccid2/rto_estimator/
// and RFC 2988.
utils.countRTO = function (rtt) {
    var rto;
    if (rtt > 100) {
        rto = 3 * rtt; // rto > 300msec
    } else {
        rto = rtt + 200; // 200msec < rto <= 300msec
    }
    return rto;
}

utils.log = function() {
    // if (_window.console && console.log && console.log.apply) {
    //     console.log.apply(console, arguments);
    // }
  Meteor._debug.apply(null, arguments);
};

utils.bind = function(fun, that) {
    if (fun.bind) {
        return fun.bind(that);
    } else {
        return function() {
            return fun.apply(that, arguments);
        };
    }
};

utils.flatUrl = function(url) {
    return url.indexOf('?') === -1 && url.indexOf('#') === -1;
};

utils.amendUrl = function(url) {
    var dl = _document.location;
    if (!url) {
        throw new Error('Wrong url for SockJS');
    }
    if (!utils.flatUrl(url)) {
        throw new Error('Only basic urls are supported in SockJS');
    }

    //  '//abc' --> 'http://abc'
    if (url.indexOf('//') === 0) {
        url = dl.protocol + url;
    }
    // '/abc' --> 'http://localhost:80/abc'
    if (url.indexOf('/') === 0) {
        url = dl.protocol + '//' + dl.host + url;
    }
    // strip trailing slashes
    url = url.replace(/[/]+$/,'');
    return url;
};

// IE doesn't support [].indexOf.
utils.arrIndexOf = function(arr, obj){
    for(var i=0; i < arr.length; i++){
        if(arr[i] === obj){
            return i;
        }
    }
    return -1;
};

utils.arrSkip = function(arr, obj) {
    var idx = utils.arrIndexOf(arr, obj);
    if (idx === -1) {
        return arr.slice();
    } else {
        var dst = arr.slice(0, idx);
        return dst.concat(arr.slice(idx+1));
    }
};

// Via: https://gist.github.com/1133122/2121c601c5549155483f50be3da5305e83b8c5df
utils.isArray = Array.isArray || function(value) {
    return {}.toString.call(value).indexOf('Array') >= 0
};

utils.delay = function(t, fun) {
    if(typeof t === 'function') {
        fun = t;
        t = 0;
    }
    return setTimeout(fun, t);
};


// Chars worth escaping, as defined by Douglas Crockford:
//   https://github.com/douglascrockford/JSON-js/blob/47a9882cddeb1e8529e07af9736218075372b8ac/json2.js#L196
var json_escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    json_lookup = {
"\u0000":"\\u0000","\u0001":"\\u0001","\u0002":"\\u0002","\u0003":"\\u0003",
"\u0004":"\\u0004","\u0005":"\\u0005","\u0006":"\\u0006","\u0007":"\\u0007",
"\b":"\\b","\t":"\\t","\n":"\\n","\u000b":"\\u000b","\f":"\\f","\r":"\\r",
"\u000e":"\\u000e","\u000f":"\\u000f","\u0010":"\\u0010","\u0011":"\\u0011",
"\u0012":"\\u0012","\u0013":"\\u0013","\u0014":"\\u0014","\u0015":"\\u0015",
"\u0016":"\\u0016","\u0017":"\\u0017","\u0018":"\\u0018","\u0019":"\\u0019",
"\u001a":"\\u001a","\u001b":"\\u001b","\u001c":"\\u001c","\u001d":"\\u001d",
"\u001e":"\\u001e","\u001f":"\\u001f","\"":"\\\"","\\":"\\\\",
"\u007f":"\\u007f","\u0080":"\\u0080","\u0081":"\\u0081","\u0082":"\\u0082",
"\u0083":"\\u0083","\u0084":"\\u0084","\u0085":"\\u0085","\u0086":"\\u0086",
"\u0087":"\\u0087","\u0088":"\\u0088","\u0089":"\\u0089","\u008a":"\\u008a",
"\u008b":"\\u008b","\u008c":"\\u008c","\u008d":"\\u008d","\u008e":"\\u008e",
"\u008f":"\\u008f","\u0090":"\\u0090","\u0091":"\\u0091","\u0092":"\\u0092",
"\u0093":"\\u0093","\u0094":"\\u0094","\u0095":"\\u0095","\u0096":"\\u0096",
"\u0097":"\\u0097","\u0098":"\\u0098","\u0099":"\\u0099","\u009a":"\\u009a",
"\u009b":"\\u009b","\u009c":"\\u009c","\u009d":"\\u009d","\u009e":"\\u009e",
"\u009f":"\\u009f","\u00ad":"\\u00ad","\u0600":"\\u0600","\u0601":"\\u0601",
"\u0602":"\\u0602","\u0603":"\\u0603","\u0604":"\\u0604","\u070f":"\\u070f",
"\u17b4":"\\u17b4","\u17b5":"\\u17b5","\u200c":"\\u200c","\u200d":"\\u200d",
"\u200e":"\\u200e","\u200f":"\\u200f","\u2028":"\\u2028","\u2029":"\\u2029",
"\u202a":"\\u202a","\u202b":"\\u202b","\u202c":"\\u202c","\u202d":"\\u202d",
"\u202e":"\\u202e","\u202f":"\\u202f","\u2060":"\\u2060","\u2061":"\\u2061",
"\u2062":"\\u2062","\u2063":"\\u2063","\u2064":"\\u2064","\u2065":"\\u2065",
"\u2066":"\\u2066","\u2067":"\\u2067","\u2068":"\\u2068","\u2069":"\\u2069",
"\u206a":"\\u206a","\u206b":"\\u206b","\u206c":"\\u206c","\u206d":"\\u206d",
"\u206e":"\\u206e","\u206f":"\\u206f","\ufeff":"\\ufeff","\ufff0":"\\ufff0",
"\ufff1":"\\ufff1","\ufff2":"\\ufff2","\ufff3":"\\ufff3","\ufff4":"\\ufff4",
"\ufff5":"\\ufff5","\ufff6":"\\ufff6","\ufff7":"\\ufff7","\ufff8":"\\ufff8",
"\ufff9":"\\ufff9","\ufffa":"\\ufffa","\ufffb":"\\ufffb","\ufffc":"\\ufffc",
"\ufffd":"\\ufffd","\ufffe":"\\ufffe","\uffff":"\\uffff"};

// Some extra characters that Chrome gets wrong, and substitutes with
// something else on the wire.
var extra_escapable = /[\x00-\x1f\ud800-\udfff\ufffe\uffff\u0300-\u0333\u033d-\u0346\u034a-\u034c\u0350-\u0352\u0357-\u0358\u035c-\u0362\u0374\u037e\u0387\u0591-\u05af\u05c4\u0610-\u0617\u0653-\u0654\u0657-\u065b\u065d-\u065e\u06df-\u06e2\u06eb-\u06ec\u0730\u0732-\u0733\u0735-\u0736\u073a\u073d\u073f-\u0741\u0743\u0745\u0747\u07eb-\u07f1\u0951\u0958-\u095f\u09dc-\u09dd\u09df\u0a33\u0a36\u0a59-\u0a5b\u0a5e\u0b5c-\u0b5d\u0e38-\u0e39\u0f43\u0f4d\u0f52\u0f57\u0f5c\u0f69\u0f72-\u0f76\u0f78\u0f80-\u0f83\u0f93\u0f9d\u0fa2\u0fa7\u0fac\u0fb9\u1939-\u193a\u1a17\u1b6b\u1cda-\u1cdb\u1dc0-\u1dcf\u1dfc\u1dfe\u1f71\u1f73\u1f75\u1f77\u1f79\u1f7b\u1f7d\u1fbb\u1fbe\u1fc9\u1fcb\u1fd3\u1fdb\u1fe3\u1feb\u1fee-\u1fef\u1ff9\u1ffb\u1ffd\u2000-\u2001\u20d0-\u20d1\u20d4-\u20d7\u20e7-\u20e9\u2126\u212a-\u212b\u2329-\u232a\u2adc\u302b-\u302c\uaab2-\uaab3\uf900-\ufa0d\ufa10\ufa12\ufa15-\ufa1e\ufa20\ufa22\ufa25-\ufa26\ufa2a-\ufa2d\ufa30-\ufa6d\ufa70-\ufad9\ufb1d\ufb1f\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufb4e\ufff0-\uffff]/g,
    extra_lookup;

// JSON Quote string. Use native implementation when possible.
var JSONQuote = (JSON && JSON.stringify) || function(string) {
    json_escapable.lastIndex = 0;
    if (json_escapable.test(string)) {
        string = string.replace(json_escapable, function(a) {
            return json_lookup[a];
        });
    }
    return '"' + string + '"';
};

// This may be quite slow, so let's delay until user actually uses bad
// characters.
var unroll_lookup = function(escapable) {
    var i;
    var unrolled = {}
    var c = []
    for(i=0; i<65536; i++) {
        c.push( String.fromCharCode(i) );
    }
    escapable.lastIndex = 0;
    c.join('').replace(escapable, function (a) {
        unrolled[ a ] = '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        return '';
    });
    escapable.lastIndex = 0;
    return unrolled;
};

// Quote string, also taking care of unicode characters that browsers
// often break. Especially, take care of unicode surrogates:
//    http://en.wikipedia.org/wiki/Mapping_of_Unicode_characters#Surrogates
utils.quote = function(string) {
    var quoted = JSONQuote(string);

    // In most cases this should be very fast and good enough.
    extra_escapable.lastIndex = 0;
    if(!extra_escapable.test(quoted)) {
        return quoted;
    }

    if(!extra_lookup) extra_lookup = unroll_lookup(extra_escapable);

    return quoted.replace(extra_escapable, function(a) {
        return extra_lookup[a];
    });
}

var _all_protocols = ['websocket',
                      'xdr-streaming',
                      'xhr-streaming',
                      'iframe-eventsource',
                      'iframe-htmlfile',
                      'xdr-polling',
                      'xhr-polling',
                      'iframe-xhr-polling',
                      'jsonp-polling'];

utils.probeProtocols = function() {
    var probed = {};
    for(var i=0; i<_all_protocols.length; i++) {
        var protocol = _all_protocols[i];
        // User can have a typo in protocol name.
        probed[protocol] = SockJS[protocol] &&
                           SockJS[protocol].enabled();
    }
    return probed;
};

utils.detectProtocols = function(probed, protocols_whitelist, info) {
    var pe = {},
        protocols = [];
    if (!protocols_whitelist) protocols_whitelist = _all_protocols;
    for(var i=0; i<protocols_whitelist.length; i++) {
        var protocol = protocols_whitelist[i];
        pe[protocol] = probed[protocol];
    }
    var maybe_push = function(protos) {
        var proto = protos.shift();
        if (pe[proto]) {
            protocols.push(proto);
        } else {
            if (protos.length > 0) {
                maybe_push(protos);
            }
        }
    }

    // 1. Websocket
    if (info.websocket !== false) {
        maybe_push(['websocket']);
    }

    // 2. Streaming
    if (pe['xhr-streaming'] && !info.null_origin) {
        protocols.push('xhr-streaming');
    } else {
        if (pe['xdr-streaming'] && !info.cookie_needed && !info.null_origin) {
            protocols.push('xdr-streaming');
        } else {
            maybe_push(['iframe-eventsource',
                        'iframe-htmlfile']);
        }
    }

    // 3. Polling
    if (pe['xhr-polling'] && !info.null_origin) {
        protocols.push('xhr-polling');
    } else {
        if (pe['xdr-polling'] && !info.cookie_needed && !info.null_origin) {
            protocols.push('xdr-polling');
        } else {
            maybe_push(['iframe-xhr-polling',
                        'jsonp-polling']);
        }
    }
    return protocols;
}
//         [*] End of lib/utils.js


//         [*] Including lib/dom.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// May be used by htmlfile jsonp and transports.
var MPrefix = '_sockjs_global';
utils.createHook = function() {
    var window_id = 'a' + utils.random_string(8);
    if (!(MPrefix in _window)) {
        var map = {};
        _window[MPrefix] = function(window_id) {
            if (!(window_id in map)) {
                map[window_id] = {
                    id: window_id,
                    del: function() {delete map[window_id];}
                };
            }
            return map[window_id];
        }
    }
    return _window[MPrefix](window_id);
};



utils.attachMessage = function(listener) {
    utils.attachEvent('message', listener);
};
utils.attachEvent = function(event, listener) {
    if (typeof _window.addEventListener !== 'undefined') {
        _window.addEventListener(event, listener, false);
    } else {
        // IE quirks.
        // According to: http://stevesouders.com/misc/test-postmessage.php
        // the message gets delivered only to 'document', not 'window'.
        _document.attachEvent("on" + event, listener);
        // I get 'window' for ie8.
        _window.attachEvent("on" + event, listener);
    }
};

utils.detachMessage = function(listener) {
    utils.detachEvent('message', listener);
};
utils.detachEvent = function(event, listener) {
    if (typeof _window.addEventListener !== 'undefined') {
        _window.removeEventListener(event, listener, false);
    } else {
        _document.detachEvent("on" + event, listener);
        _window.detachEvent("on" + event, listener);
    }
};


var on_unload = {};
// Things registered after beforeunload are to be called immediately.
var after_unload = false;

var trigger_unload_callbacks = function() {
    for(var ref in on_unload) {
        on_unload[ref]();
        delete on_unload[ref];
    };
};

var unload_triggered = function() {
    if(after_unload) return;
    after_unload = true;
    trigger_unload_callbacks();
};

// 'unload' alone is not reliable in opera within an iframe, but we
// can't use `beforeunload` as IE fires it on javascript: links.
//utils.attachEvent('unload', unload_triggered);

utils.unload_add = function(listener) {
    var ref = utils.random_string(8);
    on_unload[ref] = listener;
    if (after_unload) {
        utils.delay(trigger_unload_callbacks);
    }
    return ref;
};
utils.unload_del = function(ref) {
    if (ref in on_unload)
        delete on_unload[ref];
};


utils.createIframe = function (iframe_url, error_callback) {
    var iframe = _document.createElement('iframe');
    var tref, unload_ref;
    var unattach = function() {
        clearTimeout(tref);
        // Explorer had problems with that.
        try {iframe.onload = null;} catch (x) {}
        iframe.onerror = null;
    };
    var cleanup = function() {
        if (iframe) {
            unattach();
            // This timeout makes chrome fire onbeforeunload event
            // within iframe. Without the timeout it goes straight to
            // onunload.
            setTimeout(function() {
                if(iframe) {
                    iframe.parentNode.removeChild(iframe);
                }
                iframe = null;
            }, 0);
            utils.unload_del(unload_ref);
        }
    };
    var onerror = function(r) {
        if (iframe) {
            cleanup();
            error_callback(r);
        }
    };
    var post = function(msg, origin) {
        try {
            // When the iframe is not loaded, IE raises an exception
            // on 'contentWindow'.
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(msg, origin);
            }
        } catch (x) {};
    };

    iframe.src = iframe_url;
    iframe.style.display = 'none';
    iframe.style.position = 'absolute';
    iframe.onerror = function(){onerror('onerror');};
    iframe.onload = function() {
        // `onload` is triggered before scripts on the iframe are
        // executed. Give it few seconds to actually load stuff.
        clearTimeout(tref);
        tref = setTimeout(function(){onerror('onload timeout');}, 2000);
    };
    _document.body.appendChild(iframe);
    tref = setTimeout(function(){onerror('timeout');}, 15000);
    unload_ref = utils.unload_add(cleanup);
    return {
        post: post,
        cleanup: cleanup,
        loaded: unattach
    };
};

utils.createHtmlfile = function (iframe_url, error_callback) {
    var doc = new ActiveXObject('htmlfile');
    var tref, unload_ref;
    var iframe;
    var unattach = function() {
        clearTimeout(tref);
    };
    var cleanup = function() {
        if (doc) {
            unattach();
            utils.unload_del(unload_ref);
            iframe.parentNode.removeChild(iframe);
            iframe = doc = null;
            CollectGarbage();
        }
    };
    var onerror = function(r)  {
        if (doc) {
            cleanup();
            error_callback(r);
        }
    };
    var post = function(msg, origin) {
        try {
            // When the iframe is not loaded, IE raises an exception
            // on 'contentWindow'.
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(msg, origin);
            }
        } catch (x) {};
    };

    doc.open();
    doc.write('<html><s' + 'cript>' +
              'document.domain="' + document.domain + '";' +
              '</s' + 'cript></html>');
    doc.close();
    doc.parentWindow[WPrefix] = _window[WPrefix];
    var c = doc.createElement('div');
    doc.body.appendChild(c);
    iframe = doc.createElement('iframe');
    c.appendChild(iframe);
    iframe.src = iframe_url;
    tref = setTimeout(function(){onerror('timeout');}, 15000);
    unload_ref = utils.unload_add(cleanup);
    return {
        post: post,
        cleanup: cleanup,
        loaded: unattach
    };
};
//         [*] End of lib/dom.js


//         [*] Including lib/dom2.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var AbstractXHRObject = function(){};
AbstractXHRObject.prototype = new EventEmitter(['chunk', 'finish']);

AbstractXHRObject.prototype._start = function(method, url, payload, opts) {
    var that = this;

    try {
        that.xhr = new XMLHttpRequest();
    } catch(x) {};

    if (!that.xhr) {
        try {
            that.xhr = new _window.ActiveXObject('Microsoft.XMLHTTP');
        } catch(x) {};
    }
    if (_window.ActiveXObject || _window.XDomainRequest) {
        // IE8 caches even POSTs
        url += ((url.indexOf('?') === -1) ? '?' : '&') + 't='+(+new Date);
    }

    // Explorer tends to keep connection open, even after the
    // tab gets closed: http://bugs.jquery.com/ticket/5280
    that.unload_ref = utils.unload_add(function(){that._cleanup(true);});
    try {
        that.xhr.open(method, url, true);
    } catch(e) {
        // IE raises an exception on wrong port.
        that.emit('finish', 0, '');
        that._cleanup();
        return;
    };

    if (!opts || !opts.no_credentials) {
        // Mozilla docs says https://developer.mozilla.org/en/XMLHttpRequest :
        // "This never affects same-site requests."
        that.xhr.withCredentials = 'true';
    }
    if (opts && opts.headers) {
        for(var key in opts.headers) {
            that.xhr.setRequestHeader(key, opts.headers[key]);
        }
    }

    that.xhr.onreadystatechange = function() {
        if (that.xhr) {
            var x = that.xhr;
            switch (x.readyState) {
            case 3:
                // IE doesn't like peeking into responseText or status
                // on Microsoft.XMLHTTP and readystate=3
                try {
                    var status = x.status;
                    var text = x.responseText;
                } catch (x) {};
                // IE returns 1223 for 204: http://bugs.jquery.com/ticket/1450
                if (status === 1223) status = 204;
                // IE does return readystate == 3 for 404 answers.
                if (text && text.length > 0) {
                    that.emit('chunk', status, text);
                }
                break;
            case 4:
                var status = x.status;
                // IE returns 1223 for 204: http://bugs.jquery.com/ticket/1450
                if (status === 1223) status = 204;
                that.emit('finish', status, x.responseText);
                that._cleanup(false);
                break;
            }
        }
    };
    that.xhr.send(payload);
};

AbstractXHRObject.prototype._cleanup = function(abort) {
    var that = this;
    if (!that.xhr) return;
    utils.unload_del(that.unload_ref);

    // IE needs this field to be a function
    that.xhr.onreadystatechange = function(){};

    if (abort) {
        try {
            that.xhr.abort();
        } catch(x) {};
    }
    that.unload_ref = that.xhr = null;
};

AbstractXHRObject.prototype.close = function() {
    var that = this;
    that.nuke();
    that._cleanup(true);
};

var XHRCorsObject = utils.XHRCorsObject = function() {
    var that = this, args = arguments;
    utils.delay(function(){that._start.apply(that, args);});
};
XHRCorsObject.prototype = new AbstractXHRObject();

var XHRLocalObject = utils.XHRLocalObject = function(method, url, payload) {
    var that = this;
    utils.delay(function(){
        that._start(method, url, payload, {
            no_credentials: true
        });
    });
};
XHRLocalObject.prototype = new AbstractXHRObject();



// References:
//   http://ajaxian.com/archives/100-line-ajax-wrapper
//   http://msdn.microsoft.com/en-us/library/cc288060(v=VS.85).aspx
var XDRObject = utils.XDRObject = function(method, url, payload) {
    var that = this;
    utils.delay(function(){that._start(method, url, payload);});
};
XDRObject.prototype = new EventEmitter(['chunk', 'finish']);
XDRObject.prototype._start = function(method, url, payload) {
    var that = this;
    var xdr = new XDomainRequest();
    // IE caches even POSTs
    url += ((url.indexOf('?') === -1) ? '?' : '&') + 't='+(+new Date);

    var onerror = xdr.ontimeout = xdr.onerror = function() {
        that.emit('finish', 0, '');
        that._cleanup(false);
    };
    xdr.onprogress = function() {
        that.emit('chunk', 200, xdr.responseText);
    };
    xdr.onload = function() {
        that.emit('finish', 200, xdr.responseText);
        that._cleanup(false);
    };
    that.xdr = xdr;
    that.unload_ref = utils.unload_add(function(){that._cleanup(true);});
    try {
        // Fails with AccessDenied if port number is bogus
        that.xdr.open(method, url);
        that.xdr.send(payload);
    } catch(x) {
        onerror();
    }
};

XDRObject.prototype._cleanup = function(abort) {
    var that = this;
    if (!that.xdr) return;
    utils.unload_del(that.unload_ref);

    that.xdr.ontimeout = that.xdr.onerror = that.xdr.onprogress =
        that.xdr.onload = null;
    if (abort) {
        try {
            that.xdr.abort();
        } catch(x) {};
    }
    that.unload_ref = that.xdr = null;
};

XDRObject.prototype.close = function() {
    var that = this;
    that.nuke();
    that._cleanup(true);
};

// 1. Is natively via XHR
// 2. Is natively via XDR
// 3. Nope, but postMessage is there so it should work via the Iframe.
// 4. Nope, sorry.
utils.isXHRCorsCapable = function() {
    if (_window.XMLHttpRequest && 'withCredentials' in new XMLHttpRequest()) {
        return 1;
    }
    // XDomainRequest doesn't work if page is served from file://
    if (_window.XDomainRequest && _document.domain) {
        return 2;
    }
    if (IframeTransport.enabled()) {
        return 3;
    }
    return 4;
};
//         [*] End of lib/dom2.js


//         [*] Including lib/sockjs.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var SockJS = function(url, dep_protocols_whitelist, options) {
    if (this === _window) {
        // makes `new` optional
        return new SockJS(url, dep_protocols_whitelist, options);
    }

    var that = this, protocols_whitelist;
    that._options = {devel: false, debug: false, protocols_whitelist: [],
                     info: undefined, rtt: undefined};
    if (options) {
        utils.objectExtend(that._options, options);
    }
    that._base_url = utils.amendUrl(url);
    that._server = that._options.server || utils.random_number_string(1000);
    if (that._options.protocols_whitelist &&
        that._options.protocols_whitelist.length) {
        protocols_whitelist = that._options.protocols_whitelist;
    } else {
        // Deprecated API
        if (typeof dep_protocols_whitelist === 'string' &&
            dep_protocols_whitelist.length > 0) {
            protocols_whitelist = [dep_protocols_whitelist];
        } else if (utils.isArray(dep_protocols_whitelist)) {
            protocols_whitelist = dep_protocols_whitelist
        } else {
            protocols_whitelist = null;
        }
        if (protocols_whitelist) {
            that._debug('Deprecated API: Use "protocols_whitelist" option ' +
                        'instead of supplying protocol list as a second ' +
                        'parameter to SockJS constructor.');
        }
    }
    that._protocols = [];
    that.protocol = null;
    that.readyState = SockJS.CONNECTING;
    that._ir = createInfoReceiver(that._base_url);
    that._ir.onfinish = function(info, rtt) {
        that._ir = null;
        if (info) {
            if (that._options.info) {
                // Override if user supplies the option
                info = utils.objectExtend(info, that._options.info);
            }
            if (that._options.rtt) {
                rtt = that._options.rtt;
            }
            that._applyInfo(info, rtt, protocols_whitelist);
            that._didClose();
        } else {
            that._didClose(1002, 'Can\'t connect to server', true);
        }
    };
};
// Inheritance
SockJS.prototype = new REventTarget();

SockJS.version = "0.3.4";

SockJS.CONNECTING = 0;
SockJS.OPEN = 1;
SockJS.CLOSING = 2;
SockJS.CLOSED = 3;

SockJS.prototype._debug = function() {
    if (this._options.debug)
        utils.log.apply(utils, arguments);
};

SockJS.prototype._dispatchOpen = function() {
    var that = this;
    if (that.readyState === SockJS.CONNECTING) {
        if (that._transport_tref) {
            clearTimeout(that._transport_tref);
            that._transport_tref = null;
        }
        that.readyState = SockJS.OPEN;
        that.dispatchEvent(new SimpleEvent("open"));
    } else {
        // The server might have been restarted, and lost track of our
        // connection.
        that._didClose(1006, "Server lost session");
    }
};

SockJS.prototype._dispatchMessage = function(data) {
    var that = this;
    if (that.readyState !== SockJS.OPEN)
            return;
    that.dispatchEvent(new SimpleEvent("message", {data: data}));
};

SockJS.prototype._dispatchHeartbeat = function(data) {
    var that = this;
    if (that.readyState !== SockJS.OPEN)
        return;
    that.dispatchEvent(new SimpleEvent('heartbeat', {}));
};

SockJS.prototype._didClose = function(code, reason, force) {
    var that = this;
    if (that.readyState !== SockJS.CONNECTING &&
        that.readyState !== SockJS.OPEN &&
        that.readyState !== SockJS.CLOSING)
            throw new Error('INVALID_STATE_ERR');
    if (that._ir) {
        that._ir.nuke();
        that._ir = null;
    }

    if (that._transport) {
        that._transport.doCleanup();
        that._transport = null;
    }

    var close_event = new SimpleEvent("close", {
        code: code,
        reason: reason,
        wasClean: utils.userSetCode(code)});

    if (!utils.userSetCode(code) &&
        that.readyState === SockJS.CONNECTING && !force) {
        if (that._try_next_protocol(close_event)) {
            return;
        }
        close_event = new SimpleEvent("close", {code: 2000,
                                                reason: "All transports failed",
                                                wasClean: false,
                                                last_event: close_event});
    }
    that.readyState = SockJS.CLOSED;

    utils.delay(function() {
                   that.dispatchEvent(close_event);
                });
};

SockJS.prototype._didMessage = function(data) {
    var that = this;
    var type = data.slice(0, 1);
    switch(type) {
    case 'o':
        that._dispatchOpen();
        break;
    case 'a':
        var payload = JSON.parse(data.slice(1) || '[]');
        for(var i=0; i < payload.length; i++){
            that._dispatchMessage(payload[i]);
        }
        break;
    case 'm':
        var payload = JSON.parse(data.slice(1) || 'null');
        that._dispatchMessage(payload);
        break;
    case 'c':
        var payload = JSON.parse(data.slice(1) || '[]');
        that._didClose(payload[0], payload[1]);
        break;
    case 'h':
        that._dispatchHeartbeat();
        break;
    }
};

SockJS.prototype._try_next_protocol = function(close_event) {
    var that = this;
    if (that.protocol) {
        that._debug('Closed transport:', that.protocol, ''+close_event);
        that.protocol = null;
    }
    if (that._transport_tref) {
        clearTimeout(that._transport_tref);
        that._transport_tref = null;
    }

    while(1) {
        var protocol = that.protocol = that._protocols.shift();
        if (!protocol) {
            return false;
        }
        // Some protocols require access to `body`, what if were in
        // the `head`?
        if (SockJS[protocol] &&
            SockJS[protocol].need_body === true &&
            (!_document.body ||
             (typeof _document.readyState !== 'undefined'
              && _document.readyState !== 'complete'))) {
            that._protocols.unshift(protocol);
            that.protocol = 'waiting-for-load';
            utils.attachEvent('load', function(){
                that._try_next_protocol();
            });
            return true;
        }

        if (!SockJS[protocol] ||
              !SockJS[protocol].enabled(that._options)) {
            that._debug('Skipping transport:', protocol);
        } else {
            var roundTrips = SockJS[protocol].roundTrips || 1;
            var to = ((that._options.rto || 0) * roundTrips) || 5000;
            that._transport_tref = utils.delay(to, function() {
                if (that.readyState === SockJS.CONNECTING) {
                    // I can't understand how it is possible to run
                    // this timer, when the state is CLOSED, but
                    // apparently in IE everythin is possible.
                    that._didClose(2007, "Transport timeouted");
                }
            });

            var connid = utils.random_string(8);
            var trans_url = that._base_url + '/' + that._server + '/' + connid;
            that._debug('Opening transport:', protocol, ' url:'+trans_url,
                        ' RTO:'+that._options.rto);
            that._transport = new SockJS[protocol](that, trans_url,
                                                   that._base_url);
            return true;
        }
    }
};

SockJS.prototype.close = function(code, reason) {
    var that = this;
    if (code && !utils.userSetCode(code))
        throw new Error("INVALID_ACCESS_ERR");
    if(that.readyState !== SockJS.CONNECTING &&
       that.readyState !== SockJS.OPEN) {
        return false;
    }
    that.readyState = SockJS.CLOSING;
    that._didClose(code || 1000, reason || "Normal closure");
    return true;
};

SockJS.prototype.send = function(data) {
    var that = this;
    if (that.readyState === SockJS.CONNECTING)
        throw new Error('INVALID_STATE_ERR');
    if (that.readyState === SockJS.OPEN) {
        that._transport.doSend(utils.quote('' + data));
    }
    return true;
};

SockJS.prototype._applyInfo = function(info, rtt, protocols_whitelist) {
    var that = this;
    that._options.info = info;
    that._options.rtt = rtt;
    that._options.rto = utils.countRTO(rtt);
    that._options.info.null_origin = !_document.domain;
    var probed = utils.probeProtocols();
    that._protocols = utils.detectProtocols(probed, protocols_whitelist, info);
// <METEOR>
// https://github.com/sockjs/sockjs-client/issues/79
    // Hack to avoid XDR when using different protocols
    // We're on IE trying to do cross-protocol. jsonp only.
    if (!utils.isSameOriginScheme(that._base_url) &&
        2 === utils.isXHRCorsCapable()) {
        that._protocols = ['jsonp-polling'];
    }
// </METEOR>
};
//         [*] End of lib/sockjs.js


//         [*] Including lib/trans-websocket.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var WebSocketTransport = SockJS.websocket = function(ri, trans_url) {
    var that = this;
    var url = trans_url + '/websocket';
    if (url.slice(0, 5) === 'https') {
        url = 'wss' + url.slice(5);
    } else {
        url = 'ws' + url.slice(4);
    }
    that.ri = ri;
    that.url = url;
    var Constructor = _window.WebSocket || _window.MozWebSocket;

    that.ws = new Constructor(that.url);
    that.ws.onmessage = function(e) {
        that.ri._didMessage(e.data);
    };
    // Firefox has an interesting bug. If a websocket connection is
    // created after onunload, it stays alive even when user
    // navigates away from the page. In such situation let's lie -
    // let's not open the ws connection at all. See:
    // https://github.com/sockjs/sockjs-client/issues/28
    // https://bugzilla.mozilla.org/show_bug.cgi?id=696085
    that.unload_ref = utils.unload_add(function(){that.ws.close()});
    that.ws.onclose = function() {
        that.ri._didMessage(utils.closeFrame(1006, "WebSocket connection broken"));
    };
};

WebSocketTransport.prototype.doSend = function(data) {
    this.ws.send('[' + data + ']');
};

WebSocketTransport.prototype.doCleanup = function() {
    var that = this;
    var ws = that.ws;
    if (ws) {
        ws.onmessage = ws.onclose = null;
        ws.close();
        utils.unload_del(that.unload_ref);
        that.unload_ref = that.ri = that.ws = null;
    }
};

WebSocketTransport.enabled = function() {
    return !!(_window.WebSocket || _window.MozWebSocket);
};

// In theory, ws should require 1 round trip. But in chrome, this is
// not very stable over SSL. Most likely a ws connection requires a
// separate SSL connection, in which case 2 round trips are an
// absolute minumum.
WebSocketTransport.roundTrips = 2;
//         [*] End of lib/trans-websocket.js


//         [*] Including lib/trans-sender.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var BufferedSender = function() {};
BufferedSender.prototype.send_constructor = function(sender) {
    var that = this;
    that.send_buffer = [];
    that.sender = sender;
};
BufferedSender.prototype.doSend = function(message) {
    var that = this;
    that.send_buffer.push(message);
    if (!that.send_stop) {
        that.send_schedule();
    }
};

// For polling transports in a situation when in the message callback,
// new message is being send. If the sending connection was started
// before receiving one, it is possible to saturate the network and
// timeout due to the lack of receiving socket. To avoid that we delay
// sending messages by some small time, in order to let receiving
// connection be started beforehand. This is only a halfmeasure and
// does not fix the big problem, but it does make the tests go more
// stable on slow networks.
BufferedSender.prototype.send_schedule_wait = function() {
    var that = this;
    var tref;
    that.send_stop = function() {
        that.send_stop = null;
        clearTimeout(tref);
    };
    tref = utils.delay(25, function() {
        that.send_stop = null;
        that.send_schedule();
    });
};

BufferedSender.prototype.send_schedule = function() {
    var that = this;
    if (that.send_buffer.length > 0) {
        var payload = '[' + that.send_buffer.join(',') + ']';
        that.send_stop = that.sender(that.trans_url, payload, function(success, abort_reason) {
            that.send_stop = null;
            if (success === false) {
                that.ri._didClose(1006, 'Sending error ' + abort_reason);
            } else {
                that.send_schedule_wait();
            }
        });
        that.send_buffer = [];
    }
};

BufferedSender.prototype.send_destructor = function() {
    var that = this;
    if (that._send_stop) {
        that._send_stop();
    }
    that._send_stop = null;
};

var jsonPGenericSender = function(url, payload, callback) {
    var that = this;

    if (!('_send_form' in that)) {
        var form = that._send_form = _document.createElement('form');
        var area = that._send_area = _document.createElement('textarea');
        area.name = 'd';
        form.style.display = 'none';
        form.style.position = 'absolute';
        form.method = 'POST';
        form.enctype = 'application/x-www-form-urlencoded';
        form.acceptCharset = "UTF-8";
        form.appendChild(area);
        _document.body.appendChild(form);
    }
    var form = that._send_form;
    var area = that._send_area;
    var id = 'a' + utils.random_string(8);
    form.target = id;
    form.action = url + '/jsonp_send?i=' + id;

    var iframe;
    try {
        // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
        iframe = _document.createElement('<iframe name="'+ id +'">');
    } catch(x) {
        iframe = _document.createElement('iframe');
        iframe.name = id;
    }
    iframe.id = id;
    form.appendChild(iframe);
    iframe.style.display = 'none';

    try {
        area.value = payload;
    } catch(e) {
        utils.log('Your browser is seriously broken. Go home! ' + e.message);
    }
    form.submit();

    var completed = function(e) {
        if (!iframe.onerror) return;
        iframe.onreadystatechange = iframe.onerror = iframe.onload = null;
        // Opera mini doesn't like if we GC iframe
        // immediately, thus this timeout.
        utils.delay(500, function() {
                       iframe.parentNode.removeChild(iframe);
                       iframe = null;
                   });
        area.value = '';
        // It is not possible to detect if the iframe succeeded or
        // failed to submit our form.
        callback(true);
    };
    iframe.onerror = iframe.onload = completed;
    iframe.onreadystatechange = function(e) {
        if (iframe.readyState == 'complete') completed();
    };
    return completed;
};

var createAjaxSender = function(AjaxObject) {
    return function(url, payload, callback) {
        var xo = new AjaxObject('POST', url + '/xhr_send', payload);
        xo.onfinish = function(status, text) {
            callback(status === 200 || status === 204,
                     'http status ' + status);
        };
        return function(abort_reason) {
            callback(false, abort_reason);
        };
    };
};
//         [*] End of lib/trans-sender.js


//         [*] Including lib/trans-jsonp-receiver.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// Parts derived from Socket.io:
//    https://github.com/LearnBoost/socket.io/blob/0.6.17/lib/socket.io/transports/jsonp-polling.js
// and jQuery-JSONP:
//    https://code.google.com/p/jquery-jsonp/source/browse/trunk/core/jquery.jsonp.js
var jsonPGenericReceiver = function(url, callback) {
    var tref;
    var script = _document.createElement('script');
    var script2;  // Opera synchronous load trick.
    var close_script = function(frame) {
        if (script2) {
            script2.parentNode.removeChild(script2);
            script2 = null;
        }
        if (script) {
            clearTimeout(tref);
            // Unfortunately, you can't really abort script loading of
            // the script.
            script.parentNode.removeChild(script);
            script.onreadystatechange = script.onerror =
                script.onload = script.onclick = null;
            script = null;
            callback(frame);
            callback = null;
        }
    };

    // IE9 fires 'error' event after orsc or before, in random order.
    var loaded_okay = false;
    var error_timer = null;

    script.id = 'a' + utils.random_string(8);
    script.src = url;
    script.type = 'text/javascript';
    script.charset = 'UTF-8';
    script.onerror = function(e) {
        if (!error_timer) {
            // Delay firing close_script.
            error_timer = setTimeout(function() {
                if (!loaded_okay) {
                    close_script(utils.closeFrame(
                        1006,
                        "JSONP script loaded abnormally (onerror)"));
                }
            }, 1000);
        }
    };
    script.onload = function(e) {
        close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (onload)"));
    };

    script.onreadystatechange = function(e) {
        if (/loaded|closed/.test(script.readyState)) {
            if (script && script.htmlFor && script.onclick) {
                loaded_okay = true;
                try {
                    // In IE, actually execute the script.
                    script.onclick();
                } catch (x) {}
            }
            if (script) {
                close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (onreadystatechange)"));
            }
        }
    };
    // IE: event/htmlFor/onclick trick.
    // One can't rely on proper order for onreadystatechange. In order to
    // make sure, set a 'htmlFor' and 'event' properties, so that
    // script code will be installed as 'onclick' handler for the
    // script object. Later, onreadystatechange, manually execute this
    // code. FF and Chrome doesn't work with 'event' and 'htmlFor'
    // set. For reference see:
    //   http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
    // Also, read on that about script ordering:
    //   http://wiki.whatwg.org/wiki/Dynamic_Script_Execution_Order
    if (typeof script.async === 'undefined' && _document.attachEvent) {
        // According to mozilla docs, in recent browsers script.async defaults
        // to 'true', so we may use it to detect a good browser:
        // https://developer.mozilla.org/en/HTML/Element/script
        if (!/opera/i.test(navigator.userAgent)) {
            // Naively assume we're in IE
            try {
                script.htmlFor = script.id;
                script.event = "onclick";
            } catch (x) {}
            script.async = true;
        } else {
            // Opera, second sync script hack
            script2 = _document.createElement('script');
            script2.text = "try{var a = document.getElementById('"+script.id+"'); if(a)a.onerror();}catch(x){};";
            script.async = script2.async = false;
        }
    }
    if (typeof script.async !== 'undefined') {
        script.async = true;
    }

    // Fallback mostly for Konqueror - stupid timer, 35 seconds shall be plenty.
    tref = setTimeout(function() {
                          close_script(utils.closeFrame(1006, "JSONP script loaded abnormally (timeout)"));
                      }, 35000);

    var head = _document.getElementsByTagName('head')[0];
    head.insertBefore(script, head.firstChild);
    if (script2) {
        head.insertBefore(script2, head.firstChild);
    }
    return close_script;
};
//         [*] End of lib/trans-jsonp-receiver.js


//         [*] Including lib/trans-jsonp-polling.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// The simplest and most robust transport, using the well-know cross
// domain hack - JSONP. This transport is quite inefficient - one
// mssage could use up to one http request. But at least it works almost
// everywhere.
// Known limitations:
//   o you will get a spinning cursor
//   o for Konqueror a dumb timer is needed to detect errors


var JsonPTransport = SockJS['jsonp-polling'] = function(ri, trans_url) {
    utils.polluteGlobalNamespace();
    var that = this;
    that.ri = ri;
    that.trans_url = trans_url;
    that.send_constructor(jsonPGenericSender);
    that._schedule_recv();
};

// Inheritnace
JsonPTransport.prototype = new BufferedSender();

JsonPTransport.prototype._schedule_recv = function() {
    var that = this;
    var callback = function(data) {
        that._recv_stop = null;
        if (data) {
            // no data - heartbeat;
            if (!that._is_closing) {
                that.ri._didMessage(data);
            }
        }
        // The message can be a close message, and change is_closing state.
        if (!that._is_closing) {
            that._schedule_recv();
        }
    };
    that._recv_stop = jsonPReceiverWrapper(that.trans_url + '/jsonp',
                                           jsonPGenericReceiver, callback);
};

JsonPTransport.enabled = function() {
    return true;
};

JsonPTransport.need_body = true;


JsonPTransport.prototype.doCleanup = function() {
    var that = this;
    that._is_closing = true;
    if (that._recv_stop) {
        that._recv_stop();
    }
    that.ri = that._recv_stop = null;
    that.send_destructor();
};


// Abstract away code that handles global namespace pollution.
var jsonPReceiverWrapper = function(url, constructReceiver, user_callback) {
    var id = 'a' + utils.random_string(6);
    var url_id = url + '?c=' + escape(WPrefix + '.' + id);

    // Unfortunately it is not possible to abort loading of the
    // script. We need to keep track of frake close frames.
    var aborting = 0;

    // Callback will be called exactly once.
    var callback = function(frame) {
        switch(aborting) {
        case 0:
            // Normal behaviour - delete hook _and_ emit message.
            delete _window[WPrefix][id];
            user_callback(frame);
            break;
        case 1:
            // Fake close frame - emit but don't delete hook.
            user_callback(frame);
            aborting = 2;
            break;
        case 2:
            // Got frame after connection was closed, delete hook, don't emit.
            delete _window[WPrefix][id];
            break;
        }
    };

    var close_script = constructReceiver(url_id, callback);
    _window[WPrefix][id] = close_script;
    var stop = function() {
        if (_window[WPrefix][id]) {
            aborting = 1;
            _window[WPrefix][id](utils.closeFrame(1000, "JSONP user aborted read"));
        }
    };
    return stop;
};
//         [*] End of lib/trans-jsonp-polling.js


//         [*] Including lib/trans-xhr.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var AjaxBasedTransport = function() {};
AjaxBasedTransport.prototype = new BufferedSender();

AjaxBasedTransport.prototype.run = function(ri, trans_url,
                                            url_suffix, Receiver, AjaxObject) {
    var that = this;
    that.ri = ri;
    that.trans_url = trans_url;
    that.send_constructor(createAjaxSender(AjaxObject));
    that.poll = new Polling(ri, Receiver,
                            trans_url + url_suffix, AjaxObject);
};

AjaxBasedTransport.prototype.doCleanup = function() {
    var that = this;
    if (that.poll) {
        that.poll.abort();
        that.poll = null;
    }
};

// xhr-streaming
var XhrStreamingTransport = SockJS['xhr-streaming'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr_streaming', XhrReceiver, utils.XHRCorsObject);
};

XhrStreamingTransport.prototype = new AjaxBasedTransport();

XhrStreamingTransport.enabled = function() {
    // Support for CORS Ajax aka Ajax2? Opera 12 claims CORS but
    // doesn't do streaming.
    return (_window.XMLHttpRequest &&
            'withCredentials' in new XMLHttpRequest() &&
            (!/opera/i.test(navigator.userAgent)));
};
XhrStreamingTransport.roundTrips = 2; // preflight, ajax

// Safari gets confused when a streaming ajax request is started
// before onload. This causes the load indicator to spin indefinetely.
XhrStreamingTransport.need_body = true;


// According to:
//   http://stackoverflow.com/questions/1641507/detect-browser-support-for-cross-domain-xmlhttprequests
//   http://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/


// xdr-streaming
var XdrStreamingTransport = SockJS['xdr-streaming'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr_streaming', XhrReceiver, utils.XDRObject);
};

XdrStreamingTransport.prototype = new AjaxBasedTransport();

XdrStreamingTransport.enabled = function() {
    return !!_window.XDomainRequest;
};
XdrStreamingTransport.roundTrips = 2; // preflight, ajax



// xhr-polling
var XhrPollingTransport = SockJS['xhr-polling'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr', XhrReceiver, utils.XHRCorsObject);
};

XhrPollingTransport.prototype = new AjaxBasedTransport();

XhrPollingTransport.enabled = XhrStreamingTransport.enabled;
XhrPollingTransport.roundTrips = 2; // preflight, ajax


// xdr-polling
var XdrPollingTransport = SockJS['xdr-polling'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr', XhrReceiver, utils.XDRObject);
};

XdrPollingTransport.prototype = new AjaxBasedTransport();

XdrPollingTransport.enabled = XdrStreamingTransport.enabled;
XdrPollingTransport.roundTrips = 2; // preflight, ajax
//         [*] End of lib/trans-xhr.js


//         [*] Including lib/trans-iframe.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// Few cool transports do work only for same-origin. In order to make
// them working cross-domain we shall use iframe, served form the
// remote domain. New browsers, have capabilities to communicate with
// cross domain iframe, using postMessage(). In IE it was implemented
// from IE 8+, but of course, IE got some details wrong:
//    http://msdn.microsoft.com/en-us/library/cc197015(v=VS.85).aspx
//    http://stevesouders.com/misc/test-postmessage.php

var IframeTransport = function() {};

IframeTransport.prototype.i_constructor = function(ri, trans_url, base_url) {
    var that = this;
    that.ri = ri;
    that.origin = utils.getOrigin(base_url);
    that.base_url = base_url;
    that.trans_url = trans_url;

    var iframe_url = base_url + '/iframe.html';
    if (that.ri._options.devel) {
        iframe_url += '?t=' + (+new Date);
    }
    that.window_id = utils.random_string(8);
    iframe_url += '#' + that.window_id;

    that.iframeObj = utils.createIframe(iframe_url, function(r) {
                                            that.ri._didClose(1006, "Unable to load an iframe (" + r + ")");
                                        });

    that.onmessage_cb = utils.bind(that.onmessage, that);
    utils.attachMessage(that.onmessage_cb);
};

IframeTransport.prototype.doCleanup = function() {
    var that = this;
    if (that.iframeObj) {
        utils.detachMessage(that.onmessage_cb);
        try {
            // When the iframe is not loaded, IE raises an exception
            // on 'contentWindow'.
            if (that.iframeObj.iframe.contentWindow) {
                that.postMessage('c');
            }
        } catch (x) {}
        that.iframeObj.cleanup();
        that.iframeObj = null;
        that.onmessage_cb = that.iframeObj = null;
    }
};

IframeTransport.prototype.onmessage = function(e) {
    var that = this;
    if (e.origin !== that.origin) return;
    var window_id = e.data.slice(0, 8);
    var type = e.data.slice(8, 9);
    var data = e.data.slice(9);

    if (window_id !== that.window_id) return;

    switch(type) {
    case 's':
        that.iframeObj.loaded();
        that.postMessage('s', JSON.stringify([SockJS.version, that.protocol, that.trans_url, that.base_url]));
        break;
    case 't':
        that.ri._didMessage(data);
        break;
    }
};

IframeTransport.prototype.postMessage = function(type, data) {
    var that = this;
    that.iframeObj.post(that.window_id + type + (data || ''), that.origin);
};

IframeTransport.prototype.doSend = function (message) {
    this.postMessage('m', message);
};

IframeTransport.enabled = function() {
    // postMessage misbehaves in konqueror 4.6.5 - the messages are delivered with
    // huge delay, or not at all.
    var konqueror = navigator && navigator.userAgent && navigator.userAgent.indexOf('Konqueror') !== -1;
    return ((typeof _window.postMessage === 'function' ||
            typeof _window.postMessage === 'object') && (!konqueror));
};
//         [*] End of lib/trans-iframe.js


//         [*] Including lib/trans-iframe-within.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var curr_window_id;

var postMessage = function (type, data) {
    if(parent !== _window) {
        parent.postMessage(curr_window_id + type + (data || ''), '*');
    } else {
        utils.log("Can't postMessage, no parent window.", type, data);
    }
};

var FacadeJS = function() {};
FacadeJS.prototype._didClose = function (code, reason) {
    postMessage('t', utils.closeFrame(code, reason));
};
FacadeJS.prototype._didMessage = function (frame) {
    postMessage('t', frame);
};
FacadeJS.prototype._doSend = function (data) {
    this._transport.doSend(data);
};
FacadeJS.prototype._doCleanup = function () {
    this._transport.doCleanup();
};

utils.parent_origin = undefined;

SockJS.bootstrap_iframe = function() {
    var facade;
    curr_window_id = _document.location.hash.slice(1);
    var onMessage = function(e) {
        if(e.source !== parent) return;
        if(typeof utils.parent_origin === 'undefined')
            utils.parent_origin = e.origin;
        if (e.origin !== utils.parent_origin) return;

        var window_id = e.data.slice(0, 8);
        var type = e.data.slice(8, 9);
        var data = e.data.slice(9);
        if (window_id !== curr_window_id) return;
        switch(type) {
        case 's':
            var p = JSON.parse(data);
            var version = p[0];
            var protocol = p[1];
            var trans_url = p[2];
            var base_url = p[3];
            if (version !== SockJS.version) {
                utils.log("Incompatibile SockJS! Main site uses:" +
                          " \"" + version + "\", the iframe:" +
                          " \"" + SockJS.version + "\".");
            }
            if (!utils.flatUrl(trans_url) || !utils.flatUrl(base_url)) {
                utils.log("Only basic urls are supported in SockJS");
                return;
            }

            if (!utils.isSameOriginUrl(trans_url) ||
                !utils.isSameOriginUrl(base_url)) {
                utils.log("Can't connect to different domain from within an " +
                          "iframe. (" + JSON.stringify([_window.location.href, trans_url, base_url]) +
                          ")");
                return;
            }
            facade = new FacadeJS();
            facade._transport = new FacadeJS[protocol](facade, trans_url, base_url);
            break;
        case 'm':
            facade._doSend(data);
            break;
        case 'c':
            if (facade)
                facade._doCleanup();
            facade = null;
            break;
        }
    };

    // alert('test ticker');
    // facade = new FacadeJS();
    // facade._transport = new FacadeJS['w-iframe-xhr-polling'](facade, 'http://host.com:9999/ticker/12/basd');

    utils.attachMessage(onMessage);

    // Start
    postMessage('s');
};
//         [*] End of lib/trans-iframe-within.js


//         [*] Including lib/info.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var InfoReceiver = function(base_url, AjaxObject) {
    var that = this;
    utils.delay(function(){that.doXhr(base_url, AjaxObject);});
};

InfoReceiver.prototype = new EventEmitter(['finish']);

InfoReceiver.prototype.doXhr = function(base_url, AjaxObject) {
    var that = this;
    var t0 = (new Date()).getTime();
    var xo = new AjaxObject('GET', base_url + '/info');

    var tref = utils.delay(8000,
                           function(){xo.ontimeout();});

    xo.onfinish = function(status, text) {
        clearTimeout(tref);
        tref = null;
        if (status === 200) {
            var rtt = (new Date()).getTime() - t0;
            var info = JSON.parse(text);
            if (typeof info !== 'object') info = {};
            that.emit('finish', info, rtt);
        } else {
            that.emit('finish');
        }
    };
    xo.ontimeout = function() {
        xo.close();
        that.emit('finish');
    };
};

var InfoReceiverIframe = function(base_url) {
    var that = this;
    var go = function() {
        var ifr = new IframeTransport();
        ifr.protocol = 'w-iframe-info-receiver';
        var fun = function(r) {
            if (typeof r === 'string' && r.substr(0,1) === 'm') {
                var d = JSON.parse(r.substr(1));
                var info = d[0], rtt = d[1];
                that.emit('finish', info, rtt);
            } else {
                that.emit('finish');
            }
            ifr.doCleanup();
            ifr = null;
        };
        var mock_ri = {
            _options: {},
            _didClose: fun,
            _didMessage: fun
        };
        ifr.i_constructor(mock_ri, base_url, base_url);
    }
    if(!_document.body) {
        utils.attachEvent('load', go);
    } else {
        go();
    }
};
InfoReceiverIframe.prototype = new EventEmitter(['finish']);


var InfoReceiverFake = function() {
    // It may not be possible to do cross domain AJAX to get the info
    // data, for example for IE7. But we want to run JSONP, so let's
    // fake the response, with rtt=2s (rto=6s).
    var that = this;
    utils.delay(function() {
        that.emit('finish', {}, 2000);
    });
};
InfoReceiverFake.prototype = new EventEmitter(['finish']);

var createInfoReceiver = function(base_url) {
    if (utils.isSameOriginUrl(base_url)) {
        // If, for some reason, we have SockJS locally - there's no
        // need to start up the complex machinery. Just use ajax.
        return new InfoReceiver(base_url, utils.XHRLocalObject);
    }
    switch (utils.isXHRCorsCapable()) {
    case 1:
        // XHRLocalObject -> no_credentials=true
        return new InfoReceiver(base_url, utils.XHRLocalObject);
    case 2:
// <METEOR>
// https://github.com/sockjs/sockjs-client/issues/79
        // XDR doesn't work across different schemes
        // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
        if (utils.isSameOriginScheme(base_url))
            return new InfoReceiver(base_url, utils.XDRObject);
        else
            return new InfoReceiverFake();
// </METEOR>
    case 3:
        // Opera
        return new InfoReceiverIframe(base_url);
    default:
        // IE 7
        return new InfoReceiverFake();
    };
};


var WInfoReceiverIframe = FacadeJS['w-iframe-info-receiver'] = function(ri, _trans_url, base_url) {
    var ir = new InfoReceiver(base_url, utils.XHRLocalObject);
    ir.onfinish = function(info, rtt) {
        ri._didMessage('m'+JSON.stringify([info, rtt]));
        ri._didClose();
    }
};
WInfoReceiverIframe.prototype.doCleanup = function() {};
//         [*] End of lib/info.js


//         [*] Including lib/trans-iframe-eventsource.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var EventSourceIframeTransport = SockJS['iframe-eventsource'] = function () {
    var that = this;
    that.protocol = 'w-iframe-eventsource';
    that.i_constructor.apply(that, arguments);
};

EventSourceIframeTransport.prototype = new IframeTransport();

EventSourceIframeTransport.enabled = function () {
    return ('EventSource' in _window) && IframeTransport.enabled();
};

EventSourceIframeTransport.need_body = true;
EventSourceIframeTransport.roundTrips = 3; // html, javascript, eventsource


// w-iframe-eventsource
var EventSourceTransport = FacadeJS['w-iframe-eventsource'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/eventsource', EventSourceReceiver, utils.XHRLocalObject);
}
EventSourceTransport.prototype = new AjaxBasedTransport();
//         [*] End of lib/trans-iframe-eventsource.js


//         [*] Including lib/trans-iframe-xhr-polling.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var XhrPollingIframeTransport = SockJS['iframe-xhr-polling'] = function () {
    var that = this;
    that.protocol = 'w-iframe-xhr-polling';
    that.i_constructor.apply(that, arguments);
};

XhrPollingIframeTransport.prototype = new IframeTransport();

XhrPollingIframeTransport.enabled = function () {
    return _window.XMLHttpRequest && IframeTransport.enabled();
};

XhrPollingIframeTransport.need_body = true;
XhrPollingIframeTransport.roundTrips = 3; // html, javascript, xhr


// w-iframe-xhr-polling
var XhrPollingITransport = FacadeJS['w-iframe-xhr-polling'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/xhr', XhrReceiver, utils.XHRLocalObject);
};

XhrPollingITransport.prototype = new AjaxBasedTransport();
//         [*] End of lib/trans-iframe-xhr-polling.js


//         [*] Including lib/trans-iframe-htmlfile.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// This transport generally works in any browser, but will cause a
// spinning cursor to appear in any browser other than IE.
// We may test this transport in all browsers - why not, but in
// production it should be only run in IE.

var HtmlFileIframeTransport = SockJS['iframe-htmlfile'] = function () {
    var that = this;
    that.protocol = 'w-iframe-htmlfile';
    that.i_constructor.apply(that, arguments);
};

// Inheritance.
HtmlFileIframeTransport.prototype = new IframeTransport();

HtmlFileIframeTransport.enabled = function() {
    return IframeTransport.enabled();
};

HtmlFileIframeTransport.need_body = true;
HtmlFileIframeTransport.roundTrips = 3; // html, javascript, htmlfile


// w-iframe-htmlfile
var HtmlFileTransport = FacadeJS['w-iframe-htmlfile'] = function(ri, trans_url) {
    this.run(ri, trans_url, '/htmlfile', HtmlfileReceiver, utils.XHRLocalObject);
};
HtmlFileTransport.prototype = new AjaxBasedTransport();
//         [*] End of lib/trans-iframe-htmlfile.js


//         [*] Including lib/trans-polling.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var Polling = function(ri, Receiver, recv_url, AjaxObject) {
    var that = this;
    that.ri = ri;
    that.Receiver = Receiver;
    that.recv_url = recv_url;
    that.AjaxObject = AjaxObject;
    that._scheduleRecv();
};

Polling.prototype._scheduleRecv = function() {
    var that = this;
    var poll = that.poll = new that.Receiver(that.recv_url, that.AjaxObject);
    var msg_counter = 0;
    poll.onmessage = function(e) {
        msg_counter += 1;
        that.ri._didMessage(e.data);
    };
    poll.onclose = function(e) {
        that.poll = poll = poll.onmessage = poll.onclose = null;
        if (!that.poll_is_closing) {
            if (e.reason === 'permanent') {
                that.ri._didClose(1006, 'Polling error (' + e.reason + ')');
            } else {
                that._scheduleRecv();
            }
        }
    };
};

Polling.prototype.abort = function() {
    var that = this;
    that.poll_is_closing = true;
    if (that.poll) {
        that.poll.abort();
    }
};
//         [*] End of lib/trans-polling.js


//         [*] Including lib/trans-receiver-eventsource.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var EventSourceReceiver = function(url) {
    var that = this;
    var es = new EventSource(url);
    es.onmessage = function(e) {
        that.dispatchEvent(new SimpleEvent('message',
                                           {'data': unescape(e.data)}));
    };
    that.es_close = es.onerror = function(e, abort_reason) {
        // ES on reconnection has readyState = 0 or 1.
        // on network error it's CLOSED = 2
        var reason = abort_reason ? 'user' :
            (es.readyState !== 2 ? 'network' : 'permanent');
        that.es_close = es.onmessage = es.onerror = null;
        // EventSource reconnects automatically.
        es.close();
        es = null;
        // Safari and chrome < 15 crash if we close window before
        // waiting for ES cleanup. See:
        //   https://code.google.com/p/chromium/issues/detail?id=89155
        utils.delay(200, function() {
                        that.dispatchEvent(new SimpleEvent('close', {reason: reason}));
                    });
    };
};

EventSourceReceiver.prototype = new REventTarget();

EventSourceReceiver.prototype.abort = function() {
    var that = this;
    if (that.es_close) {
        that.es_close({}, true);
    }
};
//         [*] End of lib/trans-receiver-eventsource.js


//         [*] Including lib/trans-receiver-htmlfile.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var _is_ie_htmlfile_capable;
var isIeHtmlfileCapable = function() {
    if (_is_ie_htmlfile_capable === undefined) {
        if ('ActiveXObject' in _window) {
            try {
                _is_ie_htmlfile_capable = !!new ActiveXObject('htmlfile');
            } catch (x) {}
        } else {
            _is_ie_htmlfile_capable = false;
        }
    }
    return _is_ie_htmlfile_capable;
};


var HtmlfileReceiver = function(url) {
    var that = this;
    utils.polluteGlobalNamespace();

    that.id = 'a' + utils.random_string(6, 26);
    url += ((url.indexOf('?') === -1) ? '?' : '&') +
        'c=' + escape(WPrefix + '.' + that.id);

    var constructor = isIeHtmlfileCapable() ?
        utils.createHtmlfile : utils.createIframe;

    var iframeObj;
    _window[WPrefix][that.id] = {
        start: function () {
            iframeObj.loaded();
        },
        message: function (data) {
            that.dispatchEvent(new SimpleEvent('message', {'data': data}));
        },
        stop: function () {
            that.iframe_close({}, 'network');
        }
    };
    that.iframe_close = function(e, abort_reason) {
        iframeObj.cleanup();
        that.iframe_close = iframeObj = null;
        delete _window[WPrefix][that.id];
        that.dispatchEvent(new SimpleEvent('close', {reason: abort_reason}));
    };
    iframeObj = constructor(url, function(e) {
                                that.iframe_close({}, 'permanent');
                            });
};

HtmlfileReceiver.prototype = new REventTarget();

HtmlfileReceiver.prototype.abort = function() {
    var that = this;
    if (that.iframe_close) {
        that.iframe_close({}, 'user');
    }
};
//         [*] End of lib/trans-receiver-htmlfile.js


//         [*] Including lib/trans-receiver-xhr.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

var XhrReceiver = function(url, AjaxObject) {
    var that = this;
    var buf_pos = 0;

    that.xo = new AjaxObject('POST', url, null);
    that.xo.onchunk = function(status, text) {
        if (status !== 200) return;
        while (1) {
            var buf = text.slice(buf_pos);
            var p = buf.indexOf('\n');
            if (p === -1) break;
            buf_pos += p+1;
            var msg = buf.slice(0, p);
            that.dispatchEvent(new SimpleEvent('message', {data: msg}));
        }
    };
    that.xo.onfinish = function(status, text) {
        that.xo.onchunk(status, text);
        that.xo = null;
        var reason = status === 200 ? 'network' : 'permanent';
        that.dispatchEvent(new SimpleEvent('close', {reason: reason}));
    }
};

XhrReceiver.prototype = new REventTarget();

XhrReceiver.prototype.abort = function() {
    var that = this;
    if (that.xo) {
        that.xo.close();
        that.dispatchEvent(new SimpleEvent('close', {reason: 'user'}));
        that.xo = null;
    }
};
//         [*] End of lib/trans-receiver-xhr.js


//         [*] Including lib/test-hooks.js
/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright (c) 2011-2012 VMware, Inc.
 *
 * For the license see COPYING.
 * ***** END LICENSE BLOCK *****
 */

// For testing
SockJS.getUtils = function(){
    return utils;
};

SockJS.getIframeTransport = function(){
    return IframeTransport;
};
//         [*] End of lib/test-hooks.js

                  return SockJS;
          })();
//if ('_sockjs_onload' in window) setTimeout(_sockjs_onload, 1);

// AMD compliance
if (typeof define === 'function' && define.amd) {
    define('sockjs', [], function(){return SockJS;});
}
//     [*] End of lib/index.js

// [*] End of lib/all.js

}).call(this);



// ------------------------------------------------------------------------
// packages/livedata/stream_client_sockjs.js

(function(){ // @param url {String} URL to Meteor app
//   "http://subdomain.meteor.com/" or "/" or
//   "ddp+sockjs://foo-**.meteor.com/sockjs"
Meteor._DdpClientStream = function (url) {
  var self = this;
  self._initCommon();

  //// Constants


  // how long between hearing heartbeat from the server until we declare
  // the connection dead. heartbeats come every 25s (stream_server.js)
  //
  // NOTE: this is a workaround until sockjs detects heartbeats on the
  // client automatically.
  // https://github.com/sockjs/sockjs-client/issues/67
  // https://github.com/sockjs/sockjs-node/issues/68
  self.HEARTBEAT_TIMEOUT = 60000;

  self.rawUrl = url;
  self.socket = null;

  self.sent_update_available = false;

  self.heartbeatTimer = null;

  // Listen to global 'online' event if we are running in a browser.
  // (IE8 does not support addEventListener)
  if (typeof window !== 'undefined' && window.addEventListener)
    window.addEventListener("online", _.bind(self._online, self),
                            false /* useCapture. make FF3.6 happy. */);

  //// Kickoff!
  self._launchConnection();
};

_.extend(Meteor._DdpClientStream.prototype, {

  // data is a utf8 string. Data sent while not connected is dropped on
  // the floor, and it is up the user of this API to retransmit lost
  // messages on 'reset'
  send: function (data) {
    var self = this;
    if (self.currentStatus.connected) {
      self.socket.send(data);
    }
  },

  _connected: function (welcome_message) {
    var self = this;

    if (self.connectionTimer) {
      clearTimeout(self.connectionTimer);
      self.connectionTimer = null;
    }

    if (self.currentStatus.connected) {
      // already connected. do nothing. this probably shouldn't happen.
      return;
    }

    // inspect the welcome data and decide if we have to reload
    try {
      var welcome_data = JSON.parse(welcome_message);
    } catch (err) {
      Meteor._debug("DEBUG: malformed welcome packet", welcome_message);
    }

    if (welcome_data && welcome_data.server_id) {
      if (__meteor_runtime_config__.serverId &&
          __meteor_runtime_config__.serverId !== welcome_data.server_id &&
          !self.sent_update_available) {
        self.sent_update_available = true;
        _.each(self.eventCallbacks.update_available,
               function (callback) { callback(); });
      }
    } else
      Meteor._debug("DEBUG: invalid welcome packet", welcome_data);

    // update status
    self.currentStatus.status = "connected";
    self.currentStatus.connected = true;
    self.currentStatus.retryCount = 0;
    self.statusChanged();

    // fire resets. This must come after status change so that clients
    // can call send from within a reset callback.
    _.each(self.eventCallbacks.reset, function (callback) { callback(); });

  },

  _cleanup: function () {
    var self = this;

    self._clearConnectionAndHeartbeatTimers();
    if (self.socket) {
      self.socket.onmessage = self.socket.onclose
        = self.socket.onerror = function () {};
      self.socket.close();
      self.socket = null;
    }
  },

  _clearConnectionAndHeartbeatTimers: function () {
    var self = this;
    if (self.connectionTimer) {
      clearTimeout(self.connectionTimer);
      self.connectionTimer = null;
    }
    if (self.heartbeatTimer) {
      clearTimeout(self.heartbeatTimer);
      self.heartbeatTimer = null;
    }
  },

  _heartbeat_timeout: function () {
    var self = this;
    Meteor._debug("Connection timeout. No heartbeat received.");
    self._lostConnection();
  },

  _heartbeat_received: function () {
    var self = this;
    // If we've already permanently shut down this stream, the timeout is
    // already cleared, and we don't need to set it again.
    if (self._forcedToDisconnect)
      return;
    if (self.heartbeatTimer)
      clearTimeout(self.heartbeatTimer);
    self.heartbeatTimer = setTimeout(
      _.bind(self._heartbeat_timeout, self),
      self.HEARTBEAT_TIMEOUT);
  },

  _sockjsProtocolsWhitelist: function () {
    // only allow polling protocols. no streaming.  streaming
    // makes safari spin.
    var protocolsWhitelist = [
      'xdr-polling', 'xhr-polling', 'iframe-xhr-polling', 'jsonp-polling'];

    // iOS 4 and 5 and below crash when using websockets over certain
    // proxies. this seems to be resolved with iOS 6. eg
    // https://github.com/LearnBoost/socket.io/issues/193#issuecomment-7308865.
    //
    // iOS <4 doesn't support websockets at all so sockjs will just
    // immediately fall back to http
    var noWebsockets = navigator &&
          /iPhone|iPad|iPod/.test(navigator.userAgent) &&
          /OS 4_|OS 5_/.test(navigator.userAgent);

    if (!noWebsockets)
      protocolsWhitelist = ['websocket'].concat(protocolsWhitelist);

    return protocolsWhitelist;
  },

  _launchConnection: function () {
    var self = this;
    self._cleanup(); // cleanup the old socket, if there was one.

    // Convert raw URL to SockJS URL each time we open a connection, so that we
    // can connect to random hostnames and get around browser per-host
    // connection limits.
    self.socket = new SockJS(
      Meteor._DdpClientStream._toSockjsUrl(self.rawUrl),
      undefined, {
        debug: false, protocols_whitelist: self._sockjsProtocolsWhitelist()
      });
    self.socket.onmessage = function (data) {
      self._heartbeat_received();

      // first message we get when we're connecting goes to _connected,
      // which connects us. All subsequent messages (while connected) go to
      // the callback.
      if (self.currentStatus.status === "connecting")
        self._connected(data.data);
      else if (self.currentStatus.connected)
        _.each(self.eventCallbacks.message, function (callback) {
          callback(data.data);
        });
    };
    self.socket.onclose = function () {
      // Meteor._debug("stream disconnect", _.toArray(arguments), (new Date()).toDateString());
      self._lostConnection();
    };
    self.socket.onerror = function () {
      // XXX is this ever called?
      Meteor._debug("stream error", _.toArray(arguments), (new Date()).toDateString());
    };

    self.socket.onheartbeat =  function () {
      self._heartbeat_received();
    };

    if (self.connectionTimer)
      clearTimeout(self.connectionTimer);
    self.connectionTimer = setTimeout(
      _.bind(self._lostConnection, self),
      self.CONNECT_TIMEOUT);
  }
});

}).call(this);



// ------------------------------------------------------------------------
// packages/livedata/stream_client_common.js

(function(){ 
// XXX from Underscore.String (http://epeli.github.com/underscore.string/)
var startsWith = function(str, starts) {
  return str.length >= starts.length &&
    str.substring(0, starts.length) === starts;
};
var endsWith = function(str, ends) {
  return str.length >= ends.length &&
    str.substring(str.length - ends.length) === ends;
};

// @param url {String} URL to Meteor app, eg:
//   "/" or "madewith.meteor.com" or "https://foo.meteor.com"
//   or "ddp+sockjs://ddp--****-foo.meteor.com/sockjs"
// @returns {String} URL to the endpoint with the specific scheme and subPath, e.g.
// for scheme "http" and subPath "sockjs"
//   "http://subdomain.meteor.com/sockjs" or "/sockjs"
//   or "https://ddp--1234-foo.meteor.com/sockjs"
var translateUrl =  function(url, newSchemeBase, subPath) {
  if (! newSchemeBase) {
    newSchemeBase = "http";
  }

  var ddpUrlMatch = url.match(/^ddp(i?)\+sockjs:\/\//);
  var httpUrlMatch = url.match(/^http(s?):\/\//);
  var newScheme;
  if (ddpUrlMatch) {
    // Remove scheme and split off the host.
    var urlAfterDDP = url.substr(ddpUrlMatch[0].length);
    newScheme = ddpUrlMatch[1] === "i" ? newSchemeBase : newSchemeBase + "s";
    var slashPos = urlAfterDDP.indexOf('/');
    var host =
          slashPos === -1 ? urlAfterDDP : urlAfterDDP.substr(0, slashPos);
    var rest = slashPos === -1 ? '' : urlAfterDDP.substr(slashPos);

    // In the host (ONLY!), change '*' characters into random digits. This
    // allows different stream connections to connect to different hostnames
    // and avoid browser per-hostname connection limits.
    host = host.replace(/\*/g, function () {
      return Math.floor(Random.fraction()*10);
    });

    return newScheme + '://' + host + rest;
  } else if (httpUrlMatch) {
    newScheme = !httpUrlMatch[1] ? newSchemeBase : newSchemeBase + "s";
    var urlAfterHttp = url.substr(httpUrlMatch[0].length);
    url = newScheme + "://" + urlAfterHttp;
  }

  // Prefix FQDNs but not relative URLs
  if (url.indexOf("://") === -1 && !startsWith(url, "/")) {
    url = newSchemeBase + "://" + url;
  }

  if (endsWith(url, "/"))
    return url + subPath;
  else
    return url + "/" + subPath;
};

_.extend(Meteor._DdpClientStream.prototype, {

  // Register for callbacks.
  on: function (name, callback) {
    var self = this;

    if (name !== 'message' && name !== 'reset' && name !== 'update_available')
      throw new Error("unknown event type: " + name);

    if (!self.eventCallbacks[name])
      self.eventCallbacks[name] = [];
    self.eventCallbacks[name].push(callback);
  },


  _initCommon: function () {
    var self = this;
    //// Constants

    // how long to wait until we declare the connection attempt
    // failed.
    self.CONNECT_TIMEOUT = 10000;


    // time for initial reconnect attempt.
    self.RETRY_BASE_TIMEOUT = 1000;
    // exponential factor to increase timeout each attempt.
    self.RETRY_EXPONENT = 2.2;
    // maximum time between reconnects. keep this intentionally
    // high-ish to ensure a server can recover from a failure caused
    // by load
    self.RETRY_MAX_TIMEOUT = 5 * 60000; // 5 minutes
    // time to wait for the first 2 retries.  this helps page reload
    // speed during dev mode restarts, but doesn't hurt prod too
    // much (due to CONNECT_TIMEOUT)
    self.RETRY_MIN_TIMEOUT = 10;
    // how many times to try to reconnect 'instantly'
    self.RETRY_MIN_COUNT = 2;
    // fuzz factor to randomize reconnect times by. avoid reconnect
    // storms.
    self.RETRY_FUZZ = 0.5; // +- 25%



    self.eventCallbacks = {}; // name -> [callback]

    self._forcedToDisconnect = false;

    //// Reactive status
    self.currentStatus = {
      status: "connecting",
      connected: false,
      retryCount: 0
    };


    self.statusListeners = typeof Deps !== 'undefined' && new Deps.Dependency;
    self.statusChanged = function () {
      if (self.statusListeners)
        self.statusListeners.changed();
    };

    //// Retry logic
    self.retryTimer = null;
    self.connectionTimer = null;

  },

  // Trigger a reconnect.
  reconnect: function (options) {
    var self = this;

    if (self.currentStatus.connected) {
      if (options && options._force) {
        // force reconnect.
        self._lostConnection();
      } // else, noop.
      return;
    }

    // if we're mid-connection, stop it.
    if (self.currentStatus.status === "connecting") {
      self._lostConnection();
    }

    if (self.retryTimer)
      clearTimeout(self.retryTimer);
    self.retryTimer = null;
    self.currentStatus.retryCount -= 1; // don't count manual retries
    self._retryNow();
  },

  // Permanently disconnect a stream.
  forceDisconnect: function (optionalErrorMessage) {
    var self = this;
    self._forcedToDisconnect = true;
    self._cleanup();
    if (self.retryTimer) {
      clearTimeout(self.retryTimer);
      self.retryTimer = null;
    }
    self.currentStatus = {
      status: "failed",
      connected: false,
      retryCount: 0
    };
    if (optionalErrorMessage)
      self.currentStatus.reason = optionalErrorMessage;
    self.statusChanged();
  },


  _lostConnection: function () {
    var self = this;

    self._cleanup();
    self._retryLater(); // sets status. no need to do it here.
  },

  _retryTimeout: function (count) {
    var self = this;

    if (count < self.RETRY_MIN_COUNT)
      return self.RETRY_MIN_TIMEOUT;

    var timeout = Math.min(
      self.RETRY_MAX_TIMEOUT,
      self.RETRY_BASE_TIMEOUT * Math.pow(self.RETRY_EXPONENT, count));
    // fuzz the timeout randomly, to avoid reconnect storms when a
    // server goes down.
    timeout = timeout * ((Random.fraction() * self.RETRY_FUZZ) +
                         (1 - self.RETRY_FUZZ/2));
    return timeout;
  },

  // fired when we detect that we've gone online. try to reconnect
  // immediately.
  _online: function () {
    this.reconnect();
  },

  _retryLater: function () {
    var self = this;

    var timeout = self._retryTimeout(self.currentStatus.retryCount);
    if (self.retryTimer)
      clearTimeout(self.retryTimer);
    self.retryTimer = setTimeout(_.bind(self._retryNow, self), timeout);

    self.currentStatus.status = "waiting";
    self.currentStatus.connected = false;
    self.currentStatus.retryTime = (new Date()).getTime() + timeout;
    self.statusChanged();
  },

  _retryNow: function () {
    var self = this;

    if (self._forcedToDisconnect)
      return;

    self.currentStatus.retryCount += 1;
    self.currentStatus.status = "connecting";
    self.currentStatus.connected = false;
    delete self.currentStatus.retryTime;
    self.statusChanged();

    self._launchConnection();
  },


  // Get current status. Reactive.
  status: function () {
    var self = this;
    if (self.statusListeners)
      self.statusListeners.depend();
    return self.currentStatus;
  }
});

_.extend(Meteor._DdpClientStream, {

  _toSockjsUrl: function (url) {
    return translateUrl(url, "http", "sockjs");
  },

  _toWebsocketUrl: function (url) {
    var ret = translateUrl(url, "ws", "websocket");
    return ret;
  }
});

}).call(this);



// ------------------------------------------------------------------------
// packages/livedata/livedata_common.js

(function(){ Meteor._SUPPORTED_DDP_VERSIONS = [ 'pre1' ];

Meteor._MethodInvocation = function (options) {
  var self = this;

  // true if we're running not the actual method, but a stub (that is,
  // if we're on a client (which may be a browser, or in the future a
  // server connecting to another server) and presently running a
  // simulation of a server-side method for latency compensation
  // purposes). not currently true except in a client such as a browser,
  // since there's usually no point in running stubs unless you have a
  // zero-latency connection to the user.
  this.isSimulation = options.isSimulation;

  // XXX Backwards compatibility only. Remove this before 1.0.
  this.is_simulation = this.isSimulation;

  // call this function to allow other method invocations (from the
  // same client) to continue running without waiting for this one to
  // complete.
  this._unblock = options.unblock || function () {};
  this._calledUnblock = false;

  // current user id
  this.userId = options.userId;

  // sets current user id in all appropriate server contexts and
  // reruns subscriptions
  this._setUserId = options.setUserId || function () {};

  // Scratch data scoped to this connection (livedata_connection on the
  // client, livedata_session on the server). This is only used
  // internally, but we should have real and documented API for this
  // sort of thing someday.
  this._sessionData = options.sessionData;
};

_.extend(Meteor._MethodInvocation.prototype, {
  unblock: function () {
    var self = this;
    self._calledUnblock = true;
    self._unblock();
  },
  setUserId: function(userId) {
    var self = this;
    if (self._calledUnblock)
      throw new Error("Can't call setUserId in a method after calling unblock");
    self.userId = userId;
    self._setUserId(userId);
  }
});

Meteor._parseDDP = function (stringMessage) {
  try {
    var msg = JSON.parse(stringMessage);
  } catch (e) {
    Meteor._debug("Discarding message with invalid JSON", stringMessage);
    return null;
  }
  // DDP messages must be objects.
  if (msg === null || typeof msg !== 'object') {
    Meteor._debug("Discarding non-object DDP message", stringMessage);
    return null;
  }

  // massage msg to get it into "abstract ddp" rather than "wire ddp" format.

  // switch between "cleared" rep of unsetting fields and "undefined"
  // rep of same
  if (_.has(msg, 'cleared')) {
    if (!_.has(msg, 'fields'))
      msg.fields = {};
    _.each(msg.cleared, function (clearKey) {
      msg.fields[clearKey] = undefined;
    });
    delete msg.cleared;
  }

  _.each(['fields', 'params', 'result'], function (field) {
    if (_.has(msg, field))
      msg[field] = EJSON._adjustTypesFromJSONValue(msg[field]);
  });

  return msg;
};

Meteor._stringifyDDP = function (msg) {
  var copy = EJSON.clone(msg);
  // swizzle 'changed' messages from 'fields undefined' rep to 'fields
  // and cleared' rep
  if (_.has(msg, 'fields')) {
    var cleared = [];
    _.each(msg.fields, function (value, key) {
      if (value === undefined) {
        cleared.push(key);
        delete copy.fields[key];
      }
    });
    if (!_.isEmpty(cleared))
      copy.cleared = cleared;
    if (_.isEmpty(copy.fields))
      delete copy.fields;
  }
  // adjust types to basic
  _.each(['fields', 'params', 'result'], function (field) {
    if (_.has(copy, field))
      copy[field] = EJSON._adjustTypesToJSONValue(copy[field]);
  });
  if (msg.id && typeof msg.id !== 'string') {
    throw new Error("Message id is not a string");
  }
  return JSON.stringify(copy);
};

Meteor._CurrentInvocation = new Meteor.EnvironmentVariable;

// Note: The DDP server assumes that Meteor.Error EJSON-serializes as an object
// containing 'error' and optionally 'reason' and 'details'.
// The DDP client manually puts these into Meteor.Error objects. (We don't use
// EJSON.addType here because the type is determined by location in the
// protocol, not text on the wire.)
Meteor.Error = Meteor.makeErrorType(
  "Meteor.Error",
  function (error, reason, details) {
    var self = this;

    // Currently, a numeric code, likely similar to a HTTP code (eg,
    // 404, 500). That is likely to change though.
    self.error = error;

    // Optional: A short human-readable summary of the error. Not
    // intended to be shown to end users, just developers. ("Not Found",
    // "Internal Server Error")
    self.reason = reason;

    // Optional: Additional information about the error, say for
    // debugging. It might be a (textual) stack trace if the server is
    // willing to provide one. The corresponding thing in HTTP would be
    // the body of a 404 or 500 response. (The difference is that we
    // never expect this to be shown to end users, only developers, so
    // it doesn't need to be pretty.)
    self.details = details;

    // This is what gets displayed at the top of a stack trace. Current
    // format is "[404]" (if no reason is set) or "File not found [404]"
    if (self.reason)
      self.message = self.reason + ' [' + self.error + ']';
    else
      self.message = '[' + self.error + ']';
  });

}).call(this);



// ------------------------------------------------------------------------
// packages/livedata/livedata_connection.js

(function(){ if (Meteor.isServer) {
  // XXX namespacing
  var path = Npm.require('path');
  var Fiber = Npm.require('fibers');
  var Future = Npm.require(path.join('fibers', 'future'));
}

// @param url {String|Object} URL to Meteor app,
//   or an object as a test hook (see code)
// Options:
//   reloadOnUpdate: should we try to reload when the server says
//                      there's new code available?
//   reloadWithOutstanding: is it OK to reload if there are outstanding methods?
Meteor._LivedataConnection = function (url, options) {
  var self = this;
  options = _.extend({
    reloadOnUpdate: false,
    // The rest of these options are only for testing.
    reloadWithOutstanding: false,
    supportedDDPVersions: Meteor._SUPPORTED_DDP_VERSIONS,
    onConnectionFailure: function (reason) {
      Meteor._debug("Failed DDP connection: " + reason);
    },
    onConnected: function () {}
  }, options);

  // If set, called when we reconnect, queuing method calls _before_ the
  // existing outstanding ones. This is the only data member that is part of the
  // public API!
  self.onReconnect = null;

  // as a test hook, allow passing a stream instead of a url.
  if (typeof url === "object") {
    self._stream = url;
  } else {
    self._stream = new Meteor._DdpClientStream(url);
  }

  self._lastSessionId = null;
  self._versionSuggestion = null;  // The last proposed DDP version.
  self._version = null;   // The DDP version agreed on by client and server.
  self._stores = {}; // name -> object with methods
  self._methodHandlers = {}; // name -> func
  self._nextMethodId = 1;
  self._supportedDDPVersions = options.supportedDDPVersions;

  // Tracks methods which the user has tried to call but which have not yet
  // called their user callback (ie, they are waiting on their result or for all
  // of their writes to be written to the local cache). Map from method ID to
  // MethodInvoker object.
  self._methodInvokers = {};

  // Tracks methods which the user has called but whose result messages have not
  // arrived yet.
  //
  // _outstandingMethodBlocks is an array of blocks of methods. Each block
  // represents a set of methods that can run at the same time. The first block
  // represents the methods which are currently in flight; subsequent blocks
  // must wait for previous blocks to be fully finished before they can be sent
  // to the server.
  //
  // Each block is an object with the following fields:
  // - methods: a list of MethodInvoker objects
  // - wait: a boolean; if true, this block had a single method invoked with
  //         the "wait" option
  //
  // There will never be adjacent blocks with wait=false, because the only thing
  // that makes methods need to be serialized is a wait method.
  //
  // Methods are removed from the first block when their "result" is
  // received. The entire first block is only removed when all of the in-flight
  // methods have received their results (so the "methods" list is empty) *AND*
  // all of the data written by those methods are visible in the local cache. So
  // it is possible for the first block's methods list to be empty, if we are
  // still waiting for some objects to quiesce.
  //
  // Example:
  //  _outstandingMethodBlocks = [
  //    {wait: false, methods: []},
  //    {wait: true, methods: [<MethodInvoker for 'login'>]},
  //    {wait: false, methods: [<MethodInvoker for 'foo'>,
  //                            <MethodInvoker for 'bar'>]}]
  // This means that there were some methods which were sent to the server and
  // which have returned their results, but some of the data written by
  // the methods may not be visible in the local cache. Once all that data is
  // visible, we will send a 'login' method. Once the login method has returned
  // and all the data is visible (including re-running subs if userId changes),
  // we will send the 'foo' and 'bar' methods in parallel.
  self._outstandingMethodBlocks = [];

  // method ID -> array of objects with keys 'collection' and 'id', listing
  // documents written by a given method's stub. keys are associated with
  // methods whose stub wrote at least one document, and whose data-done message
  // has not yet been received.
  self._documentsWrittenByStub = {};
  // collection -> id -> "server document" object. A "server document" has:
  // - "document": the version of the document according the
  //   server (ie, the snapshot before a stub wrote it, amended by any changes
  //   received from the server)
  //   It is undefined if we think the document does not exist
  // - "writtenByStubs": a set of method IDs whose stubs wrote to the document
  //   whose "data done" messages have not yet been processed
  self._serverDocuments = {};

  // Array of callbacks to be called after the next update of the local
  // cache. Used for:
  //  - Calling methodInvoker.dataVisible and sub ready callbacks after
  //    the relevant data is flushed.
  //  - Invoking the callbacks of "half-finished" methods after reconnect
  //    quiescence. Specifically, methods whose result was received over the old
  //    connection (so we don't re-send it) but whose data had not been made
  //    visible.
  self._afterUpdateCallbacks = [];

  // In two contexts, we buffer all incoming data messages and then process them
  // all at once in a single update:
  //   - During reconnect, we buffer all data messages until all subs that had
  //     been ready before reconnect are ready again, and all methods that are
  //     active have returned their "data done message"; then
  //   - During the execution of a "wait" method, we buffer all data messages
  //     until the wait method gets its "data done" message. (If the wait method
  //     occurs during reconnect, it doesn't get any special handling.)
  // all data messages are processed in one update.
  //
  // The following fields are used for this "quiescence" process.

  // This buffers the messages that aren't being processed yet.
  self._messagesBufferedUntilQuiescence = [];
  // Map from method ID -> true. Methods are removed from this when their
  // "data done" message is received, and we will not quiesce until it is
  // empty.
  self._methodsBlockingQuiescence = {};
  // map from sub ID -> true for subs that were ready (ie, called the sub
  // ready callback) before reconnect but haven't become ready again yet
  self._subsBeingRevived = {}; // map from sub._id -> true
  // if true, the next data update should reset all stores. (set during
  // reconnect.)
  self._resetStores = false;

  // name -> array of updates for (yet to be created) collections
  self._updatesForUnknownStores = {};
  // if we're blocking a migration, the retry func
  self._retryMigrate = null;

  // metadata for subscriptions.  Map from sub ID to object with keys:
  //   - id
  //   - name
  //   - params
  //   - inactive (if true, will be cleaned up if not reused in re-run)
  //   - ready (has the 'ready' message been received?)
  //   - readyCallback (an optional callback to call when ready)
  //   - errorCallback (an optional callback to call if the sub terminates with
  //                    an error)
  self._subscriptions = {};

  // Per-connection scratch area. This is only used internally, but we
  // should have real and documented API for this sort of thing someday.
  self._sessionData = {};

  // Reactive userId.
  self._userId = null;
  self._userIdDeps = (typeof Deps !== "undefined") && new Deps.Dependency;

  // Block auto-reload while we're waiting for method responses.
  if (Meteor._reload && !options.reloadWithOutstanding) {
    Meteor._reload.onMigrate(function (retry) {
      if (!self._readyToMigrate()) {
        if (self._retryMigrate)
          throw new Error("Two migrations in progress?");
        self._retryMigrate = retry;
        return false;
      } else {
        return [true];
      }
    });
  }

  var onMessage = function (raw_msg) {
    try {
      var msg = Meteor._parseDDP(raw_msg);
    } catch (e) {
      Meteor._debug("Exception while parsing DDP", e);
      return;
    }

    if (msg === null || !msg.msg) {
      Meteor._debug("discarding invalid livedata message", msg);
      return;
    }

    if (msg.msg === 'connected') {
      self._version = self._versionSuggestion;
      options.onConnected();
      self._livedata_connected(msg);
    }
    else if (msg.msg == 'failed') {
      if (_.contains(self._supportedDDPVersions, msg.version)) {
        self._versionSuggestion = msg.version;
        self._stream.reconnect({_force: true});
      } else {
        var error =
              "Version negotiation failed; server requested version " + msg.version;
        self._stream.forceDisconnect(error);
        options.onConnectionFailure(error);
      }
    }
    else if (_.include(['added', 'changed', 'removed', 'ready', 'updated'], msg.msg))
      self._livedata_data(msg);
    else if (msg.msg === 'nosub')
      self._livedata_nosub(msg);
    else if (msg.msg === 'result')
      self._livedata_result(msg);
    else if (msg.msg === 'error')
      self._livedata_error(msg);
    else
      Meteor._debug("discarding unknown livedata message type", msg);
  };

  var onReset = function () {
    // Send a connect message at the beginning of the stream.
    // NOTE: reset is called even on the first connection, so this is
    // the only place we send this message.
    var msg = {msg: 'connect'};
    if (self._lastSessionId)
      msg.session = self._lastSessionId;
    msg.version = self._versionSuggestion || self._supportedDDPVersions[0];
    self._versionSuggestion = msg.version;
    msg.support = self._supportedDDPVersions;
    self._send(msg);

    // Now, to minimize setup latency, go ahead and blast out all of
    // our pending methods ands subscriptions before we've even taken
    // the necessary RTT to know if we successfully reconnected. (1)
    // They're supposed to be idempotent; (2) even if we did
    // reconnect, we're not sure what messages might have gotten lost
    // (in either direction) since we were disconnected (TCP being
    // sloppy about that.)

    // If the current block of methods all got their results (but didn't all get
    // their data visible), discard the empty block now.
    if (! _.isEmpty(self._outstandingMethodBlocks) &&
        _.isEmpty(self._outstandingMethodBlocks[0].methods)) {
      self._outstandingMethodBlocks.shift();
    }

    // Mark all messages as unsent, they have not yet been sent on this
    // connection.
    _.each(self._methodInvokers, function (m) {
      m.sentMessage = false;
    });

    // If an `onReconnect` handler is set, call it first. Go through
    // some hoops to ensure that methods that are called from within
    // `onReconnect` get executed _before_ ones that were originally
    // outstanding (since `onReconnect` is used to re-establish auth
    // certificates)
    if (self.onReconnect)
      self._callOnReconnectAndSendAppropriateOutstandingMethods();
    else
      self._sendOutstandingMethods();

    // add new subscriptions at the end. this way they take effect after
    // the handlers and we don't see flicker.
    _.each(self._subscriptions, function (sub, id) {
      self._send({
        msg: 'sub',
        id: id,
        name: sub.name,
        params: sub.params
      });
    });
  };

  if (Meteor.isServer) {
    self._stream.on('message', Meteor.bindEnvironment(onMessage, Meteor._debug));
    self._stream.on('reset', Meteor.bindEnvironment(onReset, Meteor._debug));
  } else {
    self._stream.on('message', onMessage);
    self._stream.on('reset', onReset);
  }


  if (Meteor._reload && options.reloadOnUpdate) {
    self._stream.on('update_available', function () {
      // Start trying to migrate to a new version. Until all packages
      // signal that they're ready for a migration, the app will
      // continue running normally.
      Meteor._reload.reload();
    });
  }

};

// A MethodInvoker manages sending a method to the server and calling the user's
// callbacks. On construction, it registers itself in the connection's
// _methodInvokers map; it removes itself once the method is fully finished and
// the callback is invoked. This occurs when it has both received a result,
// and the data written by it is fully visible.
var MethodInvoker = function (options) {
  var self = this;

  // Public (within this file) fields.
  self.methodId = options.methodId;
  self.sentMessage = false;

  self._callback = options.callback;
  self._connection = options.connection;
  self._message = options.message;
  self._onResultReceived = options.onResultReceived || function () {};
  self._wait = options.wait;
  self._methodResult = null;
  self._dataVisible = false;

  // Register with the connection.
  self._connection._methodInvokers[self.methodId] = self;
};
_.extend(MethodInvoker.prototype, {
  // Sends the method message to the server. May be called additional times if
  // we lose the connection and reconnect before receiving a result.
  sendMessage: function () {
    var self = this;
    // This function is called before sending a method (including resending on
    // reconnect). We should only (re)send methods where we don't already have a
    // result!
    if (self.gotResult())
      throw new Error("sendingMethod is called on method with result");

    // If we're re-sending it, it doesn't matter if data was written the first
    // time.
    self._dataVisible = false;

    self.sentMessage = true;

    // If this is a wait method, make all data messages be buffered until it is
    // done.
    if (self._wait)
      self._connection._methodsBlockingQuiescence[self.methodId] = true;

    // Actually send the message.
    self._connection._send(self._message);
  },
  // Invoke the callback, if we have both a result and know that all data has
  // been written to the local cache.
  _maybeInvokeCallback: function () {
    var self = this;
    if (self._methodResult && self._dataVisible) {
      // Call the callback. (This won't throw: the callback was wrapped with
      // bindEnvironment.)
      self._callback(self._methodResult[0], self._methodResult[1]);

      // Forget about this method.
      delete self._connection._methodInvokers[self.methodId];

      // Let the connection know that this method is finished, so it can try to
      // move on to the next block of methods.
      self._connection._outstandingMethodFinished();
    }
  },
  // Call with the result of the method from the server. Only may be called
  // once; once it is called, you should not call sendMessage again.
  // If the user provided an onResultReceived callback, call it immediately.
  // Then invoke the main callback if data is also visible.
  receiveResult: function (err, result) {
    var self = this;
    if (self.gotResult())
      throw new Error("Methods should only receive results once");
    self._methodResult = [err, result];
    self._onResultReceived(err, result);
    self._maybeInvokeCallback();
  },
  // Call this when all data written by the method is visible. This means that
  // the method has returns its "data is done" message *AND* all server
  // documents that are buffered at that time have been written to the local
  // cache. Invokes the main callback if the result has been received.
  dataVisible: function () {
    var self = this;
    self._dataVisible = true;
    self._maybeInvokeCallback();
  },
  // True if receiveResult has been called.
  gotResult: function () {
    var self = this;
    return !!self._methodResult;
  }
});

_.extend(Meteor._LivedataConnection.prototype, {
  // 'name' is the name of the data on the wire that should go in the
  // store. 'wrappedStore' should be an object with methods beginUpdate, update,
  // endUpdate, saveOriginals, retrieveOriginals. see Collection for an example.
  registerStore: function (name, wrappedStore) {
    var self = this;

    if (name in self._stores)
      return false;

    // Wrap the input object in an object which makes any store method not
    // implemented by 'store' into a no-op.
    var store = {};
    _.each(['update', 'beginUpdate', 'endUpdate', 'saveOriginals',
            'retrieveOriginals'], function (method) {
              store[method] = function () {
                return (wrappedStore[method]
                        ? wrappedStore[method].apply(wrappedStore, arguments)
                        : undefined);
              };
            });

    self._stores[name] = store;

    var queued = self._updatesForUnknownStores[name];
    if (queued) {
      store.beginUpdate(queued.length, false);
      _.each(queued, function (msg) {
        store.update(msg);
      });
      store.endUpdate();
      delete self._updatesForUnknownStores[name];
    }

    return true;
  },

  subscribe: function (name /* .. [arguments] .. (callback|callbacks) */) {
    var self = this;

    var params = Array.prototype.slice.call(arguments, 1);
    var callbacks = {};
    if (params.length) {
      var lastParam = params[params.length - 1];
      if (typeof lastParam === "function") {
        callbacks.onReady = params.pop();
      } else if (lastParam && (typeof lastParam.onReady === "function" ||
                               typeof lastParam.onError === "function")) {
        callbacks = params.pop();
      }
    }

    // Is there an existing sub with the same name and param, run in an
    // invalidated Computation? This will happen if we are rerunning an
    // existing computation.
    //
    // For example, consider a rerun of:
    //
    //     Deps.autorun(function () {
    //       Meteor.subscribe("foo", Session.get("foo"));
    //       Meteor.subscribe("bar", Session.get("bar"));
    //     });
    //
    // If "foo" has changed but "bar" has not, we will match the "bar"
    // subcribe to an existing inactive subscription in order to not
    // unsub and resub the subscription unnecessarily.
    //
    // We only look for one such sub; if there are N apparently-identical subs
    // being invalidated, we will require N matching subscribe calls to keep
    // them all active.
    var existing = _.find(self._subscriptions, function (sub) {
      return sub.inactive && sub.name === name &&
        EJSON.equals(sub.params, params);
    });

    var id;
    if (existing) {
      id = existing.id;
      existing.inactive = false; // reactivate

      if (callbacks.onReady) {
        // If the sub is not already ready, replace any ready callback with the
        // one provided now. (It's not really clear what users would expect for
        // an onReady callback inside an autorun; the semantics we provide is
        // that at the time the sub first becomes ready, we call the last
        // onReady callback provided, if any.)
        if (!existing.ready)
          existing.readyCallback = callbacks.onReady;
      }
      if (callbacks.onError) {
        // Replace existing callback if any, so that errors aren't
        // double-reported.
        existing.errorCallback = callbacks.onError;
      }
    } else {
      // New sub! Generate an id, save it locally, and send message.
      id = Random.id();
      self._subscriptions[id] = {
        id: id,
        name: name,
        params: params,
        inactive: false,
        ready: false,
        readyDeps: (typeof Deps !== "undefined") && new Deps.Dependency,
        readyCallback: callbacks.onReady,
        errorCallback: callbacks.onError
      };
      self._send({msg: 'sub', id: id, name: name, params: params});
    }

    // return a handle to the application.
    var handle = {
      stop: function () {
        if (!_.has(self._subscriptions, id))
          return;
        self._send({msg: 'unsub', id: id});
        delete self._subscriptions[id];
      },
      ready: function () {
        // return false if we've unsubscribed.
        if (!_.has(self._subscriptions, id))
          return false;
        var record = self._subscriptions[id];
        record.readyDeps && record.readyDeps.depend();
        return record.ready;
      }
    };

    if (Deps.active) {
      // We're in a reactive computation, so we'd like to unsubscribe when the
      // computation is invalidated... but not if the rerun just re-subscribes
      // to the same subscription!  When a rerun happens, we use onInvalidate
      // as a change to mark the subscription "inactive" so that it can
      // be reused from the rerun.  If it isn't reused, it's killed from
      // an afterFlush.
      Deps.onInvalidate(function (c) {
        if (_.has(self._subscriptions, id))
          self._subscriptions[id].inactive = true;

        Deps.afterFlush(function () {
          if (_.has(self._subscriptions, id) &&
              self._subscriptions[id].inactive)
            handle.stop();
        });
      });
    }

    return handle;
  },

  methods: function (methods) {
    var self = this;
    _.each(methods, function (func, name) {
      if (self._methodHandlers[name])
        throw new Error("A method named '" + name + "' is already defined");
      self._methodHandlers[name] = func;
    });
  },

  call: function (name /* .. [arguments] .. callback */) {
    // if it's a function, the last argument is the result callback,
    // not a parameter to the remote method.
    var args = Array.prototype.slice.call(arguments, 1);
    if (args.length && typeof args[args.length - 1] === "function")
      var callback = args.pop();
    return this.apply(name, args, callback);
  },

  // @param options {Optional Object}
  //   wait: Boolean - Should we wait to call this until all current methods
  //                   are fully finished, and block subsequent method calls
  //                   until this method is fully finished?
  //                   (does not affect methods called from within this method)
  //   onResultReceived: Function - a callback to call as soon as the method
  //                                result is received. the data written by
  //                                the method may not yet be in the cache!
  // @param callback {Optional Function}
  apply: function (name, args, options, callback) {
    var self = this;

    // We were passed 3 arguments. They may be either (name, args, options)
    // or (name, args, callback)
    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    }
    options = options || {};

    if (callback) {
      // XXX would it be better form to do the binding in stream.on,
      // or caller, instead of here?
      callback = Meteor.bindEnvironment(callback, function (e) {
        // XXX improve error message (and how we report it)
        Meteor._debug("Exception while delivering result of invoking '" +
                      name + "'", e, e.stack);
      });
    }

    // Lazily allocate method ID once we know that it'll be needed.
    var methodId = (function () {
      var id;
      return function () {
        if (id === undefined)
          id = '' + (self._nextMethodId++);
        return id;
      };
    })();

    // Run the stub, if we have one. The stub is supposed to make some
    // temporary writes to the database to give the user a smooth experience
    // until the actual result of executing the method comes back from the
    // server (whereupon the temporary writes to the database will be reversed
    // during the beginUpdate/endUpdate process.)
    //
    // Normally, we ignore the return value of the stub (even if it is an
    // exception), in favor of the real return value from the server. The
    // exception is if the *caller* is a stub. In that case, we're not going
    // to do a RPC, so we use the return value of the stub as our return
    // value.

    var enclosing = Meteor._CurrentInvocation.get();
    var alreadyInSimulation = enclosing && enclosing.isSimulation;

    var stub = self._methodHandlers[name];
    if (stub) {
      var setUserId = function(userId) {
        self.setUserId(userId);
      };
      var invocation = new Meteor._MethodInvocation({
        isSimulation: true,
        userId: self.userId(), setUserId: setUserId,
        sessionData: self._sessionData
      });

      if (!alreadyInSimulation)
        self._saveOriginals();

      try {
        // Note that unlike in the corresponding server code, we never audit
        // that stubs check() their arguments.
        var ret = Meteor._CurrentInvocation.withValue(invocation,function () {
          if (Meteor.isServer) {
            // Because saveOriginals and retrieveOriginals aren't reentrant,
            // don't allow stubs to yield.
            return Meteor._noYieldsAllowed(function () {
              return stub.apply(invocation, EJSON.clone(args));
            });
          } else {
            return stub.apply(invocation, EJSON.clone(args));
          }
        });
      }
      catch (e) {
        var exception = e;
      }

      if (!alreadyInSimulation)
        self._retrieveAndStoreOriginals(methodId());
    }

    // If we're in a simulation, stop and return the result we have,
    // rather than going on to do an RPC. If there was no stub,
    // we'll end up returning undefined.
    if (alreadyInSimulation) {
      if (callback) {
        callback(exception, ret);
        return undefined;
      }
      if (exception)
        throw exception;
      return ret;
    }

    // If an exception occurred in a stub, and we're ignoring it
    // because we're doing an RPC and want to use what the server
    // returns instead, log it so the developer knows.
    //
    // Tests can set the 'expected' flag on an exception so it won't
    // go to log.
    if (exception && !exception.expected) {
      Meteor._debug("Exception while simulating the effect of invoking '" +
                    name + "'", exception, exception.stack);
    }


    // At this point we're definitely doing an RPC, and we're going to
    // return the value of the RPC to the caller.

    // If the caller didn't give a callback, decide what to do.
    if (!callback) {
      if (Meteor.isClient)
        // On the client, we don't have fibers, so we can't block. The
        // only thing we can do is to return undefined and discard the
        // result of the RPC.
        callback = function () {};
      else {
        // On the server, make the function synchronous.
        var future = new Future;
        callback = function (err, result) {
          if (err)
            future['throw'](err);
          else {
            future['return'](result);
          }
        };
      }
    }
    // Send the RPC. Note that on the client, it is important that the
    // stub have finished before we send the RPC, so that we know we have
    // a complete list of which local documents the stub wrote.
    var methodInvoker = new MethodInvoker({
      methodId: methodId(),
      callback: callback,
      connection: self,
      onResultReceived: options.onResultReceived,
      wait: !!options.wait,
      message: {
        msg: 'method',
        method: name,
        params: args,
        id: methodId()
      }
    });

    if (options.wait) {
      // It's a wait method! Wait methods go in their own block.
      self._outstandingMethodBlocks.push(
        {wait: true, methods: [methodInvoker]});
    } else {
      // Not a wait method. Start a new block if the previous block was a wait
      // block, and add it to the last block of methods.
      if (_.isEmpty(self._outstandingMethodBlocks) ||
          _.last(self._outstandingMethodBlocks).wait)
        self._outstandingMethodBlocks.push({wait: false, methods: []});
      _.last(self._outstandingMethodBlocks).methods.push(methodInvoker);
    }

    // If we added it to the first block, send it out now.
    if (self._outstandingMethodBlocks.length === 1)
      methodInvoker.sendMessage();

    // If we're using the default callback on the server,
    // block waiting for the result.
    if (future) {
      return future.wait();
    }
    return undefined;
  },

  // Before calling a method stub, prepare all stores to track changes and allow
  // _retrieveAndStoreOriginals to get the original versions of changed
  // documents.
  _saveOriginals: function () {
    var self = this;
    _.each(self._stores, function (s) {
      s.saveOriginals();
    });
  },
  // Retrieves the original versions of all documents modified by the stub for
  // method 'methodId' from all stores and saves them to _serverDocuments (keyed
  // by document) and _documentsWrittenByStub (keyed by method ID).
  _retrieveAndStoreOriginals: function (methodId) {
    var self = this;
    if (self._documentsWrittenByStub[methodId])
      throw new Error("Duplicate methodId in _retrieveAndStoreOriginals");

    var docsWritten = [];
    _.each(self._stores, function (s, collection) {
      var originals = s.retrieveOriginals();
      _.each(originals, function (doc, id) {
        if (typeof id !== 'string')
          throw new Error("id is not a string");
        docsWritten.push({collection: collection, id: id});
        var serverDoc = Meteor._ensure(self._serverDocuments, collection, id);
        if (serverDoc.writtenByStubs) {
          // We're not the first stub to write this doc. Just add our method ID
          // to the record.
          serverDoc.writtenByStubs[methodId] = true;
        } else {
          // First stub! Save the original value and our method ID.
          serverDoc.document = doc;
          serverDoc.flushCallbacks = [];
          serverDoc.writtenByStubs = {};
          serverDoc.writtenByStubs[methodId] = true;
        }
      });
    });
    if (!_.isEmpty(docsWritten)) {
      self._documentsWrittenByStub[methodId] = docsWritten;
    }
  },

  // This is very much a private function we use to make the tests
  // take up fewer server resources after they complete.
  _unsubscribeAll: function () {
    var self = this;
    _.each(_.clone(self._subscriptions), function (sub, id) {
      self._send({msg: 'unsub', id: id});
      delete self._subscriptions[id];
    });
  },

  // Sends the DDP stringification of the given message object
  _send: function (obj) {
    var self = this;
    self._stream.send(Meteor._stringifyDDP(obj));
  },

  status: function (/*passthrough args*/) {
    var self = this;
    return self._stream.status.apply(self._stream, arguments);
  },

  reconnect: function (/*passthrough args*/) {
    var self = this;
    return self._stream.reconnect.apply(self._stream, arguments);
  },

  ///
  /// Reactive user system
  ///
  userId: function () {
    var self = this;
    if (self._userIdDeps)
      self._userIdDeps.depend();
    return self._userId;
  },

  setUserId: function (userId) {
    var self = this;
    // Avoid invalidating dependents if setUserId is called with current value.
    if (self._userId === userId)
      return;
    self._userId = userId;
    if (self._userIdDeps)
      self._userIdDeps.changed();
  },

  // Returns true if we are in a state after reconnect of waiting for subs to be
  // revived or early methods to finish their data, or we are waiting for a
  // "wait" method to finish.
  _waitingForQuiescence: function () {
    var self = this;
    return (! _.isEmpty(self._subsBeingRevived) ||
            ! _.isEmpty(self._methodsBlockingQuiescence));
  },

  // Returns true if any method whose message has been sent to the server has
  // not yet invoked its user callback.
  _anyMethodsAreOutstanding: function () {
    var self = this;
    return _.any(_.pluck(self._methodInvokers, 'sentMessage'));
  },

  _livedata_connected: function (msg) {
    var self = this;

    // If this is a reconnect, we'll have to reset all stores.
    if (self._lastSessionId)
      self._resetStores = true;

    if (typeof (msg.session) === "string") {
      var reconnectedToPreviousSession = (self._lastSessionId === msg.session);
      self._lastSessionId = msg.session;
    }

    if (reconnectedToPreviousSession) {
      // Successful reconnection -- pick up where we left off.  Note that right
      // now, this never happens: the server never connects us to a previous
      // session, because DDP doesn't provide enough data for the server to know
      // what messages the client has processed. We need to improve DDP to make
      // this possible, at which point we'll probably need more code here.
      return;
    }

    // Server doesn't have our data any more. Re-sync a new session.

    // Forget about messages we were buffering for unknown collections. They'll
    // be resent if still relevant.
    self._updatesForUnknownStores = {};

    if (self._resetStores) {
      // Forget about the effects of stubs. We'll be resetting all collections
      // anyway.
      self._documentsWrittenByStub = {};
      self._serverDocuments = {};
    }

    // Clear _afterUpdateCallbacks.
    self._afterUpdateCallbacks = [];

    // Mark all named subscriptions which are ready (ie, we already called the
    // ready callback) as needing to be revived.
    // XXX We should also block reconnect quiescence until autopublish is done
    //     re-publishing to avoid flicker!
    self._subsBeingRevived = {};
    _.each(self._subscriptions, function (sub, id) {
      if (sub.ready)
        self._subsBeingRevived[id] = true;
    });

    // Arrange for "half-finished" methods to have their callbacks run, and
    // track methods that were sent on this connection so that we don't
    // quiesce until they are all done.
    //
    // Start by clearing _methodsBlockingQuiescence: methods sent before
    // reconnect don't matter, and any "wait" methods sent on the new connection
    // that we drop here will be restored by the loop below.
    self._methodsBlockingQuiescence = {};
    if (self._resetStores) {
      _.each(self._methodInvokers, function (invoker) {
        if (invoker.gotResult()) {
          // This method already got its result, but it didn't call its callback
          // because its data didn't become visible. We did not resend the
          // method RPC. We'll call its callback when we get a full quiesce,
          // since that's as close as we'll get to "data must be visible".
          self._afterUpdateCallbacks.push(_.bind(invoker.dataVisible, invoker));
        } else if (invoker.sentMessage) {
          // This method has been sent on this connection (maybe as a resend
          // from the last connection, maybe from onReconnect, maybe just very
          // quickly before processing the connected message).
          //
          // We don't need to do anything special to ensure its callbacks get
          // called, but we'll count it as a method which is preventing
          // reconnect quiescence. (eg, it might be a login method that was run
          // from onReconnect, and we don't want to see flicker by seeing a
          // logged-out state.)
          self._methodsBlockingQuiescence[invoker.methodId] = true;
        }
      });
    }

    self._messagesBufferedUntilQuiescence = [];

    // If we're not waiting on any methods or subs, we can reset the stores and
    // call the callbacks immediately.
    if (!self._waitingForQuiescence()) {
      if (self._resetStores) {
        _.each(self._stores, function (s) {
          s.beginUpdate(0, true);
          s.endUpdate();
        });
        self._resetStores = false;
      }
      self._runAfterUpdateCallbacks();
    }
  },


  _processOneDataMessage: function (msg, updates) {
    var self = this;
    // Using underscore here so as not to need to capitalize.
    self['_process_' + msg.msg](msg, updates);
  },


  _livedata_data: function (msg) {
    var self = this;

    // collection name -> array of messages
    var updates = {};

    if (self._waitingForQuiescence()) {
      self._messagesBufferedUntilQuiescence.push(msg);
      _.each(msg.subs || [], function (subId) {
        delete self._subsBeingRevived[subId];
      });
      _.each(msg.methods || [], function (methodId) {
        delete self._methodsBlockingQuiescence[methodId];
      });

      if (self._waitingForQuiescence())
        return;

      // No methods or subs are blocking quiescence!
      // We'll now process and all of our buffered messages, reset all stores,
      // and apply them all at once.
      _.each(self._messagesBufferedUntilQuiescence, function (bufferedMsg) {
        self._processOneDataMessage(bufferedMsg, updates);
      });
      self._messagesBufferedUntilQuiescence = [];
    } else {
      self._processOneDataMessage(msg, updates);
    }

    if (self._resetStores || !_.isEmpty(updates)) {
      // Begin a transactional update of each store.
      _.each(self._stores, function (s, storeName) {
        s.beginUpdate(_.has(updates, storeName) ? updates[storeName].length : 0,
                      self._resetStores);
      });
      self._resetStores = false;

      _.each(updates, function (updateMessages, storeName) {
        var store = self._stores[storeName];
        if (store) {
          _.each(updateMessages, function (updateMessage) {
            store.update(updateMessage);
          });
        } else {
          // Nobody's listening for this data. Queue it up until
          // someone wants it.
          // XXX memory use will grow without bound if you forget to
          // create a collection or just don't care about it... going
          // to have to do something about that.
          if (!_.has(self._updatesForUnknownStores, storeName))
            self._updatesForUnknownStores[storeName] = [];
          Array.prototype.push.apply(self._updatesForUnknownStores[storeName],
                                     updateMessages);
        }
      });

      // End update transaction.
      _.each(self._stores, function (s) { s.endUpdate(); });
    }

    self._runAfterUpdateCallbacks();
  },

  // Call any callbacks deferred with _runWhenAllServerDocsAreFlushed whose
  // relevant docs have been flushed, as well as dataVisible callbacks at
  // reconnect-quiescence time.
  _runAfterUpdateCallbacks: function () {
    var self = this;
    var callbacks = self._afterUpdateCallbacks;
    self._afterUpdateCallbacks = [];
    _.each(callbacks, function (c) {
      c();
    });
  },

  _pushUpdate: function (updates, collection, msg) {
    var self = this;
    if (!_.has(updates, collection)) {
      updates[collection] = [];
    }
    updates[collection].push(msg);
  },

  _process_added: function (msg, updates) {
    var self = this;
    var serverDoc = Meteor._get(self._serverDocuments, msg.collection, msg.id);
    if (serverDoc) {
      // Some outstanding stub wrote here.
      if (serverDoc.document !== undefined) {
        throw new Error("It doesn't make sense to be adding something we know exists: "
                        + msg.id);
      }
      serverDoc.document = msg.fields || {};
      serverDoc.document._id = Meteor.idParse(msg.id);
    } else {
      self._pushUpdate(updates, msg.collection, msg);
    }
  },

  _process_changed: function (msg, updates) {
    var self = this;
    var serverDoc = Meteor._get(self._serverDocuments, msg.collection, msg.id);
    if (serverDoc) {
      if (serverDoc.document === undefined) {
        throw new Error("It doesn't make sense to be changing something we don't think exists: "
                        + msg.id);
      }
      LocalCollection._applyChanges(serverDoc.document, msg.fields);
    } else {
      self._pushUpdate(updates, msg.collection, msg);
    }
  },

  _process_removed: function (msg, updates) {
    var self = this;
    var serverDoc = Meteor._get(
      self._serverDocuments, msg.collection, msg.id);
    if (serverDoc) {
      // Some outstanding stub wrote here.
      if (serverDoc.document === undefined) {
        throw new Error("It doesn't make sense to be deleting something we don't know exists: "
                        + msg.id);
      }
      serverDoc.document = undefined;
    } else {
      self._pushUpdate(updates, msg.collection, {
        msg: 'removed',
        collection: msg.collection,
        id: msg.id
      });
    }
  },

  _process_updated: function (msg, updates) {
    var self = this;
    // Process "method done" messages.
    _.each(msg.methods, function (methodId) {
      _.each(self._documentsWrittenByStub[methodId], function (written) {
        var serverDoc = Meteor._get(self._serverDocuments,
                                    written.collection, written.id);
        if (!serverDoc)
          throw new Error("Lost serverDoc for " + JSON.stringify(written));
        if (!serverDoc.writtenByStubs[methodId])
          throw new Error("Doc " + JSON.stringify(written) +
                          " not written by  method " + methodId);
        delete serverDoc.writtenByStubs[methodId];
        if (_.isEmpty(serverDoc.writtenByStubs)) {
          // All methods whose stubs wrote this method have completed! We can
          // now copy the saved document to the database (reverting the stub's
          // change if the server did not write to this object, or applying the
          // server's writes if it did).

          // This is a fake ddp 'replace' message.  It's just for talking between
          // livedata connections and minimongo.
          self._pushUpdate(updates, written.collection, {
            msg: 'replace',
            id: written.id,
            replace: serverDoc.document
          });
          // Call all flush callbacks.
          _.each(serverDoc.flushCallbacks, function (c) {
            c();
          });

          // Delete this completed serverDocument. Don't bother to GC empty
          // objects inside self._serverDocuments, since there probably aren't
          // many collections and they'll be written repeatedly.
          delete self._serverDocuments[written.collection][written.id];
        }
      });
      delete self._documentsWrittenByStub[methodId];

      // We want to call the data-written callback, but we can't do so until all
      // currently buffered messages are flushed.
      var callbackInvoker = self._methodInvokers[methodId];
      if (!callbackInvoker)
        throw new Error("No callback invoker for method " + methodId);
      self._runWhenAllServerDocsAreFlushed(
        _.bind(callbackInvoker.dataVisible, callbackInvoker));
    });
  },

  _process_ready: function (msg, updates) {
    var self = this;
    // Process "sub ready" messages. "sub ready" messages don't take effect
    // until all current server documents have been flushed to the local
    // database. We can use a write fence to implement this.
    _.each(msg.subs, function (subId) {
      self._runWhenAllServerDocsAreFlushed(function () {
        var subRecord = self._subscriptions[subId];
        // Did we already unsubscribe?
        if (!subRecord)
          return;
        // Did we already receive a ready message? (Oops!)
        if (subRecord.ready)
          return;
        subRecord.readyCallback && subRecord.readyCallback();
        subRecord.ready = true;
        subRecord.readyDeps && subRecord.readyDeps.changed();
      });
    });
  },

  // Ensures that "f" will be called after all documents currently in
  // _serverDocuments have been written to the local cache. f will not be called
  // if the connection is lost before then!
  _runWhenAllServerDocsAreFlushed: function (f) {
    var self = this;
    var runFAfterUpdates = function () {
      self._afterUpdateCallbacks.push(f);
    };
    var unflushedServerDocCount = 0;
    var onServerDocFlush = function () {
      --unflushedServerDocCount;
      if (unflushedServerDocCount === 0) {
        // This was the last doc to flush! Arrange to run f after the updates
        // have been applied.
        runFAfterUpdates();
      }
    };
    _.each(self._serverDocuments, function (collectionDocs) {
      _.each(collectionDocs, function (serverDoc) {
        var writtenByStubForAMethodWithSentMessage = _.any(
          serverDoc.writtenByStubs, function (dummy, methodId) {
            var invoker = self._methodInvokers[methodId];
            return invoker && invoker.sentMessage;
          });
        if (writtenByStubForAMethodWithSentMessage) {
          ++unflushedServerDocCount;
          serverDoc.flushCallbacks.push(onServerDocFlush);
        }
      });
    });
    if (unflushedServerDocCount === 0) {
      // There aren't any buffered docs --- we can call f as soon as the current
      // round of updates is applied!
      runFAfterUpdates();
    }
  },

  _livedata_nosub: function (msg) {
    var self = this;
    // we weren't subbed anyway, or we initiated the unsub.
    if (!_.has(self._subscriptions, msg.id))
      return;
    var errorCallback = self._subscriptions[msg.id].errorCallback;
    delete self._subscriptions[msg.id];
    if (errorCallback && msg.error) {
      errorCallback(new Meteor.Error(
        msg.error.error, msg.error.reason, msg.error.details));
    }
  },

  _livedata_result: function (msg) {
    // id, result or error. error has error (code), reason, details

    var self = this;

    // find the outstanding request
    // should be O(1) in nearly all realistic use cases
    if (_.isEmpty(self._outstandingMethodBlocks)) {
      Meteor._debug("Received method result but no methods outstanding");
      return;
    }
    var currentMethodBlock = self._outstandingMethodBlocks[0].methods;
    var m;
    for (var i = 0; i < currentMethodBlock.length; i++) {
      m = currentMethodBlock[i];
      if (m.methodId === msg.id)
        break;
    }

    if (!m) {
      Meteor._debug("Can't match method response to original method call", msg);
      return;
    }

    // Remove from current method block. This may leave the block empty, but we
    // don't move on to the next block until the callback has been delivered, in
    // _outstandingMethodFinished.
    currentMethodBlock.splice(i, 1);

    if (_.has(msg, 'error')) {
      m.receiveResult(new Meteor.Error(
        msg.error.error, msg.error.reason,
        msg.error.details));
    } else {
      // msg.result may be undefined if the method didn't return a
      // value
      m.receiveResult(undefined, msg.result);
    }
  },

  // Called by MethodInvoker after a method's callback is invoked.  If this was
  // the last outstanding method in the current block, runs the next block. If
  // there are no more methods, consider accepting a hot code push.
  _outstandingMethodFinished: function () {
    var self = this;
    if (self._anyMethodsAreOutstanding())
      return;

    // No methods are outstanding. This should mean that the first block of
    // methods is empty. (Or it might not exist, if this was a method that
    // half-finished before disconnect/reconnect.)
    if (! _.isEmpty(self._outstandingMethodBlocks)) {
      var firstBlock = self._outstandingMethodBlocks.shift();
      if (! _.isEmpty(firstBlock.methods))
        throw new Error("No methods outstanding but nonempty block: " +
                        JSON.stringify(firstBlock));

      // Send the outstanding methods now in the first block.
      if (!_.isEmpty(self._outstandingMethodBlocks))
        self._sendOutstandingMethods();
    }

    // Maybe accept a hot code push.
    self._maybeMigrate();
  },

  // Sends messages for all the methods in the first block in
  // _outstandingMethodBlocks.
  _sendOutstandingMethods: function() {
    var self = this;
    if (_.isEmpty(self._outstandingMethodBlocks))
      return;
    _.each(self._outstandingMethodBlocks[0].methods, function (m) {
      m.sendMessage();
    });
  },

  _livedata_error: function (msg) {
    Meteor._debug("Received error from server: ", msg.reason);
    if (msg.offendingMessage)
      Meteor._debug("For: ", msg.offendingMessage);
  },

  _callOnReconnectAndSendAppropriateOutstandingMethods: function() {
    var self = this;
    var oldOutstandingMethodBlocks = self._outstandingMethodBlocks;
    self._outstandingMethodBlocks = [];

    self.onReconnect();

    if (_.isEmpty(oldOutstandingMethodBlocks))
      return;

    // We have at least one block worth of old outstanding methods to try
    // again. First: did onReconnect actually send anything? If not, we just
    // restore all outstanding methods and run the first block.
    if (_.isEmpty(self._outstandingMethodBlocks)) {
      self._outstandingMethodBlocks = oldOutstandingMethodBlocks;
      self._sendOutstandingMethods();
      return;
    }

    // OK, there are blocks on both sides. Special case: merge the last block of
    // the reconnect methods with the first block of the original methods, if
    // neither of them are "wait" blocks.
    if (!_.last(self._outstandingMethodBlocks).wait &&
        !oldOutstandingMethodBlocks[0].wait) {
      _.each(oldOutstandingMethodBlocks[0].methods, function (m) {
        _.last(self._outstandingMethodBlocks).methods.push(m);

        // If this "last block" is also the first block, send the message.
        if (self._outstandingMethodBlocks.length === 1)
          m.sendMessage();
      });

      oldOutstandingMethodBlocks.shift();
    }

    // Now add the rest of the original blocks on.
    _.each(oldOutstandingMethodBlocks, function (block) {
      self._outstandingMethodBlocks.push(block);
    });
  },

  // We can accept a hot code push if there are no methods in flight.
  _readyToMigrate: function() {
    var self = this;
    return _.isEmpty(self._methodInvokers);
  },

  // If we were blocking a migration, see if it's now possible to continue.
  // Call whenever the set of outstanding/blocked methods shrinks.
  _maybeMigrate: function () {
    var self = this;
    if (self._retryMigrate && self._readyToMigrate()) {
      self._retryMigrate();
      self._retryMigrate = null;
    }
  }
});

_.extend(Meteor, {
  // @param url {String} URL to Meteor app,
  //     e.g.:
  //     "subdomain.meteor.com",
  //     "http://subdomain.meteor.com",
  //     "/",
  //     "ddp+sockjs://ddp--****-foo.meteor.com/sockjs"
  connect: function (url, _reloadOnUpdate) {
    var ret = new Meteor._LivedataConnection(
      url, {reloadOnUpdate: _reloadOnUpdate});
    Meteor._LivedataConnection._allConnections.push(ret); // hack. see below.
    return ret;
  }
});

// Hack for `spiderable` package: a way to see if the page is done
// loading all the data it needs.
Meteor._LivedataConnection._allConnections = [];
Meteor._LivedataConnection._allSubscriptionsReady = function () {
  return _.all(Meteor._LivedataConnection._allConnections, function (conn) {
    return _.all(conn._subscriptions, function (sub) {
      return sub.ready;
    });
  });
};

}).call(this);



// ------------------------------------------------------------------------
// packages/livedata/client_convenience.js

(function(){ _.extend(Meteor, {
  default_connection: null,
  refresh: function (notification) {
  }
});

if (Meteor.isClient) {
  // By default, try to connect back to the same endpoint as the page
  // was served from.
  var ddpUrl = '/';
  if (typeof __meteor_runtime_config__ !== "undefined") {
    if (__meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL)
      ddpUrl = __meteor_runtime_config__.DDP_DEFAULT_CONNECTION_URL;
  }
  Meteor.default_connection =
    Meteor.connect(ddpUrl, true /* restart_on_update */);

  // Proxy the public methods of Meteor.default_connection so they can
  // be called directly on Meteor.
  _.each(['subscribe', 'methods', 'call', 'apply', 'status', 'reconnect'],
         function (name) {
           Meteor[name] = _.bind(Meteor.default_connection[name],
                                 Meteor.default_connection);
         });
} else {
  /* Never set up a default connection on the server. Don't even map
     subscribe/call/etc onto Meteor. */
}

}).call(this);



// ------------------------------------------------------------------------
// packages/ordered-dict/ordered_dict.js

(function(){ // This file defines an ordered dictionary abstraction that is useful for
// maintaining a dataset backed by observeChanges.  It supports ordering items
// by specifying the item they now come before.

// The implementation is a dictionary that contains nodes of a doubly-linked
// list as its values.

// constructs a new element struct
// next and prev are whole elements, not keys.
var element = function (key, value, next, prev) {
  return {
    key: key,
    value: value,
    next: next,
    prev: prev
  };
};
OrderedDict = function (/* ... */) {
  var self = this;
  self._dict = {};
  self._first = null;
  self._last = null;
  self._size = 0;
  var args = _.toArray(arguments);
  self._stringify = function (x) { return x; };
  if (typeof args[0] === 'function')
    self._stringify = args.shift();
  _.each(args, function (kv) {
    self.putBefore(kv[0], kv[1], null);
  });
};

_.extend(OrderedDict.prototype, {
  // the "prefix keys with a space" thing comes from here
  // https://github.com/documentcloud/underscore/issues/376#issuecomment-2815649
  _k: function (key) { return " " + this._stringify(key); },

  empty: function () {
    var self = this;
    return !self._first;
  },
  size: function () {
    var self = this;
    return self._size;
  },
  _linkEltIn: function (elt) {
    var self = this;
    if (!elt.next) {
      elt.prev = self._last;
      if (self._last)
        self._last.next = elt;
      self._last = elt;
    } else {
      elt.prev = elt.next.prev;
      elt.next.prev = elt;
      if (elt.prev)
        elt.prev.next = elt;
    }
    if (self._first === null || self._first === elt.next)
      self._first = elt;
  },
  _linkEltOut: function (elt) {
    var self = this;
    if (elt.next)
      elt.next.prev = elt.prev;
    if (elt.prev)
      elt.prev.next = elt.next;
    if (elt === self._last)
      self._last = elt.prev;
    if (elt === self._first)
      self._first = elt.next;
  },
  putBefore: function (key, item, before) {
    var self = this;
    if (self._dict[self._k(key)])
      throw new Error("Item " + key + " already present in OrderedDict");
    var elt = before ?
          element(key, item, self._dict[self._k(before)]) :
          element(key, item, null);
    if (elt.next === undefined)
      throw new Error("could not find item to put this one before");
    self._linkEltIn(elt);
    self._dict[self._k(key)] = elt;
    self._size++;
  },
  append: function (key, item) {
    var self = this;
    self.putBefore(key, item, null);
  },
  remove: function (key) {
    var self = this;
    var elt = self._dict[self._k(key)];
    if (elt === undefined)
      throw new Error("Item " + key + " not present in OrderedDict");
    self._linkEltOut(elt);
    self._size--;
    delete self._dict[self._k(key)];
    return elt.value;
  },
  get: function (key) {
    var self = this;
    if (self.has(key))
        return self._dict[self._k(key)].value;
    return undefined;
  },
  has: function (key) {
    var self = this;
    return _.has(self._dict, self._k(key));
  },
  // Iterate through the items in this dictionary in order, calling
  // iter(value, key, index) on each one.

  // Stops whenever iter returns OrderedDict.BREAK, or after the last element.
  forEach: function (iter) {
    var self = this;
    var i = 0;
    var elt = self._first;
    while (elt !== null) {
      var b = iter(elt.value, elt.key, i);
      if (b === OrderedDict.BREAK)
        return;
      elt = elt.next;
      i++;
    }
  },
  first: function () {
    var self = this;
    if (self.empty())
      return undefined;
    return self._first.key;
  },
  firstValue: function () {
    var self = this;
    if (self.empty())
      return undefined;
    return self._first.value;
  },
  last: function () {
    var self = this;
    if (self.empty())
      return undefined;
    return self._last.key;
  },
  lastValue: function () {
    var self = this;
    if (self.empty())
      return undefined;
    return self._last.value;
  },
  prev: function (key) {
    var self = this;
    if (self.has(key)) {
      var elt = self.get(key);
      if (elt.prev)
        return elt.prev.key;
    }
    return null;
  },
  next: function (key) {
    var self = this;
    if (self.has(key)) {
      var elt = self.get(key);
      if (elt.next)
        return elt.next.key;
    }
    return null;
  },
  moveBefore: function (key, before) {
    var self = this;
    var elt = self._dict[self._k(key)];
    var eltBefore = before ? self._dict[self._k(before)] : null;
    if (elt === undefined)
      throw new Error("Item to move is not present");
    if (eltBefore === undefined) {
      throw new Error("Could not find element to move this one before");
    }
    if (eltBefore === elt.next) // no moving necessary
      return;
    // remove from its old place
    self._linkEltOut(elt);
    // patch into its new place
    elt.next = eltBefore;
    self._linkEltIn(elt);
  },
  // Linear, sadly.
  indexOf: function (key) {
    var self = this;
    var ret = null;
    self.forEach(function (v, k, i) {
      if (self._k(k) === self._k(key)) {
        ret = i;
        return OrderedDict.BREAK;
      }
      return undefined;
    });
    return ret;
  },
  _checkRep: function () {
    var self = this;
    _.each(self._dict, function (k, v) {
      if (v.next === v)
        throw new Error("Next is a loop");
      if (v.prev === v)
        throw new Error("Prev is a loop");
    });
  }

});
OrderedDict.BREAK = {"break": true};

}).call(this);



// ------------------------------------------------------------------------
// packages/minimongo/minimongo.js

(function(){ // XXX type checking on selectors (graceful error if malformed)

// LocalCollection: a set of documents that supports queries and modifiers.

// Cursor: a specification for a particular subset of documents, w/
// a defined order, limit, and offset.  creating a Cursor with LocalCollection.find(),

// LiveResultsSet: the return value of a live query.

LocalCollection = function () {
  this.docs = {}; // _id -> document (also containing id)

  this._observeQueue = new Meteor._SynchronousQueue();

  this.next_qid = 1; // live query id generator

  // qid -> live query object. keys:
  //  ordered: bool. ordered queries have moved callbacks and callbacks
  //           take indices.
  //  results: array (ordered) or object (unordered) of current results
  //  results_snapshot: snapshot of results. null if not paused.
  //  cursor: Cursor object for the query.
  //  selector_f, sort_f, (callbacks): functions
  this.queries = {};

  // null if not saving originals; a map from id to original document value if
  // saving originals. See comments before saveOriginals().
  this._savedOriginals = null;

  // True when observers are paused and we should not send callbacks.
  this.paused = false;
};


LocalCollection._applyChanges = function (doc, changeFields) {
  _.each(changeFields, function (value, key) {
    if (value === undefined)
      delete doc[key];
    else
      doc[key] = value;
  });
};

LocalCollection.MinimongoError = function (message) {
  var self = this;
  self.name = "MinimongoError";
  self.details = message;
};

LocalCollection.MinimongoError.prototype = new Error;


// options may include sort, skip, limit, reactive
// sort may be any of these forms:
//     {a: 1, b: -1}
//     [["a", "asc"], ["b", "desc"]]
//     ["a", ["b", "desc"]]
//   (in the first form you're beholden to key enumeration order in
//   your javascript VM)
//
// reactive: if given, and false, don't register with Deps (default
// is true)
//
// XXX possibly should support retrieving a subset of fields? and
// have it be a hint (ignored on the client, when not copying the
// doc?)
//
// XXX sort does not yet support subkeys ('a.b') .. fix that!
// XXX add one more sort form: "key"
// XXX tests
LocalCollection.prototype.find = function (selector, options) {
  // default syntax for everything is to omit the selector argument.
  // but if selector is explicitly passed in as false or undefined, we
  // want a selector that matches nothing.
  if (arguments.length === 0)
    selector = {};

  return new LocalCollection.Cursor(this, selector, options);
};

// don't call this ctor directly.  use LocalCollection.find().
LocalCollection.Cursor = function (collection, selector, options) {
  var self = this;
  if (!options) options = {};

  this.collection = collection;

  if (LocalCollection._selectorIsId(selector)) {
    // stash for fast path
    self.selector_id = LocalCollection._idStringify(selector);
    self.selector_f = LocalCollection._compileSelector(selector);
    self.sort_f = undefined;
  } else {
    self.selector_id = undefined;
    self.selector_f = LocalCollection._compileSelector(selector);
    self.sort_f = options.sort ? LocalCollection._compileSort(options.sort) : null;
  }
  self.skip = options.skip;
  self.limit = options.limit;
  if (options.transform && typeof Deps !== "undefined")
    self._transform = Deps._makeNonreactive(options.transform);
  else
    self._transform = options.transform;

  // db_objects is a list of the objects that match the cursor. (It's always a
  // list, never an object: LocalCollection.Cursor is always ordered.)
  self.db_objects = null;
  self.cursor_pos = 0;

  // by default, queries register w/ Deps when it is available.
  if (typeof Deps !== "undefined")
    self.reactive = (options.reactive === undefined) ? true : options.reactive;
};

LocalCollection.Cursor.prototype.rewind = function () {
  var self = this;
  self.db_objects = null;
  self.cursor_pos = 0;
};

LocalCollection.prototype.findOne = function (selector, options) {
  if (arguments.length === 0)
    selector = {};

  // NOTE: by setting limit 1 here, we end up using very inefficient
  // code that recomputes the whole query on each update. The upside is
  // that when you reactively depend on a findOne you only get
  // invalidated when the found object changes, not any object in the
  // collection. Most findOne will be by id, which has a fast path, so
  // this might not be a big deal. In most cases, invalidation causes
  // the called to re-query anyway, so this should be a net performance
  // improvement.
  options = options || {};
  options.limit = 1;

  return this.find(selector, options).fetch()[0];
};

LocalCollection.Cursor.prototype.forEach = function (callback) {
  var self = this;
  var doc;

  if (self.db_objects === null)
    self.db_objects = self._getRawObjects(true);

  if (self.reactive)
    self._depend({
      addedBefore: true,
      removed: true,
      changed: true,
      movedBefore: true});

  while (self.cursor_pos < self.db_objects.length) {
    var elt = EJSON.clone(self.db_objects[self.cursor_pos++]);
    if (self._transform)
      elt = self._transform(elt);
    callback(elt);
  }
};

LocalCollection.Cursor.prototype.getTransform = function () {
  var self = this;
  return self._transform;
};

LocalCollection.Cursor.prototype.map = function (callback) {
  var self = this;
  var res = [];
  self.forEach(function (doc) {
    res.push(callback(doc));
  });
  return res;
};

LocalCollection.Cursor.prototype.fetch = function () {
  var self = this;
  var res = [];
  self.forEach(function (doc) {
    res.push(doc);
  });
  return res;
};

LocalCollection.Cursor.prototype.count = function () {
  var self = this;

  if (self.reactive)
    self._depend({added: true, removed: true});

  if (self.db_objects === null)
    self.db_objects = self._getRawObjects(true);

  return self.db_objects.length;
};

LocalCollection._isOrderedChanges = function (callbacks) {
  if (callbacks.added && callbacks.addedBefore)
    throw new Error("Please specify only one of added() and addedBefore()");
  return typeof callbacks.addedBefore == 'function' ||
    typeof callbacks.movedBefore === 'function';
};

// the handle that comes back from observe.
LocalCollection.LiveResultsSet = function () {};

// options to contain:
//  * callbacks for observe():
//    - addedAt (document, atIndex)
//    - added (document)
//    - changedAt (newDocument, oldDocument, atIndex)
//    - changed (newDocument, oldDocument)
//    - removedAt (document, atIndex)
//    - removed (document)
//    - movedTo (document, oldIndex, newIndex)
//
// attributes available on returned query handle:
//  * stop(): end updates
//  * collection: the collection this query is querying
//
// iff x is a returned query handle, (x instanceof
// LocalCollection.LiveResultsSet) is true
//
// initial results delivered through added callback
// XXX maybe callbacks should take a list of objects, to expose transactions?
// XXX maybe support field limiting (to limit what you're notified on)

_.extend(LocalCollection.Cursor.prototype, {
  observe: function (options) {
    var self = this;
    return LocalCollection._observeFromObserveChanges(self, options);
  },
  observeChanges: function (options) {
    var self = this;

    var ordered = LocalCollection._isOrderedChanges(options);

    if (!ordered && (self.skip || self.limit))
      throw new Error("must use ordered observe with skip or limit");

    // XXX merge this object w/ "this" Cursor.  they're the same.
    var query = {
      selector_f: self.selector_f, // not fast pathed
      sort_f: ordered && self.sort_f,
      results_snapshot: null,
      ordered: ordered,
      cursor: this,
      observeChanges: options.observeChanges
    };
    var qid;

    // Non-reactive queries call added[Before] and then never call anything
    // else.
    if (self.reactive) {
      qid = self.collection.next_qid++;
      self.collection.queries[qid] = query;
    }
    query.results = self._getRawObjects(ordered);
    if (self.collection.paused)
      query.results_snapshot = (ordered ? [] : {});

    // wrap callbacks we were passed. callbacks only fire when not paused and
    // are never undefined (except that query.moved is undefined for unordered
    // callbacks).

    // furthermore, callbacks enqueue until the operation we're working on is
    // done.
    var wrapCallback = function (f) {
      if (!f)
        return function () {};
      return function (/*args*/) {
        var context = this;
        var args = arguments;
        if (!self.collection.paused) {
          self.collection._observeQueue.queueTask(function () {
            f.apply(context, args);
          });
        }
      };
    };
    query.added = wrapCallback(options.added);
    query.changed = wrapCallback(options.changed);
    query.removed = wrapCallback(options.removed);
    if (ordered) {
      query.moved = wrapCallback(options.moved);
      query.addedBefore = wrapCallback(options.addedBefore);
      query.movedBefore = wrapCallback(options.movedBefore);
    }

    if (!options._suppress_initial && !self.collection.paused) {
      _.each(query.results, function (doc, i) {
        var fields = EJSON.clone(doc);
        delete fields._id;
        if (ordered)
          query.addedBefore(doc._id, fields, null);
        query.added(doc._id, fields);
      });
    }

    var handle = new LocalCollection.LiveResultsSet;
    _.extend(handle, {
      collection: self.collection,
      stop: function () {
        if (self.reactive)
          delete self.collection.queries[qid];
      }
    });

    if (self.reactive && Deps.active) {
      // XXX in many cases, the same observe will be recreated when
      // the current autorun is rerun.  we could save work by
      // letting it linger across rerun and potentially get
      // repurposed if the same observe is performed, using logic
      // similar to that of Meteor.subscribe.
      Deps.onInvalidate(function () {
        handle.stop();
      });
    }
    // run the observe callbacks resulting from the initial contents
    // before we leave the observe.
    self.collection._observeQueue.drain();

    return handle;
  }
});

// Returns a collection of matching objects, but doesn't deep copy them.
//
// If ordered is set, returns a sorted array, respecting sort_f, skip, and limit
// properties of the query.  if sort_f is falsey, no sort -- you get the natural
// order.
//
// If ordered is not set, returns an object mapping from ID to doc (sort_f, skip
// and limit should not be set).
LocalCollection.Cursor.prototype._getRawObjects = function (ordered) {
  var self = this;

  var results = ordered ? [] : {};

  // fast path for single ID value
  if (self.selector_id) {
    // If you have non-zero skip and ask for a single id, you get
    // nothing. This is so it matches the behavior of the '{_id: foo}'
    // path.
    if (self.skip)
      return results;

    if (_.has(self.collection.docs, self.selector_id)) {
      var selectedDoc = self.collection.docs[self.selector_id];
      if (ordered)
        results.push(selectedDoc);
      else
        results[self.selector_id] = selectedDoc;
    }
    return results;
  }

  // slow path for arbitrary selector, sort, skip, limit
  for (var id in self.collection.docs) {
    var doc = self.collection.docs[id];
    if (self.selector_f(doc)) {
      if (ordered)
        results.push(doc);
      else
        results[id] = doc;
    }
    // Fast path for limited unsorted queries.
    if (self.limit && !self.skip && !self.sort_f &&
        results.length === self.limit)
      return results;
  }

  if (!ordered)
    return results;

  if (self.sort_f)
    results.sort(self.sort_f);

  var idx_start = self.skip || 0;
  var idx_end = self.limit ? (self.limit + idx_start) : results.length;
  return results.slice(idx_start, idx_end);
};

// XXX Maybe we need a version of observe that just calls a callback if
// anything changed.
LocalCollection.Cursor.prototype._depend = function (changers) {
  var self = this;

  if (Deps.active) {
    var v = new Deps.Dependency;
    v.depend();
    var notifyChange = _.bind(v.changed, v);

    var options = {_suppress_initial: true};
    _.each(['added', 'changed', 'removed', 'addedBefore', 'movedBefore'],
           function (fnName) {
             if (changers[fnName])
               options[fnName] = notifyChange;
           });

    // observeChanges will stop() when this computation is invalidated
    self.observeChanges(options);
  }
};

// XXX enforce rule that field names can't start with '$' or contain '.'
// (real mongodb does in fact enforce this)
// XXX possibly enforce that 'undefined' does not appear (we assume
// this in our handling of null and $exists)
LocalCollection.prototype.insert = function (doc) {
  var self = this;
  doc = EJSON.clone(doc);

  if (!_.has(doc, '_id')) {
    // if you really want to use ObjectIDs, set this global.
    // Meteor.Collection specifies its own ids and does not use this code.
    doc._id = LocalCollection._useOID ? new LocalCollection._ObjectID()
                                      : Random.id();
  }
  var id = LocalCollection._idStringify(doc._id);

  if (_.has(self.docs, doc._id))
    throw new LocalCollection.MinimongoError("Duplicate _id '" + doc._id + "'");

  self._saveOriginal(id, undefined);
  self.docs[id] = doc;

  var queriesToRecompute = [];
  // trigger live queries that match
  for (var qid in self.queries) {
    var query = self.queries[qid];
    if (query.selector_f(doc)) {
      if (query.cursor.skip || query.cursor.limit)
        queriesToRecompute.push(qid);
      else
        LocalCollection._insertInResults(query, doc);
    }
  }

  _.each(queriesToRecompute, function (qid) {
    if (self.queries[qid])
      LocalCollection._recomputeResults(self.queries[qid]);
  });
  self._observeQueue.drain();
  return doc._id;
};

LocalCollection.prototype.remove = function (selector) {
  var self = this;
  var remove = [];

  var queriesToRecompute = [];
  var selector_f = LocalCollection._compileSelector(selector);

  // Avoid O(n) for "remove a single doc by ID".
  var specificIds = LocalCollection._idsMatchedBySelector(selector);
  if (specificIds) {
    _.each(specificIds, function (id) {
      var strId = LocalCollection._idStringify(id);
      // We still have to run selector_f, in case it's something like
      //   {_id: "X", a: 42}
      if (_.has(self.docs, strId) && selector_f(self.docs[strId]))
        remove.push(strId);
    });
  } else {
    for (var id in self.docs) {
      var doc = self.docs[id];
      if (selector_f(doc)) {
        remove.push(id);
      }
    }
  }

  var queryRemove = [];
  for (var i = 0; i < remove.length; i++) {
    var removeId = remove[i];
    var removeDoc = self.docs[removeId];
    _.each(self.queries, function (query, qid) {
      if (query.selector_f(removeDoc)) {
        if (query.cursor.skip || query.cursor.limit)
          queriesToRecompute.push(qid);
        else
          queryRemove.push({qid: qid, doc: removeDoc});
      }
    });
    self._saveOriginal(removeId, removeDoc);
    delete self.docs[removeId];
  }

  // run live query callbacks _after_ we've removed the documents.
  _.each(queryRemove, function (remove) {
    var query = self.queries[remove.qid];
    if (query)
      LocalCollection._removeFromResults(query, remove.doc);
  });
  _.each(queriesToRecompute, function (qid) {
    var query = self.queries[qid];
    if (query)
      LocalCollection._recomputeResults(query);
  });
  self._observeQueue.drain();
};

// XXX atomicity: if multi is true, and one modification fails, do
// we rollback the whole operation, or what?
LocalCollection.prototype.update = function (selector, mod, options) {
  var self = this;
  if (!options) options = {};

  if (options.upsert)
    throw new Error("upsert not yet implemented");

  var selector_f = LocalCollection._compileSelector(selector);

  // Save the original results of any query that we might need to
  // _recomputeResults on, because _modifyAndNotify will mutate the objects in
  // it. (We don't need to save the original results of paused queries because
  // they already have a results_snapshot and we won't be diffing in
  // _recomputeResults.)
  var qidToOriginalResults = {};
  _.each(self.queries, function (query, qid) {
    if ((query.cursor.skip || query.cursor.limit) && !query.paused)
      qidToOriginalResults[qid] = EJSON.clone(query.results);
  });
  var recomputeQids = {};

  for (var id in self.docs) {
    var doc = self.docs[id];
    if (selector_f(doc)) {
      // XXX Should we save the original even if mod ends up being a no-op?
      self._saveOriginal(id, doc);
      self._modifyAndNotify(doc, mod, recomputeQids);
      if (!options.multi)
        break;
    }
  }

  _.each(recomputeQids, function (dummy, qid) {
    var query = self.queries[qid];
    if (query)
      LocalCollection._recomputeResults(query,
                                        qidToOriginalResults[qid]);
  });
  self._observeQueue.drain();
};

LocalCollection.prototype._modifyAndNotify = function (
    doc, mod, recomputeQids) {
  var self = this;

  var matched_before = {};
  for (var qid in self.queries) {
    var query = self.queries[qid];
    if (query.ordered) {
      matched_before[qid] = query.selector_f(doc);
    } else {
      // Because we don't support skip or limit (yet) in unordered queries, we
      // can just do a direct lookup.
      matched_before[qid] = _.has(query.results,
                                  LocalCollection._idStringify(doc._id));
    }
  }

  var old_doc = EJSON.clone(doc);

  LocalCollection._modify(doc, mod);

  for (qid in self.queries) {
    query = self.queries[qid];
    var before = matched_before[qid];
    var after = query.selector_f(doc);

    if (query.cursor.skip || query.cursor.limit) {
      // We need to recompute any query where the doc may have been in the
      // cursor's window either before or after the update. (Note that if skip
      // or limit is set, "before" and "after" being true do not necessarily
      // mean that the document is in the cursor's output after skip/limit is
      // applied... but if they are false, then the document definitely is NOT
      // in the output. So it's safe to skip recompute if neither before or
      // after are true.)
      if (before || after)
	recomputeQids[qid] = true;
    } else if (before && !after) {
      LocalCollection._removeFromResults(query, doc);
    } else if (!before && after) {
      LocalCollection._insertInResults(query, doc);
    } else if (before && after) {
      LocalCollection._updateInResults(query, doc, old_doc);
    }
  }
};

// XXX the sorted-query logic below is laughably inefficient. we'll
// need to come up with a better datastructure for this.
//
// XXX the logic for observing with a skip or a limit is even more
// laughably inefficient. we recompute the whole results every time!

LocalCollection._insertInResults = function (query, doc) {
  var fields = EJSON.clone(doc);
  delete fields._id;
  if (query.ordered) {
    if (!query.sort_f) {
      query.addedBefore(doc._id, fields, null);
      query.results.push(doc);
    } else {
      var i = LocalCollection._insertInSortedList(
        query.sort_f, query.results, doc);
      var next = query.results[i+1];
      if (next)
        next = next._id;
      else
        next = null;
      query.addedBefore(doc._id, fields, next);
    }
    query.added(doc._id, fields);
  } else {
    query.added(doc._id, fields);
    query.results[LocalCollection._idStringify(doc._id)] = doc;
  }
};

LocalCollection._removeFromResults = function (query, doc) {
  if (query.ordered) {
    var i = LocalCollection._findInOrderedResults(query, doc);
    query.removed(doc._id);
    query.results.splice(i, 1);
  } else {
    var id = LocalCollection._idStringify(doc._id);  // in case callback mutates doc
    query.removed(doc._id);
    delete query.results[id];
  }
};

LocalCollection._updateInResults = function (query, doc, old_doc) {
  if (!EJSON.equals(doc._id, old_doc._id))
    throw new Error("Can't change a doc's _id while updating");
  var changedFields = LocalCollection._makeChangedFields(doc, old_doc);
  if (!query.ordered) {
    if (!_.isEmpty(changedFields)) {
      query.changed(doc._id, changedFields);
      query.results[LocalCollection._idStringify(doc._id)] = doc;
    }
    return;
  }

  var orig_idx = LocalCollection._findInOrderedResults(query, doc);

  if (!_.isEmpty(changedFields))
    query.changed(doc._id, changedFields);
  if (!query.sort_f)
    return;

  // just take it out and put it back in again, and see if the index
  // changes
  query.results.splice(orig_idx, 1);
  var new_idx = LocalCollection._insertInSortedList(
    query.sort_f, query.results, doc);
  if (orig_idx !== new_idx) {
    var next = query.results[new_idx+1];
    if (next)
      next = next._id;
    else
      next = null;
    query.movedBefore && query.movedBefore(doc._id, next);
  }
};

// Recomputes the results of a query and runs observe callbacks for the
// difference between the previous results and the current results (unless
// paused). Used for skip/limit queries.
//
// When this is used by insert or remove, it can just use query.results for the
// old results (and there's no need to pass in oldResults), because these
// operations don't mutate the documents in the collection. Update needs to pass
// in an oldResults which was deep-copied before the modifier was applied.
LocalCollection._recomputeResults = function (query, oldResults) {
  if (!oldResults)
    oldResults = query.results;
  query.results = query.cursor._getRawObjects(query.ordered);

  if (!query.paused) {
    LocalCollection._diffQueryChanges(
      query.ordered, oldResults, query.results, query);
  }
};


LocalCollection._findInOrderedResults = function (query, doc) {
  if (!query.ordered)
    throw new Error("Can't call _findInOrderedResults on unordered query");
  for (var i = 0; i < query.results.length; i++)
    if (query.results[i] === doc)
      return i;
  throw Error("object missing from query");
};

// This binary search puts a value between any equal values, and the first
// lesser value.
LocalCollection._binarySearch = function (cmp, array, value) {
  var first = 0, rangeLength = array.length;

  while (rangeLength > 0) {
    var halfRange = Math.floor(rangeLength/2);
    if (cmp(value, array[first + halfRange]) >= 0) {
      first += halfRange + 1;
      rangeLength -= halfRange + 1;
    } else {
      rangeLength = halfRange;
    }
  }
  return first;
};

LocalCollection._insertInSortedList = function (cmp, array, value) {
  if (array.length === 0) {
    array.push(value);
    return 0;
  }

  var idx = LocalCollection._binarySearch(cmp, array, value);
  array.splice(idx, 0, value);
  return idx;
};

// To track what documents are affected by a piece of code, call saveOriginals()
// before it and retrieveOriginals() after it. retrieveOriginals returns an
// object whose keys are the ids of the documents that were affected since the
// call to saveOriginals(), and the values are equal to the document's contents
// at the time of saveOriginals. (In the case of an inserted document, undefined
// is the value.) You must alternate between calls to saveOriginals() and
// retrieveOriginals().
LocalCollection.prototype.saveOriginals = function () {
  var self = this;
  if (self._savedOriginals)
    throw new Error("Called saveOriginals twice without retrieveOriginals");
  self._savedOriginals = {};
};
LocalCollection.prototype.retrieveOriginals = function () {
  var self = this;
  if (!self._savedOriginals)
    throw new Error("Called retrieveOriginals without saveOriginals");

  var originals = self._savedOriginals;
  self._savedOriginals = null;
  return originals;
};

LocalCollection.prototype._saveOriginal = function (id, doc) {
  var self = this;
  // Are we even trying to save originals?
  if (!self._savedOriginals)
    return;
  // Have we previously mutated the original (and so 'doc' is not actually
  // original)?  (Note the 'has' check rather than truth: we store undefined
  // here for inserted docs!)
  if (_.has(self._savedOriginals, id))
    return;
  self._savedOriginals[id] = EJSON.clone(doc);
};

// Pause the observers. No callbacks from observers will fire until
// 'resumeObservers' is called.
LocalCollection.prototype.pauseObservers = function () {
  // No-op if already paused.
  if (this.paused)
    return;

  // Set the 'paused' flag such that new observer messages don't fire.
  this.paused = true;

  // Take a snapshot of the query results for each query.
  for (var qid in this.queries) {
    var query = this.queries[qid];

    query.results_snapshot = EJSON.clone(query.results);
  }
};

// Resume the observers. Observers immediately receive change
// notifications to bring them to the current state of the
// database. Note that this is not just replaying all the changes that
// happened during the pause, it is a smarter 'coalesced' diff.
LocalCollection.prototype.resumeObservers = function () {
  var self = this;
  // No-op if not paused.
  if (!this.paused)
    return;

  // Unset the 'paused' flag. Make sure to do this first, otherwise
  // observer methods won't actually fire when we trigger them.
  this.paused = false;

  for (var qid in this.queries) {
    var query = self.queries[qid];
    // Diff the current results against the snapshot and send to observers.
    // pass the query object for its observer callbacks.
    LocalCollection._diffQueryChanges(
      query.ordered, query.results_snapshot, query.results, query);
    query.results_snapshot = null;
  }
  self._observeQueue.drain();
};


LocalCollection._idStringify = function (id) {
  if (id instanceof LocalCollection._ObjectID) {
    return id.valueOf();
  } else if (typeof id === 'string') {
    if (id === "") {
      return id;
    } else if (id.substr(0, 1) === "-" || // escape previously dashed strings
               id.substr(0, 1) === "~" || // escape escaped numbers, true, false
               LocalCollection._looksLikeObjectID(id) || // escape object-id-form strings
               id.substr(0, 1) === '{') { // escape object-form strings, for maybe implementing later
      return "-" + id;
    } else {
      return id; // other strings go through unchanged.
    }
  } else if (id === undefined) {
    return '-';
  } else if (typeof id === 'object') {
    throw new Error("Meteor does not currently support objects other than ObjectID as ids");
  } else { // Numbers, true, false, null
    return "~" + JSON.stringify(id);
  }
};



LocalCollection._idParse = function (id) {
  if (id === "") {
    return id;
  } else if (id === '-') {
    return undefined;
  } else if (id.substr(0, 1) === '-') {
    return id.substr(1);
  } else if (id.substr(0, 1) === '~') {
    return JSON.parse(id.substr(1));
  } else if (LocalCollection._looksLikeObjectID(id)) {
    return new LocalCollection._ObjectID(id);
  } else {
    return id;
  }
};

if (typeof Meteor !== 'undefined') {
  Meteor.idParse = LocalCollection._idParse;
  Meteor.idStringify = LocalCollection._idStringify;
}

LocalCollection._makeChangedFields = function (newDoc, oldDoc) {
  var fields = {};
  LocalCollection._diffObjects(oldDoc, newDoc, {
    leftOnly: function (key, value) {
      fields[key] = undefined;
    },
    rightOnly: function (key, value) {
      fields[key] = value;
    },
    both: function (key, leftValue, rightValue) {
      if (!EJSON.equals(leftValue, rightValue))
        fields[key] = rightValue;
    }
  });
  return fields;
};

LocalCollection._observeFromObserveChanges = function (cursor, callbacks) {
  var transform = cursor.getTransform();
  if (!transform)
    transform = function (doc) {return doc;};
  if (callbacks.addedAt && callbacks.added)
    throw new Error("Please specify only one of added() and addedAt()");
  if (callbacks.changedAt && callbacks.changed)
    throw new Error("Please specify only one of changed() and changedAt()");
  if (callbacks.removed && callbacks.removedAt)
    throw new Error("Please specify only one of removed() and removedAt()");
  if (callbacks.addedAt || callbacks.movedTo ||
      callbacks.changedAt || callbacks.removedAt)
    return LocalCollection._observeOrderedFromObserveChanges(cursor, callbacks, transform);
  else
    return LocalCollection._observeUnorderedFromObserveChanges(cursor, callbacks, transform);
};

LocalCollection._observeUnorderedFromObserveChanges =
    function (cursor, callbacks, transform) {
  var docs = {};
  var suppressed = !!callbacks._suppress_initial;
  var handle = cursor.observeChanges({
    added: function (id, fields) {
      var strId = LocalCollection._idStringify(id);
      var doc = EJSON.clone(fields);
      doc._id = id;
      docs[strId] = doc;
      suppressed || callbacks.added && callbacks.added(transform(doc));
    },
    changed: function (id, fields) {
      var strId = LocalCollection._idStringify(id);
      var doc = docs[strId];
      var oldDoc = EJSON.clone(doc);
      // writes through to the doc set
      LocalCollection._applyChanges(doc, fields);
      suppressed || callbacks.changed && callbacks.changed(transform(doc), transform(oldDoc));
    },
    removed: function (id) {
      var strId = LocalCollection._idStringify(id);
      var doc = docs[strId];
      delete docs[strId];
      suppressed || callbacks.removed && callbacks.removed(transform(doc));
    }
  });
  suppressed = false;
  return handle;
};

LocalCollection._observeOrderedFromObserveChanges =
    function (cursor, callbacks, transform) {
  var docs = new OrderedDict(LocalCollection._idStringify);
  var suppressed = !!callbacks._suppress_initial;
  var handle = cursor.observeChanges({
    addedBefore: function (id, fields, before) {
      var doc = EJSON.clone(fields);
      doc._id = id;
      docs.putBefore(id, doc, before ? before : null);
      if (!suppressed) {
        if (callbacks.addedAt) {
          var index = docs.indexOf(id);
          callbacks.addedAt(transform(EJSON.clone(doc)),
                            index, before);
        } else if (callbacks.added) {
          callbacks.added(transform(EJSON.clone(doc)));
        }
      }
    },
    changed: function (id, fields) {
      var doc = docs.get(id);
      if (!doc)
        throw new Error("Unknown id for changed: " + id);
      var oldDoc = EJSON.clone(doc);
      // writes through to the doc set
      LocalCollection._applyChanges(doc, fields);
      if (callbacks.changedAt) {
        var index = docs.indexOf(id);
        callbacks.changedAt(transform(EJSON.clone(doc)),
                            transform(oldDoc), index);
      } else if (callbacks.changed) {
        callbacks.changed(transform(EJSON.clone(doc)),
                          transform(oldDoc));
      }
    },
    movedBefore: function (id, before) {
      var doc = docs.get(id);
      var from;
      // only capture indexes if we're going to call the callback that needs them.
      if (callbacks.movedTo)
        from = docs.indexOf(id);
      docs.moveBefore(id, before ? before : null);
      if (callbacks.movedTo) {
        var to = docs.indexOf(id);
        callbacks.movedTo(transform(EJSON.clone(doc)), from, to);
      } else if (callbacks.moved) {
        callbacks.moved(transform(EJSON.clone(doc)));
      }

    },
    removed: function (id) {
      var doc = docs.get(id);
      var index;
      if (callbacks.removedAt)
        index = docs.indexOf(id);
      docs.remove(id);
      callbacks.removedAt && callbacks.removedAt(transform(doc), index);
      callbacks.removed && callbacks.removed(transform(doc));
    }
  });
  suppressed = false;
  return handle;
};

}).call(this);



// ------------------------------------------------------------------------
// packages/minimongo/selector.js

(function(){ // Like _.isArray, but doesn't regard polyfilled Uint8Arrays on old browsers as
// arrays.
var isArray = function (x) {
  return _.isArray(x) && !EJSON.isBinary(x);
};

var _anyIfArray = function (x, f) {
  if (isArray(x))
    return _.any(x, f);
  return f(x);
};

var _anyIfArrayPlus = function (x, f) {
  if (f(x))
    return true;
  return isArray(x) && _.any(x, f);
};

var hasOperators = function(valueSelector) {
  var theseAreOperators = undefined;
  for (var selKey in valueSelector) {
    var thisIsOperator = selKey.substr(0, 1) === '$';
    if (theseAreOperators === undefined) {
      theseAreOperators = thisIsOperator;
    } else if (theseAreOperators !== thisIsOperator) {
      throw new Error("Inconsistent selector: " + valueSelector);
    }
  }
  return !!theseAreOperators;  // {} has no operators
};

var compileValueSelector = function (valueSelector) {
  if (valueSelector == null) {  // undefined or null
    return function (value) {
      return _anyIfArray(value, function (x) {
        return x == null;  // undefined or null
      });
    };
  }

  // Selector is a non-null primitive (and not an array or RegExp either).
  if (!_.isObject(valueSelector)) {
    return function (value) {
      return _anyIfArray(value, function (x) {
        return x === valueSelector;
      });
    };
  }

  if (valueSelector instanceof RegExp) {
    return function (value) {
      if (value === undefined)
        return false;
      return _anyIfArray(value, function (x) {
        return valueSelector.test(x);
      });
    };
  }

  // Arrays match either identical arrays or arrays that contain it as a value.
  if (isArray(valueSelector)) {
    return function (value) {
      if (!isArray(value))
        return false;
      return _anyIfArrayPlus(value, function (x) {
        return LocalCollection._f._equal(valueSelector, x);
      });
    };
  }

  // It's an object, but not an array or regexp.
  if (hasOperators(valueSelector)) {
    var operatorFunctions = [];
    _.each(valueSelector, function (operand, operator) {
      if (!_.has(VALUE_OPERATORS, operator))
        throw new Error("Unrecognized operator: " + operator);
      operatorFunctions.push(VALUE_OPERATORS[operator](
        operand, valueSelector.$options));
    });
    return function (value) {
      return _.all(operatorFunctions, function (f) {
        return f(value);
      });
    };
  }

  // It's a literal; compare value (or element of value array) directly to the
  // selector.
  return function (value) {
    return _anyIfArray(value, function (x) {
      return LocalCollection._f._equal(valueSelector, x);
    });
  };
};

// XXX can factor out common logic below
var LOGICAL_OPERATORS = {
  "$and": function(subSelector) {
    if (!isArray(subSelector) || _.isEmpty(subSelector))
      throw Error("$and/$or/$nor must be nonempty array");
    var subSelectorFunctions = _.map(
      subSelector, compileDocumentSelector);
    return function (doc) {
      return _.all(subSelectorFunctions, function (f) {
        return f(doc);
      });
    };
  },

  "$or": function(subSelector) {
    if (!isArray(subSelector) || _.isEmpty(subSelector))
      throw Error("$and/$or/$nor must be nonempty array");
    var subSelectorFunctions = _.map(
      subSelector, compileDocumentSelector);
    return function (doc) {
      return _.any(subSelectorFunctions, function (f) {
        return f(doc);
      });
    };
  },

  "$nor": function(subSelector) {
    if (!isArray(subSelector) || _.isEmpty(subSelector))
      throw Error("$and/$or/$nor must be nonempty array");
    var subSelectorFunctions = _.map(
      subSelector, compileDocumentSelector);
    return function (doc) {
      return _.all(subSelectorFunctions, function (f) {
        return !f(doc);
      });
    };
  },

  "$where": function(selectorValue) {
    if (!(selectorValue instanceof Function)) {
      selectorValue = Function("return " + selectorValue);
    }
    return function (doc) {
      return selectorValue.call(doc);
    };
  }
};

var VALUE_OPERATORS = {
  "$in": function (operand) {
    if (!isArray(operand))
      throw new Error("Argument to $in must be array");
    return function (value) {
      return _anyIfArrayPlus(value, function (x) {
        return _.any(operand, function (operandElt) {
          return LocalCollection._f._equal(operandElt, x);
        });
      });
    };
  },

  "$all": function (operand) {
    if (!isArray(operand))
      throw new Error("Argument to $all must be array");
    return function (value) {
      if (!isArray(value))
        return false;
      return _.all(operand, function (operandElt) {
        return _.any(value, function (valueElt) {
          return LocalCollection._f._equal(operandElt, valueElt);
        });
      });
    };
  },

  "$lt": function (operand) {
    return function (value) {
      return _anyIfArray(value, function (x) {
        return LocalCollection._f._cmp(x, operand) < 0;
      });
    };
  },

  "$lte": function (operand) {
    return function (value) {
      return _anyIfArray(value, function (x) {
        return LocalCollection._f._cmp(x, operand) <= 0;
      });
    };
  },

  "$gt": function (operand) {
    return function (value) {
      return _anyIfArray(value, function (x) {
        return LocalCollection._f._cmp(x, operand) > 0;
      });
    };
  },

  "$gte": function (operand) {
    return function (value) {
      return _anyIfArray(value, function (x) {
        return LocalCollection._f._cmp(x, operand) >= 0;
      });
    };
  },

  "$ne": function (operand) {
    return function (value) {
      return ! _anyIfArrayPlus(value, function (x) {
        return LocalCollection._f._equal(x, operand);
      });
    };
  },

  "$nin": function (operand) {
    if (!isArray(operand))
      throw new Error("Argument to $nin must be array");
    var inFunction = VALUE_OPERATORS.$in(operand);
    return function (value) {
      // Field doesn't exist, so it's not-in operand
      if (value === undefined)
        return true;
      return !inFunction(value);
    };
  },

  "$exists": function (operand) {
    return function (value) {
      return operand === (value !== undefined);
    };
  },

  "$mod": function (operand) {
    var divisor = operand[0],
        remainder = operand[1];
    return function (value) {
      return _anyIfArray(value, function (x) {
        return x % divisor === remainder;
      });
    };
  },

  "$size": function (operand) {
    return function (value) {
      return isArray(value) && operand === value.length;
    };
  },

  "$type": function (operand) {
    return function (value) {
      // A nonexistent field is of no type.
      if (value === undefined)
        return false;
      // Definitely not _anyIfArrayPlus: $type: 4 only matches arrays that have
      // arrays as elements according to the Mongo docs.
      return _anyIfArray(value, function (x) {
        return LocalCollection._f._type(x) === operand;
      });
    };
  },

  "$regex": function (operand, options) {
    if (options !== undefined) {
      // Options passed in $options (even the empty string) always overrides
      // options in the RegExp object itself.

      // Be clear that we only support the JS-supported options, not extended
      // ones (eg, Mongo supports x and s). Ideally we would implement x and s
      // by transforming the regexp, but not today...
      if (/[^gim]/.test(options))
        throw new Error("Only the i, m, and g regexp options are supported");

      var regexSource = operand instanceof RegExp ? operand.source : operand;
      operand = new RegExp(regexSource, options);
    } else if (!(operand instanceof RegExp)) {
      operand = new RegExp(operand);
    }

    return function (value) {
      if (value === undefined)
        return false;
      return _anyIfArray(value, function (x) {
        return operand.test(x);
      });
    };
  },

  "$options": function (operand) {
    // evaluation happens at the $regex function above
    return function (value) { return true; };
  },

  "$elemMatch": function (operand) {
    var matcher = compileDocumentSelector(operand);
    return function (value) {
      if (!isArray(value))
        return false;
      return _.any(value, function (x) {
        return matcher(x);
      });
    };
  },

  "$not": function (operand) {
    var matcher = compileValueSelector(operand);
    return function (value) {
      return !matcher(value);
    };
  }
};

// helpers used by compiled selector code
LocalCollection._f = {
  // XXX for _all and _in, consider building 'inquery' at compile time..

  _type: function (v) {
    if (typeof v === "number")
      return 1;
    if (typeof v === "string")
      return 2;
    if (typeof v === "boolean")
      return 8;
    if (isArray(v))
      return 4;
    if (v === null)
      return 10;
    if (v instanceof RegExp)
      return 11;
    if (typeof v === "function")
      // note that typeof(/x/) === "function"
      return 13;
    if (v instanceof Date)
      return 9;
    if (EJSON.isBinary(v))
      return 5;
    if (v instanceof Meteor.Collection.ObjectID)
      return 7;
    return 3; // object

    // XXX support some/all of these:
    // 14, symbol
    // 15, javascript code with scope
    // 16, 18: 32-bit/64-bit integer
    // 17, timestamp
    // 255, minkey
    // 127, maxkey
  },

  // deep equality test: use for literal document and array matches
  _equal: function (a, b) {
    return EJSON.equals(a, b, {keyOrderSensitive: true});
  },

  // maps a type code to a value that can be used to sort values of
  // different types
  _typeorder: function (t) {
    // http://www.mongodb.org/display/DOCS/What+is+the+Compare+Order+for+BSON+Types
    // XXX what is the correct sort position for Javascript code?
    // ('100' in the matrix below)
    // XXX minkey/maxkey
    return [-1,  // (not a type)
            1,   // number
            2,   // string
            3,   // object
            4,   // array
            5,   // binary
            -1,  // deprecated
            6,   // ObjectID
            7,   // bool
            8,   // Date
            0,   // null
            9,   // RegExp
            -1,  // deprecated
            100, // JS code
            2,   // deprecated (symbol)
            100, // JS code
            1,   // 32-bit int
            8,   // Mongo timestamp
            1    // 64-bit int
           ][t];
  },

  // compare two values of unknown type according to BSON ordering
  // semantics. (as an extension, consider 'undefined' to be less than
  // any other value.) return negative if a is less, positive if b is
  // less, or 0 if equal
  _cmp: function (a, b) {
    if (a === undefined)
      return b === undefined ? 0 : -1;
    if (b === undefined)
      return 1;
    var ta = LocalCollection._f._type(a);
    var tb = LocalCollection._f._type(b);
    var oa = LocalCollection._f._typeorder(ta);
    var ob = LocalCollection._f._typeorder(tb);
    if (oa !== ob)
      return oa < ob ? -1 : 1;
    if (ta !== tb)
      // XXX need to implement this if we implement Symbol or integers, or
      // Timestamp
      throw Error("Missing type coercion logic in _cmp");
    if (ta === 7) { // ObjectID
      // Convert to string.
      ta = tb = 2;
      a = a.toHexString();
      b = b.toHexString();
    }
    if (ta === 9) { // Date
      // Convert to millis.
      ta = tb = 1;
      a = a.getTime();
      b = b.getTime();
    }

    if (ta === 1) // double
      return a - b;
    if (tb === 2) // string
      return a < b ? -1 : (a === b ? 0 : 1);
    if (ta === 3) { // Object
      // this could be much more efficient in the expected case ...
      var to_array = function (obj) {
        var ret = [];
        for (var key in obj) {
          ret.push(key);
          ret.push(obj[key]);
        }
        return ret;
      };
      return LocalCollection._f._cmp(to_array(a), to_array(b));
    }
    if (ta === 4) { // Array
      for (var i = 0; ; i++) {
        if (i === a.length)
          return (i === b.length) ? 0 : -1;
        if (i === b.length)
          return 1;
        var s = LocalCollection._f._cmp(a[i], b[i]);
        if (s !== 0)
          return s;
      }
    }
    if (ta === 5) { // binary
      // Surprisingly, a small binary blob is always less than a large one in
      // Mongo.
      if (a.length !== b.length)
        return a.length - b.length;
      for (i = 0; i < a.length; i++) {
        if (a[i] < b[i])
          return -1;
        if (a[i] > b[i])
          return 1;
      }
      return 0;
    }
    if (ta === 8) { // boolean
      if (a) return b ? 0 : 1;
      return b ? -1 : 0;
    }
    if (ta === 10) // null
      return 0;
    if (ta === 11) // regexp
      throw Error("Sorting not supported on regular expression"); // XXX
    // 13: javascript code
    // 14: symbol
    // 15: javascript code with scope
    // 16: 32-bit integer
    // 17: timestamp
    // 18: 64-bit integer
    // 255: minkey
    // 127: maxkey
    if (ta === 13) // javascript code
      throw Error("Sorting not supported on Javascript code"); // XXX
    throw Error("Unknown type to sort");
  }
};

// For unit tests. True if the given document matches the given
// selector.
LocalCollection._matches = function (selector, doc) {
  return (LocalCollection._compileSelector(selector))(doc);
};

// _makeLookupFunction(key) returns a lookup function.
//
// A lookup function takes in a document and returns an array of matching
// values.  This array has more than one element if any segment of the key other
// than the last one is an array.  ie, any arrays found when doing non-final
// lookups result in this function "branching"; each element in the returned
// array represents the value found at this branch. If any branch doesn't have a
// final value for the full key, its element in the returned list will be
// undefined. It always returns a non-empty array.
//
// _makeLookupFunction('a.x')({a: {x: 1}}) returns [1]
// _makeLookupFunction('a.x')({a: {x: [1]}}) returns [[1]]
// _makeLookupFunction('a.x')({a: 5})  returns [undefined]
// _makeLookupFunction('a.x')({a: [{x: 1},
//                                 {x: [2]},
//                                 {y: 3}]})
//   returns [1, [2], undefined]
LocalCollection._makeLookupFunction = function (key) {
  var dotLocation = key.indexOf('.');
  var first, lookupRest, nextIsNumeric;
  if (dotLocation === -1) {
    first = key;
  } else {
    first = key.substr(0, dotLocation);
    var rest = key.substr(dotLocation + 1);
    lookupRest = LocalCollection._makeLookupFunction(rest);
    // Is the next (perhaps final) piece numeric (ie, an array lookup?)
    nextIsNumeric = /^\d+(\.|$)/.test(rest);
  }

  return function (doc) {
    if (doc == null)  // null or undefined
      return [undefined];
    var firstLevel = doc[first];

    // We don't "branch" at the final level.
    if (!lookupRest)
      return [firstLevel];

    // It's an empty array, and we're not done: we won't find anything.
    if (isArray(firstLevel) && firstLevel.length === 0)
      return [undefined];

    // For each result at this level, finish the lookup on the rest of the key,
    // and return everything we find. Also, if the next result is a number,
    // don't branch here.
    //
    // Technically, in MongoDB, we should be able to handle the case where
    // objects have numeric keys, but Mongo doesn't actually handle this
    // consistently yet itself, see eg
    // https://jira.mongodb.org/browse/SERVER-2898
    // https://github.com/mongodb/mongo/blob/master/jstests/array_match2.js
    if (!isArray(firstLevel) || nextIsNumeric)
      firstLevel = [firstLevel];
    return Array.prototype.concat.apply([], _.map(firstLevel, lookupRest));
  };
};

// The main compilation function for a given selector.
var compileDocumentSelector = function (docSelector) {
  var perKeySelectors = [];
  _.each(docSelector, function (subSelector, key) {
    if (key.substr(0, 1) === '$') {
      // Outer operators are either logical operators (they recurse back into
      // this function), or $where.
      if (!_.has(LOGICAL_OPERATORS, key))
        throw new Error("Unrecognized logical operator: " + key);
      perKeySelectors.push(LOGICAL_OPERATORS[key](subSelector));
    } else {
      var lookUpByIndex = LocalCollection._makeLookupFunction(key);
      var valueSelectorFunc = compileValueSelector(subSelector);
      perKeySelectors.push(function (doc) {
        var branchValues = lookUpByIndex(doc);
        // We apply the selector to each "branched" value and return true if any
        // match. This isn't 100% consistent with MongoDB; eg, see:
        // https://jira.mongodb.org/browse/SERVER-8585
        return _.any(branchValues, valueSelectorFunc);
      });
    }
  });


  return function (doc) {
    return _.all(perKeySelectors, function (f) {
      return f(doc);
    });
  };
};

// Given a selector, return a function that takes one argument, a
// document, and returns true if the document matches the selector,
// else false.
LocalCollection._compileSelector = function (selector) {
  // you can pass a literal function instead of a selector
  if (selector instanceof Function)
    return function (doc) {return selector.call(doc);};

  // shorthand -- scalars match _id
  if (LocalCollection._selectorIsId(selector)) {
    return function (doc) {
      return EJSON.equals(doc._id, selector);
    };
  }

  // protect against dangerous selectors.  falsey and {_id: falsey} are both
  // likely programmer error, and not what you want, particularly for
  // destructive operations.
  if (!selector || (('_id' in selector) && !selector._id))
    return function (doc) {return false;};

  // Top level can't be an array or true or binary.
  if (typeof(selector) === 'boolean' || isArray(selector) ||
      EJSON.isBinary(selector))
    throw new Error("Invalid selector: " + selector);

  return compileDocumentSelector(selector);
};

// Give a sort spec, which can be in any of these forms:
//   {"key1": 1, "key2": -1}
//   [["key1", "asc"], ["key2", "desc"]]
//   ["key1", ["key2", "desc"]]
//
// (.. with the first form being dependent on the key enumeration
// behavior of your javascript VM, which usually does what you mean in
// this case if the key names don't look like integers ..)
//
// return a function that takes two objects, and returns -1 if the
// first object comes first in order, 1 if the second object comes
// first, or 0 if neither object comes before the other.

LocalCollection._compileSort = function (spec) {
  var sortSpecParts = [];

  if (spec instanceof Array) {
    for (var i = 0; i < spec.length; i++) {
      if (typeof spec[i] === "string") {
        sortSpecParts.push({
          lookup: LocalCollection._makeLookupFunction(spec[i]),
          ascending: true
        });
      } else {
        sortSpecParts.push({
          lookup: LocalCollection._makeLookupFunction(spec[i][0]),
          ascending: spec[i][1] !== "desc"
        });
      }
    }
  } else if (typeof spec === "object") {
    for (var key in spec) {
      sortSpecParts.push({
        lookup: LocalCollection._makeLookupFunction(key),
        ascending: spec[key] >= 0
      });
    }
  } else {
    throw Error("Bad sort specification: ", JSON.stringify(spec));
  }

  if (sortSpecParts.length === 0)
    return function () {return 0;};

  // reduceValue takes in all the possible values for the sort key along various
  // branches, and returns the min or max value (according to the bool
  // findMin). Each value can itself be an array, and we look at its values
  // too. (ie, we do a single level of flattening on branchValues, then find the
  // min/max.)
  var reduceValue = function (branchValues, findMin) {
    var reduced;
    var first = true;
    // Iterate over all the values found in all the branches, and if a value is
    // an array itself, iterate over the values in the array separately.
    _.each(branchValues, function (branchValue) {
      // Value not an array? Pretend it is.
      if (!isArray(branchValue))
        branchValue = [branchValue];
      // Value is an empty array? Pretend it was missing, since that's where it
      // should be sorted.
      if (isArray(branchValue) && branchValue.length === 0)
        branchValue = [undefined];
      _.each(branchValue, function (value) {
        // We should get here at least once: lookup functions return non-empty
        // arrays, so the outer loop runs at least once, and we prevented
        // branchValue from being an empty array.
        if (first) {
          reduced = value;
          first = false;
        } else {
          // Compare the value we found to the value we found so far, saving it
          // if it's less (for an ascending sort) or more (for a descending
          // sort).
          var cmp = LocalCollection._f._cmp(reduced, value);
          if ((findMin && cmp > 0) || (!findMin && cmp < 0))
            reduced = value;
        }
      });
    });
    return reduced;
  };

  return function (a, b) {
    for (var i = 0; i < sortSpecParts.length; ++i) {
      var specPart = sortSpecParts[i];
      var aValue = reduceValue(specPart.lookup(a), specPart.ascending);
      var bValue = reduceValue(specPart.lookup(b), specPart.ascending);
      var compare = LocalCollection._f._cmp(aValue, bValue);
      if (compare !== 0)
        return specPart.ascending ? compare : -compare;
    };
    return 0;
  };
};

}).call(this);



// ------------------------------------------------------------------------
// packages/minimongo/modify.js

(function(){ // XXX need a strategy for passing the binding of $ into this
// function, from the compiled selector
//
// maybe just {key.up.to.just.before.dollarsign: array_index}
//
// XXX atomicity: if one modification fails, do we roll back the whole
// change?
LocalCollection._modify = function (doc, mod) {
  var is_modifier = false;
  for (var k in mod) {
    // IE7 doesn't support indexing into strings (eg, k[0]), so use substr.
    // Too bad -- it's far slower:
    // http://jsperf.com/testing-the-first-character-of-a-string
    is_modifier = k.substr(0, 1) === '$';
    break; // just check the first key.
  }

  var new_doc;

  if (!is_modifier) {
    if (mod._id && !EJSON.equals(doc._id, mod._id))
      throw Error("Cannot change the _id of a document");

    // replace the whole document
    for (var k in mod) {
      if (k.substr(0, 1) === '$')
        throw Error("When replacing document, field name may not start with '$'");
      if (/\./.test(k))
        throw Error("When replacing document, field name may not contain '.'");
    }
    new_doc = mod;
  } else {
    // apply modifiers
    var new_doc = EJSON.clone(doc);

    for (var op in mod) {
      var mod_func = LocalCollection._modifiers[op];
      if (!mod_func)
        throw Error("Invalid modifier specified " + op);
      for (var keypath in mod[op]) {
        // XXX mongo doesn't allow mod field names to end in a period,
        // but I don't see why.. it allows '' as a key, as does JS
        if (keypath.length && keypath[keypath.length-1] === '.')
          throw Error("Invalid mod field name, may not end in a period");

        var arg = mod[op][keypath];
        var keyparts = keypath.split('.');
        var no_create = !!LocalCollection._noCreateModifiers[op];
        var forbid_array = (op === "$rename");
        var target = LocalCollection._findModTarget(new_doc, keyparts,
                                                    no_create, forbid_array);
        var field = keyparts.pop();
        mod_func(target, field, arg, keypath, new_doc);
      }
    }
  }

  // move new document into place.
  _.each(_.keys(doc), function (k) {
    // Note: this used to be for (var k in doc) however, this does not
    // work right in Opera. Deleting from a doc while iterating over it
    // would sometimes cause opera to skip some keys.
    if (k !== '_id')
      delete doc[k];
  });
  for (var k in new_doc) {
    doc[k] = new_doc[k];
  }
};

// for a.b.c.2.d.e, keyparts should be ['a', 'b', 'c', '2', 'd', 'e'],
// and then you would operate on the 'e' property of the returned
// object. if no_create is falsey, creates intermediate levels of
// structure as necessary, like mkdir -p (and raises an exception if
// that would mean giving a non-numeric property to an array.) if
// no_create is true, return undefined instead. may modify the last
// element of keyparts to signal to the caller that it needs to use a
// different value to index into the returned object (for example,
// ['a', '01'] -> ['a', 1]). if forbid_array is true, return null if
// the keypath goes through an array.
LocalCollection._findModTarget = function (doc, keyparts, no_create,
                                      forbid_array) {
  for (var i = 0; i < keyparts.length; i++) {
    var last = (i === keyparts.length - 1);
    var keypart = keyparts[i];
    var numeric = /^[0-9]+$/.test(keypart);
    if (no_create && (!(typeof doc === "object") || !(keypart in doc)))
      return undefined;
    if (doc instanceof Array) {
      if (forbid_array)
        return null;
      if (!numeric)
        throw Error("can't append to array using string field name ["
                    + keypart + "]");
      keypart = parseInt(keypart);
      if (last)
        // handle 'a.01'
        keyparts[i] = keypart;
      while (doc.length < keypart)
        doc.push(null);
      if (!last) {
        if (doc.length === keypart)
          doc.push({});
        else if (typeof doc[keypart] !== "object")
          throw Error("can't modify field '" + keyparts[i + 1] +
                      "' of list value " + JSON.stringify(doc[keypart]));
      }
    } else {
      // XXX check valid fieldname (no $ at start, no .)
      if (!last && !(keypart in doc))
        doc[keypart] = {};
    }

    if (last)
      return doc;
    doc = doc[keypart];
  }

  // notreached
};

LocalCollection._noCreateModifiers = {
  $unset: true,
  $pop: true,
  $rename: true,
  $pull: true,
  $pullAll: true
};

LocalCollection._modifiers = {
  $inc: function (target, field, arg) {
    if (typeof arg !== "number")
      throw Error("Modifier $inc allowed for numbers only");
    if (field in target) {
      if (typeof target[field] !== "number")
        throw Error("Cannot apply $inc modifier to non-number");
      target[field] += arg;
    } else {
      target[field] = arg;
    }
  },
  $set: function (target, field, arg) {
    if (field === '_id' && !EJSON.equals(arg, target._id))
      throw Error("Cannot change the _id of a document");

    target[field] = EJSON.clone(arg);
  },
  $unset: function (target, field, arg) {
    if (target !== undefined) {
      if (target instanceof Array) {
        if (field in target)
          target[field] = null;
      } else
        delete target[field];
    }
  },
  $push: function (target, field, arg) {
    var x = target[field];
    if (x === undefined)
      target[field] = [arg];
    else if (!(x instanceof Array))
      throw Error("Cannot apply $push modifier to non-array");
    else
      x.push(EJSON.clone(arg));
  },
  $pushAll: function (target, field, arg) {
    if (!(typeof arg === "object" && arg instanceof Array))
      throw Error("Modifier $pushAll/pullAll allowed for arrays only");
    var x = target[field];
    if (x === undefined)
      target[field] = arg;
    else if (!(x instanceof Array))
      throw Error("Cannot apply $pushAll modifier to non-array");
    else {
      for (var i = 0; i < arg.length; i++)
        x.push(arg[i]);
    }
  },
  $addToSet: function (target, field, arg) {
    var x = target[field];
    if (x === undefined)
      target[field] = [arg];
    else if (!(x instanceof Array))
      throw Error("Cannot apply $addToSet modifier to non-array");
    else {
      var isEach = false;
      if (typeof arg === "object") {
        for (var k in arg) {
          if (k === "$each")
            isEach = true;
          break;
        }
      }
      var values = isEach ? arg["$each"] : [arg];
      _.each(values, function (value) {
        for (var i = 0; i < x.length; i++)
          if (LocalCollection._f._equal(value, x[i]))
            return;
        x.push(value);
      });
    }
  },
  $pop: function (target, field, arg) {
    if (target === undefined)
      return;
    var x = target[field];
    if (x === undefined)
      return;
    else if (!(x instanceof Array))
      throw Error("Cannot apply $pop modifier to non-array");
    else {
      if (typeof arg === 'number' && arg < 0)
        x.splice(0, 1);
      else
        x.pop();
    }
  },
  $pull: function (target, field, arg) {
    if (target === undefined)
      return;
    var x = target[field];
    if (x === undefined)
      return;
    else if (!(x instanceof Array))
      throw Error("Cannot apply $pull/pullAll modifier to non-array");
    else {
      var out = []
      if (typeof arg === "object" && !(arg instanceof Array)) {
        // XXX would be much nicer to compile this once, rather than
        // for each document we modify.. but usually we're not
        // modifying that many documents, so we'll let it slide for
        // now

        // XXX _compileSelector isn't up for the job, because we need
        // to permit stuff like {$pull: {a: {$gt: 4}}}.. something
        // like {$gt: 4} is not normally a complete selector.
        // same issue as $elemMatch possibly?
        var match = LocalCollection._compileSelector(arg);
        for (var i = 0; i < x.length; i++)
          if (!match(x[i]))
            out.push(x[i])
      } else {
        for (var i = 0; i < x.length; i++)
          if (!LocalCollection._f._equal(x[i], arg))
            out.push(x[i]);
      }
      target[field] = out;
    }
  },
  $pullAll: function (target, field, arg) {
    if (!(typeof arg === "object" && arg instanceof Array))
      throw Error("Modifier $pushAll/pullAll allowed for arrays only");
    if (target === undefined)
      return;
    var x = target[field];
    if (x === undefined)
      return;
    else if (!(x instanceof Array))
      throw Error("Cannot apply $pull/pullAll modifier to non-array");
    else {
      var out = []
      for (var i = 0; i < x.length; i++) {
        var exclude = false;
        for (var j = 0; j < arg.length; j++) {
          if (LocalCollection._f._equal(x[i], arg[j])) {
            exclude = true;
            break;
          }
        }
        if (!exclude)
          out.push(x[i]);
      }
      target[field] = out;
    }
  },
  $rename: function (target, field, arg, keypath, doc) {
    if (keypath === arg)
      // no idea why mongo has this restriction..
      throw Error("$rename source must differ from target");
    if (target === null)
      throw Error("$rename source field invalid");
    if (typeof arg !== "string")
      throw Error("$rename target must be a string");
    if (target === undefined)
      return;
    var v = target[field];
    delete target[field];

    var keyparts = arg.split('.');
    var target2 = LocalCollection._findModTarget(doc, keyparts, false, true);
    if (target2 === null)
      throw Error("$rename target field invalid");
    var field2 = keyparts.pop();
    target2[field2] = v;
  },
  $bit: function (target, field, arg) {
    // XXX mongo only supports $bit on integers, and we only support
    // native javascript numbers (doubles) so far, so we can't support $bit
    throw Error("$bit is not supported");
  }
};

}).call(this);



// ------------------------------------------------------------------------
// packages/minimongo/diff.js

(function(){ 
// ordered: bool.
// old_results and new_results: collections of documents.
//    if ordered, they are arrays.
//    if unordered, they are maps {_id: doc}.
// observer: object with 'added', 'changed', 'removed',
//           and (if ordered) 'moved' functions (each optional)
LocalCollection._diffQueryChanges = function (ordered, oldResults, newResults,
                                       observer) {
  if (ordered)
    LocalCollection._diffQueryOrderedChanges(
      oldResults, newResults, observer);
  else
    LocalCollection._diffQueryUnorderedChanges(
      oldResults, newResults, observer);
};

LocalCollection._diffQueryUnorderedChanges = function (oldResults, newResults,
                                                observer) {
  if (observer.moved) {
    throw new Error("_diffQueryUnordered called with a moved observer!");
  }

  _.each(newResults, function (newDoc) {
    if (_.has(oldResults, newDoc._id)) {
      var oldDoc = oldResults[newDoc._id];
      if (observer.changed && !EJSON.equals(oldDoc, newDoc)) {
        observer.changed(newDoc._id, LocalCollection._makeChangedFields(newDoc, oldDoc));
      }
    } else {
      var fields = EJSON.clone(newDoc);
      delete fields._id;
      observer.added && observer.added(newDoc._id, fields);
    }
  });

  if (observer.removed) {
    _.each(oldResults, function (oldDoc) {
      if (!_.has(newResults, oldDoc._id))
        observer.removed(oldDoc._id);
    });
  }
};


LocalCollection._diffQueryOrderedChanges = function (old_results, new_results, observer) {

  var new_presence_of_id = {};
  _.each(new_results, function (doc) {
    if (new_presence_of_id[doc._id])
      Meteor._debug("Duplicate _id in new_results");
    new_presence_of_id[doc._id] = true;
  });

  var old_index_of_id = {};
  _.each(old_results, function (doc, i) {
    if (doc._id in old_index_of_id)
      Meteor._debug("Duplicate _id in old_results");
    old_index_of_id[doc._id] = i;
  });

  // ALGORITHM:
  //
  // To determine which docs should be considered "moved" (and which
  // merely change position because of other docs moving) we run
  // a "longest common subsequence" (LCS) algorithm.  The LCS of the
  // old doc IDs and the new doc IDs gives the docs that should NOT be
  // considered moved.

  // To actually call the appropriate callbacks to get from the old state to the
  // new state:

  // First, we call removed() on all the items that only appear in the old
  // state.

  // Then, once we have the items that should not move, we walk through the new
  // results array group-by-group, where a "group" is a set of items that have
  // moved, anchored on the end by an item that should not move.  One by one, we
  // move each of those elements into place "before" the anchoring end-of-group
  // item, and fire changed events on them if necessary.  Then we fire a changed
  // event on the anchor, and move on to the next group.  There is always at
  // least one group; the last group is anchored by a virtual "null" id at the
  // end.

  // Asymptotically: O(N k) where k is number of ops, or potentially
  // O(N log N) if inner loop of LCS were made to be binary search.


  //////// LCS (longest common sequence, with respect to _id)
  // (see Wikipedia article on Longest Increasing Subsequence,
  // where the LIS is taken of the sequence of old indices of the
  // docs in new_results)
  //
  // unmoved: the output of the algorithm; members of the LCS,
  // in the form of indices into new_results
  var unmoved = [];
  // max_seq_len: length of LCS found so far
  var max_seq_len = 0;
  // seq_ends[i]: the index into new_results of the last doc in a
  // common subsequence of length of i+1 <= max_seq_len
  var N = new_results.length;
  var seq_ends = new Array(N);
  // ptrs:  the common subsequence ending with new_results[n] extends
  // a common subsequence ending with new_results[ptr[n]], unless
  // ptr[n] is -1.
  var ptrs = new Array(N);
  // virtual sequence of old indices of new results
  var old_idx_seq = function(i_new) {
    return old_index_of_id[new_results[i_new]._id];
  };
  // for each item in new_results, use it to extend a common subsequence
  // of length j <= max_seq_len
  for(var i=0; i<N; i++) {
    if (old_index_of_id[new_results[i]._id] !== undefined) {
      var j = max_seq_len;
      // this inner loop would traditionally be a binary search,
      // but scanning backwards we will likely find a subseq to extend
      // pretty soon, bounded for example by the total number of ops.
      // If this were to be changed to a binary search, we'd still want
      // to scan backwards a bit as an optimization.
      while (j > 0) {
        if (old_idx_seq(seq_ends[j-1]) < old_idx_seq(i))
          break;
        j--;
      }

      ptrs[i] = (j === 0 ? -1 : seq_ends[j-1]);
      seq_ends[j] = i;
      if (j+1 > max_seq_len)
        max_seq_len = j+1;
    }
  }

  // pull out the LCS/LIS into unmoved
  var idx = (max_seq_len === 0 ? -1 : seq_ends[max_seq_len-1]);
  while (idx >= 0) {
    unmoved.push(idx);
    idx = ptrs[idx];
  }
  // the unmoved item list is built backwards, so fix that
  unmoved.reverse();

  // the last group is always anchored by the end of the result list, which is
  // an id of "null"
  unmoved.push(new_results.length);

  _.each(old_results, function (doc) {
    if (!new_presence_of_id[doc._id])
      observer.removed && observer.removed(doc._id);
  });
  // for each group of things in the new_results that is anchored by an unmoved
  // element, iterate through the things before it.
  var startOfGroup = 0;
  _.each(unmoved, function (endOfGroup) {
    var groupId = new_results[endOfGroup] ? new_results[endOfGroup]._id : null;
    var oldDoc;
    var newDoc;
    var fields;
    for (var i = startOfGroup; i < endOfGroup; i++) {
      newDoc = new_results[i];
      if (!_.has(old_index_of_id, newDoc._id)) {
        fields = EJSON.clone(newDoc);
        delete fields._id;
        observer.addedBefore && observer.addedBefore(newDoc._id, fields, groupId);
        observer.added && observer.added(newDoc._id, fields);
      } else {
        // moved
        oldDoc = old_results[old_index_of_id[newDoc._id]];
        fields = LocalCollection._makeChangedFields(newDoc, oldDoc);
        if (!_.isEmpty(fields)) {
          observer.changed && observer.changed(newDoc._id, fields);
        }
        observer.movedBefore && observer.movedBefore(newDoc._id, groupId);
      }
    }
    if (groupId) {
      newDoc = new_results[endOfGroup];
      oldDoc = old_results[old_index_of_id[newDoc._id]];
      fields = LocalCollection._makeChangedFields(newDoc, oldDoc);
      if (!_.isEmpty(fields)) {
        observer.changed && observer.changed(newDoc._id, fields);
      }
    }
    startOfGroup = endOfGroup+1;
  });


};


// General helper for diff-ing two objects.
// callbacks is an object like so:
// { leftOnly: function (key, leftValue) {...},
//   rightOnly: function (key, rightValue) {...},
//   both: function (key, leftValue, rightValue) {...},
// }
LocalCollection._diffObjects = function (left, right, callbacks) {
  _.each(left, function (leftValue, key) {
    if (_.has(right, key))
      callbacks.both && callbacks.both(key, leftValue, right[key]);
    else
      callbacks.leftOnly && callbacks.leftOnly(key, leftValue);
  });
  if (callbacks.rightOnly) {
    _.each(right, function(rightValue, key) {
      if (!_.has(left, key))
        callbacks.rightOnly(key, rightValue);
    });
  }
};

}).call(this);



// ------------------------------------------------------------------------
// packages/minimongo/objectid.js

(function(){ LocalCollection._looksLikeObjectID = function (str) {
  return str.length === 24 && str.match(/^[0-9a-f]*$/);
};

LocalCollection._ObjectID = function (hexString) {
  //random-based impl of Mongo ObjectID
  var self = this;
  if (hexString) {
    hexString = hexString.toLowerCase();
    if (!LocalCollection._looksLikeObjectID(hexString)) {
      throw new Error("Invalid hexadecimal string for creating an ObjectID");
    }
    // meant to work with _.isEqual(), which relies on structural equality
    self._str = hexString;
  } else {
    self._str = Random.hexString(24);
  }
};

LocalCollection._ObjectID.prototype.toString = function () {
  var self = this;
  return "ObjectID(\"" + self._str + "\")";
};

LocalCollection._ObjectID.prototype.equals = function (other) {
  var self = this;
  return other instanceof LocalCollection._ObjectID &&
    self.valueOf() === other.valueOf();
};

LocalCollection._ObjectID.prototype.clone = function () {
  var self = this;
  return new LocalCollection._ObjectID(self._str);
};

LocalCollection._ObjectID.prototype.typeName = function() {
  return "oid";
};

LocalCollection._ObjectID.prototype.getTimestamp = function() {
  var self = this;
  return parseInt(self._str.substr(0, 8), 16);
};

LocalCollection._ObjectID.prototype.valueOf =
    LocalCollection._ObjectID.prototype.toJSONValue =
    LocalCollection._ObjectID.prototype.toHexString =
    function () { return this._str; };

// Is this selector just shorthand for lookup by _id?
LocalCollection._selectorIsId = function (selector) {
  return (typeof selector === "string") ||
    (typeof selector === "number") ||
    selector instanceof LocalCollection._ObjectID;
};

// Is the selector just lookup by _id (shorthand or not)?
LocalCollection._selectorIsIdPerhapsAsObject = function (selector) {
  return LocalCollection._selectorIsId(selector) ||
    (selector && typeof selector === "object" &&
     selector._id && LocalCollection._selectorIsId(selector._id) &&
     _.size(selector) === 1);
};

// If this is a selector which explicitly constrains the match by ID to a finite
// number of documents, returns a list of their IDs.  Otherwise returns
// null. Note that the selector may have other restrictions so it may not even
// match those document!  We care about $in and $and since those are generated
// access-controlled update and remove.
LocalCollection._idsMatchedBySelector = function (selector) {
  // Is the selector just an ID?
  if (LocalCollection._selectorIsId(selector))
    return [selector];
  if (!selector)
    return null;

  // Do we have an _id clause?
  if (_.has(selector, '_id')) {
    // Is the _id clause just an ID?
    if (LocalCollection._selectorIsId(selector._id))
      return [selector._id];
    // Is the _id clause {_id: {$in: ["x", "y", "z"]}}?
    if (selector._id && selector._id.$in
        && _.isArray(selector._id.$in)
        && !_.isEmpty(selector._id.$in)
        && _.all(selector._id.$in, LocalCollection._selectorIsId)) {
      return selector._id.$in;
    }
    return null;
  }

  // If this is a top-level $and, and any of the clauses constrain their
  // documents, then the whole selector is constrained by any one clause's
  // constraint. (Well, by their intersection, but that seems unlikely.)
  if (selector.$and && _.isArray(selector.$and)) {
    for (var i = 0; i < selector.$and.length; ++i) {
      var subIds = LocalCollection._idsMatchedBySelector(selector.$and[i]);
      if (subIds)
        return subIds;
    }
  }

  return null;
};

EJSON.addType("oid",  function (str) {
  return new LocalCollection._ObjectID(str);
});

}).call(this);



// ------------------------------------------------------------------------
// packages/mongo-livedata/local_collection_driver.js

(function(){ // XXX namespacing
Meteor._LocalCollectionDriver = function () {
  var self = this;
  self.collections = {};
};

_.extend(Meteor._LocalCollectionDriver.prototype, {
  open: function (name) {
    var self = this;
    if (!name)
      return new LocalCollection;
    if (!(name in self.collections))
      self.collections[name] = new LocalCollection;
    return self.collections[name];
  }
});

// singleton
Meteor._LocalCollectionDriver = new Meteor._LocalCollectionDriver;

}).call(this);



// ------------------------------------------------------------------------
// packages/mongo-livedata/collection.js

(function(){ // connection, if given, is a LivedataClient or LivedataServer
// XXX presently there is no way to destroy/clean up a Collection

Meteor.Collection = function (name, options) {
  var self = this;
  if (! (self instanceof Meteor.Collection))
    throw new Error('use "new" to construct a Meteor.Collection');
  if (options && options.methods) {
    // Backwards compatibility hack with original signature (which passed
    // "connection" directly instead of in options. (Connections must have a "methods"
    // method.)
    // XXX remove before 1.0
    options = {connection: options};
  }
  // Backwards compatibility: "connection" used to be called "manager".
  if (options && options.manager && !options.connection) {
    options.connection = options.manager;
  }
  options = _.extend({
    connection: undefined,
    idGeneration: 'STRING',
    transform: null,
    _driver: undefined,
    _preventAutopublish: false
  }, options);

  switch (options.idGeneration) {
  case 'MONGO':
    self._makeNewID = function () {
      return new Meteor.Collection.ObjectID();
    };
    break;
  case 'STRING':
  default:
    self._makeNewID = function () {
      return Random.id();
    };
    break;
  }

  if (options.transform)
    self._transform = Deps._makeNonreactive(options.transform);
  else
    self._transform = null;

  if (!name && (name !== null)) {
    Meteor._debug("Warning: creating anonymous collection. It will not be " +
                  "saved or synchronized over the network. (Pass null for " +
                  "the collection name to turn off this warning.)");
  }

  // note: nameless collections never have a connection
  self._connection = name && (options.connection ||
                           (Meteor.isClient ?
                            Meteor.default_connection : Meteor.default_server));

  if (!options._driver) {
    if (name && self._connection === Meteor.default_server &&
        Meteor._RemoteCollectionDriver)
      options._driver = Meteor._RemoteCollectionDriver;
    else
      options._driver = Meteor._LocalCollectionDriver;
  }

  self._collection = options._driver.open(name);
  self._name = name;

  if (name && self._connection.registerStore) {
    // OK, we're going to be a slave, replicating some remote
    // database, except possibly with some temporary divergence while
    // we have unacknowledged RPC's.
    var ok = self._connection.registerStore(name, {
      // Called at the beginning of a batch of updates. batchSize is the number
      // of update calls to expect.
      //
      // XXX This interface is pretty janky. reset probably ought to go back to
      // being its own function, and callers shouldn't have to calculate
      // batchSize. The optimization of not calling pause/remove should be
      // delayed until later: the first call to update() should buffer its
      // message, and then we can either directly apply it at endUpdate time if
      // it was the only update, or do pauseObservers/apply/apply at the next
      // update() if there's another one.
      beginUpdate: function (batchSize, reset) {
        // pause observers so users don't see flicker when updating several
        // objects at once (including the post-reconnect reset-and-reapply
        // stage), and so that a re-sorting of a query can take advantage of the
        // full _diffQuery moved calculation instead of applying change one at a
        // time.
        if (batchSize > 1 || reset)
          self._collection.pauseObservers();

        if (reset)
          self._collection.remove({});
      },

      // Apply an update.
      // XXX better specify this interface (not in terms of a wire message)?
      update: function (msg) {
        var mongoId = Meteor.idParse(msg.id);
        var doc = self._collection.findOne(mongoId);

        // Is this a "replace the whole doc" message coming from the quiescence
        // of method writes to an object? (Note that 'undefined' is a valid
        // value meaning "remove it".)
        if (msg.msg === 'replace') {
          var replace = msg.replace;
          if (!replace) {
            if (doc)
              self._collection.remove(mongoId);
          } else if (!doc) {
            self._collection.insert(replace);
          } else {
            // XXX check that replace has no $ ops
            self._collection.update(mongoId, replace);
          }
          return;
        } else if (msg.msg === 'added') {
          if (doc) {
            throw new Error("Expected not to find a document already present for an add");
          }
          self._collection.insert(_.extend({_id: mongoId}, msg.fields));
        } else if (msg.msg === 'removed') {
          if (!doc)
            throw new Error("Expected to find a document already present for removed");
          self._collection.remove(mongoId);
        } else if (msg.msg === 'changed') {
          if (!doc)
            throw new Error("Expected to find a document to change");
          if (!_.isEmpty(msg.fields)) {
            var modifier = {};
            _.each(msg.fields, function (value, key) {
              if (value === undefined) {
                if (!modifier.$unset)
                  modifier.$unset = {};
                modifier.$unset[key] = 1;
              } else {
                if (!modifier.$set)
                  modifier.$set = {};
                modifier.$set[key] = value;
              }
            });
            self._collection.update(mongoId, modifier);
          }
        } else {
          throw new Error("I don't know how to deal with this message");
        }

      },

      // Called at the end of a batch of updates.
      endUpdate: function () {
        self._collection.resumeObservers();
      },

      // Called around method stub invocations to capture the original versions
      // of modified documents.
      saveOriginals: function () {
        self._collection.saveOriginals();
      },
      retrieveOriginals: function () {
        return self._collection.retrieveOriginals();
      }
    });

    if (!ok)
      throw new Error("There is already a collection named '" + name + "'");
  }

  self._defineMutationMethods();

  // autopublish
  if (!options._preventAutopublish &&
      self._connection && self._connection.onAutopublish)
    self._connection.onAutopublish(function () {
      var handler = function () { return self.find(); };
      self._connection.publish(null, handler, {is_auto: true});
    });
};

///
/// Main collection API
///


_.extend(Meteor.Collection.prototype, {

  _getFindSelector: function (args) {
    if (args.length == 0)
      return {};
    else
      return args[0];
  },

  _getFindOptions: function (args) {
    var self = this;
    if (args.length < 2) {
      return { transform: self._transform };
    } else {
      return _.extend({
        transform: self._transform
      }, args[1]);
    }
  },

  find: function (/* selector, options */) {
    // Collection.find() (return all docs) behaves differently
    // from Collection.find(undefined) (return 0 docs).  so be
    // careful about the length of arguments.
    var self = this;
    var argArray = _.toArray(arguments);
    return self._collection.find(self._getFindSelector(argArray),
                                 self._getFindOptions(argArray));
  },

  findOne: function (/* selector, options */) {
    var self = this;
    var argArray = _.toArray(arguments);
    return self._collection.findOne(self._getFindSelector(argArray),
                                    self._getFindOptions(argArray));
  }

});


// protect against dangerous selectors.  falsey and {_id: falsey} are both
// likely programmer error, and not what you want, particularly for destructive
// operations.  JS regexps don't serialize over DDP but can be trivially
// replaced by $regex.
Meteor.Collection._rewriteSelector = function (selector) {
  // shorthand -- scalars match _id
  if (LocalCollection._selectorIsId(selector))
    selector = {_id: selector};

  if (!selector || (('_id' in selector) && !selector._id))
    // can't match anything
    return {_id: Random.id()};

  var ret = {};
  _.each(selector, function (value, key) {
    if (value instanceof RegExp) {
      ret[key] = {$regex: value.source};
      var regexOptions = '';
      // JS RegExp objects support 'i', 'm', and 'g'. Mongo regex $options
      // support 'i', 'm', 'x', and 's'. So we support 'i' and 'm' here.
      if (value.ignoreCase)
        regexOptions += 'i';
      if (value.multiline)
        regexOptions += 'm';
      if (regexOptions)
        ret[key].$options = regexOptions;
    }
    else if (_.contains(['$or','$and','$nor'], key)) {
      // Translate lower levels of $and/$or/$nor
      ret[key] = _.map(value, function (v) {
        return Meteor.Collection._rewriteSelector(v);
      });
    }
    else
      ret[key] = value;
  });
  return ret;
};

var throwIfSelectorIsNotId = function (selector, methodName) {
  if (!LocalCollection._selectorIsIdPerhapsAsObject(selector)) {
    throw new Meteor.Error(
      403, "Not permitted. Untrusted code may only " + methodName +
        " documents by ID.");
  }
};

// 'insert' immediately returns the inserted document's new _id.  The
// others return nothing.
//
// Otherwise, the semantics are exactly like other methods: they take
// a callback as an optional last argument; if no callback is
// provided, they block until the operation is complete, and throw an
// exception if it fails; if a callback is provided, then they don't
// necessarily block, and they call the callback when they finish with
// error and result arguments.  (The insert method provides the
// document ID as its result; update and remove don't provide a result.)
//
// On the client, blocking is impossible, so if a callback
// isn't provided, they just return immediately and any error
// information is lost.
//
// There's one more tweak. On the client, if you don't provide a
// callback, then if there is an error, a message will be logged with
// Meteor._debug.
//
// The intent (though this is actually determined by the underlying
// drivers) is that the operations should be done synchronously, not
// generating their result until the database has acknowledged
// them. In the future maybe we should provide a flag to turn this
// off.
_.each(["insert", "update", "remove"], function (name) {
  Meteor.Collection.prototype[name] = function (/* arguments */) {
    var self = this;
    var args = _.toArray(arguments);
    var callback;
    var ret;

    if (args.length && args[args.length - 1] instanceof Function)
      callback = args.pop();

    if (Meteor.isClient && !callback) {
      // Client can't block, so it can't report errors by exception,
      // only by callback. If they forget the callback, give them a
      // default one that logs the error, so they aren't totally
      // baffled if their writes don't work because their database is
      // down.
      callback = function (err) {
        if (err)
          Meteor._debug(name + " failed: " + (err.reason || err.stack));
      };
    }

    if (name === "insert") {
      if (!args.length)
        throw new Error("insert requires an argument");
      // shallow-copy the document and generate an ID
      args[0] = _.extend({}, args[0]);
      if ('_id' in args[0]) {
        ret = args[0]._id;
        if (!(typeof ret === 'string'
              || ret instanceof Meteor.Collection.ObjectID))
          throw new Error("Meteor requires document _id fields to be strings or ObjectIDs");
      } else {
        ret = args[0]._id = self._makeNewID();
      }
    } else {
      args[0] = Meteor.Collection._rewriteSelector(args[0]);
    }

    if (self._connection && self._connection !== Meteor.default_server) {
      // just remote to another endpoint, propagate return value or
      // exception.

      var enclosing = Meteor._CurrentInvocation.get();
      var alreadyInSimulation = enclosing && enclosing.isSimulation;
      if (!alreadyInSimulation && name !== "insert") {
        // If we're about to actually send an RPC, we should throw an error if
        // this is a non-ID selector, because the mutation methods only allow
        // single-ID selectors. (If we don't throw here, we'll see flicker.)
        throwIfSelectorIsNotId(args[0], name);
      }

      if (callback) {
        // asynchronous: on success, callback should return ret
        // (document ID for insert, undefined for update and
        // remove), not the method's result.
        self._connection.apply(self._prefix + name, args, function (error, result) {
          callback(error, !error && ret);
        });
      } else {
        // synchronous: propagate exception
        self._connection.apply(self._prefix + name, args);
      }

    } else {
      // it's my collection.  descend into the collection object
      // and propagate any exception.
      try {
        self._collection[name].apply(self._collection, args);
      } catch (e) {
        if (callback) {
          callback(e);
          return null;
        }
        throw e;
      }

      // on success, return *ret*, not the connection's return value.
      callback && callback(null, ret);
    }

    // both sync and async, unless we threw an exception, return ret
    // (new document ID for insert, undefined otherwise).
    return ret;
  };
});

// We'll actually design an index API later. For now, we just pass through to
// Mongo's, but make it synchronous.
Meteor.Collection.prototype._ensureIndex = function (index, options) {
  var self = this;
  if (!self._collection._ensureIndex)
    throw new Error("Can only call _ensureIndex on server collections");
  self._collection._ensureIndex(index, options);
};
Meteor.Collection.prototype._dropIndex = function (index) {
  var self = this;
  if (!self._collection._dropIndex)
    throw new Error("Can only call _dropIndex on server collections");
  self._collection._dropIndex(index);
};

Meteor.Collection.ObjectID = LocalCollection._ObjectID;

///
/// Remote methods and access control.
///

// Restrict default mutators on collection. allow() and deny() take the
// same options:
//
// options.insert {Function(userId, doc)}
//   return true to allow/deny adding this document
//
// options.update {Function(userId, docs, fields, modifier)}
//   return true to allow/deny updating these documents.
//   `fields` is passed as an array of fields that are to be modified
//
// options.remove {Function(userId, docs)}
//   return true to allow/deny removing these documents
//
// options.fetch {Array}
//   Fields to fetch for these validators. If any call to allow or deny
//   does not have this option then all fields are loaded.
//
// allow and deny can be called multiple times. The validators are
// evaluated as follows:
// - If neither deny() nor allow() has been called on the collection,
//   then the request is allowed if and only if the "insecure" smart
//   package is in use.
// - Otherwise, if any deny() function returns true, the request is denied.
// - Otherwise, if any allow() function returns true, the request is allowed.
// - Otherwise, the request is denied.
//
// Meteor may call your deny() and allow() functions in any order, and may not
// call all of them if it is able to make a decision without calling them all
// (so don't include side effects).

(function () {
  var addValidator = function(allowOrDeny, options) {
    // validate keys
    var VALID_KEYS = ['insert', 'update', 'remove', 'fetch', 'transform'];
    _.each(_.keys(options), function (key) {
      if (!_.contains(VALID_KEYS, key))
        throw new Error(allowOrDeny + ": Invalid key: " + key);
    });

    var self = this;
    self._restricted = true;

    _.each(['insert', 'update', 'remove'], function (name) {
      if (options[name]) {
        if (!(options[name] instanceof Function)) {
          throw new Error(allowOrDeny + ": Value for `" + name + "` must be a function");
        }
        if (self._transform)
          options[name].transform = self._transform;
        if (options.transform)
          options[name].transform = Deps._makeNonreactive(options.transform);
        self._validators[name][allowOrDeny].push(options[name]);
      }
    });

    // Only update the fetch fields if we're passed things that affect
    // fetching. This way allow({}) and allow({insert: f}) don't result in
    // setting fetchAllFields
    if (options.update || options.remove || options.fetch) {
      if (options.fetch && !(options.fetch instanceof Array)) {
        throw new Error(allowOrDeny + ": Value for `fetch` must be an array");
      }
      self._updateFetch(options.fetch);
    }
  };

  Meteor.Collection.prototype.allow = function(options) {
    addValidator.call(this, 'allow', options);
  };
  Meteor.Collection.prototype.deny = function(options) {
    addValidator.call(this, 'deny', options);
  };
})();


Meteor.Collection.prototype._defineMutationMethods = function() {
  var self = this;

  // set to true once we call any allow or deny methods. If true, use
  // allow/deny semantics. If false, use insecure mode semantics.
  self._restricted = false;

  // Insecure mode (default to allowing writes). Defaults to 'undefined'
  // which means use the global Meteor.Collection.insecure.  This
  // property can be overriden by tests or packages wishing to change
  // insecure mode behavior of their collections.
  self._insecure = undefined;

  self._validators = {
    insert: {allow: [], deny: []},
    update: {allow: [], deny: []},
    remove: {allow: [], deny: []},
    fetch: [],
    fetchAllFields: false
  };

  if (!self._name)
    return; // anonymous collection

  // XXX Think about method namespacing. Maybe methods should be
  // "Meteor:Mongo:insert/NAME"?
  self._prefix = '/' + self._name + '/';

  // mutation methods
  if (self._connection) {
    var m = {};

    _.each(['insert', 'update', 'remove'], function (method) {
      m[self._prefix + method] = function (/* ... */) {
        // All the methods do their own validation, instead of using check().
        check(arguments, [Match.Any]);
        try {
          if (this.isSimulation) {

            // In a client simulation, you can do any mutation (even with a
            // complex selector).
            self._collection[method].apply(
              self._collection, _.toArray(arguments));
            return;
          }

          // This is the server receiving a method call from the client. We
          // don't allow arbitrary selectors in mutations from the client: only
          // single-ID selectors.
          if (method !== 'insert')
            throwIfSelectorIsNotId(arguments[0], method);

          if (self._restricted) {
            // short circuit if there is no way it will pass.
            if (self._validators[method].allow.length === 0) {
              throw new Meteor.Error(
                403, "Access denied. No allow validators set on restricted " +
                  "collection for method '" + method + "'.");
            }

            var validatedMethodName =
                  '_validated' + method.charAt(0).toUpperCase() + method.slice(1);
            var argsWithUserId = [this.userId].concat(_.toArray(arguments));
            self[validatedMethodName].apply(self, argsWithUserId);
          } else if (self._isInsecure()) {
            // In insecure mode, allow any mutation (with a simple selector).
            self._collection[method].apply(
              self._collection, _.toArray(arguments));
          } else {
            // In secure mode, if we haven't called allow or deny, then nothing
            // is permitted.
            throw new Meteor.Error(403, "Access denied");
          }
        } catch (e) {
          if (e.name === 'MongoError' || e.name === 'MinimongoError') {
            throw new Meteor.Error(409, e.toString());
          } else {
            throw e;
          }
        }
      };
    });
    // Minimongo on the server gets no stubs; instead, by default
    // it wait()s until its result is ready, yielding.
    // This matches the behavior of macromongo on the server better.
    if (Meteor.isClient || self._connection === Meteor.default_server)
      self._connection.methods(m);
  }
};


Meteor.Collection.prototype._updateFetch = function (fields) {
  var self = this;

  if (!self._validators.fetchAllFields) {
    if (fields) {
      self._validators.fetch = _.union(self._validators.fetch, fields);
    } else {
      self._validators.fetchAllFields = true;
      // clear fetch just to make sure we don't accidentally read it
      self._validators.fetch = null;
    }
  }
};

Meteor.Collection.prototype._isInsecure = function () {
  var self = this;
  if (self._insecure === undefined)
    return Meteor.Collection.insecure;
  return self._insecure;
};

var docToValidate = function (validator, doc) {
  var ret = doc;
  if (validator.transform)
    ret = validator.transform(EJSON.clone(doc));
  return ret;
};

Meteor.Collection.prototype._validatedInsert = function(userId, doc) {
  var self = this;

  // call user validators.
  // Any deny returns true means denied.
  if (_.any(self._validators.insert.deny, function(validator) {
    return validator(userId, docToValidate(validator, doc));
  })) {
    throw new Meteor.Error(403, "Access denied");
  }
  // Any allow returns true means proceed. Throw error if they all fail.
  if (_.all(self._validators.insert.allow, function(validator) {
    return !validator(userId, docToValidate(validator, doc));
  })) {
    throw new Meteor.Error(403, "Access denied");
  }

  self._collection.insert.call(self._collection, doc);
};

var transformDoc = function (validator, doc) {
  if (validator.transform)
    return validator.transform(doc);
  return doc;
};

// Simulate a mongo `update` operation while validating that the access
// control rules set by calls to `allow/deny` are satisfied. If all
// pass, rewrite the mongo operation to use $in to set the list of
// document ids to change ##ValidatedChange
Meteor.Collection.prototype._validatedUpdate = function(
    userId, selector, mutator, options) {
  var self = this;

  if (!LocalCollection._selectorIsIdPerhapsAsObject(selector))
    throw new Error("validated update should be of a single ID");

  // compute modified fields
  var fields = [];
  _.each(mutator, function (params, op) {
    if (op.charAt(0) !== '$') {
      throw new Meteor.Error(
        403, "Access denied. In a restricted collection you can only update documents, not replace them. Use a Mongo update operator, such as '$set'.");
    } else if (!_.has(ALLOWED_UPDATE_OPERATIONS, op)) {
      throw new Meteor.Error(
        403, "Access denied. Operator " + op + " not allowed in a restricted collection.");
    } else {
      _.each(_.keys(params), function (field) {
        // treat dotted fields as if they are replacing their
        // top-level part
        if (field.indexOf('.') !== -1)
          field = field.substring(0, field.indexOf('.'));

        // record the field we are trying to change
        if (!_.contains(fields, field))
          fields.push(field);
      });
    }
  });

  var findOptions = {transform: null};
  if (!self._validators.fetchAllFields) {
    findOptions.fields = {};
    _.each(self._validators.fetch, function(fieldName) {
      findOptions.fields[fieldName] = 1;
    });
  }

  var doc = self._collection.findOne(selector, findOptions);
  if (!doc)  // none satisfied!
    return;

  var factoriedDoc;

  // call user validators.
  // Any deny returns true means denied.
  if (_.any(self._validators.update.deny, function(validator) {
    if (!factoriedDoc)
      factoriedDoc = transformDoc(validator, doc);
    return validator(userId,
                     factoriedDoc,
                     fields,
                     mutator);
  })) {
    throw new Meteor.Error(403, "Access denied");
  }
  // Any allow returns true means proceed. Throw error if they all fail.
  if (_.all(self._validators.update.allow, function(validator) {
    if (!factoriedDoc)
      factoriedDoc = transformDoc(validator, doc);
    return !validator(userId,
                      factoriedDoc,
                      fields,
                      mutator);
  })) {
    throw new Meteor.Error(403, "Access denied");
  }

  // Back when we supported arbitrary client-provided selectors, we actually
  // rewrote the selector to include an _id clause before passing to Mongo to
  // avoid races, but since selector is guaranteed to already just be an ID, we
  // don't have to any more.

  self._collection.update.call(
    self._collection, selector, mutator, options);
};

// Only allow these operations in validated updates. Specifically
// whitelist operations, rather than blacklist, so new complex
// operations that are added aren't automatically allowed. A complex
// operation is one that does more than just modify its target
// field. For now this contains all update operations except '$rename'.
// http://docs.mongodb.org/manual/reference/operators/#update
var ALLOWED_UPDATE_OPERATIONS = {
  $inc:1, $set:1, $unset:1, $addToSet:1, $pop:1, $pullAll:1, $pull:1,
  $pushAll:1, $push:1, $bit:1
};

// Simulate a mongo `remove` operation while validating access control
// rules. See #ValidatedChange
Meteor.Collection.prototype._validatedRemove = function(userId, selector) {
  var self = this;

  var findOptions = {transform: null};
  if (!self._validators.fetchAllFields) {
    findOptions.fields = {};
    _.each(self._validators.fetch, function(fieldName) {
      findOptions.fields[fieldName] = 1;
    });
  }

  var doc = self._collection.findOne(selector, findOptions);
  if (!doc)
    return;

  // call user validators.
  // Any deny returns true means denied.
  if (_.any(self._validators.remove.deny, function(validator) {
    return validator(userId, transformDoc(validator, doc));
  })) {
    throw new Meteor.Error(403, "Access denied");
  }
  // Any allow returns true means proceed. Throw error if they all fail.
  if (_.all(self._validators.remove.allow, function(validator) {
    return !validator(userId, transformDoc(validator, doc));
  })) {
    throw new Meteor.Error(403, "Access denied");
  }

  // Back when we supported arbitrary client-provided selectors, we actually
  // rewrote the selector to {_id: {$in: [ids that we found]}} before passing to
  // Mongo to avoid races, but since selector is guaranteed to already just be
  // an ID, we don't have to any more.

  self._collection.remove.call(self._collection, selector);
};

}).call(this);



// ------------------------------------------------------------------------
// packages/startup/startup.coffee.js

(function(){ var loaded, queue;

loaded = false;

queue = [];

Meteor.startup = function(cb) {
  if (loaded) {
    cb();
  } else {
    queue.push(cb);
  }
};

Agent.start = function() {
  while (queue.length > 0) {
    (queue.shift())();
  }
  loaded = true;
};

}).call(this);



// ------------------------------------------------------------------------
// packages/canonical-stringify/stringify.js

(function(){ function quote(string) {
  return JSON.stringify(string);
}

var rep, gap, indent;

function str(key, holder) {

// Produce a string from holder[key].

    var i,          // The loop counter.
        k,          // The member key.
        v,          // The member value.
        length,
        mind = gap,
        partial,
        value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

    if (value && typeof value === 'object' &&
            typeof value.toJSON === 'function') {
        value = value.toJSON(key);
    }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

    if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
    }

// What happens next depends on the value's type.

    switch (typeof value) {
    case 'string':
        return quote(value);

    case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

        return isFinite(value) ? String(value) : 'null';

    case 'boolean':
    case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

        return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

    case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

        if (!value) {
            return 'null';
        }

// Make an array to hold the partial results of stringifying this object value.

        gap += indent;
        partial = [];

// Is the value an array?

        if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

            length = value.length;
            for (i = 0; i < length; i += 1) {
                partial[i] = str(i, value) || 'null';
            }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

            v = partial.length === 0
                ? '[]'
                : gap
                ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                : '[' + partial.join(',') + ']';
            gap = mind;
            return v;
        }

// If the replacer is an array, use it to select the members to be stringified.

        if (rep && typeof rep === 'object') {
            length = rep.length;
            for (i = 0; i < length; i += 1) {
                if (typeof rep[i] === 'string') {
                    k = rep[i];
                    v = str(k, value);
                    if (v) {
                        partial.push(quote(k) + (gap ? ': ' : ':') + v);
                    }
                }
            }
        } else {

// Otherwise, iterate through all of the keys in the object.

            _.each(_.keys(value).sort(), function (k) {
                v = str(k, value);
                if (v) {
                    partial.push(quote(k) + (gap ? ': ' : ':') + v);
                }
            });
        }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

        v = partial.length === 0
            ? '{}'
            : gap
            ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
            : '{' + partial.join(',') + '}';
        gap = mind;
        return v;
    }
}

// If the JSON object does not yet have a stringify method, give it one.

function stringify(value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        }

if (typeof awwx === 'undefined')
  this.awwx = {};
awwx.canonicalStringify = stringify;

}).call(this);



// ------------------------------------------------------------------------
// packages/worker-agent/context.litcoffee.js

(function(){ var Context, contextVar, getContext, resetContext, withContext;

Context = (function() {
  function Context(entry, parentContext) {
    this.entry = entry;
    this.parentContext = parentContext;
  }

  Context.prototype.add = function(entry) {
    return new Context(entry, this);
  };

  Context.prototype.toArray = function() {
    var array, context, entry;

    array = [];
    context = this;
    while (context != null) {
      entry = context.entry;
      if (entry != null) {
        array.push(entry);
      }
      context = context.parentContext;
    }
    return array.reverse();
  };

  return Context;

})();

contextVar = new Meteor.EnvironmentVariable();

getContext = function() {
  var context;

  context = contextVar.get();
  if (context != null) {
    return context.toArray();
  } else {
    return [];
  }
};

withContext = function(entry, fn) {
  var context;

  if (typeof fn !== 'function') {
    throw new Error("withContext: fn arg is not a function: " + fn);
  }
  context = new Context(entry, contextVar.get());
  return contextVar.withValue(context, fn);
};

resetContext = function(fn) {
  return contextVar.withValue(null, fn);
};

(this.awwx || (this.awwx = {})).Context = {
  getContext: getContext,
  resetContext: resetContext,
  withContext: withContext
};

}).call(this);



// ------------------------------------------------------------------------
// packages/worker-agent/error.litcoffee.js

(function(){ var ErrorDescription, Failed, bind, catcherr, defer, describeError, ensureString, getContext, logError, reportError, _base;

getContext = awwx.Context.getContext;

ensureString = function(x) {
  var error;

  if (x === null) {
    return 'null';
  }
  if (typeof x === 'undefined') {
    return 'undefined';
  }
  if (typeof x === 'string') {
    return x;
  }
  try {
    return x.toString();
  } catch (_error) {
    error = _error;
    return JSON.stringify(describeError(error));
  }
};

ErrorDescription = (function() {
  function ErrorDescription() {}

  return ErrorDescription;

})();

describeError = function(err, context) {
  var constructorName, description, message, stack, type, _ref;

  if (err === null) {
    message = "null";
  } else if (typeof err === 'undefined') {
    message = 'undefined';
  } else {
    if (err.message !== null && typeof err.message !== 'undefined') {
      message = ensureString(err.message);
    } else {
      message = ensureString(err);
    }
    if (err.stack !== null && typeof err.stack !== 'undefined') {
      stack = ensureString(err.stack);
    }
    if (err instanceof Error) {
      constructorName = (_ref = err.constructor) != null ? _ref.name : void 0;
      if (constructorName != null) {
        type = ensureString(constructorName);
      }
    }
  }
  description = new ErrorDescription();
  description.message = message;
  if (type != null) {
    description.type = type;
  }
  if (stack != null) {
    description.stack = stack;
  }
  if (context != null) {
    description.context = context;
  }
  return description;
};

logError = function(description) {
  var entry, _i, _len, _ref;

  if (description.stack != null) {
    Meteor._debug(description.stack);
  } else {
    Meteor._debug(description.message);
  }
  if (description.context != null) {
    _ref = description.context;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      entry = _ref[_i];
      Meteor._debug('-', entry);
    }
  }
};

reportError = function(error) {
  logError(describeError(error, getContext()));
};

Failed = (function() {
  function Failed(reason) {
    this.reason = reason;
  }

  return Failed;

})();

catcherr = function(fn, failureReason) {
  var error;

  try {
    return fn();
  } catch (_error) {
    error = _error;
    if (!(error instanceof Failed)) {
      reportError(error);
    }
    throw new Failed(failureReason);
  }
};

defer = function(fn) {
  if (typeof fn !== 'function') {
    throw new Error("not a function: " + fn);
  }
  return Meteor.defer(function() {
    return catcherr(fn);
  });
};

bind = function(fn) {
  return Meteor.bindEnvironment(fn, reportError, this);
};

_.extend(((_base = (this.awwx || (this.awwx = {}))).Error || (_base.Error = {})), {
  bind: bind,
  catcherr: catcherr,
  defer: defer,
  Failed: Failed,
  reportError: reportError
});

}).call(this);



// ------------------------------------------------------------------------
// packages/worker-agent/fanout.litcoffee.js

(function(){ var Fanout, catcherr,
  __slice = [].slice;

catcherr = awwx.Error.catcherr;

Fanout = function() {
  var fn, listeners;

  listeners = [];
  fn = function() {
    var args, callback, _i, _len;

    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (listeners != null) {
      for (_i = 0, _len = listeners.length; _i < _len; _i++) {
        callback = listeners[_i];
        catcherr(function() {
          return callback.apply(null, args);
        });
      }
    }
  };
  fn.listen = function(callback) {
    if (listeners != null) {
      listeners.push(callback);
    }
  };
  fn.dispose = function() {
    listeners = null;
  };
  return fn;
};

(this.awwx || (this.awwx = {})).Fanout = Fanout;

}).call(this);



// ------------------------------------------------------------------------
// packages/worker-agent/result.litcoffee.js

(function(){ var Fanout, Result, bind, catcherr, defer, reportError, _ref;

Fanout = awwx.Fanout;

_ref = awwx.Error, bind = _ref.bind, catcherr = _ref.catcherr, defer = _ref.defer, reportError = _ref.reportError;

Result = (function() {
  function Result() {
    this._done = false;
    this._failed = null;
    this._doneFanout = Fanout();
  }

  Result.prototype.callback = function(cb) {
    var _this = this;

    if (typeof cb !== 'function') {
      throw new Error("Result.on: callback is not a function: " + cb);
    }
    if (this._done) {
      catcherr(function() {
        return cb(_this._failed, _this._value, _this);
      });
    } else {
      this._doneFanout.listen(bind(cb));
    }
    return this;
  };

  Result.prototype.onSuccess = function(cb) {
    var _this = this;

    if (typeof cb !== 'function') {
      throw new Error("Result.onSuccess: callback is not a function: " + cb);
    }
    this.callback(function(failed, value) {
      if (failed) {
        return;
      }
      catcherr(function() {
        return cb(value, _this);
      });
    });
    return this;
  };

  Result.prototype.onFailure = function(cb) {
    var _this = this;

    if (typeof cb !== 'function') {
      throw new Error("Result.onFail: callback is not a function: " + cb);
    }
    this.callback(function(failed, value) {
      if (!failed) {
        return;
      }
      catcherr(function() {
        return cb(failed, _this);
      });
    });
    return this;
  };

  Result.prototype._broadcast = function() {
    this._doneFanout(this._failed, this._value, this);
    this._doneFanout.dispose();
  };

  Result.prototype.complete = function(value) {
    if (this._done) {
      return this;
    }
    if (value instanceof Result) {
      this.from(value);
      return;
    }
    this._done = true;
    this._value = value;
    this._broadcast();
    return this;
  };

  Result.prototype.fail = function(failure) {
    if (this._done) {
      return this;
    }
    this._done = true;
    this._failed = failure != null ? failure : true;
    this._broadcast();
    return this;
  };

  Result.prototype.into = function(result) {
    var _this = this;

    this.callback(function(failed, value) {
      if (failed) {
        return result.fail();
      } else {
        return result.complete(value);
      }
    });
    return this;
  };

  Result.prototype.from = function(result) {
    result.into(this);
    return this;
  };

  Result.prototype._run = function(fn, arg) {
    var error, ret;

    try {
      ret = fn(arg);
    } catch (_error) {
      error = _error;
      reportError(error);
      this.fail();
      return;
    }
    if (ret instanceof Result) {
      this.from(ret);
    } else {
      this.complete(ret);
    }
  };

  Result.prototype.then = function(successFn, failureFn) {
    var result,
      _this = this;

    if ((successFn != null) && !(typeof successFn === 'function')) {
      throw new Error("Result.then: successFn is not a function: " + successFn);
    }
    if ((failureFn != null) && !(typeof failureFn === 'function')) {
      throw new Error("Result.then: failureFn is not a function: " + failureFn);
    }
    result = new Result();
    this.callback(function(failure, value) {
      if (failure != null) {
        if (failureFn != null) {
          result._run(failureFn, failure);
        } else {
          result.fail();
        }
      } else {
        if (successFn != null) {
          result._run(successFn, value);
        } else {
          result.complete(value);
        }
      }
    });
    return result;
  };

  Result.prototype.always = function(fn) {
    var f;

    f = function() {
      fn();
    };
    return this.then(f, f);
  };

  Result.value = function(v) {
    var result;

    result = new Result();
    result.complete(v);
    return result;
  };

  Result.completed = function(v) {
    return Result.value(v);
  };

  Result.failed = function(failure) {
    var result;

    result = new Result();
    result.fail(failure);
    return result;
  };

  Result.delay = function(milliseconds, v) {
    var result;

    result = new Result();
    Meteor.setTimeout((function() {
      return result.complete(v);
    }), milliseconds);
    return result;
  };

  Result.defer = function(v) {
    var result;

    result = new Result();
    defer(function() {
      return result.complete(v);
    });
    return result;
  };

  Result.join = function(results) {
    var finalResult, i, nComplete, output, result, total, _fn, _i, _len;

    if (results.length === 0) {
      return Result.completed([]);
    }
    finalResult = new Result();
    total = results.length;
    nComplete = 0;
    output = [];
    _fn = function(result, i) {
      return result.callback(function(failure, value) {
        if (failure) {
          return finalResult.fail(failure);
        } else {
          output[i] = value;
          ++nComplete;
          if (nComplete === total) {
            return finalResult.complete(output);
          }
        }
      });
    };
    for (i = _i = 0, _len = results.length; _i < _len; i = ++_i) {
      result = results[i];
      _fn(result, i);
    }
    return finalResult;
  };

  Result.sequence = function(input, fns) {
    var finalResult, i, next;

    finalResult = new Result();
    i = 0;
    next = function(value) {
      var result;

      result = new Result();
      result._run(fns[i], value);
      result.callback(function(failure, nextValue) {
        if (failure != null) {
          finalResult.fail(failure);
          return;
        }
        ++i;
        if (i === fns.length) {
          finalResult.complete(nextValue);
        } else {
          next(nextValue);
        }
      });
    };
    Result.value(input).callback(function(failure, nextValue) {
      if (failure != null) {
        finalResult.fail(failure);
        return;
      }
      next(nextValue);
    });
    return finalResult;
  };

  Result.prototype.timeout = function(milliseconds) {
    var delay, result;

    result = new Result();
    delay = Result.delay(milliseconds);
    delay.onSuccess(function() {
      return result.fail('timeout');
    });
    this.into(result);
    return result;
  };

  Result.prototype.debug = function(msg) {
    if (msg == null) {
      msg = "result";
    }
    this.callback(function(failure, value) {
      if (failure != null) {
        Meteor._debug(msg, 'FAILED', failure);
      } else {
        Meteor._debug(msg, 'completed', value);
      }
    });
    return this;
  };

  return Result;

})();

(this.awwx || (this.awwx = {})).Result = Result;

}).call(this);



// ------------------------------------------------------------------------
// packages/worker-agent/contains.litcoffee.js

(function(){ var contains;

contains = function(list, value) {
  var item, _i, _len;

  for (_i = 0, _len = list.length; _i < _len; _i++) {
    item = list[_i];
    if (EJSON.equals(item, value)) {
      return true;
    }
  }
  return false;
};

(this.awwx || (this.awwx = {})).contains = contains;

}).call(this);



// ------------------------------------------------------------------------
// packages/worker-agent/database.litcoffee.js

(function(){ var DATABASE_NAME, DATABASE_VERSION, Result, SQLStore, andthen, begin, bind, canonicalStringify, contains, getContext, getResponsible, global, now, placeholders, reportError, sqlRows, store, withContext, _ref, _ref1,
  __slice = [].slice;

DATABASE_NAME = 'awwx/offline-data';

DATABASE_VERSION = '5';

global = this;

canonicalStringify = awwx.canonicalStringify, contains = awwx.contains, Result = awwx.Result;

_ref = awwx.Context, getContext = _ref.getContext, getResponsible = _ref.getResponsible, withContext = _ref.withContext;

_ref1 = awwx.Error, bind = _ref1.bind, reportError = _ref1.reportError;

sqlRows = function(sqlResultSet) {
  var array, i, r, _i, _ref2;

  array = [];
  r = sqlResultSet.rows;
  for (i = _i = 0, _ref2 = r.length; 0 <= _ref2 ? _i < _ref2 : _i > _ref2; i = 0 <= _ref2 ? ++_i : --_i) {
    array.push(r.item(i));
  }
  return array;
};

placeholders = function(array) {
  return _.map(array, function() {
    return "?";
  }).join(",");
};

now = function() {
  return new Date().getTime();
};

andthen = function() {
  var fn, fns, result,
    _this = this;

  result = arguments[0], fns = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  while (fns.length > 0) {
    fn = fns.shift();
    (function(fn) {
      return result = result.then(function() {
        var args;

        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return fn.apply(null, args);
      });
    })(fn);
  }
  return result;
};

begin = function() {
  var description, steps,
    _this = this;

  description = arguments[0], steps = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  return withContext(description, function() {
    return andthen.apply(null, [Result.completed()].concat(__slice.call(steps)));
  });
};

SQLStore = (function() {
  function SQLStore() {
    this.databaseOpen = new Result();
  }

  SQLStore.prototype.implementation = 'SQL';

  SQLStore.prototype.processTransaction = function(fn, runtx) {
    var inTxResult, result, txDone,
      _this = this;

    if (!_.isFunction(fn)) {
      throw new Error('fn should be a function');
    }
    txDone = new Result();
    inTxResult = new Result();
    runtx(bind(function(tx) {
      withContext('SQL transaction', function() {
        return fn(tx);
      }).into(inTxResult);
    }), (function(error) {
      reportError(error);
      txDone.fail();
    }), (function() {
      txDone.complete();
    }));
    result = new Result();
    Result.join([inTxResult, txDone]).onSuccess(function(_arg) {
      var inValue, txValue;

      inValue = _arg[0], txValue = _arg[1];
      return result.complete(inValue);
    }).onFailure(function() {
      return result.fail();
    });
    return result;
  };

  SQLStore.prototype._transaction = function(fn) {
    var _this = this;

    return this.processTransaction(fn, function(withTx, onError, onSuccess) {
      return _this.sqldb.transaction(withTx, onError, onSuccess);
    });
  };

  SQLStore.prototype.transaction = function(fn) {
    var _this = this;

    return this.databaseOpen.then(function() {
      return _this._transaction(fn);
    });
  };

  SQLStore.prototype.changeVersion = function(newVersion, fn) {
    var _this = this;

    return this.processTransaction(fn, function(withTx, onError, onSuccess) {
      return _this.sqldb.changeVersion(_this.sqldb.version, newVersion, withTx, onError, onSuccess);
    });
  };

  SQLStore.prototype.openDatabase = function(options) {
    var _this = this;

    if (options == null) {
      options = {};
    }
    return withContext('open SQL database', function() {
      _this.sqldb = global.openDatabase(DATABASE_NAME, '', '', 1024 * 1024);
    });
  };

  SQLStore.prototype.sql = function(tx, sqlStatement, args) {
    var _this = this;

    return withContext("execute SQL statement: " + sqlStatement, function() {
      var result;

      result = new Result();
      tx.executeSql(sqlStatement, args, bind(function(tx, sqlResultSet) {
        result.complete(sqlRows(sqlResultSet));
      }), bind(function(tx, sqlError) {
        reportError(sqlError);
        result.fail();
      }));
      return result;
    });
  };

  SQLStore.prototype.listTables = function(tx) {
    var _this = this;

    return begin("listTables", (function() {
      return _this.sql(tx, "SELECT * FROM sqlite_master\n  WHERE type=\"table\" AND\n        name NOT LIKE \"!_%\" ESCAPE \"!\" AND\n        name NOT LIKE \"sqlite!_%\" ESCAPE \"!\"");
    }), (function(tables) {
      var table;

      return ((function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = tables.length; _i < _len; _i++) {
          table = tables[_i];
          _results.push(table.name);
        }
        return _results;
      })()).sort();
    }));
  };

  SQLStore.prototype.dropTable = function(tx, tableName) {
    var _this = this;

    return begin("dropTable " + tableName, (function() {
      return _this.sql(tx, "DROP TABLE " + tableName);
    }));
  };

  SQLStore.prototype.dropAllTables = function(tx) {
    var _this = this;

    return begin("dropAllTables", (function() {
      return _this.listTables(tx);
    }), (function(names) {
      var name;

      return Result.join((function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = names.length; _i < _len; _i++) {
          name = names[_i];
          _results.push(this.dropTable(tx, name));
        }
        return _results;
      }).call(_this));
    }), (function() {}));
  };

  SQLStore.prototype.eraseDatabase = function() {
    var _this = this;

    return begin("eraseDatabase", (function() {
      _this.openDatabase();
      return _this.changeVersion('', function(tx) {
        return _this.dropAllTables(tx);
      });
    }));
  };

  SQLStore.prototype.createTables = function(tx) {
    var _this = this;

    return begin("createTables", function() {
      return Result.join([_this.sql(tx, "CREATE TABLE windows (\n  windowId TEXT PRIMARY KEY NOT NULL,\n  updateId INTEGER NOT NULL\n)"), _this.sql(tx, "CREATE TABLE agentWindow (\n  singleton INTEGER PRIMARY KEY NOT NULL,\n  windowId TEXT NOT NULL\n)"), _this.sql(tx, "CREATE TABLE docs (\n  connection TEXT NOT NULL,\n  collectionName TEXT NOT NULL,\n  docId TEXT NOT NULL,\n  doc TEXT NOT NULL,\n  PRIMARY KEY (connection, collectionName, docId)\n)"), _this.sql(tx, "CREATE TABLE stubDocs (\n  connection TEXT NOT NULL,\n  methodId TEXT NOT NULL,\n  collectionName TEXT NOT NULL,\n  docId TEXT NOT NULL,\n  PRIMARY KEY (connection, methodId, collectionName, docId)\n)"), _this.sql(tx, "CREATE TABLE queuedMethods (\n  connection TEXT NOT NULL,\n  methodId TEXT NOT NULL,\n  method TEXT NOT NULL,\n  PRIMARY KEY (connection, methodId)\n)"), _this.sql(tx, "CREATE TABLE windowSubscriptions (\n  windowId TEXT NOT NULL,\n  connection TEXT NOT NULL,\n  subscription TEXT NOT NULL,\n  PRIMARY KEY (windowId, connection, subscription)\n)"), _this.sql(tx, "CREATE TABLE subscriptions (\n  connection TEXT NOT NULL,\n  subscription TEXT NOT NULL,\n  readyFromServer INTEGER NOT NULL,\n  ready INTEGER NOT NULL,\n  PRIMARY KEY (connection, subscription)\n)"), _this.sql(tx, "CREATE TABLE methodsHoldingUpSubscriptions (\n  connection TEXT NOT NULL,\n  subscription TEXT NOT NULL,\n  methodId TEXT NOT NULL,\n  PRIMARY KEY (connection, subscription, methodId)\n)"), _this.sql(tx, "CREATE TABLE updates (\n  id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,\n  theUpdate TEXT NOT NULL\n)")]);
    });
  };

  SQLStore.prototype.initializeNewDatabase = function() {
    var _this = this;

    return begin("initializeNewDatabase", function() {
      return _this.changeVersion(DATABASE_VERSION, (function(tx) {
        return _this.createTables(tx);
      }));
    });
  };

  SQLStore.prototype.resetDatabase = function() {
    var _this = this;

    return begin("resetDatabase", (function() {
      return _this.eraseDatabase();
    }), (function() {
      return _this.initializeNewDatabase();
    }));
  };

  SQLStore.prototype.upgradeDatabaseIfNeeded = function() {
    var _this = this;

    return begin("upgradeDatabaseIfNeeded", function() {
      if (_this.sqldb.version === DATABASE_VERSION) {
        return Result.completed();
      } else {
        return _this.resetDatabase();
      }
    });
  };

  SQLStore.prototype.open = function() {
    var _this = this;

    return begin("open", function() {
      _this.openDatabase();
      _this.upgradeDatabaseIfNeeded().into(_this.databaseOpen);
      return _this.databaseOpen;
    });
  };

  SQLStore.prototype.ensureWindow = function(tx, windowId) {
    var _this = this;

    return begin("ensureWindow", (function() {
      return _this.sql(tx, "INSERT OR IGNORE INTO windows (windowId, updateId)\n  VALUES (?, 0)", [windowId]);
    }));
  };

  SQLStore.prototype.readWindowIds = function(tx) {
    var _this = this;

    return begin("readWindowsIds", (function() {
      return _this.sql(tx, "SELECT windowId FROM windows");
    }), (function(rows) {
      var row, _i, _len, _results;

      _results = [];
      for (_i = 0, _len = rows.length; _i < _len; _i++) {
        row = rows[_i];
        _results.push(row.windowId);
      }
      return _results;
    }));
  };

  SQLStore.prototype.deleteWindows = function(tx, windowIds) {
    var _this = this;

    return begin("deleteWindows", (function() {
      return _this.sql(tx, "DELETE FROM windows\n  WHERE windowId IN (" + (placeholders(windowIds)) + ")", windowIds);
    }), (function() {
      return _this.sql(tx, "DELETE FROM windowSubscriptions\n  WHERE windowId IN (" + (placeholders(windowIds)) + ")", windowIds);
    }));
  };

  SQLStore.prototype.readAgentWindow = function(tx) {
    var _this = this;

    return begin("readAgentWindow", (function() {
      return _this.sql(tx, "SELECT windowId FROM agentWindow");
    }), (function(rows) {
      if (rows.length === 0) {
        return null;
      } else if (rows.length === 1) {
        return rows[0].windowId;
      } else {
        reportError('agentWindow table does not contain a singleton row');
        return Result.failed();
      }
    }));
  };

  SQLStore.prototype.writeAgentWindow = function(tx, windowId) {
    var _this = this;

    return begin("writeAgentWindow", (function() {
      return _this.sql(tx, "INSERT OR REPLACE INTO agentWindow\n  (singleton, windowId) VALUES (0, ?)", [windowId]);
    }));
  };

  SQLStore.prototype.writeDoc = function(tx, connection, collectionName, doc) {
    var _this = this;

    return begin("writeDoc", (function() {
      return _this.sql(tx, "INSERT OR REPLACE INTO docs\n  (connection, collectionName, docId, doc)\n  VALUES (?, ?, ?, ?)", [connection, collectionName, doc._id, EJSON.stringify(doc)]);
    }));
  };

  SQLStore.prototype.readDocs = function(tx, connection) {
    var _this = this;

    return begin("readDocs", (function() {
      return _this.sql(tx, "SELECT collectionName, doc FROM docs WHERE connection=?", [connection]);
    }), (function(rows) {
      var doc, output, row, _i, _len;

      output = {};
      for (_i = 0, _len = rows.length; _i < _len; _i++) {
        row = rows[_i];
        doc = EJSON.parse(row.doc);
        Meteor._ensure(output, row.collectionName)[doc._id] = doc;
      }
      return output;
    }));
  };

  SQLStore.prototype.readDocIdsOfCollection = function(tx, connection, collectionName) {
    var _this = this;

    return begin('readDocIdsOfCollection', (function() {
      return _this.sql(tx, "SELECT docId FROM docs\n  WHERE connection = ? AND\n        collectionName = ?", [connection, collectionName]);
    }), (function(rows) {
      return _.map(rows, function(row) {
        return row.docId;
      });
    }));
  };

  SQLStore.prototype.deleteDoc = function(tx, connection, collectionName, docId) {
    var _this = this;

    return begin("deleteDoc", (function() {
      return _this.sql(tx, "DELETE FROM docs\n  WHERE connection=? AND\n        collectionName=? AND\n        docID=?", [connection, collectionName, docId]);
    }));
  };

  SQLStore.prototype.addDocumentWrittenByStub = function(tx, connection, methodId, collectionName, docId) {
    var _this = this;

    return begin("addDocumentWrittenByStub", (function() {
      return _this.sql(tx, "INSERT INTO stubDocs\n  (connection, methodId, collectionName, docId)\n  VALUES (?, ?, ?, ?)", [connection, methodId, collectionName, docId]);
    }));
  };

  SQLStore.prototype.isDocumentWrittenByAnyStub = function(tx, connection, collectionName, docId) {
    var _this = this;

    return begin("isDocumentWrittenByAnyStub", (function() {
      return _this.sql(tx, "SELECT 1 FROM stubDocs\n  WHERE connection=? AND\n        collectionName=? AND\n        docID=?\n  LIMIT 1", [connection, collectionName, docId]);
    }), (function(rows) {
      return rows.length > 0;
    }));
  };

  SQLStore.prototype.readDocsWrittenByStub = function(tx, connection, methodId) {
    var _this = this;

    return begin("readDocsWrittenByStub", (function() {
      return _this.sql(tx, "SELECT collectionName, docId FROM stubDocs\n  WHERE connection=? AND\n        methodId=?", [connection, methodId]);
    }));
  };

  SQLStore.prototype.removeDocumentsWrittenByStub = function(tx, connection, methodId) {
    var _this = this;

    return begin("removeDocumentsWrittenByStub", (function() {
      return _this.sql(tx, "DELETE FROM stubDocs\n  WHERE connection=? AND\n        methodId=?", [connection, methodId]);
    }));
  };

  SQLStore.prototype.readMethodsWithDocsWritten = function(tx, connection) {
    var _this = this;

    return begin("readMethodsWithDocsWritten", (function() {
      return _this.sql(tx, "SELECT DISTINCT methodId FROM stubDocs\n  WHERE connection=?\n  ORDER BY methodId", [connection]);
    }), (function(rows) {
      var row;

      return (function() {
        var _i, _len, _results;

        _results = [];
        for (_i = 0, _len = rows.length; _i < _len; _i++) {
          row = rows[_i];
          _results.push(row.methodId);
        }
        return _results;
      })();
    }));
  };

  SQLStore.prototype.addQueuedMethod = function(tx, connection, methodId, name, args) {
    var _this = this;

    return begin("addQueuedMethod", (function() {
      var method;

      method = canonicalStringify({
        name: name,
        args: args
      });
      return _this.sql(tx, "INSERT INTO queuedMethods\n  (connection, methodId, method)\n  VALUES (?, ?, ?)", [connection, methodId, method]);
    }));
  };

  SQLStore.prototype.readQueuedMethods = function(tx) {
    var _this = this;

    return begin("readQueuedMethods", (function() {
      return _this.sql(tx, "SELECT connection, methodId, method FROM queuedMethods");
    }), (function(rows) {
      var args, name, output, row, _i, _len, _ref2;

      output = [];
      for (_i = 0, _len = rows.length; _i < _len; _i++) {
        row = rows[_i];
        _ref2 = EJSON.parse(row.method), name = _ref2.name, args = _ref2.args;
        output.push({
          connection: row.connection,
          methodId: row.methodId,
          name: name,
          args: args
        });
      }
      return output;
    }));
  };

  SQLStore.prototype.removeQueuedMethod = function(tx, connection, methodId) {
    var _this = this;

    return begin("removedQueuedMethod", (function() {
      return _this.sql(tx, "DELETE FROM queuedMethods\n  WHERE connection=? AND\n        methodId=?", [connection, methodId]);
    }));
  };

  SQLStore.prototype.addWindowSubscription = function(tx, windowId, connection, name, args) {
    var _this = this;

    return begin("addWindowSubscription", (function() {
      var subscription;

      subscription = canonicalStringify({
        name: name,
        args: args
      });
      return _this.sql(tx, "INSERT INTO windowSubscriptions\n  (windowId, connection, subscription)\n  VALUES (?, ?, ?)", [windowId, connection, subscription]);
    }));
  };

  SQLStore.prototype._testReadWindowSubscriptions = function(tx) {
    var _this = this;

    return begin("_testReadWindowSubscriptions", (function() {
      return _this.sql(tx, "SELECT windowId, connection, subscription\n  FROM windowSubscriptions\n  ORDER BY windowId, connection, subscription");
    }), (function(rows) {
      var args, name, output, row, _i, _len, _ref2;

      output = [];
      for (_i = 0, _len = rows.length; _i < _len; _i++) {
        row = rows[_i];
        _ref2 = EJSON.parse(row.subscription), name = _ref2.name, args = _ref2.args;
        output.push({
          windowId: row.windowId,
          connection: row.connection,
          name: name,
          args: args
        });
      }
      return output;
    }));
  };

  SQLStore.prototype.readMergedSubscriptions = function(tx) {
    var _this = this;

    return begin("readMergedSubscriptions", (function() {
      return _this.sql(tx, "SELECT DISTINCT connection, subscription\n  FROM windowSubscriptions\n  ORDER BY connection, subscription");
    }), (function(rows) {
      var args, name, output, row, _i, _len, _ref2;

      output = [];
      for (_i = 0, _len = rows.length; _i < _len; _i++) {
        row = rows[_i];
        _ref2 = EJSON.parse(row.subscription), name = _ref2.name, args = _ref2.args;
        output.push({
          connection: row.connection,
          name: name,
          args: args
        });
      }
      return output;
    }));
  };

  SQLStore.prototype.removeWindowSubscription = function(tx, windowId, connection, name, args) {
    var _this = this;

    return begin("removeWindowSubscription", (function() {
      var subscription;

      subscription = canonicalStringify({
        name: name,
        args: args
      });
      return _this.sql(tx, "DELETE FROM windowSubscriptions\n  WHERE windowId=? AND\n        connection=? AND\n        subscription=?", [windowId, connection, subscription]);
    }));
  };

  SQLStore.prototype.ensureSubscription = function(tx, connection, name, args) {
    var _this = this;

    return begin("ensureSubscription", (function() {
      var subscription;

      subscription = canonicalStringify({
        name: name,
        args: args
      });
      return _this.sql(tx, "INSERT OR IGNORE INTO subscriptions\n  (connection, subscription, readyFromServer, ready)\n  VALUES (?, ?, 0, 0)", [connection, subscription]);
    }));
  };

  SQLStore.prototype.removeSubscription = function(tx, connection, name, args) {
    var _this = this;

    return begin("removeSubscription", (function() {
      var subscription;

      subscription = canonicalStringify({
        name: name,
        args: args
      });
      return _this.sql(tx, "DELETE FROM subscriptions\n  WHERE connection = ? AND\n        subscription = ?", [connection, subscription]);
    }));
  };

  SQLStore.prototype.addSubscriptionForWindow = function(tx, windowId, connection, name, args) {
    var _this = this;

    return begin("addSubscriptionForWindow", (function() {
      return Result.join([_this.addWindowSubscription(tx, windowId, connection, name, args), _this.ensureSubscription(tx, connection, name, args)]);
    }));
  };

  SQLStore.prototype.cleanSubscriptions = function(tx) {
    var _this = this;

    return begin("cleanSubscriptions", (function() {
      return Result.join([_this.readMergedSubscriptions(tx), _this.readSubscriptions(tx)]);
    }), (function(_arg) {
      var args, connection, mergedSubscriptions, name, subscriptions, toDelete, writes, _i, _j, _len, _len1, _ref2, _ref3;

      mergedSubscriptions = _arg[0], subscriptions = _arg[1];
      toDelete = [];
      for (_i = 0, _len = subscriptions.length; _i < _len; _i++) {
        _ref2 = subscriptions[_i], connection = _ref2.connection, name = _ref2.name, args = _ref2.args;
        if (!contains(mergedSubscriptions, {
          connection: connection,
          name: name,
          args: args
        })) {
          toDelete.push({
            connection: connection,
            name: name,
            args: args
          });
        }
      }
      writes = [];
      for (_j = 0, _len1 = toDelete.length; _j < _len1; _j++) {
        _ref3 = toDelete[_j], connection = _ref3.connection, name = _ref3.name, args = _ref3.args;
        writes.push(_this.removeSubscription(tx, connection, name, args));
      }
      return Result.join(writes);
    }));
  };

  SQLStore.prototype.readSubscriptions = function(tx) {
    var _this = this;

    return begin("readSubscriptions", (function() {
      return _this.sql(tx, "SELECT connection, subscription, readyFromServer, ready\n  FROM subscriptions\n  ORDER BY connection, subscription");
    }), (function(rows) {
      var args, name, output, row, _i, _len, _ref2;

      output = [];
      for (_i = 0, _len = rows.length; _i < _len; _i++) {
        row = rows[_i];
        _ref2 = EJSON.parse(row.subscription), name = _ref2.name, args = _ref2.args;
        output.push({
          connection: row.connection,
          name: name,
          args: args,
          readyFromServer: row.readyFromServer === 1,
          ready: row.ready === 1
        });
      }
      return output;
    }));
  };

  SQLStore.prototype.haveSubscription = function(tx, connection, name, args) {
    var _this = this;

    return begin("haveSubscription", (function() {
      var subscription;

      subscription = canonicalStringify({
        name: name,
        args: args
      });
      return _this.sql(tx, "SELECT 1 FROM subscriptions\n  WHERE connection=? AND\n        subscription=?", [connection, subscription]);
    }), (function(rows) {
      return rows.length > 0;
    }));
  };

  SQLStore.prototype.setSubscriptionReadyFromServer = function(tx, connection, name, args) {
    var _this = this;

    return begin("setSubscriptionReadyFromServer", (function() {
      var subscription;

      subscription = canonicalStringify({
        name: name,
        args: args
      });
      return _this.sql(tx, "UPDATE subscriptions SET readyFromServer=1\n  WHERE connection=? AND\n        subscription=?", [connection, subscription]);
    }));
  };

  SQLStore.prototype.setSubscriptionReady = function(tx, connection, name, args) {
    var _this = this;

    return begin("setSubscriptionReady", (function() {
      var subscription;

      subscription = canonicalStringify({
        name: name,
        args: args
      });
      return _this.sql(tx, "UPDATE subscriptions SET ready=1\n  WHERE connection=? AND\n        subscription=?", [connection, subscription]);
    }));
  };

  SQLStore.prototype._testReadMethodsHoldingUpSubscriptions = function(tx) {
    var _this = this;

    return begin("_testReadMethodsHoldingUpSubscriptions", (function() {
      return _this.sql(tx, "SELECT connection, subscription, methodId\n  FROM methodsHoldingUpSubscriptions\n  ORDER BY connection, subscription, methodId");
    }), (function(rows) {
      var args, name, output, row, _i, _len, _ref2;

      output = [];
      for (_i = 0, _len = rows.length; _i < _len; _i++) {
        row = rows[_i];
        _ref2 = EJSON.parse(row.subscription), name = _ref2.name, args = _ref2.args;
        output.push({
          connection: row.connection,
          name: name,
          args: args,
          methodId: row.methodId
        });
      }
      return output;
    }));
  };

  SQLStore.prototype.readSubscriptionsHeldUp = function(tx) {
    var _this = this;

    return begin("readSubscriptionsHeldUp", (function() {
      return _this.sql(tx, "SELECT DISTINCT connection, subscription\n  FROM methodsHoldingUpSubscriptions\n  ORDER BY connection, subscription");
    }), (function(rows) {
      var args, name, output, row, _i, _len, _ref2;

      output = [];
      for (_i = 0, _len = rows.length; _i < _len; _i++) {
        row = rows[_i];
        _ref2 = EJSON.parse(row.subscription), name = _ref2.name, args = _ref2.args;
        output.push({
          connection: row.connection,
          name: name,
          args: args
        });
      }
      return output;
    }));
  };

  SQLStore.prototype.addSubscriptionWaitingOnMethods = function(tx, connection, name, args, methodIds) {
    var _this = this;

    return begin("addSubscriptionWaitingOnMethods", (function() {
      var methodId, subscription, writes, _fn, _i, _len;

      subscription = canonicalStringify({
        name: name,
        args: args
      });
      writes = [];
      _fn = function(methodId) {
        return writes.push(_this.sql(tx, "INSERT OR IGNORE INTO methodsHoldingUpSubscriptions\n  (connection, subscription, methodId)\n  VALUES (?, ?, ?)", [connection, subscription, methodId]));
      };
      for (_i = 0, _len = methodIds.length; _i < _len; _i++) {
        methodId = methodIds[_i];
        _fn(methodId);
      }
      return Result.join(writes);
    }));
  };

  SQLStore.prototype.removeMethodHoldingUpSubscriptions = function(tx, methodId) {
    var _this = this;

    return begin("removeMethodHoldingUpSubscriptions", (function() {
      return _this.sql(tx, "DELETE FROM methodsHoldingUpSubscriptions\n  WHERE methodId=?", [methodId]);
    }));
  };

  SQLStore.prototype.addUpdate = function(tx, update) {
    var _this = this;

    return begin("addUpdate", (function() {
      var serialized;

      serialized = EJSON.stringify(update);
      return _this.sql(tx, "INSERT INTO updates (theUpdate) VALUES (?)", [serialized]);
    }));
  };

  SQLStore.prototype._parseUpdates = function(rows) {
    var output, row, _i, _len;

    output = [];
    for (_i = 0, _len = rows.length; _i < _len; _i++) {
      row = rows[_i];
      output.push({
        id: row.id,
        update: EJSON.parse(row.theUpdate)
      });
    }
    return output;
  };

  SQLStore.prototype._testReadUpdates = function(tx) {
    var _this = this;

    return begin("_testReadUpdates", (function() {
      return _this.sql(tx, "SELECT id, theUpdate FROM updates ORDER BY id");
    }), (function(rows) {
      return _this._parseUpdates(rows);
    }));
  };

  SQLStore.prototype.highestUpdateId = function(tx) {
    var _this = this;

    return begin("highestUpdateId", (function() {
      return _this.sql(tx, "SELECT MAX(id) AS id FROM updates");
    }), (function(rows) {
      var _ref2;

      return (_ref2 = rows[0].id) != null ? _ref2 : 0;
    }));
  };

  SQLStore.prototype.writeWindowUpdateIndex = function(tx, windowId, updateId) {
    var _this = this;

    return begin("writeWindowUpdateIndex", (function() {
      return _this.sql(tx, "UPDATE windows SET updateId = ?\n  WHERE windowId = ?", [updateId, windowId]);
    }));
  };

  SQLStore.prototype.initializeWindowUpdateIndex = function(tx, windowId) {
    var _this = this;

    return begin("initializeWindowUpdateIndex", (function() {
      return _this.highestUpdateId(tx);
    }), (function(updateId) {
      return _this.writeWindowUpdateIndex(tx, windowId, updateId);
    }));
  };

  SQLStore.prototype._testReadWindows = function(tx) {
    var _this = this;

    return begin("_testReadWindows", (function() {
      return _this.sql(tx, "SELECT windowId, updateId FROM windows\n  ORDER BY windowId");
    }));
  };

  SQLStore.prototype.removeUpdatesProcessedByAllWindows = function(tx) {
    var _this = this;

    return begin("removeUpdatesProcessedByAllWindows", (function() {
      return _this.sql(tx, "SELECT MIN(updateId) AS minUpdateId FROM windows");
    }), (function(rows) {
      var minUpdateId, _ref2, _ref3;

      minUpdateId = (_ref2 = (_ref3 = rows[0]) != null ? _ref3.minUpdateId : void 0) != null ? _ref2 : 0;
      return _this.sql(tx, "DELETE FROM updates WHERE id <= ?", [minUpdateId]);
    }));
  };

  SQLStore.prototype.pullUpdatesForWindow = function(tx, windowId) {
    var updates,
      _this = this;

    updates = null;
    return begin("pullUpdatesForWindow", (function() {
      return _this.sql(tx, "SELECT updateId FROM windows WHERE windowId=?", [windowId]);
    }), (function(rows) {
      var updateId, _ref2, _ref3;

      updateId = (_ref2 = (_ref3 = rows[0]) != null ? _ref3.updateId : void 0) != null ? _ref2 : 0;
      return _this.sql(tx, "SELECT theUpdate FROM updates WHERE id > ?", [updateId]);
    }), (function(rows) {
      var update;

      updates = (function() {
        var _i, _len, _ref2, _results;

        _ref2 = this._parseUpdates(rows);
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          update = _ref2[_i];
          _results.push(update.update);
        }
        return _results;
      }).call(_this);
      return _this.initializeWindowUpdateIndex(tx, windowId);
    }), (function() {
      return updates;
    }));
  };

  return SQLStore;

})();

this.Offline || (this.Offline = {});

store = null;

if (global.openDatabase) {
  Offline.supported = true;
  store = new SQLStore();
  Offline._SQLStore = SQLStore;
  Offline._database = store;
  Offline._databaseName = DATABASE_NAME;
  Offline._databaseVersion = DATABASE_VERSION;
  Offline.resetDatabase = function() {
    return store.resetDatabase();
  };
} else {
  Offline.supported = false;
}

Meteor.startup(function() {
  if (Offline._disableStartupForTesting) {
    return;
  }
  store.open();
});

}).call(this);



// ------------------------------------------------------------------------
// packages/worker-agent/windows.litcoffee.js

(function(){ var Fanout, Result, becomeTheAgentWindow, broadcast, check, checking, currentlyTheAgent, db, deadWindows, defer, lastPing, noLongerAgent, notTheAgent, now, nowAgent, thisWindowId, unload, windowIdsAtLastCheck, withContext;

this.Offline || (this.Offline = {});

Fanout = awwx.Fanout, Result = awwx.Result;

broadcast = Offline._broadcast;

defer = awwx.Error.defer;

withContext = awwx.Context.withContext;

db = Offline._database;

thisWindowId = Random.id();

nowAgent = new Fanout();

noLongerAgent = new Fanout();

Offline._windows = {
  nowAgent: nowAgent,
  noLongerAgent: noLongerAgent,
  thisWindowId: thisWindowId
};

if (typeof Offline !== "undefined" && Offline !== null ? Offline._usingSharedWebWorker : void 0) {
  return;
}

if (this.Agent != null) {
  Meteor.startup(function() {
    nowAgent();
  });
  return;
}

unload = function() {
  return withContext("unload", function() {
    broadcast('goodbye', thisWindowId);
  });
};

window.addEventListener('unload', unload, false);

windowIdsAtLastCheck = null;

lastPing = null;

broadcast.listen('ping', function() {
  return withContext('listen ping', function() {
    broadcast('pong', thisWindowId);
  });
});

broadcast.listen('pong', function(windowId) {
  return withContext('listen pong', function() {
    if (windowIdsAtLastCheck != null) {
      delete windowIdsAtLastCheck[windowId];
    }
  });
});

deadWindows = function(deadWindowIds) {
  return withContext("deadWindows", function() {
    return db.transaction(function(tx) {
      return (deadWindowIds.length > 0 ? (broadcast('deadWindows', deadWindowIds), db.deleteWindows(tx, deadWindowIds)) : Result.completed()).then(function() {
        return Result.join([db.readWindowIds(tx), db.readAgentWindow(tx)]);
      }).then(function(_arg) {
        var agentWindowId, windowIds;

        windowIds = _arg[0], agentWindowId = _arg[1];
        return (!((agentWindowId != null) && _.contains(windowIds, agentWindowId)) ? becomeTheAgentWindow(tx).then(function() {
          return thisWindowId;
        }) : Result.completed(agentWindowId)).then(function(agentWindowId) {});
      });
    });
  });
};

currentlyTheAgent = false;

Offline._windows.currentlyTheAgent = function() {
  return currentlyTheAgent;
};

becomeTheAgentWindow = function(tx) {
  return withContext("becomeTheAgentWindow", function() {
    currentlyTheAgent = true;
    defer(function() {
      return nowAgent();
    });
    return db.writeAgentWindow(tx, thisWindowId).then(function() {
      broadcast('newAgent', thisWindowId);
    });
  });
};

notTheAgent = function() {
  return withContext("notTheAgent", function() {
    if (!currentlyTheAgent) {
      return;
    }
    currentlyTheAgent = false;
    noLongerAgent();
  });
};

broadcast.listen('newAgent', function(windowId) {
  return withContext("listen newAgent", function() {
    if (windowId !== thisWindowId) {
      notTheAgent();
    }
  });
});

now = function() {
  return +(new Date());
};

checking = false;

check = function() {
  return withContext("window check", function() {
    if (checking) {
      return;
    }
    checking = true;
    return db.transaction(function(tx) {
      return db.readWindowIds(tx);
    }).then(function(windowIds) {
      var windowId, _i, _len;

      if ((lastPing != null) && now() - lastPing < 9000) {
        return;
      }
      windowIdsAtLastCheck = {};
      for (_i = 0, _len = windowIds.length; _i < _len; _i++) {
        windowId = windowIds[_i];
        if (windowId !== thisWindowId) {
          windowIdsAtLastCheck[windowId] = true;
        }
      }
      broadcast('ping');
      return Result.delay(4000).then(function() {
        return windowIds;
      });
    }).then(function(windowIds) {
      var dead, windowId, _i, _len;

      dead = [];
      for (_i = 0, _len = windowIds.length; _i < _len; _i++) {
        windowId = windowIds[_i];
        if (windowIdsAtLastCheck[windowId]) {
          dead.push(windowId);
        }
      }
      return deadWindows(dead);
    }).then(function() {
      return checking = false;
    });
  });
};

Meteor.startup(function() {
  return withContext("windows startup", function() {
    if (Offline._disableStartupForTesting) {
      return;
    }
    db.transaction(function(tx) {
      return db.ensureWindow(tx, thisWindowId);
    }).then(function() {
      return check();
    });
    Meteor.setInterval(check, 10000);
  });
});

}).call(this);



// ------------------------------------------------------------------------
// packages/worker-agent/agent.litcoffee.js

(function(){ var CollectionAgent, ConnectionAgent, Result, addMessageHandler, addNewSubscriptionToDatabase, asAgentWindow, broadcast, broadcastUpdate, connectionAgentFor, contains, database, defer, handlers, justNameAndArgs, newConnectionAgent, nowAgent, sendQueuedMethods, serialize, subscribeToNewSubscriptions, subscriptionsUpdated, thisWindowId, updateSubscriptions, updateSubscriptionsReady, updateSubscriptionsReadyInTx, withContext, _ref,
  __slice = [].slice;

if (typeof Offline !== "undefined" && Offline !== null ? Offline._usingSharedWebWorker : void 0) {
  Offline._messageAgent = function() {
    var args, topic;

    topic = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    Offline._sharedWebWorker.post({
      msg: topic,
      args: args
    });
  };
  return;
}

contains = awwx.contains, Result = awwx.Result;

withContext = awwx.Context.withContext;

broadcast = Offline._broadcast;

defer = awwx.Error.defer;

_ref = Offline._windows, nowAgent = _ref.nowAgent, thisWindowId = _ref.thisWindowId;

serialize = awwx.canonicalStringify;

database = Offline._database;

Offline._test || (Offline._test = {});

if (this.Agent != null) {
  Agent.addMessageHandler('update', function(sourcePort, data) {
    var port, _i, _len, _ref1;

    _ref1 = Agent.ports;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      port = _ref1[_i];
      if (port !== sourcePort) {
        port.postMessage({
          msg: 'update'
        });
      }
    }
  });
  addMessageHandler = function(topic, callback) {
    return Agent.addMessageHandler(topic, function(sourcePort, data) {
      callback();
    });
  };
  broadcastUpdate = function() {
    var port, _i, _len, _ref1;

    _ref1 = Agent.ports;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      port = _ref1[_i];
      port.postMessage({
        msg: 'update'
      });
    }
  };
} else {
  handlers = {};
  addMessageHandler = function(topic, callback) {
    handlers[topic] = callback;
    broadcast.listen(topic, callback);
  };
  broadcastUpdate = function() {
    broadcast.includingSelf('update');
  };
  Offline._messageAgent = function() {
    var args, topic;

    topic = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (Offline._windows.currentlyTheAgent()) {
      if (typeof handlers[topic] === "function") {
        handlers[topic].apply(handlers, args);
      }
    } else {
      broadcast.apply(null, [topic].concat(__slice.call(args)));
    }
  };
}

updateSubscriptionsReadyInTx = function(tx) {
  return withContext("updateSubscriptionsReadyInTx", function() {
    return Result.join([database.readSubscriptions(tx), database.readSubscriptionsHeldUp(tx)]).then(function(_arg) {
      var args, connection, name, newlyReady, ready, readyFromServer, subscriptions, subscriptionsHeldUp, writes, _i, _j, _len, _len1, _ref1, _ref2;

      subscriptions = _arg[0], subscriptionsHeldUp = _arg[1];
      newlyReady = [];
      for (_i = 0, _len = subscriptions.length; _i < _len; _i++) {
        _ref1 = subscriptions[_i], connection = _ref1.connection, name = _ref1.name, args = _ref1.args, readyFromServer = _ref1.readyFromServer, ready = _ref1.ready;
        if (!ready && readyFromServer && !contains(subscriptionsHeldUp, {
          connection: connection,
          name: name,
          args: args
        })) {
          newlyReady.push({
            connection: connection,
            name: name,
            args: args
          });
        }
      }
      if (newlyReady.length === 0) {
        return false;
      }
      writes = [];
      for (_j = 0, _len1 = newlyReady.length; _j < _len1; _j++) {
        _ref2 = newlyReady[_j], connection = _ref2.connection, name = _ref2.name, args = _ref2.args;
        writes.push(database.setSubscriptionReady(tx, connection, name, args));
        writes.push(database.addUpdate(tx, {
          update: 'subscriptionReady',
          subscription: {
            connection: connection,
            name: name,
            args: args
          }
        }));
      }
      return Result.join(writes);
    }).then(function() {
      return true;
    });
  });
};

Offline._test.updateSubscriptionsReadyInTx = updateSubscriptionsReadyInTx;

updateSubscriptionsReady = function() {
  return withContext("updateSubscriptionsReady", function() {
    return database.transaction(function(tx) {
      return updateSubscriptionsReadyInTx(tx);
    }).then(function(someNewlyReady) {
      if (someNewlyReady) {
        broadcastUpdate();
      }
    });
  });
};

addNewSubscriptionToDatabase = function(tx, connection, name, args) {
  return withContext("addNewSubscriptionToDatabase", function() {
    return database.readMethodsWithDocsWritten(tx, connection).then(function(methodIds) {
      return database.addSubscriptionWaitingOnMethods(tx, connection, name, args, methodIds);
    }).then(function() {
      return database.ensureSubscription(tx, connection, name, args);
    });
  });
};

justNameAndArgs = function(subscription) {
  return {
    name: subscription.name,
    args: subscription.args
  };
};

if (this.Agent != null) {
  asAgentWindow = function(fn) {
    return database.transaction(fn);
  };
} else {
  asAgentWindow = function(fn) {
    var _this = this;

    return database.transaction(function(tx) {
      return database.readAgentWindow(tx).then(function(agentWindowId) {
        if (agentWindowId === thisWindowId) {
          return fn(tx);
        } else {
          return Result.failed();
        }
      });
    });
  };
}

this.connectionAgents = {};

ConnectionAgent = (function() {
  function ConnectionAgent(connectionName, meteorConnection) {
    this.connectionName = connectionName;
    this.meteorConnection = meteorConnection;
    if (connectionAgents[this.connectionName] != null) {
      throw new Error("a ConnectionAgent has already been constructed for this connection name: " + this.connectionName);
    }
    connectionAgents[this.connectionName] = this;
    this.methodHandlers = {};
    this.collectionAgents = {};
    this.methodsSent = {};
    this.meteorSubscriptionHandles = {};
    this._nMeteorSubscriptionsReady = 0;
    this._deletedRemovedDocs = false;
  }

  ConnectionAgent.prototype.deleteRemovedDocuments = function(tx) {
    if (this._deletedRemovedDocs) {
      return Result.completed();
    } else {
      this._deletedRemovedDocs = true;
      return this._eachCollectionAgent(function(collectionAgent) {
        return collectionAgent.deleteDocumentsGoneFromServer(tx);
      });
    }
  };

  ConnectionAgent.prototype.checkIfReadyToDeleteDocs = function(tx) {
    if (this.allMeteorSubscriptionsReady()) {
      return this.deleteRemovedDocuments(tx);
    }
  };

  ConnectionAgent.prototype._alreadyHaveMeteorSubscription = function(subscription) {
    return !!this.meteorSubscriptionHandles[serialize(subscription)];
  };

  ConnectionAgent.prototype.allMeteorSubscriptionsReady = function() {
    return this._nMeteorSubscriptionsReady === _.size(this.meteorSubscriptionHandles);
  };

  ConnectionAgent.prototype._eachCollectionAgent = function(fn) {
    var collectionAgent, name, results, _ref1;

    results = [];
    _ref1 = this.collectionAgents;
    for (name in _ref1) {
      collectionAgent = _ref1[name];
      results.push(fn(collectionAgent));
    }
    return Result.join(results);
  };

  ConnectionAgent.prototype.instantiateCollectionAgent = function(collectionName) {
    var _base;

    (_base = this.collectionAgents)[collectionName] || (_base[collectionName] = new CollectionAgent(this, collectionName, new Meteor.Collection(collectionName)));
  };

  ConnectionAgent.prototype.instantiateCollectionAgents = function(collectionNames) {
    var collectionName, _i, _len;

    for (_i = 0, _len = collectionNames.length; _i < _len; _i++) {
      collectionName = collectionNames[_i];
      this.instantiateCollectionAgent(collectionName);
    }
  };

  ConnectionAgent.prototype.meteorSubscriptionReady = function(subscription) {
    var _this = this;

    this.instantiateCollectionAgents(_.keys(this.meteorConnection._updatesForUnknownStores));
    return asAgentWindow(function(tx) {
      return database.setSubscriptionReadyFromServer(tx, _this.connectionName, subscription.name, subscription.args).then(function() {
        return updateSubscriptionsReadyInTx(tx);
      }).then(function() {
        ++_this._nMeteorSubscriptionsReady;
        return _this.checkIfReadyToDeleteDocs(tx);
      }).then(function() {
        return broadcastUpdate();
      });
    });
  };

  ConnectionAgent.prototype.currentSubscriptions = function() {
    return _.map(_.keys(this.meteorSubscriptionHandles), EJSON.parse);
  };

  ConnectionAgent.prototype.oldSubscriptions = function(subscriptions) {
    var _this = this;

    return _.reject(this.currentSubscriptions(), (function(subscription) {
      return contains(subscriptions, subscription);
    }));
  };

  ConnectionAgent.prototype.stopOldSubscriptions = function(subscriptions) {
    var serialized, subscription, _i, _len, _ref1;

    _ref1 = this.oldSubscriptions(subscriptions);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      subscription = _ref1[_i];
      serialized = serialize(subscription);
      this.meteorSubscriptionHandles[serialized].stop();
      delete this.meteorSubscriptionHandles[serialized];
    }
  };

  ConnectionAgent.prototype.startNewSubscription = function(subscription) {
    var args, handle, name,
      _this = this;

    this._deletedRemovedDocs = false;
    name = subscription.name, args = subscription.args;
    handle = Meteor.subscribe.apply(Meteor, [name].concat(__slice.call(args), [function() {
      _this.meteorSubscriptionReady(subscription);
    }]));
    this.meteorSubscriptionHandles[serialize(subscription)] = handle;
  };

  ConnectionAgent.prototype.newSubscriptions = function(subscriptions) {
    var _this = this;

    return _.reject(subscriptions, function(subscription) {
      return _this._alreadyHaveMeteorSubscription(subscription);
    });
  };

  ConnectionAgent.prototype.startNewSubscriptions = function(subscriptions) {
    var subscription, _i, _len, _ref1;

    _ref1 = this.newSubscriptions(subscriptions);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      subscription = _ref1[_i];
      this.startNewSubscription(subscription);
    }
  };

  ConnectionAgent.prototype.updateSubscriptions = function(subscriptions) {
    subscriptions = _.map(subscriptions, justNameAndArgs);
    this.stopOldSubscriptions(subscriptions);
    this.startNewSubscriptions(subscriptions);
    return Result.completed();
  };

  ConnectionAgent.prototype.checkIfDocumentNowFree = function(tx, collectionName, docId) {
    return this.collectionAgents[collectionName].updateDocFromServerIfFree(tx, docId);
  };

  ConnectionAgent.prototype.methodCompleted = function(methodId) {
    var docsWhichWereWrittenByStub,
      _this = this;

    docsWhichWereWrittenByStub = null;
    asAgentWindow(function(tx) {
      return database.removeQueuedMethod(tx, _this.connectionName, methodId).then(function() {
        return database.readDocsWrittenByStub(tx, this.connectionName, methodId);
      }).then(function(docs) {
        docsWhichWereWrittenByStub = docs;
        return database.removeDocumentsWrittenByStub(tx, _this.connectionName, methodId);
      }).then(function() {
        var collectionName, docId, writes, _i, _len, _ref1;

        writes = [];
        for (_i = 0, _len = docsWhichWereWrittenByStub.length; _i < _len; _i++) {
          _ref1 = docsWhichWereWrittenByStub[_i], collectionName = _ref1.collectionName, docId = _ref1.docId;
          writes.push(_this.checkIfDocumentNowFree(tx, collectionName, docId));
        }
        return Result.join(writes);
      }).then(function() {
        return database.removeMethodHoldingUpSubscriptions(tx, methodId);
      }).then(function() {
        return updateSubscriptionsReadyInTx(tx);
      });
    }).then(function() {
      return broadcastUpdate();
    });
  };

  ConnectionAgent.prototype.sendQueuedMethod = function(methodId, name, args) {
    var _this = this;

    if (this.methodsSent[methodId]) {
      return;
    }
    this.methodsSent[methodId] = true;
    Meteor.call('/awwx/offline-data/apply', methodId, name, args, function(error, result) {
      if (error) {
        Meteor._debug('offline method error', name, error);
      }
      _this.methodCompleted(methodId);
    });
  };

  return ConnectionAgent;

})();

newConnectionAgent = function(connectionName) {
  var meteorConnection;

  meteorConnection = connectionName === '/' ? Meteor.default_connection : Meteor.connect(connectionName);
  return new ConnectionAgent(connectionName, meteorConnection);
};

connectionAgentFor = function(connectionName) {
  return connectionAgents[connectionName] || (connectionAgents[connectionName] = newConnectionAgent(connectionName));
};

sendQueuedMethods = function() {
  return asAgentWindow(function(tx) {
    return database.readQueuedMethods(tx).then(function(methods) {
      var args, connection, methodId, name, _i, _len, _ref1;

      for (_i = 0, _len = methods.length; _i < _len; _i++) {
        _ref1 = methods[_i], connection = _ref1.connection, methodId = _ref1.methodId, name = _ref1.name, args = _ref1.args;
        connectionAgentFor(connection).sendQueuedMethod(methodId, name, args);
      }
    });
  });
};

subscribeToNewSubscriptions = function(subscriptions) {
  var connectionAgent, connectionName, connectionSubscriptions, results, subscription, _i, _len;

  for (_i = 0, _len = subscriptions.length; _i < _len; _i++) {
    subscription = subscriptions[_i];
    connectionAgentFor(subscription.connection);
  }
  results = [];
  for (connectionName in connectionAgents) {
    connectionAgent = connectionAgents[connectionName];
    connectionSubscriptions = _.filter(subscriptions, function(subscription) {
      return subscription.connection === connectionName;
    });
    results.push(connectionAgent.updateSubscriptions(connectionSubscriptions));
  }
  return Result.join(results);
};

CollectionAgent = (function() {
  function CollectionAgent(connectionAgent, collectionName, serverCollection) {
    this.connectionAgent = connectionAgent;
    this.collectionName = collectionName;
    this.serverCollection = serverCollection;
    this.connectionName = this.connectionAgent.connectionName;
    this.watchServer();
  }

  CollectionAgent.prototype.offlineDocumentsNotInServerCollection = function(tx) {
    var _this = this;

    return database.readDocIdsOfCollection(tx, this.connectionName, this.collectionName).then(function(docIds) {
      return _.reject(docIds, (function(docId) {
        return _this.serverCollection.findOne(docId);
      }));
    });
  };

  CollectionAgent.prototype.deleteDocUnlessWrittenByStub = function(tx, docId) {
    var _this = this;

    return database.isDocumentWrittenByAnyStub(tx, this.connectionName, this.collectionName, docId).then(function(wasWritten) {
      if (wasWritten) {

      } else {
        return database.deleteDoc(tx, _this.connectionName, _this.collectionName, docId).then(function() {
          return _this.addDocumentUpdate(tx, docId, null);
        });
      }
    });
  };

  CollectionAgent.prototype.deleteDocumentsGoneFromServer = function(tx) {
    var _this = this;

    return this.offlineDocumentsNotInServerCollection(tx).then(function(docIds) {
      var docId, writes, _i, _len;

      writes = [];
      for (_i = 0, _len = docIds.length; _i < _len; _i++) {
        docId = docIds[_i];
        writes.push(_this.deleteDocUnlessWrittenByStub(tx, docId));
      }
      return Result.join(writes);
    });
  };

  CollectionAgent.prototype.addDocumentUpdate = function(tx, docId, doc) {
    return database.addUpdate(tx, {
      update: 'documentUpdated',
      connectionName: this.connectionName,
      collectionName: this.collectionName,
      docId: docId,
      doc: doc
    });
  };

  CollectionAgent.prototype.updateDocIfFree = function(tx, docId, doc) {
    var _this = this;

    return database.isDocumentWrittenByAnyStub(tx, this.connectionName, this.collectionName, docId).then(function(wasWritten) {
      if (wasWritten) {
        return;
      }
      return (doc != null ? database.writeDoc(tx, _this.connectionName, _this.collectionName, doc) : database.deleteDoc(tx, _this.connectionname, _this.collectionName, docId)).then(function() {
        return _this.addDocumentUpdate(tx, docId, doc);
      });
    });
  };

  CollectionAgent.prototype.updateDocFromServerIfFree = function(tx, docId) {
    return this.updateDocIfFree(tx, docId, this.serverCollection.findOne(docId));
  };

  CollectionAgent.prototype.serverDocUpdated = function(docId, doc) {
    var _this = this;

    asAgentWindow(function(tx) {
      return _this.updateDocIfFree(tx, docId, doc);
    }).then(function() {
      return broadcastUpdate();
    });
  };

  CollectionAgent.prototype.watchServer = function() {
    var _this = this;

    this.serverCollection.find().observe({
      added: function(doc) {
        return _this.serverDocUpdated(doc._id, doc);
      },
      changed: function(doc) {
        return _this.serverDocUpdated(doc._id, doc);
      },
      removed: function(doc) {
        return _this.serverDocUpdated(doc._id, null);
      }
    });
  };

  return CollectionAgent;

})();

updateSubscriptions = function() {
  updateSubscriptionsReady();
  return subscriptionsUpdated();
};

subscriptionsUpdated = function() {
  asAgentWindow(function(tx) {
    return database.readMergedSubscriptions(tx);
  }).then(function(subscriptions) {
    return subscribeToNewSubscriptions(subscriptions);
  });
};

addMessageHandler('subscriptionsUpdated', function() {
  updateSubscriptions();
});

nowAgent.listen(function() {
  updateSubscriptions();
  sendQueuedMethods();
});

addMessageHandler('newQueuedMethod', function() {
  sendQueuedMethods();
});

if (this.Agent == null) {
  broadcast.listen('deadWindows', function() {
    subscriptionsUpdated();
  });
}

}).call(this);

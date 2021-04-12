import _ from 'lodash'

export const compare = function (a, b) {

  var result = {
    different: [],
    missing_from_first: [],
    missing_from_second: []
  };

  _.reduce(a, function (result, value, key) {
    if (b.hasOwnProperty(key)) {
      if (_.isEqual(value, b[key])) {
        return result;
      } else {
        if (typeof (a[key]) != typeof ({}) || typeof (b[key]) != typeof ({})) {
          //dead end.
          result.different.push(key);
          return result;
        } else {
          var deeper = compare(a[key], b[key]);
          result.different = result.different.concat(_.map(deeper.different, (sub_path) => {
            return key + "." + sub_path;
          }));

          result.missing_from_second = result.missing_from_second.concat(_.map(deeper.missing_from_second, (sub_path) => {
            return key + "." + sub_path;
          }));

          result.missing_from_first = result.missing_from_first.concat(_.map(deeper.missing_from_first, (sub_path) => {
            return key + "." + sub_path;
          }));
          return result;
        }
      }
    } else {
      result.missing_from_second.push(key);
      return result;
    }
  }, result);

  _.reduce(b, function (result, value, key) {
    if (a.hasOwnProperty(key)) {
      return result;
    } else {
      result.missing_from_first.push(key);
      return result;
    }
  }, result);

  return result;
}

export default compare
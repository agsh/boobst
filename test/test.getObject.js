// Generated by CoffeeScript 1.6.3
/*
* @author Andrew D.Laptev <a.d.laptev@gmail.com>
*/


/*global describe, beforeEach, afterEach, it*/


(function() {
  var BoobstSocket, GLOBAL, assert, boobst;

  assert = require('assert');

  boobst = require('../boobst');

  BoobstSocket = boobst.BoobstSocket;

  GLOBAL = '^testObject';

  describe('getObject', function() {
    var bs;
    this.timeout(1000);
    bs = new BoobstSocket(require('./test.config'));
    beforeEach(function(done) {
      return bs.connect(function(err) {
        if (err) {
          throw err;
        }
        return done();
      });
    });
    afterEach(function(done) {
      return bs.kill(GLOBAL, function(err) {
        return bs.disconnect(function() {
          return done();
        });
      });
    });
    return describe('#getObject', function() {
      var object, subscript;
      object = {
        "array": ["a", "ab", "abc"],
        "object": {
          "a": "a",
          "b": 2
        },
        "boolean": true,
        "number": 42
      };
      subscript = ['a', 'b'];
      it('should return saved object', function(done) {
        return bs.set(GLOBAL, [], object, function(err) {
          assert.equal(err, null);
          return bs.get(GLOBAL, [], function(err, data) {
            assert.equal(err, null);
            assert.deepEqual(JSON.parse(data), object);
            return done();
          });
        });
      });
      return it('should return saved object with subscripts', function(done) {
        return bs.set(GLOBAL, subscript, object, function(err) {
          assert.equal(err, null);
          return bs.get(GLOBAL, subscript, function(err, data) {
            assert.equal(err, null);
            assert.deepEqual(JSON.parse(data), object);
            return done();
          });
        });
      });
    });
  });

}).call(this);

/*
//@ sourceMappingURL=test.getObject.map
*/
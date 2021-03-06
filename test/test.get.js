// Generated by CoffeeScript 1.7.1

/*
* @author Andrew D.Laptev <a.d.laptev@gmail.com>
 */


/*global describe, beforeEach, afterEach, it */

(function() {
  'use strict';
  var BoobstSocket, GLOBAL, assert, boobst;

  assert = require('assert');

  boobst = require('../boobst');

  BoobstSocket = boobst.BoobstSocket;

  GLOBAL = '^testObject';

  describe('get', function() {
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
        if (err) {
          throw err;
        }
        return bs.disconnect(function() {
          return done();
        });
      });
    });
    return describe('#get', function() {
      var fulfill, nodeData, object, subscript;
      object = {
        "array": ["a", "ab", "a\"bc"],
        "object": {
          "a": "a",
          "b": 2
        },
        "boolean": true,
        "number": 42,
        "quotes": 'some"thing'
      };
      subscript = ['a', 'b'];
      nodeData = 'node data';
      fulfill = function(nd, callback, sub) {
        return bs.set(GLOBAL, sub || [], object, function(err) {
          assert.equal(err, null);
          if (nd) {
            return bs.set(GLOBAL, sub || [], nodeData, function(err) {
              assert.equal(err, null);
              return callback();
            });
          } else {
            return callback();
          }
        });
      };
      it('sould return error if we don\'t have data in global', function(done) {
        return bs.get(GLOBAL, [], function(err, data) {
          assert.notEqual(err, null);
          assert.equal(data, void 0);
          return done();
        });
      });
      it('should return node data if we have $data(node)=11', function(done) {
        return fulfill(true, function() {
          return bs.get(GLOBAL, [], function(err, data) {
            assert.equal(err, null);
            assert.equal(data, nodeData);
            return fulfill(true, function() {
              return bs.get(GLOBAL, function(err, data) {
                assert.equal(err, null);
                assert.equal(data, nodeData);
                return done();
              });
            });
          });
        });
      });
      it('should return json if we have $data(node)=10', function(done) {
        return fulfill(false, function() {
          return bs.get(GLOBAL, [], function(err, data) {
            assert.equal(err, null);
            assert.deepEqual(JSON.parse(data), object);
            return fulfill(false, function() {
              return bs.get(GLOBAL, function(err, data) {
                assert.equal(err, null);
                assert.deepEqual(JSON.parse(data), object);
                return done();
              });
            });
          });
        });
      });
      it('should return json if we have forceJSON flag and $data(node)=11', function(done) {
        return fulfill(true, function() {
          return bs.get(GLOBAL, [], true, function(err, data) {
            assert.equal(err, null);
            assert.deepEqual(JSON.parse(data), object);
            return fulfill(true, function() {
              return bs.get(GLOBAL, [], true, function(err, data) {
                assert.equal(err, null);
                assert.deepEqual(JSON.parse(data), object);
                return done();
              });
            });
          });
        });
      });
      it('(with subscripts) should return node data if we have $data(node)=11', function(done) {
        return fulfill(true, function() {
          return bs.get(GLOBAL, subscript, function(err, data) {
            assert.equal(err, null);
            assert.equal(data, nodeData);
            return done();
          });
        }, subscript);
      });
      it('(with subscripts) should return json if we have $data(node)=10', function(done) {
        return fulfill(false, function() {
          return bs.get(GLOBAL, subscript, function(err, data) {
            assert.equal(err, null);
            assert.deepEqual(JSON.parse(data), object);
            return done();
          });
        }, subscript);
      });
      return it('(with subscripts) should return json if we have forceJSON flag and $data(node)=11', function(done) {
        return fulfill(true, function() {
          return bs.get(GLOBAL, subscript, true, function(err, data) {
            assert.equal(err, null);
            assert.deepEqual(JSON.parse(data), object);
            return done();
          });
        }, subscript);
      });
    });
  });

}).call(this);

//# sourceMappingURL=test.get.map

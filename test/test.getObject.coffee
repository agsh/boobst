###
* @author Andrew D.Laptev <a.d.laptev@gmail.com>
###

###global describe, beforeEach, afterEach, it###

assert = require 'assert'
boobst = require '../boobst'
BoobstSocket = boobst.BoobstSocket

GLOBAL = '^testObject';

describe 'getObject', () ->
  this.timeout 1000
  bs = new BoobstSocket(require './test.config')

  #bs.on('debug', console.log); # uncomment for debug messages

  beforeEach (done) ->
    bs.connect (err) ->
      throw err if err
      done()

  afterEach (done) ->
    bs.kill GLOBAL, (err) ->
      bs.disconnect () ->
        done()

  describe '#getObject', () ->
    object = {
      "array": ["a", "ab", "abc"]
      "object":
        "a": "a"
        "b": 2
      "boolean": true
      "number": 42
    }
    subscript = ['a', 'b']

    it 'should return saved object', (done) ->
      bs.set GLOBAL, [], object, (err) ->
        assert.equal err, null
        bs.get GLOBAL, [], (err, data) ->
          assert.equal err, null
          assert.deepEqual JSON.parse(data), object
          done()

    it 'should return saved object with subscripts', (done) ->
      bs.set GLOBAL, subscript, object, (err) ->
        assert.equal err, null
        bs.get GLOBAL, subscript, (err, data) ->
          assert.equal err, null
          assert.deepEqual JSON.parse(data), object
          done()
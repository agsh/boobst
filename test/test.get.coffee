###
* @author Andrew D.Laptev <a.d.laptev@gmail.com>
###

###global describe, beforeEach, afterEach, it###

'use strict'

assert = require 'assert'
boobst = require '../boobst'
BoobstSocket = boobst.BoobstSocket

GLOBAL = '^testObject';

describe 'get', () ->
  this.timeout 1000
  bs = new BoobstSocket(require './test.config')

  # bs.on('debug', console.log); # uncomment for debug messages

  beforeEach (done) ->
    bs.connect (err) ->
      throw err if err
      bs.kill GLOBAL, (err) ->
        throw err if err
        done()

  afterEach (done) ->
    bs.kill GLOBAL, (err) ->
      throw err if err
      bs.disconnect () ->
        done()

  describe '#get', () ->
    object = {
      "array": ["a", "ab", "a\"bc"]
      "object":
        "a": "a"
        "b": 2
      "boolean": true
      "number": 42
      "quotes": 'some"thing'
    }
    subscript = ['a', 'b']
    nodeData = 'node data'

    fulfill = (nd, callback, sub) ->
      bs.set GLOBAL, sub or [], object, (err) ->
        assert.equal err, null
        if nd
          bs.set GLOBAL, sub or [], nodeData, (err) ->
            assert.equal err, null
            callback()
        else
          callback()

    it 'sould return error if we don\'t have data in global', (done) ->
      bs.get GLOBAL, [], (err, data) ->
        assert.notEqual err, null
        assert.equal data, undefined
        done()

    it 'should return node data if we have $data(node)=11', (done) ->
      fulfill true, () ->
        bs.get GLOBAL, [], (err, data) ->
          assert.equal err, null
          assert.equal data, nodeData
          fulfill true, () ->
            bs.get GLOBAL, (err, data) ->
              assert.equal err, null
              assert.equal data, nodeData
              done()

    it 'should return json if we have $data(node)=10', (done) ->
      fulfill false, () ->
        bs.get GLOBAL, [], (err, data) ->
          assert.equal err, null
          assert.deepEqual JSON.parse(data), object
          fulfill false, () ->
            bs.get GLOBAL, (err, data) ->
              assert.equal err, null
              assert.deepEqual JSON.parse(data), object
              done()

    it 'should return json if we have forceJSON flag and $data(node)=11', (done) ->
      fulfill true, () ->
        bs.get GLOBAL, [], true, (err, data) ->
          assert.equal err, null
          assert.deepEqual JSON.parse(data), object
          fulfill true, () ->
            bs.get GLOBAL, [], true, (err, data) ->
              assert.equal err, null
              assert.deepEqual JSON.parse(data), object
              done()


    it '(with subscripts) should return node data if we have $data(node)=11', (done) ->
      fulfill true, () ->
        bs.get GLOBAL, subscript, (err, data) ->
          assert.equal err, null
          assert.equal data, nodeData
          done()
      , subscript

    it '(with subscripts) should return json if we have $data(node)=10', (done) ->
      fulfill false, () ->
        bs.get GLOBAL, subscript, (err, data) ->
          assert.equal err, null
          assert.deepEqual JSON.parse(data), object
          done()
      , subscript

    it '(with subscripts) should return json if we have forceJSON flag and $data(node)=11', (done) ->
      fulfill true, () ->
        bs.get GLOBAL, subscript, true, (err, data) ->
          assert.equal err, null
          assert.deepEqual JSON.parse(data), object
          done()
      , subscript
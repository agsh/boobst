###
* @author Andrew D.Laptev <a.d.laptev@gmail.com>
###

###global describe, beforeEach, afterEach, it###

assert = require 'assert'
boobst = require '../boobst'
BoobstSocket = boobst.BoobstSocket

GLOBAL = '^test1';

describe 'order', () ->
  this.timeout 15000
  bs = new BoobstSocket(require './test.config')

  # bs.on('debug', console.log); # uncomment for debug messages

  beforeEach (done) ->
    bs.connect (err) ->
      if err
        throw err
      this.set GLOBAL, [1, 'city'], 'Moscow'
      this.set GLOBAL, [2, 'city'], 'London'
      this.set GLOBAL, [3, 'city'], 'Paris'
      this.set GLOBAL, [4, 'city'], 'Detroit'
      this.set GLOBAL, [5, 'city'], 'Ottawa', () ->
        done()

  afterEach (done) ->
    bs.kill GLOBAL, () ->
      bs.disconnect () ->
        done()

  describe '#order test an empty string', () ->
    it 'should return first key', (done) ->
      bs.order GLOBAL, [''], (err, data) ->
        assert.equal err, null
        assert.equal data, '1'
        done()

  describe '#next method should work as order', () ->
    it 'should return first key', (done) ->
      bs.next GLOBAL, [''], (err, data) ->
        assert.equal err, null
        assert.equal data, '1'
        done()

  describe '#order test a first key', () ->
    it 'should return second key', (done) ->
      bs.order GLOBAL, ['1'], (err, data) ->
        assert.equal err, null
        assert.equal data, '2'
        done()

  describe '#order test last key', () ->
    it 'should return empty string', (done) ->
      bs.order GLOBAL, ['5'], (err, data) ->
        assert.equal err, null
        assert.equal data, ''
        done()
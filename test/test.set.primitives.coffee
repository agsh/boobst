assert = require 'assert'
boobst = require '../boobst'
BoobstSocket = boobst.BoobstSocket

GLOBAL = '^testObject';

describe 'set.primitives', () ->
  this.timeout 1000
  bs = new BoobstSocket(require './test.config')

  # bs.on('debug', console.log); # uncomment for debug messages

  beforeEach (done) ->
    bs.connect (err) ->
      throw err if err
      done()

  afterEach (done) ->
    bs.kill GLOBAL, (err) ->
      throw err if err
      bs.disconnect () ->
        done()

  describe '#set number', () ->
    it 'should save numbers', (done) ->
      value = 5;
      bs.set GLOBAL, value
        .get GLOBAL, (err, data) ->
          assert.equal err, null
          assert.equal value, data
          done()

  describe '#set date', () ->
    it 'should save dates', (done) ->
      value = new Date()
      bs.set GLOBAL, value
        .get GLOBAL, (err, data) ->
          assert.equal err, null
          assert.equal value.toString(), new Date(data).toString()
          done()

  describe '#set string', () ->
    it 'should save strings', (done) ->
      value = 'string'
      bs.set GLOBAL, value
        .get GLOBAL, (err, data) ->
          assert.equal err, null
          assert.equal value, data
          done()

  describe '#set boolean', () ->
    it 'should save true value', (done) ->
      bs.set GLOBAL, true
        .get GLOBAL, (err, data) ->
          assert.equal err, null
          assert.equal data, '1true'
          done()
    it 'should save false value', (done) ->
      bs.set GLOBAL, false
      .get GLOBAL, (err, data) ->
        assert.equal err, null
        assert.equal data, '0false'
        done()

  describe '#set array', () ->
    it 'should save array as an object', (done) ->
      value = [1, 2, 3]
      bs.set GLOBAL, value
      .get GLOBAL, (err, data) ->
        #console.log(data.toString())
        assert.equal err, null
        assert.deepEqual JSON.parse(data.toString()), value
        done()

  describe '#set object', () ->
    it 'should save all nested values properly', (done) ->
      value = {
        number: 42
        boolean: true
        string: 'string'
        nested: {
          a: 1
          b: 'a'
          c: true
        }
        array: [1, 2, 3, { a: 1, b: '2' }]
      }
      bs.set GLOBAL, value
        .get GLOBAL, (err, data) ->
          #console.log(data.toString())
          assert.equal err, null
          assert.deepEqual JSON.parse(data.toString()), value
          done()


  ###
  describe '#set', () ->
    it 'shouldn\'t save function', (done) ->
      value = () ->
      bs.set GLOBAL, value
        .get GLOBAL, (err, data) ->
          assert.equal err, null
          assert.equal undefined, data
          done()

  ###
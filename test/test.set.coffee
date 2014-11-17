'use strict'

assert = require 'assert'
boobst = require '../boobst'
BoobstSocket = boobst.BoobstSocket

GLOBAL = '^testObject';

describe 'set data', () ->
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

  describe 'set primitives', () ->

    it 'should save numbers', (done) ->
      value = 5;
      bs.set GLOBAL, value
        .get GLOBAL, (err, data) ->
          assert.equal err, null
          assert.equal value, data
          done()

    it 'should save dates', (done) ->
      value = new Date()
      bs.set GLOBAL, value
        .get GLOBAL, (err, data) ->
          assert.equal err, null
          assert.equal value.toString(), new Date(data).toString()
          done()

    it 'should save strings', (done) ->
      value = 'string'
      bs.set GLOBAL, value
        .get GLOBAL, (err, data) ->
          assert.equal err, null
          assert.equal value, data
          done()

    it 'should save true boolean value', (done) ->
      bs.set GLOBAL, true
        .get GLOBAL, (err, data) ->
          assert.equal err, null
          assert.equal data, '1true'
          done()

    it 'should save false boolean value', (done) ->
      bs.set GLOBAL, false
      .get GLOBAL, (err, data) ->
        assert.equal err, null
        assert.equal data, '0false'
        done()

    it 'souldn\'t save null', (done) ->
      bs.set GLOBAL, null
        .get GLOBAL, (err, data) ->
          assert.notEqual err, null
          done()

    it 'souldn\'t save undefined', (done) ->
      bs.set GLOBAL, undefined
      .get GLOBAL, (err) ->
        assert.notEqual err, null
        done()

  describe 'set complex structures', () ->
    it 'should save array as an object', (done) ->
      value = [1, 2, 3]
      bs.set GLOBAL, value
      .get GLOBAL, (err, data) ->
        #console.log(data.toString())
        assert.equal err, null
        assert.deepEqual JSON.parse(data.toString()), value
        done()

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

  describe 'inline/callback set-get chaining', () ->
    it 'should set a global without subscripts inline and then get it', (done) ->
      value = 'VALUE'
      bs.set GLOBAL, value
        .get GLOBAL, (err, data) ->
          assert.equal err, null
          assert.equal value, data
          done();

    it 'should set a global without subscripts with a callback and then get it', (done) ->
      value = 'VALUE'
      bs.set GLOBAL, value, (err) ->
        assert.equal err, null
        bs.get GLOBAL, (err, data) ->
          assert.equal err, null
          assert.equal value, data
          done()

    it 'should set a global with subscripts inline and then get it', (done) ->
      value = 'VALUE'
      bs.set GLOBAL, ['a', 1], value
        .get GLOBAL, ['a', 1], (err, data) ->
          assert.equal err, null
          assert.equal value, data
          done()

    it 'should set a global with subscripts with a callback and then get it', (done) ->
      value = 'VALUE';
      bs.set GLOBAL, ['a', 1], value, (err) ->
        assert.equal err, null
        bs.get GLOBAL, ['a', 1], (err, data) ->
          assert.equal err, null
          assert.equal value, data
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
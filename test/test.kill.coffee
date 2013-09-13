###
* @author Andrew D.Laptev <a.d.laptev@gmail.com>
###

###global describe, beforeEach, afterEach, it###

assert = require 'assert'
boobst = require '../boobst'
BoobstSocket = boobst.BoobstSocket

GLOBAL = '^testKILL';

describe 'kill', () ->
  bs = new BoobstSocket(require './test.config')

  #bs.on('debug', console.log); # uncomment for debug messages

  beforeEach (done) ->
    bs.connect (err) ->
      throw err if err
      done()

  afterEach (done) ->
    bs.disconnect () ->
      done()

  describe '#get-set-get-kill-get', () ->
    value = 'hello'
    it 'should properly switch between namespaces', (done) ->
      bs.get GLOBAL, (err, data) ->
        assert.notEqual err, null
        bs.set GLOBAL, value, (err) ->
          assert.equal err, null
          bs.get GLOBAL, (err, data) ->
            assert.equal err, null
            assert.equal data, value
            bs.kill GLOBAL, (err) ->
              assert.equal err, null
              bs.get GLOBAL, (err) ->
                assert.notEqual err, null
                done()
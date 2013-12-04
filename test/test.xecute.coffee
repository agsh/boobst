###
* @author Andrew D.Laptev <a.d.laptev@gmail.com>
###

###global describe, beforeEach, afterEach, it###

assert = require 'assert'
boobst = require '../boobst'
BoobstSocket = boobst.BoobstSocket

describe 'xecute', () ->
  this.timeout 15000
  bs = new BoobstSocket(require './test.config')

  #bs.on('debug', console.log); # uncomment for debug messages

  beforeEach (done) ->
    bs.connect (err) ->
      throw err if err
      done()

  afterEach (done) ->
    bs.disconnect () ->
      done()

  describe '#run hello world', () ->
    it 'should properly gave us hello or disallowed', (done) ->
      bs.xecute 'write "hello"', (err, data) ->
        assert.equal err, null
        assert.ok (data == 'hello' || data == 'disallowed')
        done()
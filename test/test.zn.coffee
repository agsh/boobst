###
* @author Andrew D.Laptev <a.d.laptev@gmail.com>
###

###global describe, beforeEach, afterEach, it###

assert = require 'assert'
boobst = require '../boobst'
BoobstSocket = boobst.BoobstSocket

NAMESPACES = ['%SYS', 'USER']
GLOBAL = '^testZN';

describe 'zn', () ->
  bs = new BoobstSocket(require './test.config')

  #bs.on('debug', console.log); # uncomment for debug messages

  beforeEach (done) ->
    bs.connect (err) ->
      throw err if err
      done()

  afterEach (done) ->
    bs.disconnect () ->
      done()

  describe '#zn test simple switching', () ->
    it 'should properly switch between namespaces', (done) ->
      counter = 0
      NAMESPACES.forEach (ns) ->
        counter += 1
        bs.zn ns, (err, success) ->
          assert.equal err, null
          assert.equal success, true
          assert.equal ns, bs.ns
          counter -= 1
          done() if counter == 0

  describe '#zn switching with temporary global sets', () ->
    it 'should properly switch between namespaces', (done) ->
      NAMESPACES.forEach (ns) ->
        bs.zn ns
        bs.set GLOBAL, ns
      counter = 0
      NAMESPACES.forEach (ns) ->
        counter += 1
        bs.zn ns, (err,success) ->
          assert.equal err, null
          assert.equal success, true
          assert.equal ns, bs.ns
          bs.get GLOBAL, (err, data) ->
            assert.equal err, null
            assert.equal data, bs.ns
            counter -= 1
            if counter == 0
              counter = 0
              NAMESPACES.forEach (ns) ->
                counter += 1
                bs.zn ns
                bs.kill GLOBAL, (err) ->
                  assert.equal err, null
                  counter -= 1
                  if counter == 0
                    done()

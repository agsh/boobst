/**
 * @author Andrew D.Laptev <a.d.laptev@gmail.com>
 */

/*global describe, beforeEach, afterEach, it */

var assert = require('assert')
	, boobst = require('../boobst')
	, BoobstSocket = boobst.BoobstSocket
	;

const GLOBAL = '^%test';

describe('set', function() {
	var bs = new BoobstSocket({
		host: '10.30.2.4'
		, ns: 'ASU'
	});
	//bs.on('debug', console.log);

	beforeEach(function(done) {
		bs.connect(function(err) {
			if (err) {
				throw err;
			}
			done();
		});
	});

	afterEach(function(done) {
		bs.kill(GLOBAL, function(){
			bs.disconnect(function() {
				done();
			});
		});
	});

	describe('#global without subscripts inline', function() {
		it('should set a local and then get it', function(done) {
			var value = 'VALUE';
			bs.set(GLOBAL, value).get(GLOBAL, function(err, data) {
				assert.equal(err, null);
				assert.equal(value, data);
				done();
			});
		});
	});

	describe('#global without subscripts callbacks', function() {
		it('should set a local and then get it', function(done) {
			var value = 'VALUE';
			bs.set(GLOBAL, value, function(err) {
				assert.equal(err, null);
				bs.get(GLOBAL, function(err, data) {
					assert.equal(err, null);
					assert.equal(value, data);
					done();
				});
			})
		});
	});

	describe('#global without subscripts inline', function() {
		it('should set a local and then get it', function(done) {
			var value = 'VALUE';
			bs.set(GLOBAL, value).get(GLOBAL, function(err, data) {
				assert.equal(err, null);
				assert.equal(value, data);
				done();
			});
		});
	});

	describe('#global without subscripts callbacks', function() {
		it('should set a local and then get it', function(done) {
			var value = 'VALUE';
			bs.set(GLOBAL, value, function(err) {
				assert.equal(err, null);
				bs.get(GLOBAL, function(err, data) {
					assert.equal(err, null);
					assert.equal(value, data);
					done();
				});
			})
		});
	});

	describe('#global without subscripts callbacks', function() {
		it('should set a local and then get it', function(done) {
			var value = 'VALUE';
			bs.set(GLOBAL, value, function(err) {
				assert.equal(err, null);
				bs.get(GLOBAL, function(err, data) {
					assert.equal(err, null);
					assert.equal(value, data);
					done();
				});
			})
		});
	});
	/*
	describe('#global set value greater than 32754 bytes', function() {
		it('should set a local and then get it', function(done) {
			var value = new Array(1261).join('abcdefghijklmnopqrstuvwxyz');
			bs.set('^%temp', value);
			bs.set(GLOBAL, value, done);
		});
	});
	*/
});
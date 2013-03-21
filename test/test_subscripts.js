/**
 * @author Andrew D.Laptev <a.d.laptev@gmail.com>
 */

var boobst = require('../boobst.js')
	, BoobstSocket = boobst.BoobstSocket
	;

var bs = new BoobstSocket({
	host: '10.30.2.4'
});

bs.connect(function(err) {
	if (err) {
		throw err;
	}
	var js = {
		f: [0, 1, 'g', 2, 3]
		, b: {
			c: 'd'
		}
	};
	bs.zn('FOREST').kill('^test').set('^test', ['a'], js, function(err, data) {
	//bs.set('^test', [0, 0, 0], js, function(err, data) {
		if (err) {
			throw err;
		}
		console.log('ok');
		bs.disconnect();
	}).set('^test', ['b','c'], js, function(err, data) {
			//bs.set('^test', [0, 0, 0], js, function(err, data) {
			if (err) {
				throw err;
			}
			console.log('ok');
			bs.disconnect();
	}).kill('^test', ['a', 'f'], function(err) {
			//bs.set('^test', [0, 0, 0], js, function(err, data) {
			if (err) {
				throw err;
			}
			console.log('ok');
			bs.disconnect();
	});
});
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
	bs.zn('FOREST');
	var js = {
		a: [1, 2, 3]
		, b: {
			c: 'd'
		}
	};
	bs.saveObject('^test', [1, 2, 3], js, function(err, data) {
	//bs.set('^test', [0, 0, 0], js, function(err, data) {
		if (err) {
			throw err;
		}
		console.log('ok');
		bs.disconnect();
	});
});
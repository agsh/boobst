/**
 * @author Andrew D.Laptev <a.d.laptev@gmail.com>
 */

var http = require('http')
	, boobst = require('../boobst.js')
	, BoobstSocket = boobst.BoobstSocket
	;

var bs = new BoobstSocket({
	host: '10.30.2.4'
	, ns: 'ASU'
});

var req = http.request({
	hostname: 'www.lib.ru'
	, port: 80
	, path: '/lat/FOUNDATION/3laws.txt'
	, method: 'GET'
}, function(res) {
	var threeLaws = '';
	res.setEncoding('utf8');
	res.on('data', function (chunk) {
		threeLaws += chunk;
	});
	res.on('end', function() {
		bs.connect(function(err) {
			if (err) {
				throw err;
			}
			bs.set('^threeLaws', [], threeLaws, function(err) {
				if (err) {
					console.log(err);
				}
				this.disconnect();
			});
		});
	})
});

req.on('error', function(e) {
	console.log('problem with request: ' + e.message);
});

req.end();
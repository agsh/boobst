/**
 * @author Andrew D.Laptev <a.d.laptev@gmail.com>
 */

var boobst = require('../boobst.js')
	, BoobstSocket = boobst.BoobstSocket
	;

var bs = new BoobstSocket({
	host: '10.30.2.4'
	, ns: '%SYS'
});

bs.connect(function(err) {
	if (err) {
		throw err;
	}
	console.log(this.ns);
	this.disconnect();
});
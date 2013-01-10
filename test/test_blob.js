/**
 * test_blob
 * User: und
 * Date: 12/14/12
 * Time: 5:08 PM
 */

var BoobstSocket = require('../boobst.js').BoobstSocket
	, fs = require('fs')
	, StringReader = require('../StringReader.js')
	;

var stream = '';
/*
for (var i = 0; i < 256; i++) {
	stream += String.fromCharCode(i)
}
*/
for (var i = 0; i < 256; i++) {
	for (var j = 0; j < 10; j++) {
		stream += j
	}
}
stream = new StringReader(stream);
//stream.pipe(process.stdout);

var bs = new BoobstSocket({
	host: '10.30.2.3'
	, port: 6666
});
/*
bs.on('debug', function(data) {
	console.log(data);
});
*/
bs.connect(function(err){
	if (err) {
		console.log(err);
		return;
	}
	console.log(bs.ns);
	bs.blob('global://itch', fs.createReadStream('/home/und/00109721.jpg'), function(err) {
		if (err) console.log(err);
		console.log('ы');
		var pic = fs.createReadStream('/home/und/00109721.jpg');
		pic.pause();
		bs.blob('file://D:\\!\\testn.jpg', pic, function(err) {
			//bs.blob('^test', fs.createReadStream('/home/und/Pictures/image.axd.jpeg'), function(err) {
			//bs.blob('lol', fs.createReadStream('/home/und/m.hs'), function(err) {
			//bs.blob('lol', stream, function(err) {
			//bs.blob('lol', fs.createReadStream('/home/und/idea.png'), function(err) {
			if (err) console.log(err);
			//bs.kill('^itch');
			console.log('ъ');
		});
	});


});


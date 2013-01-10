/**
 * StringReader
 * User: und
 * Date: 12/17/12
 * Time: 5:29 PM
 */

var util = require('util')
	, Stream = require('stream')
	, Buffer = require('buffer').Buffer
	;

/**
 * StringReader class
 * @param str
 * @constructor
 */
var StringReader = function(str) {
	this.data = str;
};

util.inherits(StringReader, Stream);

module.exports = StringReader;

StringReader.prototype.resume = function() {
	if (this.encoding && Buffer.isBuffer(this.data)) {
		this.emit('data', this.data.toString(this.encoding));
	} else {
		this.emit('data', this.data);
	}
	this.emit('end');
	this.emit('close');
};

StringReader.prototype.setEncoding = function(encoding) {
	this.encoding = encoding;
};

StringReader.prototype.pause = function() {};

StringReader.prototype.destroy = function() {
	delete this.data;
};
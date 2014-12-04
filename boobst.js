/**
 * Boobst module (boobst.js)
 * A tiny database driver for DBMS Cache'
 * @author Andrew D. Laptev <a.d.laptev@gmail.com>
 * @version 0.8.14
 * @license MIT
 **/

var net = require('net')
	, util = require('util')
	, events = require('events');

const
	EOL = ' ' + String.fromCharCode(0) // TODO избавиться от лишнего байта в s input=$e(input,1,$l(input)-1)
	, EON = String.fromCharCode(1)
	, VERSION = 8
	// , VALID_CACHE_VAR_RE = /^\^?%?[\-A-Z\.a-z]+[\w\d]*(\(("[A-Za-z_\-\.\+\\/0-9]+"|\d)(,("[A-Za-z_\-\.\+\\/0-9]+"|\d))*\))?$/
	, CACHE_MAX_SIZE = 32754,
	/**
	 * @enum {number}
	 */
    BCMD = {
		NOP: 0
		, SET: 1
		, GET: 2
		, EXECUTE: 3
		, SETENCODING: 4
		, FLUSH: 5
		, KILL: 6
		, DISCONNECT: 7
		, KEY: 8
		, PING: 9
		, ZN: 10
		, HI: 11
		, BLOB: 12
		, ORDER: 13
		, XECUTE: 14
	}
	;

/**
 * @this boobst.BoobstSocket
 * @private
 */
function onConnection() {
	// unused event handler cause on connection server first of all sends greeting BCMD.HI to client
}

/**
 * Событие сокета на ошибку
 * @private
 * @this boobst.BoobstSocket
 */
function onError(err) {
	this.emit('debug', 'error: ' + err.toString());
	if (this.callback) {

		if (this.command === BCMD.BLOB) {  // blob errors we catch here   TODO: think about properly closing MUMPS connection
			this.command = BCMD.NOP;
		}

		this.callback.call(this, err);
	}
	// self.socket = null; pass this if we don't want to connect anymore
}

/**
 * On close socket event
 * @private
 * @this BoobstSocket
 */
function onClose(transmittionErr) {
	this.connected = false;
	if (!this.killme) { // if we got connection troubles
		if (this.out) {
			this.out.end();
		}
		if (this.command === BCMD.BLOB && this.callback) { // if we disconnected under .blob command
			this.callback.call(this, null);
		}
		this.emit('debug', 'disconnected');
		if (this.data) {
			this.emit('debug', this.data.toString());
			if (this.callback) {
				this.callback.call(this, new Error(this.data));
			}
		}
		this.command = BCMD.HI;
		// trying to establish connection at growing time intervals
		if (!this._connectionTimeout) {
			this._connectionTimeout = 0;
		} else {
			this._connectionTimeout += 1000;
		}
		setTimeout(function() {
			this.connect();
		}.bind(this), this._connectionTimeout);
		//self.connect();
	} else { // if we calls .disconnect() method
		if (this.callback) {
			this.callback.call(this); // disconnection callback
		}
	}
}

/**
 * Событие сокета на получение данных
 * @private
 * @this BoobstSocket
 */
function onData(data) {
	this.emit('debug', this.command + ' : ' + data.toString());
	switch (this.command) {
		case BCMD.NOP:
			this.emit('debug', 'Data on NOP command: ' + data.toString());
			break;
		case BCMD.SETENCODING: case BCMD.KEY: case BCMD.SET: case BCMD.KILL: case BCMD.EXECUTE: case BCMD.FLUSH: case BCMD.PING: case BCMD.GET: case BCMD.ORDER: case BCMD.XECUTE:
		this.onDataCommon(data);
			break;
		case BCMD.ZN:
			this.onDataZn(data);
			break;
		case BCMD.BLOB:
			// do nothing, this error should be caught by onError event
			break;
		case BCMD.HI:
			this.killme = false;
			this.onDataGreeting(data);
			break;
		default:
			this.error('Lost data!');
			this.log(data.toString());
	}
}

/**
 * Boobst Socket
 * @param {Object} options
 * @param {number} [options.port] port
 * @param {string} [options.host] host
 * @property {Function} callback
 * @property {Function} emit
 * @extends events.EventEmitter
 * @constructor
 */
var BoobstSocket = function(options) {
	/**
	 * Server's process id
	 * @type {number}
	 */
	this.id = 0;
	options = options || {};
	/**
	 * Protocol varsion
	 * @type {number}
	 */
	this.version = VERSION;
	this.out = null;
	/**
	 * Commands queue
	 * @type {Array}
	 */
	this.queue = [];
	/**
	 * Port
	 * @type {number}
	 */
	this.port = options.port || 6666;
	/**
	 * Host
	 * @type {string}
	 */
	this.host = options.host || options.server || 'localhost';
	if (options.ns) {
		this.ns = options.ns;
	}
	this.command = BCMD.HI;
	this.connected = false;
	this.killme = false;
	/**
	 * Connection socket
	 * @type {net.Socket}
	 */
	this.socket = new net.Socket();
	this.socket.bufferSize = 32000;
	this.socket.boobst = this;
	this.socket.on('connect', onConnection.bind(this));
	this.socket.on('close', onClose.bind(this));
	this.socket.on('data', onData.bind(this));
	this.socket.on('error', onError.bind(this));
};

// events.EventEmitter inheritance
util.inherits(BoobstSocket, events.EventEmitter);

/**
 * Connect to DB
 * @param {function(this:boobst.BoobstSocket, (null|Error))} [callback] callback
 * @return {boobst.BoobstSocket}
 */
BoobstSocket.prototype.connect = function(callback) {
	try {
		this.emit('debug', 'trying to connect to ' + this.host + ':' + this.port + ' > ' + this.command);
		if (callback) {
			/**
			 *
			 * @type {(function(this:boobst.BoobstSocket, (null|Error)))}
			 */
			this.onConnectionCallback = callback;
		}
		this.socket.connect(this.port, this.host);
		delete this._connectionTimeout;
	} catch(e) {
		if (callback) {
			callback(new Error(e));
		}
	}
	return this;
};

//----------------------------------------------------------------------------------------------------------------------
/**
 * Common event handler
 * @private
 * @param {Buffer} data binary data chunk
 */
BoobstSocket.prototype.onDataCommon = function(data) {
	// check if this chunk is the last one
	// it must have \6\6 characters at the end
	if ((data.length > 1) && (data[data.length - 1] === 6) && (data[data.length - 2] === 6)) {
		if (this.out && (this.command === BCMD.EXECUTE || this.command === BCMD.XECUTE)){ // if we're writing into stream
			this.out.end(data.slice(0, data.length - 2));
			delete this.out;
			if (this.callback) { // if we have callback
				this.callback.call(this, null); // we haven't get this.data here
			}
		} else {
			this.data = Buffer.concat([this.data, data.slice(0, data.length - 2)]);
			if (this.callback) { // if we have callback
				this.callback.call(this, null, this.data);
			}
		}
		process.nextTick(function() {
			this.command = BCMD.NOP;
			this._runCommandFromQueue();
		}.bind(this));
	} else {
		if (this.out && (this.command === BCMD.EXECUTE || this.command === BCMD.XECUTE)){ // if we're writing into stream
			this.out.write(data);
		} else {
			this.data = Buffer.concat([this.data, data]);
		}
	}
};

/**
 * Connect event handler
 * @private
 * @param {Buffer} data greeting
 */
BoobstSocket.prototype.onDataGreeting = function(data) {
	this.emit('debug', 'connected');
	this.connected = true;
	var dataStr = data.toString().split(';');

	if (parseInt(dataStr[0], 10) !== this.version) {
		var err = new Error('Mismatch of protocol versions! server: ' + dataStr[0] + ', client: ' + this.version);
		if (this.onConnectionCallback) {
			this.onConnectionCallback(err);
		}
		return;
	}

	// working with properly protocol version
	this.id = parseInt(dataStr[1], 10);
	// if we're in the different namespace when connected just switch to the right one
	if (this.ns) {
		if (this.ns !== dataStr[2]) {
			this.queue.unshift({
				cmd: BCMD.ZN
				, name: this.ns
			});
		}
	} else {
		this.ns = dataStr[2];
	}

	if (this.onConnectionCallback) {
		this.onConnectionCallback.call(this);
		delete this.onConnectionCallback;
	}

	process.nextTick(function() {
		this.command = BCMD.NOP;
		this._runCommandFromQueue();
	}.bind(this));
};

/**
 * Namespace change event handler
 * @private
 * @param {buffer.Buffer} data информация о смене
 */
BoobstSocket.prototype.onDataZn = function(data) {
	var str = data.toString().split('.');

	if (str[0] === 'ok' && str[1] === 'zn') {
		this.ns = str[2].toUpperCase();
		this.emit('debug', 'IM ON ::: ' + this.ns);
		if (this.callback) {
			this.callback.call(this, null, true);
		}
	} else {
		if (this.callback) {
			this.callback.call(this, new Error(str));
		}
	}
	process.nextTick(function() {
		this.command = BCMD.NOP;
		this._runCommandFromQueue();
	}.bind(this));
};
//--------------------------------------------------------------------------
/**
 * Try to execute command
 * If socket is not empty, command pushed into queue
 * @param {Object} commandObject
 * @private
 */
BoobstSocket.prototype._tryCommand = function(commandObject) { // попытаться выполнить комманду
	if (this.command !== BCMD.NOP || this.connected === false) {
		this.queue.push(commandObject);
	} else {
		this.data = new Buffer(0);
		this.command = commandObject.cmd;
		this.callback = commandObject.callback;
		this.emit('debug', 'command: ' + commandObject.cmd +
			(commandObject.name || commandObject.uri ? ', name: ' + (commandObject.name || commandObject.uri) : '') +
			(commandObject.value ? ', value:' +commandObject.value : '')
		);
		switch (commandObject.cmd) {
			case BCMD.EXECUTE:
				if (commandObject.out) {
					this.out = commandObject.out;
				}
				this.socket.write('E ' + commandObject.name + EOL);
				break;
			case BCMD.XECUTE:
				if (commandObject.out) {
					this.out = commandObject.out;
				}
				this.socket.write('X ' + commandObject.name + EOL);
				break;
			case BCMD.GET:
				this.socket.write('G ' + commandObject.forceJSON + EON + commandObject.name + EOL);
				break;
			case BCMD.KEY:
				this.socket.write('Q ' + commandObject.name + EON + commandObject.value + EOL);
				break;
			case BCMD.SETENCODING:
				this.socket.write('8 ' + commandObject.value + EOL);
				break;
			case BCMD.SET:
				this.socket.write('S ' + commandObject.name + EON + commandObject.value + EOL);
				break;
			case BCMD.KILL:
				this.socket.write('K ' + commandObject.name + EOL);
				break;
			case BCMD.FLUSH:
				this.socket.write('F' + EOL);
				break;
			case BCMD.PING:
				this.socket.write('P' + EOL);
				break;
			case BCMD.ORDER:
				this.socket.write('O '  + commandObject.name +  EOL);
				break;
			case BCMD.BLOB:
				this.socket.write('B ' + commandObject.uri + EOL);
				commandObject.stream.on('end', function() {
					this.socket.end();
					/*
					if (this.callback) { // если у нас есть коллбек
						this.callback.call(this, null);
					}
					*/
					//this.command = BCMD.NOP;
					//this.connect();
				}.bind(this));
				commandObject.stream.pipe(this.socket);
				var version = process.versions.node.split('.').map(function(num) {
					return parseInt(num);
				});
				if (version[0] === 0 && version[1] < 9) { // fix for old Streams 1 api
					commandObject.stream.resume();
				}
				break;
			case BCMD.ZN:
				this.socket.write('Z ' + commandObject.name + EOL);
				break;
			case BCMD.DISCONNECT:
				this.killme = true; // this is state to disconnect gracefully
				this.command = BCMD.HI; // we are ready to the next greeting from server
				this.socket.end();
				break;
			default:
				this.error("unknown command");
				this.error(commandObject);
		}
	}
};

/**
 * Execute routine
 * @param {string} name имя существующей команды
 * @param {stream.Stream} [outStream] поток, в который пересылать ответ сервера
 * @param {function(this:boobst.BoobstSocket, (null|Error), Object)} callback callback
 */
BoobstSocket.prototype.execute = function(name, outStream, callback) {
	var cmd = {
		cmd: BCMD.EXECUTE,
		name: name
	};
	if (outStream) {
		if (typeof outStream === 'function') {
			cmd.callback = outStream;
		} else {
			cmd.out = outStream;
			if (callback) {
				cmd.callback = callback;
			}
		}
	}
	this._tryCommand(cmd);
	return this;
};

/**
 * Evaluates any code on the server. Dangerous thing disabled on server by default
 * @param {string} eval text to xecute
 * @param {stream.Stream} [outStream] stream to send data
 * @param {function(this:boobst.BoobstSocket, (null|Error), Object)} callback callback
 */
BoobstSocket.prototype.xecute = function(eval, outStream, callback) {
	var cmd = {
		cmd: BCMD.XECUTE,
		name: eval
	};
	if (outStream) {
		if (typeof outStream === 'function') {
			cmd.callback = outStream;
		} else {
			cmd.out = outStream;
			if (callback) {
				cmd.callback = callback;
			}
		}
	}
	this._tryCommand(cmd);
	return this;
};

/**
 * Get value
 * @param {string} name Name of variable or global node
 * @param {(Array<string>|boolean|function(this:boobst.BoobstSocket, (null|Error), Object))} [subscript]
 * @param {boolean|function(this:boobst.BoobstSocket, (null|Error), Object)} [forceJSON] force get JSON from node
 * @param {function(this:boobst.BoobstSocket, (null|Error), Buffer)} callback Callback-function (error, data)
 */
BoobstSocket.prototype.get = function(name, subscript, forceJSON, callback) {
	if (callback === undefined) {
		if (forceJSON !== undefined) {
			callback = forceJSON;
			if (typeof subscript === 'boolean') {
				forceJSON = subscript;
			} else {
				name = createNameFromSubscript(name, subscript);
				forceJSON = false;
			}
		} else {
			callback = subscript;
			forceJSON = false;
		}
	} else {
		name = createNameFromSubscript(name, subscript);
	}
	this._tryCommand({
		cmd: BCMD.GET,
		name: name,
		forceJSON: forceJSON ? 'f' : '',
		callback: callback
	});
	return this;
};
BoobstSocket.prototype.key = function(name, value, callback) {
	isValidCacheVar(name);
	this._tryCommand({
		cmd: BCMD.KEY,
		name: name,
		value: value,
		callback: callback
	});
	return this;
};
BoobstSocket.prototype.setEncoding = function(value, callback) {
	this._tryCommand({
		cmd: BCMD.SETENCODING,
		value: value,
		callback: callback
	});
	return this;
};

/**
 * Set the value of variable or global
 * @param {string} name variable or global name (global name starts with `^`)
 * @param {string|Buffer|Array<string>} [subscripts]
 * @param {string|Buffer|function} value variable value
 * @param {?function(this:boobst.BoobstSocket, (null|Error), string)} [callback] callback
 * @return {boobst.BoobstSocket|BoobstSocket}
 */
BoobstSocket.prototype.set = function(name, subscripts, value, callback) {
	/** let this part will be filtered by server-side
	if (~name.indexOf('"')) {
		throw new Error("You couldn't use '\"' in variable names: " + name);
	}
	*/
	// polymorphism
	var completed
		, self = this
		, typeOfValue = typeof value
		;
	if (typeOfValue === 'function' || typeOfValue === 'undefined') { // missing subscripts attribute
		callback = value;
		value = subscripts;
		subscripts = [];
		typeOfValue = typeof value;
	}

	// casting
	if (typeOfValue === 'undefined' || value === null) {
		return this;
	} else if (typeOfValue === 'number') { // number casts to string
		value = value.toString();
		typeOfValue = 'string';
	} else if (typeOfValue === 'boolean') {
		value = value ? '1true' : '0false';
		typeOfValue = 'string';
	} else if (value instanceof Date) { // date casts to string
		value = value.toJSON();
		typeOfValue = 'string';
	}

	if (typeOfValue === 'string' || Buffer.isBuffer(value)) {
		if (typeOfValue === 'string' && Buffer.byteLength(value) > CACHE_MAX_SIZE || value.length > CACHE_MAX_SIZE) {
			value = new Buffer(value);
			callback = callback || function() {};
			completed = 0;
			for (var length = value.length, i = 0, begin = 0; begin < length; i += 1, begin += CACHE_MAX_SIZE) {
				completed += 1;
				this.set(name, i ? subscripts.concat(i) : subscripts, value.slice(begin, begin + CACHE_MAX_SIZE), function(err) {
					if (err) {
						callback(err);
						callback = function() {};
					} else {
						completed -= 1;
						if (completed === 0) {
							callback.call(this, null);
						}
					}
				});
			}
			return this;
		} else {
			name = createNameFromSubscript(name, subscripts);
			isValidCacheVar(name);
			this._tryCommand({
				cmd: BCMD.SET,
				name: name,
				value: value,
				callback: callback
			});
			return this;
		}
	} else if (typeOfValue === 'function') {
		// do nothing TODO function stringify option
		return this;
	} else if (typeOfValue === 'object') { // object or array
		completed = Object.keys(value).length;
		Object.keys(value).forEach(function(key) {
			self.set(name, subscripts.concat(key), value[key], function(err) {
				if (err && callback) {
					callback(err);
					callback = function() {};
				}
				completed -= 1;
				if (completed === 0 && callback) {
					callback.call(this, null);
				}
			});
		});
		return this;
	} else {
		var err = new Error('Method `set` can accept only `string`, `object`, `Buffer`, `number`, `Date` value types. And ignores `function`. Not: ' + value);
		if (callback) {
			callback(err);
		} else {
			throw err;
		}
		return this;
	}
};


/**
 * Save javascript-оbject in Cache'
 * @param {string} variable or global name (global name starts with `^`)
 * @param {Array.<string>} [subscripts]
 * @param {Object} object javascript-object
 * @param {function(?Error)} [callback] callback
 * @deprecated
 */
BoobstSocket.prototype.saveObject = BoobstSocket.prototype.set;

/**
 * Returns next subscript based on current
 * @param name
 * @param subscript
 * @param {Function} callback
 */
BoobstSocket.prototype.order = BoobstSocket.prototype.next = function(name, subscript, callback) {
	name = createNameFromSubscript(name, subscript);
	this._tryCommand({
		cmd: BCMD.ORDER,
		name: name,
		callback: callback
	});
	return this;
};

/**
 * Changes namespace
 * @param {string} name existing namespace
 * @param {function} [callback] callback
 */
BoobstSocket.prototype.zn = function(name, callback) {
	this._tryCommand({
		cmd: BCMD.ZN,
		name: name,
		callback: callback
	});
	/*
	if (name.toUpperCase() !== this.ns) {
		this._tryCommand({
			cmd: BCMD.ZN,
			name: name,
			callback: callback
		});
	} else {
		if (callback) {
			callback.call(this, null, false);
		}
	}
	*/
	return this;
};

/**
 * Kill a global or a local
 * @param {string} name
 * @param {Array<string> | function(this:boobst.BoobstSocket, (null|Error))} [subscripts]
 * @param {function(this:boobst.BoobstSocket, (null|Error))} [callback] callback
 */
BoobstSocket.prototype.kill = function(name, subscripts, callback) {
	if (typeof callback === 'undefined') {
		isValidCacheVar(name);
		callback = (typeof subscripts === 'function' ? subscripts : null);
	} else {
		name = createNameFromSubscript(name, subscripts);
	}
	this._tryCommand({
		cmd: BCMD.KILL,
		name: name,
		callback: callback
	});
	return this;
};

/**
 * Send binary data
 * @param {string} uri uri format is: file://<file_path> or global://<global_name_w/o_^>
 * @param {Stream} stream data stream
 * @param {function(this:boobst.BoobstSocket, (null|Error))} [callback] callback
 */
BoobstSocket.prototype.blob = function(uri, stream, callback) {
	var arr = uri.split('://');
	if (arr.length !== 2) {
		throw new Error('Invalid uri for blob command: "' + uri + '"');
	}
	if (arr[0] === 'global') {
		isValidCacheVar(arr[1]);
	}
	this._tryCommand({
		cmd: BCMD.BLOB
		, stream: stream
		, uri: uri
		, callback: callback
	});
	return this;
};

/**
 * Clear the local namespace and set the server variables again
 * @param {function(this:boobst.BoobstSocket, (null|Error))} [callback] callback
 */
BoobstSocket.prototype.flush = function(callback) {
	this._tryCommand({cmd: BCMD.FLUSH, callback: callback});
	return this;
};

/**
 * Check server state
 * @param {function(this:boobst.BoobstSocket, (null|Error), {string})} [callback] callback
 */
BoobstSocket.prototype.ping = function(callback) {
	this._tryCommand({cmd: BCMD.PING, callback: callback});
	return this;
};

/**
 * Disconnect from the db
 * @param {function(this:boobst.BoobstSocket, (null|Error))} [callback] callback
 */
BoobstSocket.prototype.disconnect = function(callback) {
	this._tryCommand({cmd: BCMD.DISCONNECT, callback: callback});
	return this;
};

/**
 * Start next command from the queue
 * @private
 */
BoobstSocket.prototype._runCommandFromQueue = function() {
	if (this.queue.length > 0) {
		var task = this.queue.shift();
		this._tryCommand(task);
	}
};

//--------------------------------------------------------------------------
function isValidCacheVar(name) {
	/* TODO fix it
	if (!VALID_CACHE_VAR_RE.test(name)) {
		throw new Error('"' + name + "\" isn't a valid Cache' variable name");
	}
	*/
}

function createNameFromSubscript(name, subscript) {
	if (subscript.length > 0) {
		return name + '(' + subscript.map(function(sub) {return '"' + sub + '"';}).join(',') + ')';
	} else {
		return name;
	}
}

BoobstSocket.prototype.error = function(text) {
	this.emit('debug', text);
};
BoobstSocket.prototype.log = function(text) {
	this.emit('debug', text);
};
//--------------------------------------------------------------------------
BoobstSocket.prototype.port = 6666;

exports.BoobstSocket = BoobstSocket;
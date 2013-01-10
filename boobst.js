/**
 * Boobst module (boobst.js)
 * Маленький клиент для работы с СУБД Cache'
 * Для отладки используйте метод .emit('debug')
 * @author Andrew D. Laptev <a.d.laptev@gmail.com>
 * @version 0.7
 **/

/*global console, exports, process, require */

var net = require('net')
	, util = require('util')
	, events = require('events');

const
	EOL = ' ' + String.fromCharCode(0) // TODO избавиться от лишнего байта в s input=$e(input,1,$l(input)-1)
	, EON = String.fromCharCode(1)
	, VERSION = 7
	, BCMD = {
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
	}
	;

/**
 * @this boobst.BoobstSocket
 * @private
 */
function onConnection() {
	// в новых версиях протокола при коннекте сервер отдаёт приветствие
	// так что callback'и теперь вызываются при обработке команды BCMD.HI
}

/**
 * Событие сокета на ошибку
 * @private
 * @this boobst.BoobstSocket
 */
function onError(err) {
	this.emit('debug', 'error: ' + err.toString());
	if (this.callback) {
		this.callback(err);
	}
	// self.socket = null; вернуть, если нужно больше не подключаться
}

/**
 * Событие сокета на закрытие соединения
 * @private
 * @this BoobstSocket
 */
function onClose() {
	if (!this.killme) { // если мы не вызывали функцию disconnect
		if (this.out) {
			this.out.end();
		}
		this.emit('debug', 'disconnected');
		if (this.data) {
			this.emit('debug', this.data.toString());
			if (this.callback) {
				this.callback(new Error(this.data));
			}
		}
		this.command = BCMD.HI;
		// восстанавливаем соединение по увеличивающимся таймаутам
		if (!this.connectionTimeout) {
			this.connectionTimeout = 0;
		} else {
			this.connectionTimeout += 1000;
		}

		setTimeout(function(){
			this.connect();
		}.bind(this), this.connectionTimeout);
		//self.connect();
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
		case BCMD.SETENCODING: case BCMD.KEY: case BCMD.SET: case BCMD.KILL: case BCMD.EXECUTE: case BCMD.FLUSH: case BCMD.PING: case BCMD.GET:
			this.onDataCommon(data);
			break;
		case BCMD.ZN:
			this.onDataZn(data);
			break;
		case BCMD.HI:
			this.onDataGreeting(data);
			break;
		default:
			this.error('Lost data!');
			this.log(data.toString());
	}
}

/**
 * Класс Boobst Socket
 * @param options
 * @param {number} [options.port] порт
 * @param {string} [options.host] хост
 * @property {Function} callback
 * @property {Function} emit
 * @extends events.EventEmitter
 * @constructor
 */
var BoobstSocket = function(options) {
	/**
	 * Идентификатор процесса на сервере
	 * @type {number}
	 */
	this.id = 0;
	options = options || {};
	/**
	 * Версия протокола
	 * @type {number}
	 */
	this.version = VERSION;
	this.out = null;
	/**
	 * Очередь событий
	 * @type {Array}
	 */
	this.queue = [];
	/**
	 * Порт
	 * @type {number}
	 */
	this.port = options.port || 6666;
	/**
	 * Хост
	 * @type {string}
	 */
	this.host = options.host || options.server || 'localhost';
	this.command = BCMD.HI;
	/**
	 * Сокет соединения
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

// наследуемся от events.EventEmitter
util.inherits(BoobstSocket, events.EventEmitter);

/**
 * Соединиться с БД
 * @param {function(this:boobst.BoobstSocket, (null|Error))} [callback] callback
 * @return {boobst.BoobstSocket}
 */
BoobstSocket.prototype.connect = function(callback) {
	try {
		this.emit('debug', 'trying to connect to ' + this.host + ':' + this.port + ' > ' + this.command);
		if (callback) {
			/**
			 *
			 * @type {(function(this:boobst.BoobstSocket, (null|Error)))=}
			 */
			this.onConnectionCallback = callback;
		}
		this.socket.connect(this.port, this.host);
		delete this.connectionTimeout;
	} catch(e) {
		if (callback) {
			callback(new Error(e));
		}
	}
	return this;
};

//----------------------------------------------------------------------------------------------------------------------
/**
 * Обработчик данных, пришедших от сервера в общем случае
 * @private
 * @param {Buffer} data чанк данных
 */
BoobstSocket.prototype.onDataCommon = function(data) {
	// проверяем, является ли этот чанк последним куском передаваемых данных
	// у него в конце должны стоять символы \6\6
	if ((data.length > 1) && (data[data.length-1] === 6) && (data[data.length-2] === 6)) {
		if (this.out && this.command === BCMD.EXECUTE){ // если мы пишем в поток
			this.out.end(data.slice(0, data.length - 2));
			delete this.out;
			if (this.callback) { // если у нас есть коллбек
				this.callback.call(this, null); // this.data тут нет
			}
		} else {
			this.data += data.slice(0, data.length - 2);
			if (this.callback) { // если у нас есть коллбек
				this.callback.call(this, null, this.data);
			}
		}
		process.nextTick(function(){
			this.command = BCMD.NOP;
			this._runCommandFromQueue();
		}.bind(this));
	} else {
		if (this.out && this.command === BCMD.EXECUTE){ // если мы пишем в поток
			this.out.write(data);
		} else {
			this.data += data;
		}
	}
};

/**
 * Обработчик данных, пришедших от сервера в момент коннекта
 * @private
 * @param {Buffer} data приветствие
 */
BoobstSocket.prototype.onDataGreeting = function(data){
	this.emit('debug', 'connected');
	var dataStr = data.toString().split(';');

	if (parseInt(dataStr[0], 10) !== this.version) {
		var err = new Error('Mismatch of protocol versions! server: ' + dataStr[0] + ', client: ' + this.version);
		if (this.onConnectionCallback) {
			this.onConnectionCallback(err);
		}
		return;
	}

	// работаем с нужной нам версией протокола
	this.id = parseInt(dataStr[1], 10);

	// если при подключении мы находимся в отличной области, первым делом переключимся в нужную
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

	process.nextTick(function(){
		this.command = BCMD.NOP;
		this._runCommandFromQueue();
	}.bind(this));
};

/**
 * Обработчик данных, пришедших от сервера при смене namespace
 * @private
 * @param {buffer.Buffer} data информация о смене
 */
BoobstSocket.prototype.onDataZn = function(data) {
	process.nextTick(function(){
		this.command = BCMD.NOP;
		this._runCommandFromQueue();
	}.bind(this));
	//console.log(data.toString());
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
};
//--------------------------------------------------------------------------
/**
 * Попробовать выполнить команду
 * Если сокет не занят, команда выполняется, иначе - становится в очередь
 * @param {Object} commandObject
 * @private
 */
BoobstSocket.prototype._tryCommand = function(commandObject) { // попытаться выполнить комманду
	//this.error(commandObject.cmd + ':' + commandObject.uri + '>' + this.command);
	if (this.command !== BCMD.NOP) {
		//console.log(commandObject);
		this.queue.push(commandObject);
	} else {
		this.data = "";
		this.command = commandObject.cmd;
		this.callback = commandObject.callback;
		switch (commandObject.cmd) {
			case BCMD.EXECUTE:
				//console.log('-> ' + commandObject.name);
				if (commandObject.out) {
					this.out = commandObject.out;
				}
				this.socket.write('E ' + commandObject.name + EOL);
				break;
			case BCMD.GET:
				this.socket.write('G ' + commandObject.name + EOL);
				break;
			case BCMD.KEY:
				this.socket.write('Q ' + commandObject.name + EON + commandObject.value + EOL);
				break;
			case BCMD.SETENCODING:
				this.socket.write('8 ' + commandObject.value + EOL);
				break;
			case BCMD.SET:
				//console.log('S ' + commandObject.name + EON + commandObject.value + EOL);
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
			case BCMD.BLOB:
				this.socket.write('B ' + commandObject.uri + EOL);
				commandObject.stream.on('end', function(){
					this.socket.end();
					if (this.callback) { // если у нас есть коллбек
						this.callback.call(this, null);
					}
					this.command = BCMD.NOP;
					this.connect();
				}.bind(this));
				commandObject.stream.pipe(this.socket);
				break;
			case BCMD.ZN:
				this.socket.write('Z ' + commandObject.name + EOL);
				break;
			case BCMD.DISCONNECT:
				this.socket.end();
				if (this.callback) {
					this.callback.call(this);
				}
				break;
			default:
				this.error("unknown command");
				console.log(commandObject);
		}
	}
};

/**
 * Выполнить команду
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
};

/**
 * Получить значение
 * @param {string} name Имя переменной или узла глобала
 * @param {function(this:boobst.BoobstSocket, (null|Error), Object)} callback Функция-коллбэк (error, data)
 */
BoobstSocket.prototype.get = function(name, callback) {
	this._tryCommand({
		cmd: BCMD.GET,
		name: name,
		callback: callback
	});
};
BoobstSocket.prototype.key = function(name, value, callback) {
	this._tryCommand({
		cmd: BCMD.KEY,
		name: name,
		value: value,
		callback: callback
	});
};
BoobstSocket.prototype.setEncoding = function(value, callback) {
	this._tryCommand({
		cmd: BCMD.SETENCODING,
		value: value,
		callback: callback
	});
};

/**
 * Установить значение переменной или глобала
 * @param {string} name имя переменной или глобала (начинаятся с ^)
 * @param {string|Buffer} value значение переменной, меньше 32к
 * @param {function(this:boobst.BoobstSocket, (null|Error), string)} [callback] callback
 * @return {boobst.BoobstSocket}
 */
BoobstSocket.prototype.set = function(name, value, callback) {
	this._tryCommand({
		cmd: BCMD.SET,
		name: name,
		value: value,
		callback: callback
	});
	return this;
};

/**
 * Сменить пространство имён БД
 * @param {string} name Существующий namespace
 * @param {function} [callback] callback
 */
BoobstSocket.prototype.zn = function(name, callback) {
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
};

/**
 * Удалить глобал или локал
 * @param {string} name
 * @param {function(this:boobst.BoobstSocket, (null|Error))} [callback] callback
 */
BoobstSocket.prototype.kill = function(name, callback) {
	this._tryCommand({
		cmd: BCMD.KILL,
		name: name,
		callback: callback
	});
};

/**
 * Передать бинарные данные
 * @param {string} uri uri формата file://<путь_к_файлу> или global://<имя_глобала_без_^>
 * @param {Stream} stream поток данных
 * @param {function(this:boobst.BoobstSocket, (null|Error))} [callback] callback
 */
BoobstSocket.prototype.blob = function(uri, stream, callback) {
	this._tryCommand({
		cmd: BCMD.BLOB
		, stream: stream
		, uri: uri
		, callback: callback
	});
};

/**
 * Очистить локальное пространство имён и проинициализировать серверные переменные заново
 * @param {function(this:boobst.BoobstSocket, (null|Error))} [callback] callback
 */
BoobstSocket.prototype.flush = function(callback) {
	this._tryCommand({cmd: BCMD.FLUSH, callback: callback});
};

/**
 * Проверить состояние сервера
 * @param {function(this:boobst.BoobstSocket, (null|Error), {string})} [callback] callback
 */
BoobstSocket.prototype.ping = function(callback) {
	this._tryCommand({cmd: BCMD.PING, callback: callback});
};

/**
 * Отключиться от базы данных
 * @param {function(this:boobst.BoobstSocket, (null|Error))} [callback] callback
 */
BoobstSocket.prototype.disconnect = function(callback) {
	this.killme = true;
	this._tryCommand({cmd: BCMD.DISCONNECT, callback: callback});
};

/**
 * Запустить следующую команду из очереди
 * @private
 */
BoobstSocket.prototype._runCommandFromQueue = function() {
	if (this.queue.length > 0) {
		var task = this.queue.shift();
		this._tryCommand(task);
	}
};

/**
 * Сохранить в каше javascript-объект
 * @param {String} variable имя переменной или глобала (начинается с ^)
 * @param {Object} object js-объект
 * @param {Function} [callback] callback
 */
BoobstSocket.prototype.saveObject = function(variable, object, callback) {
	//console.log(object);
	this._saveObject(variable, object, []);
	this.ping(function(err, data) {
		if (!err && data === 'pong!') {
			if (callback) {
				callback.call(this, null);
			}
		} else {
			if (callback) {
				callback.call(this, err);
			}
		}
	});
};

/**
 * @private
 */
BoobstSocket.prototype._saveObject = function(variable, object, stack) {
	var self = this;
	Object.keys(object).forEach(function(key){
		switch (typeof object[key]) {
			case 'object':
				stack.push(key.replace(/"/g, '""'));
				self._saveObject(variable, object[key], stack);
				stack.pop();
				break;
			case 'function':
				break;
			case 'boolean':
				if (object[key]) {
					object[key] = '1true';
				} else {
					object[key] = '0false';
				}
			default:
				self.set(variable + '("' + stack.join('","') + (stack.length > 0 ? '","' : "") + key.replace(/"/g, '""') + '")', object[key]);
			//console.log('^' + global + '("' + stack.join('","') + (stack.length > 0 ? '","' : "") + key.replace(/"/g, '""') + '")=' + object[key]);
		}
	});
};
//--------------------------------------------------------------------------
BoobstSocket.prototype.error = function(text) {
	console.log('\u001b[41mSocket ' + this.id + ': ' + text + '\u001b[0m');
};
BoobstSocket.prototype.log = function(text) {
	console.log('Socket ' + this.id + ': ' + text);
};
//--------------------------------------------------------------------------
BoobstSocket.prototype.port = 6666;

exports.BoobstSocket = BoobstSocket;
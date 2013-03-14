const VERSION = 7
	, SERVER = "10.30.2.4"
	, PORT = 6666
	, NS = 'USER';

var BoobstSocket = require("../boobst").BoobstSocket
	;


exports["Тест, который проверяет нужную версию протокола"] = function(test) {
	test.equal((new BoobstSocket()).version, VERSION, "boobst version must be: " + VERSION);
	test.done();
};

exports["Проверка соединения с адресом " + SERVER] = function(test) {
	var socket = new BoobstSocket({
		host: SERVER
		, port: PORT
	});
	socket.connect(function(err){
		test.equal(err, null, 'Должны подключиться к работающему серверу');
		this.disconnect(function(err){
			test.notEqual(this.ns, NS, 'namespace при загрузке не должно равняться ' + NS);
			test.ok(!err, 'ошибок быть не должно');
			test.done();
		});
	})
};

exports["Получение несуществующего значения глобала. Установка, получение и удаление существующего"] = function(test) {
	var GL_NAME = '^test("17")'
		, GL_DATA = 'SOME DATA';
	var socket = new BoobstSocket({
		host: SERVER
		, port: PORT
	});
	socket.connect(function(err) {
		test.ok(!err, 'Присоединились');
		this.get(GL_NAME, function(err, data) {
			test.ok(err, "Должна быть ошибка, т.к. данного глобала нет.");
			this.set(GL_NAME, GL_DATA, function(err) {
				test.ok(!err, 'Ошибок быть не должно');
				this.get(GL_NAME, function(err, data) {
					test.ok(!err, 'Ошибок быть не должно');
					test.equal(data, GL_DATA, 'Данные должны совпадать');
					this.kill(GL_NAME, function(err){
						test.ok(!err, 'Ошибок быть не должно');
						this.get(GL_NAME, function(err, data){
							test.ok(err, 'Должна быть ошибка, т.к. данного глобала нет.');
							this.disconnect(function(err){
								test.ok(!err, 'ошибок быть не должно');
								test.done();
							});
						})
					});
				});
			});
		});
	});
};

exports['Проверка смены пространства имён'] = function(test) {
	var startedNS;
	var socket = new BoobstSocket({
		host: SERVER
		, port: PORT
	});
	socket.connect(function(err){
		test.ok(!err, 'Присоединились');
		startedNS = this.ns;
		this.zn(NS, function(err, changed){
			test.ok(!err, 'мы должны сменить область');
			test.ok(changed, 'мы должны сменить область');
			test.equal(this.ns, NS, 'мы должны сменить область');
			this.zn(NS, function(err, changed){
				test.ok(!err, 'мы должны сменить область');
				test.ok(!changed, 'мы должны сменить область');
				test.equal(this.ns, NS, 'мы должны сменить область');
				this.zn(startedNS, function(err, changed){
					test.ok(!err, 'мы должны сменить область');
					test.ok(changed, 'мы должны сменить область');
					test.equal(this.ns, startedNS, 'мы должны сменить область на ' + startedNS);
					this.disconnect(function(err){
						test.ok(!err, 'ошибок быть не должно');
						test.done();
					});
				})
			});
		});
	});
};

exports['При ошибке пространство имён не должно сбрасываться на значение по умолчанию'] = function(test) {
	var startedNS;
	var socket = new BoobstSocket({
		host: SERVER
		, port: PORT
	});
	//socket.on('debug', console.log);
	socket.connect(function(err){
		test.ok(!err, 'Присоединились');
		startedNS = this.ns;
		this.zn(NS, function(err, changed){
			test.ok(!err, 'мы должны сменить область');
			test.ok(changed, 'мы должны сменить область');
			test.equal(this.ns, NS, 'мы должны сменить область');
			this.get('^ololo', function(err){
				test.ok(err, 'должна возникнуть ошибка');
				this.ping(function(err){
					test.ok(!err, 'ошибок быть не должно');
					test.equal(this.ns, NS, 'мы должны находиться в той же самой области, в которой и были');
					this.disconnect(function(err){
						test.ok(!err, 'ошибок быть не должно');
						test.done();
					})
				});
			})
		});
	});
};

/*
exports["Тест квазисинхронности операций"] = function(test) {
	var cou = 100;
	test.expect(cou * 2 + 1);
	new BoobstSocket(function() {
		var self = this, i;
		for (i = 0; i < cou; i++) {
			this.kill('^test("a",' + i + ')');
		}
		self.get("^test(2)", function(err, data){
			test.ok(!err, "Должна быть ошибка, т.к. мы должны были всё удалить");
		});

		for (i = 0; i < cou; i++) {
			this.set('^test("a",' + i + ')', i, function(err, data) {
				//console.log("SET");
			});
		}
		for (i = 0; i < cou; i++) {
			this.get('^test("a",' + i + ')', function(i) {
				return function(err, data){
					test.ok(!err, "Ошибки не должно быть, т.к. данный глобал мы означили.");
					test.equal(i, data, "В узлах должны лежать правильные значения");
				}
			}(i));
		}
		this.disconnect(function(){
			this.log("DISCONNECT!");
			test.done();
		});
	}, port, server);
};*/

/*
exports["Выполнение программы без параметров"] = function(test) {
	new BoobstSocket(function() {
		this.execute('lol^zzz', function(err, data) {
			test.ok(!err, "Всё д.б. хорошо");
			test.equal(data, "abcdefабвгде", "Должно вернуться стандартный ответ");
			this.disconnect();
			test.done();
		});
	}, port, server);
};

exports["Выполнение программы с параметрами"] = function(test) {
	test.expect(2);
	var myText = 'olol o llolo';
	new BoobstSocket(function() {
		this.set("a", myText);
		this.execute('fuck2^zzz', function(err, data) {
			test.ok(!err, "Всё д.б. хорошо");
			test.equal(data, myText + "яблокоapple", "Вернуться должен наш параметр");
			this.disconnect();
			test.done();
		});
	}, port, server);
};

exports["Выполнение программы с параметрами в потоке"] = function(test) {
	var myText = 'olol o llolo',
		response = {
			data: "",
			write: function(data) {
				this.data += data;
			},
			end: function(data) {
				this.data += data;
				socket.log(data);
				test.equal(data, myText + "яблокоapple", "Вернуться должен наш параметр");
				test.done();
				socket.disconnect();
			}
		};
	test.expect(1);
	var socket = new BoobstSocket(function() {
		this.out = response;
		this.set("a", myText);
		this.execute('fuck2^zzz');
	}, port, server);
};

exports["Очередь выполнения рутин"] = function(test){
	var cou = 100,
		j = cou,
		Response = function(counter) {
			this.data = "";
			this.counter = counter;
		},
		downCount = function() {
			if (!--j) {
				test.done();
				socket.disconnect();
			}
		};
	test.expect(cou + 1);
	Response.prototype = {
		write: function(data) {
			this.data += data;
		},
		end: function(data) {
			this.data += data;
			//console.log(this.counter + ") " + data.toString() + "\n");
			test.equal(data, this.counter + "яблокоapple", "Вернуться должен наш параметр");
			downCount();
		}
	};
	var socket = new BoobstSocket(function() {
		for (var i = 0; i < cou; i++) {
			//console.log(i);
			this.set("a", i);
			if (i % 2) { // половина функций использует поток, половина - коллбек
				this.execute('fuck2^zzz', new Response(i));
			} else {
				this.execute('fuck2^zzz', function(i) {
					return function(err, data) {
						test.equal(data, i + "яблокоapple", "Вернуться должен наш параметр");
						downCount();
					}
				}(i));
			}
			if (i === 13) {
				// проверим один раз, что локальные переменные теряются после exexcute
				this.get("a", function(err, data){
					console.log(data);
					test.ok(err, "Переменной a существовать не должно");
				});
			}
		}
	}, port, server);
};

exports["Получение огромного количества данных"] = function(test) {
	var huge = 30000,
		msg = "olo!",
		cou = 100,
		j = cou,
		Response = function(counter) {
			this.data = "";
			this.counter = counter;
		},
		downCount = function() {
			if (!--j) {
				test.done();
				socket.disconnect();
				console.log("Totally we get " + (huge * msg.length * cou / 1024 / 1024)  + " megabytes!");
			}
		};
	test.expect(cou);
	Response.prototype = {
		write: function(data) {
			this.data += data;
		},
		end: function(data) {
			this.data += data;
			//console.log(this.counter + ") " + this.data.length + " : " + this.data);
			test.equal(this.data.length, msg.length * huge, "Размер переданного текста д.б. равен " + msg.length * huge);
			downCount();
		}
	};
	var socket = new BoobstSocket(function() {
		for (var i = 0; i < cou; i++) {
			//console.log(i);
			this.set("huge", huge);
			this.set("msg", msg);
			this.execute('for^zzz', new Response(i));
		}
	}, port, server);
};

exports["Конкурирующее выполнение"] = function(test) {
	test.expect(2);
	var j = 2,
		downCount = function(a) {
			test.equal(a, j, "Порядок выполнения")
			if (!--j) {
				test.done();
				socket.disconnect();
			}
		};
	var socket = new BoobstSocket(function(){
		this.set("huge", 1);
		this.set("msg", 3);
		this.execute('for^zzz', function(err, data){
			console.log(data);
			this.set("huge", 1);
			this.set("msg", 1);
			this.execute('for^zzz', function(err, data){
				console.log(data);
				downCount(data);
			});
		});
		this.set("huge", 1);
		this.set("msg", 2);
		this.execute('for^zzz', function(err, data){
			console.log(data);
			downCount(data);
		});
	}, port, server);
};
*/
/*
exports["Очистка локальных переменных"] = function(test) {
	test.expect(5);
	var socket = new BoobstSocket(function(){
		this.set("on", 1, function(err, data){
			test.ok(!err, 'Всё д.б. хорошо');
			this.get("on", function(err, data){
				test.ok(!err, 'Всё д.б. хорошо');
				test.equal(data, 1);
				console.log("> " + data);
				this.flush(function(err, data){
					test.ok(!err, 'Всё д.б. хорошо');
					console.log(data);

					this.get("on", function(err, data){
						console.log("> " + data);
						test.ok(err, 'Значения быть не должно');
						test.done();
						this.disconnect();
					});

				})
			})
		});
	}, port, server);
};
*/

/*

exports["Загрузка бинарных данных"] = function(test) {
	var s = new BoobstSocket(function(){
		//this.setEncoding("RAW");
		var file = fs.readFileSync(__dirname + "/input.png");
		console.log(file);
		this.set('^test("RAW")', file, function(err, data){
			test.done();
			this.disconnect();
		});
	}, port, server);
};

*/
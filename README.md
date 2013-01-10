# Boobst. Node.js Caché driver

An Intersystems Caché driver that implements basic functionality and can run routines.
Several things have yet to be implemented, but the driver can be used for simple use-cases.
Server part was inspired by [M.Wire](https://github.com/robtweed/mdb) project.

Main goal of this project is to replace Apache + Weblink connection with Node.js server.

Licensed under the The GNU Affero General Public License which can be found at www.gnu.org/licenses/

## Usage

1. Import Caché Object Script program `boobst.cos` to your Caché instance
2. Run Boobst server by typing `do start^boobst` in Caché terminal

## Sample program

``` Javascript
var BoobstSocket = require('./boobst').BoobstSocket
    , assert = require('assert');

var bs = new BoobstSocket({
    host: 'localhost'
    , port: 6666
});
bs.connect(function(err){
    var test = 'test';
    // 'this' refers to the socket itself
    this.zn('USER', function(err, changed){
        this.set('^test(1)', test, function(err) {
            this.get('^test(1)', function(err, data) {
                assert.equal(data, test, 'should be "test"');
            });
        });
    });
});
```

## Commands

### Set

Set local or global variable. Local variables could be accessed throw server process.

``` Javascript
bs.set('^var("a",1)', 'value', function(err) {
    if (err) { console.log(err); return; }
    console.log('done');
});
```

### Get

Get local or global variable.

``` Javascript
bs.get('^var("a",1)', 'value', function(err, data) {
    if (err) { console.log(err); return; }
    console.log(data);
});
```

### Kill

Kill global variable.

``` Javascript
bs.kill('^var("a",1)', function(err) {
    if (err) { console.log(err); return; }
    console.log('done');
});
```

### Zn

Change namespace

``` Javascript
bs.zn('%SYS', function(err, switched) {
    if (err) { console.log(err); return; }
    console.log(switched ? 'successfully changed namespace' : 'already been there');
});
```

### Exec

Executes the routine. All local variables set previously are available in the routine.

``` Javascript
bs.set('a', 'value', function(err) {
    if (err) { console.log(err); return; }
    this.execute('showVarA^test' /**program body: "w a q"*/, function(err, data) {
        if (err) { console.log(err); return; }
        console.log(data === 'value' ? 'successfully executed': 'something wrong');
    });
});
```

### Blob

Send stream to the server. file://path/to/the/file saves file on the disk, global://blob saves file into global.

``` Javascript
bs.blob('global://blob', fs.createReadStream('/home/und/00109721.jpg'), function(err) {
	if (err) { console.log(err); return; }
    console.log('file saved');
});
```
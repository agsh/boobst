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
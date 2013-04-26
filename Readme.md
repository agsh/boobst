# Boobst. Node.js Caché driver
[![Build Status](https://travis-ci.org/agsh/boobst.png)](https://travis-ci.org/agsh/boobst)

An Intersystems Caché driver that implements basic functionality and can run routines.
Several things have yet to be implemented, but the driver can be used for simple use-cases.
Server part was inspired by [M.Wire](https://github.com/robtweed/mdb) project. I took from it infinitive loop organization, fork methods and open/use directives.

Main goal of this project is to replace Apache + Weblink connection with Node.js server.

Licensed under the The GNU Affero General Public License which can be found at www.gnu.org/licenses/

##Installation

via npm:

```
npm install boobst
```

## Usage

1. Import Caché Object Script program `boobst.cos` to your Caché instance
2. Run Boobst server by typing `do start^boobst` in Caché terminal

## Sample program

``` Javascript
var BoobstSocket = require('boobst').BoobstSocket
    , assert = require('assert')
    ;

var bs = new BoobstSocket({
    host: 'localhost'
    , port: 6666
});
bs.connect(function(err){
    var test = 'test';
    // 'this' refers to the socket itself
    this.zn('USER').set('^test', [1, 2], test).get('^test', [1, 2], function(err, data) {
        assert.equal(data, test, 'should be "' + test + '"');
        this.disconnect();
    });
});
```

## Commands

### Set

Set local or global variable. Type of value should be string, number, buffer or object. Local variables could be accessed throw server process.

``` Javascript
bs.set('^var', ['a', 1], 'value', function(err) {
    if (err) { console.log(err); return; }
    console.log('done');
});
```
Set can accept values more than 32kb. In this case global or local will be splitted in this structure:
```
global(subscript) = <first part>
global(subscript, 1) = <second part>
global(subscript, 2) = <third part>
...
```

### Get

Get local or global variable.

``` Javascript
bs.get('^var', ['a', 1], 'value', function(err, data) {
    if (err) { console.log(err); return; }
    console.log(data);
});
```

### Kill

Kill global variable.

``` Javascript
bs.kill('^var', ['a', 1], function(err) {
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

Considering that commands send to the database in series, we can write code to execute without callbacks.

``` Javascript
bs.set('a', '2');
bs.set('b', '2');
bs.execute('multAB^test' /**program body: "w a*b q"*/, function(err, data) {
    if (err) { console.log(err); return; }
    console.log(data === '4' ? 'successfully executed': 'something wrong');
});
```

Also, these two commands are equivalent and second version is preferable :
``` Javascript
bs.set('a("abc",1)', 5);
bs.set('a', ['abc', 1], 5);
```

### SaveObject

Save JSON objects in database. Set with object value type implements same behaviour. Mapping JSON to globals is similar to document storage in this paper: http://www.mgateway.com/docs/universalNoSQL.pdf pp. 19-21
``` JSON
{
    "array": ["a", "ab", "abc"],
    "object": {
        "a": "a",
        "b": 2
    },
    "boolean": true,
    "number": 42
}
```

``` Javascript
var obj = {
    a: {
        b: 1
    },
    c: [1, 2, 3],
    d: 'e'
};

bs.saveObject('^test', obj, function(err) {
    if (err) { console.log(err); return; }
    console.log('object saved');
});
```

Or, if we use subscripts:
``` Javascript
bs.saveObject('^test', ['sub1', 'sub2'], obj, function(err) {
    if (err) { console.log(err); return; }
    console.log('object saved');
});
```

### Blob

Send stream to the database server. file://path/to/the/file saves file on the disk, global://blob saves file into global.

``` Javascript
bs.blob('global://blob', fs.createReadStream('/home/und/00109721.jpg'), function(err) {
	if (err) { console.log(err); return; }
    console.log('file saved');
});
```

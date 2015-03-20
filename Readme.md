# Boobst. Node.js Caché driver
[![Build Status](https://travis-ci.org/agsh/boobst.png)](https://travis-ci.org/agsh/boobst)
[![NPM version](https://badge.fury.io/js/boobst.png)](http://badge.fury.io/js/boobst)

An Intersystems Caché driver that implements basic functionality and can run routines.
Several things have yet to be implemented, but the driver can be used for simple use-cases.
Server part was inspired by [M.Wire](https://github.com/robtweed/mdb) project. I took from it infinitive loop organization, fork methods and open/use directives.

Main goal of this project is to replace Apache + Weblink connection with Node.js server. Or just to use Cache' as an hierarchical database to store you data (probably JSON data) and execute routines and functions.

Licensed under the The MIT License which can be found at http://opensource.org/licenses/MIT

##Installation

via npm:

```
npm install boobst
```

## Usage

1. Import Caché Object Script program `boobst.m` (please rename it to `boobst.int`. I use `.m` extension for MUMPS legacy) to your Caché instance
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

## Tests
Tests use Mocha test framework. You can install it by typing `npm install mocha`
You should specify configuration of Cache' Boobst server at ./test/test.config.js and then run tests this way: `npm test`

## Commands

### Set

Set local or global variable. Type of value should be a string, number, buffer or object. Local variables could be accessed throw server process.

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

You can also save JSON objects in your database. Mapping JSON to globals is similar to document storage in this paper: http://www.mgateway.com/docs/universalNoSQL.pdf pp. 19-21
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

bs.set('^test', obj, function(err) {
    if (err) { console.log(err); return; }
    console.log('object saved');
});
```

Or, if we use subscripts:
``` Javascript
bs.set('^test', ['sub1', 'sub2'], obj, function(err) {
    if (err) { console.log(err); return; }
    console.log('object saved');
});
```

### Get

Get local or global variable. Notice that data type always has a Buffer type (for binary data) and you should manually convert it to string or other type if you want.

``` Javascript
bs.get('^var', ['a', 1], function(err, data) {
    if (err) { console.log(err); return; }
    console.log(data.toString());
});
```

If we have previously saved a javascript object with ```set``` or ```saveObject``` command, we can get it back. Driver can automaticly detects the global stucture and converts it into JSON.

```javascript
bs.set('^var', ['a', 1], {a: 1, b: [2, 3], c: {d: 4}}, function(err) {
    bs.get('^var', ['a', 1], function(err, data) {
        if (err) { console.log(err); return; }
        console.log(JSON.parse(data.toString())); // {a: 1, b: [2, 3], c: {d: 4}}
    });
});
```

This is a table of mapping different data types from javascript to Cache' and backwards:

|Data type|JS sample value|DB representation after `set` command|JS representation after `get` command|
|---------|---------------|-------------------------------------|-------------------------------------|
|Number   |42             |42                                   |42                                   |
|         |42.666         |42.666                               |42.666                               |
|         |3.16e+920      |3.16e+920                            |3.16e920                             |
|Boolean  |true    |"1true" (to distinguish with numbers but save compatibility with if operator)|true|
|         |false          |"0false"                             |false                                |
|String   |'sample'       |"sample"                             |'sample'                             |
|Object   |{ a: 1,        |("a")=1                              |{a:1,b:'a',c:{d:0}}                  |
|         |  b: 'a',      |("b")="a"                            |                                     |
|         |  c: {d, 0}}   |("c","d")=0                          |                                     |
|Array    |[4,8,15,16]    |(0)=4,(1)=8,(2)=15,(3)=16            |[4,8,15,16]                          |
|Function |function(){}   |-                                    |-                                    |
|Date     |new Date()     |"Sat Jan 01 2000 12:00:00"           |'Sat Jan 01 2000 12:00:00'           |
|Null     |null           |-                                    |-                                    |
|Undefined|undefined      |-                                    |-                                    |

In the case when we have wrong global stucture (which differs from what we got with `set` command), `get` command will return only node value. But we can try to force JSON generation with setting second/third optional argument `forceJSON` to `true`.

```javascript
bs.get('^var', ['a', 1], true, function(err, data) {
    // working with JSON here
});
```

### Order (Next)

Gets the next key based on the current key.

``` Javascript
bs.next('^var', ['a', 1], function(err, key) {
    assert.equal(err, null);
    assert.equal(key, 2);
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

### Execute

Executes the routine. All local variables that have been set previously are available in the routine.

``` Javascript
bs.set('a', 'value', function(err) {
    if (err) { console.log(err); return; }
    this.execute('showVarA^test' /**program body: "w a q"*/, function(err, data) {
        if (err) { console.log(err); return; }
        console.log(data === 'value' ? 'successfully executed': 'something wrong');
    });
});
```

Considering that commands are sending to the database in series, we can write code which executing without callbacks.

``` Javascript
bs.set('a', '2')
  .set('b', '2')
  .execute('multAB^test' /**program body: "w a*b q"*/, function(err, data) {
    if (err) { console.log(err); return; }
    console.log(data === '4' ? 'successfully executed': 'something wrong');
});
```

Also, this two commands are equivalent and second version is preferable :
``` Javascript
bs.set('a("abc",1)', 5);
bs.set('a', ['abc', 1], 5);
```

### SaveObject

Deprecated. Use `set` command instead which can save javascript objects into database too.

### Blob

Send stream to the database server. file://path/to/the/file saves file on the disk, global://blobGlobalName saves file into `^blobGlobalName` global.
> Note: if you are using node.js v0.8 or later with old Streams API, it is better to pause you stream after creating.
> There is no such problem in node.js v0.10 with "Streams2" API.

``` Javascript
bs.blob('global://blob', fs.createReadStream('/home/und/00109721.jpg'), function(err) {
	if (err) { console.log(err); return; }
    console.log('file saved');
});
```

## Useful links
[Socket programming](http://www.mumpster.org/viewtopic.php?f=10&t=1672)

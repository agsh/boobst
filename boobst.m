	; Socket documentation
	; http://localhost:57772/csp/docbook/DocBook.UI.Page.cls?KEY=GIOD_tcp
starter(msg)
	set lv="boobstServer"_$$port()
	lock +@(lv):0 e  set msg="already running" write msg quit
	lock -@(lv) set msg="started on "_$$port()
	job start($$port())
	quit
allowXecute()
	quit 0
	;
port() 
	quit 6666
	;
version()
	quit 9
detailedVersion()
	quit $$version()_".0"
start(Port)
	new io, port, lv
	set port=$g(Port,$$port())
	set lv="boobstServer"_port
	lock +@(lv):0 e  w "already running" QUIT  ; already running
	set io="|TCP|1"
	; "PTAS" ?
	open io:(/TRA=0:port:"CPAS":/NODELAY=0):20 e  w "Port "_port_" already served" QUIT
	write "Boobst Server v.0."_$$detailedVersion()_" started on Port:"_port,!
	use io
	;
serverLoop
	read x
	job child:(:5:io:io)
	goto serverLoop
	;
child
	;
	use $io:(/IOTABLE="UTF8"::"-Q+W":$c(0))
	do command
	quit
	;

cleardown
	;
	new ignore, pid
	;
	set pid=""
	f  s pid=$o(^boobst("connected",pid)) q:pid=""  d
	. if pid=$j quit
	. s ignore=1
	. l +^boobst("connected",pid):0 e  s ignore=0
	. i ignore d
	. . l -^boobst("connected",pid)
	. . k ^boobst("connected",pid)
	. . k ^boobst("monitor","listener",pid)
	. . k ^boobst("monitor","output",pid)
	s pid=""
	f  s pid=$o(^boobst("monitor","output",pid)) q:pid=""  d
	. i pid=$j q
	. s ignore=1
	. l +^boobst("connected",pid):0 e  s ignore=0
	. l -^boobst("connected",pid)
	. i ignore d
	. . k ^boobst("monitor","output",pid)
	QUIT 
 
command ;
	new authNeeded, c, crlf, input, output
	;
	;d cleardown
	set ^boobst("connected",$j)=""
	lock +^boobst("connected",$j)
	write $$version()_";"_$j_";"_$zu(5)
	write *-3
loop
	;set %CGIEVAR("AUTH_PASSWORD")=""
	;set %CGIEVAR("AUTH_TYPE")=""
	set %CGIEVAR("CONTENT_TYPE")=""
	set %CGIEVAR("GATEWAY_INTERFACE")="CGI/1.1"
	set %CGIEVAR("HTTP_AUTHORIZATION")=""
	set %CGIEVAR("HTTP_COOKIE")=""
	set %CGIEVAR("HTTP_REFERER")=""
	;set %CGIEVAR("HTTP_SOAPACTION")=""
	set %CGIEVAR("REMOTE_HOST")=""
	set %CGIEVAR("REMOTE_IDENT")=""
	set %CGIEVAR("REMOTE_USER")=""
	set %CGIEVAR("SERVER_PROTOCOL")="HTTP/1.1"
	set %CGIEVAR("SERVER_SOFTWARE")="Node.js"
loop2 
	read *c
	read input set input=$c(c)_input
	set input=$e(input,1,$l(input)-1)
	;set ^%boobst("cmd",$i(^%boobst("cmd"))) = input
	if input="PING" s output="+PONG"_crlf w output g loop2
	if input="" g loop
	if $e(input,1,2)="S " do set($e(input,3,$l(input))) goto loop2
	if $e(input,1,2)="Q " do setKey($e(input,3,$l(input))) goto loop2
	if $e(input,1,2)="K " do kill($e(input,3,$l(input))) goto loop2
	if $e(input,1,2)="G " do get($e(input,3,$l(input))) goto loop2
	if $e(input,1,2)="O " do order($e(input,3,$l(input))) goto loop2
	if $e(input,1,2)="Z " do zn($e(input,3,$l(input))) goto loop
	if $e(input,1,2)="B " do blob($e(input,3,$l(input))) goto loopBlob
	if $e(input,1,2)="E " do exec($e(input,3,$l(input))) goto loop
	if $e(input,1,2)="X " do xecute($e(input,3,$l(input))) goto loop2
	if input="F" d flush goto loop
	if input="P" d ping goto loop2
	if $e(input,1,2)="8 " do setEncoding($e(input,3,$l(input))) goto loop2
	;if input="UTF8" use $io:(/IOTABLE="UTF8"::"-Q+W":$c(0)) goto loop
	;if input="RAW" use $io:(/IOTABLE="RAW"::"-Q+W":$c(0)) goto loop
	if input="EXIT" goto halt
	if input="QUIT" goto quit
	if input="HALT" goto halt
	set output="-"_input_"- not recognized"_crlf write output
	do end
	goto loop2
	;
blob(name)
	set type = $p(name,"://",1)
	set where = $p(name,"://",2)
	use $io:(/IOTABLE="RAW"::"-TS"::32000)	
	if type="file" d
	.	set IO=$IO
	.	open where:("WNS"):5
	.	if $TEST=0 do
	.	.	close where
	.	.	use io
	.	.	use $io:(/IOTABLE="UTF8"::"-Q+W":$c(0))
	.	.	write "couldn't open device"
	.	.	goto quit
	else  if type="global" do
	.	set it = 0
	.	set where = "^"_where
	quit
	;
loopBlob
	read *c
	read input s input=$c(c)_input
	set input=$e(input,1,$l(input))
	if type="global" do
	.	set it = it + 1
	.	set @where@(it)=input
	else  if type="file" do
	.	use where:(/IOTABLE="RAW"::"-Q+W"::32000)
	.	write input
	.	use IO:(/IOTABLE="RAW"::"-TS"::32000)
	goto loopBlob
	;
halt
	kill ^boobst("connected", $j)
	halt
	;
quit
	;
	if '$d(^boobst("monitor", "listener", $j)) goto halt
	kill ^boobst("monitor", "listener", $j)
	goto loop
	;
kill(%nameOfVariable)
	kill @%nameOfVariable
	write "ok.kill"
	do end
	quit
	;
setEncoding(name)
	use $io:(/IOTABLE=name::"-Q+W":$char(0))
	write "ok.setEncoding"
	do end
	quit
	;
setKey(input)
	new %nameOfVariable
	set %nameOfVariable = $piece(input, $char(1), 1)
	set @%nameOfVariable = $extract(input, $length(%nameOfVariable) + 2, *)
	set %KEY(%nameOfVariable) = @%nameOfVariable
	write "ok.setKey"
	do end
	quit
	;
set(input)
	new %nameOfVariable
	set %nameOfVariable = $piece(input, $char(1), 1)
	set @%nameOfVariable = $extract(input, $length(%nameOfVariable) + 2, *)
	write "ok.set"
	do end
	quit
	;
get(%input)
	new %params, %name
	set %params=$piece(%input, $char(1), 1)
	; params: n - get only node value
	;         f - force build json w/o first node value
	;         /empty/ - depends on first node value
	set %name=$piece(%input, $char(1), 2)
	if %params="f" do gl(%name) do end quit
	if $d(@%name)=10 do gl(%name) do end quit
	; write @%name
	do create32kbString(%name)
	do end
	quit
	;
order(%nameOfRoutine)
	write $order(@%nameOfRoutine)
	do end
	quit
	;
zn(%nameOfNS)
	zn %nameOfNS
	write "ok.zn."_$zu(5)
	write *-3
	quit
	;	
exec(%nameOfRoutine)
	do @%nameOfRoutine
	do end
	kill
	use $io:(/IOTABLE="UTF8"::"-Q+W":$c(0))
	quit
xecute(%codeToExecute)
	if $$allowXecute()  xecute (%codeToExecute)
	e  w "disallowed"
	do end
	use $io:(/IOTABLE="UTF8"::"-Q+W":$c(0))
	quit
flush
	kill
	write "ok.flush"
	use $io:(/IOTABLE="UTF8"::"-Q+W":$c(0))
	do end
	quit
	;
ping
	write "pong!"
	do end
	quit
	;
end
	;write $c(0)
	write $c(0)
	write *-3
	quit
	;
gl(global)
	new key, inKey, level, isArray, notFirst
	set key = ""
	set isArray = $$numberTest(global)
	set notFirst = 0
	if isArray  write "["
	else  write "{"
	for  set key = $order(@$na(@global@(key)))  quit:key=""  do
	.	;w !,key,") ",$na(@global@(key)),$d(@$na(@global@(key)))
	.	if notFirst w ","
	.	else  set notFirst = 1
	.	set inKey = $na(@global@(key)), level = $d(@inKey)
	.	if level = 10  do
	.	.	i 'isArray write """"_$replace(key,"""","\""")_""":"
	.	.	do gl(inKey)
	.	else  if level = 11 do
	.	.	write """"_key_""":"
	.	.	do create32kb(inKey)
	.	else  do
	.	.	if isArray  write $$makeValue(@global@(key))
	.	.	else  write """"_$replace(key,"""","\""")_""":"_$$makeValue(@global@(key))
	if isArray  write "]"
	else  write "}"
	quit
numberTest(global)
	new key, is
	set key = "", is = 1, num = 0
	for  set key = $order(@$na(@global@(key))) quit:key=""  do
	.	if key'=num set is = 0 quit
	.	set num = num + 1
	quit is
	;
create32kb(global)
	new key
	set key = ""
	write """"_$replace(@$na(@global),"""","\""")
	for  set key = $order(@$na(@global@(key))) quit:key=""  do
	.	write $replace(@$na(@global@(key)),"""","\""")
	write """"
	quit
	;
create32kbString(global)
	new key
	set key = ""
	write @$na(@global)
	for  set key = $order(@global@(key)) quit:key=""  do
	.	write $g(@global@(key))
	quit
	;	
makeValue(val)
	; if val = +val quit val
	if val?0.1"-"1(1"0",1(1"1",1"2",1"3",1"4",1"5",1"6",1"7",1"8",1"9").N)0.1(1"."1.N)0.1(1"e+",1"e-".N) quit val
	if val = "1true" quit "true"
	if val = "0false" quit "false"
	set val = $$encodeJSON(val)
	quit """"_val_""""
	;	
encodeJSON(s) ; JSON encoding
	n a
	s a = $replace(s,"\","\\")
	s a = $replace(a,"""","\""")
	s a = $replace(a,$c(9),"\t")
	s a = $replace(a,$c(10),"\n") 
	s a = $replace(a,$c(13),"") 
	q a
	;

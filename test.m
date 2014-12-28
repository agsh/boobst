	w $$wow("Teeehe quick brown fox jumped over the lazy dog's back."," ","\n")
	quit
wow(string,delim,to)
	new l,res
	set res=$piece(string,delim,1)
	set l=$length(string,delim)
	for pos=2:1:l do
	.   set extract=$piece(string,delim,pos)
	.   set res=res_to_extract
	quit res
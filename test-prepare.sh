#!/bin/sh
gtm_dist=$PWD/GTM
gtmgbldir=$PWD/test.gld
gtmroutines="$PWD $gtm_dist"
echo $gtm_dist
export gtm_dist
export gtmgbldir
export gtmroutines
#mkdir test.gld
#cd test.gld
#../GTM/mupip create

#$gtm_dist/mupip create
#$gtm_dist/gtm
$gtm_dist/mumps test.m
$gtm_dist/mumps -run ^test
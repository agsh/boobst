#!/bin/sh
mkdir gtm
cd gtm
wget -O gtm.tar.gz http://downloads.sourceforge.net/project/fis-gtm/GT.M-x86-Linux/V6.2-001/gtm_V62001_linux_i586_pro.tar.gz
tar xzfp gtm.tar.gz

gtm_user=`id -un`
echo $gtm_user
gtm_installdir=$PWD


#sudo chmod -R 777 ../gt.m
#gtm_dist=$PWD
#export gtm_dist
#gtmgbldir=$gtm_dist/mumps.gld
#export gtmgbldir
#http://sourceforge.net/projects/fis-gtm/files/GT.M-amd64-Linux/V6-2.001/gtm_V62001_linux_x8664_pro.tar.gz
#http://downloads.sourceforge.net/project/fis-gtm/GT.M-amd64-Linux/V6.2-001/gtm_V62001_linux_x8664_pro.tar.gz?r=http%3A%2F%2Fsourceforge.net%2Fprojects%2Ffis-gtm%2Ffiles%2FGT.M-amd64-Linux%2FV6.2-001%2F&ts=1419778409&use_mirror=garr
#sudo ./gtminstall --utf8 default --verbose --installdir $PWD/gt.m --overwrite-existing

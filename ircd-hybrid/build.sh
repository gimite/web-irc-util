#!/bin/sh

IRCD_SRC_DIR=$1
PATCH=`pwd`/multibyte-nick.7.2.3.patch

cd $IRCD_SRC_DIR &&
./configure --with-nicklen=60 &&
patch -p 0 < $PATCH &&
make &&
sudo make install

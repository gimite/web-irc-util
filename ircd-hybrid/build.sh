#!/bin/sh

PATCH=`pwd`/multibyte-nick.patch
cd /usr/ports/irc/ircd-hybrid
make patch
patch -p 0 < $PATCH
NICKLEN=60 make
make install

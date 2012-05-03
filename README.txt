* Requirement

ircd-hybrid: http://www.ircd-hybrid.org/
  See ircd-hybrid/build.sh

$ git clone https://github.com/genki/merb_full_url.git
$ cd merb_full_url
$ gem build merb_full_url.gemspec
$ sudo gem install merb_full_url-0.0.2.gem

$ cd www
$ bundle install


* Start daemons

$ sudo -u irc /usr/local/sbin/ircd
$ cd www
$ merb -p 12008 -e production -d

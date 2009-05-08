# Go to http://wiki.merbivore.com/pages/init-rb
 
require 'config/dependencies.rb'
 
use_orm :datamapper
use_test :rspec
use_template_engine :erb
 
Merb::Config.use do |c|
  c[:use_mutex] = false
  c[:session_store] = 'cookie'  # can also be 'memory', 'memcache', 'container', 'datamapper
  
  # cookie session store configuration
  c[:session_secret_key]  = 'f8c5471c006c1c8cba9c9bd7df50e043510043af'  # required for cookie session store
  c[:session_id_key] = '_irc_session_id' # cookie session id key, defaults to "_session_id"
end
 
Merb::BootLoader.before_app_loads do
  # This will get executed after dependencies have been loaded but before your app's classes have loaded.
  Merb.add_mime_type(:txt, nil, %w(text/plain), :charset => "utf-8")
  Merb.add_mime_type(:atom, :to_atom, %w[application/atom+xml])
end
 
Merb::BootLoader.after_app_loads do
  # This will get executed after your app's classes have been loaded.
end

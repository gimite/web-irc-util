class Home < Application
    
    def index
      @title = "irc.gimite.net"
      render()
    end
    
    def channel(channel)
      channel = channel.gsub(/^\#/, "")
      redirect("/channel/" + CGI.escape(channel))
    end
    
    def client
      render(:client, :layout => false)
    end
    
end

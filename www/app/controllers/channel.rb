class Channel < Application
    
    def index(channel)
      @channel = CGI.unescape(channel)
      @title = "\##{@channel} - irc.gimite.net"
      @client_url = "/client?utf8=" + CGI.escape("\##{@channel}")
      @recent_url = "/channel/%s/recent" % CGI.escape(@channel)
      date_strs = Dir[channel_dir(@channel) + "/*.txt"].
        map(){ |s| s.slice(/(\d+)\.txt/, 1) }.
        sort().reverse()
      @items = []
      for date_str in date_strs
        @items.push({
          :date => str_to_date(date_str),
          :url => "/channel/%s/archive/%s" % [CGI.escape(@channel), date_str],
        })
      end
      render()
    end
    
    def archive(channel, date)
      @channel = CGI.unescape(channel)
      @date = str_to_date(CGI.unescape(date))
      @prev_date = @date - 1
      @prev_date_url = archive_url(@channel, @prev_date)
      @next_date = @date + 1
      @next_date_url = @next_date > Date.today ? nil : archive_url(@channel, @next_date)
      @title = "%s - \#%s - irc.gimite.net" % [@date.strftime("%Y/%m/%d"), @channel]
      @channel_url = "/channel/" + CGI.escape(@channel)
      path = archive_path(@channel, @date)
      @log = []
      if File.exist?(path)
        File.foreach(path) do |line|
          @log.push(IRCMessage.new(@channel, line))
        end
      end
      render()
    end
    
    def recent(channel)
      @channel = CGI.unescape(channel)
      path = archive_path(@channel, Date.today)
      if File.exist?(path)
        @log =
          File.readlines(path).
          map(){ |s| IRCMessage.new(@channel, s) }.
          select(){ |m| m.body }
      else
        @log = []
      end
      max_log = 10
      pos = [0, @log.size - max_log].max
      @log = (0...max_log).map(){ |i| @log[pos + i] }
      render(:recent, :layout => false)
    end
    
  private
    
    def archive_url(channel, date)
      "/channel/%s/archive/%s" % [CGI.escape(channel), date_to_str(date)]
    end
    
    def archive_path(channel, date)
      return "%s/%s.txt" % [channel_dir(channel), date_to_str(date)]
    end
    
    def channel_dir(channel)
      return "../deborah/gimite.net/log/%s" % CGI.escape("\##{@channel}")
    end
    
    def date_to_str(date)
      return format("%04d%02d%02d", date.year, date.month, date.day)
    end
    
    def str_to_date(str)
      str =~ /^(\d\d\d\d)(\d\d)(\d\d)$/
      return Date.new($1.to_i(), $2.to_i(), $3.to_i())
    end
    
end


class IRCMessage
    
    def initialize(channel, line)
      (@time_str, @from, @command, *@args) = line.chomp().split(/\t/)
      case @command
        when "PRIVMSG"
          @from_str = "<#{@from}>"
          @body = @args[0]
          @body_class = "privmsg"
        when "NOTICE"
          @from_str = "(#{@from})"
          @body = @args[0]
          @body_class = "notice"
        when "JOIN"
          @message = "*** #{@from} has joined channel \##{channel}"
        when "PART"
          @message = "*** #{@from} has left channel \##{channel}"
        when "QUIT"
          arg_str = @args[0] ? " (#{@args[0]})" : ""
          @message = "*** #{@from} has left IRC#{arg_str}"
        when "NICK"
          @message = "*** #{@from} is now known as #{@args[0]}"
        when "MODE"
          @message = "*** New mode for \##{channel} by #{@from}: #{@args[0]} #{@args[1]}"
        when "TOPIC"
          @message = "*** New topic on \##{channel} by #{@from}: #{@args[0]}"
        when "KICK"
          arg_str = @args[1] ? " (#{@args[1]})" : ""
          @message = "*** #{@args[0]} was kicked off from \##{channel} by #{@from}#{arg_str}"
        else
          raise("unknown command: #{@command}")
      end
    end
    
    attr_reader(:time_str, :from_str, :body, :message, :body_class)
    
end

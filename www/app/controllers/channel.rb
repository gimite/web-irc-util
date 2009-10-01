#require "uri"


class Channel < Application
    
    def index(channel, format = "html")
      provides(:atom)
      @channel = CGI.unescape(channel)
      @title = "\##{@channel} - irc.gimite.net"
      @atom_url = channel_url(@channel) + ".atom"
      @client_url = "/client?utf8=" + CGI.escape("\##{@channel}")
      @recent_url = "/channel/%s/recent" % CGI.escape(@channel)
      dates = Dir[channel_dir(@channel) + "/*.txt"].
        map(){ |s| str_to_date(s.slice(/(\d+)\.txt/, 1)) }.
        sort().reverse()
      if format == "atom"
        dates.delete(Date.today)
        dates = dates[0, 20]
      end
      @items = []
      for date in dates
        @items.push({
          :date => date,
          :date_str => date_to_str(date),
          :url => archive_url(@channel, date),
          :log => format == "atom" ? load_log(@channel, date, true, 30) : nil,
        })
      end
      render()
    end
    
    def archive(channel, date)
      provides(:txt)
      @channel = CGI.unescape(channel)
      @date = str_to_date(CGI.unescape(date))
      @prev_date = @date - 1
      @prev_date_url = archive_url(@channel, @prev_date)
      @next_date = @date + 1
      @next_date_url = @next_date > Date.today ? nil : archive_url(@channel, @next_date)
      @title = "%s - \#%s - irc.gimite.net" % [@date.strftime("%Y/%m/%d"), @channel]
      @channel_url = channel_url(@channel)
      @text_url = archive_url(@channel, @date) + ".txt"
      @log = load_log(@channel, @date)
      render()
    end
    
    def recent(channel)
      @channel = CGI.unescape(channel)
      @log = load_log(@channel, Date.today, true)
      max_log = 10
      pos = [0, @log.size - max_log].max
      @log = (0...max_log).map(){ |i| @log[pos + i] }
      render(:recent, :layout => false)
    end
    
  private
    
    def channel_url(channel)
      return "/channel/" + CGI.escape(@channel)
    end
    
    def archive_url(channel, date)
      "/channel/%s/archive/%s" % [CGI.escape(channel), date_to_str(date)]
    end
    
    def channel_dir(channel)
      return "../deborah/gimite.net/log/%s" % CGI.escape("\##{@channel}")
    end
    
    def archive_path(channel, date)
      return "%s/%s.txt" % [channel_dir(channel), date_to_str(date)]
    end
    
    def load_log(channel, date, skip_system = false, max_lines = 1.0/0.0)
      path = archive_path(channel, date)
      return [] if !File.exist?(path)
      i = 0
      log = []
      File.foreach(path) do |line|
        message = IRCMessage.new(channel, line)
        next if skip_system && !message.body
        log.push(message)
        i += 1
        break if i >= max_lines
      end
      return log
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
    
    include Merb::AssetsMixin
    
    # Right-to-left override, etc. Removes them to avoid corrupted log rendering.
    UNSAFE_CHARS = /\xE2\x80\x8E|\xE2\x80\x8F|\xE2\x80\xAA|\xE2\x80\xAB|\xE2\x80\xAC|\xE2\x80\xAD|\xE2\x80\xAE/
    
    def initialize(channel, line)
      @raw_line = line.chomp().gsub(UNSAFE_CHARS, "")
      (@time_str, @from, @command, *@args) = @raw_line.split(/\t/)
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
    
    attr_reader(:raw_line, :time_str, :from_str, :body, :message, :body_class)

    def body_html
      return nil if !@body
      e = Regexp.new(%w(/ & =).map(){ |s| CGI.escape(s) }.join("|"), Regexp::IGNORECASE)
      pos = 0
      result = ""
      @body.gsub(URI.regexp("http")) do
        m = Regexp.last_match
        result << CGI.escapeHTML(@body[pos...m.begin(0)])
        url = $&
        result << link_to(CGI.unescape(url.gsub(e){ CGI.escape($&) }), url, {"target" => "_blank"})
        pos = m.end(0)
      end
      result << CGI.escapeHTML(@body[pos..-1])
      return result
    end
    
end

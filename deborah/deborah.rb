#!/usr/local/bin/ruby18

$KCODE= "u"
$stdout.sync= true
$stderr.sync= true

require "kconv"
require "nkf"
require "jcode"
require "date"
require "time"
require "set"
require "cgi"
require "fileutils"
require "rica_gimite"


class Deborah < Rica::MessageProcessor

  def initialize(dir, config_name)
    super()
    @dir = dir
    configs = {}
    config_path = "%s/config%s.txt" % [@dir, config_name ? "-#{config_name}" : ""]
    File.foreach(config_path) do |line|
      (k, v) = line.strip().split(/\s+/, 2)
      configs[k] = v
    end
    @joined = false
    @host = configs["host"]
    @port = configs["port"].to_i()
    @password = configs["password"] || ""
    @nick = configs["nick"]
    @channels = Set.new(File.readlines("#{@dir}/channels.txt").map(){ |s| s.chomp() })
    @self_exp = Regexp.new(configs["self"], Regexp::IGNORECASE)
    @channel_members = {}
    @file_date = nil
    @channel_files = {}
    open([@host, @port, @password, @host], ["deborah", "Bot Deborah"], @nick, "utf8")
  end
  
  def format_date(date)
    return format("%04d%02d%02d", date.year, date.month, date.day)
  end
  
  def format_time(time)
    return format("%02d:%02d:%02d", time.hour, time.min, time.sec)
  end
  
  def write_line(msg, channel = msg.to)
    if !channel
      $stderr.puts("Error: missing channel: %p", msg)
      return
    end
    return if !(channel =~ /\A\#/)
    channel = channel.downcase
    today = Date.today
    if today != @file_date
      @channel_files.clear()
      @file_date = today
    end
    if !@channel_files[channel]
      channel_dir = "%s/log/%s" % [@dir, CGI.escape(channel)]
      date_str = format_date(Date.today)
      FileUtils.mkdir_p(channel_dir)
      @channel_files[channel] = Kernel.open("#{channel_dir}/#{date_str}.txt", "a")
      @channel_files[channel].sync = true
    end
    time_str = format_time(Time.now)
    row = [time_str, msg.fromNick, msg.cmndstr] + msg.args
    line = row.map(){ |s| s && s.gsub(/\t/, " " * 8).gsub(/[\r\n]/, "") }.join("\t")
    @channel_files[channel].puts(line)
    log(msg)
  end
  
  def log(msg)
    row = [Time.now.xmlschema, msg.fromNick, msg.cmndstr] + msg.args
    puts(row.join("\t"))
  end
  
  def save_channels()
    Kernel.open("#{@dir}/channels.txt", "w") do |f|
      f.puts(@channels.to_a().join("\n"))
    end
  end
  
  def notice_log_location(server, channel)
    url = "http://irc.gimite.net/channel/" + CGI.escape(channel.gsub(/^\#/, ""))
    cmnd_notice(server, channel, "このチャンネルのログは #{url} に公開されます。")
  end
  
  def default_action(msg)
    log(msg)
  end

  # auto join
  def on_recv_rpl_motd(msg)
    if !@joined
      for channel in @channels
        cmnd_join(msg.server, channel)
      end
    end
  end

  # respond to join
  def on_recv_cmnd_join(msg)
    @joined = true
    if(msg.isSelfMessage?)
      notice_log_location(msg.server, msg.to)
      @channel_members[msg.to] = Set.new()
    else
      write_line(msg)
      if @channel_members[msg.to]
        @channel_members[msg.to].add(msg.fromNick)
      end
    end
  end

  def on_recv_cmnd_part(msg)
    write_line(msg)
    if @channel_members[msg.to]
      @channel_members[msg.to].delete(msg.fromNick)
    end
  end

  def on_recv_cmnd_quit(msg)
    for channel, members in @channel_members
      if members.include?(msg.fromNick)
        members.delete(msg.fromNick)
        write_line(msg, channel)
      end
    end
  end

  def on_recv_cmnd_nick(msg)
    write_line(msg)
    for channel, members in @channel_members
      if members.include?(msg.fromNick)
        members.delete(msg.fromNick)
        members.add(msg.args[0])
        write_line(msg, channel)
      end
    end
  end
  
  def on_recv_cmnd_mode(msg)
    write_line(msg)
  end

  def on_recv_cmnd_topic(msg)
    write_line(msg)
  end
  
  def on_recv_cmnd_kick(msg)
    if msg.to =~ /^\#/ && msg.args[0] == @nick
      @channels.delete(msg.to)
      save_channels()
    end
    write_line(msg)
  end

  #招待に応じる
  def on_recv_cmnd_invite(msg)
    cmnd_join(msg.server, msg.args[0])
    @channels.add(msg.args[0])
    save_channels()
  end

  # respond to privmsg
  def on_recv_cmnd_privmsg(msg)
    if !msg.isSelfMessage?
      line = msg.args[0].strip()
      called = line=~@self_exp
      direct = !(msg.to=~/^#/)
      respond_to = direct ? msg.fromNick : msg.to
      if (line =~ /(\#.+)に入室/ || line =~ /join\s+(\#.+)/) && direct
        channel = $1.strip()
        if @channels.include?(channel)
          notice_log_location(msg.server, channel)
        else
          cmnd_join(msg.server, channel)
          @channels.add(channel)
          save_channels()
        end
      elsif line =~ /さよう?なら|bye/ && called && !direct
        cmnd_part(msg.server, msg.to)
        @channels.delete(msg.to)
        save_channels()
      elsif (line =~ /^(ログ|ろぐ)$/ || line=~/(ログ|ろぐ).*どこ/) && !direct
        notice_log_location(msg.server, respond_to)
      elsif line =~ /なるとくれ/
        directcommand(msg.server, "MODE #{msg.to} +o #{msg.fromNick}")
      end
    end
    write_line(msg)
  end

  def on_recv_cmnd_notice(msg)
    write_line(msg)
  end
  
  def on_recv_rpl_namreply(msg)
    (channel, names) = msg.args[1..2]
    if @channel_members[channel]
      for name in names.split(/\s+/)
        @channel_members[channel].add(name.gsub(/^[@\+]/, ""))
      end
    end
  end
  
end

if !((1..2)===ARGV.size)
  $stderr.print("Usage: ruby18 deborah.rb DIR [CONFIG_NAME]\n")
  exit(1)
end

deborah = Deborah.new(ARGV[0], ARGV[1])
deborah.thread.join()

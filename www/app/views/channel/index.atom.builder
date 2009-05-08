xml.instruct! :xml, :version=>"1.0"
xml.feed(:xmlns => "http://www.w3.org/2005/Atom") do |feed|
  feed.title @title
  feed.link({
    :type => 'text/html',
    :rel => 'alternate',
    :href => full_url(:channel, :channel => CGI.escape(@channel)),
  })

  for item in @items
    next if item[:log].empty?
    feed.entry do |entry|
      html_url = full_url(:archive, :channel => CGI.escape(@channel), :date => item[:date_str])
      lines = []
      for message in item[:log]
        line = ""
        line << message.time_str << " "
        if message.body
          line << message.from_str << " " << message.body
        else
          line << message.message
        end
        lines.push(line)
      end
      summary = lines.map(){ |s| CGI.escapeHTML(s) }.join("<br/>")
      summary << "<br/><br/><a href='%s' target='_blank'>全部読む...</a>" % html_url
      next_date = item[:date] + 1
      time = Time.local(next_date.year, next_date.month, next_date.day)
      entry.id(item[:date].strftime("%Y-%m-%d"))
      entry.title(item[:date].strftime("%Y/%m/%d"))
      entry.summary(summary, :type => "html")
      entry.issued(time)
      entry.modified(time)
      entry.link({
        :type => "text/html",
        :rel => "alternate",
        :href => html_url,
      })
    end
  end
end

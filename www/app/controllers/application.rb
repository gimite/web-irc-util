class Application < Merb::Controller
    
    if File.exist?("config/google_analytics.txt")
      GOOGLE_ANALYTICS_ID = File.read("config/google_analytics.txt").strip()
    else
      GOOGLE_ANALYTICS_ID = nil
    end
    
end

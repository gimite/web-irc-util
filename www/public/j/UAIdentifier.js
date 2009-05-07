// User Agent Identifier
// Copyright (C) 2006-2007 Magicant (v1.9.2 2007-02-02)

function UAIdentifier() {
	if (typeof(navigator) != "object" || !navigator.userAgent) {
		this.unknown = true;
		return;
	}
	
	var ua = navigator.userAgent;
	var match;
	
	if (typeof(RegExp) == "undefined") {
		if (ua.indexOf("Opera") >= 0) {
			this.opera = true;
		} else if (ua.indexOf("Netscape") >= 0) {
			this.netscape = true;
		} else if (ua.indexOf("Mozilla/") == 0) {
			this.mozilla = true;
		} else {
			this.unknown = true;
		}
		
		if (ua.indexOf("Gecko/") >= 0) {
			this.gecko = true;
		}
		
		if (ua.indexOf("Win") >= 0) {
			this.windows = true;
		} else if (ua.indexOf("Mac") >= 0) {
			this.mac = true;
		} else if (ua.indexOf("Linux") >= 0) {
			this.linux = true;
		} else if (ua.indexOf("BSD") >= 0) {
			this.bsd = true;
		} else if (ua.indexOf("SunOS") >= 0) {
			this.sunos = true;
		}
		return;
	}
	
	/* for Trident/Tasman */
	/*@cc_on
	@if (@_jscript)
		function jscriptVersion() {
			switch (@_jscript_version) {
				case 3.0:  return "4.0";
				case 5.0:  return "5.0";
				case 5.1:  return "5.01";
				case 5.5:  return "5.5";
				case 5.6:
					if ("XMLHttpRequest" in window) return "7.0";
					return "6.0";
				case 5.7:
					return "7.0";
				default:   return true;
			}
		}
		if (@_win16 || @_win32 || @_win64) {
			this.windows = true;
			this.trident = jscriptVersion();
		} else if (@_mac || navigator.platform.indexOf("Mac") >= 0) {
			// '@_mac' may be 'NaN' even if the platform is Mac,
			// so we check 'navigator.platform', too.
			this.mac = true;
			this.tasman = jscriptVersion();
		}
		if (match = ua.match("MSIE ?(\\d+\\.\\d+)b?;")) {
			this.ie = match[1];
		}
	@else @*/
	
	/* for AppleWebKit */
	if (match = ua.match("AppleWebKit/(\\d+(\\.\\d+)*)")) {
		this.applewebkit = match[1];
	}
	
	/* for Gecko */
	else if (typeof(Components) == "object") {
		if (match = ua.match("Gecko/(\\d{8})")) {
			this.gecko = match[1];
		} else if (navigator.product == "Gecko"
				&& (match = navigator.productSub.match("^(\\d{8})$"))) {
			this.gecko = match[1];
		}
	}
	
	/*@end @*/
	
	if (typeof(opera) == "object" && typeof(opera.version) == "function") {
		this.opera = opera.version();
	} else if (typeof(opera) == "object"
			&& (match = ua.match("Opera[/ ](\\d+\\.\\d+)"))) {
		this.opera = match[1];
	} else if (this.ie) {
	} else if (match = ua.match("Safari/(\\d+(\\.\\d+)*)")) {
		this.safari = match[1];
	} else if (match = ua.match("Konqueror/(\\d+(\\.\\d+)*)")) {
		this.konqueror = match[1];
	} else if (ua.indexOf("(compatible;") < 0
			&& (match = ua.match("^Mozilla/(\\d+\\.\\d+)"))) {
		this.mozilla = match[1];
		if (match = ua.match("\\([^(]*rv:(\\d+(\\.\\d+)*).*?\\)"))
			this.mozillarv = match[1];
		if (match = ua.match("Firefox/(\\d+(\\.\\d+)*)")) {
			this.firefox = match[1];
		} else if (match = ua.match("Netscape\\d?/(\\d+(\\.\\d+)*)")) {
			this.netscape = match[1];
		}
	} else {
		this.unknown = true;
	}
	
	if (ua.indexOf("Win 9x 4.90") >= 0) {
		this.windows = "ME";
	} else if (match = ua.match("Win(dows)? ?(NT ?(\\d+\\.\\d+)?|\\d+|XP|ME|Vista)")) {
		this.windows = match[2];
		if (match[3]) {
			this.winnt = match[3];
		} else switch (match[2]) {
			case "2000":   this.winnt = "5.0";  break;
			case "XP":     this.winnt = "5.1";  break;
			case "Vista":  this.winnt = "6.0";  break;
		}
	} else if (ua.indexOf("Mac") >= 0) {
		this.mac = true;
	} else if (ua.indexOf("Linux") >= 0) {
		this.linux = true;
	} else if (match = ua.match("\\w*BSD")) {
		this.bsd = match[0];
	} else if (ua.indexOf("SunOS") >= 0) {
		this.sunos = true;
	}
}

UAIdentifier.prototype.toString = function() {
	var r = "";
	
	if (this.opera) {
		r += "Opera";
		if (this.opera !== true)
			r += ":" + this.opera;
	} else if (this.ie) {
		r += "IE";
		if (this.ie !== this)
			r += ":" + this.ie;
	} else if (this.safari) {
		r += "Safari:" + this.safari;
	} else if (this.konqueror) {
		r += "Konqueror:" + this.konqueror;
	} else if (this.mozilla) {
		r += "Mozilla";
		if (this.mozilla !== true) {
			r += ":" + this.mozilla;
			if (this.mozillarv)
				r += ":" + this.mozillarv;
		}
		if (this.firefox)
			r += ",Firefox:" + this.firefox;
		else if (this.netscape)
			r += ",Netscape:" + this.netscape;
	} else {
		r += "Unknown";
	}
	
	if (this.trident) {
		r += ",Trident";
		if (this.iec !== true)
			r += ":" + this.trident;
	} else if (this.tasman) {
		r += ",Tasman";
		if (this.iec !== true)
			r += ":" + this.tasman;
	} else if (this.gecko) {
		r += ",Gecko";
		if (this.gecko !== true)
			r += ":" + this.gecko;
	} else if (this.applewebkit) {
		r += ",AppleWebKit:" + this.applewebkit;
	}
	
	if (this.windows) {
		r += ",Win";
		if (this.winnt)
			r += "NT:" + this.winnt;
		else if (this.windows !== true)
			r += ":" + this.windows;
	} else if (this.mac) {
		r += ",Mac";
	} else if (this.linux) {
		r += ",Linux";
	} else if (this.bsd) {
		r += "," + ((this.bsd === true) ? "BSD" : this.bsd);
	} else if (this.sunos) {
		r += ",Solaris";
	}
	return r;
};

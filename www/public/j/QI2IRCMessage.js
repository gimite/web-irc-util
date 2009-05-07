// IRCMessage.js IRCメッセージのパースとディスパッチ


function IRCMessage(line){
	var tmp;
	this.line = line;
	this.prefix = "(unknown)";
	this.cmd="";
	this.trail=null;
	this.args=[];

	// parse prefix
	tmp = line.replace( /^:(\S+)\s*/ ,"");
	if( tmp != line ){ line = tmp; this.prefix = RegExp.$1; }

	// parse cmd
	tmp = line.replace( /^(\S+)/,"" );
	if( tmp != line ){ line = tmp; this.cmd = RegExp.$1; }

	// parse trail
	var pos = line.indexOf(" :");
	if(pos != -1 ){
		this.trail = line.substring(pos+2);
		line = line.substr(0,pos);
	}

	// parse arguments
	var list = line.split(" ");
	for(var i=0;i<list.length;++i){
		if(list[i].length>0) this.args.push(list[i]);
	}

	// fix args & trail
	if( this.trail != null ){
		this.args.push(this.trail);
	}else if( this.args.length > 0){
		this.trail = this.args[this.args.length-1];
	}

	this.joinArgs = function(n){
		if(!n){
			if(this.args.length ==0) return "";
			if(this.args.length ==1) return ":"+this.trail;
			this.args[this.args.length-1] = ":"+this.trail;
			var str = this.args.join(" ");
			this.args[this.args.length-1] = this.trail;
			return str;
		}
		var str="";
		for(var i=n;i<this.args.length;++i){
			str += this.args[i]+" ";
		}
		if(str.length) str=str.substr(0,str.length-1);
		return str;
	}
}

function parseChannelName(name){
	if(!name.match(/^[\#\+\&\!]/) ) return null;
	var list = {
		'name':name,
		'short':name,
		'sort':name
	};
	tmp = name.replace( /^\![A-Z0-9]{5}(.+)$/,function(matchtext,sub1){ return "!"+sub1;});
	if(tmp != name ){
		list.short  = tmp;
	}else{
	//	var tmp = name.replace( /^\#(.+):\.jp$/,function(matchtext,sub1){ return "%"+sub1;});
	//	if(tmp != name ){
	//		list.short = tmp;
	//	}
	}
	list.sort = list.short.substring(1).toLowerCase();
	return list;
}

function IRCUserPrefix(name){
	this.long  = name;
	if( ! name.match( /([^\.\!]+)\!([\~\-]?.+?)\@(.+)/ ) ){
		this.valid = false;
		this.name  = name;
	}else{
		this.valid = true;
		this.name  = RegExp.$1;
	}
	this.short = this.name;
	this.sort  = this.name.toLowerCase();
	this.isSameNick = function( who ){
		return this.name.toLowerCase() == who.toLowerCase()
			|| this.long.toLowerCase() == who.toLowerCase()
			;
	}
}

function setParamPrefix(map,pre,name){
	if(name==null || name==""){
		map[pre] = "(empty)";
		map[pre+'s']="(empty)";
		map[pre+'e']="(empty)";
		return;
	}
	var list = parseChannelName(name);
	if( list ){
		// チャンネル名だった
		map[pre] = list.short;
		map[pre+'s']=list.short;
		map[pre+'e']=list.name;
		return;
	}
	var prefix = new IRCUserPrefix(name);
	map[pre]    = (prefix.short ? prefix.short:name);
	map[pre+'s']= (prefix.short ? prefix.short:name);
 	map[pre+'e']= (prefix.long  ? prefix.long :name);
	return;
}

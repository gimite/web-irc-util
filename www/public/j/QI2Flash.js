var QI2Flash_env = { 
	'ready':false, // JacaScriptが準備できたらtrue
	'logger':function(str){} // デバッグ用のロガー
};

// Flashから呼ばれる。JavaScript側の初期化が終わったか確認する
function QI2Flash_ready(){ return QI2Flash_env['ready']; }

// Flashから呼ばれる。エラーレポート
function QI2Flash_say(name,str){
	var obj = QI2Flash_env[name];
	if(obj) obj.logger(str);
}

// Flashからのイベントレポート
function QI2Flash_dataevent(name,type,extra){
	var obj = QI2Flash_env[name];
	if(obj) obj.on_event(type,extra);
}

// コンストラクタ
function QI2Flash(){
	var self = this;

	for(var i=0;i<10;++i){
		var name = "conn"+i;
		if( QI2Flash_env[name] != null ) continue;
		QI2Flash_env[name] = self;
		self.name = name;

		// Flashオブジェクトを探す
		if( navigator.appName.indexOf("Microsoft") != -1 ){
			self.elem = window[name];
		}else{
			self.elem = document[name];
		}

		//接続開始
		self.start = function(charset,serverhost,serverport,policyfile){
			var r = self.elem.conn_start(charset,name,serverhost,serverport,policyfile);
			if(r) say(r);
		};
		// 接続停止
		self.stop = function(){
			var r = self.elem.conn_stop();
			if(r) say(r);
		};
		// サーバへ送信
		self.send = function(line){
			if(self.sendlog) self.sendlog(line);
			var r = self.elem.conn_send(line);
		};
		// イベントハンドラ
		self.on_event = function(type,extra){};
		self.logger = function(str){};

		self.unescapeBackSlash = function(str){
			return str.replace(/%(..)/g,function(match,sub){ return String.fromCharCode( parseInt(sub,16));});
		};

		// テキストの標準化
		self.normalizeString = function(str){ return self.unescapeBackSlash(self.elem.normalizeString(str)); };

		// サウンド関係
		self.addSound = function(name,url){ self.elem.addSound(name,url); };
		self.playSound = function(name){ self.elem.playSound(name); };

		// 後処理
		self.destruct = function(){ QI2Flash_env[name] = null; };
		return;

	}
	// not found
}

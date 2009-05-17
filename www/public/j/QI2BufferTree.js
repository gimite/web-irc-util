/*
  QI2BufferTree.js 
  
  バッファツリー構造の定義
  現在の選択状態
*/

var MAX_NICK_LEN = 40;

// バッファ一覧リストボックス
var lbBuffer = null;

// 現在選択しているバッファ項目
var Selected_node = null;

// クッキーへの自動保存を許可するなら真
var BufferList_allowSave =false;

var NodeMenu = {};


// バッファ一覧リストボックスを作成
function BufferList_create(){
  // ノードメニューを格納する
  var list = ["App","Conn","Channel","Priv"];
  for(var i=0;i<list.length;++i){
    MochiKit.DOM.removeElement( NodeMenu[list[i]] = $("NodeMenu_"+list[i]) );
  }
  lbBuffer = new ListBox( $('bufferlist') ,"bufferrow_off","bufferrow_on" ,BufferList_onSelect);
  lbBuffer.setAlwaysSelect(true);
}

// 選択が変更された際に実行される
function BufferList_onSelect(index,state){
  var node = lbBuffer.getRow(index);
  if( node==null || node.logbuffer == null ) return;
  if(state){
    // 選択された
    Selected_node = node;
    node.logbuffer.show();
    node.memberlist._elem.style.display = 'block';
    node.updateBufferTopic();
    if(node.addMidoku) node.addMidoku();
    MochiKit.DOM.replaceChildNodes("BufferListFooter",NodeMenu[node.nodetype]);
  }else{
    // 選択解除された
    node.memberlist._elem.style.display = 'none';
    node.logbuffer.hide();
    MochiKit.DOM.replaceChildNodes("BufferName");
    MochiKit.DOM.replaceChildNodes("BufferTopic");
    MochiKit.DOM.replaceChildNodes("BufferListFooter");
  }
}

// 指定したノードを選択する
function BufferList_selectNode(node){
  var i = lbBuffer.getRowIndex(node);
  lbBuffer.select( i );
}


// 接続設定、プログラム設定のフォームのイベントから対象ノードを取得する
function findNodeFromEvent(event){
  event = event || window.event;
  var elem = (event.target || event.srcElement);
  while(elem !=null ){
    if( elem.tagName == "FORM" ) return getObjectMap(elem.name);
    elem = elem.parentNode;
  }
}

// バッファ一覧で現在選択中のノードを取得する
function getSelectedNode(){ return Selected_node; }

// 選択中のノードか、その親の接続ノードを取得する
function getSelectedConnNode(){
  var node = Selected_node;
  for(;;){
    if( node==null || node.logbuffer == null ) return null;
    if(node.nodetype == "Conn") return node;
    node = node.parent;
  }
}

// 選択中の会話ノードを取得する
function getSelectedTalkNode(){
  var node = lbBuffer.getRow(index);
  for(;;){
    if( node==null || node.logbuffer == null ) return null;
    if(node.nodetype == "Channel" || node.nodetype == "Priv" ) return node;
    node = node.parent;
  }
}

//////////////////////////////////////
// ノードの共通処理

// ログバッファ中に任意のDOMエケメントをを配置するためのオブジェクト
// LogBufferと似た振る舞いをする
function BufferInner(parent,inner,visible){
  var self = this;
  this.elem = inner;
  this.show = function(){ this.elem.style.display = 'block';};
  this.hide = function(){ this.elem.style.display = 'none' ;};
  if(!visible) this.elem.style.display = 'none';
  MochiKit.DOM.appendChildNodes( parent, this.elem);
}

// バッファ一覧ノードの基本設定
function BufferList_initNode(node,type,name,sortkey,parent,cols){
  node.nodetype = type;
  node.cols = cols;
  node.name = name;
  node.childs = [];
  if(parent!=null){
    node.parent = parent;
    parent.childs.push(node);
  }

  // メンバ一覧
  var memberlist_div = MochiKit.DOM.DIV({'class':'listbox'},null);
  memberlist_div.style.display = 'none';
  MochiKit.DOM.appendChildNodes( $('MemberListContainer'), memberlist_div);
  node.memberlist = new ListBox( memberlist_div,"memberrow_off","memberrow_on");

  // バッファ一覧に追加してデータ保存
  lbBuffer.append(node,sortkey);
  if(AppNode!=null) AppNode.saveSettings();
}

function BufferList_deleteNode(node){
  if(node.parent){
    var list = node.parent.childs;
    for(var i=0;i<list.length;++i){
      if(list[i]==node){
        list.splice(i,1);
        break;
      }
    }
    delete node.parent;
  }
  lbBuffer.remove( lbBuffer.getRowIndex(node));
  MochiKit.DOM.removeElement(node.memberlist._elem);
  MochiKit.DOM.removeElement(node.logbuffer.elem);
  if(AppNode!=null) AppNode.saveSettings();
}


function saveCookie(name,data){
  if(!BufferList_allowSave) return;
  var str ="";
  for(var i in data){
    if( 0==i.indexOf('[')) continue;
    if( data[i] == null ) continue;
    str += escape(i)+"+"+ ( typeof data[i] ).charAt(0)+"+"+escape(data[i])+",";
  }
  if(str.length>0) str = str.substr(0,str.length-1);
  str = "QI2_"+name+"="+str+"; expires=Tue, 31-Dec-2030 23:59:59; ";
  document.cookie = str;
}

function loadCookie(){
  var lines = document.cookie.split("; ");
  var list = [];
  for(var i=0;i<lines.length;++i){
    var kv = lines[i].split('='); // key=value
    if(kv.length!=2) continue;
    var kk = kv[0].split('_');    // QI2_NN
    if( kk.length!=2 ) continue;
    kk[1] = parseInt(kk[1],10);
    if( (typeof kk[1]) != "number" ) continue;
    var sublines = kv[1].split(',');
    var sublist = {};
    for(var j=0;j<sublines.length;++j){
      var cols = sublines[j].split('+');
      cols[0] = unescape(cols[0]);
      cols[2] = unescape(cols[2]);
      if(cols[1]=='s'){
        if(cols.length<3){
          sublist[cols[0]]="";
        }else{
          sublist[cols[0]]=cols[2];
        }
      }else if( cols[1]=='b'){
        sublist[cols[0]]= (cols[2]=='true');
      }else if( cols[1]=='n'){
        sublist[cols[0]]=parseFloat(cols[2]);
      }
    }
    list.push( [ kk[1],sublist] );
  }
  list.sort(function(a,b){ return a[0]-b[0] });
  return list;
}



// 子ノードの設定保存
function saveChildNodes(node,next){
  for(var i=0;i<node.childs.length;++i) next = node.childs[i].saveSettings(next);
  return next;
}

function localEcho(cmd,node,line,bNoAllLog){
//  line = node.parent.normalizeString(line);
  var logparam = {
    '%s':node.parent.name,  //接続名
    '%m':line,              //メッセージ
    '%y':line,              //メッセージ種別
    '%x':cmd                //パラメータ全部
  };
  setParamPrefix(logparam,"%f",node.parent.mynick);
  node.setLogParam("%c",logparam);
  node.setLogParam("%t",logparam);
  if( (node.nodetype=="Channel" ? MessageFormat_Channel:MessageFormat_Private).procLog(logparam,node.logbuffer) ){
    node.addMidoku();
  }
  if(!bNoAllLog) MessageFormat_AllLog.procLog(logparam,logAll);
}

function validateNick(nick){
  if(nick.length == 0){
    alert("ニックネームを入力してください。");
    return false;
  }else if(!nick.match(/^[\\A-Z\u0080-\uffff\[\]\`\_\^\|0-9\-\}\{]+$/i)){
    alert("ニックネームに使えない記号が入っています。");
    return false;
  }else if(nick.match(/^[0-9]/)){
    alert("ニックネームの先頭に数字は使えません。");
    return false;
  }else{
    return true;
  }
}

function generateRandomNick(){
  return "guest-" + nrand(1000);
}

function get774Name(){
  var prefix = "Te Ye We Wo Yi Tha Thi Thu The Tho Fu Hu Yu Wu U Tu Bu Pu Cu Hi".split(" ");
  var vowel  = "a i e o ka ki ku ke ko ca ci ce co sa si su se so za zi zu ze zo ha hy he ho ba bi be bo pa pi pe po fa fi fe fo ta ti to da du de do ga gi gu ge go na ni ne no ma mi me mo ya yo wa wi ra ri ru re ro".split(" ");
  var suffix = "d x t th ph ly ry sk pha phi phu phe pho la li lu le lo di ky n m".split(" ");

  var list = [];
  var len = 0;
  var name = "";
  while( len<4 ){
    var item={};
    if( list.length && list[list.length-1].HasVowel ){
      var i = nrand( vowel.length + suffix.length );
      item.HasVowel = ( i < vowel.length);
      item.text = ( item.HasVowel ? vowel[i] : suffix[i-vowel.length]);
    }else{
      var i = nrand( vowel.length + prefix.length );
      item.HasVowel = ( i < vowel.length);
      item.text = ( item.HasVowel ? vowel[i] : prefix[i-vowel.length]).toLowerCase();
    }
    len += item.text.length;
    list.push( item );
    name += item.text;
  }
  var last = "\\ _ - [ ] { }".split(" ");
  if( len==4 ){
    var text = last[nrand(last.length)];
    name += text;
  }
  return name.substr(0,5);
}


//////////////////////////////////////
// アプリケーションノード

var AppNode  = null; 

function BufferTreeNode_App(sortkey,name,buffer_inner){
  var self = this;

  // バッファペインには設定項目を表示する
  buffer_inner =buffer_inner.cloneNode(true);
  self.logbuffer = new BufferInner('BufferContainer',buffer_inner,false);
  self.config_form = MochiKit.DOM.getFirstElementByTagAndClassName("form",null,buffer_inner);
  self.config_form.name = addObjectMap(self);

  // バッファトピックの表示更新
  self.updateBufferTopic=function(){
    // 上段バッファ名
    MochiKit.DOM.replaceChildNodes("BufferName","- QuickIRC2プログラム設定 -");
    MochiKit.DOM.replaceChildNodes("BufferTopic","プログラム全体の設定を変更します");
  };

  // 設定保存
  self.saveSettings = function(){
    if(!BufferList_allowSave) return;
    // 古いクッキーの削除
    var lines = document.cookie.split("; ");
    for(var i=0;i<lines.length;++i){
      var kv = lines[i].split('='); // key=value
      document.cookie = kv[0]+"=; expire=Tue, 31-Dec-2000 23:59:59; ";
    }
    // 子ノードのデータの保存
    var next = saveChildNodes(self,0);
    // 自ノードのデータの保存
    var settings = { 'type':self.nodetype };
    settings.MessageOnOff_QUIT = self.config_form.MessageOnOff_QUIT.checked;
    settings.MessageOnOff_JOIN = self.config_form.MessageOnOff_JOIN.checked;
    settings.MessageOnOff_NICK = self.config_form.MessageOnOff_NICK.checked;
    settings.MessageOnOff_MODE = self.config_form.MessageOnOff_MODE.checked;
    settings.AutoPrivSelect    = self.config_form.AutoPrivSelect.checked;
    
    for(var i=0,ie=self.config_form.FontSize_LogRow.length;i<ie;++i){
      if( self.config_form.FontSize_LogRow[i].checked ){
        settings.FontSize_LogRow = self.config_form.FontSize_LogRow[i].value;
        break;
      }
    }
    for(var i=0,ie=self.config_form.FontSize_TimeSpan.length;i<ie;++i){
      if( self.config_form.FontSize_TimeSpan[i].checked ){
        settings.FontSize_TimeSpan = self.config_form.FontSize_TimeSpan[i].value;
        break;
      }
    }

    for( var i in self.sound_map ){
      var elem = self.sound_map[i][0];
      settings[ elem.name ] = elem.checked;
    }

    saveCookie( (next++),settings);
  }

  // 設定ロード
  self.loadSettings = function(str){
    var list = loadCookie();
    var info;
    // 行ごとに対象ノードを探索/作成 する
    RowLoop: for(i=0;i<list.length;++i){
      info = list[i][1];
      if( info.type == "App" ) break; // 終端
      if( info.type == 'Conn' ){
        // AppNodeの子供から同じ名前の接続を探す
        for(var j=0;j<self.childs.length;++j){
          var child = self.childs[j];
          if( child.nodetype == info.type
          &&  child.name     == info.name
          ){
            child.loadSettings(info);
            continue RowLoop;
          }
        }
        // 見つからない場合は接続を新しく作る？
        // サーバ設定はユーザ設定に保存されないのでムリ
      }else if(info.type=="Channel" || info.type=="Priv" ){
        // parentの接続の名前で探す
        for(var j=0;j<self.childs.length;++j){
          var conn = self.childs[j];
          if( conn.nodetype == "Conn"
          &&  conn.name ==     info.parent
          ){
            // 接続の子供に名前が一致するものがあるか、なければ作る
            var child = conn.prepareChildNode(info.type,info.name,true,false);
            if(child ){
              child.loadSettings(info);
              continue RowLoop;
            }
          }
        }
      }
      say(info.type+" "+info.name+"の設定をロードできませんでした。");
    }
    if( !info || info.type!="App") return;
    // 自ノードのデータのロード
    var settings = info;
    self.config_form.MessageOnOff_QUIT.checked = settings.MessageOnOff_QUIT;
    self.config_form.MessageOnOff_JOIN.checked = settings.MessageOnOff_JOIN;
    self.config_form.MessageOnOff_NICK.checked = settings.MessageOnOff_NICK;
    self.config_form.MessageOnOff_MODE.checked = settings.MessageOnOff_MODE;
    self.setMessageOnOffElem(self.config_form.MessageOnOff_QUIT);
    self.setMessageOnOffElem(self.config_form.MessageOnOff_JOIN);
    self.setMessageOnOffElem(self.config_form.MessageOnOff_NICK);
    self.setMessageOnOffElem(self.config_form.MessageOnOff_MODE);

    if( settings.AutoPrivSelect !== undefined ){
      self.config_form.AutoPrivSelect.checked = !!settings.AutoPrivSelect;
    }

    for(var i=0,ie=self.config_form.FontSize_LogRow.length;i<ie;++i){
      if( self.config_form.FontSize_LogRow[i].value == settings.FontSize_LogRow ){
        self.config_form.FontSize_LogRow[i].checked=true;
        break;
      }
    }
    for(var i=0,ie=self.config_form.FontSize_LogRow.length;i<ie;++i){
      if( self.config_form.FontSize_LogRow[i].checked){
        self.changeStyleSheet('.logrow','fontSize',self.config_form.FontSize_LogRow[i].value);
        break;
      }
    }
    for(var i=0,ie=self.config_form.FontSize_LogRow.length;i<ie;++i){
      if( self.config_form.FontSize_TimeSpan[i].value == settings.FontSize_TimeSpan ){
        self.config_form.FontSize_TimeSpan[i].checked=true;
        break;
      }
    }
    for(var i=0,ie=self.config_form.FontSize_LogRow.length;i<ie;++i){
      if( self.config_form.FontSize_TimeSpan[i].checked){
        self.changeStyleSheet('.logparams','fontSize',self.config_form.FontSize_TimeSpan[i].value);
        break;
      }
    }
    for( var i in self.sound_map ){
      var elem = self.sound_map[i][0];
      if( settings[ elem.name ] === undefined ) continue;
      elem.checked = settings[ elem.name ];
    }
  }

  // 起動時の自動接続開始
  self.procAutoConnect = function(){
    for(var j=0;j<self.childs.length;++j){
      var child = self.childs[j];
      if( child.nodetype== "Conn" 
      &&  child.config_form.autoConnect.checked
      ){
        child.startConnection(true);
      }
    }
  }

  // ユーザ入力の処理
  self.onUserInput =function(type,line){
    if( type==5 ){
      for(var j=0;j<self.childs.length;++j){
        var conn = self.childs[j];
        if( conn.nodetype== "Conn" ){
          for(var k=0;k<conn.childs.length;++k){
            var child = conn.childs[k];
            if( child.nodetype=="Channel" ) child.onUserInput(1,line);
          }
        }
      }
      return true;
    }
    say("アプリケーションノードに発言することはできません");
    return false;
  };

  self.deleteMe = function(){
    say("アプリケーションノードは削除できません");
  };

  self.setMessageOnOff = function(event){
    event = event || window.event;
    var elem = (event.target || event.srcElement);
    self.setMessageOnOffElem(elem);
    AppNode.saveSettings();
  }
  self.setMessageOnOffElem = function(elem){
    var cmd = elem.value;
    var onoff = elem.checked;
    // say("setMessageOnOff cmd="+cmd+" onoff="+onoff);
    MessageFormat_AllLog.onoff(cmd,onoff);
    MessageFormat_Private.onoff(cmd,onoff);
    MessageFormat_Channel.onoff(cmd,onoff);
  }


  self.rulemap={};
  self.changeStyleSheet = function(className,styleName,value){
    var sheetlist=document.styleSheets;
    if( document.styleSheets ){
      for(var i=0,ie=document.styleSheets.length;i<ie;++i){
        var sheet = document.styleSheets[i];
        // ルールコレクション
        var rules = sheet.rules || sheet.cssRules;
        if( self.rulemap[className] == null ){
          for (var j = 0, jMax = rules.length; j < jMax; j++){
            var rule = rules[j];
            if( rule.selectorText == className ){
              self.rulemap[className] = j;
              break;
            }
          }
        }
        if( self.rulemap[className] != null ){
          var rule = rules[self.rulemap[className]];
          // say("sheet="+sheet.href+" rule="+rule.selectorText+" styleName="+styleName+" newvalue="+value);
          rule.style[styleName] = value;
        }
      }
    }
    AppNode.saveSettings();
  }

  self.sound_map = {};
  self.addSound=function(key,url,caption){
    var div = MochiKit.DOM.getFirstElementByTagAndClassName(null,"sound_config",self.config_form);
    var elem = MochiKit.DOM.INPUT({'type':'checkbox','name':"Sound_"+key,'value':key,'onClick':"AppNode.setSoundOnOff(this)",'checked':true},null)
    MochiKit.DOM.appendChildNodes(div,elem,caption+"　");
    self.sound_map[key] = [ elem,url ];
  };
  self.setSoundOnOff =function(elem){
    self.saveSettings();
  };

  self.checkSoundSetting =function(name){
    var o = self.sound_map[name];
    return o && o[0].checked;
  };

  // ノードを初期化
  BufferList_initNode(self,"App",name,sortkey,null,[
    MochiKit.DOM.IMG({'class':'listicon',src:"i/bt_root.png"},null),
    MochiKit.DOM.SPAN({'class':"listname"},name+" プログラム設定")
  ]);
}



////////////////////////////////////////
// 接続ノード

function BufferTreeNode_Conn(sortkey,name,buffer_inner){
  var self = this;

  // バッファペインには設定項目を表示する
  buffer_inner =buffer_inner.cloneNode(true);
  self.logbuffer = new BufferInner('BufferContainer',buffer_inner,false);
  self.config_form = MochiKit.DOM.getFirstElementByTagAndClassName("form",null,buffer_inner);
  self.config_form.name = addObjectMap(self);

  var clist_table = self.config_form.getElementsByTagName('table')[1];
  var SearchText  = self.config_form.SearchText;

  self.scrollToChannelList = function(){
    var elem = buffer_inner;
    var h3 = MochiKit.DOM.getFirstElementByTagAndClassName(null,"ChannelListHeader",elem);
    elem.scrollTop = h3.offsetTop -64;
  }
  
  self.sortableManager = new SortableManager(); 
  self.sortableManager.initWithTable(clist_table);
  self.reloadChannelList = function(){
    if(! self['chanlist_url'] ){
      say("チャンネル一覧URLが設定されていません");
      return;
    }

    var req;
    if( window.XMLHttpRequest ){
      req = new window.XMLHttpRequest();
    }else if(window.ActiveXObject){
      try{
        req = new ActiveXObject("Msxml2.XMLHTTP");
      }catch(e){
        try{
          req = new ActiveXObject("Microsoft.XMLHTTP");
        }catch(e2){
        }
      }
    }
    if(!req){
      say("この環境ではXMLHttpRequestを使えません");
      return;
    }
    var url = self.chanlist_url+"?"+Math.random();
    self.say("get "+url);
    try{
      req.open("GET",url,true);
      req.onreadystatechange = function(){
        if(req.readyState!=4) return;
        return self.parseChannelList(req);
      }
      req.send(null);
    }catch(e){
      for(var i in e) self.say("getChannelList: "+i+":"+e[i]);
    }
  }
  self.parseChannelList = function(req ){
    if(req.status >= 300 ){
      say("error: "+req.statusText);
    }
    SearchText.value="";
    self.sortableManager.loadChannelList(req);
    var info = req.responseXML.getElementsByTagName('info')[0];
    if(!info ){
      say("chis list has no <info> node");
    }else{
      var list = MochiKit.DOM.getElementsByTagAndClassName(null,"serverinfo", self.config_form );
      MochiKit.DOM.replaceChildNodes(list[1],"ユーザ数:"+info.getAttribute("users"));
      MochiKit.DOM.replaceChildNodes(list[2],"チャンネル数:"+info.getAttribute("channels")+"(公開"+info.getAttribute("public_channels")+",非公開"+info.getAttribute("non_public_channels")+")");
      var lastupdate_elem = MochiKit.DOM.getFirstElementByTagAndClassName(null,'lastupdate',list[0]);
      MochiKit.DOM.replaceChildNodes(lastupdate_elem,info.getAttribute("updatestr"));
    }
  };

  self.btnSearch_Clicked = function(clear){
    if(clear) SearchText.value="";
    self.sortableManager.isearch( SearchText.value );
  };

  // 各種ログ表示のprefix
  self.logPrefix="("+name+")";
  self.say = function(str){ say(self.logPrefix+str); }

  self.config_form.nick.value = generateRandomNick();

  // バッファトピックの表示更新
  self.updateBufferTopic=function(){
    MochiKit.DOM.replaceChildNodes("BufferName","接続設定");
    var eTopic = $();
    MochiKit.DOM.replaceChildNodes("BufferTopic","IRC接続に関する設定を変更します");
  };

  // サーバの文字コード
  self.conn_charset="ISO-2022-JP-IRC";
  self.setCharset =function(str){ self.conn_charset=str; }

  self.changeNick = function(){
    var nick = self.config_form.nick.value;
    self.conn.send("NICK :"+ nick);
    AppNode.saveSettings();
  }

  // サーバ設定を追加
  self.addServer = function(name,server,port,crossdomain_url,checked){
    var select = this.config_form.serverlist;
    var i = select.length++;
    var o = select.options[ i ];
    o.text  = name;
    if( crossdomain_url ){
      o.value = server+" "+port+" "+crossdomain_url;
    }else{
      o.value = server+" "+port;
    }
    if(checked) select.selectedIndex = i;
  };

  // dispatchIRCMessage  から呼ばれる
  self.printIfNotRawLog = function(line){
    if(! self.config_form.showRawLog.checked ) self.say("s>"+line);
  }

  self.realname = ( navigator && navigator.userAgent ? navigator.userAgent : "unknown browser");

  // 接続オブジェクトの作成
  self.conn = new QI2Flash();
  self.conn.logger  = function(str ){ if( self.config_form.showFlashLog.checked) self.say("Flash>"+str); };
  self.conn.sendlog = function(line){ if( self.config_form.showRawLog  .checked) self.say("C>"   +line); };
  self.conn.on_event = function(type,extra){
    try{
      switch(type){
      case "Connect":
        // Connect直後の処理
        self.say("接続しました。");
        var pass = self.config_form.conn_passwd.value;
        var nick = self.config_form.nick.value;
        if(dnl(pass)) conn.send("PASS :"+pass);
        self.conn.send("NICK :"+ nick);
        self.conn.send("USER QuickIRC2 4 * :"+self.realname);
        self.say("応答を待ちます…");
        self.cols[1].src = "i/bt_conn2.png";
        break;
      case "Close":
        // Disconnect直後の処理
        self.cols[1].src = "i/bt_conn1.png";
        self.say("接続が切れました。");
        for(var k=0;k<self.childs.length;++k){
          var child = self.childs[k];
          localEcho("OnDisconnect",child,"接続が切れました。",true);
          if( child.nodetype == "Channel" ){
            child.removeMember();
            child.setIn(false,true);
          }
        }
        break;
      case "SocketData":
        // 受信データの処理
        if(extra){
          extra = self.conn.unescapeBackSlash(extra);
          if(self.config_form.showRawLog.checked) say(self.logPrefix+"S>"+extra);
          var msg = new IRCMessage(extra);
          self.dispatchIRCMessage(msg);
        }
        return;
      default:
        // その他エラーなど
        self.say("接続エラー:"+name+","+type+","+extra);
      }
    }catch(e){
      if( typeof(e) == "string"){
        self.say(e);
      }else{
        for(var i in e) self.say("onSocketEvent: "+i+":"+e[i]);
      }
    }
  };

  // サウンド設定のロード
  {
    var map = AppNode.sound_map;
    for(var i in map ){
      self.conn.addSound( i,map[i][1] );
    }
  }

  self.playSound = function(name){
    if(! AppNode.checkSoundSetting(name) ) return;
    try{
      self.conn.playSound(name);
    }catch(e){
      self.say(e);
    }
  };
  self.normalizeString = function(str){
    return self.conn.normalizeString(str);
  };

  // 接続を開始する
  self.startConnection = function(){

    // ニックネームを検証
    var nick = self.config_form.nick.value;
    if( self.config_form.nick.value.length == 0){
      nick = self.config_form.nick.value = generateRandomNick();
    }
    if (!validateNick(nick)) return;

    // 可能なら設定を保存
    AppNode.saveSettings();

    // サーバの選択
    var serverhost;
    var serverport;
    var crossdomainurl;

    // サーバリストを読む
    var select = self.config_form.serverlist;
    var i = select.selectedIndex;
    if( i< 0 || i>= select.options.length ) i = 0;
    for(;;){
      var value = select.options[ i ].value;
      if( value == "#random"){
        i = nrand(select.options.length);
        continue;
      }
      var list = value.split(" ");
      serverhost = list[0];
      serverport = (list.length >1 ? list[1] : 6667);
      crossdomainurl = (list.length >2 ? list[2] : null);
      break;
    }
    self.conn.start(self.conn_charset,serverhost,serverport,crossdomainurl);
  };

  // 接続を停止する
  self.stopConnection = function(){
    self.conn.stop();
    AppNode.saveSettings();
  };


  self.joinAlt= function(a){ self.sendCommand("JOIN "+a.getAttribute('alt')); }


  // コマンドを送信する
  self.sendCommand = function(line){ self.conn.send(line); }

  // ユーザ入力の処理
  self.onUserInput =function(type,line){
    if( type==5 ) return AppNode.onUserInput(type,line);
    if( type==0 ){
      self.say(">>"+line);
      self.sendCommand(line);
      return true;
    }
    self.say("接続バッファに発言することはできません");
    return false;
  }
  
  self.changeMyNick = function(nick){
    self.config_form.nick.value = nick;
    AppNode.saveSettings();
    if (nick != self.mynick){
      self.conn.send("NICK :"+ nick);
    }
  }

  self.getMyNick = function(){
    return self.mynick;
  }

  self.onMyNickChanged = function(nick){
    self.mynick = nick;
    if (nick != $('taNick').value) $('taNick').value = nick;
  }

  // 設定保存
  self.saveSettings = function(next){
    var settings = { 'name':self.name, 'parent':self.parent.name ,'type':self.nodetype};

    settings.nick = self.config_form.nick.value;
    settings.conn_passwd = self.config_form.conn_passwd.value;
    settings.autoConnect = self.config_form.autoConnect.checked;
    settings.showFlashLog = self.config_form.showFlashLog.checked;
    settings.showRawLog = self.config_form.showRawLog.checked;

    var select = self.config_form.serverlist;
    var i = select.selectedIndex;
    if( i >= 0 && i < select.options.length ) settings.server = select.options[i].text;

    saveCookie( (next++),settings);
    return saveChildNodes(self,next);
  }

  // 設定ロード
  self.loadSettings = function(settings){
    self.config_form.nick.value = settings.nick;
    self.config_form.conn_passwd.value = settings.conn_passwd;
    self.config_form.autoConnect.checked = settings.autoConnect;
    self.config_form.showFlashLog.checked = settings.showFlashLog;
    self.config_form.showRawLog.checked = settings.showRawLog;

    if( settings.server ){
      var select = self.config_form.serverlist;
      for(var i=0;i<select.options.length;++i){
        if( select.options[i].text == settings.server ){
          select.selectedIndex = i;
          break;
        }
      }
    }
  };

  // 初期参加チャンネルの追加
  self.addInitializeChannel = function(str){
    var list = parseChannelName(str);
    if(list){
      self.prepareChildNode("Channel",str,true,false);
    }else{
      self.prepareChildNode("Priv",str,true,false);
    }
  };
  self.addChannelUI = function(){
    var name =self.config_form.channelName.value;
    var list = parseChannelName(name);
    if(list){
      self.prepareChildNode("Channel",list.name,true,false);
    }else{
      self.prepareChildNode("Priv",name,true,false);
    }
    self.config_form.channelName.value = "";
  }

  // 子ノードの検索
  self.prepareChildNode = function( type,name,bCreate,bIn){
    // TODO 長いチャンネル名や短いチャンネル名のノーマライズ
    for(var k=0;k<self.childs.length;++k){
      var child = self.childs[k];
      if( child.nodetype == type && child.isMe( name ) ){
        if(bIn && type=="Channel") child.setIn(true);
        return child;
      }
    }
    if( !bCreate ) return null;

    // ないので新しく作る
    if(type=="Priv"){
      var node = new BufferTreeNode_Priv(name,self);
      if(BufferList_allowSave && AppNode.config_form.AutoPrivSelect.checked) BufferList_selectNode(node);
      return node;
    }else{
      var channel = new BufferTreeNode_Channel(name,self);
      if(bIn) channel.setIn(true);
      return channel;
    }
  }

  self.procAutoJoin=function(){
    for(var k=0;k<self.childs.length;++k){
      var child = self.childs[k];
      if( child.nodetype == "Channel"){
        self.conn.send("JOIN "+child.longname );
      }
    }
  };

  self.dispatchIRCMessage = function(msg){
    var targets = [];
    var logparam = {
      '%s':self.name,       //接続名
      '%m':msg.trail,       //メッセージ
      '%y':msg.joinArgs(),         //メッセージ種別
      '%x':msg.cmd,  //パラメータ全部
      '%c':"-context-",       //コンテキスト の名前
      '%cs':"-contextshort-", //コンテキスト の短い名前
      '%ce':"-contextlong-",  //コンテキスト チャンネル名の場合はEscapedName ユーザの場合はprefix
      '%f':"-from-",        //送信者(from) の表示名
      '%fs':"-fromshort-",  //送信者(from) の短い名前
      '%fe':"-fromlong-",   //送信者(from) チャンネル名の場合はEscapedName ユーザの場合はprefix
      '%t':"-to-",        //ニックネーム変更前またはプリブ先 の名前
      '%ts':"-toshort-",  //ニックネーム変更前またはプリブ先 の短い名前
      '%te':"-tolong-"    //ニックネーム変更前またはプリブ先 チャンネル名の場合はEscapedName
    };
    var ignore = false;
    setParamPrefix(logparam,"%f",msg.prefix);
    switch(msg.cmd){
    case "433":
      // :juggler.jp 433 * tateQI2 :Nickname is already in use.
      var nick = self.config_form.nick.value;
      self.nickSuffix = self.nickSuffix ? self.nickSuffix + 1 : 1;
      var suffixLen = self.nickSuffix.toString().length;
      if (nick.length + suffixLen > MAX_NICK_LEN){
        nick = nick.substr(0, MAX_NICK_LEN - suffixLen);
      }
      nick += self.nickSuffix;
      self.conn.send("NICK :"+ nick);
      break;
    case "464": // ERR_PASSWDMISMATCH ":Password incorrect"
    case "431": // ERR_NONICKNAMEGIVEN ":No nickname given"
    case "463": // ERR_NOPERMFORHOST ":Your host isn't among the privileged"
      // 認証エラー、切断する
      self.conn.stop();
      break;

    case "432": // ERR_ERRONEUSNICKNAME "<nick> :Erroneous nickname"
      $('taNick').value = self.mynick;
      break;

    case "001":
      self.conn.send("MODE " + msg.args[0] + " +h");  // Hides host name
      self.onMyNickChanged(msg.args[0]);
      self.playSound("OnConnect");

      break;
    case "PING":
      self.conn.send("PONG "+msg.joinArgs());
      break;
    case "422": // no motd
    case "376": // End of MOTD 
      self.procAutoJoin();
      break;
    case 'JOIN':
      var channel = self.prepareChildNode("Channel",msg.args[0],true,true);
      channel.updateLongname( msg.args[0] );
      var prefix = new IRCUserPrefix(msg.prefix);
      channel.prepareMember(prefix,"");
      targets.push(channel);
      break;
    case 'NICK':
      var prefix = new IRCUserPrefix(msg.prefix);
      setParamPrefix(logparam,"%t",msg.args[0]);

      // 子ノードの変更
      for(var k=0;k<self.childs.length;++k){
        var child = self.childs[k];
        if( child.procChangeNick(prefix,msg.args[0]) ){
          targets.push(child);
        }
      }
      // 自分のニックネームを更新する
      if( prefix.isSameNick( self.mynick ) ) self.onMyNickChanged(msg.args[0]);
      break;
    case "PART": // チャンネルから退出
      //:tateSV3!~ProbooBcQw@155.163.192.61.tokyo.global.alpha-net.ne.jp PART !WG1HKじゃばすくりぷと :so long
      var channel = self.prepareChildNode("Channel",msg.args[0],false,false);
      if( channel ){
        targets.push(channel);
        channel.updateLongname( msg.args[0] );
        var prefix = new IRCUserPrefix(msg.prefix);
        var bMyself = prefix.isSameNick( self.mynick );
        if( bMyself ){
          channel.removeMember(); // 参加者を全てクリア
          channel.setIn(false); // 参加状態をクリア
        }else{
          channel.removeMember(prefix); // 対象の参加者情報をクリア
        }
      }
      break;
    case "KICK":
      //:WiZ!jto@tolsun.oulu.fi KICK #Finnish John :comment
      var channel = self.prepareChildNode("Channel",msg.args[0],false,false);
      setParamPrefix(logparam,"%t",msg.args[1]);
      if( channel ){
        targets.push(channel);
        channel.updateLongname( msg.args[0] );
        var target = new IRCUserPrefix(msg.args[1]);
        var bMyself = target.isSameNick( self.mynick );
        if( bMyself ){
          channel.removeMember(); // 参加者を全てクリア
          channel.setIn(false); // 参加状態をクリア
        }else{
          channel.removeMember(target); // 対象の参加者情報をクリア
        }
      }
      break;

    case "QUIT": // ユーザの接続終了
      // :tateSV3!~ProbooBcQw@155.163.192.61.tokyo.global.alpha-net.ne.jp QUIT :BluntIRC終了
      var prefix = new IRCUserPrefix(msg.prefix);
      var bMyself = prefix.isSameNick( self.mynick );
      // 子ノードの変更
      for(var k=0;k<self.childs.length;++k){
        var child = self.childs[k];
        if( child.procQuit(prefix,bMyself) ) targets.push(child);
      }
      break;
    case "331": // :juggler.jp 331 tateQI2 !YFHJOじゃばすくりぷと :No topic is set.
      var channel = self.prepareChildNode("Channel",msg.args[1],false,false);
      if( channel ){
        channel.setTopic("");
        targets.push(channel);
      }
      break;
    case "332": // topic reply
      //:juggler.jp 332 tateQI2 #ニュース速報 :↓ニュース見てあーだこーだ
      var channel = self.prepareChildNode("Channel",msg.args[1],false,false);
      if( channel ){
        channel.setTopic(msg.trail);
        targets.push(channel);
      }
      break;
    case "TOPIC": // topc is set.
      // :tateQI2!~Sslv5jCwAM@155.163.192.61.tokyo.global.alpha-net.ne.jp TOPIC !WG1HKじゃばすくりぷと :あああ
      var channel = self.prepareChildNode("Channel",msg.args[0],false,false);
      if( channel ){
        channel.setTopic(msg.trail);
        targets.push(channel);
      }
      break;
    case "353": // names reply
      // :juggler.jp 353 tateQI @ !WG1HKじゃばすくりぷと :tateQI @tateisu
      // 引数2: channel type. '@'=secrets '*'=private '='=public
      // 引数3: チャンネル名
      // 引数4: 空白区切りでメンバを示す
      var channel = self.prepareChildNode("Channel",msg.args[2],false,false);
      targets.push(channel);
      var list = msg.args[3].split(" ");
      for(var i=0;i<list.length;++i){
        if( list[i].match( /^([\@\+]*)(.+)/ ) ){
          var mode = RegExp.$1;
          var prefix = new IRCUserPrefix(RegExp.$2);
          channel.prepareMember(prefix,mode);
        }
      }
      break;
    case "366":// end of names list.
      // :juggler.jp 366 tateQI !WG1HKじゃばすくりぷと :End of NAMES list.
      break;
    case "324": // モードクエリ応答
      // :juggler.jp 324 tateQI2IE #ロビー +tn 
      msg.args.splice(0,1);
      // fall thru
    case 'MODE':
      setParamPrefix(logparam,"%c",msg.args[0]);
      // ユーザモード変更の場合はコマンド種別を変更する
      var list = parseChannelName(msg.args[0]);
      if(list==null){
        msg.cmd = logparam["%x"]="MODEu";
      }else{
        // :Yazawa!~vwYPm4k4tM@p92bac3.tokynt01.ap.so-net.ne.jp MODE #おもしろネタ速報 +o NEP 
        logparam['%m'] = msg.joinArgs(1);

        var channel = self.prepareChildNode("Channel",msg.args[0],false,false);
        if(channel){
          targets.push(channel);
          channel.applyModeChange(msg.args);
        }
      }
      break;
    case "PRIVMSG":
      self.playSound("PRIVMSG");
      // fall thru
    case "NOTICE":
      setParamPrefix(logparam,"%f",msg.prefix);

      if( msg.trail.match( /\x01ACTION\s*([^\x01]*)\x01/) ){
        logparam["%m"]=msg.trail=RegExp.$1;
        logparam["%x"]=msg.cmd= "CTCP_ACTION";
      }

      // チャンネルあて
      var list = parseChannelName(msg.args[0]);
      if(list!=null){
        setParamPrefix(logparam,"%c",msg.args[0]);
        var channel = self.prepareChildNode("Channel",msg.args[0],true,false);
        if(channel) targets.push(channel);
        ignore = channel.checkIgnore(msg.prefix);
        break;
      }
      // サーバ宛て
      if( -1 != msg.args[0].indexOf(".")  ){
        setParamPrefix(logparam,"%c",msg.args[0]);
        break;
      }

      // ユーザ間のトーク
      msg.cmd = logparam["%x"]=msg.cmd + "_u";
      var bufname = (self.mynick!=msg.args[0]?msg.args[0]:msg.prefix);
      var context = self.prepareChildNode("Priv",bufname,true,true);
      setParamPrefix(logparam,"%t",msg.args[0]);
      if(context){
        targets.push(context);
        ignore = context.checkIgnore();
      }
    case "325": // 325 RPL_UNIQOPIS "<channel> <nickname>"
    case "346": // 346 RPL_INVITELIST "<channel> <invitemask>"
    case "347": // 347 RPL_ENDOFINVITELIST "<channel> :End of channel invite list"
    case "348": // RPL_EXCEPTLIST "<channel> <exceptionmask>"
    case "349": // RPL_ENDOFEXCEPTLIST "<channel> :End of channel exception list"
    case "367": // RPL_BANLIST "<channel> <banmask>"
    case "368": // RPL_ENDOFBANLIST "<channel> :End of channel ban list"
    case "341": // 341 RPL_INVITING "<channel> <nick>"
      // 対象チャンネルに表示
      var channel = self.prepareChildNode("Channel",msg.args[0],false,false);
      if(channel) targets.push(channel);
      break;
    case "INVITE":
      // :Angel!wings@irc.org INVITE Wiz #Dust
      self.procInviteMessage(msg.prefix,msg.args[1]);
      break;
    }
    if(ignore) return;

    // メッセージを整形してログに出力する
    for(var i=0;i<targets.length;++i){
      var node = targets[i];
      node.setLogParam("%c",logparam);
      if( (node.nodetype=="Channel"?MessageFormat_Channel:MessageFormat_Private).procLog(logparam,node.logbuffer) ){
        node.addMidoku();
      }
    }
    MessageFormat_AllLog.procLog(logparam,logAll);
  }

  self.procInviteMessage = function(from,channel){
    from = new IRCUserPrefix(from);
    channel = parseChannelName(channel);
    if(!channel) return;

    var d = new Date();
    var h = "00"+d.getHours();
    var m = "00"+d.getMinutes();
    var timestr = h.substr(h.length-2,2)+":"+m.substr(m.length-2,2);
    var row = [ false,'DIV',{"class":"logrow"}
      ,[ false,'SPAN',{'class':'logparams'},timestr]
      ,[ false,'SPAN',{'class':'logsenderpre'},' ' ]
      ,[ false,'SPAN',{'class':'inviteA'},from.short+" さんがあなたを「"+channel.short+"」に招待しました。"]
      ,[ false,'A',{'class':'inviteB','href':'#','onclick':function(){ self.conn.send("JOIN "+channel.name);return false;}},"参加するならここをクリックしてください"]
    ];
    logAll.addLogV( row);
  }

  // ノードの初期化
  BufferList_initNode(self,"Conn",name,sortkey,AppNode,[
    MochiKit.DOM.SPAN({'class':"listindent8"},""),
    MochiKit.DOM.IMG({'class':'listicon',src:"i/bt_conn1.png"},null),
    MochiKit.DOM.SPAN({'class':"listname"},name+" 接続設定")
  ]);
}

// pageSetupから呼ばれる
function createConnectionNode(sortkey,name,dom_template){
  return new BufferTreeNode_Conn(sortkey,name,dom_template);
}

////////////////////////////////////////

// チャンネルノード
function BufferTreeNode_Channel(nameinfo,conn_node){
  var self = this;

  var list = parseChannelName(nameinfo);
  if(list){
    self.name     = list.short;
    self.longname = list.name;
  }else{
    self.name = name;
    self.longname = name;
  }
  var sortkey = conn_node.sortkey+" "+ self.name.substring(1).toLowerCase();

  self.updateLongname = function(newname){
    self.longname = newname;
  };

  self.isMe = function( name ){
    var list = parseChannelName(name);
    if(list) return self.longname.toLowerCase() == list.name.toLowerCase()
      ||    self.name.toLowerCase()     == list.short.toLowerCase();
    return self.name.toLowerCase()     == name.toLowerCase();
    // TODO: 本当はフィンランド風ケースを考慮しないといけない
  }

  // バッファペインにログを表示する
  this.logbuffer = new LogBuffer('BufferContainer',false);

  // バッファトピック情報の更新
  self.topic = "";
  this.updateBufferTopic=function(){
    // 上段バッファ名
    //MochiKit.DOM.replaceChildNodes($("BufferName"),self.name+" - "+self.parent.name);
    MochiKit.DOM.replaceChildNodes($("BufferName"),self.name);
    // 上段トピック
    var eTopic = $("BufferTopic");
    MochiKit.DOM.replaceChildNodes(eTopic);
    autoLink(eTopic,self.topic);
  };

  self.setLogParam = function(pre,param){
    param[pre] = self.name;
    param[pre+'s'] = self.name;
    param[pre+'e'] = self.name;
  }

  self.applyModeChange = function(args){
    var channel = args.shift();
    var fmt = args.shift();
    var change = 0;
    for(var i=0;i<fmt.length;++i){
      switch(fmt.charAt(i)){
      case '+': change= 1; continue;
      case '-': change= -1; continue;
      case 'o':
        var nick = args.shift();
        if(nick){
          var member = self.membermap[ nick.toLowerCase() ];
          if(member && change){
            self.setMemberMode(member,"@",(change>0?true:false));
            self.updateMemberIcon(member);
          }
        }
        continue;
      case 'v':
        var nick = args.shift();
        if(nick){
          var member = self.membermap[ nick.toLowerCase() ];
          if(member && change ){
            self.setMemberMode(member,"+",(change>0?true:false));
            self.updateMemberIcon(member);
          }
        }
        continue;
      default:
        continue;
      }
    }
  }

  self.setTopic = function(line){
    self.topic = line;
    if(Selected_node == self) self.updateBufferTopic();
  }

  self.membermap = {};
  self.prepareMember = function(prefix,mode){
    var member = self.membermap[ prefix.name.toLowerCase() ];
    if( member == null ){
      member = {
        'cols':[MochiKit.DOM.IMG({'class':'listicon',src:"i/m_trans.png"},null),MochiKit.DOM.SPAN({'class':"listname"},prefix.name)],
        'name':prefix.name,
        'mode':""
      };
      self.memberlist.append(member, prefix.name.toLowerCase() );
      self.membermap[ prefix.name.toLowerCase() ] = member;
    }
    self.setMemberMode(member,'@',( -1 != mode.indexOf("@")));
    self.setMemberMode(member,'+',( -1 != mode.indexOf("+")));
    self.updateMemberIcon(member);
  };

  self.getMemberMode =function(member,char){
    return ( -1 != member.mode.indexOf("char"));
  }
  self.setMemberMode =function(member,char,onoff){
    // onoff は true,false,null で、nullだとトグル動作
    var tmp = member.mode.split(char).join('');
    if( tmp != member.mode ){
      // ONだった場合、onoffがtrue以外ならOFFにする
      if(onoff === true ) return;
      member.mode = tmp;
    }else{
      // OFFだった場合、onoffがfalse以外ならONにする
      if(onoff === false ) return;
      member.mode += char;
    }
  }

  self.updateMemberIcon = function(member){
         if( -1 != member.mode.indexOf("x")) member.cols[0].src = "i/m_ignore.png";
    else if( -1 != member.mode.indexOf("@")) member.cols[0].src = "i/m_naruto.png";
    else if( -1 != member.mode.indexOf("+")) member.cols[0].src = "i/m_plus.png";
    else member.cols[0].src = "i/m_trans.png";
  }

  self.procChangeNick = function(old_prefix,new_nick){
    var member = self.membermap[ old_prefix.name.toLowerCase() ];
    if(member != null ){
      member.name = new_nick;
      var sortkey = new_nick.toLowerCase();
      MochiKit.DOM.replaceChildNodes(member.cols[1],member.name);
      self.memberlist.setSortKey(self.memberlist.getRowIndex(member),sortkey);
      delete self.membermap[ old_prefix.name.toLowerCase() ];
      self.membermap[ new_nick.toLowerCase() ] = member;
      return true;
    }
    return false;
  };

  self.removeMember = function(prefix){
    if(prefix){
      var member = self.membermap[ prefix.name.toLowerCase() ];
      if(member != null ){
        delete self.membermap[ member.name.toLowerCase() ];
        self.memberlist.remove(self.memberlist.getRowIndex(member));
        return true;
      }
      return false;
    }
    // 全員消去
    for(var i = self.memberlist.count()-1;i>=0;--i){
      var member = self.memberlist.getRow(i);
      delete self.membermap[ member.name.toLowerCase() ];
      self.memberlist.remove(i);
    }
    return true;
  }

  // 切断したユーザの処理
  self.procQuit=function(prefix,bMyself){
    var member = self.membermap[ prefix.name.toLowerCase() ];
    if(member == null ) return false;
    if( bMyself ){
      self.removeMember(); // 参加者を全てクリア
      self.setIn(false); // 参加状態をクリア
    }else{
      self.removeMember(prefix); // 対象の参加者情報をクリア
    }
    return true;
  }

  self.testProc = function(){
    if( self.memberlist.count() > 0 ){
    // 個数が多かったら間引く
    // if( self.memberlist.count() > 100 ){
    //     self.memberlist.remove( nrand(self.memberlist.count()) );
    // }
    }
  };

  // ユーザ入力の処理
  self.onUserInput =function(type,line){
    if( type==5 ) return AppNode.onUserInput(type,line);
    if( type==0 ) return self.parent.onUserInput(type,line);
    switch(type){
    case 7:
      window.open("/channel/" + encodeURIComponent(self.longname.replace(/^#/, "")), "_blank");
      break;
    case 6:
      self.parent.sendCommand("privmsg RDeborah :join "+self.longname);
      break;
    case 4:
      self.parent.sendCommand("topic "+self.longname+" :"+line);
      break;
    case 3: // ctcp action
      self.parent.sendCommand("privmsg "+self.longname+" :"+"\x01ACTION "+line+"\x01");
      localEcho("CTCP_ACTION",self,line);
      break;
    case 2: //notice 
      self.parent.sendCommand("notice "+self.longname+" :"+line);
      localEcho("NOTICE",self,line);
      break;
    default:
    case 1: // privmsg
      self.parent.sendCommand("privmsg "+self.longname+" :"+line);
      localEcho("PRIVMSG",self,line);
      break;
    }
    return true;
  }
  
  self.changeMyNick = function(nick){
    self.parent.changeMyNick(nick);
  }
  
  self.getMyNick = function(){
    return self.parent.getMyNick();
  }
  
  // 設定保存
  self.saveSettings = function(next){
    saveCookie( (next++),{
      'name':self.name,
      'parent':self.parent.name,
      'type':self.nodetype
    });
    return saveChildNodes(self,next);
  }

  // 設定ロード
  self.loadSettings = function(data){
  }

  self.checkIgnore = function(who){
    var prefix = new IRCUserPrefix(who);
    var member = self.membermap[ prefix.name.toLowerCase() ];
    if(member == null ) return false;
    return (-1 != member.mode.indexOf("x"));
  };

  self.isIn = false;
  self.deleteMe = function(){
    if(self.isIn){
      say("参加中のチャンネルは削除できません。");
    }else{
      BufferList_deleteNode(self);
    }
  }
  self.setIn = function(bIn,noSound){
    if( bIn == self.isIn ) return;
    self.isIn  = bIn;
    self.cols[1].src=(!self.isIn?"i/bt_chan1.png":!self.midoku?"i/bt_chan2.png":"i/bt_chan3.png");
    if( bIn ){
      if(BufferList_allowSave) BufferList_selectNode(self);
      if(!noSound) self.parent.playSound("OnMyselfJoin");
    }else{
      if(!noSound) self.parent.playSound("OnMyselfPart");
    }
  }
  self.addMidoku = function(){
    if( getSelectedNode() == self){
      self.midoku = false;
    }else{
      self.midoku = true;
    }
    self.cols[1].src=(!self.isIn?"i/bt_chan1.png":!self.midoku?"i/bt_chan2.png":"i/bt_chan3.png");
  }

  // ノード初期化
  BufferList_initNode(self,"Channel",self.name,sortkey,conn_node,[
    MochiKit.DOM.SPAN({'class':"listindent16"}," "),
    MochiKit.DOM.IMG({'class':'listicon',src:"i/bt_chan1.png"},null),
    MochiKit.DOM.SPAN({'class':"listname"},self.name)
  ]);
}

/////////////////////////////////////////////////////////////////////////////

// プリブノード
function BufferTreeNode_Priv(name,conn_node){
  var self = this;
  var user = new IRCUserPrefix(name);
  name = self.name = (user && user.short ? user.short :name );
  var sortkey = conn_node.sortkey+" "+(self.name.toLowerCase());

  self.isMe = function( name ){
    var user = new IRCUserPrefix(name);
    return self.name.toLowerCase() == user.name.toLowerCase();
  }

  // バッファペインに表示する内容
  this.logbuffer = new LogBuffer('BufferContainer',false);

  this.updateBufferTopic=function(){
    MochiKit.DOM.replaceChildNodes("BufferName",self.name+" - "+parent.name);
    MochiKit.DOM.replaceChildNodes("BufferTopic");
  };

  self.procChangeNick = function(old_prefix,new_nick){
    if( self.name.toLowerCase() == old_prefix.name.toLowerCase() ){
      self.name = new_nick;
      var sortkey = self.parent.sortkey+" "+(self.name.toLowerCase());
      // バッファ一覧
      MochiKit.DOM.replaceChildNodes(self.cols[2],self.name);
      lbBuffer.setSortKey(lbBuffer.getRowIndex(self),sortkey);
      return true;
    }
    return false;
  };
  // 切断したユーザの処理
  self.procQuit=function(prefix,bMyself){
    if(bMyself) return true;
    if( prefix.isSameNick(self.name) ) return true;
  }


  self.setLogParam = function(pre,param){
    param[pre] = self.name;
    param[pre+'s'] = self.name;
    param[pre+'e'] = self.name;
  }

  self.onUserInput =function(type,line){
    if( type==5 ) return AppNode.onUserInput(type,line);
    if( type==0 ) return self.parent.onUserInput(type,line);
    if( type==4 ){
      parent.say("プリブにはトピックを設定できません");
      return false;
    }
    switch(type){
    case 3: // ctcp action
      self.parent.sendCommand("privmsg "+self.longname+" :"+"\x01ACTION "+line+"\x01");
      localEcho("CTCP_ACTION_u",self,line);
      break;
    case 2: //notice 
      self.parent.sendCommand("notice "+self.name+" :"+line);
      localEcho("NOTICE_u",self,line);
      break;
    default:
    case 1: // privmsg
      self.parent.sendCommand("privmsg "+self.name+" :"+line);
      localEcho("PRIVMSG_u",self,line);
      break;
    }
    return true;
  }

  // 設定保存
  self.saveSettings = function( next){
    saveCookie( (next++),{
      'name':self.name,
      'parent':self.parent.name,
      'type':self.nodetype
    });
    return saveChildNodes(self,next);
  }

  // 設定ロード
  self.loadSettings = function(data){
  }

  self.updateIcon = function(){
    self.cols[1].src=(self.ignore?"i/bt_priv4.png":!self.midoku?"i/bt_priv2.png":"i/bt_priv3.png");
  }
  self.checkIgnore = function(){ return self.ignore};

  self.addMidoku = function(){
    if( getSelectedNode() == self){
      self.midoku = false;
    }else{
      self.midoku = true;
    }
    self.updateIcon();
  }
  
  self.deleteMe = function(){
    BufferList_deleteNode(self);
  }

  BufferList_initNode(self,"Priv",self.name,sortkey,conn_node,[
    MochiKit.DOM.SPAN({'class':"listindent16"},""),
    MochiKit.DOM.IMG({'class':'listicon',src:"i/bt_priv2.png"},null),
    MochiKit.DOM.SPAN({'class':"listname"},name)
  ]);
}

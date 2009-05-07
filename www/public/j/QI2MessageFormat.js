
// メッセージフォーマットマップ
function MessageFormat(){
	this.setRule = function(mode,format,targets){
		// mode: 0=非表示 1=表示するが未読を数えない 2=表示して未読を数える
		// format: マクロ文字列
		// targets: 対象コマンドを空白区切りで並べたもの
		if(!targets) return;
		var list = targets.match(/\S+/g);
		for(var i=0;i<list.length;++i) this["r_"+list[i]]=[mode,format];
	};
	this.onoff =function(cmd,onoff){
		var entry = this["r_"+cmd];
		if(entry) entry[0]= (onoff?1:0);
	}

	this.parseFormat = function(format,param){
		var d = new Date();
		var h = "00"+d.getHours();
		var m = "00"+d.getMinutes();
		var timestr = h.substr(h.length-2,2)+":"+m.substr(m.length-2,2);

		var row = [ false,'DIV',{"class":"logrow"}
			,[ false,'SPAN',{'class':'logparams'},timestr]
			,[ false,'SPAN',{'class':'logsenderpre'},' ' ]
		 ];
		for(var i=0;i<format.length;++i){
			if( format.charAt(i) != '%' ){
				var end = format.indexOf('%',i);
				if(end==-1)end = format.length;
				row.push( format.substring(i,end));
				i=end-1;
				continue;
			}
			if(++i>=format.length) break;
			var c = format.charAt(i);
			switch(c){
			case '%':
				row.push( '%' );
				break;
			case 's':
			case 'm':
			case 'y':
			case 'x':
				row.push( [ true,'SPAN',{'class':('logparam'+c)},param['%'+c] ] );
				break;
			case 't':
			case 'f':
			case 'c':
				if( i < format.length-1 ){
					var c2 = format.charAt(i+1);
					if( c2 == 'e' || c2=='s'){
						++i;
						c = c+c2;
					}
				}
				row.push( [ false,'SPAN',{'class':('logparam'+c)},param['%'+c] ] );
				break;
			case '#':
				end = format.indexOf(';',i);
				if(end!=-1){
					row[2]['style']='color:#'+format.substring(i+1,end);
					i=end;
				}
				break;
			case 'w':
				break;
			case '>':
				row.push( [ false,'SPAN',{'class':'logsendersuf'},'>'] );
				break;
			}
		}
		return row;
	};

	this.procLog = function(param,buffer){
		var rule = this["r_"+param["%x"]];
		if(!rule && param["%x"]>=400) rule = this["r_OnError"];
		if(!rule ) rule = this["r_other"];
		if(!rule) return false;

		if(!rule[0]) return false; // 非表示
		buffer.addLogV( this.parseFormat( rule[1],param) );
		return (rule[0]==2);
	}
}

// 全ログ用マップ
var MessageFormat_AllLog = new MessageFormat();
// 通常チャネル用マップ
var MessageFormat_Channel = new MessageFormat();
// プリブ型チャネル用マップ
var MessageFormat_Private = new MessageFormat();

/*
	フォーマット文字列マクロ一覧
	%s  //接続名
	%m  //メッセージ
	%x  //メッセージ種別
	%y  //パラメータ全部

	%t  //ニックネーム変更前またはプリブ先 の名前
	%ts //ニックネーム変更前またはプリブ先 の短い名前
	%te //ニックネーム変更前またはプリブ先 チャンネル名の場合はEscapedName

	%fe //送信者(from) チャンネル名の場合はEscapedName ユーザの場合はprefix
	%fs //送信者(from) の短い名前
	%f  //送信者(from) の表示名

	%ce //コンテキスト チャンネル名の場合はEscapedName ユーザの場合はprefix
	%cs //コンテキスト の短い名前
	%c  //コンテキスト の名前
	コンテキストは、プリブバッファの場合、自分宛なら相手を、相手宛なら自分を指す。

	%#HHH;
	%#HHHHHH; 色指定
	
	%w 折り返し位置の記憶
*/


////////////////////////
// 全ログ用マップ

// 低レベルなメッセージや、クエリへの単純な応答は全てのメッセージには表示しません。
MessageFormat_AllLog.setRule(1,"%s %f %x %y","OnSend OnRecv OnRecvCTCP");
MessageFormat_AllLog.setRule(1,"%s %f %x %y","OnConnectRequest OnDisconnectRequest OnServerName ");
MessageFormat_AllLog.setRule(1,"%s %f %x %y","PONG PING NAMES 252");
MessageFormat_AllLog.setRule(1,"%s %f %x %y","366 324");
MessageFormat_AllLog.setRule(1,"%s %f %x %y","303"); //ISONのフォーマットらしい、勝手に来る

MessageFormat_AllLog.setRule(1,"%s %cs %w%m","324"); // モード表示

// 接続、切断、エラーについては表示します。
MessageFormat_AllLog.setRule(2,"%#F80;%s %f %x %y","other");
MessageFormat_AllLog.setRule(1,"%#08F;%s %x %y","OnConnect OnDisconnect OnConnectAuthorized");
MessageFormat_AllLog.setRule(1,"%#F00;%s %m","OnError ERROR");

// チャンネルモードの変化
MessageFormat_AllLog.setRule(1,"%#F80;%s %f が %cs のトピックを %m に変更しました","TOPIC");
MessageFormat_AllLog.setRule(1,"%#084;%s %cs のトピックは %m です","332");

//////////////////////////////////////
// チャンネル型ログバッファ

MessageFormat_Channel.setRule(1,"%f %x %y","other 352 315");
MessageFormat_Channel.setRule(1,"%#888;%y","OnSend OnConnectRequest OnServerName OnDisconnect");

// モードとトピック
MessageFormat_Channel.setRule(1,"%#084;%f がトピックを %w%m に変更しました","TOPIC");
MessageFormat_Channel.setRule(1,"%#084;トピックは %w%m です","332");

//////////////////////////////////////
// プリブ型ログバッファ
MessageFormat_Private.setRule(0,"","other 352 315");

/////////////////////////////////

MessageFormat_AllLog.setRule (2,"%s %y%#08F;","OnDisconnect");
MessageFormat_Channel.setRule(1,   "%y%#08F;","OnDisconnect");


// モード
MessageFormat_AllLog.setRule (1,    "%s %x %c %m%#084;","MODEu");   // ユーザモード変更
MessageFormat_AllLog.setRule (1,"%s %cs %f %x %m%#084;","MODE 324");  // チャンネルモード変更とモードクエリ応答
MessageFormat_Channel.setRule(1,       "%f %x %m%#084;","MODE 324");


// MOTDを表示
MessageFormat_AllLog.setRule(1,"%#F80;%s %m","375 372 376");

// NAMEリプライ非表示
MessageFormat_AllLog.setRule (0,"","353 366");
MessageFormat_Channel.setRule(0,"","353 366");

/////////////////////////////////
// 人の出入り
MessageFormat_AllLog.setRule (1,"%s %f が %cs に入室しました%#F80;","JOIN");
MessageFormat_Channel.setRule(1,       "%f が入室しました%#F80;","JOIN");

MessageFormat_AllLog.setRule (1,"%s %f が %t になりました%#F80;","NICK");
MessageFormat_Channel.setRule(1,   "%f が %t になりました%#F80;","NICK");
MessageFormat_Private.setRule(1,   "%f が %t になりました%#F80;","NICK");

MessageFormat_AllLog.setRule (1,"%s %f が切断しました %m%#F80;","QUIT");
MessageFormat_Private.setRule(1,   "%f が切断しました %m%#F80;","QUIT");
MessageFormat_Channel.setRule(1,   "%f が切断しました %m%#F80;","QUIT");

MessageFormat_AllLog.setRule (1,"%s %f が %cs から退室しました %m%#F80;","PART");
MessageFormat_Channel.setRule(1,       "%f が退室しました %m%#F80;","PART");

MessageFormat_AllLog.setRule (1,"%s %f が %cs から %t を退室させました %m%#F80;","KICK");
MessageFormat_Channel.setRule(1,       "%f が %t を退室させました %m%#F80;","KICK");

// 招待は確認メッセージをログに別途出しているので表示しない
MessageFormat_AllLog.setRule (0,"","INVITE");

// PINGは表示しない
MessageFormat_AllLog.setRule (0,"","PING");

// Mysterious message. Specific to irc-hybrid?
MessageFormat_AllLog.setRule (0,"","333");

// 発言
MessageFormat_AllLog.setRule (2,"%s %cs %f%>%m","PRIVMSG");
MessageFormat_Channel.setRule(2,       "%f%>%m","PRIVMSG");
MessageFormat_AllLog.setRule (2,"%s %f→%t %m","PRIVMSG_u");
MessageFormat_Private.setRule(2,   "%f→%t %m","PRIVMSG_u");

//NOTICE
MessageFormat_AllLog.setRule (2,"%s %cs %f%>%m%#008;","NOTICE");
MessageFormat_Channel.setRule(2,       "%f%>%m%#008;","NOTICE");
MessageFormat_AllLog.setRule (2,"%s %f→%t %m%#008;","NOTICE_u");
MessageFormat_Private.setRule(2,   "%f→%t %m%#008;","NOTICE_u");

// CTCP_ACTION
MessageFormat_AllLog.setRule (2,"%s %cs %f %m%#800;","CTCP_ACTION");
MessageFormat_Channel.setRule(2,       "%f %m%#800;","CTCP_ACTION");
MessageFormat_AllLog.setRule (2,"%s %f %m%#800;","CTCP_ACTION_u");
MessageFormat_Private.setRule(2,   "%f %m%#800;","CTCP_ACTION_u");


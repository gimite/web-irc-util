// PageSetup.js      アプリケーションの初期化

// ページレイアウト
var MainPane ;

function updateLayout(){
	MainPane.setPaneSize(MochiKit.Style.getViewportDimensions(),new MochiKit.Style.Coordinates(0,0));
}
var layout_timer = null;

function on_resize(){
	if(layout_timer!=null) clearTimeout(layout_timer);
	layout_timer = setTimeout("updateLayout()",200);
}


// 初期化
var KeyEvents = { handled: false };
function PageSetup(){
	
	
	// 全ログを作成
	initAllLog();
	logAll.addLog("初期化開始…");

	// バッファ一覧リストボックスを作成
	BufferList_create();

	// Application Nodeを作成
	AppNode = new BufferTreeNode_App(" QuickIRC2","QuickIRC2",$("ApplicationSettings"));

	// 入力部分を初期化
	initInputPane();


	// レイアウトの更新
	MainPane = new WeightPane('MainPane',true     // 全体を左右に分ける
		,100,new WeightPane('LeftPane',false          // 左側を上下に分ける
			,70,new LayerdPane('LeftUpPaneL'
				,new WeightPane('LeftUpPane',false
					/////////////////////////////////////// (size x,y),(border t,r,b,l)
					// バッファヘッダ (uai.trident?-6:0)
					,0 ,new SimplePane('BufferInfo'        ,null,64  ,5 ,17 ,(uai.trident?16:0) ,15)
					// バッファを置くDIV
					,70,new SimplePane('BufferContainer'   ,null,null ,3 ,17  ,(uai.trident?8:0) ,15)
					// テキスト入力部 
					,0 ,new SimplePane('taInput'           ,null,60   ,2  ,17 ,(uai.trident?4:0) ,15)
					// ボタンの類
					,0 ,new SimplePane('InputPane'         ,null,32   ,2  ,17+4 ,5,48) 
				)
				,new FramePane("BGFrame","i/bg_mona",".gif",14,19,36,48,true)
			)
			,30,new LayerdPane('LeftDownPaneL'
				,new WeightPane('LeftDownPane',false
					// 全ログヘッダ
					,0 ,new SimplePane('AllLogHeader'      ,null,32   ,5 ,17 ,3 ,15)
					// 全ログコンテナ
					,30,new SimplePane('AllLogContainer'   ,null,null ,0  ,17 ,(uai.trident?8:0) ,15)
					// 全ログフッタ
					,0 ,new SimplePane('AllLogFooter'      ,null,22   ,2  ,17+4,5,15)
				)
				,new FramePane("BGFrame","i/bg_mona",".gif",14,19,36,48,true)
			)
		)
		,0,new WeightPane('RightPane',false           // 右側を上下に分ける
			,70,new LayerdPane('RightUpPaneL'
				,new WeightPane('RightUpPane',false
					,0 ,new SimplePane('MemberListHeader'   ,160,32    ,5 ,17 ,3 ,15)
					,70,new SimplePane('MemberListContainer',null,null ,0  ,17 ,(uai.trident?6:0) ,15)
					,0 ,new SimplePane('MemberListFooter'   ,160,26    ,2  ,17+4,8,15)
				)
				,new FramePane("BGFrame","i/bg_mona",".gif",14,19,36,48,true)
			)
			,30,new LayerdPane('RightDownPaneL'
				,new WeightPane('RightDownPane',false
					,0 ,new SimplePane('BufferListHeader'   ,160,32     ,5 ,17 ,3 ,15)
					,30,new SimplePane('BufferListContainer',null,null  ,0  ,17 ,(uai.trident?6:0) ,15)
					,0 ,new SimplePane('BufferListFooter'   ,160,26     ,2  ,17+4,8,15)
				)
				,new FramePane("BGFrame","i/bg_mona",".gif",14,19,36,48,true)
			)
		)
	);
	updateLayout();
	window.onresize = updateLayout;

	// 設置サイト別の設定
	var conn_node = eval("SiteSetting()");

	// ユーザ設定をクッキーからロード
	AppNode.loadSettings();

	// URL引数からチャンネル追加
	{
		var list = location.search.replace(/^\?/,"").split("&");
		for(var i=0;i<list.length;++i){
			var kv = list[i].split('=');
			if(!kv || !kv[1]) continue;
			kv[0] = decodeURIComponent(kv[0]);
			kv[1] = decodeURIComponent(kv[1]);
			say("url param: "+kv[0]+"="+kv[1]);
			switch(kv[0]){
			case 'utf8':
				conn_node.addInitializeChannel(kv[1]);
				break;
			}
		}
	}

	BufferList_allowSave=true;
	QI2Flash_env['ready' ] = true;
	logAll.addLog("初期化完了。設定を確認して「接続開始」ボタンを押してください。");
	autoconnect_timer = setInterval(function(){ eval("AppNode.procAutoConnect(); clearInterval(autoconnect_timer);")},300);
}

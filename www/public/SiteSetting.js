// 設置サイト別の設定
function SiteSetting(){
	// AppNode.addSound("OnConnect"   ,"se/connect.wav.mp3","接続開始");
	// AppNode.addSound("PRIVMSG"     ,"se/speak.wav.mp3"  ,"メッセージ");
	// AppNode.addSound("OnMyselfJoin","se/whojoin.wav.mp3","チャンネル参加");
	// AppNode.addSound("OnMyselfPart","se/whopart.wav.mp3","チャンネル退出");

	var conn_node = createConnectionNode("irc.gimite.net","irc.gimite.net",$('ConnectionSettings') );
	conn_node.setCharset("UTF-8");
	conn_node.addServer("irc.gimite.net","irc.gimite.net",6667,"http://irc.gimite.net/crossdomain.xml",false);
	conn_node.chanlist_url = "http://tate.undef.jp/qi2/listbot.xml";
	BufferList_selectNode(conn_node);

	return conn_node;
}

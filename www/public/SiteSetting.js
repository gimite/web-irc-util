function SiteSetting(){
  // AppNode.addSound("OnConnect"   ,"se/connect.wav.mp3","接続開始");
  // AppNode.addSound("PRIVMSG"     ,"se/speak.wav.mp3"  ,"メッセージ");
  // AppNode.addSound("OnMyselfJoin","se/whojoin.wav.mp3","チャンネル参加");
  // AppNode.addSound("OnMyselfPart","se/whopart.wav.mp3","チャンネル退出");

  var conn_node = createConnectionNode("irc.gimite.net", "irc.gimite.net", $("ConnectionSettings"));
  conn_node.setCharset("UTF-8");
  conn_node.addServer(
    "irc.gimite.net", "irc.gimite.net", 6667, "xmlsocket://irc.gimite.net:843", false);
  conn_node.chanlist_url = "http://example.com/";
  BufferList_selectNode(conn_node);

  return conn_node;
}

function SiteSetting(){
  var host = "irc.gimite.net";

  var conn_node = createConnectionNode(host, host, $("ConnectionSettings"));
  conn_node.setCharset("UTF-8");
  conn_node.addServer(
    host, host, 6667, "xmlsocket://" + host + ":843", false);
  conn_node.chanlist_url = "http://example.com/";
  BufferList_selectNode(conn_node);

  return conn_node;
}

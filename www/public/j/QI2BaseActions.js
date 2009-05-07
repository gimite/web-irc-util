// QI2BaseActions.js 各種操作の処理

// 接続開始ボタン
function actConnStart(node){
	if(node == null || node.nodetype != "Conn" ){
		alert("接続ノードが指定されていません。");
		return;
	}
	node.startConnection();
}
function actConnStop(node){
	if(node ==null || node.nodetype != "Conn" ){
		alert("接続ノードが指定されていません。");
		return;
	}
	node.stopConnection();
}

function actDeleteBuffer(node){
	node.deleteMe();
}

function actInviteLogger(){
	getSelectedNode().onUserInput(6,"");
}

function actArchive(){
	getSelectedNode().onUserInput(7,"");
}

// 入力完了
function endInput(type){
	var text = $('taInput').value;
	if( text == "" ) return;

	var node = getSelectedNode();
	var list2 = [];
	var list = text.match(/[^\x0d\x0a]+/g);
	if( list ){
		for(var i=0;i<list.length;++i){
			if(list[i].charAt(0)=='/'){
				if( node.onUserInput(0,list[i].substring(1) )) continue;
			}else{
				if( node.onUserInput(type,list[i])) continue;
			}
			list2.push(list[i]);
		}
	}
	$('taInput').value = "";
}

function initInputPane(){
	var input = $('taInput');
	input.value = "";
	input.onkeypress = function(event){
		if( event ){
			// non-IE
			if( event.shiftKey || event.ctrlKey || event.altKey ) return true;
			if( event.keyCode != 13 && event.keyCode != 14 ) return true;
			event.preventDefault();
		}else{
			// IE
			event = window.event;
			if( event.shiftKey || event.ctrlKey || event.altKey ) return true;
			if( event.keyCode != 13 && event.keyCode != 14 ) return true;
		//	for( var i in event) say("event IE "+i+"="+event[i]);
			event.returnValue = false;
		}
		endInput(1);
		return false;
	};
}
function actConnSetting(){
	var node = getSelectedConnNode();
	if(node) BufferList_selectNode(node);
}
function actAppSetting(){
	BufferList_selectNode(AppNode);
}

function actSelectChanneList(){
	var node = getSelectedConnNode();
	if(!node) return;
	BufferList_selectNode(node);
	node.scrollToChannelList();
}


function actPrivBuffer(){
	var node = getSelectedNode();
	if( node.nodetype =="Channel"){
		var i = node.memberlist.getSelectedIndex();
		if(i >=0){
			var member = node.memberlist.getRow(i);
			var privnode = node.parent.prepareChildNode("Priv",member.name,true,true);
			if(BufferList_allowSave) BufferList_selectNode(privnode);
		}
	}
}
function actIngore(){
	var node = getSelectedNode();
	if( node.nodetype =="Channel"){
		var i = node.memberlist.getSelectedIndex();
		if(i >=0){
			var member = node.memberlist.getRow(i);
			node.setMemberMode(member,'x',null);
			node.updateMemberIcon(member);
		}
	}
	if( node.nodetype =="Priv"){
		node.ignore = !node.ignore;
		node.updateIcon();
	}
}

function actChannelJoin(node){
	if( node.nodetype =="Channel"){
		node.parent.conn.send("JOIN "+node.name);
	}
}

function actChannelPart(node){
	if( node.nodetype =="Channel"){
		node.parent.conn.send("PART "+node.longname);
	}
}

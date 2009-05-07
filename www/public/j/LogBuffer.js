// URL自動リンク
var url_re = /([A-Za-z][A-Za-z0-9]+)(:\/\/[A-Za-z0-9\/.@#?%&;:=\+\$\,\-_!~*'\(\)<>]+)/i;
var schema_map = { "ttp":"http","ttps":"https"};

CTCPColorCode=[
	'#FFF', //00  白  
	'#000', //01  黒  
	'#008', //02  暗青
	'#080', //03  暗緑

	'#F00', //04  赤  
	'#800', //05  暗赤
	'#808', //06  暗紫
	'#F80', //07  橙  

	'#FF0', //08  黄  
	'#0F0', //09  緑  
	'#088', //10  暗水
	'#0FF', //11  水  

	'#00F', //12  青  
	'#F0F', //13  紫  
	'#888', //14  暗灰
	'#CCC'  //15  灰色
];


var ctcp_map ={
	'\x02':1,
	'\x03':1,
	'\x16':1,
	'\x1f':1,
	'\x0f':1
};

// CTCPのパース
function parseCTCP(list,text){
	for(var i=0,ie=text.length;i<ie;){
		var start = i;
		while( i<ie && ! ctcp_map[text.charAt(i)] ) ++i;
		if(i>start) list.push( text.substring(start,i));
		if(i>=ie) break;
		var code = text.charCodeAt(i++);
		if(code==3){
			var style='';
			if( text.substr(i,5).match(/^(\d{1,2})(?:,(\d{1,2}))?/)){
				i += RegExp.lastMatch.length;
				var c1 = RegExp.$1;
				var c2 = RegExp.$2;
				style += "color:"+CTCPColorCode[parseInt(c1,10)]+";";
				if(c2!=null) style += "background-color:"+CTCPColorCode[parseInt(c2,10)]+";";
			}
			list.push({'ctcp':code,'color':style});
			continue;
		}
		list.push({'ctcp':code});
	}
	return list;
}

function autoLink(elem,src){
	var list =[];
	for(;;){
		if( ! src.match(url_re) ){
			parseCTCP(list,src);
			break;
		}
		src = RegExp.rightContext;
		var left = RegExp.leftContext;
		var schema = RegExp.$1;
		var url = RegExp.$2;
		if(left.length >0 ) parseCTCP(list,left);
		var a = MochiKit.DOM.A({"target":"_blank","href":(( null!=schema_map[schema]?schema_map[schema] : schema)+url)},null);
		url = schema+url;
		for(var i=0;i<url.length;i+=8){
			var e = i+8;
			if(e>url.length) e=url.length;
			if(i>0) MochiKit.DOM.appendChildNodes(a,MochiKit.DOM.createDOM('WBR'));
			MochiKit.DOM.appendChildNodes(a,url.substring(i,e));
		}
		list.push(a);
	}

	var next_node = elem;
	var ctcp_effect ={};
	for(var i=0;i<list.length;++i){
		var item = list[i];
		if( item['ctcp'] ){
			// spanを閉じる
			if(next_node != elem) next_node = elem;
			var code = item['ctcp'];
			switch(code){
			case 0x0f: ctcp_effect ={}; continue; // 全効果をリセットする
			case 0x03: ctcp_effect[code] = item['color']; break;
			case 0x02: ctcp_effect[code] = (ctcp_effect[code]?'':'font-weight:bold;'); break; // ボールド
			case 0x16: ctcp_effect[code] = (ctcp_effect[code]?'':'font-style:italic;'); break; // 反転
			case 0x1f: ctcp_effect[code] = (ctcp_effect[code]?'':'text-decoration:underline'); break; // アンダーライン
			}
			var style='';
			for(var j in ctcp_effect){
				if( ctcp_effect[j].charAt(0)!='[') style += ctcp_effect[j];
			}
			if( style.length ){
				next_node = MochiKit.DOM.SPAN({'style':style},null);
				MochiKit.DOM.appendChildNodes(elem,next_node);
			}
			continue;
		}
		MochiKit.DOM.appendChildNodes(next_node,item);
	}
}

/*
function autoLink(elem,text){
	for(;;){
		if( ! text.match(url_re) ){
			MochiKit.DOM.appendChildNodes(elem,text);
			break;
		}
		text = RegExp.rightContext;
		var left = RegExp.leftContext;
		var schema = RegExp.$1;
		var url = RegExp.$2;
		if(left.length >0 ) MochiKit.DOM.appendChildNodes(elem,left);
		MochiKit.DOM.appendChildNodes(elem,MochiKit.DOM.A({"target":"_blank","href":(( null!=schema_map[schema]?schema_map[schema] : schema)+url)},schema+url));
	}
}
*/
////////////////////////////////////////////

function createDOMTree(data){
	var bAutoLink = data[0];
	var tag = data[1];
	var attr = data[2];
	var elem = MochiKit.DOM.createDOM(tag,attr);
	for(var i=3,l=data.length;i<l;++i){
		if(data[i] == null ){
			continue;
		}else if(MochiKit.Base.isArrayLike(data[i]) ){
			MochiKit.DOM.appendChildNodes(elem,createDOMTree(data[i]));
		}else if(bAutoLink){ 
			autoLink(elem,data[i]);
		}else{
			MochiKit.DOM.appendChildNodes(elem,data[i]);
		}
	}
	return elem;
}

var LogBufferInnerFrame_pane = null;
function LogBufferInnerFrame_addLogV(pane,elem){
	elem = createDOMTree(elem);

	// スクロールが下端にあるか調べる
	var bBottom = ( pane.scrollTop >= pane.scrollHeight - pane.clientHeight -16 );

	// 1行追加して、たまに古いログを削除
	MochiKit.DOM.appendChildNodes(pane,elem);
	if( pane.childNodes.length > 1000 ){
		for(var i=0;i<100;++i) MochiKit.DOM.removeElement(pane.childNodes[0]);
	}

	// スクロール位置の復帰
	if( bBottom ) pane.scrollTop = pane.scrollHeight;
};

// ログバッファ コンストラクタ
function LogBuffer(parent,visible){
	this.elem = MochiKit.DOM.DIV({'class':'Buffer'},null);
	if(! visible ) this.elem.style.display = "none";
	MochiKit.DOM.appendChildNodes(parent,this.elem);

	this.show = function(){  this.elem.style.display = 'block'; };
	this.hide = function(){  this.elem.style.display = 'none'; 	};
	this.addLogV = function (data){ LogBufferInnerFrame_addLogV(this.elem, data); };
	this.addLog = function (line){ this.addLogV( [ false,'DIV',{'class':'logtext'},line] ); };

	this.addLogChat = function (line){
		if(line.length <4 || line[3] == null ) return;
		this.addLogV( [ false,'DIV',{"class":"logrow"},
			[ false,'SPAN',{'class':'logparams'},line[1].substr(5,11)],
			[ false,'SPAN',{'class':'logsenderpre'},' ' ],
			[ false,'SPAN',{'class':'logsender'},line[2] ],
			[ false,'SPAN',{'class':'logsendersuf'},'>'],
			[ true,'SPAN',{'class':'logbody'},line[3]]
		]);
	};

}

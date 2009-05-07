// Util.js 各種補助関数

// ブラウザ判別
var uai = new UAIdentifier();

// 全ログバッファ
var logAll = null;


function initAllLog(){
	logAll = new LogBuffer($('AllLogContainer'),true);
}

// ページ上にログ出力
function say(str){
	if(logAll) logAll.addLog(str);
}

// 変数が定義済みでカラ文字列ではない
function dnl(a){ return a!=null && a.toString().length >0; }

// ランダムな文字列を生成する
var punk="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ{-}";
// var punk="0123456789";
function createRandomName(length){
	var r ="";
	for(var i=0;i<length;++i){
		r += punk.charAt(Math.random() * punk.length );
	}
	return r;
}

// 0～n-1までの乱数
function nrand(n){
	return Math.floor( Math.random() * n );
}


var QI2Util_EnumMap = {};
var QI2Util_EnumNext = 0;
function addObjectMap(obj){
	var n = "n" + (QI2Util_EnumNext++);
	QI2Util_EnumMap[n] = obj;
	return n;
}
function getObjectMap(n){
	return QI2Util_EnumMap[n];
}
function removeObjectMap(n){
	delete QI2Util_EnumMap[n];
}

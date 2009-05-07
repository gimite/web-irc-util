// ListBox.js 
// リストボックスUIコンポーネント

function ListBox(elem,classname_off,classname_on,onselect_func){
	this._elem = elem;
	this._classname_off = classname_off;
	this._classname_on = classname_on;
	MochiKit.DOM.replaceChildNodes(elem);
	this._rows = [];
	this._always_select = false;
	this._onselect_func = onselect_func;
	this._selected_count = 0;

	// 行数を取得
	this.count = function(){ return this._rows.length;};

	this.getRow = function(index){ return this._rows[Math.floor(index)];};

	this.setAlwaysSelect = function(newval){
		this._always_select = newval;
		return this._always_select;
	};

	// 削除
	this.remove = function(index){
		index = Math.floor(index);

		var reselect_flag = false;
		if( this._rows[index].elem.className  == this._classname_on ){
			this._rows[index].elem.className = this._classname_off;
			--this._selected_count;
			if(this._onselect_func) this._onselect_func(index,false);
			reselect_flag = true;
		}
		MochiKit.DOM.removeElement(this._rows[index].elem);
		this._rows.splice(index,1);

		// 常にどれか選択する場合
		if( reselect_flag && this._always_select && !this._selected_count && this._rows.length >0 ){
			if(index >= this._rows.length ) index = this._rows.length -1;
			this._rows[index].elem.className = this._classname_on;
			++this._selected_count;
			if(this._onselect_func !=null ) this._onselect_func(index,true);
		}
	};

	// ソートして追加
	this.append = function(row,sortkey){
		this.replaceSort(row,sortkey,-1);
	};

	this.setSortKey = function(index,sortkey){
		this.replaceSort(this.getRow(index),sortkey,index);
	};

	// 指定行の内容を変更
	this.replaceSort = function(row,sortkey,index){
		index = Math.floor(index);

		var selchange_flag = false;

		if(index >= 0 ){
			// sortkeyが同じなら何もしない
			if( row['sortkey'] == sortkey) return;
			// リストから行を取り除く
			MochiKit.DOM.removeElement(row.elem);
			this._rows.splice(index,1);
			// 直前の選択状態
			var row_class = row.elem.className;
		}else{
			// 新しい行の選択状態
			var row_class = this._classname_off;
			// 常にどれか選択する場合は行数を見て判断
			if( this._always_select && this._rows.length==0 ){
				row_class = this._classname_on;
				selchange_flag = true;
			}
			row['elem']=MochiKit.DOM.DIV({'class':row_class},row.cols);
		}

		// bsearchして挿入位置を決定
		var pos = 0;
		var size = this._rows.length;
		if(size>0){
			var width = size;
			while(width >0){
				var half = Math.floor(width/2);
				var s = this._rows[pos+half].sortkey;
				if( sortkey == s ) break;
				if( sortkey > s ){
					pos += half+1;
					width-=half+1;
				}else{
					width =half;
				}
			}
			if(pos>0)--pos;
			while( pos < size ){
				if( sortkey < this._rows[pos].sortkey ) break;
				++pos;
			}
		}
		// 新しい行を挿入する
		if( pos >= size ){
			MochiKit.DOM.appendChildNodes(this._elem,row.elem);
			this._rows.push( row );
		}else{
			this._elem.insertBefore(row.elem,this._rows[pos].elem);
			this._rows.splice(pos,0,row);
		}
		row['sortkey'] = sortkey;

		if(selchange_flag){
			++this._selected_count;
			if(this._onselect_func) this._onselect_func(pos,true);
		}
	};
	this.getRowIndex = function(row){
		for(var i=0,l=this._rows.length;i<l;++i){
			if( this._rows[i] === row) return i;
		}
		return -1;
	};

	// 選択
	this.select = function(index,ev){
		for(var i=0,l=this._rows.length;i<l;++i){
			if( this._rows[i].elem.className  == this._classname_on ){
				this._rows[i].elem.className = this._classname_off;
				--this._selected_count;
				if(this._onselect_func) this._onselect_func(i,false);
			}
		}
		if(index >= 0 && index < this._rows.length ){
			this._rows[index].elem.className = this._classname_on;
			++this._selected_count;
			if(this._onselect_func) this._onselect_func(index,true);
		}
	}
	
	this.getSelectedIndex = function(){
		for(var i=0,l=this._rows.length;i<l;++i){
			if( this._rows[i].elem.className  == this._classname_on ) return i;
		}
		return -1;
	}

	// マウスクリック
	this.onclick = function(ev){
		var rowelem = null;
		var elem = ev.target();
		while( elem != this._elem ){
			rowelem = elem;
			elem = elem.parentNode;
		}
		MochiKit.Logging.logDebug("rowelem="+rowelem);
		for(var i=0,l=this._rows.length;i<l;++i){
			if(this._rows[i].elem == rowelem){
				// 項目のある行をクリックした
				this.select(i,ev);
				return false;
			}
		}
		// 何もない場所をクリックした
		if( ! this._always_select ) this.select(-1,ev);
		return false;
	};
	MochiKit.Signal.connect(elem,"onclick",this,this.onclick);
}

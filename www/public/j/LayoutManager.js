// ブラウザ判別
var LayoutManager_uai = new UAIdentifier();

// パディング用のコンテナ
function BlankPane(w,h){
	this.getMinSize = function(){
		var dim = new MochiKit.Style.Dimensions(
			((w!=null)?w:0),
			((h!=null)?h:0)
		);
		return dim;
	}
	this.setPaneSize = function(dim,pos){
	}
}

// パディング用のコンテナ
function LayerdPane(){
	this.name = arguments[0];
	for(var i=1;i<arguments.length;++i){
		this[i-1] = arguments[i];
		this.length = i;
	}

	this.getMinSize = function(){
		var max = new MochiKit.Style.Dimensions(0,0);
		for(var i=0;i<this.length;++i){
			var dim = this[i].getMinSize();
			if(max.w <dim.w) max.w = dim.w;
			if(max.h <dim.h) max.h = dim.h;
		}
		logDebug("LayerdPane getMinSize "+max);
		return max;
	};

	this.setPaneSize = function(dim,pos){
		var dim2 = new MochiKit.Style.Dimensions(0,0);
		var pos2 = new MochiKit.Style.Coordinates(0,0);
		for(var i=0;i<this.length;++i){
			dim2.w = dim.w;
			dim2.h = dim.h;
			pos2.x = pos.x;
			pos2.y = pos.y;
			this[i].setPaneSize(dim,pos);
		}
	};
}

// ページ中の要素と関連付けられたコンテナ
function SimplePane(id,size_w,size_h ,width_t,width_r,width_b,width_l ){
	this.getMinSize = function(){
		var dim = new MochiKit.Style.Dimensions(width_l+width_r,width_t+width_b);
		if(size_w) dim.w += size_w;
		if(size_h) dim.h += size_h;
		return dim;
	}
	this.setPaneSize = function(dim,pos){
		var pos2 = new MochiKit.Style.Coordinates(pos.x + width_l,pos.y + width_t);
		var dim2 = new MochiKit.Style.Dimensions(dim.w -width_l-width_r,dim.h-width_t-width_b);
		MochiKit.Style.setElementPosition(id,pos2);
		MochiKit.Style.setElementDimensions(id,dim2);
	}
}

// weightに応じてサイズを振り分けるコンテナ
function WeightPane(name,horizontal){
	this._child = [];
	this._weights = [];
	this._weights_sum =0;
	for(var i=2;i<arguments.length;i+=2){
		this._weights_sum +=arguments[i] ;
		this._weights.push( arguments[i] );
		this._child.push( arguments[i+1] );
	}
	this._child_count = this._child.length;

	this.getMinSize = function(){
		var dim = new MochiKit.Style.Dimensions(0,0);
		for(var i=0;i<this._child_count;++i){
			var dim2 = this._child[i].getMinSize();
			if(horizontal){
				dim.w += dim2.w;
				if(dim.h<dim2.h) dim.h = dim2.h;
			}else{
				if(dim.w<dim2.w) dim.w = dim2.w;
				dim.h += dim2.h;
			}
		}
		MochiKit.Logging.logDebug("WeightPane ",name," getMinSize=",dim)
		return dim;
	}

	this.setPaneSize = function(dim,pos){
		// logDebug("WeightPane ",name," setPaneSize=",dim)
		var child_count = this._child_count;
		if(child_count>0){
			// 各要素の最小サイズを取得する
			var weight_sum =this._weights_sum;
			var min_size_sum =0;
			var min_size_ary =[];
			for(var i=0;i<child_count;++i){
				var dim2 = this._child[i].getMinSize();
				var min_size = (horizontal?dim2.w:dim2.h);
				if(min_size<0) min_size = 0;
				min_size_sum += min_size;
				min_size_ary.push(min_size);
			}
			// 余りにweightをつけて分配する
			var pos2 = new MochiKit.Style.Coordinates(pos.x,pos.y);
			var dim2 = new MochiKit.Style.Dimensions(dim.w,dim.h);
			var left = (horizontal?dim.w:dim.h) - min_size_sum;
			var weight_i = 0;
			var weight_pre =0;
			for(var i=0;i<child_count;++i){
				var width = min_size_ary[i];
				if( left >0 && this._weights[i] >0 ){
					weight_i += this._weights[i];
					var extra = Math.floor( left*(weight_i/this._weights_sum) - weight_pre );
					weight_pre += extra;
					width += extra;
				}
				width = Math.floor(0.5 + width);
				if(horizontal){
					dim2.w = width
					this._child[i].setPaneSize(dim2,pos2);
					pos2.x += width;
				}else{
					dim2.h = width;
					this._child[i].setPaneSize(dim2,pos2);
					pos2.y += width;
				}
			}
		}
	}
}

function FramePane(classPrefix,srcPrefix,srcSuffix,width_t,width_r,width_b,width_l,bCenter){
	MochiKit.DOM.appendChildNodes(document.body,(this.tl = MochiKit.DOM.IMG({'class':classPrefix+'TL','src':srcPrefix+'TL'+srcSuffix},null)));
	MochiKit.DOM.appendChildNodes(document.body,(this.tm = MochiKit.DOM.IMG({'class':classPrefix+'TM','src':srcPrefix+'TM'+srcSuffix},null)));
	MochiKit.DOM.appendChildNodes(document.body,(this.tr = MochiKit.DOM.IMG({'class':classPrefix+'TR','src':srcPrefix+'TR'+srcSuffix},null)));
	MochiKit.DOM.appendChildNodes(document.body,(this.ml = MochiKit.DOM.IMG({'class':classPrefix+'ML','src':srcPrefix+'ML'+srcSuffix},null)));
	if(bCenter) MochiKit.DOM.appendChildNodes(document.body,(this.mm = MochiKit.DOM.IMG({'class':classPrefix+'ML','src':srcPrefix+'MM'+srcSuffix},null)));
	MochiKit.DOM.appendChildNodes(document.body,(this.mr = MochiKit.DOM.IMG({'class':classPrefix+'MR','src':srcPrefix+'MR'+srcSuffix},null)));
	MochiKit.DOM.appendChildNodes(document.body,(this.bl = MochiKit.DOM.IMG({'class':classPrefix+'BL','src':srcPrefix+'BL'+srcSuffix},null)));
	MochiKit.DOM.appendChildNodes(document.body,(this.bm = MochiKit.DOM.IMG({'class':classPrefix+'BM','src':srcPrefix+'BM'+srcSuffix},null)));
	MochiKit.DOM.appendChildNodes(document.body,(this.br = MochiKit.DOM.IMG({'class':classPrefix+'BR','src':srcPrefix+'BR'+srcSuffix},null)));

	this.getMinSize = function(){
		logDebug("FramePane.getMinSize "+(width_l+width_r)+","+(width_t+width_b));
		return new MochiKit.Style.Dimensions(width_l+width_r,width_t+width_b);
	}
	this.setPaneSize = function(dim,pos){
		var pos2 = new MochiKit.Style.Dimensions(0,0);
		pos2.y=pos.y;
		pos2.x=pos.x;               MochiKit.Style.setElementPosition(this.tl,pos2);
		pos2.x=pos.x+width_l;       MochiKit.Style.setElementPosition(this.tm,pos2);
		pos2.x=pos.x+dim.w-width_r; MochiKit.Style.setElementPosition(this.tr,pos2);

		pos2.y=pos.y+width_t;
		pos2.x=pos.x;               MochiKit.Style.setElementPosition(this.ml,pos2);
		if(bCenter) {
			pos2.x=pos.x+width_l;   MochiKit.Style.setElementPosition(this.mm,pos2);
		}
		pos2.x=pos.x+dim.w-width_r; MochiKit.Style.setElementPosition(this.mr,pos2);

		pos2.y=pos.y+dim.h-width_b;
		pos2.x=pos.x;               MochiKit.Style.setElementPosition(this.bl,pos2);
		pos2.x=pos.x+width_l;       MochiKit.Style.setElementPosition(this.bm,pos2);
		pos2.x=pos.x+dim.w-width_r; MochiKit.Style.setElementPosition(this.br,pos2);

		var dim2 = new MochiKit.Style.Dimensions(0,0);

		dim2.w = dim.w-(width_l+width_r);
		dim2.h = width_t;           MochiKit.Style.setElementDimensions(this.tm,dim2);
		dim2.h = width_b;           MochiKit.Style.setElementDimensions(this.bm,dim2);

		dim2.h = dim.h-(width_t+width_b);
		dim2.w = width_l;           MochiKit.Style.setElementDimensions(this.ml,dim2);
		dim2.w = width_r;           MochiKit.Style.setElementDimensions(this.mr,dim2);
		if(bCenter) {
			dim2.w = dim.w-(width_l+width_r); MochiKit.Style.setElementDimensions(this.mm,dim2);
		}

		dim2.w = width_l;
		dim2.h = width_t;           MochiKit.Style.setElementDimensions(this.tl,dim2);
		dim2.h = width_b;           MochiKit.Style.setElementDimensions(this.bl,dim2);

		dim2.w = width_r;
		dim2.h = width_t;           MochiKit.Style.setElementDimensions(this.tr,dim2);
		dim2.h = width_b;           MochiKit.Style.setElementDimensions(this.br,dim2);

		logDebug("FramePane.setPaneSize");
	}
}

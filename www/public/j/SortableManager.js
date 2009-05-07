SortableManager = function (){
	this.thead = null; 
	this.tbody = null; 
	this.columns = []; 
	this.rows = []; 
	this.sortState = {}; 
	this.sortkey = 0; 
}; 

function quotemeta (string) {
    return string.replace(/(\W)/, "\\$1");
}
mouseOverFunc = function(){ MochiKit.DOM.   addElementClass(this, "over"); };
mouseOutFunc  = function(){ MochiKit.DOM.removeElementClass(this, "over"); };

ignoreEvent = function (ev){ 
	if( ev && ev.preventDefault ){ 
		ev.preventDefault(); 
		ev.stopPropagation(); 
	}else if(typeof(event) != 'undefined'){ 
		event.cancelBubble = false; 
		event.returnValue = false; 
	} 
}; 

MochiKit.Base.update(SortableManager.prototype,{ 
	"initWithTable": function (a_table_elem,a_SearchText_elem){ 
		this.SearchText = a_SearchText_elem;

		// Ensure that it's a DOM element 
		table = a_table_elem;

		// Find the thead 
		this.thead = table.getElementsByTagName('thead')[0]; 

		// get the mochi:format key and contents for each column header 
		var cols = this.thead.getElementsByTagName('th'); 
		for( var i = 0; i < cols.length; i++ ){ 
			var node = cols[i]; 
            var attr = null; 
            try{ 
                attr = node.getAttribute("mochi:format"); 
            } catch (err) { 
                // pass 
            }
			var o = node.childNodes; 
			this.columns.push({ 
                "format": attr, 
                "element": node, 
                "proto": node.cloneNode(true)
            }); 
        }
		// scrape the tbody for data 
		this.tbody = table.getElementsByTagName('tbody')[0];
		var rows = this.tbody.getElementsByTagName('tr');
        for(var i = 0; i < rows.length; i++){ 
            // every cell 
            var row = rows[i]; 
            var cols = row.getElementsByTagName('td'); 
            var rowData = []; 
            for (var j = 0; j < cols.length; j++) { 
                // scrape the text and build the appropriate object out of it 
                var cell = cols[j]; 
                var obj = scrapeText(cell); 
                switch (this.columns[j].format) { 
                    case 'isodate':
                        obj = isoDate(obj);
                        break; 
                    case 'str': 
                        break; 
                    case 'istr': 
                        obj = obj.toLowerCase(); 
                        break;
                    // cases for numbers, etc. could be here 
                    default:
                        break; 
                } 
                rowData.push(obj); 
            } 
            // stow away a reference to the TR and save it 
            rowData.row = row.cloneNode(true); 
            this.rows.push(rowData);
        } 
 
        // do initial sort on first column 
        this.drawSortedRows(this.sortkey, false, false); 
	},

	// Return a sort function for click events
    "onSortClick": function (name) { 
        return MochiKit.Base.method(this, function () { 
            var order = this.sortState[name]; 
            if( order == null ){ 
                order = true; 
            }else if (name == this.sortkey){ 
                order = !order; 
            } 
            this.drawSortedRows(name, order, true); 
        }); 
    }, 

	'checkRowOdd':function(tr){
		if(tr.style.display == 'none') return;
		tr.className = ((1&++this.checkRowOdd_idx)?'alternate':'');
	},
 
    "drawSortedRows": function(key, forward, clicked){
		this.sortkey = key; 
		// sort based on the state given (forward or reverse) 
		var cmp = (forward ? MochiKit.Base.keyComparator : MochiKit.Base.reverseKeyComparator); 
		this.rows.sort(cmp(key)); 
		// save it so we can flip next time 
        this.sortState[key] = forward; 
        // get every "row" element from this.rows and make a new tbody 
        var newBody = MochiKit.DOM.TBODY(null, MochiKit.Base.map(MochiKit.Base.itemgetter("row"), this.rows));
        this.checkRowOdd_idx=0;
        for(var i=0,ie=newBody.childNodes.length;i<ie;++i){
			this.checkRowOdd(newBody.childNodes[i]);
		}
        // swap in the new tbody 
        this.tbody = MochiKit.DOM.swapDOM(this.tbody, newBody); 
        for (var i = 0; i < this.columns.length; i++) { 
            var col = this.columns[i]; 
            var node = col.proto.cloneNode(true); 
            // remove the existing events to minimize IE leaks 
            col.element.onclick = null; 
            col.element.onmousedown = null; 
            col.element.onmouseover = null; 
            col.element.onmouseout = null; 
            // set new events for the new node 
            node.onclick = this.onSortClick(i); 
            node.onmousedown = ignoreEvent; 
            node.onmouseover = mouseOverFunc; 
            node.onmouseout = mouseOutFunc; 
            // if this is the sorted column 
            if (key == i) { 
                // \u2193 is down arrow, \u2191 is up arrow 
                // forward sorts mean the rows get bigger going down 
                var arrow = (forward ? "▲" : "▼"); 
                // add the character to the column header 
                node.getElementsByTagName('SPAN')[0].appendChild(MochiKit.DOM.SPAN(null, arrow)); 
                if(clicked) node.onmouseover(); 
            } 
            // swap in the new th 
            col.element = MochiKit.DOM.swapDOM(col.element, node); 
        } 
    },

	'loadChannelList':function(req){
		MochiKit.DOM.replaceChildNodes(this.tbody);
		var tags=req.responseXML.getElementsByTagName('channel');
		var list = [];
		for(var i=0,ie=tags.length;i<ie;++i){
			var tag = tags[i];
			var item = {
				'active':parseInt(tag.getAttribute("active"),10),
				'users':parseInt(tag.getAttribute("users"),10),
				'name':tag.getAttribute("name"),
				'short':tag.getAttribute("short"),
				'sort':tag.getAttribute("sort"),
				'topic':tag.getAttribute("topic")
			};
			list.push(item);
		}
		list.sort(function(a,b){
			var i;
			i=(b.active -a.active);if(i) return i;
			i=(b.users  -a.users );if(i) return i;
			if(a.sort < b.sort ) return 1;
			if(a.sort > b.sort ) return -1;
			return 0;
		});
		this.rows = [];
		for( var i=0,ie=list.length;i<ie;i++ ){ 
			var src = list[i];
			var rowData = [src.active,src.users,src.sort];
			if( src.topic.match(/^↓(\-?\d*)/) ){
				var n=0;
				if( RegExp.$1 ) n = parseInt(RegExp.$1,10);
				if(rowData[0]>n) rowData[0] = n;
			}
			rowData.row = MochiKit.DOM.TR({}
				,MochiKit.DOM.TD({'nowrap':'nowrap','class':'clistnumber'},src.active)
				,MochiKit.DOM.TD({'nowrap':'nowrap','class':'clistnumber'},src.users)
				,MochiKit.DOM.TD({'nowrap':'nowrap','class':'clistname'}
					,MochiKit.DOM.A({'target':'quickirc2','alt':src.name,'href':"/qi2/qi2.html?utf8="+encodeURIComponent(src.name),'onclick':"getSelectedConnNode().joinAlt(this);return false;"},src.short)
					,MochiKit.DOM.DIV({'class':'clisttopic'},src.topic)
				)
			);
			this.rows.push(rowData);
		}
		// alert("rows has "+self.rows.length+" entry");
		// do initial sort on first column 
		this.drawSortedRows(this.sortkey, false, false);
	},

	'isearch':function(pattern) {
		var regex = new RegExp(quotemeta(pattern), "i");
		var list = this.tbody.getElementsByTagName('tr');
		this.checkRowOdd_idx=0;
		for(var i=0,ie=list.length;i<ie;++i){
			var text = MochiKit.DOM.scrapeText(list[i].childNodes[2]);
			list[i].style.display=( text.match(regex) ? '' : 'none' );
			this.checkRowOdd(list[i]);
		}
    }
});


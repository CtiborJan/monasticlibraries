/**
 * list-box: v zásadě tabulka, ale značně rozšířená:
 * - jednoduché přidávání dalších řádků a nahrávání dat z XML/HTML/JSON
 * - možnost označovt (vybírat) data (různé módy výběru)
 * - možnost řadit podle zvolených sloupců
 * - možnost filtrovat a vyhledávat ve zvolených sloupcích
 * - možnost otevírání dalších podúrovní
 * - zobrazení souhrnu v patičce
 * 
 */
import * as WebPage from "./functions.js";


var slotted_css=`
<style>
                :host
                {
                    display:block;
                    width:100%;
                }
                list-box table
                {
                    width:100%;
                }
                list-box 
                {
                    display:block;
                    width:100%;
                }
		list-box table tbody tr.lst_expanded_row > td
		{
                    padding-left:20px;
		}
                list-box highlight
                {
                    font-weight:bold;
                }
                list-box table tbody td.lst_expand_c
                {
                    width:10px;
                }   
                list-box table tbody td.lst_expand_c::after
		{
			content:"+";
			cursor:pointer;
		}
		list-box table tbody td.lst_expand_c.exp::after
		{
			content:"-";
			cursor:pointer;
		}
                list-box table tbody tr td.same-value
                {
                    color:lightgray;
                }
                
                list-box th.w100,td.w100 {max-width:100%;}
                list-box th.w70,td.w70 {max-width:70%;}
                list-box th.w30,td.w30 {max-width:30%;}
                list-box th.w15,td.w15  {max-width:15%;}
                list-box th.w25,td.w25 {max-width:25%;}
                list-box th.hidden,td.hidden {display:none};
                
                list-box table thead tr.sort th 
                {
                    cursor:pointer;
                }
                list-box table thead tr.sort th.sort::after
                {
                    content:'▽';
                }
                list-box table thead tr.sort th.sort.sorted1::after
                {
                    content:'▼';
                }
                list-box table thead tr.sort th.sort.sorted2::after
                {
                    content:'▲';
                }
                list-box table thead tr.sort th::after
                </style>
		`;
WebPage.WebComponentCssInjector.addGlobalStyle(slotted_css);


class ListBox_Header
{
	constructor(_listbox)
	{
            //_thead - original thead
		this.listbox=_listbox;
		this.thead=null;
                this.caption_row=null;
                this.sorting_row=null;
		this.filter_row=null;
                this._visible=true;
                this._sortable=true;
	}
        onConnected()
        {
            this.thead=this.listbox.thead;
            this.caption_row=this.thead.children[0];
            this.visible=this._visible;
        }
        add_row(type)
        {
            var tr=document.createElement("tr");
            tr.setAttribute("type",type);
            tr.innerHTML=this.caption_row.innerHTML;
            tr.classList.add(type);
            var i=0;
            for (let th of tr.children) 
            {
                if (!(th.getAttribute("expand_column")=="true"))
                {
                    th.setAttribute("name","th_"+type);
                    th.classList.add(type);
                }
                th.innerHTML="";
                th.dataset["column"]=i;
               
                i++;
            }
            this.thead.appendChild(tr);
            WebPage.addToPagePopulation({obj:this,element:tr});
        }
        
        th_sort__onclick=(e)=>
        {
            var cindex=e.target.dataset["column"];
            if (cindex!=undefined)
                this.listbox.columns[cindex].sort();
        }
        
        set visible(value)
        {
            this._visible=value;
            if (this.caption_row==null)
                return 0;
            if (value==false)
            {
                this.caption_row.style.display="none";
                if (this._sortable==true && this.sorting_row==null)
                {
                    this.add_row("sort");
                }
            }
            else
            {
                this.caption_row.style.display="";
            }
        }
        get visible()
        {
            return this._visible;
        }
	show_filters()
	{
		if (this.filter_row==null)
		{
			this.filter_row=document.createElement("tr");
			for (var c of this.listbox.columns)
			{
				var td=document.createElement("th");
				if (c.filter_enabled==true && c.expand_column==false)
				{
					var text=document.createElement("input");
					text.type="text";
					text.onkeyup=c.filter.bind(c);
					td.appendChild(text);
				}
				this.filter_row.appendChild(td);
			}
			this.thead.appendChild(this.filter_row);
		}
		else
			this.thead.filter_row.style.display="";
	}
        
}
class List_Box extends HTMLElement
{
        static stylesheet_loaded=false;
	/*private properties*/
	#last_clicked_index; 
	#last_mouse_position;
	#row_count;
	#expandable_rows;

	#columns;
	#columns_count;

	#add_to_selection(what,deselect_other=true,deselect_if_selected=false)
	{
		/*
		add rows to selection / replace current selection (if deselect other==true)
		*/
		if (Array.isArray(what))
		{
			if (what.length==2 && typeof(what[0])==="number" && typeof(what[1])==="number")
			{//zadáno indexy pole od-do
				let n=[Number(what[0]),Number(what[1])];
				let trs=this.tbody.getElementsByClassName("lst_item");
				for (let tr of trs)
				{
					if (tr.parentNode===this.tbody)
					{
						if (Number(tr.dataset["index"])>=Math.min(...n) && Number(tr.dataset["index"])<=Math.max(...n))
							tr.classList.add("lst_selected");
						else
							if (deselect_other==true)
								tr.classList.remove("lst_selected");
					}
				}
			}
		}
		else if (typeof(what)==="object" && what.nodeType!==undefined)
		{
			if (what.classList.contains("lst_item")==true)
				if (deselect_if_selected==false || what.classList.contains("lst_selected")==false)
					what.classList.add("lst_selected");
				else
					what.classList.remove("lst_selected");
		}
	}
	#deselect()
	{
		for (let tr of this.tbody.children)
		{
			tr.classList.remove("lst_selected");
		}
	}
	#get_row_and_cell_on_mouseEvent=(e)=>
	{
		/**
		 * we don't add mouse event listener on every row/cell, but to the table as a whole. 
		 * This method gets the td/tr under the mouse cursor
		 */
		var TR=null;
		var TD=null;
		var T=null;
		var row_index=-1;
		var column_index=0;
		if (e)
		{
			T=e.target;
			while (T.isSameNode(e.currentTarget)==false && T.classList.contains("listcontrol_container")==false)//abychom zabránili probublání nahoru v případě vložených seznamů
			{
				if (T.nodeName.toLowerCase()=="tr" )
					TR=T;
				if (T.nodeName.toLowerCase()=="td")
					TD=T;
				T=T.parentNode;
			}
		}
		if (TR==null && TD==null)
			return this.#last_mouse_position;//jsme stále v tabulce, ale někde mezi buňkami - nechceme se ale tvářit, jako že jsme tabulku opustili!
		if (TR.parentNode.isSameNode(this.tbody)==false)
			return null;//jsme v nějaké vnořené tabulce!
		
		if (TR!=null)
			row_index=Number(TR.dataset["index"]);
		if (TD!=null)
		{
			T=TD;
			while (T.previousSibling)
			{
				column_index++;
				T=T.previousSibling;
			}
		}
		return {row:TR,row_index:row_index,cell:TD,column_index:column_index};
	}
	
	#appropriate_table(args)
	{
		/**
		 * if we get a html table already from the server as child element of the list-box, we don't "reconstruct" it,
		 * we only adapt it to serve as our "underlying" table
		 */
		let table=this.getElementsByTagName("table")[0];
                
                //let table=this.children[0];
		let appropriating=false;
		let had_tbody=false;
		if (table==null || table.nodeName!="TABLE")
			this.table=document.createElement("table");
		else
		{
			this.table=table;
			appropriating=true;
		}
		let tbody=this.table.getElementsByTagName("tbody");
		if (tbody.length>0)
		{
			this.tbody=tbody[0];
			had_tbody=true;
		}
		else
		{
			this.tbody=document.createElement("tbody");
			this.table.appendChild(this.tbody);
		}

		let th=this.table.getElementsByTagName("thead");
		if (th.length>0)
		{
			this.thead=th[0];
			this.columns=this.thead.children[0].children;
		}
		else
		{
			this.thead=document.createElement("thead");
			this.table.appendChild(this.thead);
		}
                this.header.onConnected();
		
		let tfoot=this.table.getElementsByTagName("tfoot");
		if (tfoot.length>0)
		{
			this.tfoot=tfoot[0];
		}
		else
		{
			this.tfoot=document.createElement("tfoot");
			this.table.appendChild(this.tfoot);
		}
		this.#row_count=0;
		if (appropriating==true)
		{
			let tr_parent;
			if (had_tbody==true)
				tr_parent=this.tbody;
			else
				tr_parent=this.table;

			var prev_tr=null;
			for (let tr of tr_parent.children)
			{
                            if (tr.nodeName=="TR")
                            {
                                if (tr.classList.contains("lst_expanded_row")==false)
                                {
                                    tr.dataset["index"]=this.#row_count;
                                    this.#row_count++;
                                    if (tr.classList.contains("lst_item")==false)
                                        tr.classList.add("lst_item");

                                    if (this.collaps_identical_values==true && prev_tr!=null)
                                    {
                                        for (var j=0;j<tr.children.length;j++)
                                        {
                                            if (tr.children[j].classList.contains("lst_expand_c")==false)
                                                if (prev_tr.children[j]!=undefined && prev_tr.children[j].textContent==tr.children[j].textContent )
                                                tr.children[j].style.visibility="hidden";
                                        }
                                    }

                                    prev_tr=tr;
                                    

                                }
                                else
                                {
                                    tr.dataset["index"]="";
                                    if (this.expand_all)
                                    {
                                        tr.style.display="";
                                        var expCol=tr.previousElementSibling.getElementsByClassName("lst_expand_c")[0].classList.toggle("exp");
                                    }
                                }
                            }
                            else
                                tr.remove();
			}
		}
		else
		{
			for (let ch of this.children)
			{
				if (["columns","header"].includes(ch.nodeName.toLowerCase()))
					this.#columns=ch.children;
				else
					this.add_row(ch);
				ch.remove();
			}
		}
                
                this.rows_pairs_iterator(this.same_value_markup);
		
		
		this.table.addEventListener("click",this.table_onclick);
		this.table.addEventListener("mousemove",this.table_onmousemove);
		this.table.addEventListener("mouseleave",this.table_onmouseleave);
		this.rows_visible=this.#row_count;
                
		this.#last_clicked_index=-1;
		this.#last_mouse_position=null;
		
	}
	#appropriate_row(tr)
	{

	}
        #rows()
        {
            var rows=[];
            for (var i=0;i<this.tbody.children.length;i++)
            {
                var row=[];
                var tr=this.tbody.children[i];
                var next_tr=this.tbody.children[i+1];
                if (tr.classList.contains("lst_item"))
                {
                    row.push(tr);
                    if (next_tr!=null && !next_tr.classList.contains("lst_item"))
                    {
                        row.push(next_tr);
                        i++;
                    }
                }
                rows.push(row);
            }
            return rows;
        }
        
	constructor()
	{
		super();

		this.#columns=[];
		this.#columns_count=0;
		this.#row_count=0;
		this.#expandable_rows=false;
		this.header_set=false;
                this.header=new ListBox_Header(this);
		this.collaps_identical_values=(this.getAttribute("collapse_identical_values")=="true");
		this.show_filters=(this.getAttribute("show_filters")=="true");
		this.selection_mode=3;//0=nelze vybírat;1=lze označit jeden řádek;2=lze označovat víc řádků v bloku  (pomocí SHIFT); 3=lze označovat více řádků jednotlivě (pomocí CTRL, příp. SHIFT+CTRL)
		this.expand_all=(this.getAttribute("expand_all")=="true");
                this.rows_visible=0;
		/**
		 * internal methods
		 */
		this.onRowAdded=null;
		this.onMouseEntersRow=null;
		this.onMouseExitsRow=null;
		this.onMouseExitsColumn=null;
		this.onMouseEntersColumn=null;


		this.onRowExpanded=null;
		this.onAfterRowExpanded=null;
		
		/**
		 * internal helper references
		 */
		this.table=null;
		this.thead=null;
		
		//read the table already present - if any
               

		
		
	}

	/**
	 * callback functions
	 */
	
	connectedCallback()
	{
            if (this.shadowDOM===undefined)
            {
                this.shadowDOM=this.attachShadow({mode:'open'});
                this.shadowDOM.innerHTML="<slot></slot>";
                //this.innerHTML=this.innerHTML;

                this.#appropriate_table();
            }
            /*if (List_Box.stylesheet_loaded==false)
            {
                var style=document.createElement("style");
                style.type="text/css";
                style.innerText=this.css;
                document.head.appendChild(style);
                List_Box.stylesheet_loaded=true;
            }*/
	}
        connectedMoveCallback()
        {
            //for moving the element in the page (e. g. by sorting)
        }
        
	static get observedAttributes()
	{
		return ["sticky_header","collaps_identical_values","expand_all",
                    "show_header","hide_header"];
	}
	attributeChangedCallback(name, oldValue, newValue)
	{
            
            if (name=="sticky_header")
            {
                    this.sticky_header = newValue=="true";
            }
            else if (name=="collaps_identical_values")
            {
                    this.collaps_identical_values=newValue=="true";
            }
            else if (name=="expand_all")
            {
                this.expand_all=newValue=="true";
            }
            else if (name=="show_header")
            {
                this.header.visible=true;
            }
            else if (name=="hide_header")
            {
                this.header.visible=false;
            }
                
	}

	/**
	 *  getters and setters:
	 */
	
	set sticky_header(value)
	{
		if (value==true)
		{
			this.thead.style.position="sticky";
			this.thead.style.top="1";
		}
		else
			this.thead.style.position="";
	}
	get sticky_header()
	{
		return this.thead.style.position=="sticky";
	}


	set row_count(value){/*readonly*/}
	get row_count()
	{
		return this.#row_count;
	}
	get columns_count(){return this.#columns.length;}
	set columns_count(value){/*read-only*/}
	
	set columns(args)
	{
		/**
		 * setting columns with all their properties
		 */
		this.#columns_count=args.length;
		this.#columns=[];
		for (var i=0;i<args.length;i++)
		{			
			//may be given as an object, or string litteral ()= name & caption)

			if (typeof(args[i])==="string")
				var c={name:args[i],caption:args[i]};
			else if (typeof(args[i])==="object" && args[i].nodeType===1)
			{
				var c={};
				for (let p of args[i].attributes)
				{
					c[p.name]=args[i].getAttribute(p.name);
				}
                                if (c["caption"]===undefined)
                                    c["caption"]=args[i].textContent;
			}
			else
				var c=args[i];

			if (c.name!="" && c.caption==undefined)
				c.caption=c.name;
			
			//new empty instance contianing all needed properties - will be merged with object we got from outside (as args)
			let new_column=
			{
				name:c.name,
				caption:c.caption,
				expand_column:c.expand_column!=undefined ? true : false,
				is_default_value: false, //default value for selection: can only be one column				
				hidden:false,
				datatype:"",
				filter_enabled:true,
				onCellAdded: null, //event to triger, when new cell is added to this column (ie new row)
				onclick:null, //event to triger on click in any cell of this column
				myFilter:null,
				th:null,
				tbody:this.tbody,
				width:"",
				index:i,
                                list_obj:this,
                                sorted:0,//0=not sorted, 1=ascending,2=descending
                                sortingColumn:null,
                                sortingFunction:function(a,b)
                                {
                                    if ((typeof a.value=="string" || typeof b.value=="string")|| sortColumn.datatype=="string")
                                    {
                                        return String(a.value).localeCompare(String(b.value),"cs",{sensitivity:"accent"});
                                    }
                                    else if ((typeof a.value=="number" && typeof b.value=="number") || sortColumn.datatype=="number")
                                    {
                                        a=Number(a);
                                        b=Number(b);
                                        return a-b;
                                    }
                                },
				
				auto:c.auto!=undefined ? c.auto : false,//má se přidat automaticky ke všem sloupcům, aniž by byl explicitně uveden při addRow? (např. sloupec pro rozbalovací ikonku)
				auto_cell_text:c.auto_cell_text!=undefined ? c.auto_cell_text : null,
				_visible: true,
				set visible(value)
				{
					if (this.hidden==true)
						value=false;
					
					if (value==false || value=="false")
						var displayValue="none";
					else
						var displayValue="";
					
					this.th.style.display=displayValue;
					for (tr of this.tbody.children)
					{
						if (tr.classList.contains("lst_expanded_row")==false)
							tr.children[this.index].style.display=displayValue;
					}
					
				},
				get visible(){return this._visible;},
				
				_sortable:true,

				set cells(arg){},
				get cells()
				{
					var c=[];
					var rows=this.tbody.children;
					for (var r of rows)
					{
                                            if (r.classList.contains("lst_expanded_row")==false)
                                            {
						let tds=r.children;
						c.push(tds[this.index]);
                                            }
					}
					return c;
				},

				filter:function(e) 
				{
                                    var rows_visible=0;
                                    var filter_value;
                                    if (typeof e=="string")    
                                        filter_value=e;
                                    else if (e!=null)
                                        filter_value=e.target.value;

                                    var default_filter=function(search,text)
                                    {
                                            let re=new RegExp(search);
                                            if (re.test(text))
                                                    return true;
                                            else
                                                    return false;
                                    };
                                    var myCells=this.cells;

                                    for (c of myCells)
                                    {
                                        var exp_row=c.parentNode.nextElementSibling;
                                        if (exp_row!=null && exp_row.classList.contains("lst_expanded_row")==false)
                                            exp_row=null;
                                        var r=false;
                                        if (filter_value!=="")
                                        {
                                            if (this.myFilter==null)
                                                r=default_filter(filter_value,c.textContent);
                                            else
                                                r=this.myFilter(filter_value,c);
                                        }
                                        else
                                            r=true;

                                        if (r==true)
                                        {
                                            c.parentNode.style.display="";
                                            if (exp_row!=null)
                                                exp_row.style.display="";
                                            rows_visible++;
                                            this.highlight_cell(c,filter_value);
                                        }
                                        else
                                        {
                                            c.parentNode.style.display="none";
                                            if (exp_row!=null)
                                                exp_row.style.display="none";
                                        }
                                    }
                                    var i=0;
                                    this.list_obj.rows_visible=rows_visible;
                                    return rows_visible;
				},
                                highlight(phrase)
                                {
                                    var cells=this.cells;
                                    for (c of cells)
                                    {
                                        this.highlight_cell(c,phrase);
                                    }
                                },
                                highlight_cell:function(cell,phrase)
                                {
                                    if (phrase==null)
                                        return false;
                                    /*cell.innerHTML=cell.innerHTML.replaceAll(phrase,"<highlight>"+phrase+"</highlight>");*/
                                    var rg=new RegExp(phrase,"gi");
                                    var matchIt=cell.textContent.toLowerCase().matchAll(rg);
                                    var matches=[];
                                    WebPage.myRange.unwrap(cell,"highlight");
                                    if (phrase!="")
                                    {
                                        for (let match of matchIt)
                                        {
                                            new WebPage.myRange(cell,match.index,match.index+match[0].length).wrap("highlight");

                                        }
                                    }
                                    
                                },
                                sort:function(direction=null)
                                {
                                    if (direction==null)
                                    {
                                        this.sorted++;
                                        if (this.sorted==3)
                                            this.sorted=1;
                                    }
                                    else if (1>=direction && 2<=direction)
                                        this.sorted=direction;
                                    else
                                        return false;
                                    
                                    if (this.sortingColumn==null)
                                        this.sortingColumn=this;
                                    
                                    var cells=this.sortingColumn.cells;
                                    
                                    var i=0;
                                    var cells2=cells.map(c=>
                                    {
                                       return {value:c.textContent,index:i++};
                                    });
                                    
                                    if (this.sorted==1)
                                        cells2.sort(this.sortingFunction).reverse();
                                    else
                                        cells2.sort(this.sortingFunction);
                                    var table_rows=this.list_obj.#rows();
                                    

                                    for (let c of cells2)
                                    {
                                        for (let r of table_rows[c.index])
                                            if (this.tbody.moveBefore==undefined)
                                                this.tbody.append(r);
                                            else
                                                this.tbody.moveBefore(r,null);
                                    }
                                    this.list_obj.rows_pairs_iterator(this.list_obj.same_value_markup);
                                    var sort_row=this.list_obj.thead.getElementsByClassName("sort")[0];
                                    for (let i=0;i<sort_row.children.length;i++)
                                    {
                                        let th=sort_row.children[i];
                                        th.classList.remove("sorted1");
                                        th.classList.remove("sorted2");
                                        if (i==this.index)
                                        {
                                            th.classList.add("sorted"+this.sorted);
                                        }
                                            
                                    }
                                }
				
			};


			//merge object given as arg to the function with empty instance containing all needed properties
			Object.assign(new_column,c);
			
				
			
			this.#columns.push(new_column);
			for (var i=0;i<this.#columns.length-1;i++)//všechny předchozí
			{
				if (this.#columns[i].is_default_value==true)
					this.#columns[i].is_default_value=false;//jako highlander: může být jen jeden!
				if (this.#columns[i].auto_cell_text!=null)
					this.#columns[i].auto=true;
			}
			

		}
		this.header_set=true;
		
		//this.#composeHeaderHTML();
	}
	get columns()
	{
		return this.#columns;
	}
        getColumn(id)
        {
            for (var c of this.#columns)
            {
                if (typeof id=="string")
                {
                    if (c.name==id)
                        return c;
                }
                else if (typeof id=="number")
                {
                    if (c.index==id)
                        return c;
                }
            }
        }


	
	/**
	 * ##### Selection #####
	 * Selection modes:
	 * 0 - no selection
	 * 1 - only one row can be selected
	 * 2 - multiselect, but in one block
	 * 3 - multiselect, completely free 
	 * 
	 * actual selecting happens in table onclick 
	 */
        
	get selection()
	{
		let def_value=-1;
		for (let i=0;i<this.#columns_count;i++)
		{
			if (this.#columns[i].is_default_value==true)
				def_value=i;
		}
		let selected=this.tbody.getElementsByClassName("lst_selected");
		var values=Array();
		var value=null;
		var all_data=Array();
		var v;
		for (let s of selected)
		{
			for (let i=0;i<s.children.length;i++)
			{
				if (i==def_value)
				{
					if (s.children[i].dataset["value"]!=undefined)
						v=s.children[i].dataset["value"];
					else
						v=s.children[i].textContent;
					values.push(v);
					if (value==null)
						if (Number(s.dataset["index"])==this.#last_clicked_index)
							value=v;
				}
			}
		}
		return {value:value,values:values,all_data:all_data,html_elements:selected,count:selected.length};
	}
	set selection(value)
	{
		/*
			readonly
		 	to manually set selected rows, method add_to_selection can be used
		 */
	}
        value(row_index,column_index=-1)
        {
            if (column_index!=-1)
                return this.cellInterior(row_index,column_index).textContent;
        }

	cellInterior(row_index, column_index)
	{
		if (row_index>=0 && row_index<this.#row_count)
		{
			if (column_index>=0 && column_index<this.#columns_count)
			{
				var rows=this.tbody.children;
				for (var row of rows)
				{
                                    if (row.dataset["index"]==row_index)
                                    {
                                            var cells=row.getElementsByTagName("td")
                                            var cell=cells[column_index];
                                            if (cell.children[0]!=null && cell.children[0].nodeName.toLowerCase()=="div")
                                                    return cell.children[0];
                                            else
                                                    return cell;
                                    }
				}
			}
		}
		return null;
	}

	load_xml=(xml)=>
	{
		var rows=xml.children[0].children;
		this.add_rows(rows);
	}
        load_table=(htmlTable)=>
        {
            if (this.table!=null)
            {
                this.table.remove();
                if (typeof htmlTable==="string")
                {
                    var tmpDiv=document.createElement("div");
                    tmpDiv.innerHTML=htmlTable;
                    this.table=tmpDiv.firstElementChild;
                    this.appendChild(this.table);
                    this.#appropriate_table();
                }
            }
        }

	add_rows=(rows)=>
	{
            for (let r of rows)
                    this.add_row(r);
	}

	add_row=(items,newTR=null)=>
	{
		var appendTR=false;
		if (newTR==null)
		{
			appendTR=true;
			newTR=document.createElement("tr");
		}
		var j=0;

		if (Array.isArray(items)==false && typeof(items)==="object" && items.nodeType===1)//jako argument jsme dostali html element. Projedeme jeho děti a jejich obsah budeme považovat za to, co se má přidávat
		{
			var node_items=items;
			items=[];
			for (let ch of node_items.children)
			{
				items.push(ch.textContent);
			}
		}

		for (let i=0;i<Math.max(items.length,this.#columns_count);i++)
		{
			var newTD=newTR.children[i];
			var appendTD=false;
			if (newTD==null)
			{
				newTD=document.createElement("td");
				appendTD=true;
			}
			
			var item;
			if (this.#columns[i].auto==true)
			{
				item=this.#columns[i].auto_cell_text;
			}
			else
			{
				if (i<this.#columns_count && this.header_set==true)
					item=items[j];
				else
					item=null;
				j++;
			}
			
			
			
				
			//let innerDiv=document.createElement("div");
			if (this.#columns[i].hidden!=true)
			{
				//newTD.appendChild(innerDiv);
				if (typeof(item)==="string" || typeof(item)==="number")
				{
					newTD.innerHTML=item;
				}
				else if (typeof(item)==="object" && item.nodeType!=undefined)
				{
					newTD.innerHTML=item.innerHTML;
				}
			}
			else
				newTD.dataset["value"]=item==null ? "" : item;
			if (this.#columns[i].visible==false || this.#columns[i].hidden==true)
				newTD.style.display="none";

			if (appendTR==true)
				newTR.appendChild(newTD);
			
			
			
			
			if (this.#columns[i].onCellAdded!=null)
				this.#columns[i].onCellAdded(this,newTD,this.#row_count);
			
			
		}
		
		
		newTR.dataset["index"]=this.#row_count;
		newTR.classList.add("lst_item");
		if (appendTR==true)
			this.tbody.appendChild(newTR);
		if (this.onRowAdded!=null)
			this.onRowAdded(this,newTR,this.#row_count);
		this.#row_count++; 
	}
	table_onmouseleave=(e)=>
	{
		this.#last_mouse_position=null;
	}
	table_onmousemove=(e)=>
	{
		var s=this.#get_row_and_cell_on_mouseEvent(e);
		var entered_new_row=false;
		var exited_row=false;
		var entered_new_column=false;
		var exited_column=false;
		var entered_new_column=false;

		
		if (this.#last_mouse_position!=null && s!=null)
		{
			if (s.row_index!=this.#last_mouse_position.row_index)
			{
				exited_row=true;
				entered_new_row=true;
			}
			if (s.column_index!=this.#last_mouse_position.column_index)
			{
				exited_column=true;
				entered_new_column=true;
			}
		}
		else if (s==null && this.#last_mouse_position!=null)
		{
			exited_row=true;
			exited_column=true;
		}
		else if (this.#last_mouse_position==null && s!=null)
		{
			entered_new_row=true;
			entered_new_column=true;
		}		
		if (exited_row==true)
		{
			var d={detail:{list:this,...this.#last_mouse_position}};
			if (this.onMouseExitsRow!=null)
				this.onMouseExitsRow(d);
			this.dispatchEvent(new CustomEvent("MouseExitsRow",d));
			
		}
		if (entered_new_row==true)
		{
			var d={detail:{list:this,...s}};
			if (this.onMouseEntersRow!=null)
				this.onMouseEntersRow(d);
			this.dispatchEvent(new CustomEvent("MouseEntersRow",d));
			
		}
		if (exited_column==true)
			{
				var d={detail:{list:this,...this.#last_mouse_position}};
				if (this.onMouseExitsColumn!=null)
					this.onMouseExitsColumn(d);
				this.dispatchEvent(new CustomEvent("MouseExitsColumn",d));
				
			}
		if (entered_new_column==true)
		{
			var d={detail:{list:this,...s}};
			if (this.onMouseEntersColumn!=null)
				this.onMouseEntersColumn(d);
			this.dispatchEvent(new CustomEvent("MouseEntersColumn",d));
		}
		this.#last_mouse_position=s;
		
	}
	table_onclick=(e)=>
	{
		var s=this.#get_row_and_cell_on_mouseEvent(e);
		if (s==null)
			return false;
		if (e.target.tagName!="A")
			e.preventDefault();
		e.stopPropagation();
		
		if (s.cell.classList.contains("lst_expand_c"))
		{//expand column clicked
			this.expand_row(s.row,true,s);
		}
		
		/**
		 * selection handling
		 */
		if (this.selection_mode==1 || (this.selection_mode>1 && e.shiftKey==false && e.ctrlKey==false))
		{
			this.#deselect();
			this.#add_to_selection(s.row);
		}
		else if ((this.selection_mode==2 && e.shiftKey==true ) || (this.selection_mode==3 && e.shiftKey==true))
		{
			
			if (this.#last_clicked_index!=-1)
			{
				this.#add_to_selection([this.#last_clicked_index,s.row_index],(this.selection_mode==2 || (this.selection_mode==3 && e.ctrlKey==false)));
			}
			else
			{
				this.#add_to_selection(s.row,true);
			}
		}
		else if (this.selection_mode==3 && e.ctrlKey==true)
		{
			this.#add_to_selection(s.row,false,true);
		}
		
		
		if (s.row_index!=undefined)
			this.#last_clicked_index=s.row_index;
		
		if (this.onclick!=null)
			this.onclick({list:this,...s});

		var column_function_triggered=false;
		if (this.#columns[s.column_index].onclick!=null)
		{
			this.#columns[s.column_index].onclick({list:this,...s});
			column_function_triggered=true;
		}
		
		var ce=new CustomEvent("click",{composed:true,detail:{list:this,column_function_triggered:column_function_triggered,...s}});
		this.dispatchEvent(ce);
		
		
	}
	
	add_expand_column()
	{
		/**
		 * add a column to all rows, on the first position, which may be used 
		 * as placeholder for "+" - expand button on expandable rows 
		 */
		if (this.#expandable_rows==true)
			return 0;//already present

		this.#expandable_rows=true;
		let EX_TH=document.createElement("TH");
		EX_TH.classList.add("lst_expand_c");
		this.th.rows[0].insertBefore(EX_TH,this.th.rows[0].firstElementChild);
		this.thead.rows[0]

		for (let R in this.tbody.rows)
		{

			let EX_TD;
			EX_TD=document.createElement("TD");
			EX_TD.classList.add("lst_expand_c");
			R.insertBefore(EX_TD,R.firstElementChild);
		}
	}

	make_expandable(row)
	{
	}

	async get_expand_data(s,row)
	{
		let url=this.#columns[0].exp_url;
		let actual_url=url;
		if (url!="")
		{
                    let variables=url.matchAll(/\{\$?(.*?)\}/g);
                    let v=null;
                    if (variables!=null)
                    {
                        v=variables.next();
                        while (v.done!=true)
                        {
                            let vname=v.value[1];
                            let vvalue="";
                            for (var i=0;i<this.#columns.length;i++)
                            {
                                if (this.#columns[i].name==vname)
                                {
                                    let td=s.row.getElementsByTagName("td");
                                    vvalue=encodeURIComponent(td[i].textContent);
                                }

                            }
                            actual_url=url.replace(v.value[0],vvalue);
                            v=variables.next();
                        }
                    }
			var response=await fetch(actual_url);
			var responseXML=await response.responseXML;
			response.text().then((text)=>
			{
				row.firstElementChild.innerHTML=text;

				var ce=new CustomEvent("AfterRowExpanded",{composed:true,detail:
					{parentList:this,newList:row.firstElementChild.firstElementChild,...s}});
				this.dispatchEvent(ce);
			}
		);
			
		}

	}
	expand_all_rows()
        {
            for (var r of this.tbody.children)
            {
                this.expand_row(r);
            }
        }
	expand_row(row, hide_if_expanded=true,s)
	{
		/**
		 * click on expand button: if expanded row already exists, we show/hide it.
		 * If it does not exist, it will be created
		 */
		if (typeof(row)==="object" && row.classList!=undefined && row.classList.contains("lst_item"))
		{
                    var row_to_expand=row;
                    row_to_expand.getElementsByClassName("lst_expand_c")[0].classList.toggle("exp");
		}
                else
                    return false;
		if (row_to_expand.nextElementSibling==null || row_to_expand.nextElementSibling.classList.contains("lst_expanded_row")==false)
		{
			var TR=document.createElement("tr");
			var TD=document.createElement("td");
			TD.colSpan =this.#columns_count;
			TR.classList.add("lst_expanded_row");
			TR.appendChild(TD);
			this.tbody.insertBefore(TR,row_to_expand.nextElementSibling);
			this.get_expand_data(s,TR);

			var ce=new CustomEvent("RowExpanded",{composed:true,detail:
				{list:this,expanded_row:TR,...s}});
			this.dispatchEvent(ce);
                        
			return TD;
		}
		else if (row_to_expand.nextElementSibling.classList.contains("lst_expanded_row")==true)
		{//expand table already exists: we hide it if visible, show if hidden
			if (row.nextElementSibling.style.display=="none")
				row_to_expand.nextElementSibling.style.display="";
			else if (hide_if_expanded==true)
				this.hide_expanded_row(row);
			
		}
	}
	hide_expanded_row(row)
	{//skryje řádek, ale ponechá ho v tabulce
		if (typeof(row)==="object" && row.classList!=undefined && row.classList.contains("lst_item"))
		{
			if (row.nextElementSibling!=null && row.nextElementSibling.classList.contains("lst_expanded_row"))
				row.nextElementSibling.style.display="none";
		}
	}
	collapse_expanded_row(row)
	{
	}
	
	set data(value)
	{
		
		
		
	}
	get data()
	{
	}
        
        rows_pairs_iterator(fn,include_expanded=false)
        {
            var row_count=this.tbody.children.length;
            for (var i=0;i< row_count-1;i++)
            {
                var r1=this.tbody.children[i];
                if (include_expanded==false && r1.classList.contains("lst_expanded_row")==true)
                    continue;
                var r2=this.tbody.children[i+1];
                if (include_expanded==false && r2.classList.contains("lst_expanded_row")==true)
                {
                   r2=this.tbody.children[i+2];
                }                    
                if (r1!=null && r2!=null)
                    fn(r1,r2,i==0);
            }
        }
        
        same_value_markup(r1,r2,first)
        {
            //marks cells with the same value as the cell one row above in the same column has
            for (var i=0;i<r2.children.length;i++)
            {
                var td2=r2.children[i];
                if (i==0 && td2.classList.contains("lst_expand_c"))
                    continue;//the expand columns are not of concern
                var td1=r1.children[i];
                if (td1.textContent==td2.textContent)
                    td2.classList.add("same-value");
                else
                    td2.classList.remove("same-value");
                if (first==true)
                    td1.classList.remove("same-value");
            }
        }
}


customElements.define("list-box",List_Box);





export {List_Box};
  
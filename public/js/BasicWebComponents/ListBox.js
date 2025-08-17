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

class List_Box extends HTMLElement
{
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
	#compose_header_HTML=()=>
	{
		this.thead.innerHTML="";
		var newTR=document.createElement("tr");
		for (var i=0;i<this.columns_count;i++)
		{
			

			var newTH=document.createElement("th");
			if (this.#columns[i].expand_column==false)
			{
				let capt=this.#columns[i].caption;
				if (capt==undefined)
					capt=this.#columns[i].name;
				if (capt==undefined)
					capt="";
				newTH.innerHTML=capt;
				if (this.#columns[i].visible===false || this.#columns[i].hidden==true)
					newTH.style.display="none";
				if (this.#columns[i].width!="")
					newTH.style.width=this.#columns[i].width;
			}
			newTR.appendChild(newTH);
			
		}
		this.thead.appendChild(newTR);
		
	}
	#appropriate_table(args)
	{
		/**
		 * if we get a html table already from the server as child element of the list-box, we don't "reconstruct" it,
		 * we only adapt it to serve as our "underlying" table
		 */
		let table=this.firstElementChild;
		let appropriating=false;
		let had_tbody=false;
		if (table==null || table.nodeName!="TABLE")
			this.table=document.createElement("table");
		else
		{
			this.table=table;
			appropriating=true;
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
		var index=0;
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
						tr.dataset["index"]=index;
						index++;
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
		
	}
	#appropriate_row(tr)
	{

	}
	constructor()
	{
		super();

		this.#columns=[];
		this.#columns_count=0;
		this.#row_count=0;
		this.#expandable_rows=false;
		this.header_set=false;
		this.collaps_identical_values=(this.getAttribute("collapse_identical_values")=="true");
		this.selection_mode=3;//0=nelze vybírat;1=lze označit jeden řádek;2=lze označovat víc řádků v bloku  (pomocí SHIFT); 3=lze označovat více řádků jednotlivě (pomocí CTRL, příp. SHIFT+CTRL)
		
		/**
		 * internal methods
		 */
		this.onRowAdded=null;
		this.onMouseEntersRow=null;
		this.onMouseExitsRow=null;
		this.onMouseExitsColumn=null, 
		this.onMouseEntersColumn=null,

		/**
		 * internal helper references
		 */
		this.table=null;
		this.thead=null;
		
		//read the table already present - if any
		this.#appropriate_table();
		this.#compose_header_HTML();
		
		
		this.table.addEventListener("click",this.table_onclick);
		this.table.addEventListener("mousemove",this.table_onmousemove);
		this.table.addEventListener("mouseleave",this.table_onmouseleave);
		
		this.#last_clicked_index=-1;
		this.#last_mouse_position=null;


		this.innerHTML=`
		<style>
		td.lst_expand_c.exp::after
		{
			content:"+";
			cursor:pointer;
		}
		tr.lst_expanded_row > td
		{
			padding-left:20px;
		}
		</style>
		`;
		
	}

	/**
	 * callback functions
	 */
	
	connectedCallback()
	{
		this.appendChild(this.table);
	}
	static get observedAttributes()
	{
		return ["sticky_header","collaps_identical_values"];
	}
	attributeChangedCallback(name, oldValue, newValue)
	{
		if (name=="sticky_header")
		{
			this.sticky_header = newValue=="true";
		}
		if (name=="collaps_identical_values")
		{
			this.collaps_identical_values=newValue=="true";
		}
	}

	/**
	 *  getters and setters:
	 */
	set header_visible(value)
	{
		if (value==true)
			this.thead.style.display="";
		else
			this.thead.style.display="none";
	}
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
				onCellAdded: null, //event to triger, when new cell is added to this column (ie new row)
				onclick:null, //event to triger on click in any cell of this column
				th:null,
				tbody:this.tbody,
				width:"",
				index:i,
				
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
				
				_sortable:true
				
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

	cellInterior(row_index, column_index)
	{
		if (row_index>=0 && row_index<this.#row_count)
		{
			if (column_index>=0 && column_index<this.#columns_count)
			{
				var rows=this.tbody.getElementsByClassName("lst_item");
				for (var i=row_index;i<rows.length;i++)
				{
					var row=rows[i];
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
		
		if (s.cell.classList.contains("lst_expand_c"))
		{//expand column clicked
			this.expand_row(s.row);
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

	get_expand_data(row)
	{
		let url=this.#columns[0].exp_url;
		if (url!="")
		{
			let variables=url.match(/\{\$(.*?)\}/g);
			let v=null;
			while (v=variables.next())
			{
				let vname=v[1];
				let vvalue="";
				for (var i=0;i<this.#columns.length;i++)
				{
					if (this.#columns[i].name==vname)
					{
						let td=row.getElementsByTagName("td");
						vvalue=td[i].textContent;
					}

				}
				//let actual_url=url.replace();
			}
		}
	}
	
	expand_row(row, hide_if_expanded=true)
	{
		/**
		 * click on expand button: if expanded row already exists, we show/hide it.
		 * If it does not exist, it will be created
		 */
		if (typeof(row)==="object" && row.classList!=undefined && row.classList.contains("lst_item"))
		{
			var row_to_expand=row;
		}
		if (row_to_expand.nextElementSibling==null || row_to_expand.nextElementSibling.classList.contains("lst_expanded_row")==false)
		{
			var TR=document.createElement("tr");
			var TD=document.createElement("td");
			TD.colSpan =this.#columns_count;
			TR.classList.add("lst_expanded_row");
			TR.appendChild(TD);
			this.tbody.insertBefore(TR,row_to_expand.nextElementSibling);
			this.get_expand_data(TR);
			return TD;
		}
		else if (row_to_expand.nextElementSibling.classList.contains("lst_expanded_row")==true)
		{
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
}

customElements.define("list-box",List_Box);

export {List_Box};
  
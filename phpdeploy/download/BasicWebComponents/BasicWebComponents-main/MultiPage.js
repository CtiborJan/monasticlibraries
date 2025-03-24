import * as InputBoxes from "./InputBoxes.js";
class Multi_Page extends HTMLElement
{
	constructor()
	{
		super();

		this.switch_strip=document.createElement("div");
		this.switch_strip.classList.add("mpg-switch_strip");
		this.content_holder=document.createElement("div");
		this.content_holder.classList.add("mpg-content_holder");

		this.name=this.getAttribute("name");
		if (this.name=="")
			this.name="mpg";
		
		this.pages=[];
		this.style=document.createElement("style");
		
		
		
		while(this.children[0]!=null)
		{
			let ch=this.children[0];
			if (ch.nodeName=="DIV")
			{
				this.content_holder.appendChild(ch);
				var new_page=this.add_page({"caption":ch.getAttribute("caption"),"name":ch.getAttribute("page_name"),existing_container:ch});
			}
			else
				ch.remove();
		}
		//this.insertBefore(this.style,this.children[0]);
		this.innerHTML=`
		<style>
		multi-page
		{
			display:flex;
			flex-direction:column;
			min-height:10px;
			min-width:100px;
			position:relative;
			height:100%;
		}
		.mpg-switch_strip input
		{
			appearance:none;
		}
		.mpg-switch_strip label:has(input:checked)
		{
			border:1px solid lightgray;
			border-bottom:0px;
			background-color:white;
			border-bottom:1px solid white;
			position:relative;
			z-index:1;
		}
		.mpg-switch_strip label:not(:has(input:checked))
		{
			color:gray;
			border-right:1px dotted lightgray;
		}
		.mpg-switch_strip label
		{
			padding:0 10 0 10;
		}
		.mpg-content_holder
		{
			flex:1;
			overflow:scroll;
			border:1px solid lightgray;
		}
		</style>
		`;

	}
	connectedCallback()
	{
		this.appendChild(this.switch_strip);
		this.appendChild(this.content_holder);
	}
	static get observedAttributes()
	{
		return ["tabs_visible"];
	}
	attributeChangedCallback(name, oldValue, newValue)
	{
		switch (name)
		{
			case "tabs_visible":
				if (newValue=="false")
					this.switch_strip.style.display="none";
				else
					this.switch_strip.style.display="block";	
				break;
		}		
	}
	set tabs_visible(newValue)
	{
		this.setAttribute(this.tabs_visible(newValue));
	}
	get tabs_visible()
	{
		return this.switch_strip.style.display!="none";
	}
	add_page=(args)=>
	{
		var me=this;
		if (args.name=="" || args.name==undefined)
			args.name=this.name+"_page_"+(this.pages.length+1);

		var page=
		{
			name:args.name,
			radio:null,
			container:null,
			active:null,
			caption:args.caption,
			activate:function()
			{
				this.container.style.display="";
				this.radio.checked=true;
				for (let p of me.pages)
				{
					if (p!==this)
						p.deactivate();
				}
			},
			deactivate:function()
			{
				this.container.style.display="none";
				this.radio.checked=false;
			}
		};

		if (args.existing_container!==undefined && args.existing_container!==null)
		{
			if (args.existing_container.hasAttribute("page_caption"))
				args.caption=args.existing_container.getAttribute("page_caption");
			if (args.existing_container.hasAttribute("page_name"))
				args.name=args.existing_container.getAttribute("page_name");
		}

		page.radio=document.createElement("radio-box");
		page.radio.setAttribute("name",this.name+"_switch_rbt");
		page.radio.setAttribute("caption",args.caption);
		


		var me=this;
		

		
		page.radio.associated_page=page;
		if (args.existing_container===undefined || args.existing_container===null)
			page.container=document.createElement("div");
		else
			page.container=args.existing_container;

		page.radio.addEventListener("change",function(e)
		{
			var rbt=e.currentTarget;
			if (rbt.checked==true)
				rbt.associated_page.activate();
		});
		
		this.pages.push(page);
		

		this.switch_strip.appendChild(page.radio);
		this.content_holder.appendChild(page.container);
		page.activate();
		return page.container;
	}
	page=(arg)=>
	{
		if (typeof(arg)==="number")
		{
			if (arg<this.pages.length)
				return this.pages[arg];
		}
		else if (typeof(arg)==="string")
		{
			for (let page of this.pages)
				if (page.name==arg)
					return page;
		}
		return null;
	}	
	
}
customElements.define("multi-page",Multi_Page);

export {Multi_Page};
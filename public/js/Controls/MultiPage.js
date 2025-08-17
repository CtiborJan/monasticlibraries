import * as InputBoxes from "./InputBoxes.js";
import * as WebPage from "./functions.js";
class One_Page extends HTMLElement
{
    constructor()
    {
        super();
    }
    connectedCallback()
    {
         this.shadowDOM=this.attachShadow({mode:'open'});
         this.shadowDOM.innerHTML=
         `
            <style>
                :host
                {
                    width:100%;
                    height:100%;
                    display:none;
                }
                :host(.active)
                {
                    display:block;
                }
             </style>
            <slot></slot>`;
    }
}
customElements.define("one-page",One_Page);

class Multi_Page_Switch_Strip extends HTMLElement
{
    constructor()
    {
        super();   
        this.tabs=[];
        this.onTabActivated=null;
        this.onTabDeactivated=null;
    }
    connectedCallback()
    {
        this.shadowDOM=this.attachShadow({mode:'open'});
        this.shadowDOM.innerHTML=
        `<style>
            div
            {
                display:inline-block;
                padding:0 10 0 10;
                border:1px dotted lightgray;
                color:gray;
                cursor:default;
            }
            div.active
            {
                border-style:solid;
                border-bottom:2px solid white;
                color:black;
            }
        </style>
        `;
        WebPage.populatePageObject({root:this.shadowDOM,obj:this,flatten:true});
    }
    add(name,caption,position=-1)
    {
        var d=document.createElement("div");
        d.innerHTML=caption;
        d.pageName=name;
        d.setAttribute("name","tab");
        d.name="tab";
        this.tabs.push(d);
        if (position==-1)
            this.shadowDOM.appendChild(d);
        WebPage.populatePageObject({root:d,obj:this,flatten:true});
    }
    tab__onclick=(e)=>
    {
        this.activate(e.target.pageName,true);
    }
    activate(name,triggerEvents=false)
    {
        var activated=false;
        for (let t of this.tabs)
        {
            if (t.pageName==name)
            {
                t.classList.add("active");
                activated=true;
            }
            else
            {
                if (t.classList.contains("active"))
                {
                    if (triggerEvents==true)
                    {
                        var ce=new CustomEvent("TabDeactivated",
                        {composed:true,detail:{name:name}});
                        this.dispatchEvent(ce);
                    }
                }
                t.classList.remove("active");
            }
        }
        if (activated==true)
        {
            if (triggerEvents==true)
            {
                var ce=new CustomEvent("TabActivated",
                {composed:true,detail:
                    {name:name}
                });
                this.dispatchEvent(ce);
            }
        }
    }
}

customElements.define("multi-page-switch-strip",Multi_Page_Switch_Strip);

class Multi_Page extends HTMLElement
{
	constructor()
	{
		super();		
		this.pages=[];
                this.page_counter=0;
	}
	connectedCallback()
	{
            this.shadowDOM=this.attachShadow({mode:'open'});
            this.shadowDOM.innerHTML=
            `<style>
		:host
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
             <multi-page-switch-strip name='switch_strip'></multi-page-switch-strip>
             <div class='mpg-content_holder' name='container'>
                <slot></slot>
            </div>`;
        
            WebPage.populatePageObject({root:this.shadowDOM,obj:this,flatten:true,log:true});
            WebPage.populatePageObject({root:this,obj:this,flatten:true});
            for (let ch of this.children)
            {
                if (ch.nodeName=="ONE-PAGE")
                {
                    this.addPage(ch);
                }
            }
            this.activatePage(0);
                
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
        addPage=(page)=>
        {
            this.pages.push(page);
            this.page_counter++;
            var caption=page.getAttribute("caption");
            var name=page.getAttribute("name");
            if (name=="")
            {
                name=this.name+"_page_"+this.page_counter;
                page.setAttribute("name",name);
                page.name=name;
            }
            this.switch_strip.add(name,caption);
            WebPage.populatePageObject({root:page,obj:this,flatten:true});
        }
        switch_strip__onTabActivated=(e)=>
        {
            this.activatePage(e.detail.name);
        }
        activatePage(id)
        {
            var name="";
            var index=-1;
            var activatedName="";
            if (typeof id=="string")
                name=id;
            else if (typeof id=="number")
                index=id;
            
            for (let i=0;i<this.pages.length;i++)
            {
                if ((name!="" && this.pages[i].getAttribute("name")==name) || 
                        index == i)
                {
                    this.pages[i].classList.add("active");
                    activatedName=this.pages[i].getAttribute("name");
                }
                else
                    this.pages[i].classList.remove("active");
            }
            this.switch_strip.activate(activatedName);
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
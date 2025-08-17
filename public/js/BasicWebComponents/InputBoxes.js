
class Input_Box extends HTMLElement
{
	
	
	set checked(value)	{this.setAttribute("checked",value);}
	get checked() {return this.input.checked;}
	set caption(value)	{this.setAttribute("caption",value);}
	get caption() {return this.caption_span.innerHTML;}
	
	constructor()
	{
		super();
		this.label=document.createElement("label");
		this.input=document.createElement("input");
		this.caption_span=document.createElement("span");
		this.type="";
		this.caption_position="after";
	}
	static get observedAttributes()
	{
		return ["caption","checked","name","value"];
	}
	connectedCallback()
	{
		if (this.caption_position=="before" || this.caption_position=="above")
		{
			this.label.appendChild(this.caption);
			this.label.appendChild(this.input);
		}
		else
		{
			this.label.appendChild(this.input);
			this.label.appendChild(this.caption_span);
		}
		this.input.type=this.type;
		this.input.checked=this.getAttribute("checked");
		this.input.value=this.getAttribute("value");
		this.caption_span.innerHTML=this.getAttribute("caption");
		
		this.appendChild(this.label);
	}
	attributeChangedCallback(name, oldValue, newValue)
	{
		switch (name)
		{
			case "checked":
				this.input.checked=newValue=="true";
				break;
			case "caption":
				this.caption_span.innerHTML=newValue;
				break;
			case "name":
				this.input.setAttribute("name",newValue);
		}		
	}
}

class Check_Box extends Input_Box
{
	constructor()
	{
		super();
		this.type="checkbox";
	}
}
customElements.define("check-box",Check_Box);

class Radio_Box extends Input_Box
{
	constructor()
	{
		super();
		this.type="radio";
	}
}
customElements.define("radio-box",Radio_Box);

class Text_Box extends Input_Box
{
	constructor()
	{
		super();
		this.type="text";
	}
}
customElements.define("text-box",Text_Box);

class File_Box extends Input_Box
{
	constructor()
	{
		super();
		this.type="file";
	}
}
customElements.define("file-box",File_Box);

export {Input_Box,Radio_Box,Check_Box,Text_Box,File_Box};

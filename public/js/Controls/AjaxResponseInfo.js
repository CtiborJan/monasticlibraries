import * as Controls from "./functions.js";

class Ajax_Response_Info 
{
	#shown_as_modal;
	#parentElement;
	#trigger_original_processing_function()
	{
		if (this.original_processing_function!=null)
			this.original_processing_function(this.xhttp_object);
	}
	#load_css()
	{
		var links=document.head.getElementsByTagName("link")
		for (let l of links)
		{
			if (l.href.endsWith("AjaxResponseInfo.css"))
				return 0;
		}
		let link=document.createElement("link");
		link.rel="stylesheet";
		link.href="localhost://monasticlibraries/css/AjaxResponseInfo.css";

		document.head.appendChild(link);

	}
	constructor(args={})
	{
		this.#load_css();
		this.root=null;
		this.xhttp_object=null;
		this.show_info=true;
		this.show_error=true;
		this.show_modal_on_error=true;
		this.show_modal_on_info=true;
		this.stop_propagation_on_error=true;
		
		

		if (args==null)
			args={};
		if (args.name===undefined)
			args.name="Ajax_response_info";
		
		if (args.parentElement===undefined || args.parentElement===null)
			args.parentElement=document.body;
		this.name=args.name;
		this.#parentElement=args.parentElement;

	}
	activate=(xhttp_object,processing_function)=>
	{
		this.xhttp_object=xhttp_object;
		this.xhttp_object.onreadystatechange=this.response_received;
		this.original_processing_function=processing_function;
	}
	close=()=>
	{
		this.root.remove();
		if (this.#shown_as_modal==true)
		{
			this.#trigger_original_processing_function();
		}
	}

	response_received=(e)=>
	{
		if (this.xhttp_object.readyState == 4 && this.xhttp_object.status == 200) 
		{
			if (this.xhttp_object.responseXML!=null)
			{
				var xml_root=this.xhttp_object.responseXML.children[0];
				var type=xml_root.tagName;
				if (xml_root!=null)
				{
					if ((type=="error" && this.show_error==true) || (type=="info" && this.show_info==true))
					{
						this.show_messages(xml_root);
						if (xml_root.tagName=="error" && this.stop_propagation_on_error==true)
							return 0;
						if (type=="info" && this.show_modal_on_info===true)
						{
							this.#shown_as_modal=true;
							return true;
						}
						if (this.#shown_as_modal==false)
						{
							this.#trigger_original_processing_function();
							return true;
						}
					}
				}

			}
			else if (this.xhttp_object.response!="")
			{
				if (this.xhttp_object.response.indexOf("xdebug-error")!=-1)
				{
					this.show_messages(this.xhttp_object.response,"error");
					if (this.stop_propagation_on_error==true)
						return true;
				}
			}
			this.#trigger_original_processing_function();
			
		}
		if (this.xhttp_object.readyState == 4 && this.xhttp_object.status==500)
		{
			this.show_messages("Server error (500)!","error");
		}
	}
	show_messages(message,type=null)
	{
		this.root = document.createElement("div");
		this.root.classList.add("ari_default");
		this.content_box=Controls.createElement({parentElement:this.root,classList:"ari_content"});
		this.bottom_strip=Controls.createElement({parentElement:this.root,classList:"ari_bottom_strip"});
		this.close_button=Controls.createElement({tagName:"button",parentElement:this.bottom_strip,innerHTML:"Zavřít",onclick:this.close});
		if (message.tagName=="error" || type=="error")
			this.root.classList.add("error");
		
		if (typeof(message)==="object")
		{	
			for (let ch of message.childNodes)
			{
				var d=Controls.createElement({parentElement:this.content_box});
				d.innerHTML=ch.textContent;
			}
		}
		else if (typeof(message)==="string")
		{
			this.content_box.innerHTML=message;
		}
		this.#parentElement.appendChild(this.root);
		this.close_button.focus();
	}
}

export {Ajax_Response_Info};
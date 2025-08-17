function createElement(args)
{
	if (args.tagName===undefined)
		args.tagName="div";
	var new_element=document.createElement(args.tagName);


	if (args.innerHTML!=undefined)
		new_element.innerHTML=args.innerHTML;

	

	if (args.classList!=undefined)
	{
		for (let c of args.classList.split(" "))
			new_element.classList.add(c);
	}
	let parentElement=args.parentElement;
	delete args.tagName;
	delete args.classList;
	delete args.parentElement;
	delete args.innerHTML;

	for (let a in args)
	{
		if (new_element.hasAttribute(a)) 
			new_element.setAttribute(a,args[a]);
		else if (new_element[a]!==undefined)
			new_element[a]=args[a];
	}

	if (parentElement!==undefined && typeof(parentElement)==="object" && parentElement.appendChild!=undefined)
		parentElement.appendChild(new_element);

	return new_element;
}
function populatePageObject(args)
{/**
 * this function populates the given (or newly created) object with references to DOM elements
	(which have given name or id) and, possibly, creates event listeners, if appropriate methods
	are present as members of the object.
 */
	
	var root=null;
	if (typeof(args.root)==="string")
	{
		root=document.getElementById(args.root);
		if (root!=null && root.nodeName=="TEMPLATE" && args.parentElement!=undefined)
		{
			let parentElement=args.parentElement;
			if (typeof(parentElement)=="string")
				parentElement=document.getElementById(parentElement);
			if (parentElement!=null)
			{
				root=document.importNode(root.content,true).children[0];
				parentElement.appendChild(root);
			}
		}
		else if (args.parentElement===undefined || args.parentElement==null)
			Error("When root is a template, parentElement must be given, where to attach the DOM to");
	}
	else
		root=args.root;
	
	var obj=args.obj;
	if (obj==undefined || obj==null)
		obj={};
	if (root==undefined || root==null)
		return args.obj;
	for (var i=0;i<root.children.length;i++)
	{
		let ch=root.children[i];
		let supplied_object=null;
		if (ch.hasAttribute("name"))
		{
			let n=ch.getAttribute("name");
			let nn="";
			if (ch.nodeName!=undefined)
				nn=ch.nodeName.toLowerCase().replace("-","_");//"-" se nedá použít ve jménech v JS
			if (obj["_"+n]!==undefined)
				supplied_object=obj["_"+n];
			if (obj[n]===undefined)
			{
				obj[n]=ch;
			}
			else if (Array.isArray(obj[n])==true)
			{
				obj[n].push(ch);
			}
			else
			{
				obj[n]=[obj[n],ch];
			}
			
			for (let prop in obj)
			{
				/**
				 * Event listeners: if there is a member method in the object with the name [element_name]__[event], 
				 * event listener will be added for [event] of [element] leading to this method
				 */
				if (prop.startsWith(n+"__") || (prop.startsWith("_any_"+nn+"__") && nn!=""))//čekáme na posluchač události tohoto prvku
				{
					let event_name=prop.slice(prop.indexOf("__")+2);
					if (ch[event_name]!==undefined)
					{
						ch.addEventListener(event_name.replace(/^on/,""),obj[prop].bind(obj));
					}
				}
				else if (prop.startsWith("_any_"+nn+"__") && nn!="")
				{
					
				}
			}
		}
		if (ch.isUserForm===undefined)
		{
			var new_args={...args};
			new_args.root=ch;
			if (args.flatten==true)
				new_args.obj=args.obj;
			else if (supplied_object===null)
				new_args.obj=ch;
			else
				new_args.obj=supplied_object
			
			populatePageObject(new_args);
		}
	}
	obj.isUserForm=true;
	return obj;
}
export {createElement,populatePageObject};
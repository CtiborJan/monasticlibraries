/*
 * This module provides functionalities for interconnecting HTML objects of some element tree (most typically 
 * WebComponent) with JS code to serve this HTML. 
 * In most simple case, this module "populates" (supplied or newly created) js object with named references 
 * to HTML elements. The HTML elements we want to appear in the object must have the "name" property! Eg.:
 * <html>
 *  <div name="div1"></div>
 *  <button name="button1"></button>
 * </html>
 *  =>
 *  {
 *      HTMLElement: div1
 *      HTMLElement: button1
 *  }
 *  If the js object is supplied to the module, it can be an instance of a class with defined methods to serve events
 *  of the HTML elements, where the listeners will be automatically created:
 *  {
 *      HTMLElement: div1
 *      HTMLElement: button1 (both added automatically to the object)
 *      
 *      button1__onclick=(e)=>
 *      {
 *          (method to serve the onclick event of button 1)
 *      }
 *      any_button__onclick=(e)=>
 *      {
 *          (use any_[nodeName] to serve any instance of the given element type
 *      }
 *  }
 *  Also, some basic dependency injection will work.
 */
class DependencyFactory
{
    static processAttribute(attribute)
    {
        if (attribute.nodeName=="style")
        {
            
        }
        else if (attribute.value.match("\{\{([a-zA-Z0-9_]+)\}\}")!=null)
        {
            
        }
    }
    static processElement(element)
    {
        for (var attr of element.attributes)
        {
            DependencyFactory.processAttribute(attr);
        }
    }
}
class Dependency
{
    object=null;
    propriety="";
    constructor(object, propriety)
    {
        this.object=object;
        this.propriety=propriety;
    }
    inject(value)
    {
        if (this.object!=null)
            if (this.object[propriety]!==undefined)
                this.object[propriety]=value;
    }
}
class MetaButton extends HTMLElement
{
    constructor()
    {
        super();
    }
    connectedCallback()
    {
        this.shadowDOM=this.attachShadow({mode:"open"});
        this.shadowDOM.innerHTML=
        `
        <style>
            :host
            {
                width:20px;
                height:20px;
                overflow:clip;
                border-radius:20px;
                background-color:blue;
            }
        </style>
        
        `;
    }
}
customElements.define("ufrm-button",MetaButton);

class MetaConsole extends HTMLElement
{
    constructor()
    {
        super();
    }
    connectedCallback()
    {
        this.shadowDOM=this.attachShadow({mode:"open"});
        this.shadowDOM.innerHTML=
        `
        <style>
            :host
            {
                position:absolute;
                width:50px;
                height:50px;
                bottom:0px;
                right:0px;
                
                overflow:clip;
            }
            :host(:hover)
            {
                position:absolute;
                width:100px;
                height:100px;
                bottom:0px;
                right:0px;
                
                overflow:clip;
            }
            .circle
            {
        
                position:relative;
                width:200%;
                height:200%;
                border:1px solid blue;
                background-color:lightblue;
                border-radius:100px;
            }
            .workspace
            {
                position:relative;
                left:0px;
                top:0px;
                height:50%;
                width:50%;
            }
            .button_wrapper
            {
                position:absolute;
                height:40px;
                bottom:-20px;
                width:200%;
                left:0px;
            }
            .button1
            {
                rotate:15deg;
            }
            .button2
            {
                rotate:35deg;
            }
            .button3
            {
                rotate:55deg;
            }
            .button4
            {
                rotate:75deg;
            }
            .button_wrapper ufrm-button
            {
                position:absolute;
                left:5px;
                top:25%;
            }
        </style>
        <div class='container'>
            <div class='circle'>
                <div class='workspace'>'
                    <div class='button_wrapper button1'>
                        <ufrm-button class="button1"></ufrm-button>
                    </div>
        
                    <div class='button_wrapper button2'>
                        <ufrm-button class="button1"></ufrm-button>
                    </div>
        
                    <div class='button_wrapper button3'>
                        <ufrm-button class="button1"></ufrm-button>
                    </div>
        
                    <div class='button_wrapper button4'>
                        <ufrm-button class="button1"></ufrm-button>
                    </div>
                </div>
            </div>
            <slot name='server_response'></slot>
        </div>
        `;
    }
}
customElements.define("ufrm-console",MetaConsole);

class Meta
{
    /*
     * debuging and reflection class
     */
    objects=[];
    
    #append_css()
    {
        var style=window.document.createElement("style");
        window.document.head.appendChild(style);
        style.textContent=
            `   
                .ufrm-meta-highlighted
                {
                    border:2px solid red important!;
                    box-sizing:border-box;
                }`;
        
    }
    #create_console()
    {
        var cons=window.document.createElement("ufrm-console");
        window.document.body.append(cons);
    }
    elements=
    {
        elements:[],
        highlight:function(args)
        {
            for (var e of args.elements)
            {
                e.classList.add("ufrm-meta-highlighted");
            }
        },
        highlight_off:function(args)
        {
            for (var e of args.elements)
            {
                e.classList.remove("ufrm-meta-highlighted");
            }
        }
    }
    constructor()
    {
        this.#append_css();
        this.#create_console();
    }
    add_object(obj)
    {
        objects.push(obj);
    }
    add_element(e)
    {
        elements.elements.push(e);
    }
    
}

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

function injectValueFromPageObject(args)
{
    /*
     * this method simply inserts value from pageObj into newly added element 
     * - just once, when element is added to the pageObj ({{ }})
     */
    var e=args.element;
    var obj=args.obj;
    var getVarValue=function(varName,obj)
    {
        varName=varName.replace(/[{}]/g,"");
        if (obj[varName]!==undefined)
        {
            if (typeof obj[varName]!="object")
            {
                return obj[varName];
            }
        }
        return "";
    }
    for (var n of e.childNodes)
    {
        if (n.nodeType==3)
        {
            var refs=n.textContent.match(/\{\{([a-zA-Z0-9_]+)\}\}/g);
            if (refs!==null)
            {
                for (var r of refs)
                {
                    var varValue=getVarValue(r,obj);
                    n.textContent=n.textContent.replaceAll(r,varValue);
                }
            }        
        }
        else
        {
            injectValueFromPageObject({element:n,obj:obj});
        }
    }
}


function populatePageObject(args)
{/**
 * this function populates the given (or newly created) object with references to DOM elements
	(which have given name or id) and, possibly, creates event listeners, if appropriate methods
	are present as members of the object.
 */
 /*
    args:
    root: root element, i. d. existing node (then nothing will be newly created) or template (then new node will be created)
    parentElement:parent node, to which the from template created node will be appended
    obj: js object, which will be populated. If not given, new will be created
    
    
*/  
        
        
	var root=null;
	if (typeof(args.root)==="string")
	{
		root=document.getElementById(args.root);
		if (root!=null && root.nodeName=="TEMPLATE")
		{
                    if (args.parentElement!=undefined)
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
		
	}
	else
		root=args.root;
	
	var obj=args.obj;
	if (obj==undefined || obj==null)
		obj={};
	if (root==undefined || root==null)
		return args.obj;
        
        args.element=root;
        args.recursion=true;
        addToPagePopulation(args);
        
	if (window.pageObjects)
	return obj;
}
function addToPagePopulation(args)
{
    /*
     *  Adds one element (a possibly its descendants) to page object.
     */
    
	var immediateParent=null;
        var e=args.element;
        if (e.nodeName!="#document-fragment")//webcomponent shadowdom
        {
            var n=e.getAttribute("name");
            var has_own_userform=e.getAttribute("has_own_userform");
        }
        else
        {
            
            
        }
        
        if (n!="" && n!=undefined && n!=null)
        {
            if (args.debug==true)
            {
                console.log(`Adding element ${n} to ` + args.obj.__proto__.constructor.name );
            }
            if (args.immediateParent===undefined || args.immediateParent==null)
            {
                    immediateParent=args.obj;
            }
            if (immediateParent[n]===undefined)
                    immediateParent[n]=e;
            else if (Array.isArray(immediateParent[n]))
                    immediateParent[n].push(e);
            else
            {
                    immediateParent[n]=[immediateParent[n],e];
            }
            setEventListeners({obj:args.obj,element:e,log:args.log});
            injectValueFromPageObject({element:e,obj:args.obj,log:args.log});
        }
        
        if (has_own_userform!=null)
            return true ;
        
        
        var stopAt=(nodeName,nodeNames)=>
        {
            if (Array.isArray(nodeName))
            {
                if (nodeNames.include(nodeName))
                    return true;
                else
                    return false;
            }
            else
                return false;
        }
        
        if (args.use_nodes!==undefined && args.use_nodes!=null)
        {/* 
          * working only with specified nodes - we find then only on the topmost level, not in recursion. 
          * This is the first level.
         */   
            var potential_nodes=[];
            
            var new_args={...args};
            new_args.recursion=false;
            delete new_args.use_nodes;
            
            for (let v of args.use_nodes.values)
            {
                if (args.use_nodes.selector=="className")
                    potential_nodes=e.getElementsByClassName(v);
                else
                    potential_nodes=e.getElementsByNodeName(v);
                for (let n of potential_nodes)
                {
                    new_args.element=n;
                    addToPagePopulation(new_args);
                }
            }
        }
        else if (args.recursion!=false)
        {
            for (let ch of e.children)
            {
                if (stopAt(ch.nodeName,args.stop_at)==false)
                {
                    let new_args={...args};
                    new_args.element=ch;
                    addToPagePopulation(new_args);
                }
            }
            if (e.shadowRoot!=null)
            {
                if (args.populateWithShadows!==undefined)
                {
                    var populateWithShadows=false;
                    if (Array.isArray((args.populateWithShadows)))
                    {
                        populateWithShadows=args.populateWithShadows.includes(e.nodeName);
                    }
                    else if (typeof args.populateWithShadows=="string")
                    {
                        populateWithShadows=(args.populateWithShadows==e.nodeName);
                    }
                    if (populateWithShadows==true)
                    {
                        for (let ch of e.shadowRoot.children)
                        {

                            let new_args={...args};
                            new_args.element=ch;
                            addToPagePopulation(new_args);
                        }
                    }
                }
            }
        }
}
function removeFromPagePopulation(args)
{
    var immediateParent=null;
    var e=args.element;
    if (e==null || e===undefined)
        return false;
    
    if (Array.isArray(e)==false)
        e=[e];
    
    
    
    
    e.map(el => {el.remove();})
    
    if (args.immediateParent===undefined || args.immediateParent==null)
    {
        immediateParent=args.obj;
    }
    var n="";
    e.map(el=>
    {
        n=el.getAttribute("name");
        if (Array.isArray(immediateParent[n]))
        {
            for (var i=immediateParent[n].length;i>=0;i--)
            {
                if (el===immediateParent[n][i])
                {
                    immediateParent[n].splice(i,1);
                }
            }
        }
        else
        {
            delete immediateParent[n];
        }
    });
    if (Array.isArray(immediateParent[n]) && immediateParent[n].length==0)
        delete immediateParent[n];
}
function appendAndAdd(args)
{
    var obj=args.obj;
    var e=null,h="";
    if (typeof args.element==="string")
        h=args.element;
    else if (typeof args.element==="object")
        e=args.element;
    
    if (h!="")
    {
        /*var parser=new DOMParser();
        try
        {
            var d=parser.parseFromString(h,"text/html");
        }
        catch
        {
            console.log("Given html of new element could not be parsed.")
            return false;
        }
        e=d.body.firstElementChild;*/
        var d=document.createElement("div");
        d.innerHTML=h;
        e=d.firstElementChild;
    }
    if (e==null)
    {
        console.log("No valid data given (element object or HTML string)");
        return false;
    }
    
    var append_to=args.append_to;
    if (append_to!=undefined && append_to!=null && append_to.element!=null)
    {
        if (append_to.method===undefined || append_to.method=="append")
        {
            append_to.element.appendChild(e);
        }
        else if (append_to.method==="after")
        {
            append_to.element.after(e);
        }
        else if (append_to.method==="before")
        {
            append_to.element.before(e);
        }
    }
    else
    {
        document.body.appendChild(e);
    }
    args.element=e;
    addToPagePopulation({...args});
}
function replacePageMember(args)
{
    /*
     * replace element which is already member of the page obj.
     * 
     */
    var immediateParent=null;
    var new_e=args.new_element;        
    var e=args.element;

    if (e==null)
        return false;//no element to be replaced given
    if (e.nodeType!=3)
    {
        var n=e.getAttribute("name");    
    }
    else
        var n="";
    
    if (args.immediateParent===undefined || args.immediateParent==null)
    {
        immediateParent=args.obj;
    }
    
    
    
    
    var parent=e.parentElement;
    var prev=e.previousElementSibling;
    var append_to=null;
    if (e.previousElementSibling!=null)
    {
        append_to={element:e.previousElementSibling,method:"after"};
    }
    else if (e.nextElementSibling!=null)
    {
        append_to={element:e.nextElementSibling,method:"before"};
    }
    else
    {
        append_to={element:e.parentElement,method:"append"};
    }
        
    
    e.remove();
    e=null;
    
    if (n!="")
    {
        if (Array.isArray(immediateParent[n]))
        {
            //odstranit z pole...
        }
        else
        {
            delete immediateParent[n];
        }
    }
    
    args.element=args.new_element;
    delete args.new_element;
    appendAndAdd({...args,append_to:append_to});
}
function setEventListeners(args)
{
	var obj=args.obj;
	var e=args.element;
	var n=args.element.getAttribute("name")
	var nn=args.element.nodeName.toLowerCase().replace("-","_");//"-" se nedá použít ve jménech v JS;;
	for (let prop in obj)
	{
		/**
		 * Event listeners: if there is a member method in the object with the name [element_name]__[event], 
		 * event listener will be added for [event] of [element] leading to this method
		 */
		if (prop.startsWith(n+"__") || (prop.startsWith("_any_"+nn+"__") && nn!=""))//čekáme na posluchač události tohoto prvku
		{
			let event_name=prop.slice(prop.indexOf("__")+2);
			if (e[event_name]!==undefined)
			{
				e.addEventListener(event_name.replace(/^on/,""),obj[prop].bind(obj));
                                if (args.log==true)
                                    console.log("Adding event listener: "+event_name+ " to " + e.name);
			}
		}
		else if (prop.startsWith("_any_"+nn+"__") && nn!="")
		{
			
		}
	}
}


class myRange
{
    /*
     *  This class' aim is to provide wraping interface for text nodes, which 
     *  may be split into several elements, eg. for highlighting search results
     *  <span>Aurea |prima sata est <strong>aetas <em>quae</em> vind|ice</strong> nullo</span>
     *  ->
     *  <span>Aurea <hi>prima sata est </hi><strong><hi>aetas </hi><em><hi>quae</hi></em><hi> vind</hi>ice</strong> nullo</span>
     */
    #nodes=[];
    #getAllTextNodes(element) 
    {
        var nodes=[];
        var tw=document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        while (tw.nextNode())
        {
            nodes.push(tw.currentNode)
        }
        return nodes;
    }
    #filterNodesofRange(nodes,startOffset,endOffset)
    {
        var filteredNodes=[];
        var elStart=0;
        var elEnd=0;
        var add=false;
        for (var n of nodes)
        {
            elStart=elEnd;
            elEnd=elStart+n.textContent.length;
            if (elEnd>=startOffset && elStart<endOffset)
            {
                filteredNodes.push(
                        {
                            node:n,
                            startOffset:Math.max(startOffset-elStart,0),
                            endOffset:Math.max(elEnd-endOffset,0)
                        });
            }
            else if (elStart>=endOffset)
            {
                return filteredNodes;
            }
        }
        return filteredNodes;
    }
    constructor(parentElement,startOffset,endOffset)
    {
        var n=this.#getAllTextNodes(parentElement);
        this.#nodes=this.#filterNodesofRange(n,startOffset,endOffset);
    }
    wrap(tag,attributes=null)
    {
        if (this.#nodes==null)
            return false;
        for (var n of this.#nodes)
        {
            var wrapper=document.createElement(tag);
            if (n.startOffset==0 && n.endOffset==0)
            {
                wrapper.innerHTML=n.node.textContent;
                n.node.replaceWith(wrapper);
            }
            else
            {
                var before=n.node.textContent.slice(0,n.startOffset);
                var endOff=n.node.textContent.length-n.endOffset;
                var wrapped=n.node.textContent.slice(n.startOffset,endOff);
                var after=n.node.textContent.substring(endOff);
                wrapper.innerHTML=wrapped;
                if (wrapped!="")
                    n.node.replaceWith(before,wrapper,after);
            }
        }
    }
    static unwrap(element,tag)
    {
        if (element!=null && tag!="")
        {/*
            var tags=element.getElementsByTagName(tag);
            while(tags.length>0)
            {
                var tNode=document.createTextNode(tags[0].textContent);
                tags[0].replaceWith(tNode);
            }*/
            var re=new RegExp("<\/?"+tag+"[^>]*>","g");
            element.innerHTML=element.innerHTML.replaceAll(re,"");
        }
    }
    
}



var meta=new Meta();


class WebComponentCssInjector
{
    static webcomp_rules=[];
    static default_prefix="my-wc-style-";
    constructor()
    {}
    static collectWebComponentCSS(args)
    {
        /*
         * args.selector=component selector
         * args.ignore_common =ignore common selector for all WC
         */
        var stylesheets=[];

        for (let css of [...document.getElementsByTagName("link"),...document.getElementsByTagName("style")])
        {
            if (css.sheet!=null)
            {
                for (let cssRule of css.cssRules)
                {
                    if (cssRule.selectorText.contains(WebComponentCssInjector.default_prefix))
                    {
                        WebComponentCssInjector.webcomp_rules.push(cssRule);
                    }
                }
            }
        }
    }
    static getWebComponentCSS(args)
    {
        if (WebComponentCssInjector.webcomp_rules.length==0 || args.reload==true)
            WebComponentCssInjector.CollectWebComponentCSS(null);
        var rv="";
        for (let rule in WebComponentCssInjector.webcomp_rules)
        {
            if (rule.selectorText.contains(args.selector) ||
                    (rule.selectorText.contains(WebComponentCssInjector.default_prefix+"all") && args.add_all!=false))
            {
                for (let cssRule2 of cssRule.cssRules)
                {
                    rv+=cssRule2.cssText.replace("&","");
                }
            }
            
        }
        return rv;
        
    }
    static addGlobalStyle(args)
    {
        var container=document.head;
        if (typeof args==="string")
            var css=args;
        else
        {
            var css=args.style;
        
            if (args.container===undefined)
                container=args.container;
        }
        
        var style=document.createElement("style");
        style.innerHTML=css.replaceAll(/<\/?style>/g,"");
        container.appendChild(style);
    }
}

function appendTemplate(templateHTML)
{
    var domParser=new DOMParser();
    var template=domParser.parseFromString(template,"text/html");
    document.body.appendChild(template);
}

export {
    createElement,
    populatePageObject,
    addToPagePopulation,
    removeFromPagePopulation,
    replacePageMember,
    appendAndAdd,
    
    appendTemplate,
    myRange,
    WebComponentCssInjector,
    meta as _meta};
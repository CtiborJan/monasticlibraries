import * as WebPage from "./functions.js";


var stylesheets=document.getElementsByTagName("link")[0].sheet;
var new_style="";
for (let cssRule of stylesheets.cssRules)
{
    if (cssRule.selectorText=="search-box-shadowCss")
    {
        for (let cssRule2 of cssRule.cssRules)
        {
            new_style+=cssRule2.cssText.replace("&","");
        }
    }
}
/*
 * template for bibl-search-box
 */
var mns_search_in_radios="";
var template=document.createElement("template");
template.id="bibl-search-box-template";
template.innerHTML=`<style>
:host()
{
    width:100%;
    min-height:30px;
}
${new_style}
</style>
<div name="container">
    <input name="txt_search" type="text"></input><button name="btn_search">Search</button>
    ${mns_search_in_radios}
    <span name='spn_hits'></span>
</div>`;
document.body.appendChild(template);


/*
 * template for mns-search-box
 */
var mns_search_in_radios=`<span>Search in:</span>
        <label><input type='radio' name='search_in' checked value='r'/>Records</label>
        <label><input type='radio' name='search_in' value='m'/>Manuscript Descriptions</label>
        <label><input type='radio' name='search_in' value='s'/>Signatures</label>
        <label><input type='radio' name='search_in' value='o'/>Places of origin</label>`;

template=document.createElement("template");
template.id="search-box-template";
template.innerHTML=`<style>
:host()
{
    width:100%;
    min-height:30px;
}
${new_style}
</style>
<div name="container">
    <input name="txt_search" type="text"></input><button name="btn_search">Search</button>
    ${mns_search_in_radios}
    <span name='spn_hits'></span>
</div>`;
document.body.appendChild(template);

class Search_Box extends HTMLElement
{
    #searchTimer=null;
    constructor(template_name="search-box-template")
    {
        super();
        this.template_name=template_name;
        //component events:
        this.onSearchResultsReceived=null;
        this.onSearchSent=null;
        this.onSearchCanceled=null;
        
        this.searchWhileTyping=true;
        this.outputType="";
        this.search_function=null;
        
        this.search_url="api/search/manuscripts";
        
        this.minimal_length=3;
        this.last_sent_query="";
        this.search_sent=false;
    }
    
    connectedCallback()
    {
        this.shadowDOM=this.attachShadow({mode:'open'});
        
        var template=document.getElementById(this.template_name).content;
        this.shadowDOM.appendChild(template.cloneNode(true));
        //this.shadowDOM.innerHTML=this.myHTML();
        
        WebPage.populatePageObject({root:this.shadowDOM,obj:this,flatten:true});
    }
    txt_search__onkeydown=(e)=>
    {
        if (e.code!=13)
        {
            if (this.searchWhileTyping==true)
            {
                if (this.#searchTimer!=null)
                {
                    window.clearTimeout(this.#searchTimer);
                }
                this.#searchTimer= window.setTimeout(this.send_search,300);
            }
        }
        else
            this.send_search();
    }
    search_in__onchange=(e)=>
    {
        this.send_search(true);
    }
    
    btn_search__onclick=(e)=>
    {
        this.send_search();
    }
    get_search_subject=()=>
    {
        for (var r of this.search_in)
        {
            if (r.checked==true)
            {
                return r.value;
            }
        }
    }
    
    send_search=async(force=false)=>
    {
        if (this.txt_search.value.length>=this.minimal_length && 
                (this.txt_search.value!=this.last_sent_query || force==true))
        {
            this.last_sent_query=this.txt_search.value;
            var query=this.txt_search.value;
            var ce=new CustomEvent("SearchSent",
            {composed:true,detail:
                {source:this,query:query}
            });
                this.dispatchEvent(ce);
            if (this.search_url!="")
            {
                var subject=this.get_search_subject();
                var response=await fetch(this.search_url+"?s="+subject+"&q="+query+"&o="+this.outputType);
                response.text().then(
                    (xml)=>{
                    var xml_obj=new DOMParser().parseFromString(xml,"text/xml");
                    var results=xml_obj.children[0];
                    var data=results.children[0].innerHTML  
                    
                    var h_mns=results.getAttribute("hits_in_manuscripts");
                    var h_ent=results.getAttribute("hits_in_entries");
                    
                    this.spn_hits.innerHTML="Found "+h_mns+" manuscripts";
                    if (h_ent>0)
                        this.spn_hits.innerHTML="Hits: "+h_ent+" entries in " +h_mns+" manuscripts";
                    else if (h_mns>0)
                        this.spn_hits.innerHTML="Found "+h_mns+" manuscripts";
                    else
                        this.spn_hits.innerHTML="Nothing found";
                        
                    var ce=new CustomEvent("SearchResultsReceived",
                        {composed:true,detail:
                            {source:this,data:data,query:query,subject:subject}
                        });
                    this.dispatchEvent(ce);
                    this.search_sent=true;        
                });
                
                
            }
        }
        else if (this.txt_search.value.length<this.minimal_length)
        {
            if (this.search_sent==true)
            {
                var ce=new CustomEvent("SearchCanceled",
                {composed:true,detail:
                    {source:this,reason:"query too short"}
                });
                this.dispatchEvent(ce);
                this.search_sent=false;
                this.last_sent_query="";
            }
        }
    }
    
    
}

class Bibliography_Search_Box extends Search_Box
{
    constructor()
    {
        super("bibl-search-box-template");
        this.search_in=[];
    }
    
}

customElements.define("search-box",Search_Box);
customElements.define("bibl-search-box",Bibliography_Search_Box);





export {Search_Box,Bibliography_Search_Box};
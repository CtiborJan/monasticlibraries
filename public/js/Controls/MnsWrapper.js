//actually just CSS wrapper for list-box related styles 
import * as WebPage from "./functions.js";
class Mns_Wrapper extends HTMLElement
{
    constructor()
    {
        super();
    }
    connectedCallback()
    {
        
       this.shadowDOM=this.attachShadow({mode:'open'});
       this.shadowDOM.innerHTML="<slot></slot>";
       this.innerHTML=
               `
       <style>
            mns-wrapper
            {
                & list-box
                {
                    & highlight {background-color:lightsalmon}
                    & desc {color:gray;}
                    & signature {background-color:lightgray;}
                    & signature::before {content:"signature: ";font-size:80%;}
                    & place-of-origin {background-color:lightblue;}
                    & a[facsimily="true"][href=""]{display:none;}
                    & table tbody tr.lst_expanded_row > td {padding-left:40px;}
                    & time-of-creation {background-color:lightyellow};
            }
        </style>
        `+this.innerHTML;
//        this.shadowDOM.appendChild(this.children[0]);
/*       var s=document.createElement("style");
       s.type="text/css";
       s.appendChild(document.createTextNode("td {background-color:blue;}"));
       this.before(this.children[0]);*/
        
    }    
}

customElements.define("mns-wrapper",Mns_Wrapper);

export {Mns_Wrapper};
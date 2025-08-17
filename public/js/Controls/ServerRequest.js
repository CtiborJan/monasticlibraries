import * as WebCtrl from "./functions.js";

class ServerResponse extends HTMLElement
{
    constructor()
    {
        super();
        this.onClosed=null;
    }
    connectedCallback()
    {
        this.shadowDOM=this.attachShadow({mode:'open'});
        this.shadowDOM.innerHTML=`
        <style>
        :host
        {
            top:20px;
            left:calc(50% - 25%);
            width:50%;
            min-height:100px;
            max-height:90%;
            position:absolute;
            background-color:white;
            border:1px solid lightblue;
            box-shadow:10px 10px;
            display:flex;
            flex-direction:column;
            padding-bottom:30px;
        }
        div.top-strip
        {
            flex-basis:25px;
        }
        div.content-box
        {
            overflow:auto;
            flex-grow:10;
        }
        div.bottom-strip
        {
            position:absolute;
            bottom:0px;
            height:25px;
            width:100%;
            background-color:white;
        }
        div.bottom-strip > button
        {
            position:absolute;
            left:calc(50% - 30px);
            width:60px;
        }
        </style>
            <div class='top-strip'>Server response:</div>
            <div class='content-box'>
                <slot></slot>
            </div>
            <div class='bottom-strip'>
                <button name='btn_close'>Close</button>
            </div>
        `;
        this.innerHTML=`
        <style>
            error
            {
                background:salmon;
                display:block;
            }
            error::before
            {
                content:"Error: ";                
            }
            info
            {
                background:lightgray;
                display:block;
            }
            info::before
            {
                content:"Info: ";
            }
        </style>`+this.innerHTML;
        WebCtrl.populatePageObject({root:this.shadowDOM,obj:this});
        this.btn_close.focus();
    }
    btn_close__onclick=(e)=>
    {
        var ce=new CustomEvent("Closed",
            {composed:true,detail:
                {source:this}
            });
            this.dispatchEvent(ce);
        this.onClosed(ce);
        this.remove();
    }
}

customElements.define("server-response",ServerResponse);

class ServerRequest
{
    constructor(args)
    {
        if (args===undefined)
            args={}

        this.print_to_log=args.log | false;
        
    }
    async fetch(url,arg=null)
    {
        var pro=new Promise((resolve,reject)=>
        {        
            var response=fetch(url,arg).then(response=>
            {
                if (response.ok)
                {
                    response.text().then(content=>
                    {
                        var xml=new DOMParser().parseFromString(content,"text/xml");
                        if (this.print_to_log==true)
                        {
                            console.log(xml.nodeName)+":";
                            for (var ch of xml.children)
                            {
                                console.log("\t"+ch.nodeName+": "+ch.innerHTML);
                            }
                            resolve(content);
                        }
                        else
                        {
                            var server_response=document.createElement("server-response");
                            server_response.innerHTML=content;
                            var console=document.getElementsByTagName("ufrm-console");
                            if (console.length>0 && false)
                            {
                                console=console[0];
                                console.appendChild(server_response);
                            }
                            else
                            {
                                //server_response.slot="server_response";
                                document.body.appendChild(server_response);
                            }
                            server_response.onClosed=(e)=>
                            {
                                resolve(content);
                            };
                        }
                    });

                }
                else
                {
                    reject(content);
                }
            }

            );
        
        });
        return pro;
    }
}

export {ServerRequest};
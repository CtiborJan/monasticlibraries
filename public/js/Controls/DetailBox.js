import * as WebPage from "./functions.js";
class Detail_Box extends HTMLElement
{
    constructor()
    {
        super();
        
    }
    connectedCallback()
    {
        this.shadowDOM=this.attachShadow({mode:'open'});
        this.shadowDOM.innerHTML=` 
            <style>
            .container
            {
                position:absolute;
                min-width:200px;
                width:30%;
                height:40%;
                top:30%;
                left: 35%;
                border:1px solid lightgray;
                background-color:white;
            }
            .title_box
            {
                top:0px;
                width:100%;
                height:20px;
                font-weight:bold;
                text-align:center;
            }
            .content_box
            {
                top:20px;
                bottom:20px;
                width:100%;
                position:absolute;
                overflow:auto;
            }
            .close_box
            {
                bottom:0px;
                height:20px;
                width:100%;
                text-align:center;
                position:absolute;
                
            }
            .close_box::after
            {
                content:'close box';
                cursor:pointer;
            }
            .records_box
            {
            }
        </style>
        <div class='container' name='container'>
            <div class='title_box'>Manuscript details</div>
            <div class='content_box' name='d'>
                <div name='o'><strong name='p'><slot name='sl_name'/></strong></div>
                <div><strong>Description:</strong> <slot name='sl_desc'/></div>
                <div><strong>Place of origin:</strong> <slot name='sl_place_of_origin'/></div>
                <div><strong>Collection:</strong> <slot name='sl_collection'/></div>
                <div><strong>Contents of the manuscript:</strong></div>
                <div class='records_box'><slot name='sl_lst_records'/></div>
            </div>
            <div name='close_box' class='close_box'></div>
        </div>
        `   ;
        
        
        
        
        
        WebPage.populatePageObject({root:this.shadowDOM,obj:this,flatten:true});
        WebPage.populatePageObject({root:this,obj:this,flatten:true});
        
    }
   
    hide()
    {
        this.remove();
    }
    close_box__onclick=(e)=>
    {
        this.hide();
    }
    
}

customElements.define("detail-box",Detail_Box);

export {Detail_Box};
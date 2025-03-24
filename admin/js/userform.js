import * as Controls from "./Controls/functions.js";
import {File_Box} from "./Controls/InputBoxes.js"
import {List_Box} from "./Controls/ListBox.js";
import {Multi_Page} from "./Controls/MultiPage.js";
import {Ajax_Response_Info} from "./Controls/AjaxResponseInfo.js";
import {server} from "./server.js";

class LoadingData
{
	constructor()
	{
		Controls.populatePageObject({root:"main",flatten:true,obj:this});
		server.AjaxResponseInfo=new Ajax_Response_Info();
		//server.basepath=location.pathname.match("(admin/.*)")[1];
		server.basepath="http://localhost/monasticlibraries/admin/api/";
	}
	lst_loaded_files__onMouseEntersRow=(e)=>
	{
        if (this.lst_loaded_files.delete_button==null)
    		this.lst_loaded_files.delete_button=Controls.createElement({tagName:"button",parentElement:e.detail.row.children[3],innerHTML:"x"});
		this.lst_loaded_files.delete_button.onclick=function(ev)
		{
			server.delete_file(e.detail.row.children[0].textContent,()=>{location.reload();});
		};
	}
	lst_loaded_files__onMouseExitsRow=(e)=>
	{
		if (this.lst_loaded_files.delete_button!=null)
		{
			this.lst_loaded_files.delete_button.remove();
			this.lst_loaded_files.delete_button=null;
		}
		//this.lst_loaded_files.delete_button.onclick=function(ev){server.delete_file(e.detail.row.children[0].textContent,()=>{location.reload();});};
	}
	frm_load_file__submit=(e)=>
	{
		e.preventDefault();
		var data = new FormData();
		for (var i=0;i<this.fil_select_file[1].files.length;i++)
		{
			data.append("files[]",this.fil_select_file[1].files[i]);
		}
		server.upload_file(data,()=>{location.reload();});
	}
	tmp_to_def__onclick=(e)=>
	{
		if (confirm("Jsi si jist? Stávající ostrá data budou nahrazena a nepůjde je vrátit!")==true)
			server.copy_db(()=>{location.reload();});
	}
	btn_delete_all__onclick=(e)=>
	{
		server.delete_all(()=>{location.reload();});
	}
	btn_process__onclick=(e)=>
	{
		server.process(()=>{location.reload();});
	}
	btn_copy__onclick=(e)=>
	{
		server.copy_db(()=>{location.reload();});
	}
}

var frm=new LoadingData();
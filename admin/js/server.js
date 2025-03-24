class ServerConnection
{
	#create_xhttp(processing_function)
	{
		var me=this;
		var xhttp = new XMLHttpRequest();
		if (this.AjaxResponseInfo!=null)
		{
			this.AjaxResponseInfo.activate(xhttp,processing_function);
		}
		else
		{
			xhttp.onreadystatechange = function(xml) 
			{
				if (this.readyState == 4 && this.status == 200) 
				{
					processing_function(this);
				}
			}
		}
		return xhttp;
		
	}
	
	constructor()
	{
        this.AjaxResponseInfo=null;
		this.basepath="api/";
	}
	
	GET(url,processing_function,async=true)
	{

		var xhttp=this.#create_xhttp(processing_function);
		xhttp.open("get",this.basepath+url+"&source="+location.pathname.match(/admin\/([^/]+)/)[1],async);
		xhttp.send();
	}
	POST(url,data,processing_function,async=true)
	{
		var xhttp=this.#create_xhttp(processing_function);
		xhttp.open("post",this.basepath+url+"?source="+location.pathname.match(/admin\/([^/]+)/)[1],async);
		xhttp.send(data);
	}

    //functions
    delete_file=(delete_file,processing_function)=>
    {
        this.GET("upload.php?delete_file="+delete_file,processing_function);
    }
	delete_all=(processing_function)=>
	{
		this.GET("upload.php?delete_all=true",processing_function);
	}
	process=(processing_function)=>
	{
		this.GET("upload.php?process=true",processing_function);
	}
    upload_file=(data,processing_function)=>
    {
        this.POST("upload.php",data,processing_function);
    }
	get_tmp_data=(h1,h2,h3,record,processing_function)=>
	{
		this.GET("get_data.php?tmp=true&h1="+h1+"&h2="+h2+"&h3="+h3+"&record="+record,processing_function);
	}
	get_data=(h1,h2,h3,record,processing_function)=>
	{
		this.GET("get_data.php?h1="+h1+"&h2="+h2+"&h3="+h3+"&record="+record,processing_function,false);
	}
	copy_db=(processing_function)=>
	{
		this.GET("tmp_to_def.php",processing_function);
	}
}

var server=new ServerConnection();
export {server};
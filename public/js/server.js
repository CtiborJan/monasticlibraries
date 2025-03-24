class MainServer
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
	}
	
	GET(url,processing_function,async=true)
	{
		var xhttp=this.#create_xhttp(processing_function);
		xhttp.open("get",url,async);
		xhttp.send();
	}
	POST(url,data,processing_function,async=true)
	{
		var xhttp=this.#create_xhttp(processing_function);
		xhttp.open("post",url,async);
		xhttp.send(data);
	}

    //functions 
    get_bibliography_data(h1,h2,h3,record,processing_function)
    {
        this.GET("php/get_bibliography.php?h1="+h1+"&h2="+h2+"&h3="+h3+"&record="+record,processing_function,false);
    }
	
}


var server=new MainServer();
export {server};
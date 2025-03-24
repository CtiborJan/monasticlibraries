<?php
class AjaxResponse
{
	private $messages;
	public $response_type;
	function __construct()
	{
		$this->response_type="info";//or error or...??
		$this->messages=[];
	}
	function info($message)
	{
		$this->add_message("info",$message);
	}
	function error($message)
	{
		$this->add_message("error",$message);
	}
	function add_message($type,$message)
	{
		$this->messages[]="<$type>$message</$type>";
	}
	function get_all()
	{
		$rv=implode("\n",$this->messages);
		return "<".$this->response_type.">\n".$rv ."\n</" .$this->response_type.">";
		
	}
	function respond($type="",$message="",$response_type="")
	{
		if ($type!="" && $message!="")
			$this->add_message($type,$message);
		if ($response_type!="")
			$this->response_type=$response_type;
		header('Content-Type: application/xml');
		echo $this->get_all();
		die();
	}
}

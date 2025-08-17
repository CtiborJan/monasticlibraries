<?php
class ServerResponse
{
	private static $messages;
	public static $response_type;
        public static $xmlns;
        private static $log_fh=false;
        private static $log=false;
	function __construct()
	{
            self::$response_type="info";//or error or...??
            self::$messages=[];
            self::$xmlns="https://github.com/CtiborJan/ServerResponse";
	}
        public static function open_log($folder,$clean=true)
        {
            if (file_exists($folder)==false)
            {
                mkdir($folder,0777,true);
            }
            if (file_exists($folder)==true)
            {
                
                if ($clean==true)
                    unlink($folder."/ServerResponse.log");
                self::$log_fh=fopen($folder."/ServerResponse.log","a");
                self::log("--log message--",date("d.m.Y H:i:s"));
            }
            self::$log=true;
            
        }
        public static function close_log()
        {
            if (self::$log_fh!=false)
                fclose(self::$log_fh);
        }
        public static function get_log_error_message()
        {
            if (self::$log==true && self::$log_fh==false)
                return "<log-error>Log requested, but log file could not be opened!</log-error>";
        }
        public static function log($type,$message)
        {
            if (self::$log==true && self::$log_fh!=false)
            {
                $w=$type.": ".$message;
                if ($type=="--log message--");
                    $w="\n".$w."\n";
                fwrite(self::$log_fh,$w);
            }
        }
	public static function info($message)
	{
            self::add_message("info",$message);
	}
	public static function error($message,$code=0)
	{   
            self::add_message("error",$message);
	}
        public static function data($data)
        {
            self::add_message("data",$message);
        }
	public static function add_message($type,$message)
	{
            self::$messages[]="<$type>$message</$type>";
            self::log($type,$message);    
	}
	public static function get_all($response_type="",$xmlns="")
	{
            if ($xmln=="")
                $xmlns=self::$xmlns;
            if ($response_type=="")
                $response_type=self::$response_type;
            $rv=implode("\n",self::$messages);
            return "<server_response type='".$response_type."' xmlns='$xmlns'>\n".$rv ."\n</server_response>";	
	}
	public static function respond($type="",$message="",$code=200)
	{
            if (gettype($type)=="integer")
            {
                if ($type>=500)
                {
                    $type=="server_error";
                }
                else if ($type>=400)
                {
                    $type="request_error";
                }
                else
                    $type="info";
                $code=$type;
            }
            
            if ($type!="" && $message!="")
                    self::add_message($type,$message);
            header('Content-Type: application/xml',true,$code);
            
            echo self::get_all($type,$xmlns);
            self::close_log();
            die();
	}
}

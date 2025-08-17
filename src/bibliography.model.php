<?php

include_once 'show_errors.incl';
include_once 'cls_common.class.incl';
include_once 'db.class.php';
include_once 'AjaxResponse.class.php';

class mod_bibliography extends cls_common
{
    public static function get_by_orders()
    {
        if (self::table_exists("bibliografie"))
        {
            $result=dbCon::query("select h2 from bibliografie group by h2");
            $rv=self::construct_table_from_mysql_result($result,
                    ["_EX_","mod_bibliography::get_order",true],
                    ["order","Order","{h2}"]);
            return "<list-box name='list' hide_header='true'>$rv</list-box>";
            
        }
    }
    public static function get_orders()
    {
        if (self::table_exists("bibliografie"))
        {
            $result=dbCon::query("select * from bibliografie group by h2");
            $rv=self::construct_table_from_mysql_result($result,
                    
                    ["order","Order","{h2}"]);
            return $rv;
        }
    }
    public static function get_order($order)
    {
        
        if (is_array($order))
            $order=$order["h2"];
        $result=dbCon::query("select * from bibliografie where h2='$order'");
        $rv=self::construct_table_from_mysql_result($result,
                ["record","Record","{zaznam}","width:70%"],
                ["country","Country","{h1}","width:15%"],
                ["place","Place","{h3}","width:15%"]);
        return "<list-box name='lst_records' hide_header='true'>".$rv."</list-box>";
    }
    public static function get_all($tmp=false)
    {
        if ($tmp==true)
            $tmp_str="tmp_";
        if (self::table_exists($tmp_str."bibliografie"))
        {
            $result=dbCon::query("select * from ".$tmp_str."bibliografie;");
            
            $rv=self::construct_table_from_mysql_result($result,
                    ["record","Record","{zaznam}"],
                    ["order","Order","{h2}"],
                    ["country","Country","{h1}"],
                    ["place","Place","{h3}"]);
            return "<list-box name='lst_records' hide_header='true'>".$rv."</list-box>";
        }
    }
}

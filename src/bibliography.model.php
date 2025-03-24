<?php

include_once 'cls_common.class.incl';
include_once 'show_errors.incl';
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
                    ["_EX_","mod_bibliography::get_order",1],
                    ["Order","Order","h2"]);
            return $rv;
            
        }
    }
    public static function get_order($order)
    {
        
        if (is_array($order))
            $order=$order["h2"];
        $result=dbCon::query("select * from bibliografie where h2='$order'");
        $rv=self::construct_table_from_mysql_result($result,
                ["Country","Country","h1"],
                ["Place","Place","h3"],
                ["Record","Record","zaznam"]);
        return "<list-box>".$rv."</list-box>";
    }
    public static function get_2()
    {
        if (self::table_exists("bibliografie"))
        {
            $result=dbCon::query("select * from bibliografie;");
            
            $rv=self::construct_table_from_mysql_result($result,
                    ["record","Record","zaznam"],
                    ["Order","Order","h2"],
                    ["Country","Country","h1"],
                    ["Place","Place","h3"]);
            return $rv;
        }
    }
    public static function get($tmp)
    {	
	if ($tmp=="true" || $tmp==true)
            $db="tmp_bibliografie";
	else
            $db="bibliografie";
        
        
	if (self::table_exists($db))
	{            
		$q="select * from ".$db." ".$where;

		$result=dbCon::query("select * from ".$db);
		$rv= "<table>";
		$rv.= "<thead><tr><td name='country' caption='Country'></td><td name='order' caption='Order'></td><td name='place' caption='Place'></td><td name='book' caption='Book'></td></tr></thead>";
		while($row=$result->fetch_assoc())
		{
			$rv.= "<tr><td>".$row["h1"]."</td><td>".$row["h2"]."</td><td>".$row["h3"]."</td><td>".$row["zaznam"]."</td></tr>\n";
		}
		$rv.="</table>";
		//echo "<table><item>f</item></item>f2</item></table>";
		return $rv;
	}
    }
}

<?php
include_once 'cls_common.class.incl';
include_once 'show_errors.incl';
include_once 'db.class.php';
include_once 'AjaxResponse.class.php';

class mod_manuscripts extends cls_common
{
	public static function get_all($tmp)
	{
            if ($tmp=="true" || $tmp==true)
			$tmp="tmp_";

		if (self::table_exists($tmp."zaznamy"))
		{
			
			$q="select ".$tmp."zaznamy.nazev as titul, ".$tmp."zaznamy.rkp_signatura as signatura,".$tmp."rukopisy.nazev as nazev_rkp,".$tmp."rukopisy.popis as popis,".$tmp."rukopisy.obdobi as obdobi, ".$tmp."skupiny_rkp.nazev,".$tmp."skupiny_rkp.misto from ".$tmp."zaznamy left join ".$tmp."rukopisy on ".$tmp."zaznamy.rkp_signatura=".$tmp."rukopisy.signatura left join ".$tmp."skupiny_rkp on ".$tmp."rukopisy.skupina=".$tmp."skupiny_rkp.id $where";

			$result=dbCon::query($q);
			$rv=self::construct_table_from_mysql_result($result,["title","Title","titul"],["signature","Signature","signatura"],["manuscript","Manuscript","nazev_rkp"],["desc","Description","popis"],["period","Period","obdobi"]);
			return $rv;
		}
		else
		{
		}
	}
	public static function get_all2()
	{
		if (self::table_exists("zaznamy"))
		{
			$q="select rukopisy.nazev as nazev_rkp,rukopisy.popis as popis, rukopisy.url as url,rukopisy.signatura as signatura,rukopisy.obdobi as obdobi, skupiny_rkp.nazev as skupina from rukopisy left join skupiny_rkp on rukopisy.skupina=skupiny_rkp.id";
	//		$q="select zaznamy.nazev as zaznam, zaznamy.rkp_signatura as signatura,rukopisy.nazev as nazev_rkp,rukopisy.popis as popis,rukopisy.obdobi as obdobi, skupiny_rkp.nazev as skupina,skupiny_rkp.misto from zaznamy left join rukopisy on zaznamy.rkp_signatura=rukopisy.signatura left join skupiny_rkp on rukopisy.skupina=skupiny_rkp.id $where";
			
			$result=dbCon::query($q);
			$rv=self::construct_table_from_mysql_result($result,["_EX_","mod_manuscripts::get_one_mns",1],["Collection","Collection","skupina"],["manuscript","Manuscript","nazev_rkp"],["period","Period","obdobi"]);
			return $rv;
		}
		else
		{
		}
	}
	public static function get_by_groups($tmp)
	{
		if ($tmp=="true" || $tmp==true)
			$db="tmp_skupiny_rkp";
		else
			$db="skupiny_rkp";
		
		if (self::table_exists($db))
		{
			$q="select * from $db;";
			$result=dbCon::query($q);
			$rv=self::construct_table_from_mysql_result($result,["_EX_",'mod_manuscripts::get_mns_group',1],["id","ID","id"],["title","Title","nazev"]);
			return $rv;
		}
	}

	public static function get_mns_group($id)
	{
		global $mysqli, $ajax;
		$db="rukopisy";
		
		if (is_array($id))
		{
			$id=$id["id"];
		}		
		$q="select * from $db where skupina=$id;";

		$result=dbCon::query($q);
		$rv="<list-box>".self::construct_table_from_mysql_result($result,["_EX_",'mod_manuscripts::get_one_mns',1],["title","Title","nazev"])."</list-box>";
		return $rv;
		
		
	}

	public static function get_one_mns($arg)
	{
		global $mysqli, $ajax;
		$db="zaznamy";
		
		$rv="<div>\n";
		$popis=$arg["popis"];
		$url=$arg["url"];
		if ($url!="")
			$url="<em><a target='_blank' href='$url'>Faksimilie</a></em>";
		$rv.="<div>
		<div>$popis</div>
		<div>$url</div>
		</div>";
		if (is_array($arg))
		{
			$signature=$arg["signatura"];
		}
		else
			$signature=$arg;
		$q="select * from $db where rkp_signatura='$signature';";	
		$result=dbCon::query($q);
		$rv.="<list-box>".self::construct_table_from_mysql_result($result,["entry","Entry","nazev"])."</list-box></div>";
		return $rv;
		
		
	}

	public static function get_mns($tmp)
	{
		global $mysqli;
		
		
		if ($tmp=="true" || $tmp==true)
			$db="tmp_rukopisy";
		else
			$db="rukopisy";
		
		if (self::table_exists($db))
		{
			
			$q="select * from $db;";

			$result=dbCon::query($q);
			
			$rv=self::construct_table_from_mysql_result($result,
									["title","Title","nazev"],
									["signature","Signature","signatura"],
									["desc","Description","popis"],
									["period","Period","obdobi"],
									["group_id","Group id","skupina"],
									["url","URL","url"]);
			//echo "<table><item>f</item></item>f2</item></table>";
			return $rv;
		}
	}

	
}

<?php
include_once 'cls_common.class.incl';
include_once 'show_errors.incl';
include_once 'db.class.php';
include_once 'AjaxResponse.class.php';

class mod_manuscripts extends cls_common
{
    public static function get_collections()
    {
        
        /*
         * pouze jedna úroveň, nenačítáme rovnou další (rukopisy a záznamy)
         */
        if (self::table_exists("skupiny_rkp"))
        {
            $q="select * from skupiny_rkp";
            $result=dbCon::query($q);
            $rv=self::construct_table_from_mysql_result($result,
                    ["_EX_","api/manuscripts/collection/{id}",0],
                    ["id","id","id"],
                    ["Collection","Collection","nazev"]);
            return $rv;
        }
    }
    
    public static function get_collection($collection_id)
    {
        /*
         * pouze jedna úroveň, nenačítáme rovnou další (záznamy)
         */
        $signature= urldecode($signature);
        if (self::table_exists("rukopisy"))
        {
            $q="select * from rukopisy where skupina=$collection_id";
            $result=dbCon::query($q);
            $rv=self::construct_table_from_mysql_result($result,
                    ["_EX_","api/manuscripts/{Signature}/records",0],
                    ["Signature","Signature","signatura"],
                    ["Location","Location","nazev"],
                    ["Description","Description","popis"],
                    ["Period","Perios","obdobi"],
                    ["Place_of_origin","Place of origin","misto_vzniku"]);
            return $rv;
        }
    }
   
    
    public static function get_manuscript($manuscript_id)
    {
        if (self::table_exists("rukopisy"))
        {
            $q="select * from rukopisy where id=".$id;
            $result=dbCon::query($q);
            $rv=self::construct_table_from_mysql_result($result,
                    ["Signature","Signature","signatura"],
                    ["Location","Location","nazev"],
                    ["Description","Description","popis"],
                    ["Period","Perios","obdobi"],
                    ["Place_of_origin","Place of origin","nazev"]);
            return $rv;
        }
    }
    public static function get_records($signature)
    {
        $signature= urldecode($signature);
        if (self::table_exists("zaznamy"))
        {
            
            $q="select * from zaznamy where rkp_signatura='$signature'";
            $result=dbCon::query($q);
            $rv=self::construct_table_from_mysql_result($result,
                    ["entry","Entry","nazev"]);
            return $rv;
            
        }
    }
    
    public static function get_all($tmp)
    {
        if ($tmp=="true" || $tmp==true)
                    $tmp="tmp_";

            if (self::table_exists($tmp."zaznamy"))
            {

                    $q="select ".$tmp."zaznamy.nazev as titul, ".$tmp."zaznamy.rkp_signatura as signatura,"
                            .$tmp."rukopisy.nazev as nazev_rkp,".$tmp."rukopisy.popis as popis,"
                            .$tmp."rukopisy.obdobi as obdobi, ".$tmp."skupiny_rkp.nazev,"
                            .$tmp."skupiny_rkp.misto from ".$tmp."zaznamy left join "
                            .$tmp."rukopisy on ".$tmp."zaznamy.rkp_signatura=".$tmp."rukopisy.signatura left join "
                            .$tmp."skupiny_rkp on ".$tmp."rukopisy.skupina=".$tmp."skupiny_rkp.id $where";

                    $result=dbCon::query($q);
                    $rv=self::construct_table_from_mysql_result($result,
                                            ["title","Title","titul"],
                                            ["signature","Signature","signatura"],
                                            ["manuscript","Manuscript","nazev_rkp"],
                                            ["desc","Description","popis"],
                                            ["period","Period","obdobi"]);
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
                    $q="select rukopisy.nazev as nazev_rkp,rukopisy.popis as popis, "
                            . "rukopisy.url as url,rukopisy.signatura as signatura,"
                            . "rukopisy.obdobi as obdobi, skupiny_rkp.nazev as skupina "
                            . "rukopisy.misto_vzniku as misto_vzniku"
                            . "from rukopisy left join skupiny_rkp on rukopisy.skupina=skupiny_rkp.id";
    //		$q="select zaznamy.nazev as zaznam, zaznamy.rkp_signatura as signatura,rukopisy.nazev as nazev_rkp,rukopisy.popis as popis,rukopisy.obdobi as obdobi, skupiny_rkp.nazev as skupina,skupiny_rkp.misto from zaznamy left join rukopisy on zaznamy.rkp_signatura=rukopisy.signatura left join skupiny_rkp on rukopisy.skupina=skupiny_rkp.id $where";

                    $result=dbCon::query($q);
                    $rv=self::construct_table_from_mysql_result($result,
                            ["_EX_","mod_manuscripts::get_one_mns",1],
                            ["Collection","Collection","skupina"],
                            ["manuscript","Manuscript","nazev_rkp"],
                            ["place","Place of origin","misto_vzniku"],
                            ["period","Period","obdobi"]);
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
                    $rv=self::construct_table_from_mysql_result($result,
                                       ["_EX_",'api/manuscripts/collection/{id}',0],
                                        ["id","ID","id"],["title","Title","nazev"]);
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
            $rv="<list-box name='lst_mnsGroup'>".self::construct_table_from_mysql_result($result,
                                    ["_EX_",'mod_manuscripts::get_one_mns',1],
                                    ["title","Title","nazev"])."</list-box>";
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
            $rv.="<list-box>".self::construct_table_from_mysql_result($result,
                    ["entry","Entry","{nazev}"])."</list-box></div>";
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
                                                                    ["title","Title","{nazev}"],
                                                                    ["signature","Signature","{signatura}"],
                                                                    ["desc","Description","{popis}"],
                                                                    ["period","Period","{obdobi}"],
                                                                    ["place","Place of origin","{misto_vzniku}"],
                                                                    ["group_id","Group id","{skupina}"],
                                                                    ["url","URL","{url}"]);
                    //echo "<table><item>f</item></item>f2</item></table>";
                    return $rv;
            }
    }
    
    
    
    
    
    private static function create_where_clause($where)
    {
        $where=implode(" and ",$where);
        if ($where!="")
            return "where ".$where;
        else
            return "";
    }
     
    public static function get_collections_ex($args)
    {
        if ($args["tmp"]==true)
            $tmp="tmp_";
        else
            $tmp="";
        
        $instant_exp=$args["instant_exp"];
        $get_manuscripts_fn=$args["get_mns_fn"];
        $get_manuscripts_args=$args["get_mns_args"];
        $signatures=$get_manuscripts_args["signatures"];
        
        $wrap=$args["wrap_in_list"];
        if ($wrap=="")
            $wrap=true;
        
        if (self::table_exists("rukopisy"))
        {
            if ($signatures!="")
            {
                $q1="select skupina from ".$tmp."rukopisy where signatura in (". implode(",", $signatures).") group by skupina";
                $result1=dbCon::query($q1);
                $collections=[];
                while ($r=$result1->fetch_assoc())
                {
                    $collections[]=$r["skupina"];
                }
                $q="select * from ".$tmp."skupiny_rkp where id in (".implode(",",$collections).")";
                
            }
            else
            {
                $q="select * from ".$tmp."skupiny_rkp";
            }
            $result=dbCon::query($q);
            
            if ($instant_exp!=false)
            {
                $expand_all=" expand_all='true'";
            }
            
            $rv=self::construct_table_from_mysql_result($result,
                ["_EX_",$get_manuscripts_fn,$instant_exp,$get_manuscripts_args],
                [["id","","hidden"],"id","{id}","hidden"],
                ["Collection","Collection","{nazev}"]);
            if ($wrap==true)
                $rv="<list-box name='list'$expand_all show_header='false'>$rv</list-box>";   
           
            return $rv;
            
            
        }
    }
    
    public static function get_places_of_origin_ex(...$args)
    {
        if (sizeof($args)>=1)
            $args=array_merge(...$args);
        
        $instant_exp=$args["instant_exp"];
        $get_manuscripts_fn=$args["get_mns_fn"];
        $get_manuscripts_args=$args["get_mns_args"];
        $wrap=$args["wrap_in_list"];
        if ($wrap=="")
            $wrap=true;
        
        if (is_array($args["places"]))
            $signatures=implode(",",$args["places"]);
        
        if (is_array($args["signatures"]))
            $signatures=implode(",",$args["signatures"]);
        
        $where=[];
        if ($places!="")
        {
            $where[]="misto_vzniku in (".$places.")";
        }
        if ($signatures!="")
        {
            $where[]="signatura in ($signatures)";
        }
        $where=mod_manuscripts::create_where_clause($where);
        $q="select misto_vzniku from rukopisy $where group by misto_vzniku";
        $result=dbCon::query($q);
        
        if ($instant_exp!=false)
        {
            $expand_all=" expand_all='true'";
        }
        
            
        $rv=self::construct_table_from_mysql_result($result,
            ["_EX_",$get_manuscripts_fn,$instant_exp,$get_manuscripts_args],
            ["place","Place of origin","{misto_vzniku}"]);
        if ($wrap==true)
            $rv="<list-box name='list'$expand_all>$rv</list-box>";

        return $rv;
        
    }
    
    public static function get_manuscripts_ex(...$args)
    {        
        if (sizeof($args)>=1)
            $args=array_merge(...$args);

        if ($args["tmp"]==true)
            $tmp="tmp_";
        else
            $tmp="";
        
        $collection_id=$args["id"];
        
        if (is_array($args["signatures"]))
            $signatures=implode(",",$args["signatures"]);
        else
            $args["signatures"];
                
        if (is_array($args["place"]))
            $places=implode(",",$args["place"]);
        else
            $places=$args["place"];
        if ($places=="" && $args['misto_vzniku']!="")
        {
            $places="'".$args["misto_vzniku"]."'";
        }
        
        
        $instant_exp=$args["instant_exp"];
        $get_records_fn=$args["get_records_fn"];
        $get_records_args=$args["get_records_args"];
        
        $where=[];
        if ($collection_id!="")
        {
            $where[]="skupina=$collection_id";
        }
        if ($signatures!="")
        {
            $where[]="signatura in ($signatures)";
        }
        if ($places!="")
        {
            $where[]="misto_vzniku in ($places)";
        }
        
        
        $where=mod_manuscripts::create_where_clause($where);
        
        /*$q="select replace(nazev,signatura2,concat('<sign>',signatura2,'</sign>')) as nazev,"
                . "replace(popis,misto_vzniku,concat('<place-of-origin>',misto_vzniku,'</place-of-origin>')) as popis,"
                . "signatura,url"
                . " from "
                . "(select nazev,popis,misto_vzniku,regexp_replace(signatura,".'"\\\{[0-9]+\\\}"'.",'') as signatura2,signatura,url from "
                .$tmp."rukopisy $where) t2";
        */
        $q="select * from ".$tmp."rukopisy $where";
    
        $result=dbCon::query($q);
        
        if ($instant_exp!=false)
        {
            $expand_all=" expand_all='true'";
        }
        
        $description_fn=function($row,$arg)
        {
            $id=$row["signatura"];
            $s=preg_replace("/^\{[0-9]+\}/","",$id);
            $t=$row["nazev"];
            $d=$row["popis"];
            $o=$row["misto_vzniku"];
            $p=$row["obdobi"];
            $u=$row["url"];
            $c=1;
            if ($u=="")
                $a="";
            else
                $a="<a href='$u' target='_blank' facsimily='true'>Digitalisat ↗</a>";
            $t= str_replace($s, "<signature>$s</signature>", $t);
            if ($o!="?")
                $d= str_replace($o, "<place-of-origin>$o</place-of-origin>", $d);
            $d= str_replace($p,"<time-of-creation>$p</time-of-creation>",$d,$c);
            return $t." ".$a ."<br/><desc>$d</desc>";
        };
        $period_fn=function($row,$arg)
        {
            $p=$row["obdobi"];
            preg_match_all("/([0-9]{3,4})/",$p,$a);
            $a=$a[0];
            preg_match_all("/([XIV]+)/",$p,$r);
            foreach($r[0] as $roman)
            {
                if ($roman=="X")
                    $a[]="950";
                if ($roman=="XI")
                    $a[]="1050";
                if ($roman=="XII")
                    $a[]="1150";
                if ($roman=="XIII")
                    $a[]="1250";
                if ($roman=="XIV")
                    $a[]="1350";
                if ($roman=="XV")
                    $a[]="1450";
                if ($roman=="XVI")
                    $a[]="1550";
            }
            if (is_array($a) && sizeof($a)>0)
                return min($a);
            else 
                return 2000;
        };
        $rv="<list-box name='lst_mnsGroup'$expand_all hide_header='true'>".self::construct_table_from_mysql_result($result,
                                    ["_EX_",$get_records_fn,$instant_exp,$get_records_args],
                                    [["title","",""],"Title",[$description_fn,null]],
                                    [["signature","","hidden"],"Signature","{signatura}","hidden"],
                                    [["period","","hidden"],"Period",[$period_fn,null],"hidden"])."</list-box>";
        return $rv;
        
    }
    
    public static function get_records_ex(...$args)
    {

        if (sizeof($args)>=1)
            $args=array_merge(...$args);
        
        if ($args["tmp"]==true)
            $tmp="tmp_";
        else
            $tmp="";
        
        if (self::table_exists($tmp."zaznamy"))
        {
            $signature=isset($args["signatura"]) ? $args["signatura"] : $args["signature"];
    
            if (is_array($args["record_ids"]))
                $ids=implode(",",$args["record_ids"]);

            $where=[];
            if ($ids!="")
            {
                $where[]="id in ($ids)";
            }
            if ($signature!="")
            {
                $where[]="rkp_signatura='$signature'";
            }
            $where=mod_manuscripts::create_where_clause($where);
            

            $q="select * from ".$tmp."zaznamy $where";
            
            
            $result=dbCon::query($q);
            
            $rv="<list-box name='lst_records' $slot hide_header='true'>".self::construct_table_from_mysql_result($result,
                    ["entry","Entry","{nazev}","w100"])."</list-box>";
            return $rv;
            
        }
    }
    public static function get_manuscript_detail($signature)
    {
        $list_box= mod_manuscripts::get_records_ex(
                ["signature"=>$signature]
        );
        
        $q="select * from rukopisy where signatura='".$signature."'";
        $result=dbCon::query($q);
        $r=$result->fetch_assoc();
        
        
        
        $rv="<detail-box name='mns_detail_box'>"
                . "<span slot='sl_name' name='name2'><div>".$r["nazev"]."</div></span>"
                . "<span slot='sl_desc'>".$r["popis"]."</span>"
                . "<span slot='sl_place_of_origin'>".$r["misto_vzniku"]."</span>"
                . "<div slot='sl_lst_records'>".$list_box."</div>"
                . "</detail-box>";
        return $rv;
    }
	
}

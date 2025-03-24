<?php

include_once "../incl/db_access.incl";

$id_skupiny=0;

class cls_extract_data
{

    public static function create_tables($type,$tmp="")
    {
		global $mysqli,$ajax;

		if ($mysqli==null)
		{
			$ajax->respond("error","mysqli==null");
		}

		if ($type=="manuscripts")
		{
			$mysqli->query("drop table if exists ".$tmp."skupiny_rkp");
			$mysqli->query("drop table if exists ".$tmp."rukopisy");
			$mysqli->query("drop table if exists ".$tmp."zaznamy");

			$mysqli->query("create table ".$tmp."skupiny_rkp (id int, nazev varchar(1000), misto varchar(250))");
			$mysqli->query("create table ".$tmp."rukopisy (nazev varchar(1000), signatura varchar(50), popis varchar(1000), obdobi varchar(100),skupina int,url varchar(1000), pozn varchar(10))");
			$mysqli->query("create table ".$tmp."zaznamy (nazev varchar(10000), rkp_signatura varchar(250), pozn varchar(10))");
		}
		else
		{
			$mysqli->query("drop table if exists ".$tmp."bibliografie");

			$mysqli->query("create table ".$tmp."bibliografie (h1 varchar(500),h2 varchar (500),h3 varchar(500),zaznam varchar(2000))");
		}
    }

    public static function insert_into_db($type,$data,$tmp="")
    {


		global $mysqli,$ajax;
		$ajax->info("Vkládám data do databáze ".$tmp);
		if ($type=="manuscripts")
		{

			$query=$data;
			$rv=$mysqli->query($query);
			if ($rv==true)
				$ajax->info("úspěšně");
			else
				$ajax->error("neúspěšně");

			$rv=$mysqli->query("select count(*) as count from $tmp;");

			$row=$rv->fetch_assoc();
			$ajax->info($row["count"]. " záznamů");
		}
		else
		{


			$query="insert into ".$tmp.$type. " values ".$data;

			$fh=fopen("../admin/$type/insert.sql","w");
                        if($fh==false)
                            $ajax->respond("error","Nelze zapsat do souboru insert.sql");
			fputs($fh,$query);
			$ajax->info("Vygenerovaný SQL dotaz uložen do souboru insert.sql");

			$rv=$mysqli->query($query);
			if ($rv==true)
				$ajax->info("úspěšně");
			else
				$ajax->error("neúspěšně");
			$mysqli->query("delete from ".$tmp.$type. " where zaznam=''");

			$rv=$mysqli->query("select count(*) as count from tmp_bibliografie;");
			$row=$rv->fetch_assoc();
			$ajax->info($row["count"]. " záznamů");
		}

    }


    public static function parse_docx($xmlfile,$type="")
    {
		global $ajax,$id_skupiny;

		$next_l=function($lines,&$index)
		{
			$index++;
			while (trim($lines[$index])=="" && $index<sizeof($lines))
			{
				$index++;
			}
			return replace_quotes(trim($lines[$index]));
		};

		$xsl_doc = new DOMDocument();
		if ($xsl_doc->load("/var/www/html/monasticlibraries/admin/xslt/word_transform_".$type.".xsl")==false)
                        $ajax->respond("error","Nepovedlo se nahrát XSLT soubor.");
                
		//$xsl_doc->load("word_transform_bibliografie.xsl");

		$xml_doc = new DOMDocument();
		$xml_doc->load($xmlfile);


		if ($xml_doc==false || $xsl_doc==false)
		{
			$ajax->respond("error","Nepodařilo se nahrát XML","error");
		}
		$proc = new XSLTProcessor();
		$proc->registerPHPFunctions();
                
		$proc->importStylesheet($xsl_doc);
		$newdom = $proc->transformToDoc($xml_doc);


		$rv=$newdom->saveXML();
		

		//$fh=fopen("post_transform","w");
		//fputs($fh,$rv);
		//fclose($fh);

		if ($type=="manuscripts")
		{
			

			$sql_skupiny_head="insert into tmp_skupiny_rkp (id, nazev, misto) values ";
			$sql_skupiny=[];
			$sql_rkp_head="insert into tmp_rukopisy (nazev,signatura,popis,obdobi,skupina,url,pozn) values ";
			$sql_rkp=[];
			$sql_rkp_row="";
			$sql_rkp_del=
			$sql_zaznam_head="insert into tmp_zaznamy (nazev,rkp_signatura) values ";
			$sql_zaznam=[];
			$lines=explode("\n",$rv);
			$signatura="";
			$last="";
			$counter=0;
			$R_to_be_closed=false;
			for ($i=1;$i<sizeof($lines);$i++)
			{
				$counter++;
				$l=trim($lines[$i]);
				//echo $l."\n";
				if ($l!="")
				{
					if ($l=="RUKOPIS:")
					{
						if ($R_to_be_closed==true)
							$sql_rkp_lines[]="(".implode(",",$sql_rkp).")";

						$R_to_be_closed=true;
						$last="R";
						//$l=trim($lines[++$i]);
						$sql_rkp=array("''","''","''","''","''","''","''");

						$j=$i;
						$l=$next_l($lines,$i);
						if ($l=="{nejisté umístění}")
							$sql_rkp[6]="'N'";
						else
							$i=$j;

						$l=$next_l($lines,$i);
						$sql_rkp[0]="'$l'";
					}
					else if ($l=="URL:" && $last=="R")
					{
						$l=$next_l($lines,$i);
						$sql_rkp[5]="'$l'";
					}
					else if ($l=="SIGNATURA:" && $last=="R")
					{
						//$l=trim($lines[++$i]);
						$l=$next_l($lines,$i);
						$sql_rkp_row.='"'.$l.'",';
						$sql_rkp[1]="'$l'";
						$signatura=$l;
					}
					else if ($l=="POPIS:" && $last=="R")
					{
						//$l=trim($lines[++$i]);
						$l=$next_l($lines,$i);
						$sql_rkp_row.='"'.$l.'",';
						$sql_rkp[2]="'$l'";

						$segm=explode(",",$l);
						$datace=trim($segm[1]);

						$sql_rkp[3]="'$datace'";
						$sql_rkp[4]="'$id_skupiny'";

						$sql_rkp_row.='"'.$datace.'",'.$id_skupiny.')';



					}
					else if ($l=="ZÁZNAM:" && $last=="R")
					{
						if ($R_to_be_closed==true)
						{
							$sql_rkp_lines[]="(".implode(",",$sql_rkp).")";
							$R_to_be_closed=false;
						}
						//$l=trim($lines[++$i]);
						$l=$next_l($lines,$i);
						$sql_zaznam[]='("'.replace_quotes($l).'","'.$signatura.'")';
					}

					else if ($l=="SKUPINA:")
					{
						$last="S";
						$id_skupiny++;
						//$l=trim($lines[++$i]);
						$l=$next_l($lines,$i);
						$sql_skupiny[]='('.$id_skupiny.',"'.$l.'","")';
					}
				}
			}
			$sql_rkp=$sql_rkp_head . implode(",\n",$sql_rkp_lines);
			$sql_zaznam=$sql_zaznam_head . implode(",\n",$sql_zaznam);
			$sql_skupiny=$sql_skupiny_head . implode(",\n",$sql_skupiny);
			//echo $sql_rkp;
			//die();
			self::insert_into_db("manuscripts",$sql_skupiny,"tmp_skupiny_rkp");
			self::insert_into_db("manuscripts",$sql_rkp,"tmp_rukopisy");
			self::insert_into_db("manuscripts",$sql_zaznam,"tmp_zaznamy");
			
			#return Array($sql_skupiny,$sql_rkp,$sql_zaznam);
		}
		else
		{
			$rv_arr=explode("\n",$rv);
			$rv_arr[0]="";
			$rv="";
			for ($i=0;$i<count($rv_arr);$i++)
			{

				if (trim($rv_arr[$i])!="")
				{

					if ($rv!="")
						$rv.=",\n";
					$rv_arr[$i]=str_replace("\scaps:1","<smallcaps>",$rv_arr[$i]);
					$rv_arr[$i]=str_replace("\scaps:0","</smallcaps>",$rv_arr[$i]);

					$rv_arr[$i]=str_replace("\i:1","<i>",$rv_arr[$i]);
					$rv_arr[$i]=str_replace("\i:0","</i>",$rv_arr[$i]);
					$rv.=$rv_arr[$i];
				}
			}


			//$rv="insert into tmp_bibliografie (h1,h2,h3,zaznam) values ".trim(implode(",\n",$rv_arr),",\n\r\t\s");
			//$rv=trim(implode(",\n",$rv_arr),",\n\r\t\s");

			$ajax->info("XSL transformace úspěšná");



			self::insert_into_db("bibliography",$rv,"tmp_");
		}
		
    }

}

class cls_unpack_docx
{

    public static function unpack($file,$folderTo)
    {
        global $ajax;
        $zip=new ZipArchive;
        if ($zip->open($file)===true)
        {
            $index=$zip->locateName("word/document.xml");
            if ($index!==false)
            {
                $document=$zip->getFromName("word/document.xml");
                $document=str_replace("<w:p>","\n<w:p>",$document);
                mkdir($folderTo."/".basename($file));
                $unzipped_path=$folderTo."/".basename($file)."/document.xml";
                file_put_contents($unzipped_path,$document);

                if (file_exists($unzipped_path))
                {
                    $ajax->add_message("info",'Extrahování souboru ok');
                    return $unzipped_path;
                }
                else
                    $ajax->respond("error","Extrahování souboru se nezdařilo");
            }
            else
                $ajax->respond("error",'$index==false, soubor document.xml v archivu nenalezen');
        }
        else
            $ajax->respond("error",'Selhalo otevření archivu ' .$file,"error");
    }
}



function replace_quotes($text)
{//funkce používaná z XSLT, proto nemůže být členem třídy
	if (gettype($text)=="string")
		return str_replace('"',"&quot;",$text);
	else
		return str_replace('"',"&quot;",$text[0]->textContent);
}
function rkp_signatura($text)
{//funkce používaná z XSLT, proto nemůže být členem třídy
	$t="";
	for ($i=0;$i<sizeof($text);$i++)
	{
		$t.=$text[$i]->textContent;
	}
	preg_match("/.*,([^,(]+)/",$t,$m);
	return $m[1];
}



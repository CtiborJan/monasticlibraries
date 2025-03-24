<?php
include_once "AjaxResponse.incl";
include_once "db.class.php";
include_once "cls_bibliography.incl";
include_once "cls_manuscripts.incl";

class cls_admin
{
	public function __construct()
	{
		
	}
	
	public static function make_files_table($folder)
	{
		$files=self::list_files($folder);
		$rv="<table><thead><tr><th caption='Jméno souboru'></th><th caption='Datum'></th><th caption='Velikost'></th><th caption='' caption='delete' width='21px'></th></tr></thead>\n";
		foreach ($files as $file)
		{
			$rv.="<tr>";
			foreach ($file as $item)
				$rv.="<td>$item</td>";
			$rv.="<td></td>";
			$rv.="</tr>";
		}
		$rv.="</table>";
		return $rv;
	}
	public static function list_bibliography($tmp)
	{
		$rv='<list-box name="lst_tmp">';
		$rv.=cls_bibliography::get($tmp);
		$rv.="</list-box>";
		return $rv;
	}
	public static function list_manuscripts($tmp)
	{
		$rv="<multi-page name='mlp2'>";
		$rv.="<div page_caption='Skupiny rukopisů' page_name='grp'><list-box>".cls_manuscripts::get_by_groups($tmp)."</list-box></div>";
		$rv.="<div page_caption='Rukopisy' page_name='manuscripts'><list-box>".cls_manuscripts::get_mns($tmp)."</list-box></div>";
		$rv.="<div page_caption='Záznamy' page_name='entries'><list-box>".cls_manuscripts::get_all($tmp)."</list-box></div>";
		$rv.="</multi-page>";
		return $rv;
	}

	public static function list_files($folder,$filters=null)
	{
		function file_to_array($file_path)
		{
			return [basename($file_path),date("d. m. Y",filemtime($file_path)),filesize($file_path)];
		}
		$rv=[];
		$files=scandir($folder);
		foreach ($files as $file)
		{
			$file_path=$folder."/".$file;
			if ($file!="." && $file!="..")
			{
				if ($filters!=null)
				{
					if (sizeof($filters)==0)
					{
						$filters=[$filters];
					}
					foreach ($filters as $filter)
					{
						if (preg_match($filter,$file))
						{
							$rv[]=file_to_array($file_path);
						}
					}
				}
				else
					$rv[]=file_to_array($file_path);
			}
		}
		return $rv;
	}
	
}


class cls_upload
{
	public $basedir="/var/www/html/monasticlibraries/admin/bibliografie";
    public function __construct() 
    {
        global $ajax;        
    }
    public function delete_file()
    {
		$names=explode(";",$_REQUEST["delete_file"]);
		foreach ($names as $name)
		{
			unlink($basedir."/files/".$name);
			rmdir($basedir."/unzipped/".$name);
		}
		$ajax->respond("info","Soubory ".implode(", ",$names)." smazány");
    }
    public function upload_files()
    {
        foreach (scandir($basedir."/files") as $f)
		{
			unlink($basedir."/files/" . $f);
		}
	
		$original_name=$_FILES["fil_select_file"]["name"];
		$name=$_FILES["fil_select_file"]["name"].".".date("Y-m-d-H_i_s");
		move_uploaded_file($_FILES["fil_select_file"]["tmp_name"],$basedir."/files/".$name);
		$unzipped_path=unzip_docx($basedir."/files/$name",$basedir."/unzipped");
		
		$rv=create_tables("bibliografie","tmp_");
		parse_docx($unzipped_path,"bibliografie");
		$ajax->add_message("info",$rv);
    }
}

class cls_extract_data
{

    function create_tables($type,$tmp="")
    {
	global $mysqli,$ajax;

	if ($mysqli==null)
	{
		$ajax->respond("error","mysqli==null");
	}

	if ($type=="rkp")
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

    function insert_into_db($type,$data,$tmp="")
    {


	global $mysqli,$ajax;
	$ajax->info("Vkládám data do databáze ".$tmp);
	if ($type=="rkp")
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

		$fh=fopen("insert.sql","w");
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


    function parse_docx($xmlfile,$type="")
    {
	global $id_skupiny,$ajax;

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
	$xsl_doc->load("word_transform_".$type.".xsl");
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

	$fh=fopen("post_transform","w");
	fputs($fh,$rv);
	fclose($fh);

	if ($type=="rkp")
	{
		$this->create_tables($type,"tmp_");

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
		$this->insert_into_db("rkp",$sql_skupiny,"tmp_skupiny_rkp");
		$this->insert_into_db("rkp",$sql_rkp,"tmp_rukopisy");
		$this->insert_into_db("rkp",$sql_zaznam,"tmp_zaznamy");
		$ajax->respond();
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



		$this->insert_into_db("bibliografie",$rv,"tmp_");
	}
	$fh=fopen("post_transform2","w");
	fputs($fh,$sql_rkp);
	fclose($fh);
    }

}

class cls_unpack_docx
{

    function unpack($file,$folderTo)
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


#export to server bibliografie
#export delete_file(delete_file) to biblio 
#export POST upload_file(data) ?x=12

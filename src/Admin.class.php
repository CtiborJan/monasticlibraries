<?php
/*
 * helper class for admin providing functionalities for both bibliography and manuscripts admin
 * Serves as parent class for M and B controllers
 */
include_once "ServerResponse.class.php";
include_once "db.class.php";
include_once "bibliography.model.php";
include_once "manuscripts.model.php";

class cls_admin
{
        public static function make_files_table($folder)
	{
		$files=self::list_files($folder);
		$rv="<list-box name='lst_loaded_files'>\n<table>\n<thead><tr>"
                        . "<th caption='Jméno souboru'></th>"
                        . "<th caption='Datum'></th>"
                        . "<th caption='Velikost'>"
                        . "</th><th caption='' width='21px'></th></tr></thead>\n"
                        . "<tbody>";
		foreach ($files as $file)
		{
			$rv.="<tr>";
			foreach ($file as $item)
				$rv.="<td>$item</td>";
			$rv.="<td></td>";
			$rv.="</tr>";
		}
		$rv.="</tbody>\n</table>\n</list-box>";
		return $rv;
	}
	public static function list_bibliography($tmp)
	{
		$rv=mod_bibliography::get_all($tmp);
		return $rv;
	}
	public static function list_manuscripts($tmp)
	{
		$rv="<multi-page name='mlp2'>";
		$rv.="<one-page caption='Skupiny rukopisů' name='grp'>".mod_manuscripts::get_collections_ex(["tmp"=>$tmp])."</one-page>";
		$rv.="<one-page caption='Rukopisy' name='manuscripts'>".mod_manuscripts::get_manuscripts_ex(["tmp"=>$tmp])."</one-page>";
		$rv.="<one-page caption='Záznamy' name='entries'>".mod_manuscripts::get_records_ex(["tmp"=>$tmp])."</one-page>";
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
    /*
     *  třída starající se o nahrání docx souborů z uživatelova disku 
     * a rovnou i extrakci xml z nich
     */
    public static $basedir="/var/www/html/monasticlibraries/admin/";

    public static function delete_file($folder,$names)
    {
        if ($names==null)
        {//=delete whole folder
            $names=scandir($folder."/files");            
        }
        foreach ($names as $name)
        {
            if ($name!="." && $name!="..")
            {
                unlink($folder."/files/".$name);
                unlink($folder."/unzipped/$name/document.xml");
                rmdir($folder."/unzipped/".$name);
                ServerResponse::add_message("info", $folder."/files/".$name);
            }
        }
        ServerResponse::respond("info","Soubory ".implode(", ",$names)." ve složce smazány");
    }
    public static function upload_files($folder)
    {
        if ($folder=="bibliography")
        {
            rrmdir($folder."/files");
            mkdir($folder."/files");
            rrmdir($folder."/unzipped");
            mkdir($folder."/unzipped");
            //chmod($folder."/unzipped",0777);
        }
        for ($i=0;$i<sizeof($_FILES["files"]["name"]);$i++)
        {
            $original_name=$_FILES["files"]["name"][$i];
            $tmp_name=$_FILES["files"]["tmp_name"][$i];
            $new_name=$original_name.".".date("Y-m-d-H_i_s");
            move_uploaded_file($tmp_name,$folder."/files/".$new_name);
            $unzipped_path= cls_unpack_docx::unpack($folder."/files/$new_name",$folder."/unzipped");
        }
        ServerResponse::respond("info","Extracted to $unzipped_path");
        /*$rv=create_tables("bibliografie","tmp_");
        parse_docx($unzipped_path,"bibliografie");*/
    }
    
}

class cls_unpack_docx
{

    public static function unpack($file,$folderTo)
    {
        $zip=new ZipArchive;
        $zip_open=$zip->open($file);
        ServerResponse::info("Otevírám zip soubor: $file");
        if ($zip_open===true)
        {
            $index=$zip->locateName("word/document.xml");
            if ($index!==false)
            {
                $document=$zip->getFromName("word/document.xml");
                $document=str_replace("<w:p>","\n<w:p>",$document);
                mkdir($folderTo."/".basename($file));
                ServerResponse::info($folderTo."/".basename($file));
                $unziped_folder_path=$folderTo."/".basename($file);
                $unzipped_path=$unziped_folder_path."/document.xml";
                chmod($unziped_folder_path,0777);
                file_put_contents($unzipped_path,$document);

                if (file_exists($unzipped_path))
                {
                    ServerResponse::info('Extrahování souboru ok');
                    chmod($unzipped_path,0777);
                    return $unzipped_path;
                }
                else
                    ServerResponse::respond("error","Extrahování souboru se nezdařilo");
            }
            else
                ServerResponse::respond("error",'$index==false, soubor document.xml v archivu nenalezen');
        }
        else
            ServerResponse::respond("error",'Selhalo otevření archivu ' .$file. " Chyba: $zip_open");
    }
}

class cls_extract_data
{
/*
 *  třída zajišťující samotnou extrakci dat z XML souboru extrahovaného z Wordu
 */
    private static $sine_sig_counter=0;
    public static function create_tables($type,$tmp="")
    {
        if ($tmp===false)
            $tmp="";
        else if ($tmp===true)
            $tmp="tmp_";
        
	if ($type=="manuscripts")
	{
            dbCon::query("drop table if exists ".$tmp."skupiny_rkp");
            dbCon::query("drop table if exists ".$tmp."rukopisy");
            dbCon::query("drop table if exists ".$tmp."zaznamy");

            dbCon::query("create table ".$tmp."skupiny_rkp (id int auto_increment primary key, nazev varchar(1000), misto varchar(250))");
            dbCon::query("create table ".$tmp."rukopisy (id int auto_increment primary key, nazev varchar(1000), "
                    . "signatura varchar(50), popis varchar(1000),misto_vzniku varchar(500), "
                    . "obdobi varchar(250),skupina int,url varchar(1000), pozn varchar(10))");
            dbCon::query("create table ".$tmp."zaznamy (id int auto_increment primary key, nazev varchar(10000), rkp_signatura varchar(250), pozn varchar(10))");
	}
	else
	{
            dbCon::query("drop table if exists ".$tmp."bibliografie");

            dbCon::query("create table ".$tmp."bibliografie (h1 varchar(500),h2 varchar (500),h3 varchar(500),zaznam varchar(2000))");
	}
    }

    public static function insert_into_db($type,$data,$tmp="")
    {
        $db="";
	ServerResponse::info("Vkládám data do databáze ".$tmp);
	if ($type=="manuscripts")
	{
                
		$query=$data;
		$rv=dbCon::query($query);
		if ($rv==true)
			ServerResponse::info("úspěšně");
		else
			ServerResponse::error("neúspěšně");

		$rv=dbCon::query("select count(*) as count from $tmp;");

		$row=$rv->fetch_assoc();
		ServerResponse::info($row["count"]. " záznamů");
	}
	else
	{
		$query="insert into ".$tmp."bibliografie values ".$data;

		$fh=fopen("insert.sql","w");
		fputs($fh,$query);
		ServerResponse::info("Vygenerovaný SQL dotaz uložen do souboru insert.sql");

		$rv=dbCon::query($query);
		if ($rv==true)
			ServerResponse::info("úspěšně");
		else
			ServerResponse::error("neúspěšně");
		dbCon::query("delete from ".$tmp."bibliografie where zaznam=''");

		$rv=dbCon::query("select count(*) as count from tmp_bibliografie;");
		$row=$rv->fetch_assoc();
		ServerResponse::info($row["count"]. " záznamů");
	}

    }

    public static function process($folder)
    {
        ServerResponse::open_log("log");
        self::create_tables($folder,"tmp_");
        $files=scandir($folder."/unzipped");
        foreach ($files as $f)
        {
            ServerResponse::info("Zpracovávám dokument $folder/unzipped/$f");
            if ($f!="." && $f!="..")
                self::parse_docx($folder."/unzipped/".$f."/document.xml",$folder,$f);
        }
    }

    public static function parse_docx($xmlfile,$type="",$orig_filename)
    {
        global $id_skupiny;
        ServerResponse::info("parsing $xmlfile");

                
        if (file_exists($xmlfile)==false)
            ServerResponse::respond ("error","Nenalezen výchozí XML soubor $xmlfile");

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
        $xsl_doc_path="xslt/word_transform_".$type.".xsl";
	$xsl_doc->load($xsl_doc_path);
        if ($xsl_doc==false)
            ServerResponse::respond("error","Nepodařilo se nahrát XSLT soubor: $xsl_doc_path");
	//$xsl_doc->load("word_transform_bibliografie.xsl");

	$xml_doc = new DOMDocument();
	$xml_doc->load($xmlfile);

	if ($xml_doc==false || $xsl_doc==false)
	{
		ServerResponse::respond("error","Nepodařilo se nahrát XML","error");
	}
        
        /*  XSLT transformace udělá jenom část práce, dostat to skrze XSL do SQL 
         *  je spíš iluzorní, takže se to poté ještě znovu projde a zpracuje v php
         */
	$proc = new XSLTProcessor();
	$proc->registerPHPFunctions();
	$proc->importStylesheet($xsl_doc);
	$newdom = $proc->transformToDoc($xml_doc);


	$rv=$newdom->saveXML();
        
        if (file_exists("log")==false)
        {
            mkdir("log");
            chmod("log",0777);
        }
        
	$fh=fopen("log/$orig_filename.post_transform","w");
	fputs($fh,$rv);
	fclose($fh);

	if ($type=="manuscripts")
	{
		$sql_skupiny_head="insert into tmp_skupiny_rkp (nazev, misto) values \n";
		$sql_skupiny=[];
		$sql_rkp_head="insert into tmp_rukopisy (nazev,signatura,popis,misto_vzniku,obdobi,skupina,url,pozn) values \n";
		$sql_rkp=[];
		$sql_rkp_row="";
		#$sql_rkp_del=
		$sql_zaznam_head="insert into tmp_zaznamy (nazev,rkp_signatura,pozn) values \n";
		$sql_zaznam=[];
		$lines=explode("\n",$rv);
		$signatura="";
		$last="";
		$counter=0;
		$R_to_be_closed=false;
                
                //zde se zpracovává výsledek XSL transformace
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
					$sql_rkp=array("''","''","''","''","''","''","''","''");

					$j=$i;
					$l=$next_l($lines,$i);
					if ($l=="{nejisté umístění}")
						$sql_rkp[7]="'N'";
					else
						$i=$j;

					$l=$next_l($lines,$i);
					$sql_rkp[0]="'$l'";

				}
				else if ($l=="URL:" && $last=="R")
				{
					$l=$next_l($lines,$i);
					$sql_rkp[6]="'$l'";
				}
				else if ($l=="SIGNATURA:" && $last=="R")
				{
					//$l=trim($lines[++$i]);
					$l=$next_l($lines,$i);
                                        //?delendum$sql_rkp_row.='"'.$l.'",';
                                        if ($l=="sine sig.")//rukopis bez signatury
                                        {
                                            self::$sine_sig_counter++;
                                            $l="(sine sig.{".self::$sine_sig_counter."})";
                                        }
					
					$signatura=$l;
                                        $signatura="{".$id_skupiny."}".$signatura;
                                        $sql_rkp[1]="'$signatura'";
				}
				else if ($l=="POPIS:" && $last=="R")
				{
					//$l=trim($lines[++$i]);
					$l=$next_l($lines,$i);
					//?delendum$sql_rkp_row.='"'.$l.'",';
					$sql_rkp[2]="'$l'";

                                        /*  datace - není to tak jednoduché: první segment je místo vzniku
                                         *  které má někdy podobu: Německo (Norimberk, Augsburg), tedy dělelní 
                                         *  podle čárek nelze jednoduše použít.
                                         *  Ale místo vzniku chceme (nově) také extrahovat, tedy budeme postupovat jinak
                                         */ 
                                        
                                        $segm=[];
                                        $p=0;
                                        $br_count=0;//počet otevřených závorek
                                        
					for ($k=0;$k<strlen($l);$k++)
                                        {
                                            if ( preg_match("/[[({]/",$l[$k])!==0)
                                                $br_count++;
                                            else if ( preg_match("/[\]})]/",$l[$k])!==0)
                                                $br_count--;
                                            
                                            
                                            if (($l[$k]=="," ||$k==strlen($l)-1) && $br_count==0)
                                            {
                                                if ($k==strlen($l)-1)
                                                {// musíme ošetřit poslední segment (dataci) v případech, kdy delší popis chybí (např. Čechy, XIV)
                                                    $k++;
                                                }
                                                $ac_segm=trim(substr($l, $p, $k - $p ));
                                                $segm[]= $ac_segm;
                                                $p=$k+1;
                                            }
                                        }
                                        $misto=[];
                                        $datace="";
                                        $lands=explode(" ",
                                                "Europe Czech German France Italy Austria Spain Poland Hungary Switzerland Netherland Silesia");
                                        foreach ($segm as $s)
                                        {
                                            foreach ($lands as $land)
                                            {
                                                if (strstr($s,$land)!=false)
                                                {
                                                    $misto[]=$s;
                                                    continue 2;
                                                }
                                            }
                                            
                                            
                                            if (preg_match("/(\s*I?X[IV]+)|(\s*1[0-9]{3}|\s*[789][0-9]{2})/",$s)==1 
                                                    && strstr($segm[0],"fragment")==false && $datace=="")
                                            {
                                                $datace=$s;
                                            }
                                        }
                                        if (sizeof($misto)==0)
                                            $misto[]="?";
                                        $misto_str=implode(", ",$misto);
                                        $sql_rkp[3]="'".$misto_str."'";
					$sql_rkp[4]="'$datace'";
					$sql_rkp[5]="'$id_skupiny'";

					//delendum?$sql_rkp_row.='"'.$datace.'",'.$id_skupiny.')';

				}
				else if ($l=="ZÁZNAM:" && $last=="R")
				{
					if ($R_to_be_closed==true)
					{/*máme všechny řádky k popisu rukopisu,
                                          *které potřebujeme (odkaz totiž je na samostatném řádku!)
                                          * a tak uzavřeme sql pro rukopis 
                                          */
						$sql_rkp_lines[]="(".implode(",",$sql_rkp).")";
						$R_to_be_closed=false;
					}
                                        $flags="";
					//$l=trim($lines[++$i]);
					$l=$next_l($lines,$i);
                                        if ($l=="{inkunábule}")
                                            $flags.="i";
					$sql_zaznam[]='("'.replace_quotes($l).'","'.$signatura.'","'.$flags.'")';
				}

				else if ($l=="SKUPINA:")
				{
					$last="S";
					$id_skupiny++;
					//$l=trim($lines[++$i]);
					$l=$next_l($lines,$i);
					$sql_skupiny[]='("'.$l.'","")';
				}
			}
		}
                //echo '$sql_rkp_lines:' .$sql_rkp_lines;
		$sql_rkp=$sql_rkp_head . implode(",\n",$sql_rkp_lines);
		$sql_zaznam=$sql_zaznam_head . implode(",\n",$sql_zaznam);
		$sql_skupiny=$sql_skupiny_head . implode(",\n",$sql_skupiny);
		//echo $sql_rkp;
		//die();
                
        $fh=fopen("log/$orig_filename.sql","w");
	fputs($fh,$sql_rkp);
	fclose($fh);
                
		self::insert_into_db($type,$sql_skupiny,"tmp_skupiny_rkp");
		self::insert_into_db($type,$sql_rkp,"tmp_rukopisy");
		self::insert_into_db($type,$sql_zaznam,"tmp_zaznamy");
		#return Array($sql_skupiny,$sql_rkp,$sql_zaznam);
	}
	else//bibliografie
	{
            self::create_tables($type,"tmp_");
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

            ServerResponse::info("XSL transformace úspěšná");



            self::insert_into_db($type,$rv,"tmp_");
	}
	
    }

}
class cls_tmp_to_def
{
    public static function manuscripts()
    {
        dbCon::query("drop tables if exists rukopisy, skupiny_rkp, zaznamy;");
        dbCon::query("create table rukopisy as select * from tmp_rukopisy;");
        dbCon::query("create table skupiny_rkp as select * from tmp_skupiny_rkp;");
        dbCon::query("create table zaznamy as select * from tmp_zaznamy;");
    }
    public static function bibliography()
    {
        dbCon::query("drop table if exists bibliografie;");
        dbCon::query("create table bibliografie as select * from tmp_bibliografie;");
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
    global $sine_sig_counter;
    $t="";
    for ($i=0;$i<sizeof($text);$i++)
    {
            $t.=$text[$i]->textContent;
    }
    preg_match("/.*,([^,(]+)/",$t,$m);
    if ($m[1]=="")//signatura chybí! Viz. např. "Neukirchen soupis ink" -> "inkunábule s neznámým místem uložení"
        return "sine sig.";
    else
        return $m[1];
}

function rrmdir($src)
    {
        $dir = opendir($src);
        while(false !== ( $file = readdir($dir)) ) 
        {
            if (( $file != '.' ) && ( $file != '..' )) 
            {
                $full = $src . '/' . $file;
                if ( is_dir($full) ) 
                {
                    rrmdir($full);
                }
                else 
                {
                    unlink($full);
                }
            }
        }
        closedir($dir);
        rmdir($src);
    }

#export to server bibliografie
#export delete_file(delete_file) to biblio 
#export POST upload_file(data) ?x=12

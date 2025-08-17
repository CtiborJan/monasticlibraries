<?php
function make_files_table($folder)
{
	$files=list_files($folder);
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
function list_bibliography($tmp)
{
	$rv='<list-box name="lst_tmp">';
	$rv.=write_out_bibl($tmp);
	$rv.="</list-box>";
	return $rv;
}
function list_manuscripts($tmp)
{
	$rv="<multi-page name='mlp2'>";
	$rv.="<div page_caption='Skupiny rukopisů' page_name='grp'><list-box>".write_out_mns_groups($tmp)."</list-box></div>";
	$rv.="<div page_caption='Rukopisy' page_name='manuscripts'><list-box>".write_out_mns($tmp)."</list-box></div>";
	$rv.="<div page_caption='Záznamy' page_name='entries'><list-box>".write_out_all($tmp)."</list-box></div>";
	$rv.="</multi-page>";
	return $rv;
}

function list_files($folder,$filters=null)
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
?>

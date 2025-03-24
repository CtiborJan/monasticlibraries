<?php
include "../php/incl/show_errors.incl";
/* 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Scripting/EmptyPHP.php to edit this template
 */

phpDeploy::download_repository("BasicWebComponents","https://github.com/CtiborJan/BasicWebComponents/archive/refs/heads/main.zip");

class phpDeploy
{
    public static function download_repository($reponame,$url)
    {
        echo "Stahuji z $url";
        $root_path="download/$reponame";
        if (is_dir("download")==false)
        {
            mkdir("download",0777);
            chmod("download", 0777);            
        }
        unlink($root_path);
        mkdir($root_path);
        chmod($root_path,0777);
        
        file_put_contents("download/$reponame.zip", file_get_contents($url));

        $zip=new ZipArchive();
        if ($zip->open("$root_path.zip"))
        {
            $zip->extractTo("download");
            $zip->close();
            
        }
        
        $root_content=scandir($root_path);
        foreach ($root_content as $file)
        {
            $path=$root_path."/".$file;
            if ($file!=".." && $file!=".")
            {
                if (is_dir($path) && sizeof($root_content)==3)//1=., 2=.. - je-li ve složka jediná další složka, pak se rootem stává ona, vznikla extrakcí zipu)
                    $root_path=$path;
            }
        }
        
                        $dest_root="../js/Controls";
        
        self::copy_out_repository($root_path, $dest_root,$opt);
    }
    public static function copy_out_repository($source_root,$dest_root,$opt)
    {
        self::copy_directory_recursive($source_root, $dest_root);
    }
    private static function copy_directory_recursive($source,$dest)
    {
        $contents=scandir($source);
        foreach ($contents as $file)
        {
            preg_match("/\.([^.]+)$/", $file, $matches);
            $file_type=$matches[1];
                        
            $path_source=$source."/".$file;
            $path_dest=$dest."/".$file;
            
            if ($file!="." && $file!="..")
            {
                if (is_dir($path_source))
                {
                    if (is_dir($path_dest)==false)
                    {
                        mkdir ($path_dest, 0777);
                        chmod($path_dest,0777);                
                    }
                    self::copy_directory_recursive($path, $dest);
                }
                else 
                {
                    copy ($path_source, $path_dest);
                    
                }
            }
        }
    }
    private static function write_deploy_message($file,$type)
    {
        $phplike=["php","inlc","inc","js","ts","class","java"];
        $pythonlike=["py"];
        $xquerieslike=["xq","xqm"];
        
        $comment_start="//";
        $comment_end="";
        
        $massage=$comment_start." Downloaded and deployed by phpdeploy on ".time()." ".$comment_end."\n";
        
        $flines=[$message,...file($file)];
        
        
        $fh=fopen($file);
        
        
    }
}

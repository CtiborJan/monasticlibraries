<?php
include_once "bibliography.model.php";
include_once "Admin.class.php";
class ctrl_admin_manuscripts extends cls_admin
{
    /**
     * #[route(/admin/manuscripts)] 
     */
    public static function main()
    {
        $temp["files_list_box"]=self::make_files_table("manuscripts/files");
        $temp["tmp_data"]=self::list_manuscripts(true);
        $temp["real_data"]=self::list_manuscripts(false);
        include "../templates/admin.html";
    }
     /**
     * #[route(/admin/manuscripts/delete)
     * #[route(/admin/manuscripts/delete_all) 
     */
    public static function delete()
    {
        $names=isset($_REQUEST["file"]) ? explode(";",$_REQUEST["file"]) : null;
        cls_upload::delete_file("manuscripts",$names);
    }
    
    /**
     * #[route(/admin/manuscripts/upload/) 
     */
    public static function upload()
    {
        cls_upload::upload_files("manuscripts");
    }
    /**
     * #[route(/admin/manuscripts/process/) 
     */
    public static function process()
    {
        cls_extract_data::process("manuscripts");
        ServerResponse::respond("info");
    }
    /**
     * #[route(/admin/manuscripts/tmp_to_def/) 
     */
    public static function tmp_to_def()
    {
        cls_tmp_to_def::manuscripts();
    }
    /**
     * #[route(/admin/manuscripts/test/) 
     */
    public static function test()
    {
        unlink("manuscripts/unzipped/Karlov_Soupis_ink_ZKRACENY_S_PERMALINKY.docx/document.xml");
        rmdir("manuscripts/unzipped/Karlov_Soupis_ink_ZKRACENY_S_PERMALINKY.docx");
        $unzipped_path= cls_unpack_docx::unpack("manuscripts/files/Karlov_Soupis_ink_ZKRACENY_S_PERMALINKY.docx","manuscripts/unzipped");
        cls_extract_data::parse_docx("manuscripts/unzipped/Karlov_Soupis_ink_ZKRACENY_S_PERMALINKY.docx/document.xml","manuscripts","");
    }
}
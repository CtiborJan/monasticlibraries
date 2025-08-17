<?php
include_once "bibliography.model.php";
include_once "Admin.class.php";
class ctrl_admin_bibliography extends cls_admin
{
    
    /**
     * #[route(/admin/bibliography/) 
     */
    public static function main()
    {
        $temp["files_list_box"]=self::make_files_table("bibliography/files");
        $temp["tmp_data"]=self::list_bibliography(true);
        $temp["real_data"]=self::list_bibliography(false);
        include "../templates/admin.html";
    }
    /**
     * #[route(/admin/bibliography/delete) 
     * #[route(/admin/bibliography/delete_all) 
     */
    public static function delete()
    {
        $names=isset($_REQUEST["file"]) ? explode(";",$_REQUEST["file"]) : null;
        cls_upload::delete_file("bibliography",$names);
    }
    
    /**
     * #[route(/admin/bibliography/upload) 
     */
    public static function upload()
    {
        cls_upload::upload_files("bibliography");
    }
    /**
     * #[route(/admin/bibliography/process) 
     */
    public static function process()
    {
        cls_extract_data::process("bibliography");
    }
    /**
     * #[route(/admin/bibliography/tmp_to_def/) 
     */
    public static function tmp_to_def()
    {
        cls_tmp_to_def::bibliography();
    }
}
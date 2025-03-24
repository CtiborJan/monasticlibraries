<?php
include_once 'show_errors.incl';
include_once 'manuscripts.model.php';
include_once 'AjaxResponse.class.php';


class ctrl_manuscripts
{
    /**
     * #[route(/manuscripts),route(/manuscripts/collections)] 
     */
    public static function by_collection()
    {
        $table= mod_manuscripts::get_by_groups(false);
        self::include_template($table);
    }
    
    /**
     * #[route(/manuscripts/place)]
     */
    public static function by_place_of_origin()
    {
        $table= mod_manuscripts::get_by_groups(false);
        self::include_template($table);
    }
    
    
    /**
     * #[route(/manuscripts/all_manuscripts)]
     */
    public static function all_manuscripts()
    {
        $table= mod_manuscripts::get_mns(false);
        self::include_template($table);
    }
    private static function include_template($table)
    {
        ob_start();
        $templateContent=$table;
        include "../templates/manuscripts/content.html";
        $templateContent= ob_get_clean();
        include "../templates/main.html";
        
    }
}


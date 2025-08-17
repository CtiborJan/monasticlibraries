<?php
include_once "bibliography.model.php";
include_once "AjaxResponse.class.php";
class ctrl_bibliography
{
        /** #[route(/bibliography),route(/bibliography/order) */
	public static function by_order()
	{
            $table= mod_bibliography::get_by_orders(false);
            self::include_template($table);
	}
        /** #[route(/api/bibliography/orders) */
	public static function orders_api()
	{
            $table= mod_bibliography::get_by_orders(false);
            echo $table;
	}
        
        /** #[route(/api/bibliography/order/{order}) */
	public static function order_api()
	{
            $table= mod_bibliography::get_order($order);
            echo $table;
	}
        
         /** #[route(/bibliography/all) */
        public static function all()
	{
            $table= mod_bibliography::get_all(false);
            self::include_template($table);
            
	}
        private static function include_template($table)
        {
            ob_start();
            $templateContent=$table;
            include "../templates/bibliography/content.html";
            $templateContent= ob_get_clean();
            
            include "../templates/main.html";
        }
    
}
	

<?php
/**  ahoj */
class ctrl_staticPages
{
        /** #[route(/people)]*/
	public static function people()
	{
            ob_start();
            require "../templates/static/people.html";
            $templateContent=ob_get_clean();
            
            $pageTitle="Monastic libraries - People";
            include "../templates/main.html";
	} 
        
        /** #[route(/about), route(/home), route(/)]*/
        public static function about()
	{
            
            ob_start();
            require "../templates/static/about.html";
            $templateContent=ob_get_clean();
            
            $pageTitle="Monastic libraries - about";
            include "../templates/main.html";
	}
}
?>

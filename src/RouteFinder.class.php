<?php

class cls_RouteFinder 
{
    public static function getControllers($path)
    {
        $controllers=[];
        $files=scandir($path);
        foreach ($files as $file)
        {
            if (preg_match("/\.ctrl\.php$/",$file)==1)
            {
                $controllers[]="$path/$file";
            }
        }      
        return $controllers;
    }
    public static function getRoutes($path=".")
    {
        $routes=[];
        if ($path=="")
            $path=".";
        $controllers=self::getControllers($path);
        foreach ($controllers as $c)
        {
            include_once($c);
        }
        
        $classes=get_declared_classes();

        foreach (
            array_filter($classes,
                function($cl){return str_starts_with($cl, "ctrl_");})
            as $c)
        {
            $clsRefl=new ReflectionClass($c);
            $methods=$clsRefl->getMethods();
            foreach ($methods as $m)
            {
                $metRefl=new ReflectionMethod($c."::".$m->name);
                $docCom=$metRefl->getDocComment();
                if (preg_match_all("/route\((.*?)\)/", $docCom, $matches)>=1)
                {
                    
                    foreach ($matches[1] as $m)
                        $routes[]=[$m,$clsRefl,$metRefl];
                }       
            }  
        }
        return $routes;
    }
    public static function getMethodForRoute($route,$classes_path=".")
    {
        $rv=[];
        $routes=self::getRoutes($classes_path);
        foreach ($routes as $r)
        {
            if ($route==$r[0])
            {
                $rv[]=$r;
            }
        }
        return $rv;
    }
}

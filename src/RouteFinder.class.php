<?php
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ERROR);
class cls_RouteFinder 
{
    public static function getControllers($path)
    {
        
        /*
         * find all controllers in path - files matching *.ctr.php
         */
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
        /*
         * find all defined routes in controllers (files matching "*.ctrl.php" in $path)
         * Using reflection on classes and then their methods
         */
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
                function($cl){return substr($cl,0,5)== "ctrl_";})
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
        
        $clean_array=function($a)
        {
          for ($i = sizeof($a)-1;$i>=0;$i--)
            if ($a[$i]=="")
                array_splice ($a, $i,1);
          
          return $a;
        };
        $equals_route_part=function($ctrl,$real,&$rv)
        {
            
            if (preg_match("#.*\{.*?\}.*#",$ctrl)==false)
            {
                return $ctrl==$real;
            }
            else
            {
                #var_dump($ctrl,$real);
                
                preg_match_all("#\{(.*?\}#",$ctrl,$ids);
                $pattern=preg_replace("#\{(.*?)\}#","(?<$1>.*)",$ctrl);
                #var_dump($pattern,$real);
                if (preg_match("#^".$pattern."$#",$real,$matches)!=false)
                {
                    #var_dump($matches);
                    foreach (array_keys($matches) as $k)
                    {
                        if (preg_match("#^[0-9]$#",$k)==false)
                            $rv[]=[$k,$matches[$k]];
                    }
                    return true;
                }
                else
                {
                    return false;
                }
                        
            }
                    
        };
        
        $rv=[];
        
        $routes=self::getRoutes($classes_path);
        
        
        $real_route_parts= $clean_array(preg_split("&/&",$route));
        
        #echo '$real_route_parts';
        #var_dump($real_route_parts);
        #echo "<";
        foreach ($routes as $r)
        {
            #echo "$r[0] ><br/>";
            #var_dump($r);
            
            $ctrl_route_parts= $clean_array(preg_split("&/&", $r[0]));
            $url_variables=[];
            
            if (sizeof($ctrl_route_parts)== sizeof($real_route_parts))
            {
                #echo "Počet odpovídá<br/>";
               
                #var_dump($ctrl_route_parts,$route);
                $corresponds=true;
                for($i=0;$i<sizeof($real_route_parts);$i++)
                {
                    if ($equals_route_part($ctrl_route_parts[$i],$real_route_parts[$i],$url_variables)==false)
                    {
                        //pokud si části neodpovídají, přeskočíme zbytek cyklu   
                        $corresponds=false;
                        continue;
                    }   
                }
                if ($corresponds==true)//pokud všechny části odpovídají, přidáme k výsledkům
                    $rv[]=[$r,$url_variables]; 
            }
            else
                continue;
            
        }
        #var_dump($rv);
        return $rv;
    }
}

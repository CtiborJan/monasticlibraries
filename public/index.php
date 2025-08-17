<?php
/*
 *  Starting point for application. All traffic (except for admin) is redirected to this script.
 *  This script then finds among the application controllers (in the src folder )
 *  the route for give REQUEST_URI and launches it.
 */

include "../src/show_errors.incl";

include "../src/RouteFinder.class.php";

preg_match("#monasticlibraries([^?]*)#",$_SERVER["REQUEST_URI"],$matches);
$route= preg_replace("#(.*)\/$#", "$1", $matches[1]);
if ($route=="")
    $route="/";


/*
 * routeController=pole polí. První index jsou jednotlivé odpovídající routes, kde každá pak má:
 * [0][0]: string route
 * [0][1]: reflection třídy
 * [0][2]: reflection metody
 * [1][...]: pole parametrů získaných z url (/část_url/{parametr}...): [0]=jméno parametru, [1] hodnota
 */

$routeController= cls_RouteFinder::getMethodForRoute($route, "../src");

if ($routeController!=null)
{
 #   echo "RESULT<br/>";
#    var_dump($routeController);
    #die();
    $i=0;
    if (sizeof($routeController)==1)
    {
        $params=[];
        foreach ($routeController[$i][1] as $p)
            $params[]=$p[1];
        $controllerClass=$routeController[$i][0][2]->invokeArgs(null,$params);
    }
}
else
{
    echo "Route not found: " .$route;
}

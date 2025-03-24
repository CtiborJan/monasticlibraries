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

$routeController= cls_RouteFinder::getMethodForRoute($route, "../src");

if ($routeController!=null)
{
    if (sizeof($routeController)==1)
        $controllerClass=$routeController[0][2]->invokeArgs(null,$_REQUEST);
}
else
{
    echo "Route not found: " .$route;
}

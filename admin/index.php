<?php
include "../src/show_errors.incl";
include "../src/RouteFinder.class.php";

preg_match("#monasticlibraries(\/admin\/?[^?]*)#",$_SERVER["REQUEST_URI"],$matches);
$route=strtolower($matches[1]);
if ($route=="/admin" || $route=="/admin/")
{
	?>
<html>
    <head>
        <title>Monastic Libraries ADMIN</title>
    </head>
    <body>
        <p>Co chcete spravovat?</p>
        <ul>
        <li><a href="bibliography">Bibliograifi</a></li>
        <li><a href="manuscripts">Rukopisy</a></li>
        </ul>
    </body>
</html>
        <?php
}
else 
{
    $routeController= cls_RouteFinder::getMethodForRoute($route, "../src");

    if ($routeController!=null)
    {
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
        echo "Admin route not found: " .$route;
    }

}

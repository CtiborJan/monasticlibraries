<?php
include "../src/incl/show_errors.incl";

preg_match("#monasticlibraries\/admin\/([^/?]*)#",$_SERVER["REQUEST_URI"],$matches);

$page_name=strtolower($matches[1]);
if ($page_name=="")
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
        die();
}
if (file_exists("../src/admin_$page_name.ctrl.php"))
	include "../src/admin_".$page_name.".ctrl.php";
else
{
	#var_dump($_SERVER);
	#var_dump($_REQUEST);
	header('HTTP/1.0 404 Not Found');
	echo "Stránka nenalezena.";
	die;
}	
$controllerClass="ctrl_admin_".$page_name;

include "../templates/admin.html";

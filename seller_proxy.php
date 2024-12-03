<?php
header('Access-Control-Allow-Origin: *');
$sellerId = $_GET['seller'];
$url = "https://www.amazon.com/sp?seller=" . urlencode($sellerId);
echo file_get_contents($url);
?> 
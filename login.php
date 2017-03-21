<?php
require 'PasswordHash.php';

$hasher = new PasswordHash(8, FALSE);

$info = json_decode($_POST["info"]);

$hash = $hasher->HashPassword($info->password);

echo $hash;

 ?>

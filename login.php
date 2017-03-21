<?php
require 'PasswordHash.php';

$hasher = new PasswordHash(8, FALSE);

$info = $_POST["info"];

$hash = $hasher->HashPassword($info->password);

echo $hash . "   " . $info->password;

 ?>

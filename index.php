<?php
	require('sounds.php');
	function quote($elt) {
		return "'$elt'";
	}
	function array_to_js_object($arr) {
		$newArr = array();
		foreach ($arr as $key => $value) {
			array_push($newArr, "$key: '$value'");
		}
		return '{'.implode(', ', $newArr).'}';
	}
    
    // https://stackoverflow.com/questions/13640109/how-to-prevent-browser-cache-for-php-site
    // https://stackoverflow.com/questions/7413234/how-to-prevent-caching-of-my-javascript-file
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
    header("Cache-Control: post-check=0, pre-check=0", false);
    header("Pragma: no-cache");
?>
<!DOCTYPE html>
<html>
<head>
<title>Star Match</title>
<link rel='icon' href='Images/icon.png'>
<script>
	const sounds = <?= array_to_js_object($sounds) ?>;
	const music = <?= array_to_js_object($music) ?>;
</script>
<script src='script/lib/pSBC.js?nocache=<?= uniqid(); ?>'></script>
<script src='script/levels.js?nocache=<?= uniqid(); ?>'></script>
<script src='script/mouse.js?nocache=<?= uniqid(); ?>'></script>
<script src='script/controls.js?nocache=<?= uniqid(); ?>'></script>
<script src='script/sounds.js?nocache=<?= uniqid(); ?>'></script>
<script src='script/game.js?nocache=<?= uniqid(); ?>'></script>
<script src='script/functions.js?nocache=<?= uniqid(); ?>'></script>
<script src='script/effects.js?nocache=<?= uniqid(); ?>'></script>
<script src='script/polys.js?nochache=<?= uniqid(); ?>'></script>
<script src='script/grid.js?nocache=<?= uniqid(); ?>'></script>
<script src='script/animator.js?nocache=<?= uniqid(); ?>'></script>
<script src='script/screens.js?nocache=<?= uniqid(); ?>'></script>
<script src='script/gamepad.js?nocache=<?= uniqid(); ?>'></script>
<script src='script/background.js?nocache=<?= uniqid(); ?>'></script>
<script src='script/main.js?nocache=<?= uniqid(); ?>'></script>
<link rel='stylesheet' href='style/game.css?nocache=<?= uniqid(); ?>'>
</head>
<body>
<div style='text-align: center;'>
<canvas style='margin: 0 auto;' id='game' width='1040' height='640'></canvas>
</div>
<p><Strong>Gamepad Instructions</strong></p>
<p>Arrows: move, A: toggle move selected, B: freeze/unfreeze, X: Blast, Y: unfreeze all, LB/RB: favor side on hex board, LB+RB tectonic activity now!, Start: menu and new game (title screen).</p>
<p>No gamepad controls in menu yet.</p>
<a href='#' id='hideUnhide' style='color: #ddd;'>Show sound interface</a>
<div id='soundsDiv' style='display: none;'>
	<p><strong>Sounds</strong></p>
<?php
	foreach ($sounds as $sound => $default) {
?>
	<label for='<?= $sound ?>Sound'><?= $sound ?></label>
	<input type='file' id='<?= $sound ?>Sound'>
	<span id='<?= $sound ?>SoundSpan'></span>
	<br>
<?php
	}
?>
	<p><strong>Music</strong></p>
<?php
	foreach ($music as $piece => $default) {
?>
	<label for='<?= $piece ?>Sound'><?= $piece ?></label>
	<input type='file' id='<?= $piece ?>Sound'>
	<span id='<?= $piece ?>SoundSpan'></span>
	<br>
<?php
	}
?>
</div>
<div id='hidden' style='visibility: hidden;'>
	<div class='a'>Hello</div>
	<div class='b'>Playing around</div>
	<div class='c'>With getting fonts to load</div>
</div>
</body>
</html>

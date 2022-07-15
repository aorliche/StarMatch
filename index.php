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
<canvas style='margin: 0 auto;' id='game' width='1280' height='720'></canvas>
</div>
<div>
<a href='#' id='hideUnhide' style='color: #ddd;'>Hide/Reveal Interface</a>
</div>
<div style='float: left; margin-left: 20px; display: none;'>
	<p>Score: <span id='score'>0</span></p>
	<select id='type' name='type'>
		<option value='hex'>Hexagons</option>
		<option value='tri'>Triangles</option>
		<option value='square'>Squares</option>
	</select>
	<br>
	<br>
	<label for='layers'>Number of layers:</label>
	<br>
	<input id='layers' name='layers' type='range' min='1' max='10' step='1' value='5' class='slider'>
	<span id='layersSpan'>5</span>
	<br>
	<label for='size'>Tile size:</label>
	<br>
	<input id='size' name='size' type='range' min='10' max='100' step='5' value='40' class='slider'>
	<span id='sizeSpan'>40</span>
	<br>
	<label for='angle'>Angle:</label>
	<br>
	<input id='angle' name='angle' type='range' min='0' max='30' step='5' value='30' class='slider'>
	<span id='angleSpan'>30</span>
	<br>
	<label for='angle'>Speed:</label>
	<br>
	<input id='difficulty' name='difficulty' type='range' min='1' max='12' step='1' value='7' class='slider'>
	<span id='difficultySpan'>7</span>
	<br>
	<button id='remake'>Generate</button>
	<br>
	<br>
	<input id='chains' name='chains' type='checkbox'>
	<label for='chains'>Display chains</label>
	<br>
	<br>
	<button id='play'>Play</button>
	<br>
	<br>
	<select id='squareLevel'>
		<option>Square Levels</option>
		<option value='1'>Level 1</option>
		<option value='2'>Level 2</option>
		<option value='3'>Level 3</option>
	</select>
	<br>
	<select id='triLevel'>
		<option>Triangle Levels</option>
		<option value='1'>Level 1</option>
		<option value='2'>Level 2</option>
		<option value='3'>Level 3</option>
	</select>
	<br>
	<select id='hexLevel'>
		<option>Hexagon Levels</option>
		<option value='1'>Level 1</option>
		<option value='2'>Level 2</option>
		<option value='3'>Level 3</option>
	</select>
	<br>
	<br>
	<button id='playLevels'>Play Levels</button>
</div>
<!--<div style='float: left; margin-left: 20px;'>-->
<div id='soundsDiv' style='visibility: hidden;'>
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
	<p><Strong>Gamepad Instructions</strong></p>
	<p>Arrows: move, A: toggle move selected, B: freeze/unfreeze, X: Blast, Y: unfreeze all, LB/RB: favor side on hex board, LB+RB tectonic activity now!, Start: menu and new game (title screen).</p>
	<p>No gamepad controls in menu yet.</p>
</div>
<div id='hidden'>
	<div class='a'>Hello</div>
	<div class='b'>Playing around</div>
	<div class='c'>With getting fonts to load</div>
</div>
</body>
</html>

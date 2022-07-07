const types = ['star', 'sun', 'planet', 'moon', 'atom', 'galaxy'];
const typeColors = ['#1a1a39', '#333200', '#3e151e', '#0a2e25', '#3a1b35', '#01263f'];
const images = [];

let game;

window.addEventListener('load', e => {
	const score = document.querySelector('#score');
	const type = document.querySelector('#type');
	const button = document.querySelector('#remake');
	const layersSlider = document.querySelector('#layers');
	const layersSpan = document.querySelector('#layersSpan');
	const sizeSlider = document.querySelector('#size');
	const sizeSpan = document.querySelector('#sizeSpan');
	const angleSlider = document.querySelector('#angle');
	const angleSpan = document.querySelector('#angleSpan');
	const difficultySlider = document.querySelector('#difficulty');
	const difficultySpan = document.querySelector('#difficultySpan');
	const chainsBox = document.querySelector('#chains');
	const playButton = document.querySelector('#play');
	const squareLevel = document.querySelector('#squareLevel');
	const triLevel = document.querySelector('#triLevel');
	const hexLevel = document.querySelector('#hexLevel');
	const swapTileSound = document.querySelector('#swapTileSound');
	const swapTileSoundSpan = document.querySelector('#swapTileSoundSpan');
	const canvas = document.querySelector('#game');
	const ctx = canvas.getContext('2d');
	//let circles = [];
	
	function setParams() {
		const params = {
			'ptype': type.options[type.selectedIndex].value,
			'size': parseInt(size.value),
			'layers': parseInt(layers.value),
			'angle': parseInt(angleSlider.value)*Math.PI/180
		};
		game.displayChains = chainsBox.checked;
		game.params = params;
	}

	layersSlider.addEventListener('input', e => {
		layersSpan.innerText = layersSlider.value;
	});

	sizeSlider.addEventListener('input', e => {
		sizeSpan.innerText = sizeSlider.value;
	});
	
	angleSlider.addEventListener('input', e => {
		angleSpan.innerText = angleSlider.value;
	});
	
	difficultySlider.addEventListener('input', e => {
		difficultySpan.innerText = difficultySlider.value;
	});

	button.addEventListener('click', e => {
		game.startLevel(1);
	});

	playButton.addEventListener('click', e => {
		/*e.preventDefault();
		if (playButton.innerText == 'Play') {
			initLoops();
			playButton.innerText = 'Stop';
		} else if (playButton.innerText == 'Stop') {
			if (loop) clearInterval(loop);
			if (win) clearInterval(win);
			playButton.innerText = 'Play';
		} else if (playButton.innerText == 'New Game') {
			init();
			initLoops(true);
			playButton.innerText = 'Stop';
		}*/
	});

	chainsBox.addEventListener('change', e => {
		game.displayChains = chainsBox.checked;
		//game.repaint();
	});

	function setValues(layers, size, angle) {
		layersSlider.value = layers;
		layersSpan.innerText = layers;
		sizeSlider.value = size;
		sizeSpan.innerText = size;
		angleSlider.value = angle
		angleSpan.innerText = angle;
	}

	squareLevel.addEventListener('change', e => {
		const lvl = parseInt(e.target.value);
		if (!lvl) return;
		triLevel.selectedIndex = 0;
		hexLevel.selectedIndex = 0;
		if (lvl == 1) setValues(3, 60, 0);
		if (lvl == 2) setValues(4, 60, 0);
		if (lvl == 3) setValues(5, 60, 0);
		type.selectedIndex = 2;
		if (game) {
			setParams();
			game.startLevel((lvl-1)*3+2);
		}
	});
	
	triLevel.addEventListener('change', e => {
		const lvl = parseInt(e.target.value);
		if (!lvl) return;
		squareLevel.selectedIndex = 0;
		hexLevel.selectedIndex = 0;
		if (lvl == 1) setValues(2, 75, 0);
		if (lvl == 2) setValues(3, 75, 0);
		if (lvl == 3) setValues(4, 75, 0);
		type.selectedIndex = 1;
		if (game) {
			setParams();
			game.startLevel((lvl-1)*3+1);
		}
	});
	
	hexLevel.addEventListener('change', e => {
		const lvl = parseInt(e.target.value);
		if (!lvl) return;
		squareLevel.selectedIndex = 0;
		triLevel.selectedIndex = 0;
		if (lvl == 1) setValues(4, 40, 30);
		if (lvl == 2) setValues(5, 40, 30);
		if (lvl == 3) setValues(6, 40, 30);
		type.selectedIndex = 0;
		if (game) {
			setParams();
			game.startLevel((lvl-1)*3+3);
		}
	});

	type.addEventListener('change', e => {
		playButton.innerText = 'Play';
		if (e.target.value == 'hex') {
			setValues(5, 40, 30);
		} else if (e.target.value == 'tri') {
			setValues(2, 65, 0);
		} else if (e.target.value == 'square') {
			setValues(3, 45, 0);
		}
		if (game) {
			setParams();
			game.startLevel(1);
		}
	});

	// Gamepad
	window.addEventListener("gamepadconnected", e => {
		if (game) game.pad = e.gamepad;
		console.log(game.pad);
	});

	window.addEventListener("gamepaddisconnected", e => {
		if (game) game.pad = null;
		console.log(game.pad);
	});	

	function updatePage() {
		const subLvl = Math.floor(game.level/3);
		const select = [triLevel, squareLevel, hexLevel][game.level%3];
		select.selectedIndex = subLvl+1;
		select.dispatchEvent(new Event('change'));
	}

	// Load images
	let numLoaded = 0;
	function loadFn() {
		if (++numLoaded == 6) {
			game = new Game(canvas, updatePage);
			setParams();
			//game.repaint();
			initSounds();
		}
	}

	types.map(t => {
		images[t] = new Image;
		images[t].addEventListener('load', loadFn);
		images[t].src = `Images/${t}.png`;
	});

	triLevel.selectedIndex = 1;
	triLevel.dispatchEvent(new Event('change'));

	const baseUrl = new URL(window.location.href);

	function initSounds() {
		for (const name in {...sounds, ...music}) {
			const input = document.querySelector(`#${name}Sound`);
			const span = document.querySelector(`#${name}SoundSpan`);
			let defUrl = null;
			// Load defaults
			if (name in sounds && sounds[name]) { 
				defUrl = new URL(`/SpaceMatch/Sounds/${sounds[name]}`, baseUrl);
				game.sounds.load(name, defUrl);
			} else if (name in music && music[name]) {
				defUrl = new URL(`/SpaceMatch/Sounds/${music[name]}`, baseUrl);
				game.sounds.loadMusic(name, defUrl);
			}
			// Play
			const play = document.createElement('button');
			play.innerText = 'Play';
			play.addEventListener('click', ee => {
				if (name in sounds) game.sounds.play(name, {nostop: true});
				if (name in music) game.sounds.playMusic(name);
			});
			span.appendChild(play);
			// Stop
			if (name in music) {
				const stop = document.createElement('button');
				stop.innerText = 'Stop';
				stop.addEventListener('click', ee => {
					game.sounds.stopMusic(name);
				});
				span.appendChild(stop);
			}
			// Reset
			if (defUrl) {
				const defText = document.createTextNode(`Default: ${defUrl.pathname}`);
				const reset = document.createElement('button');
				reset.innerText = 'Reset'; 
				reset.addEventListener('click', ee => {
					if (name in sounds) game.sounds.load(name, defUrl);
					if (name in music) game.sounds.loadMusic(name, defUrl);
				});
				span.appendChild(reset);
				span.appendChild(defText);
			} 
			input.addEventListener('change', e => {
				if (input.files[0]) {
					const url = URL.createObjectURL(input.files[0]);
					if (name in sounds) game.sounds.load(name, url, true);
					if (name in music) game.sounds.loadMusic(name, url);
				}
			});
		}
	}

	['click', 'mousemove', 'mouseout', 'mousedown', 'mouseup'].forEach(type => {
		canvas.addEventListener(type, e => {
			if (game) {
				const p = getCursorPosition(canvas, e);
				game[type](p);
				//game.repaint();
			}
		});
	});

	canvas.addEventListener('contextmenu', e => {
		e.preventDefault();
		const p = getCursorPosition(canvas, e);
		if (game) {
			game.rightClick(p);
			//game.repaint();	
			return false;
		}
	});
});

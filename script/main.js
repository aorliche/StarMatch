const types = ['star', 'sun', 'planet', 'moon', 'atom', 'galaxy'];
const astrons = ['star', 'planet', 'pinkmoon', 'moon', 'sun', 'reddwarf']; 
const astronColors = ['#1a1a39', '#3e151e', '#3a1b35', '#0a2e25', '#333200', '#01263f'];
const images = {};
const iceImgs = [], blastImgs = [];

const fontFamily1 = 'Anger Styles';
const fontFamily2 = 'Conthrax';
const fontFamily3 = 'Bahnschrift';

let game;
let deferred = {game: null};

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
	const hideUnhide = document.querySelector('#hideUnhide');
	const soundsDiv = document.querySelector('#soundsDiv');
	//let circles = [];

	hideUnhide.addEventListener('click', e => {
		e.preventDefault();
		if (soundsDiv.vis) {
			soundsDiv.style.visibility = 'hidden';
			soundsDiv.vis = false;
		} else {
			soundsDiv.style.visibility = 'visible';
			soundsDiv.vis = true;
		}
	});
	
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
			game.startLevel((lvl-1)*3+1);
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
			game.startLevel((lvl-1)*3+3);
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
			game.startLevel((lvl-1)*3+2);
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
        function addPad() {
            if (!deferred.game) setTimeout(addPad, 100);
            else {
                deferred.game.pad = e.gamepad;
                console.log(game.pad);
            }
        }
        setTimeout(addPad, 100);
	});

	window.addEventListener("gamepaddisconnected", e => {
		if (game) {
            game.pad = null;
            console.log(game.pad);
        }
	});	

	function updatePage() {
		const subLvl = Math.floor(game.level/3);
		const select = [squareLevel, hexLevel, triLevel][game.level%3];
		select.selectedIndex = subLvl+1;
		select.dispatchEvent(new Event('change'));
	}

	// Load images
	// 6 astrons, 2 assets, 3 ice, 1 blast, 24 astron characters, 2 dragon heads
	let numLoaded = 0;
	function loadFn() {
		if (++numLoaded == 6+2+3+1+24+2) {
			game = new Game(canvas, updatePage);
            deferred.game = game;
			setParams();
			//game.repaint();
			initSounds();
		}
	}

	astrons.forEach(t => {
		images[t] = new Image();
		images[t].addEventListener('load', loadFn);
		images[t].src = `Images/Astrons/${t}.png`;
		
		const ta = `${t}_a`;
		images[ta] = [];
		[0,1,2,3].forEach(i => {
			images[ta].push(new Image());
			images[ta].at(-1).addEventListener('load', loadFn);
			images[ta].at(-1).src = `Images/Astrons/${t}_a${i}.png`;
		});
	});

	['Images/Assets/DragonTitle.png', 'Images/Assets/controller.png', 'Images/Assets/dragonHead.png',
	'Images/Assets/dragonHeadFire.png', 'Images/Assets/DragonHeadFire1.png', 'Images/Assets/DragonHeadFire2.png',
	'Images/Assets/DragonHeadFrost.png', 'Images/Assets/DragonHeadFrost1.png', 'Images/Assets/DragonHeadBlast.png',
	'Images/Assets/DragonHeadBlast1.png', 'Images/Assets/Blast.png', 'Images/Assets/Blast1.png'].forEach(t => {
		const key = basename(t);
		images[key] = new Image();
		images[key].addEventListener('load', loadFn);
		images[key].src = t;
	});

	[0,1,2].forEach(t => {
		const key = `Images/Counters/ice${t}.png`;
		iceImgs.push(new Image());
		iceImgs.at(-1).addEventListener('load', loadFn);
		iceImgs.at(-1).src = key;
	});
	
	[0].forEach(t => {
		const key = `Images/Counters/blast${t}.png`;
		blastImgs.push(new Image());
		blastImgs.at(-1).addEventListener('load', loadFn);
		blastImgs.at(-1).src = key;
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
				defUrl = new URL(`${window.location.pathname}Sounds/${sounds[name]}`, baseUrl);
				game.sounds.load(name, defUrl);
			} else if (name in music && music[name]) {
				defUrl = new URL(`${window.location.pathname}Sounds/${music[name]}`, baseUrl);
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

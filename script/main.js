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
	const canvas = document.querySelector('#game');
	const ctx = canvas.getContext('2d');
	const hideUnhide = document.querySelector('#hideUnhide');
	const soundsDiv = document.querySelector('#soundsDiv');
    
    // Temporary loading screen
    let dotCounter = 0;
    ctx.font = '24px Bahnschrift';
    let text = 'Loading.';
    let measure = ctx.measureText(text);
    function loadingScreen() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = '#fff';
        text = 'Loading' + '.'.repeat((dotCounter++ % 3) + 1);
        ctx.fillText(text, canvas.width/2-measure.text/2, canvas.height/2);
        if (!game) {
            setTimeout(loadingScreen, 500);
        }
    }
    loadingScreen();

	// Gamepad
    // I'm not sure what deferred does exactly
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

	// Load images
    // Game created after all images are loaded
	// 6 astrons, 3 ice counter, 1 blast counter, 24 astron characters, 1 title, 1 controller, 8 dragon heads, 2 blast, 2 frost line
	let numLoaded = 0;
	function loadFn() {
		if (++numLoaded == 6+3+1+24+1+1+8+2+2) {
			game = new Game(canvas);
            deferred.game = game;
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
	'Images/Assets/DragonHeadBlast1.png', 'Images/Assets/Blast.png', 'Images/Assets/Blast1.png', 
	'Images/Assets/Frost.png', 'Images/Assets/Frost1.png'].forEach(t => {
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
    
    // Sounds

	hideUnhide.addEventListener('click', e => {
		e.preventDefault();
		if (soundsDiv.style.display == 'block') {
			soundsDiv.style.display = 'none';
            hideUnhide.innerText = 'Show sound interface';
		} else {
			soundsDiv.style.display = 'block';
            hideUnhide.innerText = 'Hide sound interface';
		}
	});
    
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

	// Mouse inputs

	['click', 'mousemove', 'mouseout', 'mousedown', 'mouseup'].forEach(type => {
		canvas.addEventListener(type, e => {
			if (game) {
				const p = getCursorPosition(canvas, e);
				game[type](p);
			}
		});
	});

	canvas.addEventListener('contextmenu', e => {
		e.preventDefault();
		const p = getCursorPosition(canvas, e);
		if (game) {
			game.rightClick(p);
			return false;
		}
	});
});

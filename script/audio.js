
class Sounds {
	constructor(game) {
		this.game = game;
		this.ctx = new AudioContext();
		this.sounds = {};
		this.music = {};
		this.soundGainNode = new GainNode(this.ctx);
		this.soundGainNode.connect(this.ctx.destination);
		this.updateGain();
	}

	load(name, url, play) {
		fetch(url)
			.then(resp => resp.arrayBuffer())
			.then(buffer => {
				console.log(buffer);
				this.ctx.decodeAudioData(
					buffer, 
					buf => {
						this.sounds[name] = {buf, sources: []};
						if (play) this.play(name);
					},
					e => console.log(`Failed to decode ${name}: ${e.message}`));
			});
	}

	loadMusic(name, url) {
		if (this.music[name]) {
			this.music[name].mediaElement.pause();
			this.music[name].disconnect();
		}
		const audio = new Audio(url);
		this.music[name] = this.ctx.createMediaElementSource(audio);
		this.music[name].mediaElement.volume = 
			get(this.game.menu, 'sliders', 'Music Volume').value;
		this.music[name].connect(this.ctx.destination);
	}

	play(name, opts) {
		const sound = this.sounds[name];
		if (!sound) {
			console.log(`Sound ${name} not loaded`);
			return;
		}
		if (sound.sources.length > 0 && sound.sources[0].loop) return;
		const src = this.ctx.createBufferSource();
		sound.sources.push(src);
		sound.keep = (opts && opts.keep) ?? false;
		sound.loop = (opts && opts.loop) ?? false;
		src.nostop = (opts && opts.nostop) ?? false; // meant to be src
		src.buffer = sound.buf;
		src.connect(this.soundGainNode);
		src.addEventListener('ended', e => {
			if (!sound.loop) {
				sound.sources.splice(sound.sources.indexOf(src), 1);
			}
		});
		src.start();
	}

	playing(name) {
		const sound = this.sounds[name];
		return sound && sound.sources.length > 0;
	}

	playMusic(name) {
		if (!this.music[name]) return;
		for (const n in this.music) {
			if (n != name) {
				this.music[n].mediaElement.stop();
			}
		}
		this.music[name].mediaElement.loop = true;
		this.music[name].mediaElement.play();
	}

	stop(name) {
		const sound = this.sounds[name];
		if (!sound) return;
		sound.loop = false;
		sound.sources.forEach(src => {
			if (!src.nostop) 
				src.stop();
		});
	}

	stopAll() {
		for (const name in this.sounds) {
			if (!this.sounds[name].keep)
				this.stop(name);
		}
	}

	stopLoop(name) {
		const sound = this.sounds[name];
		if (!sound) return;
		sound.loop = false;
	}

	stopMusic(name) {
		if (this.music[name]) {
			this.music[name].mediaElement.pause();
		}
	}

	updateGain() {
		const sg = get(this.game.menu, 'sliders', 'Sound Effects Volume').value;
		const mg = get(this.game.menu, 'sliders', 'Music Volume').value;
		console.log(sg);
		this.soundGainNode.gain.setValueAtTime(sg, this.ctx.currentTime);
		for (const name in this.music) {
			this.music[name].mediaElement.volume = mg;
		}
	}
}

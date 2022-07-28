
class Screen extends Box {
	constructor(game) {
		super({pos: {x: 0, y: 0}, dim: {...game.dim}});
		this.game = game;
	}
}

class MainScreen extends Screen {
	constructor(game) {
		super(game);
		this.astrons = [];
		this.astronCounter = {};
		this.flameTimeout = null;
		this.freezeTimeout = null;
		this.blastTimeout = null;
		this.dragonHeadFire = ['dragonHeadFire', 'DragonHeadFire1', 'DragonHeadFire2'].map(name => images[name]);
		this.dragonHeadFrost = ['DragonHeadFrost', 'DragonHeadFrost1'].map(name => images[name]);
		this.dragonHeadBlast = ['DragonHeadBlast1'].map(name => images[name]);
		this.projectiles = [];

		astrons.forEach(t => {
			const ta = `${t}_a`;
			this.astrons.push(new Astron({type: t, img: images[ta][0], flamed: images[ta], dim: {w: 110, h: 110}, margin: -5}));
		});

		this.astrons[0].margin.top = 20;
		this.astrons.slice(0,3).forEach(a => a.margin.bottom = -15);
		this.astrons.at(-1).margin.bottom = 100;

		const power1 = new VBox({pos: {x: 0, y: 0}, dim: {w: this.dim.w, h: 110}, bgColor: '#241e3c', align: 'center'});
		const power2 = new HBox({margin: {top: 10, bottom: 0, left: 50, right: 0}, align: 'center'});

		power2.add(new Text({name: 'Btext', text: 'Blasts', fontSize: 18, fontFamily: fontFamily3, fontWeight: 'Bold', 
			margin: {left: 10, right: 5, top: 0, bottom: 0}}, this.game.ctx));
		power2.add(new ImageCounter({name: 'Blasts', imgs: blastImgs, max: 5, spacing: 5, count: 1, margin: 5}));
		power2.add(new Text({name: 'Ftext', text: 'Freezes', fontSize: 18, fontFamily: fontFamily3, fontWeight: 'Bold', margin: 5}, this.game.ctx));
		power2.add(new ImageCounter({name: 'Freezes', imgs: iceImgs, max: 5, spacing: 5, count: 1, margin: {left: 5, right: 300, top: 5, bottom: 5}}));

		power1.add(power2);
		power1.add(new Timer({text: 'Tectonic Activity', cb: e => {
				this.game.grid.expandFromBelow();
			}, 
			time: parseInt(this.game.menu.find('Tectonic Activity').value), 
			loop: true, active: false, margin: 20}, this.game.ctx));

		power1.packAll();
		this.add(power1);

		const level1 = new VBox({pos: {x: this.dim.w-240, y: 0}, bgColor: '#241e3c', align: 'center'});
		const level2 = new VBox({align: 'center'});

		const levelC = new TextCounter({name: 'Level', text: "LEVEL ", fontFamily: fontFamily2, fontWeight: 'Bold', fontSize: 28,
			count: 1, dim: {w: 120, h: 40}, margin: {top: 30, bottom: 10, right: 0, left: 0}}, this.game.ctx);
		const speed = new Text({name: 'Speed', text: `Speed ${this.game.menu.speedString}`, dim: {w: 120, h: 20},
			fontFamily: fontFamily3, fontWeight: 'Bold', margin: {top: 5, bottom: 5, left: 0, right: 0}}, this.game.ctx);
		const movesC = new TextCounter({name: 'Moves', text: 'Moves: ', fontWeight: 'Bold', count: 0, dim: {w: 120, h: 20},
			margin: {bottom: 15, top: 0, left: 0, right: 0}}, this.game.ctx);
		const dragon = new ImageControl({name: 'Dragon', img: images['dragonHead'], dim: {w: 150, h: 150}, 
			bgColor: '#736383',
			margin: {top: 50, bottom: this.dim.h, left: 50, right: 50}});

		level2.add(levelC);
		level2.add(speed);
		level2.add(movesC);

		level1.add(level2);
		level1.add(dragon);

		level1.packAll();
		this.add(level1);

		const buttons1 = new VBox({pos: {x: 0, y: 0}, bgColor: '#241e3c', align: 'center'});
		
		buttons1.add(new Button({text: 'Menu', dim: {w: 220, h: 40},
			color: '#9954b6', hoverColor: '#c691e5', margin: {top: 20, bottom: -10, left: 0, right: 0}, 
			cb: e => {
				this.game.showMenu();
			}, fontSize: 28, fontWeight: 'Bold', fontFamily: fontFamily2, fill: false, lineWidth: 0}, this.game.ctx));
		buttons1.add(new Button({text: 'Unfreeze All', dim: {w: 220, h: 30},
			color: '#6898e6', hoverColor: '#abc8f4', margin: {top:10, bottom: 20, left: 0, right: 0}, 
			cb: e => {
				this.game.showMenu();
			}, fontSize: 20, fontWeight: '', fontFamily: fontFamily3, fill: false, lineWidth: 0}, this.game.ctx));

		this.add(buttons1);

		const astrons1 = new VBox({align: 'center', bgColor: '#736383', margin: 0});
		this.astrons.forEach(a => astrons1.add(a));

		buttons1.add(astrons1);
		buttons1.packAll();

		this.resetPowerups();
	}

	action(type, p) {
		const dx = this.game.gridPos.x;
		const dy = this.game.gridPos.y;
		if (this.game.grid[type])
			this.game.grid[type]({x: p.x-dx, y: p.y-dy});
		super.action(type, p);
	}

	blast(poly) {
		this.clearTimeouts();
		const dragon = this.find('Dragon');
		this.blastTimeout = setTimeout(e => 
			this.post(dragon, this.dragonHeadBlast, 'blastTimeout', 0, this.dragonHeadBlast.length), 0); 
		this.game.animator.blast(
			{x: dragon.pos.x+20, y: dragon.pos.y+dragon.dim.h/2+30}, 
			this.toScreenPos(poly.center));
	}

	clearTimeouts() {
		[this.flameTimeout, this.freezeTimeout, this.blastTimeout].forEach(to => {
			if (to) clearTimeout(to);
		});
	}

	draw(ctx) {
		const dx = this.game.gridPos.x;
		const dy = this.game.gridPos.y;
		ctx.translate(dx, dy);
		this.game.grid.draw(ctx);
		this.game.notifications.forEach(n => n.draw(ctx));
		ctx.translate(-dx, -dy);
		super.draw(ctx);
		this.projectiles.forEach(p => p.draw(ctx));
		/*const dragon = this.find('Dragon');
		const p = {x: dragon.pos.x, y: dragon.pos.y+dragon.dim.h/2};
		drawCircle(ctx, p, 5, '#f00');*/
	}

	flame(types) {
		this.clearTimeouts();
		const dragon = this.find('Dragon');
		types.forEach(t => {
			this.find(t).flame();		
		});
		this.flameTimeout = setTimeout(e => 
			this.post(dragon, this.dragonHeadFire, 'flameTimeout', 0, this.dragonHeadFire.length), 0); 
	}

	freeze(type) {
		this.clearTimeouts();
		const dragon = this.find('Dragon');
		this.freezeTimeout = setTimeout(e => 
			this.post(dragon, this.dragonHeadFrost, 'freezeTimeout', 0, 3*this.dragonHeadFrost.length), 0); 
	}

	post(dragon, ims, timeoutName, n, nTot) {
		dragon.img = (n == nTot) ? images['dragonHead'] : ims[n%ims.length];
		dragon.pack();
		if (n < nTot) {
			this[timeoutName] = setTimeout(e => this.post(dragon, ims, timeoutName, n+1, nTot), 1000/nTot);
		}
	}

	resetPowerups() {
		this.find('Blasts').count = 1;
		this.find('Freezes').count = 1;
	}

	toScreenPos(gridPos) {
		const dx = this.game.gridPos.x;
		const dy = this.game.gridPos.y;
		return {x: gridPos.x + dx, y: gridPos.y + dy};
	}
}

class MenuScreen extends Screen {
	constructor(game) {
		super(game);

		const vert1 = new VBox({pos: {x: 0, y: 0}, dim: {...this.dim}, align: 'center'});
		const vert2 = new VBox({bgColor: '#241e3c', dim: {x: this.dim.x, y: 120}, bgAlpha: 1, align: 'center'});

		vert2.add(new Text({text: 'Menu', fontSize: 52, fontWeight: 'Bold', fontFamily: fontFamily2, 
			margin: {top: 20, bottom: 10, left: this.dim.w, right: this.dim.w}}, this.game.ctx));
		vert2.add(new Text({text: 'Kid Apollo and his dragon... versus astral villany', margin: {top: 0, bottom: 30, left: 0, right: 0}},
			this.game.ctx));

		vert1.add(vert2);

		vert1.add(new Button({text: 'New Game', 
			color: '#9954b6', hoverColor: '#c691e5', margin: {top: 30, bottom: 10, left: 0, right: 0}, 
			fontSize: 24, fontWeight: 'Bold', fontFamily: fontFamily3, fill: false, lineWidth: 0,
			cb: e => this.game.newGame()}, this.game.ctx));
		vert1.add(new Button({text: 'Return', 
			color: '#9954b6', hoverColor: '#c691e5', margin: 10, 
			fontSize: 24, fontWeight: 'Bold', fontFamily: fontFamily3, fill: false, lineWidth: 0,
			cb: e => this.game.unpause()}, this.game.ctx));
		vert1.add(new Button({text: 'Configure Gamepad',
			color: '#6898e6', hoverColor: '#abc8f4', margin: {top: 10, left: 0, right: 0, bottom: 30}, 
			fontSize: 24, fontWeight: 'Bold', fontFamily: fontFamily3, fill: false, lineWidth: 0,
			cb: e => {
				this.game.config.lock();
				this.game.visible = this.game.config;
			}
		}, this.game.ctx));
		vert1.add(new Slider({
			name: 'Tectonic Activity',
			text: 'TECTONIC ACTIVITY', center: true,
			fontSize: 20, color: '#b2265b', barColor: '#995aa3', hoverColor: '#df69bc',
			labels: ['10s', '15s', '20s', '30s', '40s', '50s', 'Off'], index: 5, margin: 10,
			cb: time => {
				localStorage.setItem('Tectonic Activity', time);
				time = parseInt(time);
				const timer = this.game.main.find('Tectonic Activity');
				timer.timeSav = time;
				timer.time = time;
				timer.active = true;
				const speedText = this.game.main.find('Speed');
				speedText.text = `Speed ${this.speedString}`;
				speedText.parent.packAll();
			}},
			this.game.ctx));
		vert1.add(new Slider({
			name: 'Sound Effects Volume',
			text: 'SOUND EFFECTS VOLUME', center: true,
			fontSize: 20, color: '#b2265b', barColor: '#995aa3', hoverColor: '#df69bc',
			labels: [0, 0.05, 0.1, 0.2, 0.4, 0.8, 1], index: 4, margin: 10,
			cb: gain => {
				localStorage.setItem('Sound Effects Volume', gain);
				this.game.sounds.updateGain();
			}},
			this.game.ctx));
		vert1.add(new Slider({
			name: 'Music Volume',
			text: 'MUSIC VOLUME', center: true,
			fontSize: 20, color: '#b2265b', barColor: '#995aa3', hoverColor: '#df69bc',
			labels: [0, 0.05, 0.1, 0.2, 0.4, 0.8, 1], index: 2, margin: 10,
			cb: gain => {
				localStorage.setItem('Music Volume', gain);
				this.game.sounds.updateGain();
			}},
			this.game.ctx));

		this.add(vert1);
		vert1.packAll();
		
		this.restore();
	}
	
	draw(ctx) {
		//ctx.globalAlpha = 0.3;
		this.game.main.draw(ctx);
		//ctx.globalAlpha = 1;
		super.draw(ctx);
	}

	get speedString() {
		const delay = parseInt(this.find('Tectonic Activity').value);
		if (delay < 15) 
			return 'INSANE';
		else if (delay < 20) 
			return 'HIGH';
		else if (delay < 40)
			return 'MEDIUM';
		else 
			return 'LOW';
	}

	restore() {
		['Tectonic Activity', 'Sound Effects Volume', 'Music Volume'].forEach(name => {
			const val = localStorage.getItem(name);
			if (val || val === 0) {
				const slider = this.find(name);
				for (let i=0; i<slider.labels.length; i++) {
					if (slider.labels[i] == val) {
						slider.label.text = val;
						slider.bar.index = i;
					}
				}
			}
		});
	}
}

class PadConfigScreen extends Screen {
    constructor(game) {
        super(game);
        this.map = {};
        this.fieldIdx = 0;

		const vert1 = new VBox({pos: {x: 0, y: 40}, dim: {...this.dim}, align: 'center'});
		vert1.add(new Text({text: 'Configure Your Controller', fontSize: 28, 
			fontWeight: 'Bold', fontFamily: fontFamily2}, this.game.ctx));
		vert1.add(new Text({text: 'Press button when field is highlighted', fontWeight: 'Bold', fontSize: 24, 
			color: '#8f2559', margin: 10}, this.game.ctx));
		vert1.add(new ImageControl({img: images['controller'], dim: {w: 250, h: 250}, margin: 10}));
		vert1.add(new PadConfigButton({text: 'Start', dim: {w: 160, h: 30}, margin: 10}, this.game.ctx, this));

		const twoColumns = new HBox({margin: 10});
		const left = new VBox({margin: 10});
		const right = new VBox({margin: 10});

		left.add(new PadConfigButton({text: 'A', dim: {w: 160, h: 30}, margin: 10}, this.game.ctx, this));
		left.add(new PadConfigButton({text: 'B', dim: {w: 160, h: 30}, margin: 10}, this.game.ctx, this));
		left.add(new PadConfigButton({text: 'X', dim: {w: 160, h: 30}, margin: 10}, this.game.ctx, this));
		left.add(new PadConfigButton({text: 'Y', dim: {w: 160, h: 30}, margin: 10}, this.game.ctx, this));
		left.add(new PadConfigButton({name: 'LB', text: 'Left Bumper', dim: {w: 160, h: 30}, margin: 10}, this.game.ctx, this));

		right.add(new PadConfigButton({name: 'RB', text: 'Right Bumper', dim: {w: 160, h: 30}, margin: 10}, this.game.ctx, this));
		right.add(new PadConfigButton({name: 'LA', text: 'Left Arrow', dim: {w: 160, h: 30}, margin: 10}, this.game.ctx, this));
		right.add(new PadConfigButton({name: 'RA', text: 'Right Arrow', dim: {w: 160, h: 30}, margin: 10}, this.game.ctx, this));
		right.add(new PadConfigButton({name: 'UA', text: 'Up Arrow', dim: {w: 160, h: 30}, margin: 10}, this.game.ctx, this));
		right.add(new PadConfigButton({name: 'DA', text: 'Down Arrow', dim: {w: 160, h: 30}, margin: 10}, this.game.ctx, this));

		this.fields = [vert1.find('Start')].concat(left.children).concat(right.children);

		vert1.add(twoColumns);
		twoColumns.add(left);
		twoColumns.add(right);

		vert1.add(new Button({text: 'Return', dim: {w: 120, h: 40}, 
			cb: e => {
				this.save();
				if (this.game.level == 0) {
					this.game.newGame();
				} else {
					this.game.visible = this.game.menu;
				}
			}, hoverColor: '#2a5e68', margin: 15},
			this.game.ctx));

		vert1.packAll();
		this.add(vert1);
		this.find('Start').selected = true;

        this.ts = null;

		if (this.restore()) {
			this.fieldIdx = this.fields.length;
			this.find('Return').hovering = true;
		}
    }
    
    capture(pad) {
        if (!this.unlock) return;
        if (this.fieldIdx < this.fields.length) {
            const field = this.fields[this.fieldIdx];
			field.button = null;
			field.axis = null;
			field.value = null;
            const success = field.capture(pad);
            if (success) {
                if (field.button || field.button === 0) this.map[field.button] = field.name;
                else this.map[`${field.axis}:${field.value}`] = field.name;
                this.fieldIdx++;
                if (this.fieldIdx == this.fields.length) {
                    this.ts = pad.timestamp;
					field.selected = false;
					this.find('Return').hovering = true;
				} else {
					const f = this.fields[this.fieldIdx];
					f.click();
				}
            }
        } else if (pad.timestamp - 300 > this.ts) {
			if (this.game.padState.anyButton()) this.find('Return').click();
        }
    }

	lock() {
		this.unlock = false;
		setTimeout(e => {this.unlock = true;}, 300);
	}

	restore() {
		let found = false;
		['Start', 'A', 'B', 'X', 'Y', 'LB', 'RB', 'LA', 'RA', 'UA', 'DA'].forEach(name => {
			const buttonOrAxis = localStorage.getItem(name);
			if (buttonOrAxis || buttonOrAxis === 0) {
				found = true;
				const field = this.find(name);
				if (buttonOrAxis.includes(':')) {
					const [axis,value] = buttonOrAxis.split(':');
					field.axis = parseInt(axis);
					field.value = parseInt(value);
					field.button = null;
				} else {
					field.axis = null;
					field.value = null;
					field.button = buttonOrAxis;
				}
				this.map[buttonOrAxis] = name;
			}
		});
		return found;
	}

	save() {
		const map = this.game.config.map;
		['Start', 'A', 'B', 'X', 'Y', 'LB', 'RB', 'LA', 'RA', 'UA', 'DA'].forEach(name => {
			localStorage.removeItem(name);
		});
		for (const button in map) {
			const name = map[button];
			localStorage.setItem(name, button.toString());
		}
	}
}

class TitleScreen extends Screen {
	constructor(game) {
		super(game);
        this.enabled = false;
		
		const vert1 = new VBox({pos: {x: 0, y: 40}, dim: {...this.dim}, align: 'center'});
		vert1.add(new Text({text: 'DRAGON STAR', fontSize: 72, fontFamily: fontFamily1, margin: 10}, this.game.ctx));
		vert1.add(new ImageControl({img: images['DragonTitle'], dim: {w: 350, h: 350}, margin: 20}));
		vert1.add(new Button({name: 'button', text: 'Click to Enable Sounds', 
			color: '#9954b6', hoverColor: '#c691e5', margin: 30, 
			cb: e => {
				const button = this.find('button');
				if (button.text.text == 'Press Start') {
					this.game.newGame();
					return;
				}
				button.text.text = 'Press Start';
				button.text.fontSize = 40;
				button.pack();
				this.enabled = true;
				this.game.sounds.playMusic('intro');
				this.hex1.translate(button.text.pos.x-80-this.hex1.center.x, 0);
				this.hex2.translate(-(button.text.pos.x+button.dim.w+80-this.hex2.center.x), 0);
			}, fontSize: 32, fontWeight: '', fontFamily: fontFamily2, fill: false, lineWidth: 0}, this.game.ctx));

		vert1.packAll();
		this.add(vert1);

		const button = this.find('button');
		this.hex1 = new HexPoly({x: button.pos.x-80, y: button.pos.y+15}, 40, 'graphic', Math.PI/6, null, {lineWidth: 0});
		this.hex2 = new HexPoly({x: button.pos.x+button.dim.w+80, y: button.pos.y+15}, 40, 'graphic', Math.PI/6, null, {lineWidth: 0});

		/*this.polys = [];
		this.speed = 2;
		this.creationTime = 40;*/
	}

	click(p) {
		//if (this.find('button').text.text != 'Press Start')
			this.find('button').click();
		//else
			//super.click();
	}

	draw(ctx) {
		super.draw(ctx);
		ctx.globalAlpha = 0.5;
		this.hex1.draw(ctx);
		this.hex2.draw(ctx);
		//this.polys.forEach(p => p.draw(ctx));
		ctx.globalAlpha = 1;
	}

	tick() {
		/*const size = 40;
		if (this.game.age % this.creationTime == 0) {
			const x = Math.round(Math.random())*(this.dim.w-220)+Math.random()*(220-2*size)+size;
			const y = Math.random()*100+this.dim.h+size;
			this.polys.push(new HexPoly({x: x, y: y}, 40, 'graphic', Math.PI/6, null, {lineWidth: 0}));
		}
		let c = 0;
		while (c < this.polys.length && this.polys[c].center.y + size < 0) c++;
		if (c) this.polys.splice(0, c);
		this.polys.forEach(p => p.translate(0, -this.speed));*/
	}
}

class TransitionScreen extends Screen {
	constructor(game) {
		super(game);
	}
}

class VictoryScreen extends Screen {
	constructor(game) {
		super(game);
	}
}

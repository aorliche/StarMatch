
class ButtonState {
	constructor(game) {
		this.game = game;
		this.A = false;
		this.B = false;
		this.Sel = false;
		this.axes = [0,0];
		this.axesAges = [0,0];
	}

	continuous(evt, axis, age) {
		if (age - this.axesAges[axis] > 10) {
			this.axesAges[axis] = age;
			evt.axes[axis] = this.game.pad.axes[axis];
		}
	}

	edge(evt, prop, button) {
		if (this[prop] != this.game.pad.buttons[button].pressed) {
			this[prop] = this.game.pad.buttons[button].pressed;
			evt[prop] = this[prop];
		}
	}

	edgeAxis(evt, axis, age) {
		if (this.axes[axis] != this.game.pad.axes[axis]) {
			this.axesAges[axis] = age;
			this.axes[axis] = this.game.pad.axes[axis];
			evt.axes[axis] = this.axes[axis];
		}
	}

	getEvents(age) {
		const evt = {axes: [0,0]};
		this.edge(evt, 'A', 1);
		this.edge(evt, 'B', 2);
		this.edge(evt, 'Sel', 9);
		this.edgeAxis(evt, 0, age);
		this.edgeAxis(evt, 1, age);
		this.continuous(evt, 0, age);
		this.continuous(evt, 1, age);
		return evt;
	}
}

class Game extends MouseListener {
	constructor(canvas, updatePage) {
		super();
		this.level = 0;
		this.canvas = canvas;
		this.dim = {w: canvas.width, h: canvas.height};
		this.ctx = canvas.getContext('2d');
		this.title = new TitleScreen(copyDim(this.dim), this);
		this.menu = new MenuScreen(copyDim(this.dim), this);
		this.grid = null;
		this.animator = new Animator(this);
		this.paused = true;
		this.updatePage = updatePage;
		this.bg = new StarField(copyDim(this.dim));
		this.sounds = new Sounds(this);
		this.animator.start();
		this.pad = null;
		this.buttonState = new ButtonState(this);
		this.age = 0;
	}

	// All mouse actions
	action(type, p) {
		if (this.level == 0) {
			this.title[type](p);
		} else if (this.menu.visible) {
			this.menu[type](p);
		} else {
			this.catalog[type](p);
			this.grid[type](p);
		}
	}

	click(p) {this.action('click', p);}
	mousedown(p) {this.action('mousedown', p);}
	mousemove(p) {this.action('mousemove', p);}
	mouseup(p) {this.action('mouseup', p);}
	mouseout(p) {this.action('mouseout', p);}
	rightClick(p) {this.action('rightClick', p);}

	newGame() {
		this.level = 0;
		this.requestNextLevel();
		this.sounds.playMusic('game');
	}

	pause() {
		this.paused = true;		
		this.catalog.getTimer('Tectonic Activity').pause();
	}

	repaint() {
		this.ctx.fillStyle = '#000';
		this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
		this.bg.draw(this.ctx);
		if (this.level == 0) {
			this.title.draw(this.ctx);
		} else if (this.menu.visible) {
			this.ctx.save();
			this.ctx.globalAlpha = 0.7;
			this.grid.draw(this.ctx);
			this.catalog.draw(this.ctx);
			this.ctx.restore();
			this.menu.draw(this.ctx);
		} else {
			this.grid.draw(this.ctx);
			this.catalog.draw(this.ctx);
		}
	}
	
	requestNextLevel() {
		this.updatePage();
	}

	startLevel(level) {
		this.level = level;
		if (this.level == 1 || !this.catalog) {
			this.catalog = new Catalog(this);
			this.catalog.getButton('Menu').cb = () => this.showMenu();
		}
		this.animator.gridInfos = [];
		this.catalog.getCounter('Level').count = this.level;
		this.catalog.getButton('Unfreeze All').cb = () => this.grid.unfreeze();
		this.catalog.getTimer('Tectonic Activity').setAndStart(parseInt(get(this.menu, 'sliders', 'Tectonic Activity').value));
		this.grid = new HexGrid(this);
		this.unpause();
	}

	showMenu() {
		this.pause();
		this.menu.visible = true;
	}

	tick() {
		this.age++;
		if (!this.paused) {
			const timer = this.catalog.getTimer('Tectonic Activity');
			if (timer && timer.active && timer.time < 5 && timer.time >= 0) {
 				if (!this.sounds.playing('warning')) 
					this.sounds.play('warning');
			} else {
				this.sounds.stop('warning');
			}
			if (this.pad) {
				const evt = this.buttonState.getEvents(this.age);
				this.grid.pressButtons(evt);
			}
		} else {
			this.sounds.stop('warning');
			if (this.pad) {
				const evt = this.buttonState.getEvents(this.age);
				if (this.menu.visible) {
					if (evt.Sel) {
						this.unpause();	
					}
				} else if (this.level == 0) {
					if (evt.Sel) 
						this.newGame();
				}
			}
		}
		this.bg.tick();
	}

	unpause() {
		this.menu.visible = false;
		this.paused = false;
		this.catalog.getTimer('Tectonic Activity').unpause();
		this.animator.start();
	}

	winLevel() {
		this.grid.selected = null;
		this.animator.gridInfos = [];
		this.catalog.getTimer('Tectonic Activity').start();
		this.sounds.stopAll();
		this.sounds.play('winlevel');
		if (this.level < 9) {
			setTimeout(e => this.requestNextLevel(), 500);
		} else {
			this.catalog = null;
			this.animator.infos = [];
			this.paused = true;
			this.level = 0;
			//this.repaint();
		}
	}
}

class TitleScreen extends MouseListener {
	constructor(dim, game) {
		super();
		this.dim = dim;
		this.game = game;
		this.button = new Button('New Game', '#722', '#ddd', {x: this.dim.w/2-60, y: this.dim.h/2-20}, 
			{w: 120, h: 40}, e => this.game.newGame());
	}

	click(p) {
		if (this.button.contains(p)) {
			this.button.hovering = false;
			this.button.cb();
		}
	}

	draw(ctx) {
		/*ctx.fillStyle = '#003';
		ctx.fillRect(0, this.dim.h/2-120, this.dim.w, 75);*/
		drawText(ctx, 'Star Match', {x: this.dim.w/2, y: this.dim.h/2-80}, '#f00', 'Bold 36px Sans-Serif');
		drawText(ctx, 'A geometry-based space adventure', {x: this.dim.w/2, y: this.dim.h/2-60}, '#f00', 'Bold 16px Sans-Serif');
		this.button.draw(ctx);
	}
	
	mousemove(p) {
		this.button.hovering = this.button.contains(p);
	}

	mouseout(p) {
		this.button.hovering = false;
	}
}

class MenuScreen extends MouseListener {
	constructor(dim, game) {
		super();
		this.dim = dim;
		this.game = game;
		this.visible = false;
		this.buttons = [
			new Button('New Game', '#722', '#ddd', {x: this.dim.w/2-60, y: 150}, 
				{w: 120, h: 40}, e => this.game.newGame()),
			new Button('Return', '#722', '#ddd', {x: this.dim.w/2-60, y: 200},
				{w: 120, h: 40}, e => this.game.unpause()),
		];
		this.sliders = [
			new Slider('Tectonic Activity', 
				{x: this.dim.w/2-10, y:284, rjust:true}, '#d22', 16,
				{x: this.dim.w/2+10, y: 280}, {w: 80, h: 6}, '#d22', 
				{x: this.dim.w/2+10+80+30, y: 287}, 20, ['10s', '12s', '15s', '20s', '25s', '\u221e'], 2,
				time => {
					time = parseInt(time);
					const timer = get(this.game.catalog, 'timers', 'Tectonic Activity');
					timer.timeSav = time;
					timer.time = time;
					timer.active = true;
				}),
			new Slider('Sound Effects Volume', 
				{x: this.dim.w/2-10, y:314, rjust:true}, '#d22', 16,
				{x: this.dim.w/2+10, y:310}, {w: 128, h:6}, '#d22',
				{x: this.dim.w/2+10+128+30, y:317}, 20, [0, 0.1, 0.2, 0.3, 0.5, 0.8, 1, 2, 4], 2,
				gain => {
					this.game.sounds.updateGain();
				}),
			new Slider('Music Volume', 
				{x: this.dim.w/2-10, y:344, rjust:true}, '#d22', 16,
				{x: this.dim.w/2+10, y:340}, {w: 128, h:6}, '#d22',
				{x: this.dim.w/2+10+128+30, y:347}, 20, [0, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], 8,
				gain => {
					this.game.sounds.updateGain();
				}),
		];
	}

	click(p) {
		this.buttons.forEach(b => {
			if (b.contains(p)) {
				b.click();
			}
		});
	}

	draw(ctx) {
		drawText(ctx, 'Menu', {x: this.dim.w/2, y: 100}, '#f00', 'Bold 36px Sans-Serif');
		drawText(ctx, 'Universal pliers... Which universe?', {x: this.dim.w/2, y: 120}, '#f00', 'Bold 16px Sans-Serif');
		this.buttons.concat(this.sliders).forEach(b => b.draw(ctx));
	}
	
	mousemove(p) {
		this.buttons.forEach(b => {
			b.hovering = b.contains(p);
		});
		this.sliders.forEach(s => s.mousemove(p));
	}

	mousedown(p) {
		this.sliders.forEach(s => s.mousedown(p));
	}

	mouseup(p) {
		this.sliders.forEach(s => s.mouseup(p));
	}

	mouseout(p) {
		this.buttons.forEach(b => b.hovering = false);
		this.sliders.forEach(s => s.mouseup(p)); // meant to be mouseup
	}
}

class VictoryScreen extends MouseListener {
	constructor() {
		super();

	}
}

class Slider {
	constructor(text, centerLabel, labelColor, labelFontSize, left, dim, color, centerText, fontSize, ticks, pos, cb) {
		this.text = text;
		this.centerLabel = centerLabel;
		this.labelColor = labelColor;
		this.labelFontSize = labelFontSize;
		this.labelFont = `Bold ${this.labelFontSize}px Sans-Serif`;
		this.left = left;
		this.dim = dim;
		this.color = color;
		this.centerText = centerText;
		this.fontSize = fontSize ?? 12;
		this.font = `Bold ${this.fontSize}px Sans-Serif`;
		this.ticks = ticks;
		const n = ticks.length-1;
		this.tickLoc = [...this.ticks.keys()].map(i => ({x: left.x + i*(dim.w/n), y: left.y}));
		this.pos = pos;
		this.cb = cb;
		this.selected = false;
		this.hovering = false;
	}

	contains(p) {
		return distance(p, this.tickLoc[this.pos]) < 8;
	}

	draw(ctx) {
		drawText(ctx, this.text, this.centerLabel, this.labelColor, this.labelFont);
		ctx.lineWidth = 3;
		ctx.strokeStyle = this.color;
		ctx.fillStyle = '#ddd';
		ctx.beginPath();
		ctx.moveTo(this.left.x, this.left.y);
		ctx.lineTo(this.left.x+this.dim.w, this.left.y);
		ctx.closePath();
		ctx.stroke();
		ctx.lineWidth = 1;
		for (let i=0; i<this.tickLoc.length; i++) {
			ctx.beginPath();
			ctx.moveTo(this.tickLoc[i].x, this.tickLoc[i].y - this.dim.h/2);
			ctx.lineTo(this.tickLoc[i].x, this.tickLoc[i].y + this.dim.h/2);
			ctx.closePath();
			ctx.stroke();
			if (this.pos == i) {
				drawCircle(ctx, this.tickLoc[i], 6, '#d00');
				if (this.selected || this.hovering) {
					drawCircle(ctx, this.tickLoc[i], 4, '#ddd');
				}
			}
		}
		const txt = this.ticks[this.pos];
		const font = (txt == '\u221e') ? `Bold ${Math.floor(1.5*this.fontSize)}px Sans-Serif` : this.font;
		drawText(ctx, txt, this.centerText, this.color, font);
	}

	get value() {
		return this.ticks[this.pos];
	}

	mousedown(p) {
		if (this.contains(p)) {
			this.selected = true;
		}
	}

	mousemove(p) {
		this.hovering = this.contains(p);
		if (this.selected) {
			const oldPos = this.pos;
			this.pos = argmin(this.tickLoc.map(loc => distance(p, loc)));
			if (this.pos != oldPos) this.cb(this.ticks[this.pos]);
		}
	}

	mouseup() {
		this.selected = false;
	}

	mouseout() {
		this.hovering = false;
		this.selected = false;
	}
}

class StarField {
	constructor(dim) {
		this.dim = dim;
		this.stars = [];
		for (let i=0; i<100; i++) {
			this.stars.push({x: randomInt(0, dim.w), y: randomInt(0, dim.h), age: randomInt(0, 300)});
		}
		this.age = 1;
	}

	draw(ctx) {
		this.stars.forEach(s => {
			const b = Math.abs(15-Math.floor(((this.age+s.age)%300)/10)).toString(16);
			ctx.fillStyle = `#${b}${b}${b}`;
			ctx.fillRect(s.x, s.y, 3, 3);
		});
	}

	tick() {
		this.age++;
	}
}

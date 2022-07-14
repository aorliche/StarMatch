
class MainScreen extends MouseListener {
	constructor(game) {
		super();
		this.game = game;
		this.items = [];
		for (let i=0; i<types.length; i++) {
			this.items.push(new Astron(types[i], {x: 160+(20+10)*i, y: 10}, {w: 30, h:50}));
		}
		this.counters = [
			new Counter('Level', '#ddd', {x:460, y:25, rjust:true}, {x:465, y:25, ljust:true}, 18),
			new Counter('Moves', '#ddd', {x:460, y:50, rjust:true}, {x:465, y:50, ljust:true}, 12),
			new Counter('Freezes', '#ddd', {x:460, y:65, rjust:true}, {x:465, y:65, ljust:true}, 12, 3),
            new Counter('Blasts', '#ddd', {x:460, y:80, rjust:true}, {x:465, y:80, ljust:true}, 12, 1)
		];
		this.buttons = [
			new Button('Menu', '#611', '#ddd', {x: 15, y: 15}, {w: 90, h: 20}, e => this.game.showMenu(), 12),
			new Button('Unfreeze All', '#116', '#ddd', {x: 15, y: 45}, {w: 90, h: 20}, e => this.game.grid.unfreezeAll(), 12)
		];
		this.timers = [
			new Timer('Tectonic Activity', '#ddd', {x:240, y:80}, 12, 20, 
				timer => {this.game.grid.expandFromBelow()}, true)
		];
	}

	click(p) {
		let found = false;
		this.buttons.forEach(b => {
			if (b.contains(p)) {
				b.hovering = false;
				b.click(p);
				found = true;
			}
		});
		return found;
	}

	draw(ctx) {
		this.items.forEach(item => item.draw(ctx));
		this.buttons.forEach(item => item.draw(ctx));
		this.counters.forEach(item => item.draw(ctx));
		this.timers.forEach(item => item.draw(ctx));
	}
	
	frame() {
		this.items.forEach(item => item.frame());
	}

	get animating() {
		let updating = false;
		this.items.forEach(item => {
			if (item.alpha > 0) {
				updating = true;
			}
		});
		this.timers.forEach(timer => {
			if (timer.active) {
				updating = true;
			}
		});
		return updating;
	}
	
	getButton(name) {
		return this.buttons.filter(b => b.text == name)[0];
	}

	getCounter(name) {
		return this.counters.filter(c => c.text == name)[0];
	}

	getTimer(name) {
		return this.timers.filter(c => c.text == name)[0];
	}

	mousemove(p) {
		this.buttons.forEach(b => {
			b.hovering = b.contains(p);
		});
	}
/*
	score(hex) {
		this.items.forEach(item => {
			if (item.type == hex.type) {
				item.update(1);
			}
		});
	}*/

	update(polys) {
		this.items.forEach(item => item.count = 0);
		polys.forEach(hex => {
			if (!hex.empty) {
				this.items[types.indexOf(hex.type)].count += 1;
			}
		});
	}
}

class MenuScreen extends MouseListener {
	constructor(game) {
		super();
		this.dim = game.dim;
		this.game = game;
		this.visible = false;
		this.buttons = [
			new Button('New Game', '#722', '#ddd', {x: this.dim.w/2-60, y: 150}, 
				{w: 120, h: 40}, e => this.game.newGame()),
			new Button('Return', '#722', '#ddd', {x: this.dim.w/2-60, y: 200},
				{w: 120, h: 40}, e => this.game.unpause()),
            new Button('Configure Gamepad', '#722', '#ddd', {x: this.dim.w/2-100, y: 380},
                {w: 200, h: 40}, e => {
                    this.game.menu.visible = false;
                    this.game.config.visible = true;
                })
		];
		this.sliders = [
			new Slider('Tectonic Activity', 
				{x: this.dim.w/2-10, y:284, rjust:true}, '#d22', 16,
				{x: this.dim.w/2+10, y: 280}, {w: 128, h: 6}, '#d22', 
				{x: this.dim.w/2+10+128+30, y: 287}, 20, 
                    ['12s', '15s', '20s', '25s', '30s', '35s', '40s', '50s', '\u221e'], 6,
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
				{x: this.dim.w/2+10+128+30, y:317}, 20, [0, 0.02, 0.05, 0.1, 0.2, 0.5, 0.7, 1, 2], 5,
				gain => {
					this.game.sounds.updateGain();
				}),
			new Slider('Music Volume', 
				{x: this.dim.w/2-10, y:344, rjust:true}, '#d22', 16,
				{x: this.dim.w/2+10, y:340}, {w: 128, h:6}, '#d22',
				{x: this.dim.w/2+10+128+30, y:347}, 20, [0, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2], 4,
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

class PadConfigScreen extends MouseListener {
    constructor(game) {
        super();
        this.dim = game.dim;
        this.game = game;
        this.map = {};
        this.fieldIdx = 0;
        this.fields = [
            new PadButtonField(this, {text: 'Start', pos: {x: this.dim.w/2-80, y: 180}, dim: {w: 160, h: 22}}), 
            new PadButtonField(this, {text: 'A', pos: {x: this.dim.w/2-80, y: 210}, dim: {w: 160, h: 22}}), 
            new PadButtonField(this, {text: 'B', pos: {x: this.dim.w/2-80, y: 240}, dim: {w: 160, h: 22}}), 
            new PadButtonField(this, {text: 'Left Bumper', name: 'LB', pos: {x: this.dim.w/2-80, y: 270}, dim: {w: 160, h: 22}}), 
            new PadButtonField(this, {text: 'Right Bumper', name: 'RB', pos: {x: this.dim.w/2-80, y: 300}, dim: {w: 160, h: 22}}),
            new PadButtonField(this, {text: 'Left Arrow', name: 'LA', pos: {x: this.dim.w/2-80, y: 330}, dim: {w: 160, h: 22}}), 
            new PadButtonField(this, {text: 'Right Arrow', name: 'RA', pos: {x: this.dim.w/2-80, y: 360}, dim: {w: 160, h: 22}}), 
            new PadButtonField(this, {text: 'Up Arrow', name: 'UA', pos: {x: this.dim.w/2-80, y: 390}, dim: {w: 160, h: 22}}), 
            new PadButtonField(this, {text: 'Down Arrow', name: 'DA', pos: {x: this.dim.w/2-80, y: 420}, dim: {w: 160, h: 22}}),
            new PadButtonField(this, {text: 'X', pos: {x: this.dim.w/2-80, y: 450}, dim: {w: 160, h: 22}}), 
            new PadButtonField(this, {text: 'Y', pos: {x: this.dim.w/2-80, y: 480}, dim: {w: 160, h: 22}}), 
        ];
        this.buttons = [
			new Button('Return', '#722', '#ddd', {x: this.dim.w/2-60, y: 540},
				{w: 120, h: 40}, e => {
                    if (this.game.level == 0) {
                        this.game.config.visible = false;
                        this.game.newGame();
                    } else {
                        this.game.menu.visible = true;
                        this.game.config.visible = false;
                    }
                }),
		];
        this.ts = null;
    }
    
    capture(pad) {
        if (!this.unlock) return;
        if (this.fieldIdx < this.fields.length) {
            const field = this.fields[this.fieldIdx];
            const res = field.capture(pad);
            if (res) {
                if (field.button || field.button === 0) this.map[field.button] = field.name;
                else this.map[`${field.axis}:${field.value}`] = field.name;
                this.fieldIdx++;
                if (this.fieldIdx == this.fields.length)
                    this.ts = pad.timestamp;
            }
        } else if (pad.timestamp - 300 > this.ts) {
            let pressed = false;
            pad.buttons.forEach(b => {
                if (b.pressed) pressed = true;
            });
            this.buttons[0].hovering = true;
            if (pressed) this.buttons[0].click();
        }
    }
    
    click(p) {
        this.buttons.forEach(b => {
            if (b.contains(p)) b.click();
        });
        for (let i=0; i<this.fields.length; i++) {
            if (this.fields[i].contains(p)) {
                this.fieldIdx = i;
                return;
            }
        }
    }
    
    draw(ctx) {
        drawText(ctx, 'Configure Gamepad', {x: this.dim.w/2, y: 100}, '#f00', 'Bold 36px Sans-Serif');
        drawText(ctx, 'In space, a crowbar is almost always the right tool for the job....', {x: this.dim.w/2, y: 120},
            '#f00', 'Bold 12px Sans-Serif');
        drawText(ctx, 'Press button when field is highlighted', {x: this.dim.w/2, y: 165},
            '#f00', 'Bold 16px Sans-Serif');
        this.fields.concat(this.buttons).forEach(b => b.draw(ctx));
    }
    
    get visible() {
        return this.vis;
    }
    
    mousemove(p) {
        this.buttons.forEach(b => {
           b.hovering = b.contains(p); 
        });
        this.fields.forEach(f => {
           f.hovering = f.contains(p);
        });
    }
    
    set visible(vis) {
        this.vis = vis;
        get(this.game.menu, 'buttons', 'Configure Gamepad').hovering = false;
        if (vis == true) {
            this.fieldIdx = 0;
            setTimeout(e => {
                this.unlock = true;
            }, 300);
        } else {
            this.unlock = false;
        }
    }
}

class TitleScreen extends MouseListener {
	constructor(game) {
		super();
		this.dim = game.dim;
		this.game = game;
        this.enabled = false;
        this.buttons = [
            new Button('Click to Enable Sounds', '#722', '#ddd', {x: this.dim.w/2-90, y: this.dim.h/2},
                {w: 180, h: 40}, e => {
                    this.enabled = true;
                    this.buttons[0].text = 'Sounds Enabled!';
                    this.buttons[0].color = '#4a4';
                    this.game.sounds.playMusic('intro');
                }, 16), 
            new Button('New Game', '#722', '#ddd', {x: this.dim.w/2-60, y: this.dim.h/2+50}, 
                {w: 120, h: 40}, e => this.game.newGame(), 16)
        ];
	}

	click(p) {
        const idx = this.enabled ? 1 : 0;
        if (this.buttons[idx].contains(p)) {
            this.buttons[idx].hovering = false;
            this.buttons[idx].cb();
        }
	}

	draw(ctx) {
		drawText(ctx, 'DRAGON STAR', {x: this.dim.w/2, y: this.dim.h/2-80}, 
            '#f00', 'Bold 36px "Anger Styles", Sans-Serif');
		drawText(ctx, 'A geometry-based space adventure', {x: this.dim.w/2, y: this.dim.h/2-40}, 
            '#f00', 'Bold 16px Bahnschrift, Sans-Serif');
        this.buttons[0].draw(ctx);
        if (this.enabled) {
            this.buttons[1].draw(ctx);
            drawText(ctx, 'Press Start', {x: this.dim.w/2, y: this.dim.h/2+130},
                '#f00', 'Bold 16px Conthrax, Sans-Serif');
        }
	}
	
	mousemove(p) {
        const idx = this.enabled ? 1 : 0;
		this.buttons[idx].hovering = this.buttons[idx].contains(p);
	}

	mouseout(p) {
        const idx = this.enabled ? 1 : 0;
		this.buttons[idx].hovering = false;
	}
}

class VictoryScreen extends MouseListener {
	constructor() {
		super();

	}
}

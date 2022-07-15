
class Screen extends Box {
	constructor(game) {
		super({pos: {x: 0, y: 0}, dim: {...game.dim}});
		this.game = game;
	}
}

class MainScreen extends Screen {
	constructor(game) {
		super(game);

		/*for (let i=0; i<types.length; i++) {
			this.items.push(new Astron(types[i], {x: 160+(20+10)*i, y: 10}, {w: 30, h:50}));
		}*/
		const power1 = new VBox({pos: {x: 0, y: 50}, align: 'center'});
		const power2 = new HBox({dim: {w: this.dim.w, h: 50}, align: 'center'});

		power2.add(new ImageCounter({name: 'Freezes', imgs: iceImgs, max: 5, spacing: 5, count: 1, margin: 5}));
		power2.add(new ImageCounter({name: 'Blasts', imgs: blastImgs, max: 5, spacing: 5, count: 1, margin: 5}));

		power1.add(power2);
		power1.add(new Timer({text: 'Tectonic Activity', cb: e => {}, 
			time: parseInt(this.game.menu.find('Tectonic Activity').value), 
			loop: true, active: false, margin: 20}, this.game.ctx));

		power1.packAll();
		this.add(power1);

		const level1 = new VBox({pos: {x: this.dim.w-150, y: 50}, align: 'center'});
		const levelC = new TextCounter({name: 'Level', text: "LEVEL ", color: '#f00', 
			count: 1, dim: {w: 120, h: 0}, margin: 10}, this.game.ctx);

		level1.add(levelC);

		level1.packAll();
		this.add(level1);

		const buttons1 = new VBox({pos: {x: 10, y: 50}});
		
		buttons1.add(new Button({text: "Menu", dim: {w: 120, h: 30}, 
			cb: e => this.game.showMenu()}, this.game.ctx));
		buttons1.add(new Button({text: "Unfreeze All", dim: {w: 120, h: 30}, hoverColor: '#116', 
			cb: e => this.game.grid.unfreezeAll()}, this.game.ctx));

		buttons1.packAll();
		this.add(buttons1);
		console.log(buttons1.find('Menu'));
		console.log(this.game.menu.find('Tectonic Activity'));
		console.log(this);

		this.resetPowerups();
	}

	draw(ctx) {
		this.game.grid.draw(ctx);
		super.draw(ctx);
	}

	resetPowerups() {
		this.find('Blasts').count = 1;
		this.find('Freezes').count = 1;
	}
}

class MenuScreen extends Screen {
	constructor(game) {
		super(game);

		const vert1 = new VBox({pos: {x: 0, y: 0}, dim: {...this.dim}, align: 'center'});
		vert1.add(new Text({text: 'Menu', fontSize: 30, fontWeight: 'Bold', margin: 50}, this.game.ctx));
		vert1.add(new Text({text: 'Universal pliers... but which universe?', margin: {top: 0, bottom: 20, left: 0, right: 0}},
			this.game.ctx));
		vert1.add(new Button({text: 'New Game', dim: {w: 120, h: 40}, cb: e => this.game.newGame()}, this.game.ctx));
		vert1.add(new Button({text: 'Return', dim: {w: 120, h: 40}, cb: e => this.game.unpause()}, this.game.ctx));
		vert1.add(new Button({text: 'Configure Gamepad', dim: {w: 200, h: 40}, 
			cb: e => {
				this.game.visible = this.game.config;
			}
		}, this.game.ctx));
		vert1.add(new Slider({
			text: 'Tectonic Activity', 
			labels: ['10s', '15s', '20s', '30s', '40s', '50s', 'Off'], index: 5, margin: 10,
			cb: time => {
				time = parseInt(time);
				const timer = this.game.main.find('Tectonic Activity');
				timer.timeSav = time;
				timer.time = time;
				timer.active = true;
			}},
			this.game.ctx));
		vert1.add(new Slider({
			text: 'Sound Effects Volume', 
			labels: [0, 0.05, 0.2, 0.4, 0.8, 1, 2], index: 1, margin: 10,
			cb: gain => {
				this.game.sounds.updateGain();
			}},
			this.game.ctx));
		vert1.add(new Slider({
			text: 'Music Volume', 
			labels: [0, 0.05, 0.2, 0.4, 0.8, 1, 2], index: 3, margin: 10,
			cb: gain => {
				this.game.sounds.updateGain();
			}},
			this.game.ctx));

		vert1.packAll();
		this.add(vert1);
	}
	
	draw(ctx) {
		ctx.globalAlpha = 0.5;
		this.game.main.draw(ctx);
		ctx.globalAlpha = 1;
		super.draw(ctx);
	}
}

class PadConfigScreen extends Screen {
    constructor(game) {
        super(game);
        this.map = {};
        this.fieldIdx = 0;

		const vert1 = new VBox({pos: {x: 0, y: 40}, dim: {...this.dim}, align: 'center'});
		vert1.add(new Text({text: 'Press button when field is highlighted', fontWeight: 'Bold', fontSize: 24, margin: 10}, this.game.ctx));
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
				if (this.game.level == 0) {
					this.game.config.visible = false;
					this.game.newGame();
				} else {
					this.game.menu.visible = true;
					this.game.config.visible = false;
				}
			}, margin: 20},
			this.game.ctx));

		vert1.packAll();

        this.ts = null;
    }
    
    capture(pad) {
        if (!this.unlock) return;
        if (this.fieldIdx < this.fields.length) {
            const field = this.fields[this.fieldIdx];
            const success = field.capture(pad);
            if (success) {
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
            this.find('Return').hovering = true;
            if (pressed) this.buttons[0].click();
        }
    }
    
    get visible() {
        return this.vis;
    }
    
    set visible(vis) {
        this.vis = vis;
        this.game.menu.find('Configure Gamepad').hovering = false;
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

class TitleScreen extends Screen {
	constructor(game) {
		super(game);
        this.enabled = false;
		
		const vert1 = new VBox({pos: {x: 0, y: 20}, dim: {...this.dim}, align: 'center'});
		vert1.add(new Text({text: 'DRAGON STAR', fontSize: 72, fontFamily: fontFamily1, margin: 10}, this.game.ctx));
		vert1.add(new ImageControl({img: images['DragonTitle'], dim: {w: 300, h: 300}, margin: 10}));
		vert1.add(new Button({text: 'Click to Enable Sounds', dim: {w: 200, h: 40}, hoverColor: '#2a5e68', margin: 20,
			cb: e => {
				const button = this.find('Click to Enable Sounds');
				button.text.text = 'Sounds Enabled!',
				button.pack(),
				button.hoverColor = '#9954b6',
				this.enabled = true,
				this.find('New Game').disabled = false;
				this.find('Press Start').disabled = false;
				this.game.sounds.playMusic('intro')
			}}, this.game.ctx));
		vert1.add(new Button({text: 'New Game', dim: {w: 120, h: 40}, margin: 5, disabled: true, hoverColor: '#2a5e68',
			cb: e => {
				if (!this.enabled) return;
				this.game.newGame();
			}}, this.game.ctx));
		vert1.add(new Text({text: 'Press Start', margin: 20, color: '#9954b6', 
			fontSize: 32, fontWeight: 'Bold', fontFamily: fontFamily2, disabled: true}, this.game.ctx));

		vert1.packAll();
		this.add(vert1);
	}

	/*draw(ctx) {
		super.draw(ctx, true);
	}*/
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

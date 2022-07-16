class Game extends MouseListener {
	constructor(canvas, updatePage) {
		super();
		this.level = 0;
		this.canvas = canvas;
		this.dim = {w: canvas.width, h: canvas.height};
		this.ctx = canvas.getContext('2d');
		this.menu = new MenuScreen(this);
        this.main = new MainScreen(this); // requires menu non-null
        this.config = new PadConfigScreen(this);
		this.title = new TitleScreen(this);
		this.grid = null;
		this.animator = new Animator(this);
		this.paused = true;
		this.updatePage = updatePage;
		this.bg = new StarField(this.dim);
		this.sounds = new Sounds(this);
		this.animator.start();
		this.padState = new GamepadState(this);
		this.age = 0;
        this.sounds.playMusic('intro');
		this.visible = this.title;
        this.notifications = [];
		this.gridDim = {w: this.dim.w-440, h: this.dim.h-100};
		this.gridPos = {x: 220, y: 100};
	}

	// All mouse actions
	action(type, p) {
		this.visible[type](p);
	}

	click(p) {this.action('click', p);}
	mousedown(p) {this.action('mousedown', p);}
	mousemove(p) {this.action('mousemove', p);}
	mouseup(p) {this.action('mouseup', p);}
	mouseout(p) {this.action('mouseout', p);}
	rightClick(p) {this.action('rightClick', p);}

	newGame() {
		this.level = 0;
		const moves = this.main.find('Moves');
		moves.count = 0;
		moves.parent.packAll();
		this.requestNextLevel();
		this.sounds.playMusic('game');
	}
    
    notify(text) {
        const notice = new Notification({text: text, fontWeight: 'Bold', color: '#f00'}, this);
        if (this.notifications.length > 0 && 
            notice.pos.y - this.notifications.at(-1).pos.y < 40) {
            notice.pos.y = this.notifications.at(-1).pos.y + 40;
        }
        this.notifications.push(notice);
    }

	pause() {
		this.paused = true;		
		this.main.find('Tectonic Activity').pause();
		this.main.find('Menu').hovering = false;
		this.visible = this.menu;
	}

	repaint() {
		this.ctx.fillStyle = '#000';
		this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
		this.bg.draw(this.ctx);
		this.visible.draw(this.ctx);
	}
	
	requestNextLevel() {
		this.updatePage();
	}

	startLevel(level) {
		this.level = level;
		if (this.level == 1) {
			this.main.resetPowerups();
		}
		this.animator.gridInfos = [];
		this.main.find('Level').count = this.level;
		this.main.find('Tectonic Activity').setAndStart(parseInt(this.menu.find('Tectonic Activity').value));
		this.grid = new HexGrid(this, this.gridDim);
		this.unpause();
	}

	showMenu() {
		this.pause();
	}

	// For button events, tectonic activity warnings, notifications, and background ticks
	tick() {
		let evt = null;
		this.age++;
        this.pad = null;
        // Chrome generates new Gamepad objects every action
        for (const pad of navigator.getGamepads()) {
            if (pad) {
                this.pad = pad;
                break;
            }
        }
        // Null click in grid turns off
        if (this.pad && !this.padState.using && this.padState.anyButtonOrAxis()) {
            this.padState.using = true;
        }
		// Button events
		if (this.pad && this.padState.using) {
			evt = this.padState.getEvents(this.age);
		}
        // Game running
		if (this.visible == this.main) {
			if (evt) 
				this.grid.pressButtons(evt);
			// Warning
			const timer = this.main.find('Tectonic Activity');
			if (timer && timer.active && timer.time < 5 && timer.time >= 0) {
 				if (!this.sounds.playing('warning')) 
					this.sounds.play('warning');
			} else {
				this.sounds.stop('warning');
			}
        // Intro, menu, config, or animation
		} else {
			this.sounds.stop('warning');
			if (evt) {
				if (this.visible == this.menu) {
					if (evt.Start)
						this.unpause();
                } else if (this.visible == this.config) {
                    this.config.capture(this.pad);
				} else if (this.visible == this.title) {
					// Already have key map
					// always have axes key
                    if (Object.keys(evt).length > 1) 
                        this.newGame();
                    else if (this.title.enabled && this.padState.anyButton()) {
						this.config.lock();
						this.visible = this.config;
					}
				}
			}
		}
        // Housekeeping
        this.notifications.forEach(n => n.tick());
		this.bg.tick();
		if (this.visible.tick)
			this.visible.tick();
	}

	unpause() {
		this.visible = this.main;
		this.paused = false;
		this.main.find('Tectonic Activity').unpause();
		this.animator.start();
	}

	winLevel() {
		this.grid.selected = null;
		this.animator.gridInfos = [];
		this.main.find('Tectonic Activity').start();
		this.sounds.stopAll();
		this.sounds.play('winlevel');
		if (this.level < 9) {
			setTimeout(e => this.requestNextLevel(), 500);
		} else {
			this.animator.infos = [];
			this.paused = true;
			this.level = 0;
		}
	}
}

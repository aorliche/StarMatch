class Game extends MouseListener {
	constructor(canvas, updatePage) {
		super();
		this.level = 0;
		this.canvas = canvas;
		this.dim = {w: canvas.width, h: canvas.height};
		this.ctx = canvas.getContext('2d');
		this.title = new TitleScreen(copyDim(this.dim), this);
		this.menu = new MenuScreen(copyDim(this.dim), this);
        this.config = new PadConfigScreen(copyDim(this.dim), this);
        this.main = new MainScreen(this);
		this.grid = null;
		this.animator = new Animator(this);
		this.paused = true;
		this.updatePage = updatePage;
		this.bg = new StarField(copyDim(this.dim));
		this.sounds = new Sounds(this);
		this.animator.start();
		this.padState = new GamepadState(this);
		this.age = 0;
        this.notifications = [];
        this.sounds.playMusic('intro');
	}

	// All mouse actions
	action(type, p) {
		if (this.level == 0) {
            if (this.config.visible) 
                this.config[type](p);
            else
                this.title[type](p);
        } else if (this.config.visible) {
            this.config[type](p);
		} else if (this.menu.visible) {
			this.menu[type](p);
		} else {
			this.main[type](p);
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
    
    notify(text) {
        const notice = new Notification(this, {text: text});
        if (this.notifications.length > 0 && 
            notice.params.pos.y - this.notifications.at(-1).params.pos.y < 25) {
            notice.params.pos.y = this.notifications.at(-1).params.pos.y + 25;
        }
        this.notifications.push(notice);
    }

	pause() {
		this.paused = true;		
		this.main.getTimer('Tectonic Activity').pause();
	}

	repaint() {
		this.ctx.fillStyle = '#000';
		this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
		this.bg.draw(this.ctx);
        // Intro and intro config
		if (this.level == 0) {
            if (this.config.visible)
                this.config.draw(this.ctx);
            else
                this.title.draw(this.ctx);
        // Menu or menu config
		} else if (this.config.visible || this.menu.visible) {
			this.ctx.save();
			this.ctx.globalAlpha = 0.7;
			this.grid.draw(this.ctx);
			this.main.draw(this.ctx);
			this.ctx.restore();
            if (this.config.visible)
                this.config.draw(this.ctx);
			else
                this.menu.draw(this.ctx);
        // Game
		} else {
			this.grid.draw(this.ctx);
			this.main.draw(this.ctx);
            this.notifications.forEach(n => n.draw(this.ctx));
		}
	}
	
	requestNextLevel() {
		this.updatePage();
	}

	startLevel(level) {
		this.level = level;
		if (this.level == 1) {
			this.main.getButton('Menu').cb = () => this.showMenu();
            this.main.getCounter('Freezes').count = 3;
		}
		this.animator.gridInfos = [];
		this.main.getCounter('Level').count = this.level;
		this.main.getButton('Unfreeze All').cb = () => this.grid.unfreeze();
		this.main.getTimer('Tectonic Activity').setAndStart(parseInt(get(this.menu, 'sliders', 'Tectonic Activity').value));
		this.grid = new HexGrid(this);
		this.unpause();
	}

	showMenu() {
		this.pause();
		this.menu.visible = true;
	}

	tick() {
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
        // Game running
		if (!this.paused) {
			const timer = this.catalog.getTimer('Tectonic Activity');
			if (timer && timer.active && timer.time < 5 && timer.time >= 0) {
 				if (!this.sounds.playing('warning')) 
					this.sounds.play('warning');
			} else {
				this.sounds.stop('warning');
			}
			if (this.pad) {
				const evt = this.padState.getEvents(this.age);
				this.grid.pressButtons(evt);
			}
        // Intro, menu, config, or animation
		} else {
			this.sounds.stop('warning');
			if (this.pad) {
				const evt = this.padState.getEvents(this.age);
				if (this.menu.visible) {
					if (evt.Start) {
						this.unpause();
					}
                } else if (this.config.visible) {
                    this.config.capture(this.pad);
				} else if (this.level == 0) {
                    if (Object.keys(evt).length > 1) // always have axes key
                        this.newGame();
                    else if (this.title.enabled && this.padState.anyButton()) 
						this.config.visible = true;
				}
			}
		}
        // Housekeeping
        this.notifications.forEach(n => n.tick());
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
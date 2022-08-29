
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
		this.freezeLines = [];

		astrons.forEach(t => {
			const ta = `${t}_a`;
			this.astrons.push(new Astron({type: t, img: images[ta][0], flamed: images[ta], dim: {w: 95, h: 95}, margin: -5}));
		});

		this.astrons[0].margin.top = 20;
		this.astrons.slice(0,3).forEach(a => a.margin.bottom = -15);
		this.astrons.at(-1).margin.bottom = 100;

		const power1 = new VBox({pos: {x: 0, y: 0}, dim: {w: this.dim.w, h: 110}, bgColor: '#241e3c', align: 'center'});
		const power2 = new HBox({margin: {top: 25, bottom: 0, left: 0, right: 0}, align: 'center'});

		power2.add(new Text({name: 'Btext', text: 'Blasts', fontSize: 18, fontFamily: fontFamily3, fontWeight: 'Bold', 
			margin: {left: 5, right: 5, top: 0, bottom: 0}}, this.game.ctx));
		power2.add(new ImageCounter({name: 'Blasts', imgs: blastImgs, max: 5, spacing: 5, count: 1, margin: 5}));
		power2.add(new Text({name: 'Ftext', text: 'Freezes', fontSize: 18, fontFamily: fontFamily3, fontWeight: 'Bold', margin: 5}, this.game.ctx));
		power2.add(new ImageCounter({name: 'Freezes', imgs: iceImgs, max: 5, spacing: 5, count: 1, margin: {left: 5, right: 50, top: 5, bottom: 5}}));

		power1.add(power2);
		power1.add(new Timer({text: 'Tectonic Activity', cb: e => {
				this.game.grid.expandFromBelow();
			}, 
			time: parseInt(this.game.menu.find('Tectonic Activity').value), 
			loop: true, active: false, margin: 5}, this.game.ctx));

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
		
		// Register tectonic activity as a timer
		this.game.timers.push(this.find('Tectonic Activity'));
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
		this.freezeLines.forEach(line => line.draw(ctx));
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

	freeze(poly) {
		this.clearTimeouts();
		const dragon = this.find('Dragon');
		this.freezeTimeout = setTimeout(e => 
			this.post(dragon, this.dragonHeadFrost, 'freezeTimeout', 0, 3*this.dragonHeadFrost.length), 0); 
		console.log(dragon.center);
		console.log(poly.center);
		this.freezeLines.push(new FreezeLine(50, dragon.center, this.toScreenPos(poly.center)));
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

	tick() {
		this.freezeLines = this.freezeLines.filter(line => {
			line.tick();
			return line.lifetime > 0;
		});
	}

	toScreenPos(gridPos) {
		const dx = this.game.gridPos.x;
		const dy = this.game.gridPos.y;
		return {x: gridPos.x + dx, y: gridPos.y + dy};
	}
}

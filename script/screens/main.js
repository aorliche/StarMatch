
class MainScreen extends Screen {
	constructor(game) {
		super(game);
		this.astrons = [];
		this.astronCounter = {};
		this.flameTimeout = null;
		this.freezeTimeout = null;
		this.blastTimeout = null;
		this.dragonHeadFire = 
            ['dragonHeadFire', 'DragonHeadFire1', 'DragonHeadFire2'].map(name => images[name]);
		this.dragonHeadFrost = ['DragonHeadFrost', 'DragonHeadFrost1'].map(name => images[name]);
		this.dragonHeadBlast = ['DragonHeadBlast1'].map(name => images[name]);
		this.projectiles = [];
		this.freezeLines = [];

		astrons.forEach(t => {
			const ta = `${t}_a`;
			this.astrons.push(new Astron(
                {type: t, img: images[ta][0], flamed: images[ta], dim: {w: 65, h: 65}}));
		});

        // Gradient
        const astronDragonBoxGrad = new ControlGradient([[0,'#241e3c'],[0.5,'#241e3c'],[1,'#67496f']]);

        // Boxes
        const container = new VBox({pos: {x: 0, y: 0}, dim: {...this.dim}, align: 'center'});
        const hudBox = new HBox({dim: {w: this.dim.w, h: 90}, 
            bgColor: '#241e3c', bgAlpha: 0.8, strokeStyle: '#fff', lineWidth: 1});
        const astronsDragonBox = new HBox({margin: {top: 0, left: 20, right: 0, bottom: 0},
            bgColor: astronDragonBoxGrad, bgAlpha: 0.8, align: 'center', strokeStyle: '#fff', lineWidth: 1,
            dim: {w: this.dim.w, h: 70}});
        const levelBox = new VBox({margin: 20, align: 'center'});
        const freezesBlastsGoalBox = new VBox({align: 'center'});
        const freezesBlastsBox = new HBox({margin: {top: -10, bottom: 5, left: 0, right: 0}, align: 'center'});
        const menuUnfreezeBox = new VBox({margin: 20, align: 'center'});
	
        // Components	
        const levelCounter = new TextCounter({name: 'Level', text: "LEVEL ", 
            fontFamily: fontFamily2, fontWeight: 'Bold', fontSize: 24, margin: 10,
			count: 1}, this.game.ctx);
        const blastsText = new Text({name: 'Btext', text: 'Blasts', 
            fontSize: 18, fontFamily: fontFamily3, fontWeight: 'Bold', 
			}, this.game.ctx);
		const blastsCounter = new ImageCounter({name: 'Blasts', 
            imgs: blastImgs, max: 5, spacing: 5, count: 1, margin: 5});
		const freezesText = new Text({name: 'Ftext', text: 'Freezes', 
            fontSize: 18, fontFamily: fontFamily3, fontWeight: 'Bold', margin: 5}, 
            this.game.ctx);
		const freezesCounter = new ImageCounter({name: 'Freezes', 
            imgs: iceImgs, max: 5, spacing: 5, count: 1});
        const goalText = new Text({name: 'GoalText', text: 'Goal: Match three or more astrons!',
            fontSize: 18, fontFamily: fontFamily3,
            }, this.game.ctx);
		const menuButton = new Button({text: 'Menu',
			color: '#9654b6', hoverColor: '#c691e5', margin: {top: 0, bottom: 10, left: 0, right: 20},
			cb: e => {
				this.game.showMenu();
			}, fontSize: 28, fontWeight: 'Bold', fontFamily: fontFamily2, 
            fill: false, lineWidth: 0}, this.game.ctx);
		const unfreezeAllButton = new Button({text: 'Unfreeze All',
			color: '#6898e6', hoverColor: '#abc8f4', margin: {top: 0, bottom: 0, left: 0, right: 20},
			cb: e => {
				this.game.showMenu();
			}, fontSize: 20, fontWeight: '', fontFamily: fontFamily3, 
            fill: false, lineWidth: 0}, this.game.ctx);
        const dragon = new ImageControl({name: 'Dragon', img: images['dragonHead'], dim: {w: 65, h: 65}});
		
        // Fill boxes with components
        this.astrons.forEach(a => astronsDragonBox.add(a));
        astronsDragonBox.add(new Expander());
        astronsDragonBox.add(dragon);

        menuUnfreezeBox.add(menuButton);
        menuUnfreezeBox.add(unfreezeAllButton);

        freezesBlastsBox.add(blastsText);
        freezesBlastsBox.add(blastsCounter);
        freezesBlastsBox.add(new Expander());
        freezesBlastsBox.add(freezesText);
        freezesBlastsBox.add(freezesCounter);

        freezesBlastsGoalBox.add(freezesBlastsBox);
        freezesBlastsGoalBox.add(goalText);

        levelBox.add(new Expander());
        levelBox.add(levelCounter);
        levelBox.add(new Expander());

        hudBox.add(levelBox);
        hudBox.add(new Expander());
        hudBox.add(freezesBlastsGoalBox);
        hudBox.add(new Expander());
        hudBox.add(menuUnfreezeBox);

        container.add(hudBox);
        container.add(astronsDragonBox);

        this.add(container);
        this.packAll();

		this.resetPowerups();
		
		// Register tectonic activity as a timer
		//this.game.timers.push(this.find('Tectonic Activity'));
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
		//this.freezeLines.forEach(line => line.draw(ctx));
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

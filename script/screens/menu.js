
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
			return 'FAST';
		else if (delay < 40)
			return 'MEDIUM';
		else 
			return 'SLOW';
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

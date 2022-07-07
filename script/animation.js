class Animator {
	constructor(game) {
		this.game = game;
		this.grid = game.grid;
		this.infos = [];
		this.gridInfos = [];
		this.arrived = [];
		this.arrivedTimeout = null;
		this.restockBelowSpeed = 2;
		this.expandBelowSpeed = 1;
	}

	clear(hex) {
		const speed = 5+5*Math.random();
		hex.moving = true;
		this.infos.push({hex: hex, speed: speed, to: [{x: hex.center.x, y: 1000}]});
		this.start();
	}

	fall(hex, to) {
		hex.moving = true;
		let found = false;
		this.infos.map(info => {
			if (info.hex == hex) {
				info.to.push(to);
				found = true;
			} 
		});
		if (!found) {
			this.infos.push({hex: hex, speed: 4, to: [to], special: 'fall'});
			this.start();
		}
	}

	moveGrid(delta, speed) {
		const theta = Math.atan2(delta.y, delta.x);
		const sx = speed*Math.cos(theta);
		const sy = speed*Math.sin(theta);
		this.gridInfos.push({dx: delta.x, dy: delta.y, sx: sx, sy: sy, special: 'expandBelow'});
		this.start();
	}

	restock(hex, to) {
		hex.center = {x: to.x+300*(Math.random()-0.5), y: -200};
		hex.moving = true;
		hex.restocking = true;
		this.infos.push({hex: hex, speed: 10, to: [to]});
		this.start();
	}

	restockFromBelow(hex, p) {
		const to = hex.center;
		hex.center = {x: to.x, y: 600+hex.center.y-p.y+this.game.grid.size};
		hex.moving = true;
		hex.restocking = true;
		this.infos.push({hex: hex, speed: this.restockBelowSpeed, to: [to], special: 'restockFromBelow'});
		this.start();
	}

	start() {
		if (this.frame) return;
		const me = this;
		function frame() {
			me.game.tick();
			me.game.repaint();
			requestAnimationFrame(frame);
			if (me.game.paused) {
				return;
			}
			const arrived = [];
			me.infos = me.infos.filter(info => {
				me.gridInfos.forEach(ginfo => {
					let sx = ginfo.sx;
					let sy = ginfo.sy;
					const snap = Math.abs(sx) > Math.abs(ginfo.dx)-0.5 && Math.abs(sy) > Math.abs(ginfo.dy)-0.5;
					if (snap) {
						sx = ginfo.dx;
						sy = ginfo.dy;
					}
					if (info.special == 'fall' || info.special == 'restockFromBelow') {
						info.to.forEach(to => {
							to.x += sx;
							to.y += sy;
						});
					}
				});
				// Clearing
				if (info.hex.center.y > 950) {
					me.game.grid.clearing.splice(me.game.grid.clearing.indexOf(info.hex),1);
					return false;
				}
				if (distance(info.hex.center, info.to[0]) < info.speed) {
					info.hex.center = info.to.splice(0,1)[0];
					// Falling or swapping
					if (info.to.length == 0) {
						arrived.push(info);
						return false;
					}
				} else {
					const dx = info.to[0].x-info.hex.center.x;
					const dy = info.to[0].y-info.hex.center.y;
					const theta = Math.atan2(dy,dx);
					const sx = info.speed*Math.cos(theta);
					const sy = info.speed*Math.sin(theta);
					info.hex.translate(sx, sy);
				}
				return true;
			});
			me.gridInfos = me.gridInfos.filter(ginfo => {
				let sx = ginfo.sx; 
				let sy = ginfo.sy; 
				const snap = Math.abs(sx) > Math.abs(ginfo.dx)-0.5 && Math.abs(sy) > Math.abs(ginfo.dy)-0.5;
				if (snap) {
					sx = ginfo.dx;
					sy = ginfo.dy;
				}
				me.game.grid.polys.forEach(hex => {
					hex.translate(sx, sy);
				});
				me.game.grid.fastLoc.forEach(p => {
					p.x += sx;
					p.y += sy;
				});
				me.game.grid.center = {x: me.game.grid.center.x + sx, y: me.game.grid.center.y + sy};
				ginfo.dx -= sx;
				ginfo.dy -= sy;
				if (snap) {
					return false;
				}
				return true;
			});
			if (arrived.length > 0) {
				me.arrived = me.arrived.concat(arrived);
				if (me.arrivedTimeout) clearTimeout(me.arrivedTimeout);
				me.arrivedTimeout = setTimeout(e => {
					let fromBelow = false;
					me.arrived.forEach(info => {
						info.hex.moving = false;
						if (info.special == 'restockFromBelow') {
							info.hex.restocking = false;
							fromBelow = true;
						}
					});
					me.game.grid.clear();
					me.game.grid.fall();
					me.arrived = [];
					me.game.repaint();
					if (fromBelow) {
						let d; 
						if (me.game.grid.ptype == 'hex') {
							d = 3/2;
						} else if (me.game.grid.ptype == 'tri') {
							d = Math.sqrt(3)/2;
						} else if (me.game.grid.ptype == 'square') {
							d = 1;
						}
						me.moveGrid({x: 0, y: -d*me.game.grid.size}, me.expandBelowSpeed);
					}
				}, 20);
			}
			me.game.catalog.frame();
		}
		requestAnimationFrame(frame);
		this.frame = frame;
	}
}

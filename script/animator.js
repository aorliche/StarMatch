class Blast {
	constructor(image, c, dim, to) {
		this.image = image;
		this.pos = {x: 0, y: 0};
		this.dim = dim ?? {w: image.width, h: image.height};
		this.center = c;
		this.to = to;
	}

	draw(ctx) {
		const c = this.center;
		const angle = Math.atan2(c.y-this.to.y, c.x-this.to.x);
		ctx.translate(c.x, c.y);
		ctx.rotate(angle);
		ctx.drawImage(this.image, -this.dim.w/2, -this.dim.h/2, this.dim.w, this.dim.h);
		ctx.rotate(-angle);
		ctx.translate(-c.x, -c.y);
	}

	translate(dx, dy) {
		this.pos.x += dx;
		this.pos.y += dy;
	}

	get center() {
		return {x: this.pos.x + this.dim.w/2, y: this.pos.y + this.dim.h/2};
	}

	set center(c) {
		this.pos.x = c.x - this.dim.w/2;
		this.pos.y = c.y - this.dim.h/2;
	}
}

class FreezeLine {
	// Images should have the same height
	constructor(height, from, to) {
		this.im1 = images['Frost'];
		this.im2 = images['Frost1'];
		this.dim1 = {w: this.im1.width, h: this.im1.height};
		this.dim2 = {w: this.im2.width, h: this.im2.height};
		if (height) {
			const scale = height/this.dim1.h;
			this.dim1.w *= scale;
			this.dim1.h *= scale;
			this.dim2.w *= scale;
			this.dim2.h *= scale;
		}
		this.from = from;
		this.to = to;
		this.lifetime = 45;
	}

	draw(ctx) {
		const d = distance(this.from, this.to);
		const angle = Math.atan2(this.to.y-this.from.y, this.to.x-this.from.x);
		const si = this.lifetime%13 > 2;
		ctx.translate(this.to.x, this.to.y);
		ctx.rotate(angle);
		for (let i=si, dx=0; dx>-d; i++) {
			const im = this.im2; //(i%2) ? this.im2 : this.im1;
			const dim = this.dim2; //(i%2) ? this.dim2 : this.dim1;
			ctx.drawImage(im, dx, -dim.h/2, -dim.w, dim.h);
			dx -= dim.w;
		}
		ctx.rotate(-angle);
		ctx.translate(-this.to.x, -this.to.y);
	}

	tick() {
		this.lifetime--;
	}
}

class Animator {
	constructor(game) {
		this.game = game;
		this.infos = [];
		this.gridInfos = [];
		this.arrived = [];
		this.arrivedTimeout = null;
		this.restockBelowSpeed = 2;
		this.expandBelowSpeed = 1;
	}
	
	blast(from, to) {
		to = {...to};
		const blast = new Blast(images['Blast'], {...from}, null, to);
		this.game.main.projectiles.push(blast);
		this.infos.push({hex: blast, speed: 100, to: [to]});
		this.start();
	}

	clear(hex) {
		const speed = 5+5*Math.random();
		hex.moving = true;
        hex.cleared = true;
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

    levelStartAnimation() {
        let miny = this.game.grid.dim.h;
        this.game.grid.polys.forEach(p => {
            if (!p.empty) {
                if (p.center.y < miny) miny = p.center.y;
            }
        });
        let mult = 0.5;
        if (this.game.grid.ptype == 'hex') mult = 1;
        else if (this.game.grid.ptype == 'tri') mult = Math.sqrt(3)/2;
        const delta = {x: 0, y: this.game.grid.dim.h-miny+mult*this.game.grid.size};
        this.moveGridInstantly(delta);
        this.moveGrid({x: -delta.x, y: -delta.y}, 1, 'levelStart');
    }

	moveGrid(delta, speed, special) {
		const theta = Math.atan2(delta.y, delta.x);
		const sx = speed*Math.cos(theta);
		const sy = speed*Math.sin(theta);
        if (!special) special = 'expandBelow';
		this.gridInfos.push({dx: delta.x, dy: delta.y, sx: sx, sy: sy, special: special});
		this.start();
	}

    moveGridInstantly(delta) {
        this.game.grid.polys.forEach(hex => {
            hex.translate(delta.x, delta.y);
        });
        this.game.grid.fastLoc.forEach(p => {
            p.x += delta.x;
            p.y += delta.y;
        });
        this.game.grid.center = {x: this.game.grid.center.x + delta.x, y: this.game.grid.center.y + delta.y};
    }

	restock(hex, to) {
		hex.center = {x: to.x+300*(Math.random()-0.5), y: -200};
		hex.moving = true;
		hex.restocking = true;
		this.infos.push({hex: hex, speed: 10, to: [to]});
		this.start();
	}

	restockFromBelow(hex, p) {
		const to = {...hex.center};
		//hex.center.y = this.game.dim.h+2*this.game.grid.size;
		hex.center = {x: to.x, y: this.game.dim.h+hex.center.y-p.y+this.game.grid.size};
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
				// Arrived
				if (distance(info.hex.center, info.to[0]) < info.speed) {
					info.hex.center = info.to.splice(0,1)[0];
					// Falling or swapping
					if (info.to.length == 0) {
						// Polygon or sprite
						if (info.hex instanceof HexPoly) 
							arrived.push(info);
						else if (me.game.main.projectiles.includes(info.hex)) 
							remove(me.game.main.projectiles, info.hex);
						return false;
					}
				} else {
					// Movement
					const dx = info.to[0].x-info.hex.center.x;
					const dy = info.to[0].y-info.hex.center.y;
					const theta = Math.atan2(dy,dx);
					const sx = info.speed*Math.cos(theta);
					const sy = info.speed*Math.sin(theta);
					info.hex.translate(sx, sy);
				}
				return true;
			});
            // Moving entire screen
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
                    if (ginfo.special == 'levelStart') {
                        me.game.grid.inputOff = false;
                    }
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
					//me.game.repaint();
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
		}
		requestAnimationFrame(frame);
		this.frame = frame;
	}
}

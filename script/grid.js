const fixedHl = 0.2;
const hoverHl = 0.1;
const moveHl = 0.5;

// TODO worst case code about tiles getting stuck in weird positions

class HexPoly {
	constructor(center, size, type, angle, chains) {
		this.c = center;
		this.type = type;
		if (type == 'empty') this.empty = true;
		this.angle = angle;
		this.chains = chains;
		this.resize(size);
	}

	adjacentTo(hex) {
		return hex != this && distance(hex.center, this.center) < 2*this.size;
	}

	attract(p, ratio) {
		const dx = ratio*(this.center.x-p.x);
		const dy = ratio*(this.center.y-p.y);
		this.center = {x: p.x+dx, y: p.y+dy};
	}

	// Interior point must be counterclockwise to all 6 line segments
	contains(p) {
		for (let i=0; i<6; i++) {
			if (ccw(this.points[i], this.points[(i+1)%6], p) > 0) {
				return false;
			}
		}
		return true;
	}

	draw(ctx, hl) {
		ctx.fillStyle = getTypeColor(this.type);
		ctx.strokeStyle = '#4a4a4a';
		if (this.frozen) ctx.fillStyle = pSBC(0.2, ctx.fillStyle, '#aaa');
		if (this.moving) ctx.strokeStyle = pSBC(0.5, ctx.strokeStyle);
		if (this.fixed && hl == 'outline') ctx.strokeStyle = pSBC(0.2, ctx.strokeStyle);
		if (hl == 'selected') ctx.strokeStyle = '#ddb';
		if (hl && !isNaN(hl)) ctx.strokeStyle = pSBC(0.5, ctx.strokeStyle);
		ctx.lineWidth = (this instanceof TriPoly || this instanceof SquarePoly) ? 3 : 5;
		ctx.beginPath();
		const start = this.points[0];
		ctx.moveTo(start.x, start.y);
		this.points.map(p => {
			ctx.lineTo(p.x, p.y);
		});
		ctx.closePath();
		if (hl == 'outline') {
			ctx.stroke();
			return;
		}
		if (!this.empty) ctx.fill();
		if (!this.empty || hl) ctx.stroke();
		if (!this.empty) {
			const im = images[this.type];
			if (im) {
				let f = 1;
				if (this instanceof TriPoly) f = 0.4;
				if (this instanceof SquarePoly) f = 0.6;
				let [w,h] = scaleImage(im.width, im.height, this.size*f, this.size*f);
				if (this.type == 'planet') {
					w *= 1.2; h *= 1.2;
				}
				ctx.drawImage(im, this.center.x-w/2, this.center.y-h/2, w, h);
			}
		}
	}

	recalcBoundary() {
		this.points = [];
		for (let i=0; i<6; i++) {
			this.points.push({
				x: this.center.x + this.size*Math.cos(i*Math.PI/3+this.angle), 
				y: this.center.y - this.size*Math.sin(i*Math.PI/3+this.angle)
			});
		}
	}

	resize(size) {
		this.size = size;
		this.recalcBoundary();
	}

	translate(dx, dy) {
		this.center.x += dx;
		this.center.y += dy;
		this.recalcBoundary();
	}

	get center() {
		return this.c;
	}

	set center(c) {
		this.c = c;
		this.recalcBoundary();
	}
}

class TriPoly extends HexPoly {
	constructor(center, size, type, angle, chains) {
		super(center, size, type, angle, chains);
	}

	adjacentTo(tri) {
		return tri != this && distance(tri.center, this.center) < 3/4*this.size;
	}

	attract(p, ratio) {
		super.attract(p, ratio);
	}

	// Interior point must be counterclockwise to all 3 line segments
	contains(p) {
		for (let i=0; i<3; i++) {
			if (ccw(this.points[i], this.points[(i+1)%3], p) > 0) {
				return false;
			}
		}
		return true;
	}

	draw(ctx, hl) {
		super.draw(ctx, hl);
	}

	recalcBoundary() {
		this.points = [];
		const [a,b,c] = this.chains;
		const invert = Math.abs((a+b+c)%2)*Math.PI;
		for (let i=0; i<3; i++) {
			this.points.push({
				x: this.center.x + this.size/Math.sqrt(3)*Math.cos(i*2*Math.PI/3-Math.PI/6+this.angle+invert), 
				y: this.center.y - this.size/Math.sqrt(3)*Math.sin(i*2*Math.PI/3-Math.PI/6+this.angle+invert)
			});
		}
	}

	resize(size) {
		super.resize(size);
	}

	translate(dx, dy) {
		super.translate(dx, dy);
	}

	get center() {
		return this.c;
	}

	set center(c) {
		this.c = c;
		this.recalcBoundary();
	}
}

class SquarePoly extends HexPoly {
	constructor(center, size, type, angle, chains) {
		super(center, size, type, angle, chains);
	}

	adjacentTo(sq) {
		return sq != this && distance(sq.center, this.center) < 2*this.size;
	}

	attract(p, ratio) {
		super.attract(p, ratio);
	}

	// Interior point must be counterclockwise to all 4 line segments
	contains(p) {
		for (let i=0; i<4; i++) {
			if (ccw(this.points[i], this.points[(i+1)%4], p) > 0) {
				return false;
			}
		}
		return true;
	}

	draw(ctx, hl) {
		super.draw(ctx, hl);
	}

	recalcBoundary() {
		this.points = [];
		for (let i=0; i<4; i++) {
			this.points.push({
				x: this.center.x + this.size/Math.sqrt(2)*Math.cos(i*Math.PI/2+Math.PI/4+this.angle), 
				y: this.center.y - this.size/Math.sqrt(2)*Math.sin(i*Math.PI/2+Math.PI/4+this.angle)
			});
		}
	}

	resize(size) {
		super.resize(size);
	}

	translate(dx, dy) {
		super.translate(dx, dy);
	}

	get center() {
		return this.c;
	}

	set center(c) {
		this.c = c;
		this.recalcBoundary();
	}
}

function makePoly(ptype, center, size, type, angle, chains) {
	if (ptype == 'hex') {
		return new HexPoly(center, size, type, angle, chains);
	} else if (ptype == 'tri') {
		return new TriPoly(center, size, type, angle, chains);
	} else if (ptype == 'square') {
		return new SquarePoly(center, size, type, angle, chains);
	}
}

class HexGrid extends MouseListener {
	constructor(game) { 
		super();
		this.swapping = false;
		this.game = game;
		this.ptype = game.params.ptype;
		this.size = game.params.size;
		this.layers = game.params.layers;
		this.angle = game.params.angle;
		this.dim = game.dim;
		this.polys = [];
		this.polyMap = [];
		this.clearing = [];
		this.fixed = [];
		this.gen = this.makeRandomTypeGenerator(this.ptype, this.layers);
		this.animator = this.game.animator;
		this.game.catalog = this.game.catalog;
		//this.updateScore = updateScoreFn;
		// Init grid
		if (this.ptype == 'tri') {
			this.center = {x: this.dim.w/2, y: this.dim.h-Math.sqrt(3)/2*(this.layers)*this.size-10};
			this.limits = {i: [0,this.layers], j:[0,this.layers], k:[0,this.layers]};
			this.initChainFnTri();
		} else if (this.ptype == 'hex') {
			this.center = {x: this.dim.w/2, y: this.dim.h-(3/2*this.layers-1/2)*this.size-10};
			this.limits = {i: [-this.layers,0], j: [0,this.layers], k: [-this.layers,this.layers]};
			this.initChainFn();
		} else if (this.ptype == 'square') {
			this.center = {x: this.dim.w/2, y: this.dim.h-(this.layers-1/2)*this.size-10};
			const start = -Math.ceil(this.layers/2);
			this.limits = {i: [start,start+this.layers-1], j: [0,this.layers-1]};
			this.initChainFnSquare();
		}
		this.alterChainLimits();
		// Build board and poly map
		let count = 0;
		for (let loc of this.getLocations()) {
			const hex = makePoly(this.ptype, copyPoint(loc[0]), this.size, this.gen.get(), this.angle, [...loc[1]]);
			this.polys.push(hex);
			hex.id = count++;
			addLoc(this.polyMap, loc[1], hex);
		}
		// Clean up board
		this.initCleanBoard();
	}

	adjacent(hex1, hex2) {
		let [i1,j1,k1] = hex1.chains;
		let [i2,j2,k2] = hex2.chains;
		if (!k1) k1 = null;
		if (!k2) k2 = null;
		// Adjacent
		if (this.ptype == 'hex') {
			if (Math.abs(i1-i2) <= 1 && Math.abs(j1-j2) <= 1 && Math.abs(k1-k2) <= 1) return true;
		} else if (this.ptype == 'tri') {
			if (((i1 == i2) + (j1 == j2) + (k1 == k2)) >= 2) return true;
		} else if (this.ptype == 'square') {
			if (Math.abs(i1-i2) + Math.abs(j1-j2) == 1) return true;
		}
		// Wrap-around
		if ((i1 != i2 && j1 != j2 && k1 != k2) || hex1.empty || hex2.empty) return false;
		for (let i=0; i<this.chains.length; i++) {
			const first = this.chains[i][0];
			const last = this.chains[i].at(-1);
			//const last = this.chains[i][this.chains[i].length-1];
			if (arrayEquals(hex1.chains, first) && arrayEquals(hex2.chains, last) 
				|| (arrayEquals(hex2.chains, first) && arrayEquals(hex1.chains, last))) return true
		}
		return false;
	}

	alterChainLimits(i,j,k,allowOffScreen) {
		if (i) this.limits.i = i;
		if (j) this.limits.j = j;
		if (k) this.limits.k = k;
		if (this.ptype == 'tri') {
			this.initChainLocations(true);
			this.initFastChains();
			this.fixTri();
		} else if (this.ptype == 'hex') {
			this.initChainLocations(allowOffScreen);
			this.initFastChains();
		} else if (this.ptype == 'square') {
			this.initChainLocations(allowOffScreen);
			this.initFastChains();
		}
	}

	click(p) {
		const hex = this.findPoly(p);
		if (!hex || hex.moving || (this.selected && hex == this.selected)) {
			if (this.selected && hex == this.selected) {
				this.selected.fixed = false;
				this.fixed = this.fixed.filter(h => h != hex);
				this.fall();
			}
			this.selected = null;
			return;
		}
		if (this.selected && !this.selected.moving && this.adjacent(hex, this.selected)) {
			if (!this.lost) {
				this.swap(hex, this.selected);
				if (this.ptype == 'tri' && !this.selected.fixed) {
					this.selected.fixed = true;
					this.fixed.push(this.selected);
				}
				this.clear();
				this.fall();
				// We could have won at this point
				if (this.game.catalog) 
					this.game.catalog.moves += 1;
			}
			/*if (this.selected.moving && !hex.empty) {
				this.selected = null;
			}*/
		} else {
			this.selected = (hex.empty) ? null : hex;
		}
	}

	rightClick(p) {
		const hex = this.findPoly(p);
		if (hex && !hex.moving) {
			if (!hex.frozen && this.game.catalog.getCounter('Freezes').count > 0) {
				if (this.ptype == 'tri' && !hex.fixed) {
					this.fixed.push(hex);
					hex.fixed = true;
				}
				hex.frozen = true;
				this.game.catalog.getCounter('Freezes').count--;
			} else if (hex.frozen) {
				this.fixed = this.fixed.filter(h => h != hex);
				hex.frozen = false;
				hex.fixed = false;
				this.game.catalog.getCounter('Freezes').count++;
			}
		}
		this.clear();
		this.fall();
	}

	checkLoss() {
		const topEmpty = [];
		this.polys = this.polys.filter(hex => {
			if (!hex.restocking && !this.inScreenLimits(hex.center, true)) {
				//console.log(hex);
				if (hex.empty) {
					topEmpty.push(hex);
					return false;
				}
				this.lost = true;
				this.animator.gridInfos = [];
			}
			return true;
		});
		topEmpty.forEach(hex => {
			addLoc(this.polyMap, hex.chains, null);
		});
	}

	clear() {
		const toClear = this.getThreeInARow();
		if (toClear.length > 0) {
			toClear.forEach(hex => {
				const hole = makePoly(this.ptype, copyPoint(hex.center), this.size, 'empty', this.angle, [...hex.chains]);
				if (hex == this.selected) {
					this.selected = hole;
				}
				if (hex == this.hovering) {
					this.hovering = hole;
				}
				addLoc(this.polyMap, hex.chains, hole);
				this.polys.push(hole);
				this.animator.clear(hex);
				this.clearing.push(hex);
				this.swapping = false;
				this.selected = null;
			});
			this.polys = this.polys.filter(hex => toClear.indexOf(hex) == -1);
			this.fixed = this.fixed.filter(hex => toClear.indexOf(hex) == -1);
			this.game.sounds.play('clear', {keep: true});
		}
		this.game.catalog.update(this.polys);
		if (this.polys.filter(p => !p.empty).length == 0) {
			this.game.winLevel();
		} else if (!this.solveable()) {
			this.scheduleExpand();
		}
	}

	draw(ctx) {
		this.polys.forEach(hex => hex.draw(ctx));
		this.fixed.forEach(hex => hex.draw(ctx, 'outline'));
		this.clearing.forEach(hex => hex.draw(ctx));
		if (this.hovering) {
			this.hovering.draw(ctx, hoverHl);
		}
		if (this.selected) {
			this.selected.draw(ctx, 'selected');
		}
		/*for (let loc of this.getLocations()) {
			drawCircle(ctx, loc[0], 5, 'red');
		}*/
		//drawCircle(ctx, this.center, 5, 'red');
		if (this.game.displayChains) {
			this.polys.forEach(hex => drawText(ctx, `${hex.chains}`, hex.center, 'red', 'Bold 18px Sans-Serif', '#4a0000'));
		}
		//drawLine(ctx, {x: 0, y: 100}, {x: 500, y: 100}, '#4a4a4a', 5);
		if (this.lost) {
			drawText(ctx, "Oh no!", {x: 250, y: 250}, 'red', 'Bold 48px Sans-Serif', '#4a4a4a');
			drawText(ctx, "You didn't make it..", {x: 250, y: 300}, 'red', 'Bold 48px Sans-Serif', '#4a4a4a');
		} /*else {
			drawText(ctx, 'Left click to move', {x: 10, y: 100, ljust: true}, 'white', '16px Sans-Serif');
			drawText(ctx, 'Right click to freeze', {x: 10, y: 120, ljust: true}, 'white', '16px Sans-Serif');
			drawText(ctx, 'Good luck Elon!', {x: 10, y: 140, ljust: true}, 'white', '16px Sans-Serif');
		}*/
		//this.game.catalog.draw(ctx);
		//this.buttons.forEach(b => b.draw(ctx, this.hovering == b));
		//this.drawHud(ctx);
	}

	expandFromBelow() {
		let first = null;
		let coords = [];
		if (this.ptype == 'hex') {
			const k = this.limits.k[1]+1;
			this.alterChainLimits([-k, 0], [0, k], [0, k], true);
			[...Array(k).keys()].forEach(j => {
				coords.push([j-k+1,j,k-1]);	
			});
		} else if (this.ptype == 'tri') {
			const i = this.limits.i[1]+1;
			this.alterChainLimits([0, i], [0, i], [0, i]);
			[...Array(i+1).keys()].forEach(j => {
				coords.push([i,j,i-j-1]);
				coords.push([i,j,i-j]);
			});
		} else if (this.ptype == 'square') {
			const j = this.limits.j[1]+1;
			const i0 = this.limits.i[0];
			const i1 = this.limits.i[1];
			this.alterChainLimits(null, [0, j], null, true);
			[...Array(i1-i0+1).keys()].forEach(i => {
				coords.push([i+i0,j]);
			});
		}
		const locs = coords.map(loc => [loc, queryIndex(this.loc, loc)]).filter(locp => locp[1]);
		const existing = this.polys.filter(hex => !hex.empty);
		this.gen.update(existing, locs.length);
		locs.forEach(([loc,p]) => {
			const hex = makePoly(this.ptype, copyPoint(p), this.size, this.gen.get(), this.angle, loc);
			if (!first) first = copyPoint(p);
			addLoc(this.polyMap, loc, hex);
			this.polys.push(hex);
			this.animator.restockFromBelow(hex, first);
		});
		if (this.ptype == 'hex') 
			this.initCleanBoard(this.limits.k[1]-1);
		else if (this.ptype == 'tri') 
			this.initCleanBoard(this.limits.i[1]);
		else if (this.ptype == 'square') 
			this.initCleanBoard(this.limits.j[1]);
		this.game.sounds.play('expand', {keep: true});
	}

	// TODO fix occaisional lattice defect on falling and expanding - probably animator "to" point mixup?
	fall() {
		let changed; 
		let playSound = false;
		do {
			changed = false;
			this.fixed = this.fixed.filter(h => {
				for (let i=0; i<this.polys.length; i++) {
					const p = this.polys[i];
					if (p == h) continue;
					if (h.chains[0] == this.limits.i[1]) return true;
					if (!p.empty && p.center.y > h.center.y && distance(h.center, p.center) < 2/Math.sqrt(3)*this.size+5) {
						return true;
					}
				}
				h.fixed = false;
				changed = true;
				return false;
			});
			shuffleArray(this.chainsFall);
			for (let i=0; i<this.chainsFall.length; i++) {
				const chain = this.chainsFall[i];
				for (let j=1; j<chain.length; j++) {
					if (!chain[j-1] || !chain[j]) continue;
					const prev = queryIndex(this.polyMap, chain[j-1]); 
					const cur = queryIndex(this.polyMap, chain[j]); 
					if (cur && prev && cur.empty && !prev.empty && !prev.moving && !prev.fixed) {
						if (cur.selected) {
							this.selected = prev;
						}
						if (this.game.pad && this.hovering == cur) {
							this.hovering = prev;
						}
						prev.chains = [...chain[j]];
						cur.chains = [...chain[j-1]];
						addLoc(this.polyMap, [...cur.chains], cur);
						addLoc(this.polyMap, [...prev.chains], prev);
						this.animator.fall(prev, copyPoint(cur.center));
						cur.center = copyPoint(prev.center);
						changed = true;
						playSound = true;
					}
				}
			}
		} while (changed);
		if (playSound) {
			this.game.sounds.play('fall', {keep: true});
		}
		// Reselect closest one to empty
		if (this.selected && this.selected.empty) {
			const idcs = nearbyIndices(this.selected.chains, 1, this.ptype);
			for (let i=0; i<idcs.length; i++) {
				const hex = queryIndex(this.polyMap, idcs[i]);
				if (hex && !hex.empty && !this.selected.moving) {
					this.selected = hex;
					return;
				}
			}
			this.selected = null;
		}
	}



	findPoly(p) {
		for (let i=0; i<this.polys.length; i++) {
			if (this.polys[i].contains(p)) {
				return this.polys[i];
			}
		}
		return null;
	}

	// TODO: make not fail for any negative indices
	fixTri() {
		const nloc = [];
		const nFastLoc = [];
		let nchains = [[],[],[]];
		const hchains = [];
		for (let i=0; i<this.chains.length; i++) {
			const chain = this.chains[i];
			const horiz = (chain.length == 1 || chain[0][0] == chain[1][0]);
			if (horiz) {
				hchains.push(chain);
				continue;
			} 
		}
		const addSingles = [];
		this.chainsSingle.forEach(sc => {
			let found = false;
			hchains.forEach(c => {
				if (arrayEquals(c[0], sc) || arrayEquals(c[c.length-1], sc)) {
					found = true;
				}
			});
			if (!found) addSingles.push(sc);
		});
		addSingles.forEach(sc => hchains.push([sc]));
		hchains.sort((a,b) => a[0][0] - b[0][0]);
		const h = this.size/(2*Math.sqrt(3));
		for (let i=0; i<hchains.length; i++) {
			const chain = hchains[i];
			for (let j=0; j<chain.length; j++) {
				const [ii,jj,kk] = chain[j];
				const ii0 = ii;
				const ii1 = ii+Math.sign(ii+0.1);
				const p = this.loc[ii][jj][kk];
				const p0 = {x: p.x-h*Math.sin(this.angle), y: p.y-h*Math.cos(this.angle)};
				const p1 = {x: p.x+h*Math.sin(this.angle), y: p.y+h*Math.cos(this.angle)};
				const k = i-j;
				// Don't allow null locations in chains
				if (this.inScreenLimits(p0, true)) {
					addLoc(nloc, [ii0,jj,kk], p0);
					nFastLoc.push(p0);
					addLocEnd(nchains, [0,ii], [ii0,jj,kk]);
					addLocEnd(nchains, [1,jj], [ii0,jj,kk]);
					addLocEnd(nchains, [2,kk], [ii0,jj,kk]);
				}
				if (this.inScreenLimits(p1, true) && this.inLimits([ii1,jj,kk])) {
					addLoc(nloc, [ii1,jj,kk], p1);
					nFastLoc.push(p1);
					addLocEnd(nchains, [0,ii1], [ii1,jj,kk]);
					addLocEnd(nchains, [1,jj], [ii1,jj,kk]);
					addLocEnd(nchains, [2,kk], [ii1,jj,kk]);
				}
			}
		}
		nchains = nchains.map(subChains => {
			return subChains.filter(c => {
				if (c.length <= 1) return false;
				return true;
			});
		});
		this.chains = nchains;
		this.loc = nloc;
		this.fastLoc = nFastLoc;
		this.chains[0].map(chain => chain.sort((a,b) => {
				if ((a[2] - b[2]) != 0) return a[2] - b[2];
				if ((a[1] - b[1]) != 0) return b[1] - a[1];
				return 0;
			}));
		this.initFastChainsFinal();
	}

	getChains() {
		const me = this;
		return {
			*[Symbol.iterator]() {
				// Along i
				for (let i=me.limits.i[0]; i<me.limits.i[1]+1; i++) {
					for (let j=me.limits.j[0]; j<me.limits.j[1]+1; j++) {
						if (me.ptype == 'square') {
							yield [i,j];
							continue;
						}
						const k = (me.ptype == 'tri') ? i-j : j-i;
						if (k < me.limits.k[0] || k > me.limits.k[1]) continue;
						yield [i,j,k];
					}
					yield null;
				}
				// Along j
				for (let j=me.limits.j[0]; j<me.limits.j[1]+1; j++) {
					for (let i=me.limits.i[0]; i<me.limits.i[1]+1; i++) {
						if (me.ptype == 'square') {
							yield [i,j];
							continue;
						}
						const k = (me.ptype == 'tri') ? i-j : j-i;
						if (k < me.limits.k[0] || k > me.limits.k[1]) continue;
						yield [i,j,k];
					}
					yield null;
				}
				if (me.ptype == 'square') {
					yield null;
					return;
				}
				// Along k
				for (let k=me.limits.k[0]; k<me.limits.k[1]+1; k++) {
					for (let i=me.limits.i[0]; i<me.limits.i[1]+1; i++) {
						const j = (me.ptype == 'tri') ? i-k : i+k;
						if (j < me.limits.j[0] || j > me.limits.j[1]) continue;
						yield [i,j,k];
					}
					yield null;
				}
			}
		}
	}

	getFourPack(hex1, hex2) {
		if (hex1.chains[0] != hex2.chains[0]) return;
		const i1 = [...hex1.chains];
		const i2 = [...hex2.chains];
		i1[0] -= 1;
		i2[0] -= 1;
		const hex3 = queryIndex(this.polyMap, i1);
		const hex4 = queryIndex(this.polyMap, i2);
		if (hex3 && hex4 && !hex3.frozen && !hex4.frozen && hex1.type == hex3.type && hex1.type == hex4.type) 
			return [hex1, hex2, hex3, hex4];
	}

	getLocations() {
		const me = this;
		return {
			*[Symbol.iterator]() {
				if (me.ptype == 'square') {
					for (let i=me.limits.i[0]; i<me.limits.i[1]+1; i++) {
						for (let j=me.limits.j[0]; j<me.limits.j[1]+1; j++) {
							try {
								if (me.loc[i][j]) {
									yield [me.loc[i][j], [i,j]];
								}
							} catch (e) {}
						}
					}
					return;
				}
				for (let j=me.limits.j[0]; j<me.limits.j[1]+1; j++) {
					for (let k=me.limits.k[0]; k<me.limits.k[1]+1; k++) {
						if (me.ptype == 'tri') {
							const i0 = j+k;
							const i1 = i0+Math.sign(i0+0.1);
							try {
								if (me.loc[i0][j][k]) {
									yield [me.loc[i0][j][k], [i0,j,k]];
								}
							} catch (e) {}
							if (me.inLimits([i1,j,k])) {
								try {
									if (me.loc[i1][j][k]) {
										yield [me.loc[i1][j][k], [i1,j,k]];
									}
								} catch (e) {}
							}
						} else {
							const i = j-k;
							if (me.inLimits([i,j,k])) {
								try {
									if (me.loc[i][j][k]) {
										yield [me.loc[i][j][k], [i,j,k]];
									}
								} catch (e) {}
							}
						}
					}
				}
			}
		}
	}

	// TODO deltas for triangle and square-like rhombus
	getNeighbors(hex) {
		const deltas = [[1,0,-1],[0,-1,-1],[-1,-1,0],[-1,0,1],[0,1,1],[1,1,0]];
		const neighbors = [];
		deltas.forEach(d => {
			const [i,j,k] = hex.chains;
			const [ii,jj,kk] = d;
			try {
				neighbors.push(this.polyMap[i+ii][j+jj][k+kk]);
			} catch (e) {}
		});
		return neighbors;
	}

	getThreeInARow(ignoreRestock) {
		const hexes = new Set();
		for (let i=0; i<this.chains.length; i++) {
			const chain = this.chains[i];
			for (let j=0; j<chain.length-1; j++) {
				try {
					const hex1 = queryIndex(this.polyMap, chain[j]);
					const hex2 = queryIndex(this.polyMap, chain[j+1]);
					// Three around a vertex
					if (this.ptype == 'hex' && !hex1.empty && hex1.type == hex2.type && !hex1.frozen && !hex2.frozen
						&& (ignoreRestock || (!hex1.restocking && !hex2.restocking))) {
						const buds = this.getVertexBuddies(hex1, hex2);
						buds.forEach(hex => {
							if (hex.type == hex1.type && (ignoreRestock || !hex.restocking) && !hex.frozen) {
								hexes.add(hex);
								hexes.add(hex1);
								hexes.add(hex2);
							}
						});
					}
					// Four around a vertex
					if (this.ptype == 'square' && !hex1.empty && hex1.type == hex2.type && !hex1.frozen && !hex2.frozen
						&& (ignoreRestock || (!hex1.restocking && !hex2.restocking))) {
						// only need to check one index, and type checked in get method
						const four = this.getFourPack(hex1, hex2);
						if (four) {
							four.forEach(hex => {
								hexes.add(hex);
							});
						}
					}
					// Three in a row
					const hex3 = queryIndex(this.polyMap, chain[j+2]); //this.polyFromIdx(chain[j+2]);
					if (!hex1.empty && hex1.type == hex2.type && hex1.type == hex3.type && !hex1.frozen && !hex2.frozen && !hex3.frozen
						&& (ignoreRestock || (!hex1.restocking && !hex2.restocking && !hex3.restocking))) {
						hexes.add(hex1);
						hexes.add(hex2);
						hexes.add(hex3);
					}
				} catch (e) {}
			}
		}
		return Array.from(hexes);
	}

	getVertexBuddies(hex1, hex2) {
		const n1 = this.getNeighbors(hex1);
		const n2 = this.getNeighbors(hex2);
		const common = [];
		n1.forEach(hex => {
			if (hex && n2.indexOf(hex) != -1) {
				common.push(hex);
			}
		});
		return common;
	}

	highlight(ctx, arr, hl) {
		arr.map(hex => hex.draw(ctx, hl));
	}

	initChainFn() {
		const f1 = (t, c) => {
			return {x: Math.cos(this.angle+Math.PI/2)*Math.sqrt(3)*this.size*t + c.x, 
					y: -Math.sin(this.angle+Math.PI/2)*Math.sqrt(3)*this.size*t + c.y};
		};
		const f2 = (t, c) => {
			return {x: Math.cos(this.angle+Math.PI/6+Math.PI)*Math.sqrt(3)*this.size*t + c.x,
					y: -Math.sin(this.angle+Math.PI/6+Math.PI)*Math.sqrt(3)*this.size*t + c.y};
		};
		const f3 = (t, c) => {
			return {x: Math.cos(this.angle-Math.PI/6)*Math.sqrt(3)*this.size*t + c.x,
					y: -Math.sin(this.angle-Math.PI/6)*Math.sqrt(3)*this.size*t + c.y};
		};
		this.chainFn = [f1, f2, f3];
	}

	// Rhombus unit cell must be preprocessed later
	initChainFnTri() {
		const dx = Math.cos(-Math.PI/6)*this.size;
		const dy = Math.sin(-Math.PI/6)*this.size;
		const h = Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2));
		const f1 = (t, c) => {
			return {x: this.size*Math.cos(this.angle)*t + c.x,
					y: -this.size*Math.sin(this.angle)*t + c.y};
		};
		const f2 = (t, c) => {
			return {x: Math.cos(this.angle-Math.PI/3)*h*t + c.x,
					y: -Math.sin(this.angle-Math.PI/3)*h*t + c.y};
		};
		const f3 = (t, c) => {
			return {x: Math.cos(this.angle+4*Math.PI/3)*h*t + c.x,
					y: -Math.sin(this.angle+4*Math.PI/3)*h*t + c.y};
		};
		this.chainFn = [f1, f2, f3];
	}

	initChainFnSquare() {
		const dx1 = Math.cos(this.angle)*this.size;
		const dy1 = -Math.sin(this.angle)*this.size;
		const dx2 = Math.cos(this.angle-Math.PI/2)*this.size;
		const dy2 = -Math.sin(this.angle-Math.PI/2)*this.size;
		const xd = (this.layers % 2 == 0) ? this.size/4 : this.size/2;
		const f1 = (t, c) => {
			return {x: dx1*t + c.x + xd, y: dy1*t + c.y};
		}
		const f2 = (t, c) => {
			return {x: dx2*t + c.x + xd, y: dy2*t + c.y};
		}
		this.chainFn = [f1, f2];
	}

	initChainLocations(offScreen) {
		this.loc = [];
		this.fastLoc = [];
		for (let loc of this.getChains()) {
			if (!loc) continue;
			let p0, p1;
			if (this.ptype == 'square') {
				const [i,j] = loc;
				p0 = this.chainFn[0](i, this.center);
				p1 = this.chainFn[1](j, p0);
			} else {
				const [i,j,k] = loc;
				p0 = this.chainFn[1](k, this.center);
				p1 = this.chainFn[2](j, p0);
			}
			if (!this.inScreenLimits(p1, offScreen)) continue;
			addLoc(this.loc, loc, p1);
			this.fastLoc.push(p1);
		}
	}

	// TODO sometimes it fails for 200 (maybe 300?)
	initCleanBoard(k) {
		let count = 0;
		let finalCount = 0;
		let n;
		let row;
		do {
			n = 0;
			if (++count % 10 == 0) {
				if (count > 100) {
					console.log('Giving up initCleanBoard');
					finalCount++;
					if (k || k == 0) 
						this.gen.retryUpdate();
				}
				if (finalCount > 5) {
					console.log('Final giving up');
					return;
				}
				this.gen.restore();
				if (!k && k !== 0) {
					this.polys.forEach(hex => hex.type = this.gen.get());
				} else {
					this.polys.forEach(hex => {
						if ((this.ptype == 'hex' && hex.chains[2] == k) 
							|| (this.ptype == 'tri' && hex.chains[0] == k)
							|| (this.ptype == 'square' && hex.chains[1] == k)) {
							hex.type = this.gen.get();
						}
					});
				}
			}
			const bad = this.getThreeInARow(true);
			bad.forEach(hex => {
				if ((!k && k !== 0) 
					|| (this.ptype == 'hex' && hex.chains[2] == k) 
					|| (this.ptype == 'tri' && hex.chains[0] == k)
					|| (this.ptype == 'square' && hex.chains[1] == k)) {
					this.gen.putBack(hex.type);
					hex.type = this.gen.get();
					n += 1;
				}
			});
		} while (n > 0);
		this.game.catalog.update(this.polys);
	}

	initFastChains() {
		let chain = [];
		this.chains = [[],[],[]];
		this.chainsSingle = [];
		const n = (this.ptype == 'square') ? 2 : 3;
		for (let loc of this.getChains()) {
			if (!loc) {
				if (chain.length > 1) {
					for (let i=0; i<n; i++) {
						if (chain[0][i] == chain[1][i]) {
							this.chains[i].push(chain);
							break;
						}
					}
				} else if (chain.length > 0) {
					if (indexOfArrayElts(this.chainsSingle, chain) == -1) {
						this.chainsSingle.push(chain[0]);
					}
				}
				chain = [];
			} else {
				if (queryIndex(this.loc, loc)) chain.push(loc);
			}
		}
		this.initFastChainsFinal();
	}

	initFastChainsFinal() {
		this.chainsFall = [];
		const n = (this.ptype == 'square') ? 2 : 3;
		// Flip or disable chains
		for (let i=0; i<n; i++) {
			const idx0 = queryIndex(this.chains, [i,0,0]);
			const idx1 = queryIndex(this.chains, [i,0,1]);
			const p0 = queryIndex(this.loc, idx0);
			const p1 = queryIndex(this.loc, idx1);
			if (this.ptype == 'tri') {
				if (this.chains[i][0].length > 2) {
					const p2 = queryIndex(this.loc, queryIndex(this.chains, [i,0,2]));
					if (p0.y > p2.y) {
						this.chains[i].map(chain => chain.reverse());
					}
					if (!approxEq(p0.y, p2.y)) {
						this.chainsFall[i] = this.chains[i];
					}
				}
			} else {
				if (p0.y > p1.y) {
					this.chains[i].map(chain => chain.reverse());
				}
				if (!approxEq(p0.y, p1.y)) {
					this.chainsFall[i] = this.chains[i];
				} 
			}
		}
		this.chains = this.chains.flat(1);
		this.chainsFall = this.chainsFall.flat(1);
	}

	inLimits(chains) {
		if (this.ptype == 'square') {
			const [i,j] = chains;
			return i >= this.limits.i[0] && i <= this.limits.i[1] 
				&& j >= this.limits.j[0] && j <= this.limits.j[1];
		} else {
			const [i,j,k] = chains;
			return i >= this.limits.i[0] && i <= this.limits.i[1] 
				&& j >= this.limits.j[0] && j <= this.limits.j[1] 
				&& k >= this.limits.k[0] && k <= this.limits.k[1];
		}
	}

	inScreenLimits(pCenter, allowOffScreen) {
		if (this.ptype == 'tri') {
			const d = (allowOffScreen) ? 2*Math.sqrt(3)/2*this.size : -Math.sqrt(3)/2*this.size-10;
			return pCenter.x > this.size/2 
				&& pCenter.x < this.dim.w - this.size/2 
				//&& pCenter.y > 100+Math.sqrt(3)/4*this.size 
				&& pCenter.y < this.dim.h + d;
		} else if (this.ptype == 'hex') {
			const d = (allowOffScreen) ? 2*this.size : -this.size;
			return pCenter.x > this.size/2 
				&& pCenter.x < this.dim.w - this.size/2
				//&& pCenter.y > 100+this.size 
				&& pCenter.y < this.dim.h + d;
		} else if (this.ptype == 'square') {
			const d = (allowOffScreen) ? 2*this.size : -this.size/2;
			return pCenter.x > this.size/2 
				&& pCenter.x < this.dim.w - this.size/2
				//&& pCenter.y > 100+this.size /2
				&& pCenter.y < this.dim.h + d;
		}
	}

	mousemove(p) {
		const hex = this.findPoly(p);
		this.hovering = hex;
	}

	makeRandomTypeGenerator(type, layers) {
		let n = [100, 100, 100, 100, 100, 100];
		let maxType = 6;
		if (type == 'square') {
			switch (layers) {
				case 3: n = [3, 3, 3, 0, 0, 0]; maxType=4; break;
				case 4: n = [3, 3, 3, 3, 4, 0]; maxType=5; break;
				case 5: n = [4, 4, 4, 4, 3, 6]; maxType=6; break;
			}
		} else if (type == 'tri') {
			switch (layers) {
				case 2: n = [3, 3, 3, 0, 0, 0]; maxType=4; break;
				case 3: n = [3, 3, 3, 3, 4, 0]; maxType=5; break;
				case 4: n = [4, 4, 4, 4, 3, 6]; maxType=6; break;
			}
		} else if (type == 'hex') {
			switch (layers) {
				case 4: n = [4, 3, 3, 0, 0, 0]; maxType=4; break;
				case 5: n = [3, 3, 3, 3, 3, 0]; maxType=5; break;
				case 6: n = [4, 4, 4, 3, 3, 3]; maxType=6; break;
			}
		}
		let nSav = [...n];
		//shuffleArray(n);
		const get = function() {
			const start = Math.floor(Math.random()*types.length);
			for (let i=0; i<6; i++) {
				const idx = (i+start)%6;
				if (n[idx]) {
					n[idx]--;
					return types[idx];
				}
			}
			throw Error('None left');
		}
		const putBack = function(type) {
			n[types.indexOf(type)]++;
		}
		let hexesSav = null;
		let nAddSav = null;
		const update = function(hexes, nAdd) {
			hexesSav = hexes;
			nAddSav = nAdd;
			n = [0,0,0,0,0,0];
			const have = [0,0,0,0,0,0];
			hexes.forEach(hex => {
				const idx = types.indexOf(hex.type);
				have[idx]++;
			});
			const workingSet = [];
			for (let i=0; i<have.length; i++) {
				if (have[i]%3) workingSet.push([i, have[i]%3]);
			}
			while ((nAdd < 6 && workingSet.length < 2) || (nAdd < 10 && workingSet.length < 3) || workingSet.length < 4) {
				const idx = Math.floor(Math.random()*maxType);
				if (workingSet.map(h => h[0]).indexOf(idx) == -1) {
					workingSet.push([idx, 0]);
				}
			}
			// Get to mod3
			workingSet.forEach(h => {
				while ((!h[1] || h[1]%3 != 0) && nAdd>0) {
					n[h[0]]++;
					h[1]++;
					nAdd--;
				}
			});
			// Add one-by-one
			for (let i=0; nAdd>0; i++) {
				const h = workingSet[i%workingSet.length];
				n[h[0]]++;
				h[1]++;
				nAdd--;
			}
			// Change any singletons or doubles to an existing type
			workingSet.forEach(h => {
				if (have[h[0]] == 0 && h[1]<3) {
					n[h[0]] -= h[1];
					for (let i=0; i<have.length; i++) {
						if (have[i]) {
							n[i] += h[1];
							break;
						}
					}
				}
			});
			// No single type rows
			if (n.filter(num => num).length == 1) {
				n[n.indexOf(0)] += 2;
			}
			nSav = [...n];
		}
		const restore = function() {
			n = [...nSav];
		}
		const inventory = function() {
			return n;
		}
		const retryUpdate = function() {
			update(hexesSav, nAddSav+1);
		}
		return {get, putBack, update, restore, inventory, retryUpdate};
	}

	pause() {
		this.paused = true;
	}

	pressButtons(evt) {
		if (this.polys.length > 0) {
			if (!this.hovering || !this.hovering instanceof HexPoly) {
				this.hovering = this.polys[0];
			}
			if (evt.axes[0] || evt.axes[1]) this.scanForPoly();
			//if (evt.axes[1]) this.scanForPoly(1);
			if (evt.B) {
				this.swapping = !this.swapping;
				if (this.swapping) this.selected = this.hovering;
			}
			if ((evt.axes[0] || evt.axes[1]) && this.swapping && this.hovering) {
				this.click(this.hovering.center);
				if (this.selected) 
					this.hovering = this.selected;
			}
			if (evt.A && this.hovering) {
				this.rightClick(this.hovering.center);
			}
			if (evt.Sel) {
				this.game.showMenu();
			}
		}
	}

	resize(size) {
		this.polys.map(hex => {
			hex.resize(size);
			hex.attract(this.center, size/this.size);
		});
		this.size = size;
	}

	scanForPoly() {
		if (!this.hovering) return;
		const p = this.hovering.center;
		const dirx = this.game.pad.axes[0];
		const diry = this.game.pad.axes[1];
		for (let i=1; i<6; i++) {
			for (let j=0; j<this.polys.length; j++) {
				const poly = this.polys[j];
				//const q = (axis == 0) ? {x: p.x+dir*i*this.size/2, y: p.y} : {x: p.x, y: p.y+dir*i*this.size/2};
				const q = {x: p.x+dirx*i*this.size/2, y: p.y+diry*i*this.size/2};
				if (poly.contains(q)) {
					if (poly == this.hovering) 
						break;
					this.hovering = poly;
					return;
				}
			}
		}
	}

	scheduleExpand() {
		const timer = this.game.catalog.getTimer('Tectonic Activity');
		if (!timer.active || (timer.active && timer.time > 5))
			timer.start(5);
	}

	solveable() {
		let canSolve = false;
		this.game.catalog.items.forEach(item => {
			if (item.count != 0 && item.count >= 3) canSolve = true;
		});
		return canSolve;
	}

	swap(hex1, hex2) {
		addLoc(this.polyMap, [...hex2.chains], hex1);
		addLoc(this.polyMap, [...hex1.chains], hex2);
		[hex1.chains, hex2.chains] = [hex2.chains, hex1.chains];
		[hex1.center, hex2.center] = [hex2.center, hex1.center];
		hex1.fixed = false;
		hex2.fixed = false;
		this.fixed = this.fixed.filter(hex => {
			if (hex == hex1 || hex == hex2) return false;
			else return true;
		});
		this.game.catalog.getCounter('Moves').count++;
		this.game.sounds.play('swap', {keep: true});
	}

	unfreeze() {
		this.polys.forEach(hex => {
			if (hex.frozen) {
				hex.frozen = false;
				this.game.catalog.getCounter('Freezes').count++;
			}
		});
		this.clear();
		this.fall();
	}
}

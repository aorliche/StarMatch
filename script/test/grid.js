
var colors = ['#f77','#7f7','#77f','#cc7','#7cc','#c7c'];//,'#a00','#0a0','#00a'];

class Poly {
    constructor(params) {
        this.params = {...params};
        this.recalcBoundary();
    }

    contains(p) {
		for (let i=0; i<this.points.length; i++) {
			if (ccw(this.points[i], this.points[(i+1)%this.points.length], p) < 0) {
				return false;
			}
		}
		return true;
    }

    drawCoords(ctx, xform) {
        const center = xform(this.params.center);
        ctx.fillStyle = '#333';
        ctx.fillText(this.params.pairstr, center.x, center.y);
    }

    drawHard(ctx, xform) {
        const center = xform(this.params.center);
        ctx.fillStyle = '#333';
        ctx.fillText(this.hard, center.x, center.y);
    }

    // xform is the screen transform (adjust center, flip y about center)
    draw(ctx, xform) {
        if (this.empty) {
            this.drawCoords(ctx, xform);
            return;
        }
		ctx.beginPath();
		const start = xform(this.points[0]);
		ctx.moveTo(start.x, start.y);
		this.points.map(p => {
            p = xform(p);
			ctx.lineTo(p.x, p.y);
		});
		ctx.closePath();
        /*if (this.hard) {
            ctx.strokeStyle = '#775';
            ctx.lineWidth = 4;
        } else {
            ctx.strokeStyle = '#775';
            ctx.lineWidth = 1;
        }*/
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.stroke();
        if (this.hard) {
            this.drawHard(ctx, xform);
        }
        //this.drawCoords(ctx, xform);
    }
}

class Tri extends Poly {
    constructor(params) {
        super(params);
    }

	recalcBoundary() {
		this.points = [];
        const c = this.params.center;
        const size = this.params.size/Math.sqrt(3);
        const angle = this.params.angle;
		const invert = this.params.up ? 0 : Math.PI;
		for (let i=0; i<3; i++) {
			this.points.push({
				x: c.x + size*Math.cos(i*2*Math.PI/3+angle+invert+Math.PI/6), 
				y: c.y + size*Math.sin(i*2*Math.PI/3+angle+invert+Math.PI/6)
			});
		}
	}
}

class Hex extends Poly {
    constructor(params) {
        super(params);
    }
	
    recalcBoundary() {
		this.points = [];
        const c = this.params.center;
        const size = this.params.size;
        const angle = this.params.angle;
		for (let i=0; i<6; i++) {
			this.points.push({
				x: c.x + size*Math.cos(i*Math.PI/3+angle+Math.PI/6), 
				y: c.y + size*Math.sin(i*Math.PI/3+angle+Math.PI/6)
			});
		}
	}
}

class Square extends Poly {
    constructor(params) {
        super(params);
    }
	
    recalcBoundary() {
		this.points = [];
        const c = this.params.center;
        const size = this.params.size/Math.sqrt(2);
        const angle = this.params.angle;
		for (let i=0; i<4; i++) {
			this.points.push({
				x: c.x + size*Math.cos(i*Math.PI/2+angle+Math.PI/4), 
				y: c.y + size*Math.sin(i*Math.PI/2+angle+Math.PI/4)
			});
		}
	}
}

class Animator {
    constructor(grid, ctx, dim) {
        this.grid = grid;
        this.grid.anim = this;
        this.ctx = ctx;
        this.ctx.font = '10px Sans-serif';
        this.dim = {...dim};
        this.running = false;
        this.polys = [];
        this.clearing = [];
        this.messages = [];
        this.FALLSPEED = 5;
        this.CLEARSPEED = 8;
        this.CLEARREMOVE = 200;
        this.MSGSTART = dim.h/7;
        this.MSGSPACE = 15;
    }

    animate() {
        this.polys = this.polys.filter(p => {
            // params.center can be set to .to and .to can be set to null in clear()
            if (!p.to) return false;
            const r = sub(p.to, p.params.center);
            const rmag = len(r);
            if (rmag < this.FALLSPEED) {
                p.params.center = {...p.to};
                p.recalcBoundary();
                p.to = null;
                return false;
            } else {
                p.params.center = add(p.params.center, mul(r, this.FALLSPEED/rmag));
                p.recalcBoundary();
                return true;
            }
        });
        this.clearing = this.clearing.filter(p => {
            p.params.center.y -= this.CLEARSPEED;
            if (p.params.center.y < -this.grid.params.dim.h/2-this.CLEARREMOVE)
                return false;
            else {
                p.recalcBoundary();
                return true;
            }
        });
        this.messages = this.messages.filter(msg => {
            msg.tick();
            if (msg.time < 0) {
                this.messages.forEach(m => m.pos.y -= msg.dim.h+this.MSGSPACE);
                return false;
            }
            return true;
        });
        this.grid.tick();
        this.repaint();
        if (this.running) 
            requestAnimationFrame(e => this.animate());
    }

    clear(poly) {
        this.clearing.push(new this.grid.kls(poly.params));
        this.clearing.at(-1).params.center = {...poly.params.center};
        this.clearing.at(-1).color = poly.color;
        this.clearing.at(-1).empty = false;
    }

    fall(poly, to) {
        poly.to = {...to};
        this.polys.push(poly);
    }

    // Grid coordinates
    message(text) {
        const start = this.messages.reduce((prev, cur) => prev + cur.dim.h + this.MSGSPACE, this.MSGSTART);
        const msg = new Message({
            text: text, 
            pos: {x: 0, y: start}, 
            fontSize: '24',
            fontWeight: 'Bold',
            ctx: this.ctx, 
            xform: p => this.grid.xform(p)});
        this.messages.push(msg);
    }

    start() {
        if (this.running) return;
        this.running = true;
        requestAnimationFrame(e => this.animate());
    }

    stop() {
        this.running = false;
    }
    
    repaint() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0,0,this.dim.w,this.dim.h);
        this.grid.draw(this.ctx, 'red');
        this.messages.forEach(msg => msg.draw(this.ctx));
    }
}

// Space Weather
class Weather {
    constructor(time, npoly, type) {
        this.time = time;
        this.npoly = npoly;
        this.type = type;
        this.systems = [this];
        this.hardratio = 0.2;
        this.hardlevel = 3;
    }

    add(time, npoly, type) {
        this.systems.push(new Weather(time, npoly, type));
        return this;
    }
}

class Message {
    constructor(params) {
        console.assert(params.ctx);
        console.assert(params.pos);
        this.params = params;
        this.pos = params.pos;
        this.dim = null;
        this.time = params.time ?? 120;
        this.text = params.text ?? 'empty';
		this.color = params.color ?? '#333';
		this.fontFamily = params.fontFamily ?? 'Sans';
		this.fontSize = params.fontSize ?? 16;
		this.fontWeight = params.fontWeight ?? '';
		this.ctx = params.ctx;
        this.xform = params.xform ?? null;
		this.pack();
    }

	draw(ctx) {
        ctx.save();
        if (this.alpha || this.alpha === 0) ctx.globalAlpha = this.alpha;
		let p = {x: this.pos.x, y: this.pos.y-this.ascent};
        if (this.xform) p = this.xform(p);
		ctx.font = this.font;
		ctx.fillStyle = this.color;
		ctx.fillText(this.text, p.x, p.y);
        ctx.restore();
	}

	get font() {
		return `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}, sans-serif`;
	}

	pack() {
        this.ctx.save();
		this.ctx.font = this.font;
		const tm = this.ctx.measureText(this.text);
		this.ascent = tm.actualBoundingBoxAscent;
		this.descent = tm.actualBoundingBoxDescent;
        this.pos.x = this.pos.x-tm.width/2;
        this.dim = {w: tm.width, h: this.ascent+this.descent};
        this.ctx.restore();
	}

    tick() {
        this.time--;
    }
}

class Timer {
    constructor(params) {
        console.assert(params.cb);
        this.end = params.end ?? null;
        this.loop = params.loop ?? false;
        this.paused = params.paused ?? false;
    }

    pause() {
        this.paused = true;
    }

    reset() {
        this.time = 0;
    }

    start() {
        this.paused = false;
    }

    tick() {
        if (this.paused)
            return;
        this.time++;
        if (this.time == this.end) {
            this.cb();
            if (this.loop) 
                this.reset();
        }
    }
}

class FadeInOut {
    constructor(target, triplet) {
        this.target = target;
        this.triplet = triplet;
        this.rate1 = triplet[0] > 0 ? 1/triplet[0] : 0;
        this.rate2 = triplet[2] > 0 ? 1/triplet[2] : 0;
        this.time = 0;
        this.target.alpha = 0;
    }

    tick() {
        this.time++;
        if (this.time < this.triplet[0]) {
            this.target.alpha = this.rate1*this.time;
        } else if (this.time < this.triplet[0] + this.triplet[1]) {
            this.target.alpha = 1;
        } else if (this.time < this.triplet[0] + this.triplet[1] + this.triplet[2]) {
            this.target.alpha = this.rate2*(this.triplet[0]+this.triplet[1]+this.triplet[2]-this.time);
        } else {
            this.target.alpha = 0;
            return false;
        }
        return true;
    }
}

class Grid {
    constructor(params) {
        this.center = point(params.dim.w/2, params.dim.h/2);
        this.params = {...params};
        this.EMPTYTOP = -300;
        this.TOPPADDING = 200;
        this.time = -200;
        this.weather = new Weather(120, 1).add(600, 5, 'point').add(1500, 25);
        switch (params.type) {
            case 'tri': this.initTri(); this.kls = Tri; break;
            case 'square': this.initSquare(); this.kls = Square; break;
            case 'hex': this.initHex(); this.kls = Hex; break;
        }
        this.makePolys();
        this.cacheNeighbors();
        this.assignColors();
        this.messages = {levelIntro: new Message({
                text: 'Welcome to Level 1',
                pos: point(0, this.params.dim.h/2-50),
                fontSize: '32',
                fontWeight: 'Bold',
                ctx: this.params.ctx, 
                xform: p => this.xform(p)
            }
        )};
        this.effects = [new FadeInOut(this.messages.levelIntro, [180,240,180])];
    }

    assignColors() {
        // Offscreen get no colors
        const centers = this.centers.filter(c => !c.poly.empty);
        centers.sort((a,b) => {
            const [ai,aj] = strpair(a.pairstr);
            const [bi,bj] = strpair(b.pairstr);
            if (ai-bi != 0) return ai-bi;
            if (aj-bj != 0) return aj-bj;
            return -1;
        });
        centers.forEach(c => {
            const taken = c.neighbors.map(n => n.poly.color);
            const start = randint(0,colors.length);
            for (let i=0; i<colors.length; i++) {
                const cidx = (start+i)%colors.length;
                if (!taken.includes(colors[cidx])) {
                    c.poly.color = colors[cidx];
                    return;
                }
            }
            console.log('bad color assign');
            color = '#000';
        });
    }

    cacheNeighbors() {
        this.centers.forEach(c => {
            c.neighbors = this.findNeighbors(c);
        });
    }

    // Each anchor contains either 1 (square, hex) or 2 (tri) centers
    get centers() {
        const cs = [];
        for (const pairstr in this.map) {
            this.map[pairstr].forEach(c => {
                cs.push(c);
            });
        }
        return cs;
    }

    clear() {
        this.matched.forEach(grp => {
            grp.forEach(c => {
                this.clearCenter(c);
            });
        });
    }

    clearCenter(c, blast) {
        if (!blast && c.poly.hard) {
            c.poly.hard--;
            return;
        }
        c.poly.empty = true;
        // This avoids major problems with grid getting confused
        if (c.poly.to) {
            c.poly.params.center = c.poly.to;
            c.poly.to = null;
        }
        if (c.poly == this.selected) this.selected = null;
        this.anim.clear(c.poly);
    }

    // TODO no select falling?
    click(p) {
        p = this.xforminv(p);
        let found = false;
        this.centers.forEach(c => {
            if (!found && c.poly && c.poly.contains(p)) {
                c.neighbors.forEach(n => {
                    if (!found && n.poly == this.selected) {
                        this.swapPolys(c, n);
                        this.selected = c.poly;
                        found = true;
                    }
                });
                if (!found) {
                    this.selected = (!c.poly.empty) ? c.poly : null;
                    found = true;
                }
            }
        });
    }

    rightClick(p) {
        p = this.xforminv(p);
        let found = false;
        this.centers.forEach(c => {
            if (!found && c.poly && c.poly.contains(p)) {
                c.neighbors.forEach(n => this.clearCenter(n));
                this.clearCenter(c, true);
                found = true;
            }
        });
    }

    // Game coordinates
    contains(p) {
        if (p.x > -this.params.dim.w/2 
            && p.x < this.params.dim.w/2 
            && p.y > -this.params.dim.h/2
            && p.y < this.params.dim.h/2) 
            return true;
        else
            return false;
    }

    // Game coordinates
    containsBucket(p, dy) {
        if (!dy) dy = 0;
        if (p.x > -this.params.dim.w/2 
            && p.x < this.params.dim.w/2 
            && p.y > -this.params.dim.h/2
            && p.y < this.params.dim.h/2+dy)
            return true;
        else
            return false;
    }

    draw(ctx, color) {
        this.centers.forEach(c => {
            fillCircle(ctx, this.xform(c), 2, color);
            if (c.poly) 
                c.poly.draw(ctx, p => this.xform(p));
        });
        this.anim.clearing.forEach(p => {
            p.draw(ctx, p => this.xform(p));
        });
        for (let msgname in this.messages) {
            this.messages[msgname].draw(ctx);
        };
    }

    fall() {
        const cs = this.centers;
        // Empty locations pull in polys from above them
        cs.sort((a,b) => {
            const d = a.y - b.y;
            if (Math.abs(d) < 10) return Math.random()-0.5;
            else return d;
        });
        cs.forEach(c => {
            if (!c.poly.empty) return;
            if (!this.containsBucket(c, this.TOPPADDING)) return;
            // Clear takes care of setting .to to null, and anim removes null .tos
            // Only true for empty polys!
            console.assert(!c.poly.to);
            // Shuffle order
            c.neighbors.sort(() => Math.random() - 0.5);
            // No double filling for a single hole
            let filled = false;
            c.neighbors.forEach(n => {
                // Check that we haven't already filled hole
                if (!filled && !n.poly.empty && n.poly != this.selected && n.y > c.y && !n.poly.to) {
                    this.swapPolys(c, n, true);
                    filled = true;
                }
            });
        });
    }

    // For centers, not polys, meaning we don't have to recalculate on every modification
    findNeighbors(c) {
        const [i,j] = strpair(c.pairstr);
        const ns = [];
        for (let ii=i-1; ii<=i+1; ii++) {
            for (let jj=j-1; jj<=j+1; jj++) {
                try { // Some indices are outside of grid
                    this.map[pairstr([ii,jj])].forEach(cc => {
                        const d = len(sub(c,cc));
                        // Like this for triangles, which can be in the same map group
                        if (d < this.neighborDistance && d > 1) {
                            ns.push(cc);
                        }
                    });
                } catch (e) {}
            }
        }
        return ns;
    }

    initHex() {
        this.map = {};
        for (let i=this.params.irange[0]; i<=this.params.irange[1]; i++) {
            for (let j=this.params.jrange[0]; j<=this.params.jrange[1]; j++) {
                const s = this.params.size*Math.sqrt(3);
                const x = (i+j/2)*s;
                const y = j*s*Math.sqrt(3)/2;
                const c = rotate(point(x, y), this.params.angle);
                const str = pairstr([i,j]);
                c.pairstr = str;
                this.map[str] = [c];
            }
        }
    }

    initSquare() {
        this.map = {};
        for (let i=this.params.irange[0]; i<=this.params.irange[1]; i++) {
            for (let j=this.params.jrange[0]; j<=this.params.jrange[1]; j++) {
                const s = this.params.size;
                const x = i*s;
                const y = j*s;
                const c = rotate(point(x, y), this.params.angle);
                const str = pairstr([i,j]);
                c.pairstr = str;
                this.map[str] = [c];
            }
        }
    }

    initTri() {
        this.map = {};
        for (let i=this.params.irange[0]; i<=this.params.irange[1]; i++) {
            for (let j=this.params.jrange[0]; j<=this.params.jrange[1]; j++) {
                const s = this.params.size;
                const x = (i+j/2)*s;
                const y = j*s*Math.sqrt(3)/2;
                const c1 = rotate(point(x+s/2, y+s/2/Math.sqrt(3)), this.params.angle);
                const c2 = rotate(point(x+s, y+s/Math.sqrt(3)), this.params.angle);
                const str = pairstr([i,j]);
                c1.up = false;
                c2.up = true;
                c1.pairstr = str;
                c2.pairstr = str;
                this.map[str] = [c1,c2];
            }
        }
    }

    makePolys() {
        this.centers.forEach(c => {
            const p = new this.kls({center: {...c}, size: this.params.size, angle: this.params.angle, 
                up: c.up, pairstr: c.pairstr});
            c.poly = p;
            if (!this.containsBucket(c, this.EMPTYTOP)) c.poly.empty = true;
        });
    }

    // Get each astron type individually
    get matched() {
        function growGroupTri(group, visited) {
            group.at(-1).neighbors.forEach(n => {
                if (!n.poly.empty && group.at(-1).poly.color == n.poly.color && !visited.includes(n)) {
                    group.push(n);
                    visited.push(n);
                    growGroupTri(group, visited);
                }
            });
        }
        function growGroup(group, c, i, j, di, dj) {
            const [ii,jj] = [i+di,j+dj];
            const npairstr = pairstr([ii,jj]);
            c.neighbors.forEach(n => {
                if (!n.poly.empty && c.poly.color == n.poly.color && n.pairstr == npairstr) {
                    group.push(n);
                    growGroup(group, n, ii, jj, di, dj);
                }
            });
        }
        // TODO Selected should be astrons types
        //const selected = this.centers.filter(c => c.poly && c.poly.selected);
        const groups = [];
        const visited = [];
        this.centers.forEach(s => {
            if (!s.poly.empty && !visited.includes(s)) {
                if (this.params.type == 'tri') {
                    groups.push([s]);
                    visited.push(s);
                    growGroupTri(groups.at(-1), visited);
                } else if (this.params.type == 'square') {
                    const [i,j] = strpair(s.pairstr);
                    groups.push([s]);
                    growGroup(groups.at(-1), s, i, j, 0, 1);
                    growGroup(groups.at(-1), s, i, j, 0, -1);
                    groups.push([s]);
                    growGroup(groups.at(-1), s, i, j, 1, 0);
                    growGroup(groups.at(-1), s, i, j, -1, 0);
                } else if (this.params.type == 'hex') {
                    const [i,j] = strpair(s.pairstr);
                    groups.push([s]);
                    growGroup(groups.at(-1), s, i, j, 0, 1);
                    growGroup(groups.at(-1), s, i, j, 0, -1);
                    groups.push([s]);
                    growGroup(groups.at(-1), s, i, j, 1, 0);
                    growGroup(groups.at(-1), s, i, j, -1, 0);
                    groups.push([s]);
                    growGroup(groups.at(-1), s, i, j, 1, -1);
                    growGroup(groups.at(-1), s, i, j, -1, 1);
                }
            }
        });
        // Find only matches of 3 or greater and remove duplicates
        groups.forEach(g => g.sort((a,b) => a.y-b.y));
        return groups
            .filter(g => g.length > 2)
            .filter((g, idx, grps) => {
                for (let i=0; i<grps.length; i++) {
                    // This is why we need the sort above
                    // Shortcut just match first and last
                    if (g[0] == grps[i][0] && g.at(-1) == grps[i].at(-1)) {
                        return i == idx;
                    }
                }
            });
    }

    get neighborDistance() {
        const tol = 1;
        switch(this.params.type) {
            case 'tri': return this.params.size/Math.sqrt(3)+tol;
            case 'square': return this.params.size+tol;
            case 'hex': return this.params.size*Math.sqrt(3)+tol;
        }
    }

    rotate(theta) {
        this.centers.forEach(c => {
            const upd = rotate(c, theta);
            c.x = upd.x;
            c.y = upd.y;
            if (c.poly) {
                const updPoly = rotate(c.poly.params.center, theta);
                c.poly.params.center = updPoly;
                c.poly.params.angle += theta;
                c.poly.recalcBoundary();
                if (c.poly.to) {
                    const updTo = rotate(c.poly.to, theta);
                    c.poly.to = updTo;
                }
            }
        });
    }

    shower() {
        this.time++;
        if (this.time <= 0) 
            return;
        const above = this.centers
            .filter(c => this.containsBucket(c, this.TOPPADDING))
            .filter(c => !this.contains(c));
        this.weather.systems
            .filter(w => this.time % w.time == 0).forEach(w => {
                let aboveCopy = [...above];
                if (w.type == 'point') {
                    const pc = aboveCopy[Math.floor(Math.random()*aboveCopy.length)];
                    aboveCopy = aboveCopy.filter(c => len(sub(c,pc)) < 100);
                } else {
                    const maxy = aboveCopy.reduce((prev, c) => (c.y > prev) ? c.y : prev, 0);
                    aboveCopy = aboveCopy.filter(c => maxy-c.y > 50);
                }
                let idcs = [...Array(aboveCopy.length).keys()];
                idcs.sort((a,b) => Math.random()-0.5);
                idcs.slice(0,w.npoly).forEach(i => {
                    const c = aboveCopy[i];
                    c.poly.empty = false;
                    c.poly.hard = Math.random() > (1-w.hardratio) ? w.hardlevel : 0;
                    c.poly.color = randomChoice(colors);
                });
            });
    }

    swapPolys(c1, c2, fall) {
        const cTo = {...c1.poly.params.center};
        const cFrom = {...c2.poly.params.center};
        [c1.poly.params, c2.poly.params] 
            = [{...c2.poly.params}, {...c1.poly.params}];
        c1.poly.params.center = cFrom;
        c2.poly.params.center = cTo;
        if (fall) {
            c2.poly.params.center = {...cFrom};
            this.anim.fall(c2.poly, cTo);
        }
        c1.poly.recalcBoundary();
        c2.poly.recalcBoundary();
        [c1.poly, c2.poly] = [c2.poly, c1.poly];
    }

    tick() {
        this.shower();
        this.fall();
        this.clear();
        this.effects = this.effects.filter(e => {
            return e.tick();
        });
    }

    // Add center and flip y about center y
    xform(p) {
        const pp = add(p, this.center);
        pp.y = 2*this.center.y-pp.y;
        return pp;
    }

    // From screen coordinates to world coordinates
    xforminv(p) {
        const pp = sub(p, this.center);
        pp.y = -pp.y;
        return pp;
    }
}

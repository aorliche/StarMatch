
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

    drawSelected(ctx, xform) {
        this.makePath(ctx, xform);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    // xform is the screen transform (adjust center, flip y about center)
    draw(ctx, xform) {
        if (this.empty) {
            this.drawCoords(ctx, xform);
            return;
        }
        this.makePath(ctx, xform);
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
        if (this.hard) {
            this.drawHard(ctx, xform);
        }
        //this.drawCoords(ctx, xform);
    }

    makePath(ctx, xform) {
        ctx.beginPath();
        const start = xform(this.points[0]);
        ctx.moveTo(start.x, start.y);
        this.points.map(p => {
            p = xform(p);
            ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
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
    message(text, time) {
        const start = this.messages.reduce((prev, cur) => prev + cur.dim.h + this.MSGSPACE, this.MSGSTART);
        const msg = new Message({
            text: text, 
            pos: {x: 0, y: start}, 
            fontSize: '24',
            fontWeight: 'Bold',
            time: time ?? null,
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

class Control {
    constructor(params) {
        this.pos = params.pos ? {...params.pos} : null;
        this.dim = params.dim ? {...params.dim} : {w: 0, h: 0};
		this.color = params.color ?? '#000';
        this.bgColor = params.bgColor ?? null;
        this.bgAlpha = params.bgAlpha ?? null;
        this.strokeStyle = params.strokeStyle ?? null;
        this.lineWidth = params.lineWidth ?? null;
    }
}

class ImageControl extends Control {
    constructor(params) {
        super(params);
        this.img = params.img;
        this.dim = params.dim ?? null;
    }
    
    draw(ctx) {
        if (this.bgColor) {
            ctx.fillStyle = this.bgColor;
            ctx.fillRect(this.pos.x, this.pos.y, this.dim.w, this.dim.h);
        }
        const dim = this.calcDim();
        ctx.drawImage(this.img, this.pos.x, this.pos.y, dim.w, dim.h);
    }

    calcDim() {
        let [w,h] = this.dim 
            ? scaleImage(this.img.width, this.img.height, this.dim.w, this.dim.h) 
            : [this.img.width, this.img.height];
        return {w: w, h: h};
    }
}

class TextControl extends Control {
	// ctx required for measuring text
	constructor(params) {
		super(params);
		this.text = params.text;
		this.fontFamily = params.fontFamily ?? 'sans-serif';
		this.fontSize = params.fontSize ?? 16;
		this.fontWeight = params.fontWeight ?? '';
		this.ctx = params.ctx;
		this.pack();
	}

	draw(ctx) {
		const p = {x: this.pos.x, y: this.pos.y+this.ascent};
        ctx.save();
		ctx.font = this.font;
		ctx.fillStyle = this.color;
		ctx.fillText(this.text, p.x, p.y);
        ctx.restore();
	}

	get font() {
		return `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}, sans-serif`;
	}

	pack(pass) {
		this.ctx.font = this.font;
		const tm = this.ctx.measureText(this.text);
		this.ascent = tm.actualBoundingBoxAscent;
		this.descent = tm.actualBoundingBoxDescent;
		this.dim.w = tm.width;
		this.dim.h = this.ascent + this.descent;
	}
}

class TextCounterControl extends TextControl {
    constructor(params) {
        super(params);
        this.countPriv = params.count;
        this.textSav = this.text;
        this.count = this.countPriv;
    }

    get count() {
        return this.countPriv;
    }

    set count(count) {
        this.countPriv = count;
        this.text = this.textSav + ' ' + this.countPriv;
        this.pack();
    }
}

// Passed dim is for image, pos is for text, text calculates own dim
class ImageCounterControl extends Control {
    constructor(params) {
        super(params);
        this.text = new TextControl({...params});
        this.img = new ImageControl({...params});
        this.padding = params.padding ?? 2;
        this.count = params.count ?? 0;
    }

    draw(ctx) {
        this.text.draw(ctx);
        let pos = {...this.text.pos};
        const imgdim = this.img.calcDim();
        pos.y += (this.text.dim.h-imgdim.h)/2;
        pos.x += this.text.dim.w+this.padding;
        for (let i=0; i<this.count; i++) {
            this.img.pos = pos;
            this.img.draw(ctx);
            pos.x += imgdim.w+this.padding;
        }
    }
}

class ButtonControl extends Control {
    constructor(params) {
        super(params);
        this.text = new TextControl({...params});
        this.pos = params.pos;
        this.dim = params.dim;
        this.cb = params.cb;
        this.pack();
    }

    click() {
        this.cb();
    }

    // Screen coords
    contains(p) {
        if (p.x > this.pos.x
            && p.x < this.pos.x+this.dim.w
            && p.y > this.pos.y
            && p.y < this.pos.y+this.dim.h) 
            return true;
        else
            return false;
    }

    draw(ctx) {
        if (this.bgColor) {
            if (this.hover) {
                ctx.fillStyle = this.color;
                ctx.fillRect(this.pos.x, this.pos.y, this.dim.w, this.dim.h);
                ctx.strokeStyle = this.bgColor;
                ctx.strokeRect(this.pos.x, this.pos.y, this.dim.w, this.dim.h);
                this.text.color = this.bgColor;
            } else {
                ctx.fillStyle = this.bgColor;
                ctx.fillRect(this.pos.x, this.pos.y, this.dim.w, this.dim.h);
                this.text.color = this.color;
            }
        } 
        this.text.draw(ctx);
    }

    pack() {
        this.text.pack();
        const dw = this.dim.w - this.text.dim.w;
        const dh = this.dim.h - this.text.dim.h;
        this.text.pos.x = this.pos.x+dw/2;
        this.text.pos.y = this.pos.y+dh/2+this.text.descent/2;
    }
}

class BoxControl extends Control {
    constructor(params) {
        super(params);
    }

    draw(ctx) {
        /*console.log(this);
        throw 'bad';*/
        if (this.bgColor) {
            ctx.save();
            if (this.bgAlpha) {
                ctx.globalAlpha = this.bgAlpha;
            }
            ctx.fillStyle = this.bgColor;
            ctx.fillRect(this.pos.x, this.pos.y, this.dim.w, this.dim.h);
            ctx.restore();
        }
    }
}

class Timer {
    constructor(params) {
        this.t = params.t0;
        this.paused = params.paused ?? false;
        this.params = {...params};
    }

    reset() {
        this.t = this.params.t0;
    }

    tick() {
        if (this.paused) 
            return;
        if (this.params.tickcb) {
            this.params.tickcb(this.t);
        }
        if (this.t === this.params.tf)  {
            this.params.endcb(this.t);
        }
        this.t += this.params.dt;
    }
}

class Background {
    constructor(grid) {
        this.grid = grid;
        this.time = 0;
        this.START = 0.5;
        this.PERIOD = 80;
        this.sav = 0;
        this.cur = 0;
        this.going = false;
    }

    draw(ctx) {
        let col = '#fff';
        if (this.going) {
            const rat = 255/this.PERIOD*2*(this.sav-this.START)/(1-this.START);
            const t = this.time % this.PERIOD;
            const lvl = Math.floor((t < this.PERIOD/2) ? 255-rat*t : 255-rat*(this.PERIOD-t));
            col = '#ff' + lvl.toString(16) + lvl.toString(16);
        }
        ctx.fillStyle = col;
        ctx.fillRect(0, 0, this.grid.params.dim.w, this.grid.params.dim.h);
    }

    get level() {
        const maxy = this.grid.centers
            .filter(c => c.poly && !c.poly.empty && !c.poly.to)
            .reduce((prev, cur) => cur.poly.params.center.y > prev ? cur.poly.params.center.y : prev, 
                -this.grid.params.dim.h/2);
        return (maxy + this.grid.params.dim.h/2) / this.grid.params.dim.h;
    }

    tick() {
        this.time++;
        if (this.time % this.PERIOD == 0) {
            const lvl = this.level;
            if (lvl >= this.START) {
                this.going = true;
                this.cur = 0;
                this.sav = lvl;
            } else {
                this.going = false;
            }
        }
    }
}

class Grid {
    constructor(params) {
        this.center = point(params.dim.w/2, params.dim.h/2);
        this.params = {...params};
        this.EMPTYTOP = -300;
        this.TOPPADDING = 200;
        this.MAXBLASTS = 8;
        this.time = -10;
        this.weather = new Weather(120, 1).add(600, 5, 'point').add(1500, 25);
        switch (params.type) {
            case 'tri': this.initTri(); this.kls = Tri; break;
            case 'square': this.initSquare(); this.kls = Square; break;
            case 'hex': this.initHex(); this.kls = Hex; break;
        }
        this.makePolys();
        this.cacheNeighbors();
        this.assignColors();
        /*this.messages = {levelIntro: new Message({
                text: 'Welcome to Poly Match',
                pos: point(0, 150),
                fontSize: '32',
                fontWeight: 'Bold',
                ctx: this.params.ctx, 
                xform: p => this.xform(p)
            }
        )};
        this.effects = [new FadeInOut(this.messages.levelIntro, [0,100,0])];*/
        this.blasts = new ImageCounterControl({
            pos: {x: 20, y: 30},
            dim: {w: 30, h: 30},
            fontSize: 20,
            text: 'Blasts:',
            count: 1,
            padding: 2,
            ctx: this.params.ctx,
            img: this.params.assets['blast']
        });
        this.survive = new TextControl({
            pos: {x: this.params.dim.w-120, y: 30},
            fontSize: 20,
            text: 'Time:',
            ctx: this.params.ctx
        });
        this.pause = new ButtonControl({
            pos: {x: this.params.dim.w-115, y: 85},
            dim: {w: 100, h: 30},
            fontSize: 16,
            text: 'Pause',
            bgColor: '#77f',
            color: '#fff',
            ctx: this.params.ctx,
            cb: () => {
                this.paused = !this.paused;
                this.pause.text.text = (this.paused) ? 'Unpause': 'Pause';
                this.pause.pack();
            }
        });
        this.timers = {
            survive: new Timer({
                t0: 1000,
                dt: -1,
                tf: 0,
                tickcb: t => {
                    const ttxt = new Date(t/60*1000).toISOString().substr(14,5);
                    this.survive.text = 'Time: ' + ttxt;
                    this.survive.pack();
                },
                endcb: t => {
                    this.anim.message('You did it!');
                    this.iterations.count++;
                    this.timers.survive.reset();
                }
            })
        };
        this.boxes = [
            new BoxControl({
                pos: point(0,15), 
                dim: dimension(this.params.dim.w, 40), 
                bgColor: '#333', 
                bgAlpha: 0.3
            })
        ];
        this.iterations = new TextCounterControl({
            pos: point(this.params.dim.w-90, 63),
            text: 'Level',
            fontSize: 16,
            count: 1,
            ctx: this.params.ctx
        });
        this.schedule(() => this.anim.message('Click neighboring polys to swap', 400), 0);
        this.schedule(() => this.anim.message('Get 3 in a row to clear', 400), 420);
        this.schedule(() => this.anim.message('Right click to blast!', 400), 840);
        this.bg = new Background(this);
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
            let bonus = grp.length-3;
            if (this.blasts.count+bonus > this.MAXBLASTS) 
                bonus = this.MAXBLASTS-this.blasts.count;
            if (bonus) 
                this.anim.message(`+${bonus} Blasts!`);
            this.blasts.count += bonus;
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

    click(p) {
        // Buttons in screen coords
        if (this.pause.contains(p)) {
            this.pause.click();
            return;
        }
        if (this.paused)
            return;
        // Game in game coords
        p = this.xforminv(p);
        let found = false;
        this.centers.forEach(c => {
            if (!found && c.poly && c.poly.contains(p) && !c.poly.to) {
                if (this.selected) {
                    c.neighbors.forEach(n => {
                        if (!found && n.poly == this.selected) {
                            this.swapPolys(c, n);
                            this.selected = c.poly;
                            found = true;
                        }
                    });
                }
                if (!found) {
                    this.selected = (!c.poly.empty) ? c.poly : null;
                    found = true;
                }
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

    // Right click
    contextmenu(p) {
        if (this.paused) 
            return;
        if (this.blasts.count < 1) 
            return;
        p = this.xforminv(p);
        let found = false;
        this.centers.forEach(c => {
            if (!found && c.poly && !c.poly.empty && c.poly.contains(p)) {
                c.neighbors.forEach(n => this.clearCenter(n));
                this.clearCenter(c, true);
                this.blasts.count--;
                found = true;
            }
        });
    }

    draw(ctx, color) {
        this.bg.draw(ctx);
        this.centers.forEach(c => {
            //fillCircle(ctx, this.xform(c), 2, color);
            if (c.poly && !c.poly.empty) 
                c.poly.draw(ctx, p => this.xform(p));
        });
        if (this.selected) 
            this.selected.drawSelected(ctx, p => this.xform(p));
        if (this.hover) {
            if (this.hover.poly && !this.hover.poly.empty && !this.hover.poly.to) {
                this.hover.poly.drawSelected(ctx, p => this.xform(p));
            }
        }
        this.anim.clearing.forEach(p => {
            p.draw(ctx, p => this.xform(p));
        });
        this.boxes.forEach(b => b.draw(ctx));
        this.blasts.draw(ctx);
        this.survive.draw(ctx);
        this.pause.draw(ctx);
        this.iterations.draw(ctx);
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
            shuffle(c.neighbors);
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
        return groups
            .filter(g => g.length > 2)
            .map(g => new Set(g))
            .filter((g, idx, grps) => {
                for (let i=0; i<grps.length; i++) {
                    let equal = true;
                    g.forEach(c => {
                        if (!grps[i].has(c)) equal = false;
                    });
                    if (equal) {
                        return i == idx;
                    } 
                }
            })
            .map(g => [...g]);
    }

    mousemove(p) {
        // Buttons in screen coords
        this.pause.hover = this.pause.contains(p);
        if (this.paused) {
            this.hover = null;
            return;
        }
        // Assets in game coords
        p = this.xforminv(p);
        this.hover = null;
        this.centers.forEach(c => {
            if (c.poly && c.poly.contains(p)) {
                this.hover = c;
            }
        });
    }

    mouseout() {
        this.pause.hover = false;
        this.hover = null;
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

    schedule(cb, time) {
        let maxidx = 0;
        for (const name in this.timers) {
            if (name.substr(0,6) == 'sched-') {
                const idx = parseInt(name.split('-')[1]);
                if (idx > maxidx) 
                    maxidx = idx;
            }
        }
        const name = 'sched-' + (maxidx+1);
        this.timers[name] = new Timer({
            t0: time,
            dt: -1,
            tf: 0,
            endcb: () => {
                cb();
                delete this.timers[name];
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
                let idcs;
                if (w.type == 'point') {
                    const pc = aboveCopy[Math.floor(Math.random()*aboveCopy.length)];
                    aboveCopy.sort((a,b) => len(sub(a,pc)) < len(sub(b,pc)));
                    idcs = [...Array(w.npoly).keys()];
                } else {
                    const maxy = aboveCopy.reduce((prev, c) => (c.y > prev) ? c.y : prev, 0);
                    aboveCopy = aboveCopy.filter(c => maxy-c.y > 50);
                    idcs = [...Array(aboveCopy.length).keys()];
                    shuffle(idcs);
                }
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
        if (this.paused) 
            return;
        this.shower();
        this.fall();
        this.clear();
        for (const name in this.timers) 
            this.timers[name].tick();
        this.bg.tick();
        /*this.effects = this.effects.filter(e => {
            return e.tick();
        });
        if (this.rotation) {
            this.rotate(this.rotation*Math.PI/180);
        }*/
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

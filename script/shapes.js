function drawCircle(ctx, c, r, color) {
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.arc(c.x, c.y, r, 0, 2*Math.PI);
	ctx.closePath();
	ctx.fill();
}

function drawLine(ctx, from, to, color, width) {
	ctx.strokeStyle = color;
	ctx.lineWidth = width;
	ctx.beginPath();
	ctx.moveTo(from.x, from.y);
	ctx.lineTo(to.x, to.y);
	ctx.stroke();
}

function drawText(ctx, text, p, color, font, stroke) {
	ctx.save();
	if (font) ctx.font = font;
	const tm = ctx.measureText(text);
	ctx.fillStyle = color;
	if (p.ljust) 
		ctx.fillText(text, p.x, p.y);
	else if (p.rjust)
		ctx.fillText(text, p.x-tm.width, p.y);
	else
		ctx.fillText(text, p.x-tm.width/2, p.y);
	if (stroke) {
		ctx.strokeStyle = stroke;
		ctx.lineWidth = 1;
		ctx.strokeText(text, p.x-tm.width/2, p.y);
	}
	ctx.restore();
	return tm;
}

class CatalogItem {
	constructor(type, topLeft, dim) {
		this.type = type;
		this.count = 0;
		this.topLeft = copyPoint(topLeft);
		this.dim = {w: dim.w, h: dim.h};
		this.alpha = 0;
	}

	draw(ctx) {
		const im = images[this.type];
		let [w,h] = scaleImage(im.width, im.height, this.dim.w-10, this.dim.h-20);
		if (this.type == 'planet') {
			w *= 1.2; 
			h *= 1.2;
		}
		/*if (!this.score) {
			ctx.globalAlpha = 0.2;
		} else {*/
			//if (this.alpha > 0) {
				//ctx.strokeStyle = '#4a4a4a';
				//ctx.lineWidth = 2;
				//ctx.fillStyle = pSBC(0.5*Math.max(this.alpha,0), getTypeColor(this.type));
				//ctx.globalAlpha = this.alpha;
				//ctx.fillRect(this.center.x-this.dim.w/2, this.center.y-this.dim.h/2, this.dim.w, this.dim.h);
				//ctx.strokeRect(this.center.x-this.dim.w/2, this.center.y-this.dim.h/2, this.dim.w, this.dim.h);
				//ctx.globalAlpha = 1.0;
			//}
			drawText(ctx, this.count, {x: this.topLeft.x+this.dim.w/2, y: this.topLeft.y+this.dim.h-6}, 'white', 'Bold 12px Sans-Serif');
		//}
		ctx.drawImage(im, this.topLeft.x+this.dim.w/2-w/2, this.topLeft.y+this.dim.h/2-h/2-10, w, h);
	//	ctx.globalAlpha = 1.0;
	}

	frame() {
		this.alpha -= 0.01;
	}

	update(n) {
		this.count += n;
		this.alpha = 1;
	}
}

class Catalog extends MouseListener {
	constructor(game) {
		super();
		this.game = game;
		this.items = [];
		for (let i=0; i<types.length; i++) {
			this.items.push(new CatalogItem(types[i], {x: 160+(20+10)*i, y: 10}, {w: 30, h:50}));
		}
		this.counters = [
			new Counter('Level', '#ddd', {x:460, y:25, rjust:true}, {x:465, y:25, ljust:true}, 18),
			new Counter('Moves', '#ddd', {x:460, y:50, rjust:true}, {x:465, y:50, ljust:true}, 12),
			new Counter('Freezes', '#ddd', {x:460, y:65, rjust:true}, {x:465, y:65, ljust:true}, 12, 3),
		];
		this.buttons = [
			new Button('Menu', '#611', '#ddd', {x: 15, y: 15}, {w: 90, h: 20}, e => this.game.showMenu(), 12),
			new Button('Unfreeze All', '#116', '#ddd', {x: 15, y: 45}, {w: 90, h: 20}, e => this.game.grid.unfreeze(), 12)
		];
		this.timers = [
			new Timer('Tectonic Activity', '#ddd', {x:240, y:80}, 12, 20, 
				timer => {this.game.grid.expandFromBelow()}, 
				e => this.game.animator.start(), true)
		];
	}

	click(p) {
		let found = false;
		this.buttons.forEach(b => {
			if (b.contains(p)) {
				b.hovering = false;
				b.click(p);
				found = true;
			}
		});
		return found;
	}

	draw(ctx) {
		this.items.forEach(item => item.draw(ctx));
		this.buttons.forEach(item => item.draw(ctx));
		this.counters.forEach(item => item.draw(ctx));
		this.timers.forEach(item => item.draw(ctx));
	}
	
	frame() {
		this.items.forEach(item => item.frame());
	}

	get animating() {
		let updating = false;
		this.items.forEach(item => {
			if (item.alpha > 0) {
				updating = true;
			}
		});
		this.timers.forEach(timer => {
			if (timer.active) {
				updating = true;
			}
		});
		return updating;
	}
	
	getButton(name) {
		return this.buttons.filter(b => b.text == name)[0];
	}

	getCounter(name) {
		return this.counters.filter(c => c.text == name)[0];
	}

	getTimer(name) {
		return this.timers.filter(c => c.text == name)[0];
	}

	mousemove(p) {
		this.buttons.forEach(b => {
			b.hovering = b.contains(p);
		});
	}
/*
	score(hex) {
		this.items.forEach(item => {
			if (item.type == hex.type) {
				item.update(1);
			}
		});
	}*/

	update(polys) {
		this.items.forEach(item => item.count = 0);
		polys.forEach(hex => {
			if (!hex.empty) {
				this.items[types.indexOf(hex.type)].count += 1;
			}
		});
	}
}

class Counter {
	constructor(text, color, pText, pCount, fontSize, count) {
		this.text = text;
		this.color = color;
		this.pText = pText;
		this.pCount = pCount;
		this.fontSize = fontSize ?? 16; 
		this.font = `Bold ${this.fontSize}px Sans-Serif`;
		this.count = count ?? 0;
	}

	draw(ctx) {
		drawText(ctx, this.text, this.pText, this.color, this.font);
		drawText(ctx, this.count, this.pCount, this.color, this.font);
	}
}

class Timer {
	constructor(text, color, pText, fontSize, time, cb, loop) {
		this.text = text;
		this.color = color;
		this.pText = pText;
		this.pTime = null;
		this.fontSize = fontSize ?? 12;
		this.font = `Bold ${this.fontSize}px Sans-Serif`;
		this.time = time;
		this.timeSav = time;
		this.cb = cb;
		this.loop = loop;
		this.active = false;
		//this.repaint = repaint;
		this.to = null;
	}

	draw(ctx) {
		if (!this.active || isNaN(this.time) || this.time > 10 || this.time < 0) return;
		const tm = drawText(ctx, this.text, this.pText, this.color, this.font);
		if (this.pTime == null) {
			this.pTime = {x: this.pText.x+tm.width/2+5, y: this.pText.y, ljust:true};
		}
		const text = secondsToString(this.time);
		drawText(ctx, text, this.pTime, this.color, this.font);
	}

	pause() {
		if (this.to) {
			clearTimeout(this.to);
			this.to = null;
		}
	}

	set(time) {
		this.timeSav = time ? time : -1;
	}

	setAndStart(time) {
		this.set(time);
		this.start(time);
	}

	start(time) {
		if (this.to) {
			clearTimeout(this.to);
			this.to = null;
		}
		if (time) {
			this.time = time;
		} else if (time < 0 || isNaN(time)) {
			this.time = -1;
		} else {
			this.time = this.timeSav;
		}
		if (this.time > 0) {
			this.active = true;
			this.tick();
		} else {
			this.active = false;
		}
	}

	tick() {
		this.time--;
		if (this.time >= 0) {
			const me = this;
			this.to = setTimeout(e => me.tick(), 1000);
		} else {
			this.to = null;
			this.active = false;
			console.log(this.time);
			if (!isNaN(this.time)) {
				this.cb(this);
				if (this.loop) {
					this.start(0);
				}
			}
		}
	}

	unpause() {
		if (this.active && !this.to) this.tick();
	}
}

class Button {
	constructor(text, color, hoverColor, topLeft, dim, cb, fontSize) {
		this.text = text;
		this.color = color;
		this.hoverColor = hoverColor;
		this.topLeft = topLeft;
		this.dim = dim;
		this.cb = cb;
		this.hovering = false;
		this.fontSize = fontSize ?? 16; 
		this.font = `Bold ${this.fontSize}px Sans-Serif`;
	}

	click() {
		this.cb();
	}

	contains(p) {
		return p.x > this.topLeft.x && p.x < this.topLeft.x+this.dim.w &&
			p.y > this.topLeft.y && p.y < this.topLeft.y+this.dim.h;
	}

	draw(ctx, hover) {
		if (!hover) hover = this.hovering;
		ctx.strokeStyle = '#4a4a4a';
		ctx.lineWidth = 3;
		ctx.fillStyle = (hover) ? this.hoverColor : this.color;
		ctx.fillRect(this.topLeft.x, this.topLeft.y, this.dim.w, this.dim.h);
		ctx.strokeRect(this.topLeft.x, this.topLeft.y, this.dim.w, this.dim.h);
		const textColor = (hover) ? this.color : this.hoverColor;
		drawText(ctx, this.text, {x: this.topLeft.x+this.dim.w/2, y: this.topLeft.y+this.dim.h/2+this.fontSize/2-2}, textColor, this.font);
	}
}

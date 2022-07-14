
// Control is the base class for all
// Text is used by everything
// These must be non-alphabetical

class Control extends MouseListener {
    constructor(params) {
		super();
        this.parent = params.parent;
        this.pos = params.pos ? {...params.pos} : null;
        this.dim = params.dim ? {...params.dim} : {w: 0, h: 0};
		if (params.margin) {
			if (isNaN(params.margin)) {
				this.margin = {...params.margin};
			} else {
				const m = params.margin;
				this.margin = {top: m, right: m, bottom: m, left: m};
			}
		} else {
			this.margin = {top: 0, right: 0, bottom: 0, left: 0};
		}
    }
    
    contains(p, noupdate) {
		const yes = p.x > this.pos.x && p.x < this.pos.x+this.dim.w &&
			p.y > this.pos.y && p.y < this.pos.y+this.dim.h;
		if (yes && !noupdate) {
			if (this.parent) 
				this.parent.updateOver(this, p);
			else 
				this.updateOver(this, p);
		}
		return yes;
    }

	draw(ctx) {}
}

class Text extends Control {
	// ctx required for measuring text
	constructor(params, ctx) {
		super(params);
		this.text = params.text;
		this.color = params.color ?? 'red';
		this.fontFamily = params.fontFamily ?? fontFamily3;
		this.fontSize = params.fontSize ?? 16;
		this.fontWeight = params.fontWeight ?? '';
		this.ctx = ctx;
		this.pack();
	}

	draw(ctx) {
		const p = {x: this.pos.x, y: this.pos.y+this.ascent};
		ctx.font = this.font;
		ctx.fillStyle = this.color;
		ctx.fillText(this.text, p.x, p.y);
	}

	get font() {
		return `${this.fontWeight} ${this.fontSize}px ${this.fontFamily}, Sans-Serif`;
	}

	pack(pass) {
		if (pass == 1) return;
		this.ctx.font = this.font;
		const tm = this.ctx.measureText(this.text);
		this.ascent = tm.actualBoundingBoxAscent;
		this.descent = tm.actualBoundingBoxDescent;
		this.dim.w = tm.width;
		this.dim.h = this.ascent + this.descent;
	}
}

class Box extends Control {
    constructor(params) {
        super(params);
        this.children = [];
        this.align = params.align ?? '';
		this.over = null;
    }
	
	action(type, p) {
		this.children.forEach(c => c[type](p));
	}
	
	click(p) {if (this.contains(p)) this.action('click', p);}
	mousedown(p) {if (this.contains(p)) this.action('mousedown', p);}
	mousemove(p) {if (this.contains(p)) this.action('mousemove', p);}
	mouseup(p) {if (this.contains(p)) this.action('mouseup', p);}
	mouseout(p) {this.action('mouseout', p);}
	rightClick(p) {if (this.contains(p)) this.action('rightClick', p);}
    
    add(control) {
        this.children.push(control);
		control.parent = this;
    }

	draw(ctx, debug) {
		this.children.forEach(c => c.draw(ctx, debug));
		if (debug) {
			ctx.lineWidth = 1;
			ctx.strokeStyle = '#f00';
			ctx.strokeRect(this.pos.x - this.margin.left, this.pos.y - this.margin.top, 
				this.dim.w + this.margin.left + this.margin.right, 
				this.dim.h + this.margin.top + this.margin.bottom);
		}
	}
 
 	// pass == 0: set dims of self and children
	// pass == 1: set postion of children (parent sets your pos)
    pack(pass) {
        let w,h,maxLm,maxTm;
		if (pass === 0)
			this.children.forEach(c => {
				if (c.pack) c.pack(0);
			});
        if (this instanceof HBox) {
			w = 0;
			if (this.align == 'center') {
				const maxTh = Math.max(...this.children.map(c => c.dim.h/2 + c.margin.top));
				const maxBh = Math.max(...this.children.map(c => c.dim.h/2 + c.margin.bottom));
				h = 2*Math.max(maxTh, maxBh);
			} else {
				maxTm = Math.max(...this.children.map(c => c.margin.top));
				const maxBh = Math.max(...this.children.map(c => c.dim.h + c.margin.bottom));
				h = maxTm + maxBh;
			}
        } else {
			if (this.align == 'center') {
				const maxLw = Math.max(...this.children.map(c => c.dim.w/2 + c.margin.left));
				const maxRw = Math.max(...this.children.map(c => c.dim.w/2 + c.margin.right));
				w = 2*Math.max(maxLw, maxRw);
			} else {
				maxLm = Math.max(...this.children.map(c => c.margin.left));
				const maxRw = Math.max(...this.children.map(c => c.dim.w + c.margin.right));
				w = maxLm + maxRw;
			}
			h = 0;
        }
        this.children.forEach(c => {
			if (this instanceof HBox) {
				w += c.margin.left;
				if (pass == 1) {
					c.pos = {x: this.pos.x + w, y: this.pos.y};
					if (this.align == 'center') 
						c.pos.y += h/2 - c.dim.h/2;
					else
						c.pos.y += maxTm;
				}
				w += c.dim.w + c.margin.right;
			} else {
				h += c.margin.top;
				if (pass == 1) {
					c.pos = {x: this.pos.x, y: this.pos.y + h};
					if (this.align == 'center')
						c.pos.x += w/2 - c.dim.w/2;
					else
						c.pos.x += maxLm;
				}
				h += c.dim.h + c.margin.bottom;
			}
			if (pass == 1 && c.pack) c.pack(1);
        });
		if (pass === 0 && (!this.dim.w || !this.dim.h)) {
			this.dim.w = w;
			this.dim.h = h;
		}
    }

	packAll() {
		this.pack(0);
		this.pack(1);
	}
    
    remove(control) {
        this.controls.splice(this.controls.indexOf(control), 1);
    }

	updateOver(over, p) {
		if (this.parent) 
			this.parent.updateOver(over, p);
		else if (this.over != over) {
			if (this.over && !this.over.contains(p, true)) // no infinite recursion
				this.over.mouseout();
			this.over = over;
		}
	}
}

class HBox extends Box {
    constructor(params) {
        super(params);
    }
}

class VBox extends Box {
    constructor(params) {
        super(params);
    }
}

class Button extends Control {
	constructor(params, ctx) {
        super(params);
		params.dim = null; // Text dim auto-calculated anyway
		params.margin = null; // Margin on text not the same as margin on button
		this.text = new Text(params, ctx);
		this.text.fontWeight == params.fontWeight ?? 'Bold';
		this.color = params.color ?? '#ddd';
		this.hoverColor = params.hoverColor ?? '#722';
		this.cb = params.cb;
		this.hovering = false;
	}

	click(p) {
		if (this.contains(p))
			this.cb();
	}

	draw(ctx, hover) {
		ctx.strokeStyle = '#4a4a4a';
		ctx.lineWidth = 3;
		if (this.hovering) {
			ctx.fillStyle = this.color;
			this.text.color = this.hoverColor;
		} else {
			ctx.fillStyle = this.hoverColor;
			this.text.color = this.color;
		}
		ctx.fillRect(this.pos.x, this.pos.y, this.dim.w, this.dim.h);
		ctx.strokeRect(this.pos.x, this.pos.y, this.dim.w, this.dim.h);
		this.text.draw(ctx);
	}

	mousemove(p) {
		this.hovering = this.contains(p);
	}

	mouseout(p) {
		this.hovering = false;
	}

	pack() {
		// Pass 0
		this.text.pack();
		if (!this.dim.x || !this.dim.y) {
			this.dim.x = this.text.dim.x + this.text.margin.left + this.text.margin.right;
			this.dim.y = this.text.dim.y + this.text.margin.top + this.text.margin.bottom;
		}
		// Pass 1
		if (this.pos) {
			this.text.pos = {
				x: this.pos.x + this.dim.w/2 - this.text.dim.w/2,
				y: this.pos.y + this.dim.h/2 - this.text.dim.h/2
			};
		}
	}
}

class ImageControl extends Control {
	constructor(params) {
		super(params);
		this.img = params.img;
	}

	draw(ctx) {
		let [w,h] = scaleImage(this.img.width, this.img.height, this.dim.w, this.dim.h);
		ctx.drawImage(this.img, this.pos.x, this.pos.y, w, h);
	}

	pack(pass) {
		if (pass == 1) return;
		if (!this.dim.x || !this.dim.y) this.dim = {w: this.img.width, h: this.img.height};
	}
}

class Astron extends ImageControl {
	constructor(params) {
        super(params);
		this.type = params.type;
		this.flamed = params.flamed ?? [];
	}
}

class TextCounter extends Text {
	constructor(params, ctx) {
        super(params, ctx);
		this.sav = params.text ?? '';
		this.count = params.count ?? 0;
	}

	draw(ctx) {
		this.text = `${this.sav} ${this.count}`;
		super.draw(ctx);
	}

	pack() {
		this.text = `${this.sav} ${this.count}`;
		super.pack();
	}
}

class ImageCounter extends HBox {
	constructor(params) {
		super(params);
		this.imgs = params.imgs;
		this.max = params.max;
		this.count = params.count ?? 0;
		this.spacing = params.spacing ?? 5;
		for (let i=0; i<this.max; i++) {
			this.add(new ImageControl({img: this.imgs[i%this.imgs.length]}));
			if (i > 0) 
				this.children.at(-1).margin.left = this.spacing;
		}
	}

	draw(ctx) {
		this.children.slice(0, this.count).forEach(c => c.draw(ctx));
	}
}

class PadConfigButton extends Button {
    constructor(params, ctx, config) {
		super(params, ctx);
		this.color = params.color ?? '#ddd';
		this.hoverColor = params.hoverColor ?? '#518089';
		this.setColor = params.setColor ?? '#ddd';
		this.setHoverColor = params.setHoverColor ?? '#292';
		this.name = params.name ?? params.text;
        this.config = config;
    }
    
    capture(pad) {
        for (let i=0; i<pad.buttons.length; i++) {
            if (pad.buttons[i].pressed) {
                try {
                    let prior = this.config.fields[this.config.fieldIdx-1];
                    if (prior.button == i) 
                        continue;
                } catch (e) {}
                this.button = i;
                return true;
            }
        }
        for (let i=0; i<pad.axes.length; i++) {
            if (i > 4) break;
            if (Math.abs(pad.axes[i]) > 0.1) {
                const value = Math.round(pad.axes[i]);
                try {
                    let prior = this.config.fields[this.config.fieldIdx-1];
                    if (prior.axis == i && prior.value == value) 
                        continue;
                } catch (e) {}
                this.axis = i;
                this.value = value;
                return true;
            }
        }
        return false;
    }

	click(p) {
		if (!this.contains(p)) return;
		if (this.config) 
			this.config.buttons.forEach(b => b.selected = false);
		this.selected = !this.selected;
	}

	draw(ctx) {
		let color, hoverColor;
		const savText = this.text.text;
		const savColor = this.color;
		const savHoverColor = this.hoverColor;
		const savHovering = this.hovering;
		if (this.hovering || this.selected) {
			this.color = this.isSet() ? this.setHoverColor : savHoverColor;
			this.hoverColor = this.isSet() ? this.setColor : savColor;
			this.hovering = false;
			if (this.selected) {
				this.text.text = `${this.text.text} (Press)`;
			}
		} else if (this.isSet()) {
			this.color = this.setColor;
			this.hoverColor = this.setHoverColor;		
			this.text.text = `${this.text.text} ${this.binding}`;
		} 
		this.text.pack();
		this.text.pos.x = this.pos.x + this.dim.w/2 - this.text.dim.w/2;
		super.draw(ctx);
		this.text.text = savText;
		this.color = savColor;
		this.hoverColor = savHoverColor;
		this.hovering = savHovering;
	}

	get binding() {
		if (this.button || this.button === 0) 
			return `[Bu${this.button}]`;		
		else 
			return `[Ax${this.axis}:${this.value}]`;
	}

	isSet() {
		return this.button || this.button === 0 || this.axis || this.axis === 0;
	}
}

class SliderBar extends Control {
	constructor(params) {
		super(params);
		this.color = params.color ?? '#f00';
		this.hoverColor = params.hoverColor ?? '#ddd';
		this.n = params.n;
		this.index = params.index;
		this.radius = params.radius;
		this.cb = params.cb;
		this.tickLoc = [];
	}

	draw(ctx) {
		const dw = this.dim.w/(this.n-1);
		const tw = 3;
		ctx.fillStyle = this.color;
		ctx.fillRect(this.pos.x, this.pos.y+this.dim.h/2-1, this.dim.w, 2);
		for (let i=0; i<this.n; i++) {
			const x = this.pos.x + i*dw;
			const y = this.pos.y+this.dim.h/2;
			ctx.fillStyle = this.color;
			ctx.fillRect(x, y-4, tw, 8);
			if (i == this.index) {
				drawCircle(ctx, {x: x+tw/2, y: y}, this.radius, this.color);
				if (this.hovering) {
					drawCircle(ctx, {x: x+tw/2, y: y}, this.radius*0.7, this.hoverColor);
				}
			}
		}
	}

	click(p) {
		this.selected = true;
		this.mousemove(p);
		this.selected = false;
	}
	
	mousedown(p) {
		p.x += 5;
		if (this.contains(p)) {
			this.selected = true;
		}
		p.x -= 10;
		if (this.contains(p)) {
			this.selected = true;
		}
	}

	mousemove(p) {
		this.hovering = false;
		p.x += 5;
		if (this.contains(p)) this.hovering = true;
		p.x -= 10;
		if (this.contains(p)) this.hovering = true;
		const index = argmin(this.ticks.map(x => Math.abs(p.x-x)));
		if (this.index != index) 
			this.hovering = false;
		if (this.selected) {
			if (this.index != index) {
				this.index = index;
				this.cb(this.index);
			}
		}
	}

	mouseup() {
		this.selected = false;
	}

	pack(pass) {
		if (pass == 1) {
			const dw = this.dim.w/(this.n-1);
			this.ticks = [];
			for (let i=0; i<this.n; i++) {
				this.ticks.push(this.pos.x + i*dw);
			}
		}
	}
}

class Slider extends HBox {
	constructor(params, ctx) {
		super(params);
		params.dim = null;
		params.margin = null;
		this.text = new Text(params, ctx);
		this.text.pack();
		this.cb = params.cb;
		params.spacing = params.spacing ?? 20;
		this.bar = new SliderBar({
			dim: {w: params.barw ?? 100, h: params.barh ?? 15}, 
			margin: {top: 0, bottom: 0, left: params.spacing, right: params.spacing},
			n: params.labels.length,
			index: params.index ?? 0,
			radius: params.radius ?? 6,
			cb: (idx) => {
				this.children[2].text = this.labels[idx];
				if (this.cb) this.cb(this.labels[idx]);
			},
			color: params.color
		});
		this.labels = params.labels;
		this.label = new Text({...params, text: this.labels[this.bar.index]}, ctx);
		this.label.pack();
		this.add(this.text);
		this.add(this.bar);
		this.add(this.label);
		this.align = 'center';
	}

	mousedown(p) {
		this.bar.mousedown(p);
	}
	
	mouseout() {
		this.bar.hovering = false;
		this.bar.selected = false;
	}
}

class Timer extends Text {
	constructor(params) {
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
		if (!this.active || isNaN(this.time) || /*this.time > 10 ||*/ this.time < 0) return;
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


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
    
    contains(p) {
		return p.x > this.pos.x && p.x < this.pos.x+this.dim.w &&
			p.y > this.pos.y && p.y < this.pos.y+this.dim.h;
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
		this.dim.w = tm.width;
		this.ascent = tm.actualBoundingBoxAscent;
		this.descent = tm.actualBoundingBoxDescent;
		this.dim.h = this.ascent + this.descent;
	}
}

class Box extends Control {
    constructor(params) {
        super(params);
        this.children = [];
        this.align = params.align ?? '';
    }
	
	action(type, p) {
		this.children.forEach(c => c[type](p));
	}
	
	click(p) {this.action('click', p);}
	mousedown(p) {this.action('mousedown', p);}
	mousemove(p) {this.action('mousemove', p);}
	mouseup(p) {this.action('mouseup', p);}
	mouseout(p) {this.action('mouseout', p);}
	rightClick(p) {this.action('rightClick', p);}
    
    add(control) {
        this.children.push(control);
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
		this.color = params.color;
		this.hoverColor = params.hoverColor;
		this.cb = params.cb;
		this.hovering = false;
	}

	click() {
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

class Counter extends Control {
	constructor(params) {
        super(null, params.pos, params.dim, params.margin);
		this.text = params.text;
		this.color = params.color;
		this.pText = params.pText;
		this.pCount = params.pCount;
		this.fontSize = params.fontSize ?? 16; 
		this.font = `Bold ${this.fontSize}px Sans-Serif`;
		this.count = params.count ?? 0;
	}

	draw(ctx) {
		drawText(ctx, this.text, addPoints(this.pos, this.pText), this.color, this.font);
		drawText(ctx, this.count, addPoints(this.pos, this.pCount), this.color, this.font);
	}
}

class PadButtonField {
    constructor(config, params) {
        this.params = params;
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
    
    contains(p) {
		return p.x > this.params.pos.x && p.x < this.params.pos.x+this.params.dim.w &&
			p.y > this.params.pos.y && p.y < this.params.pos.y+this.params.dim.h;
	}
    
    draw(ctx) {
        let textColor, text;
		ctx.strokeStyle = '#4a4a4a';
		ctx.lineWidth = 3;
        if (this.config.fields[this.config.fieldIdx] == this) {
            ctx.fillStyle = '#ddd';
            textColor = '#722';
            text = this.params.text + " (Press)";
        } else if (this.button || this.button === 0 || this.axis || this.axis === 0) {
            ctx.fillStyle = '#4a4';
            textColor = '#ddd';
            text = this.params.text;
            if (this.button || this.button === 0) {
                text += ` (Bu${this.button})`;
            } else {
                text += ` (Ax${this.axis}:${this.value})`;
            }
        } else {
            if (this.hovering) {
                ctx.fillStyle = '#ddd';
                textColor = '#722';
            } else {
                ctx.fillStyle = '#a55';
                textColor = '#ddd';
            }
            text = this.params.text;
        }
		ctx.fillRect(this.params.pos.x, this.params.pos.y, this.params.dim.w, this.params.dim.h);
		ctx.strokeRect(this.params.pos.x, this.params.pos.y, this.params.dim.w, this.params.dim.h);
        drawText(ctx, text, 
            {x: this.params.pos.x+this.params.dim.w/2, y: this.params.pos.y+this.params.dim.h/2+8-4}, 
            textColor, '12px Sans-Serif');
    }
    
    get name() {
        if (this.params.name) return this.params.name;
        else return this.params.text;
    }
}

class Slider {
	constructor(text, centerLabel, labelColor, labelFontSize, left, dim, color, centerText, fontSize, ticks, pos, cb) {
		this.text = text;
		this.centerLabel = centerLabel;
		this.labelColor = labelColor;
		this.labelFontSize = labelFontSize;
		this.labelFont = `Bold ${this.labelFontSize}px Sans-Serif`;
		this.left = left;
		this.dim = dim;
		this.color = color;
		this.centerText = centerText;
		this.fontSize = fontSize ?? 12;
		this.font = `Bold ${this.fontSize}px Sans-Serif`;
		this.ticks = ticks;
		const n = ticks.length-1;
		this.tickLoc = [...this.ticks.keys()].map(i => ({x: left.x + i*(dim.w/n), y: left.y}));
		this.pos = pos;
		this.cb = cb;
		this.selected = false;
		this.hovering = false;
	}

	contains(p) {
		return distance(p, this.tickLoc[this.pos]) < 8;
	}

	draw(ctx) {
		drawText(ctx, this.text, this.centerLabel, this.labelColor, this.labelFont);
		ctx.lineWidth = 3;
		ctx.strokeStyle = this.color;
		ctx.fillStyle = '#ddd';
		ctx.beginPath();
		ctx.moveTo(this.left.x, this.left.y);
		ctx.lineTo(this.left.x+this.dim.w, this.left.y);
		ctx.closePath();
		ctx.stroke();
		ctx.lineWidth = 1;
		for (let i=0; i<this.tickLoc.length; i++) {
			ctx.beginPath();
			ctx.moveTo(this.tickLoc[i].x, this.tickLoc[i].y - this.dim.h/2);
			ctx.lineTo(this.tickLoc[i].x, this.tickLoc[i].y + this.dim.h/2);
			ctx.closePath();
			ctx.stroke();
			if (this.pos == i) {
				drawCircle(ctx, this.tickLoc[i], 6, '#d00');
				if (this.selected || this.hovering) {
					drawCircle(ctx, this.tickLoc[i], 4, '#ddd');
				}
			}
		}
		const txt = this.ticks[this.pos];
		const font = (txt == '\u221e') ? `Bold ${Math.floor(1.5*this.fontSize)}px Sans-Serif` : this.font;
		drawText(ctx, txt, this.centerText, this.color, font);
	}

	get value() {
		return this.ticks[this.pos];
	}

	mousedown(p) {
		if (this.contains(p)) {
			this.selected = true;
		}
	}

	mousemove(p) {
		this.hovering = this.contains(p);
		if (this.selected) {
			const oldPos = this.pos;
			this.pos = argmin(this.tickLoc.map(loc => distance(p, loc)));
			if (this.pos != oldPos) this.cb(this.ticks[this.pos]);
		}
	}

	mouseup() {
		this.selected = false;
	}

	mouseout() {
		this.hovering = false;
		this.selected = false;
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

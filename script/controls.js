

class Astron extends Control {
	constructor(params) {
        super(null, params.pos, params.dim, params.margin);
		this.type = params.type;
		this.count = 0;
		this.alpha = 0;
	}

	draw(ctx) {
		const im = images[this.type];
		let [w,h] = scaleImage(im.width, im.height, this.dim.w-10, this.dim.h-20);
		if (this.type == 'planet') {
			w *= 1.2; 
			h *= 1.2;
		}
        drawText(ctx, this.count, 
            {x: this.pos.x+this.dim.w/2, y: this.pos.y+this.dim.h-6}, 
            'white', 'Bold 12px Sans-Serif');
		ctx.drawImage(im, 
            this.pos.x+this.dim.w/2-w/2, 
            this.pos.y+this.dim.h/2-h/2-10, 
            w, h);
	}

	frame() {
		this.alpha -= 0.01;
	}

	update(n) {
		this.count += n;
		this.alpha = 1;
	}
}

class Box extends Control {
    constructor(parent, pos, margin, align) {
        super(parent, pos, null, margin);
        this.controls = [];
        this.align = align ?? 'center';
    }
    
    add(control) {
        this.controls.push(control);
    }
    
    pack() {
        let w,h;
        if (this instanceof HBox) {
            h = this.margin.top + this.margin.bottom;
            w = this.margin.left;
            h += Math.max(this.controls.map(c => c.dim.h + c.margin.top + c.margin.bottom));
        } else {
            h = this.margin.top;
            w = this.margin.left + this.margin.right;
            w += Math.max(this.controls.map(c => c.dim.w + c.margin.left + c.margin.right));
        }
        this.controls.forEach(c => {
            if (c.pack) c.pack();
            if (this instanceof HBox) {
                c.pos.x = this.pos.x + w;
                c.pos.y = this.pos.y;
                if (this.align == 'center') 
                    c.pos.y += this.margin.top + h/2 - c.dim.h/2 - c.margin.top;
                w += c.w + c.margin.left + c.margin.right;
            } else {
                c.pos.x = this.pos.x;
                c.pos.y = this.pos.y + h;
                if (this.align == 'center')
                    c.pos.x += this.margin.left + w/2 - c.dim.w/2 - c.margin.left;
                h += c.h + c.margin.top + c.margin.bottom;
            }
        });
        if (this instanceof HBox) w += this.margin.right;
        else h += this.margin.bottom;
        this.dim.w = w;
        this.dim.h = h;
        if (this.parent && this.parent.pack) 
            this.parent.pack();
    }
    
    remove(control) {
        this.controls.splice(this.controls.indexOf(control), 1);
    }
}

class Button extends Control {
	constructor(params) {
        super(null, params.pos, params.dim, params.margin);
		this.text = params.text;
		this.color = params.color;
		this.hoverColor = params.hoverColor;
		this.cb = params.cb;
		this.hovering = false;
		this.fontSize = params.fontSize ?? 16; 
		this.font = `Bold ${this.fontSize}px ${fontFamily3}, Sans-Serif`;
	}

	click() {
		this.cb();
	}

	draw(ctx, hover) {
		if (!hover) hover = this.hovering;
		ctx.strokeStyle = '#4a4a4a';
		ctx.lineWidth = 3;
		ctx.fillStyle = (hover) ? this.hoverColor : this.color;
		ctx.fillRect(this.pos.x, this.pos.y, this.dim.w, this.dim.h);
		ctx.strokeRect(this.pos.x, this.pos.y, this.dim.w, this.dim.h);
		const textColor = (hover) ? this.color : this.hoverColor;
		drawText(ctx, this.text, 
            {x: this.pos.x+this.dim.w/2, y: this.pos.y+this.dim.h/2+this.fontSize/2-2}, 
            textColor, this.font);
	}
}

class Control {
    constructor(parent, pos, dim, margin) {
        this.parent = parent;
        this.pos = pos ? {...pos} : null;
        this.dim = dim ? {...dim} : {w: 0, h: 0};
        this.margin = margin ? {...margin} : {top: 0, right: 0, bottom: 0, left: 0};
    }
    
    contains(p) {
		return p.x > this.pos.x && p.x < this.pos.x+this.dim.w &&
			p.y > this.pos.y && p.y < this.pos.y+this.dim.h;
    }
}

class Counter extends Control {
	constructor(params) {
        super(null, params.pos, params.dim, params.margin);
		this.text = params.text;
		this.color = params.color;
		this.pText = params.pText;
		this.pCount = params.pCount;
		this.fontSize = fontSize ?? 16; 
		this.font = `Bold ${this.fontSize}px Sans-Serif`;
		this.count = count ?? 0;
	}

	draw(ctx) {
		drawText(ctx, this.text, addPoints(this.pos, this.pText), this.color, this.font);
		drawText(ctx, this.count, addPoints(this.pos, this.pCount), this.color, this.font);
	}
}

class HBox extends Box {
    constructor(parent, pos, margin, align) {
        super(parent, pos, margin, align);
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

class VBox extends Box {
    constructor(parent, pos, margin, align) {
        super(parent, pos, margin, align);
    }
}
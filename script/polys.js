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
        if (hl == 'hovering') ctx.strokeStyle = '#aa9';
		if (hl == 'selected') ctx.strokeStyle = '#ffc';
        if (hl == 'moveOutline') {
            ctx.strokeStyle = '#775';
            ctx.setLineDash([5, 5]);
        }
		if (hl && !isNaN(hl)) ctx.strokeStyle = pSBC(0.5, ctx.strokeStyle);
		ctx.lineWidth = (this instanceof TriPoly || this instanceof SquarePoly) ? 3 : 5;
		ctx.beginPath();
		const start = this.points[0];
		ctx.moveTo(start.x, start.y);
		this.points.map(p => {
			ctx.lineTo(p.x, p.y);
		});
		ctx.closePath();
		if (hl == 'outline' || hl == 'moveOutline') {
			ctx.stroke();
            ctx.setLineDash([]);
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
				if (this.type == 'planet') f *= 1.3;
				let [w,h] = scaleImage(im.width, im.height, this.size*f, this.size*f);
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


class Poly {
    constructor(params) {
        this.params = {...params};
        this.recalcBoundary();
    }

    // xform is the screen transform (adjust center, flip y about center)
    draw(ctx, xform) {
        ctx.strokeStyle = '#775';
		ctx.beginPath();
		const start = xform(this.points[0]);
		ctx.moveTo(start.x, start.y);
		this.points.map(p => {
            p = xform(p);
			ctx.lineTo(p.x, p.y);
		});
		ctx.closePath();
        ctx.stroke();
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


class Grid {
    constructor(params) {
        this.center = point(params.dim.w/2, params.dim.h/2);
        this.params = {...params};
        let kls = null;
        switch (params.type) {
            case 'tri': this.initTri(); kls = Tri; break;
            case 'square': this.initSquare(); kls = Square; break;
            case 'hex': this.initHex(); kls = Hex; break;
        }
        this.makePolys(kls);
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

    draw(ctx, color) {
        this.centers.forEach(c => {
            fillCircle(ctx, this.xform(c), 2, color);
            c.poly.draw(ctx, p => this.xform(p));
        });
    }

    fall() {
        const cs = this.centers;
        cs.sort((a,b) => a.y - b.y);
        // If empty, pull in neighbors above
        cs.forEach(c => {

        });
    }

    initHex() {
        this.map = {};
        for (let i=0; i<2; i++) {
            for (let j=0; j<4; j++) {
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
        for (let i=0; i<2; i++) {
            for (let j=0; j<4; j++) {
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
        for (let i=0; i<2; i++) {
            for (let j=0; j<4; j++) {
                const s = this.params.size;
                const x = (i+j/2)*s;
                const y = j*s*Math.sqrt(3)/2;
                const c1 = rotate(point(x+s/2, y+s/2/Math.sqrt(3)), this.params.angle);
                const c2 = rotate(point(x+s, y+s/Math.sqrt(3)), this.params.angle);
                const str = pairstr([i,j]);
                c1.up = false;
                c2.up = true;
                c1.pairstr = str;
                c1.pairstr = str;
                this.map[str] = [c1,c2];
            }
        }
    }

    makePolys(kls) {
        this.centers.forEach(c => {
            const p = new kls({center: {...c}, size: this.params.size, angle: this.params.angle, up: c.up});
            c.poly = p;
        });
    }

    neighbors(c) {
        const [i,j] = c.pairstr.split(',').forEach(p => parseInt(p));
        const ns = [];
        for (let ii=i-1; ii<=i+1; ii++) {
            for (let jj=j-1; jj<=j+1; jj++) {
                this.map[pairstr([ii,jj])].forEach(cc => {
                    if (len(sub(c,cc)) < this.neighborDistance) {
                        neighbors.push(c)
                    }
                });
            }
        }
        return ns;
    }

    rotate(theta) {
        this.centers.forEach(c => {
            const upd = rotate(c, theta);
            c.x = upd.x;
            c.y = upd.y;
            c.poly.params.center = upd;
            c.poly.params.angle += theta;
            c.poly.recalcBoundary();
        });
    }

    // Add center and flip y about center y
    xform(p) {
        const pp = add(p, this.center);
        pp.y = 2*this.center.y-pp.y;
        return pp;
    }

    ixform(p) {
        const pp = sub(p, this.center);
        return pp;
    }
}

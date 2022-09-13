
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
        if (this.selected) {
            ctx.fillStyle = 'blue';
            ctx.fill();
        }
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
        this.cacheNeighbors();
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

    click(p) {
        p = this.xforminv(p);
        this.centers.forEach(c => {
            if (c.poly && c.poly.contains(p)) {
                c.poly.selected = !c.poly.selected;
            }
        });
    }

    draw(ctx, color) {
        this.centers.forEach(c => {
            fillCircle(ctx, this.xform(c), 2, color);
            if (c.poly) 
                c.poly.draw(ctx, p => this.xform(p));
        });
    }

    fall() {
        const cs = this.centers;
        cs.sort((a,b) => a.y - b.y);
        // Empty locations pull in polys from above them
        cs.forEach(c => {
            // Grid position already occupied
            if (c.poly) return;
            // Shuffle order
            c.neighbors.sort(() => Math.random() - 0.5);
            c.neighbors.forEach(n => {
                // Check that we haven't already filled hole
                if (!c.poly && n.poly && n.y > c.y) {
                    c.poly = n.poly;
                    n.poly = null;
                    c.poly.params.center = {...c};
                    if (c.up || n.up) c.poly.params.up = c.up; // Triangles
                    c.poly.recalcBoundary();
                }
            });
        });
    }

    findNeighbors(c) {
        const [i,j] = c.pairstr.split(',').map(p => parseInt(p));
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
                c2.pairstr = str;
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

    // Get each astron type individually
    get matched() {
        function growGroup(group, visited) {
            group.at(-1).neighbors.forEach(n => {
                if (n.poly && n.poly.selected && !visited.includes(n)) {
                    group.push(n);
                    visited.push(n);
                    growGroup(group, visited);
                }
            });
        }
        // TODO Selected should be astrons types
        const selected = this.centers.filter(c => c.poly && c.poly.selected);
        const groups = [];
        const visited = [];
        selected.forEach(s => {
            if (!visited.includes(s)) {
                groups.push([s]);
                visited.push(s);
                growGroup(groups.at(-1), visited);
            }
        });
        console.log(groups);
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
                c.poly.params.center = upd;
                c.poly.params.angle += theta;
                c.poly.recalcBoundary();
            }
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

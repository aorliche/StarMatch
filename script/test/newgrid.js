
class Tri {
    constructor(params) {
        this.params = {...params};
        this.recalcBoundary();
    }

    draw(ctx) {
        ctx.strokeStyle = '#775';
		ctx.beginPath();
		const start = this.points[0];
		ctx.moveTo(start.x, start.y);
		this.points.map(p => {
			ctx.lineTo(p.x, p.y);
		});
		ctx.closePath();
        ctx.stroke();
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


class Grid {
    constructor(params) {
        this.center = point(params.dim.w/2, params.dim.h/2);
        this.params = {...params};
        switch (params.type) {
            case 'tri': this.initTri(); break;
            case 'square': this.initSquare(); break;
            case 'hex': this.initHex(); break;
        }
    }

    // Each anchor contains either 1 (square, hex) or 2 (tri) centers
    draw(ctx, color) {
        for (const pairstr in this.map) {
            this.map[pairstr].forEach(c => {
                fillCircle(ctx, c, 2, color);
                const t = new Tri({center: {...c}, size: this.params.size, angle: this.params.angle, up: c.up})
                t.draw(ctx);
            });
        }
    }

    initTri() {
        this.map = {};
        for (let i=0; i<1; i++) {
            for (let j=0; j<4; j++) {
                const s = this.params.size;
                const x = i*s;
                const y = j*s*Math.sin(Math.PI/3);
                const c1 = this.xform(point(x+s/2, y+s/2/Math.sqrt(3)));
                const c2 = this.xform(point(x+s, y+s/Math.sqrt(3)));
                const str = pairstr([i,j]);
                c1.up = false;
                c2.up = true;
                c1.pairstr = str;
                c1.pairstr = str;
                this.map[str] = [c1,c2];
            }
        }
    }

    xform(p) {
        return add(rotate(p, this.params.angle), this.center);
    }
}

const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

function randomColor() {
	return `#${genRanHex(3)}`;	
}

function randomChoice(arr) {
	return arr[Math.floor(Math.random()*arr.length)];
}

function randomType() {
	return randomChoice(types);
}

function randomInt(min, max) {
	return Math.floor(Math.random()*(max-min))+min;
}

function getTypeColor(type) {
	return astronColors[astrons.indexOf(type)];
}

function getCursorPosition(e) {
    const r = e.target.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    return point(x,y);
}

function ccw(a, b, c) {
	return (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
}

function scaleImage(ow, oh, aw, ah) {
	const wr = aw/ow;
	const hr = ah/oh;
	return (wr < hr) ? [aw, oh*wr] : [ow*hr, ah];
}

function distance(a, b) {
	return Math.sqrt(Math.pow(a.x-b.x,2)+Math.pow(a.y-b.y,2))
}

/*function makeArray2(n) {
	const arr = [];
	for (let i=0; i<n; i++) {
		arr.push([]);
	}
	return arr;
}*/

function approxEq(a, b) {
	return Math.abs(a-b) < 1;
}

function near(a, b, dist) {
	return distance(a, b) < dist;
}

function onlyUniqueArrayElts(value, index, self) {
	return indexOfArrayElts(self, value) === index;
}

function uniqueArrayElts(arr) {
	return arr.filter(onlyUniqueArrayElts);
}

function arrayEquals(a, b) {
	if (a.length != b.length) {
		return false;
	}
	for (let i=0; i<a.length; i++) {
		if (a[i] != b[i]) {
			return false;
		}
	}
	return true;
}

function indexOfArrayElts(arr, item) {
	for (let i=0; i<arr.length; i++) {
		if (arrayEquals(arr[i], item)) {
			return i;
		}
	}
	return -1;
}

function shuffle(arr) {
	for (let i=0; i<arr.length; i++) {
		const j = Math.floor(Math.random()*arr.length);
		const k = Math.floor(Math.random()*arr.length);
		if (j != k) [arr[j],arr[k]] = [arr[k],arr[j]];
	}
}

function queryIndex(arr, idx) {
	try {
		if (idx.length == 3) {
			const [i,j,k] = idx;
			return arr[i][j][k];	
		} else if (idx.length == 2) {
			const [i,j] = idx;
			return arr[i][j];
		} else {
			throw Error('Index');
		}
	} catch (e) {
		if (e.message == 'Index') throw e;
		return null;
	}
}

function addLoc(loc, chains, item) {
	if (chains.length == 3) {
		const [i,j,k] = chains;
		if (!loc[i]) loc[i] = [];
		if (!loc[i][j]) loc[i][j] = [];
		loc[i][j][k] = item;
	} else if (chains.length == 2) {
		const [i,j] = chains;
		if (!loc[i]) loc[i] = [];
		loc[i][j] = item;
	} else {
		throw Error('Bad number of chain coords');
	}
}
	
function addLocEnd(loc, part, item) {
	if (part.length == 2) {
		const [i,j] = part;
		if (!loc[i]) loc[i] = [];
		if (!loc[i][j]) loc[i][j] = [];
		loc[i][j].push(item);
	} else if (part.length == 1) {
		const i = part[0];
		if (!loc[i]) loc[i] = [];
		loc[i].push(item);
	} else {
		throw Error('Bad number of part indices');
	}
}

/*function nearbyIndices(idx, r, type) {
	const res = [];
	const [ii,jj,kk] = idx;
	for (let i=ii-r; i<=ii+r; i++) {
		for (let j=jj-r; j<=jj+r; j++) {
			if (type == 'tri') {
				res.push([i,j,i-j]);
				res.push([i,j,i-j-1]);
			} else if (type == 'hex') {
				res.push([i,j,j-i]);
			} else if (type == 'square') {
				res.push([i,j]);
			}
		}
	}
	res.sort((a,b) => Math.abs(a[0]-ii)-Math.abs(b[0]-ii)+Math.abs(a[1]-jj)-Math.abs(b[1]-jj));
	return res;
}*/

function secondsToString(sec) {
	const min = Math.floor(sec/60);
	sec = sec % 60;
	const pad = (sec < 10) ? '0' : '';
	return `${min}:${pad}${sec}`;
}

/*function get(obj, prop, text) {
	let found = null;
	text = text.toLowerCase();
	obj[prop].forEach(elt => {
		if (elt.text.toLowerCase().includes(text)) 
			found = elt;
	});
	return found;
}*/

function argmin(arr) {
	let min = 0;
	for (let i=1; i<arr.length; i++) {
		if (arr[i] < arr[min]) min = i;
	}
	return min;
}

function fillCircle(ctx, c, r, color) {
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

/*function drawText(ctx, text, p, color, font, stroke) {
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
}*/

function addPoints(a, b) {
    return {x: a.x+b.x, y: a.y+b.y};
}

function basename(path) {
	return path.split(/[\\/]/).pop().split(/\./)[0]
}

function repeat(what, n) {
	return Array(n).fill(what).flat()
}

function remove(arr, item) {
	arr.splice(arr.indexOf(item), 1);
}

function point(x, y) {
    return {x: x, y: y};
}

function dimension(w, h) {
    return {w: w, h: h};
}

function eq(p, q, tol) {
    if (!tol) tol = 1e-3; 
    return len(sub(p,q))<Math.pow(tol,2);
}

function add(p, q) {
    return {x: p.x+q.x, y: p.y+q.y};
}

function sub(p, q) {
    return {x: p.x-q.x, y: p.y-q.y};
}

function mul(p, a) {
    return point(p.x*a, p.y*a);
}

function dot(p, q) {
    return p.x*q.x + p.y*q.y;
}

function len(p) {
    return Math.sqrt(dot(p,p));
}

function proj(p, q) {
    return mul(p, dot(p,q)/len(p)/len(q));
}

function rotate(p, theta) {
    const x = p.x*Math.cos(theta)-p.y*Math.sin(theta);
    const y = p.x*Math.sin(theta)+p.y*Math.cos(theta);
    return point(x,y);
}

function pairstr(p) {
    return `${p[0]},${p[1]}`;
}

function strpair(s) {
    return s.split(',').map(p => parseInt(p))
}

function range(start, end) {
    const rng = [...Array(Math.abs(start-end)+1).keys()];
    if (start > end) {
        return rng.map(i => i+end).reverse();
    } else {
        return rng.map(i => i+start);
    }
}

// exclusive of end
function randint(start, end) {
    return start+Math.floor(Math.random()*(end-start));
}

function zip(a,b) {
    console.assert(a.length == b.length);
    return a.map((aelt, aidx) => [aelt, b[aidx]]);
}

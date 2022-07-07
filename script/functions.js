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
	return typeColors[types.indexOf(type)];
}

function getCursorPosition(canvas, e) {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    return {x: x, y: y};
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

function copyPoint(p) {
	return {x: p.x, y: p.y};
}

function copyDim(dim) {
	return {w: dim.w, h: dim.h};
}

function shuffleArray(arr) {
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

function nearbyIndices(idx, r, type) {
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
}

function secondsToString(sec) {
	const min = Math.floor(sec/60);
	sec = sec % 60;
	const pad = (sec < 10) ? '0' : '';
	return `${min}:${pad}${sec}`;
}

function get(obj, prop, text) {
	let found = null;
	text = text.toLowerCase();
	obj[prop].forEach(elt => {
		if (elt.text.toLowerCase().includes(text)) 
			found = elt;
	});
	return found;
}

function argmin(arr) {
	let min = 0;
	for (let i=1; i<arr.length; i++) {
		if (arr[i] < arr[min]) min = i;
	}
	return min;
}

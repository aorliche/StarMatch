
class StarField {
	constructor(dim) {
		this.dim = {...dim};
		this.stars = [];
		for (let i=0; i<200; i++) {
			this.stars.push({x: randomInt(0, dim.w), y: randomInt(0, dim.h), age: randomInt(0, 300)});
		}
		this.age = 1;
	}

	draw(ctx) {
		this.stars.forEach(s => {
			const b = Math.abs(9-Math.floor(((this.age+s.age)%200)/10)).toString(16);
			ctx.fillStyle = `#${b}${b}${b}`;
			ctx.fillRect(s.x, s.y, 3, 3);
		});
	}

	tick() {
		this.age++;
	}
}

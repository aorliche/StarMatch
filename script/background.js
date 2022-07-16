
class StarField {
	constructor(dim) {
		this.dim = {...dim};
		this.age = 1;
		this.period = 100;
		this.stars = [];
		for (let i=0; i<200; i++) {
			this.stars.push(this.create(randomInt(0, 2*this.period)));
		}
	}

	brightness(s) {
		const max = (this.period-1)/10; 
		const age = s.age + s.offset;
		const mod = Math.floor((age%this.period)/max);
		const even = Math.floor(age/this.period)%2 == 0;
		return even ? mod : 10-mod;
	}

	create(offset) {
		return {x: randomInt(0, this.dim.w), y: randomInt(0, this.dim.h), age: 0, offset: offset};
	}

	draw(ctx) {
		this.stars.forEach(s => {
			const b = this.brightness(s).toString(16);
			ctx.fillStyle = `#${b}${b}${b}`;
			ctx.fillRect(s.x, s.y, 3, 3);
		});
	}

	tick() {
		this.age++;
		for (let i=0; i<this.stars.length; i++) {
			const s = this.stars[i];
			if (s.age++ > 2*this.period && this.brightness(s) == 0) {
				this.stars[i] = this.create(0);
			}
		}
	}
}



class Screen extends Box {
	constructor(game) {
		super({pos: {x: 0, y: 0}, dim: {...game.dim}});
		this.game = game;
	}
}

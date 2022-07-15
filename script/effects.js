
// Not a control
class Notification extends Text {
    constructor(params, game) {
		super(params);
		this.pos = params.pos ?? {x: this.game.grid.dim.w/2, y: this.game.grid.dim.h/3};
        this.game = game;
        this.age = 0;
        this.lifetime = params.lifetime ?? 2*30;
    }
    
    draw(ctx) {
        this.pos.y -= this.age/this.params.lifetime*80;
        drawText(ctx, this.params.text, pos, this.params.color, this.params.font);
    }
    
    tick() {
        if (this.age++ > this.params.lifetime) {
            this.game.notifications.splice(this.game.notifications.indexOf(this), 1);
        }
    }
}

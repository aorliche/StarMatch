
// Not a control
class Notification extends Text {
    constructor(params, game) {
		super(params, game.ctx);
		this.pack();
        this.game = game;
		this.pos = params.pos ?? {x: this.game.grid.dim.w/2 - this.dim.w/2, y: this.game.grid.dim.h/3};
        this.age = 0;
        this.lifetime = params.lifetime ?? 2*30;
        this.moving = params.moving ?? true;
    }
   /* 
    draw(ctx) {
        this.pos.y -= this.age/this.params.lifetime*80;
        drawText(ctx, this.params.text, pos, this.params.color, this.params.font);
    }*/
    
    tick() {
        if (this.age++ > this.lifetime) {
            this.game.notifications.splice(this.game.notifications.indexOf(this), 1);
        } else if (this.moving) {
			this.pos.y -= this.age/this.lifetime*4;
		}
    }
}

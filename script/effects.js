
// Not a control
class Notification {
    constructor(game, params) {
        this.game = game;
        this.params = params;
        this.age = 0;
        this.params.lifetime = this.params.lifetime ?? 2*30;
        this.params.pos = this.params.pos ?? {x: this.game.grid.dim.w/2, y: this.game.grid.dim.h/3};
        this.params.color = this.params.color ?? '#f00';
        this.params.font = this.params.font ?? `Bold 16px ${fontFamily3}, Sans-Serif`;
    }
    
    draw(ctx) {
        const pos = copyPoint(this.params.pos);
        pos.y -= this.age/this.params.lifetime*80;
        drawText(ctx, this.params.text, pos, this.params.color, this.params.font);
    }
    
    tick() {
        if (this.age++ > this.params.lifetime) {
            this.game.notifications.splice(this.game.notifications.indexOf(this), 1);
        }
    }
}
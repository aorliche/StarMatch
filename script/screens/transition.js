
class TransitionScreen extends Screen {
	constructor(game) {
		super(game);
        this.vbox = new VBox({pos: {x: 0, y: 0}, dim: {...this.dim}, align: 'center'});
        this.add(this.vbox);
        this.fadeOutSav = 3*60;
        this.waitSav = 2*60;
        this.fadeInSav = 3*60;
        this.textOutSav = 1*60;
        this.reset();
	}

    draw(ctx) {
        if (this.stage == 'out') 
            ctx.globalAlpha = this.fadeOut/this.fadeOutSav;
        else if (this.stage == 'wait') 
            ctx.globalAlpha = 0;
        else if (this.stage == 'in') 
            ctx.globalAlpha = 1-this.fadeIn/this.fadeInSav;
		this.game.main.draw(ctx);
        ctx.globalAlpha = 1;
        if (this.stage == 'in') 
            ctx.globalAlpha = this.textOut/this.textOutSav;
        super.draw(ctx);
        ctx.globalAlpha = 1;
    }

    get done() {
        return this.life == 0; 
    }

    set message(lines) {
        this.vbox.children = [];
        lines.forEach((text, i) => {
            const control = new Text({text: text, fontSize: 22, fontWeight: 'Bold', fontFamily: fontFamily2,
                margin: {top: 0, bottom: 5, left: 0, right: 0}}, this.game.ctx);
            if (i == 0) control.margin.top = 250;
            this.vbox.add(control);
        });
        this.vbox.packAll();
    }

    reset() {
        this.fadeOut = this.fadeOutSav;
        this.wait = this.waitSav;
        this.fadeIn = this.fadeInSav;
        this.textOut = this.textOutSav;
        this.stage = 'out';
    }

    tick() {
        // Fade in and out
        if (this.stage == 'out') {
            this.fadeOut--;
            if (this.fadeOut == 0) {
                this.fadeOut = this.fadeOutSav;
                this.stage = 'wait';
            }
        } else if (this.stage == 'wait') {
            this.wait--;
            if (this.wait == 0) {
                this.wait = this.waitSav;
                this.stage = 'in';
                // Get the early start animation going
                this.game.startLevel(this.game.level+1);
            }
        } else if (this.stage == 'in') {
            this.fadeIn--;
            // Fade out text toward the end
            if (this.fadeIn < this.textOutSav) {
                if (this.textOut > 0)
                    this.textOut--;
            }
            if (this.fadeIn == 0) {
                this.fadeIn = this.fadeInSav;
                // Open up (mouse?) controls
                this.game.visible = this.game.main;
            }
        } 
    }
}

class VictoryScreen extends Screen {
	constructor(game) {
		super(game);
	}
}

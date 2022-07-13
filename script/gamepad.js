
class GamepadState {
	constructor(game) {
		this.game = game;
        this.ages = {};
        this.interval = {};
        this.intervalDefault = 6;
        this.intervalFirst = 12;
	}
    
    anyButton() {
        let pressed = false;
        this.game.pad.buttons.forEach(b => {
            if (b.pressed) pressed = true;
        });
        return pressed;
    }
    
    anyButtonOrAxis() {
        if (this.anyButton())
            return true;
        let pressed = false;
        this.game.pad.axes.forEach(a => {
            if (Math.abs(Math.round(a)) == 1) pressed = true;
        });
        return pressed;
    }
    
    arrowEvent(evt, key, name, age) {
        if (!this.ages[key] || age-this.ages[key] >= this.interval[key]) {
            const diff = this.ages[key] ? age-this.ages[key] : this.intervalFirst+1;
            if (diff > this.intervalFirst)
                this.interval[key] = this.intervalFirst;
            else if (diff == this.intervalFirst)
                this.interval[key] = this.intervalDefault;
            switch (name) {
                case 'LA': evt.axes[0] = -1; break;
                case 'RA': evt.axes[0] = 1; break;
                case 'UA': evt.axes[1] = -1; break;
                case 'DA': evt.axes[1] = 1; break;
            }
            this.ages[key] = age;
        }
    }

	getEvents(age) {
		const evt = {axes: [0,0]};
        // Buttons
        for (let i=0; i<this.game.pad.buttons.length; i++) {
            if (i in this.game.config.map) {
                const name = this.game.config.map[i];
                // Continuous
                if (['LA', 'RA', 'UA', 'DA'].indexOf(name) != -1 && this.game.pad.buttons[i].pressed) {
                    this.arrowEvent(evt, i, name, age);
                // Edge
                } else if (['Start', 'B', 'A', 'LB', 'RB', 'X', 'Y'].indexOf(name) != -1) {
                    if (this.game.pad.buttons[i].pressed != this.ages[i]) {
                        this.ages[i] = this.game.pad.buttons[i].pressed;
                        evt[name] = this.ages[i];
                    }
                }
            }                
        }
        // Axes
        for (let i=0; i<this.game.pad.axes.length; i++) {
            const value = Math.round(this.game.pad.axes[i]);
            const key = `${i}:${value}`;
            if (Object.keys(this.game.config.map).indexOf(key) != -1) {
                const name = this.game.config.map[key];
                this.arrowEvent(evt, key, name, age);
            }
        }
		return evt;
	}
}

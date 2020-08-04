import * as state from '../state/CashState';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({
            key: "UIScene"
        });
        Phaser.Scene.call(this, { key: 'UIScene', active: true });
    }

    init() {

    }

    preload() {
        console.log("preloading UIScene");
    }

    create() {
        
        // UI
        let titleTextStyle = { font: "bold 32px Arial", fill: "#15b800", boundsAlignH: "center", boundsAlignV: "middle" };
        let subtitleTextStyle = { font: "bold 24px Arial", fill: "#15b800", boundsAlignH: "center", boundsAlignV: "middle" };

        //TODO handle really large cash values
        this.add.rectangle(this.game.renderer.width / 2, 25, 200, 50, 0x404040);
        this.add.rectangle(this.game.renderer.width / 2, 65, 150, 30, 0x000000);
        //TODO comma formatting for cash
        this.currentCashText = this.add.text(this.game.renderer.width / 2, 25, '$' + state.getCurrentCash(), titleTextStyle);
        this.currentCashText.setOrigin(0.5);
        //TODO positive/negative sign
        this.cashGrowthRateText = this.add.text(this.game.renderer.width / 2, 65, '+$' + state.getCashGrowthRate(), subtitleTextStyle);
        this.cashGrowthRateText.setOrigin(0.5);

        // Cash change listener
        state.addCurrentCashListener(this.cashChangeListener, this);

        // Cash growth timer
        this.lastCashGrowth = -1;
    }

    cashChangeListener(cash, scene) {
        scene.currentCashText.setText('$' + cash);
    }

    addCashPerSecond(seconds) {
        state.setCurrentCash(state.getCurrentCash() + (seconds * state.getCashGrowthRate()));
    }

    // Add cash every second
    update() {
        let now = Date.now();
        if (this.lastCashGrowth === -1) {
            this.lastCashGrowth = now;
        }
        
        let timePassed = now - this.lastCashGrowth;
        if (timePassed >= 1000) {
            let secondsPassed = Math.floor(timePassed / 1000);
            this.addCashPerSecond(secondsPassed);
            let timeRemainder = timePassed - (secondsPassed * 1000);
            this.lastCashGrowth = now - timeRemainder;
        }
    }
}
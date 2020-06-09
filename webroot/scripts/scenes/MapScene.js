import * as state from '../state/CashState';

const blockImageHeight = 256;
const blockImageWidth = 128;

export class MapScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MapScene"
        });
    }

    init() {

    }

    preload() {
        console.log("preloading MapScene");
        this.load.image('background', 'assets/sprites/background.png');
        this.load.image('block1', 'assets/sprites/Block_1.png');
        this.load.image('block2', 'assets/sprites/Block_2.png');
        this.load.image('block3', 'assets/sprites/Block_3.png');
    }

    create() {
        // Background
        this.add.image(0, 0, 'background').setOrigin(0, 0);

        // Blocks
        this.add.image(this.game.renderer.width / 2, this.game.renderer.height / 2, 'block1').setScale(0.5);
        this.add.image(this.game.renderer.width / 2 - blockImageWidth / 2, this.game.renderer.height / 2 + blockImageWidth / 4, 'block2').setScale(0.5);
        this.add.image(this.game.renderer.width / 2 + blockImageWidth / 2, this.game.renderer.height / 2 + blockImageWidth / 4, 'block3').setScale(0.5);
        this.add.image(this.game.renderer.width / 2, this.game.renderer.height / 2 + blockImageWidth / 2, 'block1').setScale(0.5);

        // UI
        let titleTextStyle = { font: "bold 32px Arial", fill: "#15b800", boundsAlignH: "center", boundsAlignV: "middle" };
        let subtitleTextStyle = { font: "bold 24px Arial", fill: "#15b800", boundsAlignH: "center", boundsAlignV: "middle" };

        //TODO handle really large cash values
        this.add.rectangle(this.game.renderer.width / 2, 25, 200, 50, 0x404040);
        this.add.rectangle(this.game.renderer.width / 2, 65, 150, 30, 0x000000);
        //TODO commas for cash
        this.currentCashText = this.add.text(this.game.renderer.width / 2, 25, '$' + state.getCurrentCash(), titleTextStyle);
        this.currentCashText.setOrigin(0.5);
        this.cashGrowthRateText = this.add.text(this.game.renderer.width / 2, 65, '+$' + state.getCashGrowthRate(), subtitleTextStyle);
        this.cashGrowthRateText.setOrigin(0.5);

        // Text
        this.add.text(16, 16, 'Map Scene', { fontSize: '32px', fill: '#FFFF' });

        // Cash growth timer
        this.lastCashGrowth = -1;

        // Click handler
        this.input.on("pointerup", this.addClickCash, this);
        
        console.log("created MapScene");
    }

    addClickCash(event) {
        // Add cash text animation
        //TODO calculating amount to give per click
        let clickTextStyle = { font: "14px Arial", fill: "#15b800" };
        let cashClickText = this.add.text(event.upX, event.upY, "$1", clickTextStyle);
        this.add.tween({
            targets: [cashClickText],
            ease: 'Sine.easeInOut',
            duration: 1000,
            delay: 0,
            y: {
              getStart: () => cashClickText.y,
              getEnd: () => cashClickText.y - 50
            },
            onComplete: () => {
              cashClickText.destroy();
            }
          });

        //TODO calculating amount to give per click
        this.addCashPerSecond(1);
    }

    addCashPerSecond(seconds) {
        state.setCurrentCash(state.getCurrentCash() + (seconds * state.getCashGrowthRate()));
        this.currentCashText.setText('$' + state.getCurrentCash());
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
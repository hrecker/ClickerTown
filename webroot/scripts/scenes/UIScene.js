import * as state from '../state/CashState';
import * as map from '../state/MapState';

const topBuildingY = 100;
const buildingYMargin = 120;

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
        //TODO don't double load these
        this.load.image('boulder', 'assets/sprites/Boulder.png');
        this.load.image('chest', 'assets/sprites/Chest.png');
        this.load.image('crate', 'assets/sprites/Crate.png');
    }

    create() {
        
        // UI
        let titleTextStyle = { font: "bold 32px Arial", fill: "#15b800", boundsAlignH: "center", boundsAlignV: "middle" };
        let subtitleTextStyle = { font: "bold 24px Arial", fill: "#15b800", boundsAlignH: "center", boundsAlignV: "middle" };

        //TODO handle really large cash values
        // Cash UI
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

        // Building selection UI
        this.add.rectangle(this.game.renderer.width - 75, this.game.renderer.height / 2, 150, this.game.renderer.height, 0x404040);
        this.add.text(this.game.renderer.width - 120, 25, "Buildings");

        // Buildings
        let startY = 100;
        let margin = 120;
        let scale = 0.7;
        this.buildings = [ 'boulder', 'chest', 'crate' ];
        for (let i = 0; i < this.buildings.length; i++) {
            let buildingBox = this.add.rectangle(this.game.renderer.width - 75, this.getBuildingY(i), 100, 100, 0x000000);
            this.add.image(this.game.renderer.width - 75, this.getBuildingY(i), this.buildings[i]).setScale(scale);
            buildingBox.setInteractive();

            buildingBox.on("pointerdown", () => { this.selectBuilding(i) });
        }

        // Selected building highlight
        this.buildingHighlight = this.add.rectangle(this.game.renderer.width - 75, this.getBuildingY(0), 110, 100);
        this.buildingHighlight.isFilled = false;
        this.buildingHighlight.setStrokeStyle(10, 0xFFFFFF);

        this.selectBuilding(0);
    }

    getBuildingY(index) {
        return topBuildingY + (index * buildingYMargin);
    }

    selectBuilding(index) {
        this.buildingHighlight.y = this.getBuildingY(index);
        map.setSelectedBuilding(this.buildings[index]);
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
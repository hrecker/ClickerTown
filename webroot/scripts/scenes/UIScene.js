import * as state from '../state/CashState';
import * as map from '../state/MapState';
import { Building, BuildingType, SpriteType } from '../model/Building';

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
        this.load.image('yellow', 'assets/sprites/buildings/buildingTiles_008.png');
        this.load.image('red', 'assets/sprites/buildings/buildingTiles_016.png');
        this.load.image('brown', 'assets/sprites/buildings/buildingTiles_038.png');
        this.load.image('red_awning', 'assets/sprites/buildings/buildingTiles_004.png');
        this.load.image('green_awning', 'assets/sprites/buildings/buildingTiles_018.png');
        this.load.image('no_awning', 'assets/sprites/buildings/buildingTiles_009.png');
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
        let scale = 0.7;
        this.buildings = [ 
            new Building(BuildingType.YELLOW, SpriteType.BUILDING_ONLY),
            new Building(BuildingType.RED, SpriteType.BUILDING_ONLY),
            new Building(BuildingType.BROWN, SpriteType.BUILDING_ONLY),
            new Building(BuildingType.RED_AWNING, SpriteType.TILE_AND_BUILDING),
            new Building(BuildingType.GREEN_AWNING, SpriteType.TILE_AND_BUILDING),
            new Building(BuildingType.NO_AWNING, SpriteType.TILE_AND_BUILDING)
        ];
        for (let i = 0; i < this.buildings.length; i++) {
            let buildingBox = this.add.rectangle(this.game.renderer.width - 75, this.getBuildingY(i), 100, 100, 0x000000);
            this.add.image(this.game.renderer.width - 75, this.getBuildingY(i), this.buildings[i].getName()).setScale(scale);
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
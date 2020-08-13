import * as state from '../state/CashState';
import { ShopSelection, ShopSelectionType, setShopSelection } from '../state/UIState';

const topShopSelectionY = 100;
const shopSelectionMargin = 120;

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
        this.load.image('grass', 'assets/sprites/tiles/landscapeTiles_067.png');
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

        // Shop selection UI
        this.add.rectangle(this.game.renderer.width - 75, this.game.renderer.height / 2, 150, this.game.renderer.height, 0x404040);
        this.add.text(this.game.renderer.width - 120, 25, "Shop");

        // Shop
        let scale = 0.7;
        this.shopItems = [ 
            new ShopSelection(ShopSelectionType.BUILDING_ONLY, null, 'yellow'),
            new ShopSelection(ShopSelectionType.BUILDING_ONLY, null, 'red'),
            new ShopSelection(ShopSelectionType.TILE_ONLY, 'grass', null),
            new ShopSelection(ShopSelectionType.TILE_AND_BUILDING, 'concrete', 'red_awning'),
            new ShopSelection(ShopSelectionType.TILE_AND_BUILDING, 'concrete', 'green_awning'),
            new ShopSelection(ShopSelectionType.TILE_AND_BUILDING, 'concrete', 'no_awning')
        ];
        for (let i = 0; i < this.shopItems.length; i++) {
            let selectionBox = this.add.rectangle(this.game.renderer.width - 75, this.getSelectionY(i), 100, 100, 0x000000);
            this.add.image(this.game.renderer.width - 75, this.getSelectionY(i), this.shopItems[i].getName()).setScale(scale);
            selectionBox.setInteractive();

            selectionBox.on("pointerdown", () => { this.selectShopItem(i) });
        }

        // Shop selection highlight
        this.shopHighlight = this.add.rectangle(this.game.renderer.width - 75, this.getSelectionY(0), 110, 100);
        this.shopHighlight.isFilled = false;
        this.shopHighlight.setStrokeStyle(10, 0xFFFFFF);

        this.selectShopItem(0);
    }

    getSelectionY(index) {
        return topShopSelectionY + (index * shopSelectionMargin);
    }

    selectShopItem(index) {
        this.shopHighlight.y = this.getSelectionY(index);
        setShopSelection(this.shopItems[index]);
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
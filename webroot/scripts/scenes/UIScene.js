import * as state from '../state/CashState';
import { ShopSelection, ShopSelectionType, setShopSelection } from '../state/UIState';
import { formatCash } from '../util/Util';

const topShopSelectionY = 100;
const shopSelectionMargin = 120;

export class UIScene extends Phaser.Scene {
    constructor() {
        super({
            key: "UIScene"
        });
    }

    create() {
        // UI
        let titleTextStyle = { font: "bold 32px Arial", fill: "#15b800", boundsAlignH: "center", boundsAlignV: "middle" };
        let subtitleTextStyle = { font: "bold 24px Arial", fill: "#15b800", boundsAlignH: "center", boundsAlignV: "middle" };

        //TODO handle really large cash values
        // Cash UI
        this.add.rectangle(this.game.renderer.width / 2, 25, 350, 50, 0x404040);
        this.add.rectangle(this.game.renderer.width / 2, 65, 200, 30, 0x000000);
        this.currentCashText = this.add.text(this.game.renderer.width / 2, 25, '$', titleTextStyle);
        this.currentCashText.setText(formatCash(state.getCurrentCash()));
        this.currentCashText.setOrigin(0.5);
        //TODO positive/negative sign
        this.cashGrowthRateText = this.add.text(this.game.renderer.width / 2, 65, '$', subtitleTextStyle);
        this.cashGrowthRateText.setText(formatCash(state.getCashGrowthRate()));
        this.cashGrowthRateText.setOrigin(0.5);

        // Cash listeners
        state.addCurrentCashListener(this.cashChangeListener, this);
        state.addCashGrowthListener(this.cashGrowthListener, this);

        // Cash growth timer
        this.lastCashGrowth = -1;

        // Shop selection UI
        this.add.rectangle(this.game.renderer.width - 75, this.game.renderer.height / 2, 150, this.game.renderer.height, 0x404040);
        this.add.text(this.game.renderer.width - 120, 25, "Shop");

        // Shop selections
        let scale = 0.7;
        this.shopItems = [];
        for (let buildingName in this.cache.json.get('buildings')) {
            let building = this.cache.json.get('buildings')[buildingName];
            this.shopItems.push(new ShopSelection(ShopSelectionType[building['shopSelectionType']], building['tileName'], building['name']))
        }
        for (let tileName in this.cache.json.get('tiles')) {
            this.shopItems.push(new ShopSelection(ShopSelectionType.TILE_ONLY, tileName, null))
        }
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
        scene.currentCashText.setText(formatCash(cash));
    }

    cashGrowthListener(cashGrowth, scene) {
        scene.cashGrowthRateText.setText(formatCash(cashGrowth));
    }

    addCashPerSecond(seconds) {
        state.addCurrentCash(seconds * state.getCashGrowthRate());
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
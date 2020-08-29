import * as state from '../state/CashState';
import * as date from '../state/DateState';
import { ShopSelection, ShopSelectionType, setShopSelection, getShopSelection } from '../state/UIState';
import { formatCash, formatDate } from '../util/Util';

const imageScale = 0.4;
const topShopSelectionY = 80;
const shopSelectionYMargin = 70;
const shopSelectionXMargin = 70;
const selectionBoxSize = 143 * imageScale;
const tooltipWidth = 250;
const tooltipHeight = 150;
const tooltipTextMargin = 5;

export class UIScene extends Phaser.Scene {
    constructor() {
        super({
            key: "UIScene"
        });
    }

    create() {
        // UI
        let titleTextStyle = { font: "bold 32px Verdana", fill: "#15b800", boundsAlignH: "center", boundsAlignV: "middle" };
        let subtitleTextStyle = { font: "bold 24px Verdana", fill: "#15b800", boundsAlignH: "center", boundsAlignV: "middle" };
        let dateTextStyle = { font: "bold 20px Courier", fill: "#ffffff", boundsAlignH: "center", boundsAlignV: "middle" };
        let shopTextStyle = { font: "bold 30px Arial", boundsAlignH: "center", boundsAlignV: "middle" };
        let tooltipTextStyle = { font: "14px Courier", fill: "#000000", align: "left", wordWrap: { width: (tooltipWidth - 2 * tooltipTextMargin), useAdvancedWrap: true } }
        let priceTextStyle = { font: "bold 10px Verdana", fill: "#000000", align: "center" };

        //TODO handle really large cash values?
        // Cash UI
        this.add.rectangle(this.game.renderer.width / 2, 25, 350, 50, 0x404040);
        this.add.rectangle(this.game.renderer.width / 2, 65, 200, 30, 0x000000);
        this.currentCashText = this.add.text(this.game.renderer.width / 2, 25, 
            formatCash(state.getCurrentCash()), titleTextStyle);
        this.currentCashText.setOrigin(0.5);
        this.cashGrowthRateText = this.add.text(this.game.renderer.width / 2, 65,
            formatCash(state.getCashGrowthRate()), subtitleTextStyle);
        this.cashGrowthRateText.setOrigin(0.5);

        // Date UI
        let dateRect = this.add.rectangle(this.game.renderer.width / 2, this.game.renderer.height, 250, 30, 0x000000);
        dateRect.setOrigin(0.5, 1);
        this.currentDateText = this.add.text(this.game.renderer.width / 2, this.game.renderer.height - 15,
            formatDate(date.getCurrentDate()), dateTextStyle);
        this.currentDateText.setOrigin(0.5);

        // State listeners
        state.addCurrentCashListener(this.cashChangeListener, this);
        state.addCashGrowthListener(this.cashGrowthListener, this);
        date.addCurrentDateListener(this.currentDateListener, this);

        // Cash growth timer
        this.lastCashGrowth = -1;

        // Shop selection UI
        let shopSelectionBox = this.add.rectangle(this.game.renderer.width - 75, this.game.renderer.height / 2, 150, this.game.renderer.height, 0x404040);
        shopSelectionBox.setInteractive();
        shopSelectionBox.on("pointerdown", () => { this.clearShopSelection(); });
        this.add.text(this.game.renderer.width - 115, 9, "Shop", shopTextStyle);

        // Shop selections
        this.shopItems = [];
        // Demolish
        this.shopItems.push({ selection: new ShopSelection(ShopSelectionType.DEMOLITION, null, null) });
        // Buildings
        for (let buildingName in this.cache.json.get('buildings')) {
            let building = this.cache.json.get('buildings')[buildingName];
            this.shopItems.push({ selection: new ShopSelection(ShopSelectionType[building['shopSelectionType']], building['tileName'], building['name']) });
        }
        // Tiles
        for (let tileName in this.cache.json.get('tiles')) {
            this.shopItems.push({ selection: new ShopSelection(ShopSelectionType.TILE_ONLY, tileName, null) });
        }

        for (let i = 0; i < this.shopItems.length; i++) {
            let position = this.getSelectionPosition(i);
            this.shopItems[i].selectionBox = this.add.rectangle(position.x, position.y, selectionBoxSize, selectionBoxSize, 0x999999);
            this.shopItems[i].sprite = this.add.image(position.x, position.y, this.shopItems[i].selection.getName()).setScale(imageScale);
            this.shopItems[i].selectionBox.setInteractive();
            this.shopItems[i].selectionBox.on("pointerdown", () => { this.selectShopItem(i); });
            this.shopItems[i].selectionBox.on("pointerover", () => { this.setTooltip(i); });
            this.shopItems[i].selectionBox.on("pointerout", () => { this.hideTooltip(); });
            if (this.shopItems[i].selection.selectionType != ShopSelectionType.DEMOLITION) {
                let priceText = this.add.text(this.shopItems[i].selectionBox.getTopLeft().x, position.y + selectionBoxSize / 4, 
                    formatCash(this.shopItems[i].selection.getPrice(this.cache.json)), priceTextStyle);
                priceText.setFixedSize(selectionBoxSize, selectionBoxSize / 2);
            }
        }

        // Shop selection highlight
        let selectedPosition = this.getSelectionPosition(0);
        this.shopHighlight = this.add.rectangle(selectedPosition.x, selectedPosition.y, selectionBoxSize, selectionBoxSize);
        this.shopHighlight.isFilled = false;
        this.shopHighlight.setStrokeStyle(5, 0xFFFFFF);
        this.clearShopSelection();
        this.updateValidShopSelections(state.getCurrentCash());

        // Tooltip
        this.tooltipRect = this.add.rectangle(selectedPosition.x, selectedPosition.y, tooltipWidth, tooltipHeight, 0xfffbf0);
        this.tooltipRect.setOrigin(1, 0);
        this.tooltipText = this.add.text(this.tooltipRect.getTopLeft().x + tooltipTextMargin,
            this.tooltipRect.getTopLeft().y + tooltipTextMargin, "", tooltipTextStyle);
        this.tooltipText.setFixedSize(tooltipWidth - 2 * tooltipTextMargin, tooltipHeight - 2 * tooltipTextMargin);
        this.hideTooltip();
    }

    getSelectionPosition(index) {
        return new Phaser.Math.Vector2(
            this.game.renderer.width - 110 + (shopSelectionXMargin * (index % 2)),
            topShopSelectionY + (shopSelectionYMargin * Math.floor(index / 2)));
    }

    selectShopItem(index) {
        let newHighlightPosition = this.getSelectionPosition(index);
        this.shopHighlight.x = newHighlightPosition.x;
        this.shopHighlight.y = newHighlightPosition.y;
        this.shopHighlight.setVisible(true);
        setShopSelection(this.shopItems[index].selection);
    }

    clearShopSelection() {
        this.shopHighlight.setVisible(false);
        setShopSelection(null);
    }

    updateValidShopSelections(currentCash) {
        for (let i = 0; i < this.shopItems.length; i++) {
            // If the player should be able to select this option then make it active
            if (this.shopItems[i].selection.selectionType == ShopSelectionType.DEMOLITION || this.shopItems[i].selection.getPrice(this.cache.json) <= currentCash) {
                this.shopItems[i].sprite.alpha = 1;
                this.shopItems[i].selectionBox.setInteractive();
            // Otherwise prevent selecting this option
            } else {
                this.shopItems[i].sprite.alpha = 0.5;
                this.shopItems[i].selectionBox.disableInteractive();
                if (getShopSelection() == this.shopItems[i].selection) {
                    this.clearShopSelection();
                }
            }
        }
    }

    setTooltip(index) {
        let tooltipPosition = this.getSelectionPosition(index);
        this.tooltipRect.x = tooltipPosition.x;
        this.tooltipRect.y = tooltipPosition.y;
        this.tooltipText.x = this.tooltipRect.getTopLeft().x + tooltipTextMargin;
        this.tooltipText.y = this.tooltipRect.getTopLeft().y + tooltipTextMargin;
        this.tooltipText.setText(this.getTooltipText(index));
        this.tooltipRect.setVisible(true);
        this.tooltipText.setVisible(true);
    }

    getTooltipText(index) {
        let shopSelection;
        let text;
        if (this.shopItems[index].selection.selectionType == ShopSelectionType.DEMOLITION) {
            text = "Demolish building";
            text += "\n\nCost: Half of the construction cost for the selected building";
        } else {
            if (this.shopItems[index].selection.selectionType == ShopSelectionType.TILE_ONLY) {
                shopSelection = this.cache.json.get('tiles')[this.shopItems[index].selection.getName()];
            } else {
                shopSelection = this.cache.json.get('buildings')[this.shopItems[index].selection.getName()];
            }

            text = shopSelection['name'];
            text += "\nCost: ";
            text += formatCash(shopSelection['cost']);
            text += "\nCash per second: ";
            text += formatCash(shopSelection['baseCashGrowthRate']);
            text += "\nCash per click: ";
            text += formatCash(shopSelection['baseClickValue']);
            if (this.shopItems[index].selection.selectionType == ShopSelectionType.TILE_AND_BUILDING) {
                text += "\nTile: ";
                text += shopSelection['tileName'];
            }
            text += "\n\n";
            text += shopSelection['description'];
        }
        return text;
    }

    hideTooltip() {
        this.tooltipRect.setVisible(false);
        this.tooltipText.setVisible(false);
    }

    cashChangeListener(cash, scene) {
        scene.currentCashText.setText(formatCash(cash));
        scene.updateValidShopSelections(cash);
    }

    cashGrowthListener(cashGrowth, scene) {
        scene.cashGrowthRateText.setText(formatCash(cashGrowth));
    }

    addCashPerSecond(seconds) {
        state.addCurrentCash(seconds * state.getCashGrowthRate());
    }

    currentDateListener(currentDate, scene) {
        scene.currentDateText.setText(formatDate(currentDate));
    }

    // Add cash every second
    update() {
        let now = Date.now();
        if (this.lastCashGrowth === -1) {
            this.lastCashGrowth = now;
        }
        
        let timePassed = now - this.lastCashGrowth;
        // Update date and cash every second
        if (timePassed >= 1000) {
            let secondsPassed = Math.floor(timePassed / 1000);
            this.addCashPerSecond(secondsPassed);
            date.addDays(secondsPassed);
            let timeRemainder = timePassed - (secondsPassed * 1000);
            this.lastCashGrowth = now - timeRemainder;
        }
    }
}
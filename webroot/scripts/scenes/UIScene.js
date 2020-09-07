import * as state from '../state/CashState';
import { ShopSelection, ShopSelectionType, setShopSelection, getShopSelection, isInDialog, setInDialog } from '../state/UIState';
import { addGameResetListener, saveGame, resetGame } from '../state/GameState';
import { formatCash } from '../util/Util';

const imageScale = 0.4;
const topShopSelectionY = 80;
const shopSelectionYMargin = 70;
const shopSelectionXMargin = 70;
const selectionBoxSize = 143 * imageScale;
const tooltipWidth = 250;
const tooltipHeight = 150;
const tooltipTextMargin = 5;
const tooltipColor = 0xfffbf0;

export class UIScene extends Phaser.Scene {
    constructor() {
        super({
            key: "UIScene"
        });
    }

    create() {
        // Text styles
        let titleTextStyle = { 
            font: "bold 48px Verdana",
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 4,
                stroke: true,
                fill: true
            }};
        let subtitleTextStyle = JSON.parse(JSON.stringify(titleTextStyle));
        subtitleTextStyle.font = "32px Verdana";
        subtitleTextStyle.shadow.blur = 3;
        let tooltipTextStyle = { 
            font: "14px Courier",
            fill: "#000000",
            wordWrap: { 
                width: (tooltipWidth - 2 * tooltipTextMargin),
                useAdvancedWrap: true
            }
        };
        let buttonTitleStyle = JSON.parse(JSON.stringify(subtitleTextStyle));
        buttonTitleStyle.font = "20px Verdana";
        buttonTitleStyle.shadow.blur = 1;

        const mapOriginX = this.game.renderer.width / 2 - 50;

        // Save and reset buttons
        this.selectedButton = null;
        this.createButtonShadow('resetButton', 5, 5, 2).setOrigin(0, 0);
        this.resetButton = this.add.image(5, 5, 'resetButton');
        this.resetButton.setOrigin(0, 0);
        this.configureButton("resetButton");
        this.createButtonShadow('saveButton', 60, 5, 2).setOrigin(0, 0);
        this.saveButton = this.add.image(60, 5, 'saveButton');
        this.saveButton.setOrigin(0, 0);
        this.configureButton("saveButton");

        // Status message text
        this.statusMessage = this.add.text(5, this.game.renderer.height - 5, "", subtitleTextStyle);
        this.statusMessage.setOrigin(0, 1);
        this.statusMessage.alpha = 0;

        // Cash UI
        this.currentCashText = this.add.text(mapOriginX, 25,
            formatCash(state.getCurrentCash()), titleTextStyle);
        this.currentCashText.setOrigin(0.5);
        this.cashGrowthRateText = this.add.text(mapOriginX, 70, 
            formatCash(state.getCashGrowthRate()) + "/second", subtitleTextStyle);
        this.cashGrowthRateText.setOrigin(0.5);

        // Listeners
        state.addCurrentCashListener(this.cashChangeListener, this);
        state.addCashGrowthListener(this.cashGrowthListener, this);
        addGameResetListener(this.gameResetListener, this);

        // Timers
        this.lastCashGrowth = -1;
        this.lastSave = -1;

        // Shop selection UI
        let shopSelectionBox = this.add.rectangle(this.game.renderer.width - 75, this.game.renderer.height / 2, 150, this.game.renderer.height, 0x404040);
        shopSelectionBox.setInteractive();
        shopSelectionBox.on("pointerdown", () => {
            if (!isInDialog()) {
                this.clearShopSelection();
            }
        });
        this.add.text(this.game.renderer.width - 115, 9, "Shop", { font: "bold 30px Arial" });

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
            this.shopItems[i].selectionBox.on("pointerout", () => { this.tooltip.setVisible(false); });
            if (this.shopItems[i].selection.selectionType != ShopSelectionType.DEMOLITION) {
                let priceText = this.add.text(this.shopItems[i].selectionBox.getTopLeft().x, position.y + selectionBoxSize / 4, 
                    formatCash(this.shopItems[i].selection.getPrice(this.cache.json)),
                    { font: "bold 10px Verdana", fill: "#000000", align: "center" });
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
        let tooltipRect = this.add.rectangle(0, 0, tooltipWidth, tooltipHeight, tooltipColor);
        tooltipRect.setOrigin(1, 0);
        this.tooltipText = this.add.text(tooltipRect.getTopLeft().x + tooltipTextMargin,
            tooltipRect.getTopLeft().y + tooltipTextMargin, "", tooltipTextStyle);
        this.tooltipText.setFixedSize(tooltipWidth - 2 * tooltipTextMargin, tooltipHeight - 2 * tooltipTextMargin);
        this.tooltip = this.add.container(selectedPosition.x, selectedPosition.y, [
            tooltipRect,
            this.tooltipText]);
        this.tooltip.setVisible(false);

        // Reset confirmation popup
        let confirmationPanel = this.add.image(mapOriginX, this.game.renderer.height / 2 - 20, 'promptPanel').setTint(0x4287f5);
        let confirmationTextLine1 = this.add.text(mapOriginX, this.game.renderer.height / 2 - 90, 
            "Reset game?", { ...subtitleTextStyle, shadow: { ...subtitleTextStyle.shadow, blur: 1 }}).setOrigin(0.5, 0);
        let confirmationTextLine2 = this.add.text(mapOriginX, this.game.renderer.height / 2 - 50, 
            "You will lose all progress.", { ...subtitleTextStyle, shadow: { ...subtitleTextStyle.shadow, blur: 1 }}).setOrigin(0.5, 0);
        const panelButtonY = this.game.renderer.height / 2 + 13;
        const panelButtonScale = 0.75;
        let confirmShadow = this.createButtonShadow("confirmButton", mapOriginX + 70, panelButtonY, 1).setScale(panelButtonScale);
        this.confirmButton = this.add.image(mapOriginX + 70, panelButtonY, 'confirmButton').setScale(panelButtonScale);
        this.configureButton("confirmButton");
        let confirmText = this.add.text(this.confirmButton.getTopCenter().x, this.confirmButton.getBottomCenter().y + 2,
            "Reset", buttonTitleStyle).setOrigin(0.5, 0);
        let cancelShadow = this.createButtonShadow("cancelButton", mapOriginX - 70, panelButtonY, 1).setScale(panelButtonScale);
        this.cancelButton = this.add.image(mapOriginX - 70, panelButtonY, 'cancelButton').setScale(panelButtonScale);
        let cancelText = this.add.text(this.cancelButton.getTopCenter().x, this.cancelButton.getBottomCenter().y + 2,
            "Cancel", buttonTitleStyle).setOrigin(0.5, 0);
        this.configureButton("cancelButton");
        this.confirmationPopup = this.add.group([
            confirmationPanel,
            confirmationTextLine1, 
            confirmationTextLine2,
            confirmShadow,
            this.confirmButton,
            cancelShadow, 
            this.cancelButton,
            confirmText,
            cancelText]);
        this.confirmationPopup.setVisible(false);
    }

    // If the game is reset, clear shop selection
    gameResetListener(scene) {
        scene.clearShopSelection();
    }

    getSelectionPosition(index) {
        return new Phaser.Math.Vector2(
            this.game.renderer.width - 110 + (shopSelectionXMargin * (index % 2)),
            topShopSelectionY + (shopSelectionYMargin * Math.floor(index / 2)));
    }

    selectShopItem(index) {
        if (isInDialog()) {
            return;
        }
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
        if (isInDialog()) {
            return;
        }
        let tooltipPosition = this.getSelectionPosition(index);
        this.tooltip.setPosition(tooltipPosition.x, tooltipPosition.y);
        this.tooltipText.setText(this.getTooltipText(index));
        this.tooltip.setVisible(true);
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

    createButtonShadow(buttonName, buttonX, buttonY, offset) {
        let buttonShadow = this.add.image(buttonX + offset, buttonY + offset, buttonName);
        buttonShadow.setTint(0x000000);
        buttonShadow.alpha = 0.5;
        return buttonShadow;
    }

    configureButton(buttonName) {
        this[buttonName].setInteractive();
        this[buttonName].on('pointerout', () => {
            this[buttonName].setTexture(buttonName); 
            this.selectedButton = null;
        });
        this[buttonName].on('pointerdown', () => {
            this[buttonName].setTexture(buttonName + "Down");
            this.selectedButton = buttonName;
        });
        this[buttonName].on('pointerup', () => {
            this[buttonName].setTexture(buttonName);
            if (this.selectedButton === buttonName) {
                this.handleButtonClick(this.selectedButton);
            }
            this.selectedButton = null;
        });
    }

    save() {
        saveGame();
        this.lastSave = Date.now();
        this.showStatusMessage("Game saved!");
    }

    handleButtonClick(buttonName) {
        switch (buttonName) {
            case "saveButton":
                this.save();
                break;
            case "resetButton":
                this.confirmationPopup.setVisible(true);
                setInDialog(true);
                break;
            case "confirmButton":
                // Reset last save time to give a chance to refresh after a reset
                this.confirmationPopup.setVisible(false);
                setInDialog(false);
                this.lastSave = Date.now();
                resetGame(this.cache.json);
                this.showStatusMessage("Game reset");
                break;
            case "cancelButton":
                this.confirmationPopup.setVisible(false);
                setInDialog(false);
                break;
        }
    }

    showStatusMessage(text) {
        if (this.statusFadeTween) {
            this.statusFadeTween.stop();
            this.statusFadeTween.remove();
        }
        this.tweens.add({
            targets: this.statusMessage,
            alpha: 1,
            ease: 'Linear',
            duration: 200,
            repeat: 0,
            yoyo: false
        });
        this.statusMessage.setText(text);
        if (this.statusFadeTimer) {
            this.statusFadeTimer.remove();
        }
        this.statusFadeTimer = this.time.delayedCall(2000, this.hideStatusMessage, [], this);
    }

    hideStatusMessage() {
        this.statusFadeTween = this.tweens.add({
            targets: this.statusMessage,
            alpha: 0,
            ease: 'Linear',
            duration: 500,
            repeat: 0,
            yoyo: false
        });
    }

    cashChangeListener(cash, scene) {
        scene.currentCashText.setText(formatCash(cash));
        scene.updateValidShopSelections(cash);
    }

    cashGrowthListener(cashGrowth, scene) {
        scene.cashGrowthRateText.setText(formatCash(cashGrowth) + "/second");
    }

    addCashPerSecond(seconds) {
        state.addCurrentCash(seconds * state.getCashGrowthRate());
    }

    update() {
        let now = Date.now();
        if (this.lastCashGrowth === -1) {
            this.lastCashGrowth = now;
        }
        if (this.lastSave === -1) {
            this.lastSave = now;
        }
        
        // Add cash every tenth of a second
        let cashGrowthTimePassed = now - this.lastCashGrowth;
        if (cashGrowthTimePassed >= 100) {
            let decisecondsPassed = Math.floor(cashGrowthTimePassed / 100);
            this.addCashPerSecond(decisecondsPassed / 10.0);
            let timeRemainder = cashGrowthTimePassed - (decisecondsPassed * 100);
            this.lastCashGrowth = now - timeRemainder;
        }

        // Autosave every minute
        let autoSaveTimePassed = now - this.lastSave;
        if (autoSaveTimePassed >= 60000) {
            this.save();
        }
    }
}
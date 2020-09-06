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
const buttonTooltipHeight = 28;
const tooltipColor = 0xfffbf0;

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
        let shopTextStyle = { font: "bold 30px Arial", boundsAlignH: "center", boundsAlignV: "middle" };
        let tooltipTextStyle = { font: "14px Courier", fill: "#000000", align: "left", wordWrap: { width: (tooltipWidth - 2 * tooltipTextMargin), useAdvancedWrap: true } }
        let priceTextStyle = { font: "bold 10px Verdana", fill: "#000000", align: "center" };
        let statusTextStyle = { font: "bold 32px Arial", fill: "#000000", boundsAlignH: "center", boundsAlignV: "middle" };
        let buttonTitleStyle = { font: "bold 16px Arial", fill: "#000000", boundsAlignH: "center", boundsAlignV: "middle" };

        // Save and reset buttons and button tooltip
        this.buttonTooltipRect = this.add.rectangle(30, 65, tooltipWidth, buttonTooltipHeight, tooltipColor);
        this.buttonTooltipRect.setOrigin(0, 0);
        this.buttonTooltipText = this.add.text(0, 0, "", tooltipTextStyle);
        this.buttonTooltip = this.add.group([this.buttonTooltipRect, this.buttonTooltipText]);
        this.buttonTooltip.setVisible(false);
        this.selectedButton = null;
        this.resetButton = this.add.image(5, 5, 'resetButton');
        this.resetButton.setOrigin(0, 0);
        this.configureButton("resetButton", true, 5, 65);
        this.saveButton = this.add.image(60, 5, 'saveButton');
        this.saveButton.setOrigin(0, 0);
        this.configureButton("saveButton", true, 60, 65);

        // Status message text
        this.statusMessage = this.add.text(5, this.game.renderer.height - 5, "", statusTextStyle);
        this.statusMessage.setOrigin(0, 1);
        this.statusMessage.alpha = 0;

        // Cash UI
        this.add.rectangle(this.game.renderer.width / 2, 25, 350, 50, 0x404040);
        this.add.rectangle(this.game.renderer.width / 2, 65, 200, 30, 0x000000);
        this.currentCashText = this.add.text(this.game.renderer.width / 2, 25,
            formatCash(state.getCurrentCash()), titleTextStyle);
        this.currentCashText.setOrigin(0.5);
        this.cashGrowthRateText = this.add.text(this.game.renderer.width / 2, 65, 
            formatCash(state.getCashGrowthRate()), subtitleTextStyle);
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
            this.shopItems[i].selectionBox.on("pointerout", () => { this.tooltip.setVisible(false); });
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
        this.tooltipRect = this.add.rectangle(selectedPosition.x, selectedPosition.y, tooltipWidth, tooltipHeight, tooltipColor);
        this.tooltipRect.setOrigin(1, 0);
        this.tooltipText = this.add.text(this.tooltipRect.getTopLeft().x + tooltipTextMargin,
            this.tooltipRect.getTopLeft().y + tooltipTextMargin, "", tooltipTextStyle);
        this.tooltipText.setFixedSize(tooltipWidth - 2 * tooltipTextMargin, tooltipHeight - 2 * tooltipTextMargin);
        this.tooltip = this.add.group([this.tooltipRect, this.tooltipText]);
        this.tooltip.setVisible(false);

        // Reset confirmation popup
        this.confirmationRect = this.add.rectangle(this.game.renderer.width / 2, this.game.renderer.height / 2 - 20, 410, 150, tooltipColor);
        this.confirmationTextLine1 = this.add.text(this.game.renderer.width / 2, this.game.renderer.height / 2 - 90, 
            "Reset game?", statusTextStyle);
        this.confirmationTextLine1.setOrigin(0.5, 0);
        this.confirmationTextLine2 = this.add.text(this.game.renderer.width / 2, this.game.renderer.height / 2 - 50, 
            "You will lose all progress.", statusTextStyle);
        this.confirmationTextLine2.setOrigin(0.5, 0);
        this.confirmButton = this.add.image(this.game.renderer.width / 2 + 50, this.game.renderer.height / 2 + 25, 'confirmButton');
        this.confirmButton.setScale(0.75);
        this.configureButton("confirmButton", false);
        this.confirmText = this.add.text(this.confirmButton.getTopCenter().x, this.confirmButton.getTopCenter().y - 2, "Reset", buttonTitleStyle);
        this.confirmText.setOrigin(0.5, 1);
        this.cancelButton = this.add.image(this.game.renderer.width / 2 - 50, this.game.renderer.height / 2 + 25, 'cancelButton');
        this.cancelButton.setScale(0.75);
        this.cancelText = this.add.text(this.cancelButton.getTopCenter().x, this.cancelButton.getTopCenter().y - 2, "Cancel", buttonTitleStyle);
        this.cancelText.setOrigin(0.5, 1);
        this.configureButton("cancelButton", false);
        this.confirmationPopup = this.add.group([
            this.confirmationRect,
            this.confirmationTextLine1, 
            this.confirmationTextLine2, 
            this.confirmButton, 
            this.cancelButton,
            this.confirmText,
            this.cancelText]);
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
        this.tooltipRect.x = tooltipPosition.x;
        this.tooltipRect.y = tooltipPosition.y;
        this.tooltipText.x = this.tooltipRect.getTopLeft().x + tooltipTextMargin;
        this.tooltipText.y = this.tooltipRect.getTopLeft().y + tooltipTextMargin;
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

    configureButton(buttonName, createTooltip, tooltipX, tooltipY) {
        this[buttonName].setInteractive();
        if (createTooltip) {
            this[buttonName].on('pointerover', () => { this.setButtonTooltip(buttonName, tooltipX, tooltipY); });
        }
        this[buttonName].on('pointerout', () => {
            if (createTooltip) {
                this.buttonTooltip.setVisible(false);
            }
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

    setButtonTooltip(buttonName, x, y) {
        this.buttonTooltipRect.x = x;
        this.buttonTooltipRect.y = y;
        this.buttonTooltipText.x = this.buttonTooltipRect.getTopLeft().x + tooltipTextMargin;
        this.buttonTooltipText.y = this.buttonTooltipRect.getTopLeft().y + tooltipTextMargin;
        this.buttonTooltip.setVisible(true);
        let text = "Invalid button name";
        switch (buttonName) {
            case "resetButton":
                text = "Reset all game progress";
                break;
            case "saveButton":
                text = "Save your progress";
                break;
        }
        this.buttonTooltipText.setText(text);
        this.buttonTooltipRect.setDisplaySize(text.length * 8.5 + 2 * tooltipTextMargin, buttonTooltipHeight);
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
        scene.cashGrowthRateText.setText(formatCash(cashGrowth));
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
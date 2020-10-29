import * as state from '../state/CashState';
import { rotateClockwise } from '../state/MapState';
import { ShopSelection, ShopSelectionType, setShopSelection, getShopSelection, isInDialog, setInDialog } from '../state/UIState';
import { addGameResetListener, saveGame, resetGame } from '../state/GameState';
import { formatCash, isBlank, formatPhaserCashText } from '../util/Util';
import * as audio from '../state/AudioState';

const imageScale = 0.48;
const topShopSelectionY = 90;
const shopSelectionYMargin = 80;
const shopSelectionXMargin = 80;
const selectionBoxSize = 143 * imageScale;
const selectionBoxScale = imageScale * 1.5;
const maxTooltipWidth = 225;
const tooltipTextMargin = 10;
const tooltipTextBreakYMargin = 12;
const tooltipTextBreakXMargin = 30;
const tooltipFlipIndex = 8;

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
            font: "14px Verdana",
            fill: "#000000",
            align: "center",
            wordWrap: { 
                width: (maxTooltipWidth - 2 * tooltipTextMargin),
                useAdvancedWrap: true
            }
        };
        let buttonTitleStyle = JSON.parse(JSON.stringify(subtitleTextStyle));
        buttonTitleStyle.font = "20px Verdana";
        buttonTitleStyle.shadow.blur = 1;
        let shopPriceStyle = JSON.parse(JSON.stringify(subtitleTextStyle));
        shopPriceStyle.font = "12px Verdana";
        shopPriceStyle.shadow.blur = 2;
        shopPriceStyle.align = "center";

        const mapOriginX = this.game.renderer.width / 2 - 50;

        // Save, reset, and rotate buttons
        this.selectedButton = null;
        this.createButtonShadow('resetButton', 5, 5, 2).setOrigin(0, 0);
        this.resetButton = this.add.image(5, 5, 'resetButton').setOrigin(0, 0);
        this.configureButton("resetButton");
        this.createButtonShadow('saveButton', 5, 60, 2).setOrigin(0, 0);
        this.saveButton = this.add.image(5, 60, 'saveButton').setOrigin(0, 0);
        this.configureButton("saveButton");
        this.createButtonShadow('rotateClockwiseButton', 5, 115, 2).setOrigin(0, 0);
        this.rotateClockwiseButton = this.add.image(5, 115, 'rotateClockwiseButton').setOrigin(0, 0);
        this.configureButton("rotateClockwiseButton");

        // Audio buttons
        this.createButtonShadow('musicOnButton', 5, 170, 2).setOrigin(0, 0);
        this.currentMusicButtonTexture = this.getMusicButtonTexture();
        this.musicControlButton = this.add.image(5, 170, this.currentMusicButtonTexture).setOrigin(0, 0);
        this.configureButton("musicControlButton", "currentMusicButtonTexture");
        this.createButtonShadow('soundOnButton', 5, 225, 2).setOrigin(0, 0);
        this.currentSoundButtonTexture = this.getSoundButtonTexture();
        this.soundControlButton = this.add.image(5, 225, this.currentSoundButtonTexture).setOrigin(0, 0);
        this.configureButton("soundControlButton", "currentSoundButtonTexture");

        // Status message text
        this.statusMessage = this.add.text(5, this.game.renderer.height - 5, "", subtitleTextStyle);
        this.statusMessage.setOrigin(0, 1);
        this.statusMessage.alpha = 0;

        // Cash UI
        this.currentCashText = this.add.text(mapOriginX, 25,
            formatCash(state.getCurrentCash(), false), titleTextStyle);
        this.currentCashText.setOrigin(0.5);
        this.cashGrowthRateText = this.add.text(mapOriginX, 70, 
            formatCash(state.getCashGrowthRate(), false) + "/second", subtitleTextStyle);
        this.cashGrowthRateText.setOrigin(0.5);

        // Listeners
        state.addCurrentCashListener(this.cashChangeListener, this);
        state.addCashGrowthListener(this.cashGrowthListener, this);
        addGameResetListener(this.gameResetListener, this);

        // Timers
        this.lastCashGrowth = -1;
        this.lastSave = -1;

        // Shop selection UI
        let shopSelectionBox = this.add.rectangle(this.game.renderer.width - 75, this.game.renderer.height / 2, 200, this.game.renderer.height, 0x000000);
        shopSelectionBox.alpha = 0.5;
        shopSelectionBox.setInteractive();
        shopSelectionBox.on("pointerdown", () => {
            if (!isInDialog()) {
                this.clearShopSelection();
            }
        });
        this.add.text(this.game.renderer.width - 136, 9, "Shop", { ...subtitleTextStyle, font: "bold 34px Verdana" });

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
            this.shopItems[i].selectionBox = this.add.nineslice(position.x, position.y, 100, 100, 'greyPanel', 7).setOrigin(0.5);
            this.shopItems[i].selectionBox.setScale(selectionBoxScale);
            this.shopItems[i].sprite = this.add.image(position.x, position.y, this.shopItems[i].selection.getName()).setScale(imageScale);
            this.shopItems[i].selectionBox.setInteractive();
            this.shopItems[i].selectionBox.on("pointerdown", () => { this.selectShopItem(i); });
            this.shopItems[i].selectionBox.on("pointerover", () => { this.setTooltip(i); });
            this.shopItems[i].selectionBox.on("pointerout", () => { this.tooltip.setVisible(false); });
            if (this.shopItems[i].selection.selectionType != ShopSelectionType.DEMOLITION) {
                this.add.rectangle(this.shopItems[i].selectionBox.getTopLeft().x, position.y + selectionBoxSize / 4,
                    selectionBoxSize + 3, selectionBoxSize / 4 + 1, 0x000000).setOrigin(0).setAlpha(0.5);
                this.shopItems[i].priceText = this.add.text(this.shopItems[i].selectionBox.getTopLeft().x, position.y + selectionBoxSize / 4, 	
                    formatCash(this.shopItems[i].selection.getPrice(this.cache.json), true), shopPriceStyle);	
                this.shopItems[i].priceText.setFixedSize(selectionBoxSize, selectionBoxSize / 2);
            }
        }

        // Shop selection highlight
        let selectedPosition = this.getSelectionPosition(0);
        this.shopHighlight = this.add.rectangle(selectedPosition.x, selectedPosition.y, selectionBoxSize, selectionBoxSize);
        this.shopHighlight.isFilled = false;
        this.shopHighlight.setStrokeStyle(5, 0x4287f5);
        this.shopHighlight.alpha = 0.75;
        this.clearShopSelection();
        this.updateValidShopSelections(state.getCurrentCash());

        // Tooltip
        this.tooltipPanel = this.add.nineslice(0, 0, 0, 0, 'greyPanel', 7).setOrigin(1, 0);
        this.tooltipTitle = this.add.text(0, 0, "", { ...tooltipTextStyle, font: "18px Verdana" }).setOrigin(0.5, 0);
        this.tooltipPrice = this.add.text(0, 0, "", { ...tooltipTextStyle, font: "16px Verdana" }).setOrigin(0.5, 0);
        this.tooltipGrowthRate = this.add.text(0, 0, "", { ...tooltipTextStyle, font: "16px Verdana" }).setOrigin(0.5, 0);
        this.tooltipClickValue = this.add.text(0, 0, "", { ...tooltipTextStyle, font: "16px Verdana" }).setOrigin(0.5, 0);
        this.tooltipDescription = this.add.text(0, 0, "", tooltipTextStyle).setOrigin(0.5, 0);
        this.tooltipTexts = [
            this.tooltipTitle, 
            this.tooltipPrice, 
            this.tooltipGrowthRate,
            this.tooltipClickValue,
            this.tooltipDescription
        ];
        this.tooltipTitleBreak = this.add.line(0, 0, 0, 0, 0, 0, 0x999999).setOrigin(0, 0);
        this.tooltipPriceBreak = this.add.line(0, 0, 0, 0, 0, 0, 0x999999).setOrigin(0, 0);
        this.tooltipRatesBreak = this.add.line(0, 0, 0, 0, 0, 0, 0x999999).setOrigin(0, 0);
        this.tooltipBreaks = [
            this.tooltipTitleBreak,
            this.tooltipPriceBreak,
            this.tooltipRatesBreak
        ];
        this.tooltip = this.add.group([this.tooltipPanel].concat(this.tooltipTexts).concat(this.tooltipBreaks));
        this.tooltip.setVisible(false);

        // Reset confirmation popup
        let confirmationPanel = this.add.nineslice(mapOriginX, this.game.renderer.height / 2 - 20,
            450, 175, 'greyPanel', 7).setOrigin(0.5).setTint(0x4287f5);
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

    getMusicButtonTexture() {
        return audio.isMusicEnabled() ? "musicOnButton" : "musicOffButton";
    }

    getSoundButtonTexture() {
        return audio.isSoundEnabled() ? "soundOnButton" : "soundOffButton";
    }

    // If the game is reset, clear shop selection
    gameResetListener(scene) {
        scene.clearShopSelection();
    }

    getSelectionPosition(index) {
        return new Phaser.Math.Vector2(
            this.game.renderer.width - 128 + (shopSelectionXMargin * (index % 2)),
            topShopSelectionY + (shopSelectionYMargin * Math.floor(index / 2)));
    }

    selectShopItem(index) {
        if (isInDialog()) {
            return;
        }
        let newHighlightPosition = this.getSelectionPosition(index);
        if (this.shopHighlight.visible && this.shopHighlight.x == newHighlightPosition.x &&
                this.shopHighlight.y == newHighlightPosition.y) {
            // Deselect if the same selection is clicked again
            this.clearShopSelection();
        } else {
            this.shopHighlight.x = newHighlightPosition.x;
            this.shopHighlight.y = newHighlightPosition.y;
            this.shopHighlight.setVisible(true);
            setShopSelection(this.shopItems[index].selection);
            audio.playSound(this, "shopSelect");
        }
    }

    clearShopSelection() {
        this.shopHighlight.setVisible(false);
        setShopSelection(null);
        audio.playSound(this, "shopDeselect");
    }

    updateValidShopSelections(currentCash) {
        for (let i = 0; i < this.shopItems.length; i++) {
            // If the player should be able to select this option then make it active
            if (this.shopItems[i].selection.selectionType == ShopSelectionType.DEMOLITION || this.shopItems[i].selection.getPrice(this.cache.json) <= currentCash) {
                this.shopItems[i].sprite.alpha = 1;
                if (!this.shopItems[i].selectionBox.input.enabled) {
                    // If shop item is unlocking just now, then play a little sound
                    audio.playSound(this, "shopUnlock", 0.75);
                }
                this.shopItems[i].selectionBox.setInteractive();
                if (this.shopItems[i].selection.selectionType != ShopSelectionType.DEMOLITION) {
                    this.shopItems[i].priceText.setColor("#ffffff");
                }
            // Otherwise prevent selecting this option
            } else {
                this.shopItems[i].sprite.alpha = 0.5;
                this.shopItems[i].priceText.setColor("#ff6666");
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
        this.tooltipPanel.setPosition(tooltipPosition.x, tooltipPosition.y);
        // Flip tooltip for lower selections so it doesn't get cut off at the bottom of the screen
        if (index < tooltipFlipIndex) {
            this.tooltipPanel.setOrigin(1, 0);
        } else {
            this.tooltipPanel.setOrigin(1, 1);
        }
        this.setTooltipText(index);

        let panelWidth = 0;
        let panelHeight = tooltipTextMargin;
        let tooltipTextYDiff = [];
        // Resize panel
        for (let i = 0; i < this.tooltipTexts.length; i++) {
            if (!isBlank(this.tooltipTexts[i].text)) {
                panelWidth = Math.max(panelWidth, this.tooltipTexts[i].width + 2 * tooltipTextMargin);
                // No line break is added between the cash growth rates. Also should ignore presence of "/click"
                // in the last text, since it is the description, no the click value.
                if (i > 0 && (i == this.tooltipTexts.length - 1 || !this.tooltipTexts[i].text.includes("/click"))) {
                    panelHeight += tooltipTextBreakYMargin;
                }
                tooltipTextYDiff[i] = panelHeight;
                panelHeight += this.tooltipTexts[i].height + tooltipTextMargin;
            }
        }
        // There is a bug in Phaser 3 that causes fonts to looks messy after resizing
        // the nineslice. For now using the workaround of creating and immediately
        // deleting a dummy text object after resizing the nineslice.
        // When this is fixed in a future Phaser release this can be removed.
        // See https://github.com/jdotrjs/phaser3-nineslice/issues/16
        // See https://github.com/photonstorm/phaser/issues/5064
        this.tooltipPanel.resize(panelWidth, panelHeight);
        let dummyText = this.add.text(0, 0, "");
        dummyText.destroy();
        
        // Move text and break objects
        for (let i = 0; i < this.tooltipTexts.length; i++) {
            this.tooltipTexts[i].setPosition(this.tooltipPanel.getTopCenter().x, this.tooltipPanel.getTopCenter().y + tooltipTextYDiff[i]);
            this.tooltipTexts[i].width = panelWidth - 2 * tooltipTextMargin;
        }
        let breakX = this.tooltipPanel.getTopLeft().x + tooltipTextBreakXMargin;
        let breakY = this.tooltipPrice.getTopCenter().y - (tooltipTextBreakYMargin + tooltipTextMargin) / 2;
        this.tooltipTitleBreak.setTo(breakX, breakY, this.tooltipPanel.getTopRight().x - tooltipTextBreakXMargin, breakY);
        breakY = this.tooltipGrowthRate.getTopCenter().y - (tooltipTextBreakYMargin + tooltipTextMargin) / 2;
        this.tooltipPriceBreak.setTo(breakX, breakY, this.tooltipPanel.getTopRight().x - tooltipTextBreakXMargin, breakY);
        breakY = this.tooltipDescription.getTopCenter().y - (tooltipTextBreakYMargin + tooltipTextMargin) / 2;
        this.tooltipRatesBreak.setTo(breakX, breakY, this.tooltipPanel.getTopRight().x - tooltipTextBreakXMargin, breakY);

        this.tooltip.setVisible(true);
    }

    setTooltipText(index) {
        let shopSelection;
        if (this.shopItems[index].selection.selectionType == ShopSelectionType.DEMOLITION) {
            this.tooltipTitle.setText("Demolish building");
            this.tooltipPrice.setText("Costs half of the construction cost for the selected building");
            // Hide unneeded text and breaks
            this.tooltipPriceBreak.setAlpha(0);
            this.tooltipRatesBreak.setAlpha(0);
            this.tooltipGrowthRate.setText("");
            this.tooltipClickValue.setText("");
            this.tooltipDescription.setText("");
        } else {
            if (this.shopItems[index].selection.selectionType == ShopSelectionType.TILE_ONLY) {
                shopSelection = this.cache.json.get('tiles')[this.shopItems[index].selection.getName()];
            } else {
                shopSelection = this.cache.json.get('buildings')[this.shopItems[index].selection.getName()];
            }

            this.tooltipTitle.setText(shopSelection['name']);
            formatPhaserCashText(this.tooltipPrice, shopSelection['cost'], "", false, true);
            formatPhaserCashText(this.tooltipGrowthRate, shopSelection['baseCashGrowthRate'], "/second", true, false);
            formatPhaserCashText(this.tooltipClickValue, shopSelection['baseClickValue'], "/click", true, false);
            this.tooltipDescription.setText(shopSelection['description']);

            this.tooltipPriceBreak.setAlpha(1);
            this.tooltipRatesBreak.setAlpha(1);
        }
    }

    createButtonShadow(buttonName, buttonX, buttonY, offset) {
        let buttonShadow = this.add.image(buttonX + offset, buttonY + offset, buttonName);
        buttonShadow.setTint(0x000000);
        buttonShadow.alpha = 0.5;
        return buttonShadow;
    }

    configureButton(buttonName, textureVarName) {
        let texture = buttonName;
        if (textureVarName) {
            texture = this[textureVarName];
        }
        this[buttonName].setInteractive();
        this[buttonName].on('pointerout', () => {
            this[buttonName].setTexture(texture); 
            this.selectedButton = null;
        });
        this[buttonName].on('pointerdown', () => {
            this[buttonName].setTexture(texture + "Down");
            this.selectedButton = buttonName;
            audio.playSound(this, 'buttonClick');
        });
        this[buttonName].on('pointerup', () => {
            if (this.selectedButton === buttonName) {
                this.handleButtonClick(this.selectedButton);
            }
            if (textureVarName) {
                texture = this[textureVarName];
            }
            this[buttonName].setTexture(texture);
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
            case "rotateClockwiseButton":
                rotateClockwise();
                break;
            case "musicControlButton":
                // Toggle music
                audio.setMusicEnabled(!audio.isMusicEnabled());
                this.currentMusicButtonTexture = this.getMusicButtonTexture();
                break;
            case "soundControlButton":
                // Toggle sound
                audio.setSoundEnabled(!audio.isSoundEnabled());
                this.currentSoundButtonTexture = this.getSoundButtonTexture();
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
        scene.currentCashText.setText(formatCash(cash, false));
        scene.updateValidShopSelections(cash);
    }

    cashGrowthListener(cashGrowth, scene) {
        scene.cashGrowthRateText.setText(formatCash(cashGrowth, false) + "/second");
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
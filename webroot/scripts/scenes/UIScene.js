import * as state from '../state/CashState';
import { rotateClockwise, addPlacementListener, extendMap } from '../state/MapState';
import { setShopSelection, getShopSelection, isInDialog, setInDialog } from '../state/UIState';
import { addGameResetListener, saveGame, resetGame } from '../state/GameState';
import { formatCash, formatLargeCash, isBlank, formatPhaserCashText } from '../util/Util';
import * as audio from '../state/AudioState';
import { getSelections, getSelectionProp, ShopSelectionType, getType, getPrice, isFlatCost, getExpandPrice } from '../state/ShopSelectionCache';

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
        this.tooltipTextStyle = { 
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
        addPlacementListener(this.placementListener, this);

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
        for (let selection in getSelections()) {
            this.shopItems.push({ selection: selection });
        }

        this.priceTexts = {};
        for (let i = 0; i < this.shopItems.length - 1; i++) {
            let position = this.getSelectionPosition(i);
            this.shopItems[i].selectionBox = this.add.nineslice(position.x, position.y, 100, 100, 'greyPanel', 7).setOrigin(0.5);
            this.shopItems[i].selectionBox.setScale(selectionBoxScale);
            this.shopItems[i].sprite = this.add.image(position.x, position.y, this.shopItems[i].selection).setScale(imageScale);
            this.shopItems[i].selectionBox.setInteractive();
            this.shopItems[i].enabled = true;
            this.shopItems[i].selectionBox.on("pointerdown", () => {
                if (this.shopItems[i].enabled) {
                    this.selectShopItem(i);
                }
            });
            this.shopItems[i].selectionBox.on("pointerover", () => { 
                if (isInDialog()) {
                    return;
                }
                this.tooltips[i].setVisible(true);
            });
            this.shopItems[i].selectionBox.on("pointerout", () => { this.tooltips[i].setVisible(false); });
            if (getType(this.shopItems[i].selection) != ShopSelectionType.DEMOLITION) {
                this.add.rectangle(this.shopItems[i].selectionBox.getTopLeft().x, position.y + selectionBoxSize / 4,
                    selectionBoxSize + 3, selectionBoxSize / 4 + 1, 0x000000).setOrigin(0).setAlpha(0.5);
                let priceText = this.add.text(this.shopItems[i].selectionBox.getTopLeft().x, position.y + selectionBoxSize / 4, 	
                    formatLargeCash(getPrice(this.shopItems[i].selection)), shopPriceStyle);
                this.shopItems[i].priceText = priceText;
                this.priceTexts[this.shopItems[i].selection] = {};
                this.priceTexts[this.shopItems[i].selection]["shopPriceText"] = priceText;
                this.shopItems[i].priceText.setFixedSize(selectionBoxSize, selectionBoxSize / 2);
            }
        }

        // Map extension button
        let index = this.shopItems.length - 1;
        let position = this.getSelectionPosition(index);
        position.x += 40;
        position.y -= 17;
        this.shopItems[index].selectionBox = this.add.nineslice(position.x, position.y, 210, 60, 'greyPanel', 7).setOrigin(0.5);
        this.shopItems[index].selectionBox.setScale(selectionBoxScale);
        this.shopItems[index].sprite = this.add.image(position.x - 46, position.y - 7, "expand").setOrigin(1, 0.5).setScale(0.6);
        this.shopItems[index].text = this.add.text(position.x + 12, position.y - 6, "Expand map", 
            { font: "bold 16px Verdana", fill: "#000000" }).setOrigin(0.5);
        this.shopItems[index].selectionBox.setInteractive();
        this.shopItems[index].enabled = true;
        this.shopItems[index].selectionBox.on("pointerdown", () => {
            if (this.shopItems[index].enabled) {
                let price = getExpandPrice();
                if (state.getCurrentCash() >= price) {
                    audio.playSound(this, 'expandMap');
                    extendMap();
                    state.addCurrentCash(-1 * price);
                    this.placementListener(["expand"], this);
                }
            }
        });
        this.shopItems[index].selectionBox.on("pointerover", () => { 
            if (isInDialog()) {
                return;
            }
            this.tooltips[index].setVisible(true);
        });
        this.shopItems[index].selectionBox.on("pointerout", () => { this.tooltips[index].setVisible(false); });
        this.add.rectangle(this.shopItems[index].selectionBox.getTopLeft().x, position.y + 6,
            152, 16, 0x000000).setOrigin(0).setAlpha(0.5);
        let priceText = this.add.text(this.shopItems[index].selectionBox.getTopLeft().x, position.y + 6, 	
            formatLargeCash(getExpandPrice()), shopPriceStyle);
        priceText.setFixedSize(152, 16);
        this.priceTexts[this.shopItems[index].selection] = {};
        this.priceTexts[this.shopItems[index].selection]["shopPriceText"] = priceText;
        this.shopItems[index].priceText = priceText;

        // Shop selection highlight
        let selectedPosition = this.getSelectionPosition(0);
        this.shopHighlight = this.add.rectangle(selectedPosition.x, selectedPosition.y, selectionBoxSize, selectionBoxSize);
        this.shopHighlight.isFilled = false;
        this.shopHighlight.setStrokeStyle(5, 0x4287f5);
        this.shopHighlight.alpha = 0.75;

        // Shop tooltips
        this.tooltips = [];
        this.createTooltips();

        // Update current shop selection
        this.clearShopSelection();
        this.updateValidShopSelections(state.getCurrentCash());

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

    // If the game is reset, clear shop selection and reset prices
    gameResetListener(scene) {
        scene.clearShopSelection();
        for (let selection in getSelections()) {
            scene.updatePriceTexts(selection);
        }
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

    // Update the available shop selections
    updateValidShopSelections(currentCash) {
        let shopPrices = this.shopItems.map(function(item) {
            let result = {};
            result.price = getPrice(item.selection);
            result.selection = item.selection;
            return result;
        });

        shopPrices.sort((a, b) => a.price - b.price);
        this.shopPriceBounds = {};
        this.shopPriceBounds.below = -Number.MAX_VALUE;
        this.shopPriceBounds.above = shopPrices[0].price;
        this.shopPriceBounds.belowSelection = null;
        this.shopPriceBounds.aboveSelection = shopPrices[0].selection;
        let shopPricesFound = false;
        
        for (let i = 0; i < this.shopItems.length; i++) {
            // Update the price boundaries used to check when available shop selections should be updated
            if (i > 0 && currentCash >= shopPrices[i - 1].price && currentCash < shopPrices[i].price) {
                this.shopPriceBounds.below = shopPrices[i - 1].price;
                this.shopPriceBounds.belowSelection = shopPrices[i - 1].selection;
                this.shopPriceBounds.above = shopPrices[i].price;
                this.shopPriceBounds.aboveSelection = shopPrices[i].selection;
                shopPricesFound = true;
            }

            // If the player should be able to select this option then make it active
            if (getType(this.shopItems[i].selection) == ShopSelectionType.DEMOLITION || 
                    getPrice(this.shopItems[i].selection) <= currentCash) {
                if (!this.shopItems[i].enabled) {
                    this.shopItems[i].sprite.alpha = 1;
                    if (this.shopItems[i].selection == "expand") {
                        this.shopItems[i].text.alpha = 1;
                    }
                    // If shop item is unlocking just now, then play a little sound
                    audio.playSound(this, "shopUnlock", 0.75);
                    this.shopItems[i].enabled = true;
                    if (getType(this.shopItems[i].selection) != ShopSelectionType.DEMOLITION) {
                        this.shopItems[i].priceText.setColor("#ffffff");
                    }
                }
            // Otherwise prevent selecting this option
            } else if(this.shopItems[i].enabled) {
                this.shopItems[i].sprite.alpha = 0.5;
                this.shopItems[i].priceText.setColor("#ff6666");
                this.shopItems[i].enabled = false;
                if (getShopSelection() == this.shopItems[i].selection) {
                    this.clearShopSelection();
                }
                if (this.shopItems[i].selection == "expand") {
                    this.shopItems[i].text.alpha = 0.5;
                }
            }
        }
        
        // Update bounds if player can afford everything
        if (!shopPricesFound && currentCash >= shopPrices[shopPrices.length - 1].price) {
            this.shopPriceBounds.below = shopPrices[shopPrices.length - 1].price;
            this.shopPriceBounds.belowSelection = shopPrices[shopPrices.length - 1].selection;
            this.shopPriceBounds.above = Number.MAX_VALUE;
            this.shopPriceBounds.aboveSelection = null;
        }
    }

    // Create tooltips for each shop item, and hide them all
    createTooltips() {
        for (let i = 0; i < this.shopItems.length; i++) {
            let tooltipPosition = this.getSelectionPosition(i);
            let tooltipPanel = this.add.nineslice(tooltipPosition.x, tooltipPosition.y,
                0, 0, 'greyPanel', 7).setOrigin(1, 0);
            // Flip tooltip for lower selections so it doesn't get cut off at the bottom of the screen
            if (i >= tooltipFlipIndex) {
                tooltipPanel.setOrigin(1, 1);
            }

            // Create tooltip game objects
            let tooltipTitle = this.add.text(0, 0, "", { ...this.tooltipTextStyle, font: "18px Verdana" }).setOrigin(0.5, 0);
            let tooltipPrice = this.add.text(0, 0, "", { ...this.tooltipTextStyle, font: "16px Verdana" }).setOrigin(0.5, 0);
            let tooltipGrowthRate = this.add.text(0, 0, "", { ...this.tooltipTextStyle, font: "16px Verdana" }).setOrigin(0.5, 0);
            let tooltipClickValue = this.add.text(0, 0, "", { ...this.tooltipTextStyle, font: "16px Verdana" }).setOrigin(0.5, 0);
            let tooltipDescription = this.add.text(0, 0, "", this.tooltipTextStyle).setOrigin(0.5, 0);
            let tooltipTexts = [
                tooltipTitle, 
                tooltipPrice, 
                tooltipGrowthRate,
                tooltipClickValue,
                tooltipDescription
            ];
            let tooltipTitleBreak = this.add.line(0, 0, 0, 0, 0, 0, 0x999999).setOrigin(0, 0);
            let tooltipPriceBreak = this.add.line(0, 0, 0, 0, 0, 0, 0x999999).setOrigin(0, 0);
            let tooltipRatesBreak = this.add.line(0, 0, 0, 0, 0, 0, 0x999999).setOrigin(0, 0);
            let tooltipBreaks = [
                tooltipTitleBreak,
                tooltipPriceBreak,
                tooltipRatesBreak
            ];
            let tooltip = this.add.group([tooltipPanel].concat(tooltipTexts).concat(tooltipBreaks));
            tooltip.setVisible(false);
            this.tooltips.push(tooltip);

            // Set tooltip text values
            if (getType(this.shopItems[i].selection) == ShopSelectionType.DEMOLITION) {
                tooltipTitle.setText("Demolish building");
                tooltipPrice.setText("Costs half of the construction cost for the selected building");
                // Hide unneeded text and breaks
                tooltipPriceBreak.setAlpha(0);
                tooltipRatesBreak.setAlpha(0);
                tooltipGrowthRate.setText("");
                tooltipClickValue.setText("");
                tooltipDescription.setText("");
            } else if (getType(this.shopItems[i].selection) == ShopSelectionType.EXPAND_MAP) {
                tooltipTitle.setText("Expand map");
                formatPhaserCashText(tooltipPrice, getPrice(this.shopItems[i].selection), "", false, true);
                this.priceTexts[this.shopItems[i].selection]["tooltipPriceText"] = tooltipPrice;
                tooltipGrowthRate.setText("Add a set of new tiles to the map");
                // Hide unneeded text and breaks
                tooltipRatesBreak.setAlpha(0);
                tooltipClickValue.setText("");
                tooltipDescription.setText("");
            } else {
                this.priceTexts[this.shopItems[i].selection]["tooltipPriceText"] = tooltipPrice;
                tooltipTitle.setText(this.shopItems[i].selection);
                formatPhaserCashText(tooltipPrice, getPrice(this.shopItems[i].selection), "", false, true);
                formatPhaserCashText(tooltipGrowthRate,
                    getSelectionProp(this.shopItems[i].selection, 'baseCashGrowthRate'),
                    "/second", true, false);
                formatPhaserCashText(tooltipClickValue,
                    getSelectionProp(this.shopItems[i].selection, 'baseClickValue'),
                    "/click", true, false);
                tooltipDescription.setText(getSelectionProp(this.shopItems[i].selection, 'description'));
    
                tooltipPriceBreak.setAlpha(1);
                tooltipRatesBreak.setAlpha(1);
            }
            
            // Resize and set positions of tooltip elements
            let panelWidth = 0;
            let panelHeight = tooltipTextMargin;
            let tooltipTextYDiff = [];
            // Resize panel
            for (let i = 0; i < tooltipTexts.length; i++) {
                if (!isBlank(tooltipTexts[i].text)) {
                    panelWidth = Math.max(panelWidth, tooltipTexts[i].width + 2 * tooltipTextMargin);
                    // No line break is added between the cash growth rates. Also should ignore presence of "/click"
                    // in the last text, since it is the description, no the click value.
                    if (i > 0 && (i == tooltipTexts.length - 1 || !tooltipTexts[i].text.includes("/click"))) {
                        panelHeight += tooltipTextBreakYMargin;
                    }
                    tooltipTextYDiff[i] = panelHeight;
                    panelHeight += tooltipTexts[i].height + tooltipTextMargin;
                }
            }
            // There is a bug in Phaser 3 that causes fonts to looks messy after resizing
            // the nineslice. For now using the workaround of creating and immediately
            // deleting a dummy text object after resizing the nineslice.
            // When this is fixed in a future Phaser release this can be removed.
            // See https://github.com/jdotrjs/phaser3-nineslice/issues/16
            // See https://github.com/photonstorm/phaser/issues/5064
            tooltipPanel.resize(panelWidth, panelHeight);
            let dummyText = this.add.text(0, 0, "");
            dummyText.destroy();
            
            // Move text and break objects
            for (let i = 0; i < tooltipTexts.length; i++) {
                tooltipTexts[i].setPosition(tooltipPanel.getTopCenter().x, tooltipPanel.getTopCenter().y + tooltipTextYDiff[i]);
                tooltipTexts[i].width = panelWidth - 2 * tooltipTextMargin;
            }
            let breakX = tooltipPanel.getTopLeft().x + tooltipTextBreakXMargin;
            let breakY = tooltipPrice.getTopCenter().y - (tooltipTextBreakYMargin + tooltipTextMargin) / 2;
            tooltipTitleBreak.setTo(breakX, breakY, tooltipPanel.getTopRight().x - tooltipTextBreakXMargin, breakY);
            breakY = tooltipGrowthRate.getTopCenter().y - (tooltipTextBreakYMargin + tooltipTextMargin) / 2;
            tooltipPriceBreak.setTo(breakX, breakY, tooltipPanel.getTopRight().x - tooltipTextBreakXMargin, breakY);
            breakY = tooltipDescription.getTopCenter().y - (tooltipTextBreakYMargin + tooltipTextMargin) / 2;
            tooltipRatesBreak.setTo(breakX, breakY, tooltipPanel.getTopRight().x - tooltipTextBreakXMargin, breakY);
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

    placementListener(changed, scene) {
        let checkShopSelections = false;
        if (changed) {
            for (let change of changed) {
                scene.updatePriceTexts(change);
                // If this selection was one of the price boundaries, force a re-check of valid shop selections
                if (change == scene.shopPriceBounds.belowSelection ||
                        change == scene.shopPriceBounds.aboveSelection) {
                    checkShopSelections = true;
                }
            }
        }
        if (checkShopSelections) {
            scene.shopPriceBounds.above = Number.MIN_VALUE;
            scene.shopPriceBounds.below = Number.MAX_VALUE;
        }
    }

    updatePriceTexts(selection) {
        if (isFlatCost(selection)) {
            return;
        }

        let priceTexts = this.priceTexts[selection];
        if (priceTexts) {
            formatPhaserCashText(priceTexts['tooltipPriceText'], getPrice(selection), "", false, true);
            priceTexts['shopPriceText'].setText(formatLargeCash(getPrice(selection)));
        }
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
        // Avoid updating shop selections each call as it is slow
        if (cash < scene.shopPriceBounds.below || cash >= scene.shopPriceBounds.above) {
            scene.updateValidShopSelections(cash);
        }
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
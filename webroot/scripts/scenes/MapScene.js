import * as state from '../state/CashState';
import * as map from '../state/MapState';
import * as build from '../model/Building';
import * as tile from '../model/Tile';
import { ShopSelectionType, addShopSelectionListener } from '../state/UIState';
import { formatCash } from '../util/Util';

const tileScale = 1;
const blockImageHeight = 100 * tileScale;
const blockImageWidth = 132 * tileScale;
const buildingYDiff = 0.325 * -blockImageWidth;
const hoverImageAlpha = 0.65;
const previewWidth = 120;
const previewHeight = 75;
const previewTextMargin = 5;
const positiveCashColor = "#15b800";
const negativeCashColor = "#f54242";

export class MapScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MapScene"
        });
    }

    create() {
        this.mapWidth = this.cache.json.get('initials')['mapWidth'];
        this.mapHeight = this.cache.json.get('initials')['mapHeight'];;

        this.startingCashGrowthRate = this.cache.json.get('initials')['startingGrowthRate'];
        this.startingClickValue = this.cache.json.get('initials')['startingClickValue'];
        this.demolitionCostFraction = this.cache.json.get('initials')['demolishFraction'];

        this.mapOriginX = this.game.renderer.width / 2 - 75;
        this.mapOriginY = (this.game.renderer.height / 2) + (this.mapHeight * blockImageHeight / 3);
        
        this.tileHighlightActiveX = -1;
        this.tileHighlightActiveY = -1;

        // Background
        this.cameras.main.setBackgroundColor("#4287f5");

        // Blocks
        this.createTileMap();
        this.updateCashRates();

        // Hover image
        this.hoverImage = this.add.image(0, 0, 'yellow').setScale(tileScale).setOrigin(0.5, 1);
        this.hoverImage.alpha = 0;
        this.hoverImageType = ShopSelectionType.BUILDING_ONLY;

        // Click handler
        this.input.on("pointerup", this.handleClick, this);
        
        // Shop selection listener
        addShopSelectionListener(this.shopSelectionListener, this);

        // Camera control
        var controlConfig = {
            camera: this.cameras.main,
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            acceleration: 0.5,
            drag: 1.0,
            maxSpeed: 1.0
        };
        this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig);

        // Cash rate preview for new buildings
        let previewTextStyle = { font: "16px Courier", align: "center", fill: "black" };
        this.previewRect = this.add.rectangle(0, 0, previewWidth, previewHeight, 0xfffbf0);
        this.previewRect.setOrigin(0.5, 1);
        this.previewRect.alpha = 0.6;
        this.previewTextCost = this.add.text(0, 0, "", previewTextStyle);
        this.previewTextCost.setFixedSize(previewWidth - 2 * previewTextMargin, previewHeight / 3);
        this.previewTextGrowthRate = this.add.text(0, 0, "", previewTextStyle);
        this.previewTextGrowthRate.setFixedSize(previewWidth - 2 * previewTextMargin, previewHeight / 3);
        this.previewTextClickRate = this.add.text(0, 0, "", previewTextStyle);
        this.previewTextClickRate.setFixedSize(previewWidth - 2 * previewTextMargin, previewHeight / 3);
        this.hidePreview();
        
    }

    // Origin of tile map coordinates is the tile closest to the bottom of the screen.
    // X increases diagonally up and to the right. Y increases diagonally up and to the left.
    createTileMap() {
        let tileMap = map.initializeMap(this.cache.json.get('tiles'), this.mapWidth, this.mapHeight);
        this.tileMapImages = new Array(this.mapWidth);
        this.buildingImages = new Array(this.mapWidth);

        for (let x = this.mapWidth - 1; x >= 0; x--) {
            this.tileMapImages[x] = new Array(this.mapHeight);
            this.buildingImages[x] = new Array(this.mapHeight);
            for (let y = this.mapHeight - 1; y >= 0; y--) {
                let tileCoords = this.getTileWorldCoordinates(x, y);
                let tileImage = this.add.image(tileCoords.x, tileCoords.y, 
                    tileMap[x][y].tile).setScale(tileScale).setOrigin(0.5, 1);
                this.tileMapImages[x][y] = tileImage;
                // Add a placeholder building image to be replaced when necessary
                let buildingImage = this.add.image(tileCoords.x, tileCoords.y + buildingYDiff,
                    tileMap[x][y].tile).setScale(tileScale).setOrigin(0.5, 1);
                buildingImage.setVisible(false);
                this.buildingImages[x][y] = buildingImage;
            }
        }
    }

    handleClick(event) {
        if (this.currentShopSelection != null && 
                this.areTileCoordinatesValid(this.tileHighlightActiveX, this.tileHighlightActiveY)) {
            // If highlighting a tile, build the shop selection if enough cash
            if (this.getShopSelectionPrice(this.currentShopSelection) <= state.getCurrentCash()) {
                this.placeShopSelection();
            } else {
                // Print message for not enough cash. Should only happen for demolition,
                // as other options will not be selectable in the shop when you can't afford them.
                let worldCoords = this.getTileWorldCoordinates(this.tileHighlightActiveX, this.tileHighlightActiveY);
                let coords = this.worldCoordinatesToCanvasCoordinates(worldCoords.x, worldCoords.y - blockImageHeight);
                this.addTemporaryText("Not enough cash!", negativeCashColor, 24, coords.x, coords.y);
            }
        } else {
            // Otherwise add cash
            this.addClickCash(event);
        }
    }

    shopSelectionListener(shopSelection, scene) {
        scene.currentShopSelection = shopSelection;
        if (shopSelection != null) {
            scene.hoverImageType = shopSelection.selectionType;
            scene.hoverImage.setTexture(shopSelection.getName());
        } else {
            scene.updateTileHighlight();
        }
    }

    placeShopSelection() {
        let x = this.tileHighlightActiveX;
        let y = this.tileHighlightActiveY;
        let tileMap = map.getMap();
        const selection = this.currentShopSelection;
        // Can only modify/place tiles or buildings on tiles that don't have a building already
        // and do not match the tile being placed.
        // Can only demolish tiles with a placed building.
        if ((tileMap[x][y].building && selection.selectionType == ShopSelectionType.DEMOLITION) ||
            (tileMap[x][y].building == null && 
                (selection.selectionType != ShopSelectionType.TILE_ONLY || tileMap[x][y].tile != selection.getName()))) {
            let price = this.getShopSelectionPrice(selection);
                    
            // Update the tileMap
            this.addShopSelectionToMap(selection, tileMap, x, y);

            // Update cash per second and click cash
            this.updateCashRates();

            // Update displayed sprites
            if (selection.selectionType == ShopSelectionType.DEMOLITION) {
                this.buildingImages[x][y].setVisible(false);
                this.tileMapImages[x][y].setTexture(tileMap[x][y].tile);
                this.tileMapImages[x][y].alpha = 1;
            } else if (selection.selectionType != ShopSelectionType.BUILDING_ONLY) {
                this.tileMapImages[x][y].setTexture(selection.getName());
                this.tileMapImages[x][y].alpha = 1;
            } else {
                this.buildingImages[x][y].setVisible(true);
                this.buildingImages[x][y].setTexture(selection.getName());
            }
            this.tileHighlightActiveX = -1;
            this.tileHighlightActiveY = -1;

            // Apply cost of placing
            state.addCurrentCash(-1 * price);
        }
    }

    getShopSelectionPrice(selection) {
        if (selection.selectionType == ShopSelectionType.DEMOLITION) {
            return this.cache.json.get('buildings')[map.getMap()[this.tileHighlightActiveX][this.tileHighlightActiveY].building]['cost'] * this.demolitionCostFraction;
        } else {
            return selection.getPrice(this.cache.json);
        }
    }

    addShopSelectionToMap(selection, tileMap, x, y) {
        if (this.hoverImageType == ShopSelectionType.DEMOLITION) {
            tileMap[x][y].building = null;
        } else {
            if (this.hoverImageType != ShopSelectionType.TILE_ONLY) {
                tileMap[x][y].building = selection.buildingName;
            } 
            if (this.hoverImageType != ShopSelectionType.BUILDING_ONLY) {
                tileMap[x][y].tile = selection.tileName;
            }
        }
    }

    updateCashRates() {
        let tileMap = map.getMap();
        let rates = this.getCashRates(tileMap);
        state.setCashGrowthRate(rates.cashGrowthRate);
        state.setClickCashValue(rates.clickValue);
    }

    getCashRates(tileMap) {
        let cashGrowthRate = this.startingCashGrowthRate;
        let clickValue = this.startingClickValue;
        for (let x = 0; x < this.mapWidth; x++) {
            for (let y = 0; y < this.mapHeight; y++) {
                cashGrowthRate += build.getBuildingCashGrowthRate(this.cache.json.get('buildings'), tileMap, x, y);
                cashGrowthRate += tile.getTileCashGrowthRate(this.cache.json.get('tiles'), tileMap, x, y);
                clickValue += build.getBuildingClickValue(this.cache.json.get('buildings'), tileMap, x, y);
                clickValue += tile.getTileClickValue(this.cache.json.get('tiles'), tileMap, x, y);
            }
        }
        return {
            cashGrowthRate: cashGrowthRate,
            clickValue: clickValue
        };
    }

    updatePreview(x, y, showExistingBuildingRates) {
        let coords = this.getTileWorldCoordinates(x, y);
        this.previewRect.x = coords.x;
        this.previewRect.y = coords.y - 150;
        this.previewTextCost.x = this.previewRect.getTopLeft().x + previewTextMargin;
        this.previewTextCost.y = this.previewRect.getTopLeft().y + previewTextMargin;
        this.previewTextGrowthRate.x = this.previewRect.getTopLeft().x + previewTextMargin;
        this.previewTextGrowthRate.y = this.previewRect.getTopLeft().y + previewTextMargin + previewHeight / 3;
        this.previewTextClickRate.x = this.previewRect.getTopLeft().x + previewTextMargin;
        this.previewTextClickRate.y = this.previewRect.getTopLeft().y + previewTextMargin + 2 * previewHeight / 3;

        // Show rates for whatever already exists on the tile
        if (showExistingBuildingRates) {
            let name;
            let cashGrowthRate;
            let clickValue;
            if (map.getMap()[x][y].building) {
                name = map.getMap()[x][y].building;
                cashGrowthRate = build.getBuildingCashGrowthRate(this.cache.json.get('buildings'), map.getMap(), x, y);
                clickValue = build.getBuildingClickValue(this.cache.json.get('buildings'), map.getMap(), x, y);
            } else {
                name = map.getMap()[x][y].tile;
                cashGrowthRate = tile.getTileCashGrowthRate(this.cache.json.get('tiles'), map.getMap(), x, y);
                clickValue = tile.getTileClickValue(this.cache.json.get('tiles'), map.getMap(), x, y);
            }

            // Update preview rate text
            this.previewTextCost.setText(name);
            this.previewTextCost.setColor("#000000");
            this.updatePreviewText(this.previewTextGrowthRate, cashGrowthRate, "/s");
            this.updatePreviewText(this.previewTextClickRate, clickValue, "/s");
        // Showing shop selection rates
        } else {
            let mapCopy = JSON.parse(JSON.stringify(map.getMap()));
            this.addShopSelectionToMap(this.currentShopSelection, mapCopy, x, y);
            let rates = this.getCashRates(mapCopy);
            let rateDiffs = {
                cashGrowthRate: rates['cashGrowthRate'] - state.getCashGrowthRate(),
                clickValue: rates['clickValue'] - state.getClickCashValue()
            }

            // Update preview rate text
            this.updatePreviewText(this.previewTextCost, -1 * this.getShopSelectionPrice(this.currentShopSelection), "");
            this.updatePreviewText(this.previewTextGrowthRate, rateDiffs.cashGrowthRate, "/s");
            this.updatePreviewText(this.previewTextClickRate, rateDiffs.clickValue, "/s");
        }

        this.previewRect.setVisible(true);
        this.previewTextCost.setVisible(true);
        this.previewTextGrowthRate.setVisible(true);
        this.previewTextClickRate.setVisible(true);
    }

    updatePreviewText(text, cashValue, suffix) {
        let prefix = "";
        if (cashValue > 0.001) {
            prefix += "+";
            text.setColor(positiveCashColor);
        } else if (cashValue < -0.001) {
            text.setColor(negativeCashColor);
        } else {
            text.setColor("#000000");
        }
        text.setText(prefix + formatCash(cashValue) + suffix);
    }

    hidePreview() {
        this.previewRect.setVisible(false);
        this.previewTextCost.setVisible(false);
        this.previewTextGrowthRate.setVisible(false);
        this.previewTextClickRate.setVisible(false);
    }

    addClickCash(event) {
        this.addTemporaryText(formatCash(state.getClickCashValue()),
            positiveCashColor, 48, event.upX, event.upY);
        state.addCurrentCash(state.getClickCashValue());
    }

    addTemporaryText(text, color, fontSize, x, y) {
        let textStyle = { font: fontSize + "px Verdana", fill: color };
        let textObject = this.game.scene.getScene('UIScene').add.text(
            x, y, text, textStyle);
        textObject.setOrigin(0.5, 0.5);
        // Add text animation
        this.add.tween({
            targets: [textObject],
            ease: 'Sine.easeInOut',
            duration: 1000,
            delay: 0,
            y: {
                getStart: () => textObject.y,
                getEnd: () => textObject.y - 50
            },
            onComplete: () => {
                textObject.destroy();
            }
          });
    }

    updateTileHighlight() {
        let worldCoords = this.cameras.main.getWorldPoint(this.game.input.mousePointer.x, this.game.input.mousePointer.y);
        let xDiff = worldCoords.x - this.mapOriginX;
        let yDiff = (this.mapOriginY - blockImageHeight / 2 + blockImageWidth / 4) - worldCoords.y;
        
        // Determine if point is between lines for x=0, x=1, x=2, etc. Line for x=0: x/2 + y = -(blockImageWidth / 4)
        // Similar for determining if in between y lines. Line for y=0: -x/2 + y = blockImageWidth / 4
        let tileX = Math.floor((xDiff + 2 * yDiff) / blockImageWidth - 0.25);
        let tileY = Math.floor((-xDiff + 2 * yDiff) / blockImageWidth - 0.25);

        if (tileX == this.tileHighlightActiveX && tileY == this.tileHighlightActiveY && this.currentShopSelection) {
            return;
        }

        // Reset tile alpha
        if (this.areTileCoordinatesValid(this.tileHighlightActiveX, this.tileHighlightActiveY)) {
            this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].alpha = 1;
        }

        // Update hover image/tile image, cash preview, and alpha
        let tileHighlighted = false;
        if (this.currentShopSelection && this.areTileCoordinatesValid(tileX, tileY)) {
            this.tileHighlightActiveX = tileX;
            this.tileHighlightActiveY = tileY;
            let tileCoords = this.getTileWorldCoordinates(tileX, tileY);
            this.hoverImage.x = tileCoords.x;
            this.hoverImage.y = tileCoords.y;
            this.hoverImage.alpha = hoverImageAlpha;
            // Demolishing existing building
            if (this.hoverImageType == ShopSelectionType.DEMOLITION && map.getMap()[tileX][tileY].building != null) {
                tileHighlighted = true;
                this.hoverImage.setScale(tileScale / 2);
                this.hoverImage.y += buildingYDiff;
                this.updatePreview(tileX, tileY, false);
            // Placing new tile, building, or both    
            } else if (map.getMap()[tileX][tileY].building == null && this.hoverImageType != ShopSelectionType.DEMOLITION &&
                    (this.hoverImageType != ShopSelectionType.TILE_ONLY || map.getMap()[tileX][tileY].tile != this.currentShopSelection.getName())) {
                tileHighlighted = true;
                this.hoverImage.setScale(tileScale);
                if (this.hoverImageType == ShopSelectionType.BUILDING_ONLY) {
                    this.hoverImage.y += buildingYDiff;
                } else {
                    this.tileMapImages[tileX][tileY].alpha = 0;
                }
                this.updatePreview(tileX, tileY, false);
            }
        } 
        if (!tileHighlighted) {
            this.tileHighlightActiveX = -1;
            this.tileHighlightActiveY = -1;
            this.hoverImage.alpha = 0;
            if (this.areTileCoordinatesValid(tileX, tileY)) {
                this.updatePreview(tileX, tileY, true);
            } else {
                this.hidePreview();
            }
        }
    }

    getTileWorldCoordinates(tileX, tileY) {
        let xDiff = (tileX - tileY) * blockImageWidth / 2;
        let yDiff = (tileX + tileY) * -blockImageWidth / 4;
        return new Phaser.Math.Vector2(this.mapOriginX + xDiff, this.mapOriginY + yDiff);
    }

    // https://phaser.discourse.group/t/object-position-to-canvas-pixel-position/1099/2
    worldCoordinatesToCanvasCoordinates(x, y) {
        let cam = this.cameras.main;
        let displayScale = cam.scaleManager.displayScale;
        let mat = cam.matrix;
        let tx = mat.getX(x - cam.scrollX, y - cam.scrollY) / displayScale.x;
        let ty = mat.getY(x - cam.scrollX, y - cam.scrollY) / displayScale.y;
        x = Math.round(tx);
        y = Math.round(ty);
        return new Phaser.Math.Vector2(x, y);
    }

    areTileCoordinatesValid(x, y) {
        return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
    }

    // Update highlighted tile
    update(time, delta) {
        this.updateTileHighlight();
        this.controls.update(delta);
    }
}
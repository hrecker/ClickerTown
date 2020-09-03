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
const previewWidth = 180;
const previewHeight = 110;
const previewTextMargin = 7;
const positiveCashColor = "#15b800";
const negativeCashColor = "#f54242";

export class MapScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MapScene"
        });
    }

    create() {
        this.mapWidth = map.getMap().length;
        this.mapHeight = map.getMap()[0].length;

        this.mapOriginX = this.game.renderer.width / 2 - 75;
        this.mapOriginY = (this.game.renderer.height / 2) + (this.mapHeight * blockImageHeight / 3);
        
        this.tileHighlightActiveX = -1;
        this.tileHighlightActiveY = -1;

        // UI scene - used for elements which should not scale with game zoom
        this.uiScene = this.game.scene.getScene('UIScene');

        // Background
        this.cameras.main.setBackgroundColor("#4287f5");

        // Blocks
        this.createTileMap();
        state.updateCashRates(this.cache.json, map.getMap());

        // Hover image
        this.hoverImage = this.add.image(0, 0, 'yellow').setScale(tileScale).setOrigin(0.5, 1);
        this.hoverImage.alpha = 0;

        // Cash click particles
        this.cashParticles = this.uiScene.add.particles('dollarSign');

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

        // Cash rate preview for new buildings, and info on existing buildings
        let previewTextStyle = { font: "24px Courier", align: "center", fill: "black" };
        this.previewRect = this.uiScene.add.rectangle(0, 0, previewWidth, previewHeight, 0xfffbf0);
        this.previewRect.setOrigin(0.5, 1);
        this.previewRect.alpha = 0.6;
        this.previewTextCost = this.uiScene.add.text(0, 0, "", previewTextStyle);
        this.previewTextCost.setFixedSize(previewWidth - 2 * previewTextMargin, previewHeight / 3);
        this.previewTextGrowthRate = this.uiScene.add.text(0, 0, "", previewTextStyle);
        this.previewTextGrowthRate.setFixedSize(previewWidth - 2 * previewTextMargin, previewHeight / 3);
        this.previewTextClickRate = this.uiScene.add.text(0, 0, "", previewTextStyle);
        this.previewTextClickRate.setFixedSize(previewWidth - 2 * previewTextMargin, previewHeight / 3);
        this.hidePreview();
        
    }

    // Origin of tile map coordinates is the tile closest to the bottom of the screen.
    // X increases diagonally up and to the right. Y increases diagonally up and to the left.
    createTileMap() {
        this.tileMapImages = new Array(this.mapWidth);
        this.buildingImages = new Array(this.mapWidth);

        for (let x = this.mapWidth - 1; x >= 0; x--) {
            this.tileMapImages[x] = new Array(this.mapHeight);
            this.buildingImages[x] = new Array(this.mapHeight);
            for (let y = this.mapHeight - 1; y >= 0; y--) {
                let tileCoords = this.tileCoordinatesToWorldCoordinates(x, y);
                let tileImage = this.add.image(tileCoords.x, tileCoords.y, 
                    map.getMap()[x][y].tile).setScale(tileScale).setOrigin(0.5, 1);
                this.tileMapImages[x][y] = tileImage;
                // Add a placeholder building image to be replaced when necessary
                let buildingImage = this.add.image(tileCoords.x, tileCoords.y + buildingYDiff,
                    map.getMap()[x][y].tile).setScale(tileScale).setOrigin(0.5, 1);
                buildingImage.setVisible(false);
                this.buildingImages[x][y] = buildingImage;
            }
        }
    }

    handleClick(event) {
        let clickCoords = this.cameras.main.getWorldPoint(event.upX, event.upY);
        let tile = this.worldCoordinatesToTileCoordinates(clickCoords.x, clickCoords.y);
        if (this.currentShopSelection && this.areTileCoordinatesValid(tile.x, tile.y) &&
                map.canPlaceShopSelection(this.currentShopSelection, tile.x, tile.y)) {
            // Build the shop selection if enough cash
            if (map.getShopSelectionPrice(this.cache.json, this.currentShopSelection, 
                    tile.x, tile.y) <= state.getCurrentCash()) {
                this.placeShopSelection(tile.x, tile.y);
            } else {
                // Print message for not enough cash. Should only happen for demolition,
                // as other options will not be selectable in the shop when you can't afford them.
                let coords = this.worldCoordinatesToCanvasCoordinates(clickCoords.x, clickCoords.y - blockImageHeight);
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
            scene.hoverImage.setTexture(shopSelection.getName());
        } else {
            scene.updateTileHighlight();
        }
    }

    placeShopSelection(x, y) {
        let tileMap = map.getMap();
        const selection = this.currentShopSelection;
        let price = map.getShopSelectionPrice(this.cache.json, selection, x, y);
        // Update the tileMap
        map.addShopSelectionToMap(selection, tileMap, x, y);

        // Update cash per second and click cash
        state.updateCashRates(this.cache.json, map.getMap());

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
        // Reset tile alpha to default on previous hovered tile
        if (this.areTileCoordinatesValid(this.tileHighlightActiveX, this.tileHighlightActiveY)) {
            this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].alpha = 1;
        }
        this.tileHighlightActiveX = -1;
        this.tileHighlightActiveY = -1;

        // Apply cost of placing
        state.addCurrentCash(-1 * price);
    }

    updatePreview(x, y, showExistingBuildingRates) {
        let worldCoords = this.tileCoordinatesToWorldCoordinates(x, y);
        let previewCoords = this.worldCoordinatesToCanvasCoordinates(worldCoords.x, worldCoords.y - 150);
        this.previewRect.x = previewCoords.x;
        this.previewRect.y = previewCoords.y;
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
                let buildingName = map.getMap()[x][y].building;
                let shortName = this.cache.json.get('buildings')[buildingName]['shortName'];
                name = shortName ? shortName : buildingName;
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
            this.updatePreviewText(this.previewTextClickRate, clickValue, "/c");
        // Showing shop selection rates
        } else {
            let mapCopy = JSON.parse(JSON.stringify(map.getMap()));
            map.addShopSelectionToMap(this.currentShopSelection, mapCopy, x, y);
            let rates = state.getCashRates(this.cache.json, mapCopy);
            let rateDiffs = {
                cashGrowthRate: rates['cashGrowthRate'] - state.getCashGrowthRate(),
                clickValue: rates['clickValue'] - state.getClickCashValue()
            }

            // Update preview rate text
            this.updatePreviewText(this.previewTextCost, -1 * map.getShopSelectionPrice(this.cache.json,
                this.currentShopSelection, this.tileHighlightActiveX, this.tileHighlightActiveY), "");
            this.updatePreviewText(this.previewTextGrowthRate, rateDiffs.cashGrowthRate, "/s");
            this.updatePreviewText(this.previewTextClickRate, rateDiffs.clickValue, "/c");
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
        // Always give at least one cent per click, just to be merciful
        let clickCash = Math.max(state.getClickCashValue(), 0.01);	
        this.addTemporaryText(formatCash(clickCash),	
            positiveCashColor, 48, event.upX, event.upY);
        let emitter = this.cashParticles.createEmitter({
            x: event.upX,
            y: event.upY,
            speed: 150,
            gravityY: 250,
            quantity: 3,
            frequency: -1
        });
        emitter.explode();
        emitter.stop();
        state.addCurrentCash(clickCash);
    }

    addTemporaryText(text, color, fontSize, x, y) {
        let textStyle = { font: fontSize + "px Verdana", fill: color };
        let textObject = this.uiScene.add.text(x, y, text, textStyle);
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
        let tile = this.worldCoordinatesToTileCoordinates(worldCoords.x, worldCoords.y);

        // If hovered tile hasn't changed and a shop selection is active, just exit
        if (tile.x == this.tileHighlightActiveX && tile.y == this.tileHighlightActiveY && this.currentShopSelection) {
            return;
        }

        // Reset tile alpha to default on previous hovered tile
        if (this.areTileCoordinatesValid(this.tileHighlightActiveX, this.tileHighlightActiveY)) {
            this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].alpha = 1;
        }

        // Update hover image/tile image, cash preview, and alpha
        if (this.areTileCoordinatesValid(tile.x, tile.y) && map.canPlaceShopSelection(this.currentShopSelection, tile.x, tile.y)) {
            this.tileHighlightActiveX = tile.x;
            this.tileHighlightActiveY = tile.y;
            let tileCoords = this.tileCoordinatesToWorldCoordinates(tile.x, tile.y);
            this.hoverImage.x = tileCoords.x;
            this.hoverImage.y = tileCoords.y;
            this.hoverImage.alpha = hoverImageAlpha;
            this.updatePreview(tile.x, tile.y, false);
            // Demolishing existing building
            if (this.currentShopSelection.selectionType == ShopSelectionType.DEMOLITION) {
                this.hoverImage.setScale(tileScale / 2);
                this.hoverImage.y += buildingYDiff;
            // Placing new tile, building, or both    
            } else {
                this.hoverImage.setScale(tileScale);
                if (this.currentShopSelection.selectionType == ShopSelectionType.BUILDING_ONLY) {
                    this.hoverImage.y += buildingYDiff;
                } else {
                    this.tileMapImages[tile.x][tile.y].alpha = 0;
                }
            }
        // Hide preview, or show stats for existing building
        } else {
            this.tileHighlightActiveX = -1;
            this.tileHighlightActiveY = -1;
            this.hoverImage.alpha = 0;
            if (this.areTileCoordinatesValid(tile.x, tile.y)) {
                this.updatePreview(tile.x, tile.y, true);
            } else {
                this.hidePreview();
            }
        }
    }

    worldCoordinatesToTileCoordinates(x, y) {
        let xDiff = x - this.mapOriginX;
        let yDiff = (this.mapOriginY - blockImageHeight / 2 + blockImageWidth / 4) - y;
        // Determine if point is between lines for x=0, x=1, x=2, etc. Line for x=0: x/2 + y = -(blockImageWidth / 4)
        // Similar for determining if in between y lines. Line for y=0: -x/2 + y = blockImageWidth / 4
        let tileX = Math.floor((xDiff + 2 * yDiff) / blockImageWidth - 0.25);
        let tileY = Math.floor((-xDiff + 2 * yDiff) / blockImageWidth - 0.25);
        return new Phaser.Math.Vector2(tileX, tileY);
    }

    tileCoordinatesToWorldCoordinates(tileX, tileY) {
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
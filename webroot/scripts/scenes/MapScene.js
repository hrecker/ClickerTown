import * as state from '../state/CashState';
import * as map from '../state/MapState';
import * as build from '../model/Building';
import * as tile from '../model/Tile';
import { ShopSelectionType, addShopSelectionListener, isInDialog } from '../state/UIState';
import { addGameResetListener } from '../state/GameState';
import { formatCash, formatPhaserCashText } from '../util/Util';

const tileScale = 1;
const blockImageHeight = 100 * tileScale;
const blockImageWidth = 132 * tileScale;
const buildingYDiff = 0.325 * -blockImageWidth;
const hoverImageAlpha = 0.65;
const previewWidth = 200;
const previewHeight = 125;
const previewTextMargin = 7;

export class MapScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MapScene"
        });
    }

    create() {
        this.mapWidth = map.getMap().length;
        this.mapHeight = map.getMap()[0].length;

        this.mapOriginX = this.game.renderer.width / 2 - 85;
        this.mapOriginY = (this.game.renderer.height / 2) + (this.mapHeight * blockImageHeight / 3);
        
        this.tileHighlightActiveX = -1;
        this.tileHighlightActiveY = -1;

        // UI scene - used for elements which should not scale with game zoom
        this.uiScene = this.game.scene.getScene('UIScene');

        // Blocks
        this.createTileMap();
        this.syncTileMap();
        state.updateCashRates(this.cache.json, map.getMap());

        // Hover image
        this.hoverImage = this.add.image(0, 0, '').setScale(tileScale).setOrigin(0.5, 1);
        this.hoverImage.alpha = 0;

        // Cash click particles
        let cashParticles = this.uiScene.add.particles('dollarSign');
        this.cashEmitter = cashParticles.createEmitter({
            x: 0,
            y: 0,
            speed: 150,
            gravityY: 250,
            quantity: 3,
            frequency: -1,
            rotate: { min: 0, max: 360 }
        });
        this.cashEmitter.setAlpha(function (p, k, t) {
            return 1 - t;
        });

        // Click handlers
        this.input.mouse.disableContextMenu();
        this.input.on("pointerup", this.handleClick, this);
        
        // Listeners
        addShopSelectionListener(this.shopSelectionListener, this);
        addGameResetListener(this.gameResetListener, this);
        this.shopSelectionRotation = 0;

        // Camera control
        let originalX = this.cameras.main.centerX;
        this.cameras.main.centerOnX(this.mapOriginX);
        this.cameras.main.setPosition(this.mapOriginX - originalX, 0);
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

        // Cash rate preview for new buildings, and info on existing buildings/tiles
        this.createPreview();
    }

    // If the game is reset, will need to update all displayed sprites appropriately
    gameResetListener(scene) {
        scene.syncTileMap();
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
                    '').setScale(tileScale).setOrigin(0.5, 1);
                buildingImage.setVisible(false);
                this.buildingImages[x][y] = buildingImage;
            }
        }
    }

    // Update displayed sprites to reflect the actual contents of the current tile map
    syncTileMap() {
        for (let x = this.mapWidth - 1; x >= 0; x--) {
            for (let y = this.mapHeight - 1; y >= 0; y--) {
                let building = map.getMap()[x][y].building;
                let rotation = map.getMap()[x][y].rotation;
                if (building && ShopSelectionType[this.cache.json.get('buildings')[building]['shopSelectionType']] == 
                        ShopSelectionType.TILE_AND_BUILDING) {
                    this.tileMapImages[x][y].setTexture(this.getSelectionTextureName(building, rotation));
                } else {
                    this.tileMapImages[x][y].setTexture(map.getMap()[x][y].tile);
                    if (building) {
                        this.buildingImages[x][y].setTexture(this.getSelectionTextureName(building, rotation));
                        this.buildingImages[x][y].setVisible(true);
                    } else {
                        this.buildingImages[x][y].setVisible(false);
                    }
                }
            }
        }
    }

    getSelectionTextureName(selection, rotation) {
        let textureName = selection + rotation;
        if (rotation == 0 || !this.textures.exists(textureName)) {
            return selection;
        } else {
            return textureName;
        }
    }

    handleClick(pointer) {
        if (isInDialog()) {
            return;
        }
        if (pointer.rightButtonReleased()) {
            if (this.currentShopSelection) {
                this.shopSelectionRotation = (90 + this.shopSelectionRotation) % 360;
                this.hoverImage.setTexture(this.getSelectionTextureName(this.currentShopSelection.getName(), this.shopSelectionRotation));
            }
        } else {
            let x = pointer.x;
            let y = pointer.y;
            let clickCoords = this.cameras.main.getWorldPoint(x, y);
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
                    this.addTemporaryText("Not enough cash!", "#000", 24, coords.x, coords.y);
                }
            } else {
                // Otherwise add cash
                this.addClickCash(x, y);
            }
        }
    }

    shopSelectionListener(shopSelection, scene) {
        scene.currentShopSelection = shopSelection;
        scene.shopSelectionRotation = 0;
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
        map.addShopSelectionToMap(selection, tileMap, x, y, this.shopSelectionRotation);

        // Update cash per second and click cash
        state.updateCashRates(this.cache.json, map.getMap());

        // Update displayed sprites
        if (selection.selectionType == ShopSelectionType.DEMOLITION) {
            this.buildingImages[x][y].setVisible(false);
            this.tileMapImages[x][y].setTexture(tileMap[x][y].tile);
            this.tileMapImages[x][y].alpha = 1;
        } else if (selection.selectionType != ShopSelectionType.BUILDING_ONLY) {
            this.tileMapImages[x][y].setTexture(this.getSelectionTextureName(selection.getName(), this.shopSelectionRotation));
            this.tileMapImages[x][y].alpha = 1;
        } else {
            this.buildingImages[x][y].setVisible(true);
            this.buildingImages[x][y].setTexture(this.getSelectionTextureName(selection.getName(), this.shopSelectionRotation));
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

    // Create the popup preview used to show building and tile status
    createPreview() {
        let previewTextStyle = { font: "22px Verdana", align: "center" };
        let previewRect = this.uiScene.add.nineslice(0, 0, 200, 125, 'greyPanel', 7).setOrigin(0.5, 1).setAlpha(0.65);
        this.tilePreviewTitle = this.uiScene.add.text(previewRect.getTopLeft().x + previewTextMargin,
            previewRect.getTopLeft().y + previewTextMargin,
            "", previewTextStyle).setFixedSize(previewWidth - 2 * previewTextMargin, previewHeight / 3);
        this.tilePreviewGrowthRate = this.uiScene.add.text(previewRect.getTopLeft().x + previewTextMargin,
            previewRect.getTopLeft().y + previewTextMargin + previewHeight / 3,
            "", previewTextStyle).setFixedSize(previewWidth - 2 * previewTextMargin, previewHeight / 3);
        this.tilePreviewClickRate = this.uiScene.add.text(previewRect.getTopLeft().x + previewTextMargin,
            previewRect.getTopLeft().y + previewTextMargin + 2 * previewHeight / 3,
            "", previewTextStyle).setFixedSize(previewWidth - 2 * previewTextMargin, previewHeight / 3);
        this.tilePreview = this.uiScene.add.container(0, 0, [
            previewRect,
            this.tilePreviewTitle,
            this.tilePreviewGrowthRate,
            this.tilePreviewClickRate]);
        this.tilePreview.setVisible(false);
    }

    // Update building and tile preview values
    updatePreview(x, y, showExistingBuildingRates) {
        let worldCoords = this.tileCoordinatesToWorldCoordinates(x, y);
        let previewCoords = this.worldCoordinatesToCanvasCoordinates(worldCoords.x, worldCoords.y - 150);
        this.tilePreview.setPosition(previewCoords.x, previewCoords.y);
        this.tilePreview.setVisible(true);

        // Show rates for whatever already exists on the tile
        if (showExistingBuildingRates) {
            if (map.getMap()[x][y].building) {
                let buildingName = map.getMap()[x][y].building;
                let shortName = this.cache.json.get('buildings')[buildingName]['shortName'];
                buildingName = shortName ? shortName : buildingName;
                // Building values
                this.updatePreviewTexts(buildingName,
                    build.getBuildingCashGrowthRate(this.cache.json.get('buildings'), map.getMap(), x, y),
                    build.getBuildingClickValue(this.cache.json.get('buildings'), map.getMap(), x, y));
            } else {
                // Tile values
                this.updatePreviewTexts(map.getMap()[x][y].tile,
                    tile.getTileCashGrowthRate(this.cache.json.get('tiles'), map.getMap(), x, y),
                    tile.getTileClickValue(this.cache.json.get('tiles'), map.getMap(), x, y));
            }
        // Showing shop selection rates preview
        } else {
            let mapCopy = JSON.parse(JSON.stringify(map.getMap()));
            map.addShopSelectionToMap(this.currentShopSelection, mapCopy, x, y, 0);
            let rates = state.getCashRates(this.cache.json, mapCopy);
            let rateDiffs = {
                cashGrowthRate: rates['cashGrowthRate'] - state.getCashGrowthRate(),
                clickValue: rates['clickValue'] - state.getClickCashValue()
            }
            // Preview difference in rates that would result after shop selection is placed
            this.updatePreviewTexts(
                -1 * map.getShopSelectionPrice(this.cache.json, this.currentShopSelection, this.tileHighlightActiveX, this.tileHighlightActiveY), 
                rateDiffs.cashGrowthRate,
                rateDiffs.clickValue);
        }
    }

    // Update each text value for the specified preview popup
    updatePreviewTexts(title, growthRate, clickRate) {
        this.updatePreviewText(this.tilePreviewTitle, title, "");
        this.updatePreviewText(this.tilePreviewGrowthRate, growthRate, "/s");
        this.updatePreviewText(this.tilePreviewClickRate, clickRate, "/c");
    }

    // Update one text value in a preview popup
    updatePreviewText(text, value, suffix) {
        // Print as-is if the value isn't a number
        if (isNaN(value)) {
            text.setColor("#000000");
            text.setText(value);
        } else {
            // Highlight numeric values based on positive/negative
            formatPhaserCashText(text, value, suffix, true, false);
        }
    }

    addClickCash(x, y) {
        // Always give at least one cent per click, just to be merciful
        let clickCash = Math.max(state.getClickCashValue(), 0.01);	
        this.addTemporaryText(formatCash(clickCash, false),	
            "#ffffff", 48, x, y);
        this.cashEmitter.setPosition(x, y);
        this.cashEmitter.explode();
        state.addCurrentCash(clickCash);
    }

    addTemporaryText(text, color, fontSize, x, y) {
        let textStyle = {  
            fontFamily: 'Verdana',
            fontSize: fontSize + "px",
            color: color
        };
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
            alpha: 0,
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
                this.tilePreview.setVisible(false);
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
        if (isInDialog()) {
            return;
        }
        this.updateTileHighlight();
        this.controls.update(delta);
    }
}
import * as state from '../state/CashState';
import * as map from '../state/MapState';
import * as build from '../model/Building';
import * as tile from '../model/Tile';
import { ShopSelectionType, addShopSelectionListener, isInDialog } from '../state/UIState';
import { addGameResetListener } from '../state/GameState';
import { formatCash, formatPhaserCashText, setTextColorIfNecessary } from '../util/Util';
import * as audio from '../state/AudioState';

const tileScale = 1;
const blockImageHeight = 100 * tileScale;
const blockImageWidth = 132 * tileScale;
const buildingYDiff = 0.325 * -blockImageWidth;
const hoverImageAlpha = 0.65;
const previewWidth = 200;
const previewHeight = 125;
const previewTextMargin = 7;
const clickParticlesRateMs = 50;

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
        map.addMapRotationListener(this.mapRotationListener, this);
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
        this.lastClickParticles = 0;
        
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
        this.cameras.main.setZoom(0.85);

        // Cash rate preview for new buildings, and info on existing buildings/tiles
        this.createPreview();
    }

    mapRotationListener(mapRotation, scene) {
        scene.syncTileMap();
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
        this.tileMapR90 = new Array(this.mapHeight);
        this.tileMapR180 = new Array(this.mapWidth);
        this.tileMapR270 = new Array(this.mapHeight);

        for (let x = this.mapWidth - 1; x >= 0; x--) {
            this.tileMapImages[x] = new Array(this.mapHeight);
            this.buildingImages[x] = new Array(this.mapHeight);
            this.tileMapR90[x] = new Array(this.mapWidth);
            this.tileMapR180[x] = new Array(this.mapHeight);
            this.tileMapR270[x] = new Array(this.mapWidth);
            for (let y = this.mapHeight - 1; y >= 0; y--) {
                let tileCoords = this.displayTileCoordinatesToWorldCoordinates(x, y);
                let tileImage = this.add.image(tileCoords.x, tileCoords.y, 
                    map.getMap()[x][y].tile).setScale(tileScale).setOrigin(0.5, 1);
                this.tileMapImages[x][y] = tileImage;
                // Add a placeholder building image to be replaced when necessary
                let buildingImage = this.add.image(tileCoords.x, tileCoords.y + buildingYDiff,
                    '').setScale(tileScale).setOrigin(0.5, 1);
                buildingImage.setVisible(false);
                this.buildingImages[x][y] = buildingImage;
                // Build matrices to translate between canvas tiles and map tiles when
                // the map has been rotated.
                this.tileMapR90[x][y] = new Phaser.Math.Vector2(this.mapHeight - y - 1, x);
                this.tileMapR180[x][y] = new Phaser.Math.Vector2(this.mapWidth - x - 1  , this.mapHeight - y - 1);
                this.tileMapR270[x][y] = new Phaser.Math.Vector2(y, this.mapWidth - x - 1);
            }
        }
    }

    // Update displayed sprites to reflect the actual contents of the current tile map
    syncTileMap() {
        for (let x = this.mapWidth - 1; x >= 0; x--) {
            for (let y = this.mapHeight - 1; y >= 0; y--) {
                let mapCoords = this.displayToMapCoordinates(x, y);
                let building = map.getMap()[mapCoords.x][mapCoords.y].building;
                let rotation = (map.getMap()[mapCoords.x][mapCoords.y].rotation + map.getMapRotation()) % 360;
                if (building && ShopSelectionType[this.cache.json.get('buildings')[building]['shopSelectionType']] == 
                        ShopSelectionType.TILE_AND_BUILDING) {
                    this.tileMapImages[x][y].setTexture(this.getSelectionTextureName(building, rotation));
                } else {
                    this.tileMapImages[x][y].setTexture(map.getMap()[mapCoords.x][mapCoords.y].tile);
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

    displayToMapCoordinates(displayX, displayY) {
        if (!this.areTileCoordinatesValid(displayX, displayY)) {
            return new Phaser.Math.Vector2(-1, -1);
        }
        switch(map.getMapRotation()) {
            case 90:
                return this.tileMapR90[displayX][displayY];
            case 180:
                return this.tileMapR180[displayX][displayY];
            case 270:
                return this.tileMapR270[displayX][displayY];
            case 0:
            default:
                return new Phaser.Math.Vector2(displayX, displayY);
        }
    }

    mapToDisplayCoordinates(mapX, mapY) {
        if (!this.areTileCoordinatesValid(mapX, mapY)) {
            return new Phaser.Math.Vector2(-1, -1);
        }
        switch(map.getMapRotation()) {
            case 90:
                return this.tileMapR270[mapX][mapY];
            case 180:
                return this.tileMapR180[mapX][mapY];
            case 270:
                return this.tileMapR90[mapX][mapY];
            case 0:
            default:
                return new Phaser.Math.Vector2(mapX, mapY);
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
        let x = pointer.x;
        let y = pointer.y;
        let clickCoords = this.cameras.main.getWorldPoint(x, y);
        let displayTile = this.worldCoordinatesToDisplayTileCoordinates(clickCoords.x, clickCoords.y);
        let mapTile = this.displayToMapCoordinates(displayTile.x, displayTile.y);
        if (pointer.rightButtonReleased()) {
            if (this.areTileCoordinatesValid(mapTile.x, mapTile.y)) {
                if(map.getMap()[mapTile.x][mapTile.y].building) {
                    // Rotate existing building
                    let building = map.getMap()[mapTile.x][mapTile.y].building;
                    let newRotation = (map.getMap()[mapTile.x][mapTile.y].rotation + 90) % 360;
                    map.getMap()[mapTile.x][mapTile.y].rotation = newRotation;
                    let displayRotation = (newRotation + map.getMapRotation()) % 360;
                    if (ShopSelectionType[this.cache.json.get('buildings')[building]['shopSelectionType']] != ShopSelectionType.BUILDING_ONLY) {
                        this.tileMapImages[displayTile.x][displayTile.y].setTexture(this.getSelectionTextureName(building, displayRotation));
                    } else {
                        this.buildingImages[displayTile.x][displayTile.y].setTexture(this.getSelectionTextureName(building, displayRotation));
                    }
                    audio.playSound(this, "rotate", 0.65);
                } else if(this.currentShopSelection) {
                    this.shopSelectionRotation = (90 + this.shopSelectionRotation) % 360;
                    this.hoverImage.setTexture(this.getSelectionTextureName(this.currentShopSelection.getName(), this.shopSelectionRotation));
                    audio.playSound(this, "rotate", 0.65);
                }
            }
        } else {
            if (this.currentShopSelection && this.areTileCoordinatesValid(mapTile.x, mapTile.y) &&
                    map.canPlaceShopSelection(this.currentShopSelection, mapTile.x, mapTile.y)) {
                // Build the shop selection if enough cash
                if (map.getShopSelectionPrice(this.cache.json, this.currentShopSelection, 
                        mapTile.x, mapTile.y) <= state.getCurrentCash()) {
                    this.placeShopSelection(mapTile.x, mapTile.y);
                } else {
                    // Print message for not enough cash. Should only happen for demolition,
                    // as other options will not be selectable in the shop when you can't afford them.
                    let coords = this.worldCoordinatesToCanvasCoordinates(clickCoords.x, clickCoords.y - blockImageHeight);
                    this.addTemporaryText("Not enough cash!", "#000", 24, coords.x, coords.y);
                }
            } else {
                // Otherwise add cash
                this.addClickCash(x, y);
                audio.playSound(this, "leftClick", 0.75);
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
        let realRotation = this.shopSelectionRotation - map.getMapRotation();
        if (realRotation < 0) {
            realRotation += 360;
        }
        map.addShopSelectionToMap(selection, tileMap, x, y, realRotation);

        // Update cash per second and click cash
        state.updateCashRates(this.cache.json, map.getMap());

        // Update displayed sprites
        let displayCoords = this.mapToDisplayCoordinates(x, y);
        if (selection.selectionType == ShopSelectionType.DEMOLITION) {
            this.buildingImages[displayCoords.x][displayCoords.y].setVisible(false);
            this.tileMapImages[displayCoords.x][displayCoords.y].setTexture(tileMap[x][y].tile);
            this.tileMapImages[displayCoords.x][displayCoords.y].alpha = 1;
        } else if (selection.selectionType != ShopSelectionType.BUILDING_ONLY) {
            this.tileMapImages[displayCoords.x][displayCoords.y].setTexture(this.getSelectionTextureName(selection.getName(), this.shopSelectionRotation));
            this.tileMapImages[displayCoords.x][displayCoords.y].alpha = 1;
        } else {
            this.buildingImages[displayCoords.x][displayCoords.y].setVisible(true);
            this.buildingImages[displayCoords.x][displayCoords.y].setTexture(this.getSelectionTextureName(selection.getName(), this.shopSelectionRotation));
        }
        // Reset tile alpha to default on previous hovered tile
        if (this.areTileCoordinatesValid(this.tileHighlightActiveX, this.tileHighlightActiveY)) {
            this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].alpha = 1;
        }
        this.tileHighlightActiveX = -1;
        this.tileHighlightActiveY = -1;

        // Play sound
        if (selection.selectionType == ShopSelectionType.DEMOLITION) {
            audio.playSound(this, "demolition", 0.2);
        } else {
            audio.playSound(this, "placement", 0.8);
        }

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
        this.tilePreviewTitle.setColor("#000");
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
    updatePreview(tileX, tileY, displayX, displayY, showExistingBuildingRates) {
        let worldCoords = this.displayTileCoordinatesToWorldCoordinates(displayX, displayY);
        let previewCoords = this.worldCoordinatesToCanvasCoordinates(worldCoords.x, worldCoords.y - 150);
        this.tilePreview.setPosition(previewCoords.x, previewCoords.y);
        this.tilePreview.setVisible(true);

        // Show rates for whatever already exists on the tile
        if (showExistingBuildingRates) {
            if (map.getMap()[tileX][tileY].building) {
                let buildingName = map.getMap()[tileX][tileY].building;
                let shortName = this.cache.json.get('buildings')[buildingName]['shortName'];
                buildingName = shortName ? shortName : buildingName;
                // Building values
                this.updatePreviewTexts(buildingName,
                    build.getBuildingCashGrowthRate(this.cache.json.get('buildings'), map.getMap(), tileX, tileY),
                    build.getBuildingClickValue(this.cache.json.get('buildings'), map.getMap(), tileX, tileY));
            } else {
                // Tile values
                this.updatePreviewTexts(map.getMap()[tileX][tileY].tile,
                    tile.getTileCashGrowthRate(this.cache.json.get('tiles'), map.getMap(), tileX, tileY),
                    tile.getTileClickValue(this.cache.json.get('tiles'), map.getMap(), tileX, tileY));
            }
        // Showing shop selection rates preview
        } else {
            let mapCopy = JSON.parse(JSON.stringify(map.getMap()));
            map.addShopSelectionToMap(this.currentShopSelection, mapCopy, tileX, tileY, 0);
            let rates = state.getCashRates(this.cache.json, mapCopy);
            let rateDiffs = {
                cashGrowthRate: rates['cashGrowthRate'] - state.getCashGrowthRate(),
                clickValue: rates['clickValue'] - state.getClickCashValue()
            }
            // Preview difference in rates that would result after shop selection is placed
            this.updatePreviewTexts(
                -1 * map.getShopSelectionPrice(this.cache.json, this.currentShopSelection, tileX, tileY), 
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
            setTextColorIfNecessary(text, "#000");
            text.setText(value);
        } else {
            // Highlight numeric values based on positive/negative
            formatPhaserCashText(text, value, suffix, true, false);
        }
    }

    addClickCash(x, y) {
        // Always give at least one cent per click, just to be merciful
        let clickCash = Math.max(state.getClickCashValue(), 0.01);
        // Limit rate of producing click particles & text
        let now = Date.now();
        let timePassed = now - this.lastClickParticles;
        if (timePassed >= clickParticlesRateMs) {
            this.addTemporaryText(formatCash(clickCash, false),	
                "#ffffff", 48, x, y);
            this.cashEmitter.setPosition(x, y);
            this.cashEmitter.explode();
            this.lastClickParticles = now;
        }
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
        let displayTile = this.worldCoordinatesToDisplayTileCoordinates(worldCoords.x, worldCoords.y);
        let tile = this.displayToMapCoordinates(displayTile.x, displayTile.y);

        // If hovered tile hasn't changed, just exit
        if (displayTile.x == this.tileHighlightActiveX && displayTile.y == this.tileHighlightActiveY) {
            return;
        }

        // Reset tile alpha to default on previous hovered tile
        if (this.areTileCoordinatesValid(this.tileHighlightActiveX, this.tileHighlightActiveY)) {
            this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].alpha = 1;
        }
        this.tileHighlightActiveX = displayTile.x;
        this.tileHighlightActiveY = displayTile.y;

        // Update hover image/tile image, cash preview, and alpha
        if (this.areTileCoordinatesValid(tile.x, tile.y) && map.canPlaceShopSelection(this.currentShopSelection, tile.x, tile.y)) {
            let tileCoords = this.displayTileCoordinatesToWorldCoordinates(displayTile.x, displayTile.y);
            this.hoverImage.x = tileCoords.x;
            this.hoverImage.y = tileCoords.y;
            this.hoverImage.alpha = hoverImageAlpha;
            this.updatePreview(tile.x, tile.y, displayTile.x, displayTile.y, false);
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
                    this.tileMapImages[displayTile.x][displayTile.y].alpha = 0;
                }
            }
        // Hide preview, or show stats for existing building
        } else {
            this.hoverImage.alpha = 0;
            if (this.areTileCoordinatesValid(displayTile.x, displayTile.y)) {
                this.updatePreview(tile.x, tile.y, displayTile.x, displayTile.y, true);
            } else {
                this.tilePreview.setVisible(false);
            }
        }
    }

    worldCoordinatesToDisplayTileCoordinates(x, y) {
        let xDiff = x - this.mapOriginX;
        let yDiff = (this.mapOriginY - blockImageHeight / 2 + blockImageWidth / 4) - y;
        // Determine if point is between lines for x=0, x=1, x=2, etc. Line for x=0: x/2 + y = -(blockImageWidth / 4)
        // Similar for determining if in between y lines. Line for y=0: -x/2 + y = blockImageWidth / 4
        let tileX = Math.floor((xDiff + 2 * yDiff) / blockImageWidth - 0.25);
        let tileY = Math.floor((-xDiff + 2 * yDiff) / blockImageWidth - 0.25);
        return new Phaser.Math.Vector2(tileX, tileY);
    }

    displayTileCoordinatesToWorldCoordinates(tileX, tileY) {
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
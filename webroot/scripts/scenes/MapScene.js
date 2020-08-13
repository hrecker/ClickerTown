import * as state from '../state/CashState';
import * as map from '../state/MapState';
import * as tile from '../model/Tile';
import * as build from '../model/Building';
import { ShopSelectionType, getShopSelection, addShopSelectionListener } from '../state/UIState';

const tileScale = 1;
const blockImageHeight = 100 * tileScale;
const blockImageWidth = 132 * tileScale;
const buildingYDiff = 0.325 * -blockImageWidth;
const hoverImageAlpha = 0.65;

export class MapScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MapScene"
        });
    }

    init() {

    }

    preload() {
        
    }

    create() {
        this.mapWidth = 8;
        this.mapHeight = 8;

        this.mapOriginX = this.game.renderer.width / 2 - 75;
        this.mapOriginY = (this.game.renderer.height / 2) + (this.mapHeight * blockImageHeight / 3);
        
        this.tileHighlightActiveX = -1;
        this.tileHighlightActiveY = -1;

        // Background
        this.cameras.main.setBackgroundColor("#4287f5");

        // Blocks
        this.createTileMap();

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
    }

    // Origin of tile map coordinates is the tile closest to the bottom of the screen.
    // X increases diagonally up and to the right. Y increases diagonally up and to the left.
    createTileMap() {
        let tileMap = map.initializeMap(this.mapWidth, this.mapHeight);
        this.tileMapImages = new Array(this.mapWidth);
        this.buildingImages = new Array(this.mapWidth);

        for (let x = this.mapWidth - 1; x >= 0; x--) {
            this.tileMapImages[x] = new Array(this.mapHeight);
            this.buildingImages[x] = new Array(this.mapHeight);
            for (let y = this.mapHeight - 1; y >= 0; y--) {
                let tileCoords = this.getTileWorldCoordinates(x, y);
                let tileImage = this.add.image(tileCoords.x, tileCoords.y, 
                    tileMap[x][y].getTileName()).setScale(tileScale).setOrigin(0.5, 1);
                this.tileMapImages[x][y] = tileImage;
                // Add a placeholder building image to be replaced when necessary
                let buildingImage = this.add.image(tileCoords.x, tileCoords.y + buildingYDiff,
                    tileMap[x][y].getTileName()).setScale(tileScale).setOrigin(0.5, 1);
                buildingImage.setVisible(false);
                this.buildingImages[x][y] = buildingImage;
            }
        }
    }

    handleClick(event) {
        if (this.areTileCoordinatesValid(this.tileHighlightActiveX, this.tileHighlightActiveY)) {
            // If highlighting a tile, build the shop selection
            this.placeShopSelection();
        } else {
            // Otherwise add cash
            this.addClickCash(event);
        }
    }

    shopSelectionListener(shopSelection, scene) {
        scene.hoverImageType = shopSelection.selectionType;
        scene.hoverImage.setTexture(shopSelection.getName());
    }

    placeShopSelection() {
        let x = this.tileHighlightActiveX;
        let y = this.tileHighlightActiveY;
        let tileMap = map.getMap();
        // Can only modify/place tiles or buildings on tiles that don't have a building already
        // and do not match the tile being placed
        if (tileMap[x][y].getBuilding() == null && 
                (this.hoverImageType != ShopSelectionType.TILE_ONLY || tileMap[x][y].getTileName() != getShopSelection().getName())) {
            //TODO building price
            state.setCurrentCash(state.getCurrentCash() - 10);
            // Update the tileMap
            if (this.hoverImageType != ShopSelectionType.TILE_ONLY) {
                tileMap[x][y].placeBuilding(build.getBuildingTypeFromName(getShopSelection().buildingName));
            } 
            if (this.hoverImageType != ShopSelectionType.BUILDING_ONLY) {
                tileMap[x][y].type = tile.getTileTypeFromName(getShopSelection().tileName);
            }
            // Update displayed sprites
            if (this.hoverImageType != ShopSelectionType.BUILDING_ONLY) {
                this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].setTexture(getShopSelection().getName());
                this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].alpha = 1;
            } else {
                this.buildingImages[x][y].setVisible(true);
                this.buildingImages[x][y].setTexture(getShopSelection().getName());
            }
            this.tileHighlightActiveX = -1;
            this.tileHighlightActiveY = -1;
        }
    }

    addClickCash(event) {
        // Add cash text animation
        //TODO calculating amount to give per click
        let cashAmount = state.getCashGrowthRate();
        let clickTextStyle = { font: "48px Arial", fill: "#15b800" };
        let cashClickText = this.game.scene.getScene('UIScene').add.text(
            event.upX, event.upY, "$" + cashAmount, clickTextStyle);
        this.add.tween({
            targets: [cashClickText],
            ease: 'Sine.easeInOut',
            duration: 1000,
            delay: 0,
            y: {
              getStart: () => cashClickText.y,
              getEnd: () => cashClickText.y - 50
            },
            onComplete: () => {
              cashClickText.destroy();
            }
          });

        //TODO calculating amount to give per click
        // Giving 1 second of cash per click right now
        state.setCurrentCash(state.getCurrentCash() + cashAmount);
    }

    updateTileHighlight(x, y) {
        let xDiff = x - this.mapOriginX;
        let yDiff = (this.mapOriginY - blockImageHeight / 2 + blockImageWidth / 4) - y;
        
        // Determine if point is between lines for x=0, x=1, x=2, etc. Line for x=0: x/2 + y = -(blockImageWidth / 4)
        // Similar for determining if in between y lines. Line for y=0: -x/2 + y = blockImageWidth / 4
        let tileX = Math.floor((xDiff + 2 * yDiff) / blockImageWidth - 0.25);
        let tileY = Math.floor((-xDiff + 2 * yDiff) / blockImageWidth - 0.25);

        if (tileX == this.tileHighlightActiveX && tileY == this.tileHighlightActiveY) {
            return;
        }

        // Reset tile image and alpha
        if (this.areTileCoordinatesValid(this.tileHighlightActiveX, this.tileHighlightActiveY)) {
            if (this.hoverImageType != ShopSelectionType.BUILDING_ONLY) {
                this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].alpha = 1;
            }
        }

        // Update hover image or tile image and alpha
        if (this.areTileCoordinatesValid(tileX, tileY) && map.getMap()[tileX][tileY].getBuilding() == null && 
                (this.hoverImageType != ShopSelectionType.TILE_ONLY || map.getMap()[tileX][tileY].getTileName() != getShopSelection().getName())) {
            this.tileHighlightActiveX = tileX;
            this.tileHighlightActiveY = tileY;
            let tileCoords = this.getTileWorldCoordinates(tileX, tileY);
            this.hoverImage.x = tileCoords.x;
            this.hoverImage.y = tileCoords.y;
            this.hoverImage.alpha = hoverImageAlpha;
            if (this.hoverImageType == ShopSelectionType.BUILDING_ONLY) {
                this.hoverImage.y += buildingYDiff;
            } else {
                this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].alpha = 0;
            }
        } else {
            this.tileHighlightActiveX = -1;
            this.tileHighlightActiveY = -1;
            this.hoverImage.alpha = 0;
        }
    }

    getTileWorldCoordinates(tileX, tileY) {
        let xDiff = (tileX - tileY) * blockImageWidth / 2;
        let yDiff = (tileX + tileY) * -blockImageWidth / 4;
        return new Phaser.Math.Vector2(this.mapOriginX + xDiff, this.mapOriginY + yDiff);
    }

    areTileCoordinatesValid(x, y) {
        return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
    }

    // Update highlighted tile
    update(time, delta) {
        let worldCoords = this.cameras.main.getWorldPoint(this.game.input.mousePointer.x, this.game.input.mousePointer.y);
        this.updateTileHighlight(worldCoords.x, worldCoords.y);
        this.controls.update(delta);
    }
}
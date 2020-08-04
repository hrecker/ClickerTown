import * as state from '../state/CashState';
import * as map from '../state/MapState';
import * as tile from '../model/Tile';
import * as build from '../model/Building';
import * as util from '../util/Util';

const blockImageHeight = 256;
const blockImageWidth = 128;

export class MapScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MapScene"
        });
        // From https://labs.phaser.io/edit.html?src=src/scenes/multiple%20scenes%20from%20classes.js
        Phaser.Scene.call(this, { key: 'MapScene', active: true });
    }

    init() {

    }

    preload() {
        console.log("preloading MapScene");
        this.load.image('background', 'assets/sprites/background.png');
        this.load.image('stone', 'assets/sprites/Stone.png');
        this.load.image('patchy_grass', 'assets/sprites/Patchy_Grass.png');
        this.load.image('full_grass', 'assets/sprites/Full_Grass.png');
        this.load.image('boulder', 'assets/sprites/Boulder.png');
        this.load.image('chest', 'assets/sprites/Chest.png');
        this.load.image('crate', 'assets/sprites/Crate.png');

        this.mapWidth = 3;
        this.mapHeight = 3;

        this.mapOriginX = this.game.renderer.width / 2;
        this.mapOriginY = this.game.renderer.height / 2 + 100;
        
        this.tileHighlightActiveX = -1;
        this.tileHighlightActiveY = -1;
    }

    create() {
        // Background
        this.add.image(0, 0, 'background').setOrigin(0, 0);

        // Blocks
        this.createTileMap();

        // Hover image
        this.hoverImage = this.add.image(-5000, -5000, 'crate');
        this.hoverImage.alpha = 0.65;

        // Click handler
        this.input.on("pointerup", this.handleClick, this);
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
                let xDiff = (x - y) * blockImageWidth;
                let yDiff = (x + y) * -blockImageWidth / 2;
                let tileImage = this.add.image(this.mapOriginX + xDiff, 
                    this.mapOriginY + yDiff, this.getBlockImageName(tileMap[x][y]));
                this.tileMapImages[x][y] = tileImage;
            }
        }
    }

    getBlockImageName(mapTile) {
        switch(mapTile.type) {
            case tile.TileType.STONE:
                return 'stone';
            case tile.TileType.FULL_GRASS:
                return 'full_grass';
            case tile.TileType.PATCHY_GRASS:
            default:
                return 'patchy_grass';
        }
    }

    handleClick(event) {
        if (this.areTileCoordinatesValid(this.tileHighlightActiveX, this.tileHighlightActiveY)) {
            // If highlighting a tile, build building
            this.placeBuilding(event);
        } else {
            // Otherwise add cash
            this.addClickCash(event);
        }
    }

    placeBuilding(event) {
        let x = this.tileHighlightActiveX;
        let y = this.tileHighlightActiveY;
        let tileMap = map.getMap();
        if (tileMap[x][y].getBuilding() == null) {
            state.setCurrentCash(state.getCurrentCash() - 10);
            let randomBuildingIndex = util.getRandomInt(0, 3);
            tileMap[x][y].placeBuilding(build.getBuildingType(randomBuildingIndex));
            let xDiff = (x - y) * blockImageWidth;
            let yDiff = ((x + y) * -blockImageWidth / 2) - (blockImageWidth / 4);
            let buildingImage = this.add.image(this.mapOriginX + xDiff, 
                this.mapOriginY + yDiff, this.getBuildingImageName(tileMap[x][y]));
            this.buildingImages[x][y] = buildingImage;
            this.tileMapImages[x][y].setTint(0xffffff);
            this.tileHighlightActiveX = -1;
            this.tileHighlightActiveY = -1;
            this.hoverImage.x = -1000;
            this.hoverImage.y = -1000;
        }
    }

    getBuildingImageName(mapTile) {
        switch(mapTile.getBuilding().type) {
            case build.BuildingType.CRATE:
                return 'crate';
            case build.BuildingType.CHEST:
                return 'chest';
            case build.BuildingType.BOULDER:
            default:
                return 'boulder';
        }
    }

    addClickCash(event) {
        // Add cash text animation
        //TODO calculating amount to give per click
        let cashAmount = state.getCashGrowthRate();
        let clickTextStyle = { font: "14px Arial", fill: "#15b800" };
        let cashClickText = this.add.text(event.upX, event.upY, "$" + cashAmount, clickTextStyle);
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
        let yDiff = -1 * (y - this.mapOriginY - (blockImageWidth / 2));
        let tileX = Math.floor((xDiff / blockImageWidth / 2) + (yDiff / blockImageWidth));
        let tileY = Math.floor((yDiff / blockImageWidth) - (xDiff / blockImageWidth / 2));

        if (tileX == this.tileHighlightActiveX && tileY == this.tileHighlightActiveY) {
            return;
        }

        // Update tints
        if (this.areTileCoordinatesValid(this.tileHighlightActiveX, this.tileHighlightActiveY)) {
            this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].setTint(0xffffff);
        }

        if (this.areTileCoordinatesValid(tileX, tileY) && map.getMap()[tileX][tileY].getBuilding() == null) {
            this.tileMapImages[tileX][tileY].setTint(0xff7c73);
            this.tileHighlightActiveX = tileX;
            this.tileHighlightActiveY = tileY;
            let hoverXDiff = (tileX - tileY) * blockImageWidth;
            let hoverYDiff = (tileX + tileY) * -blockImageWidth / 2;
            this.hoverImage.x = this.mapOriginX + hoverXDiff;
            this.hoverImage.y = this.mapOriginY + hoverYDiff - blockImageWidth / 4;
        } else {
            this.tileHighlightActiveX = -1;
            this.tileHighlightActiveY = -1;
            this.hoverImage.x = -1000;
            this.hoverImage.y = -1000;
        }
    }

    areTileCoordinatesValid(x, y) {
        return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight;
    }

    // Update highlighted tile
    update() {
        this.updateTileHighlight(this.game.input.mousePointer.x, this.game.input.mousePointer.y);
    }
}
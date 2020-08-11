import * as state from '../state/CashState';
import * as map from '../state/MapState';
import * as tile from '../model/Tile';
import * as build from '../model/Building';
import * as util from '../util/Util';

const tileScale = 1;
const blockImageHeight = 100 * tileScale;
const blockImageWidth = 132 * tileScale;

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
        this.load.image('concrete', 'assets/sprites/tiles/cityTiles_072.png');
        this.load.image('sand', 'assets/sprites/tiles/landscapeTiles_059.png');
        this.load.image('grass', 'assets/sprites/tiles/landscapeTiles_067.png');
        this.load.image('dirt', 'assets/sprites/tiles/landscapeTiles_083.png');
        this.load.image('yellow', 'assets/sprites/buildings/buildingTiles_008.png');
        this.load.image('red', 'assets/sprites/buildings/buildingTiles_016.png');
        this.load.image('brown', 'assets/sprites/buildings/buildingTiles_038.png');
        this.load.image('red_awning', 'assets/sprites/buildings/buildingTiles_004.png');
        this.load.image('green_awning', 'assets/sprites/buildings/buildingTiles_018.png');
        this.load.image('no_awning', 'assets/sprites/buildings/buildingTiles_009.png');

        this.mapWidth = 8;
        this.mapHeight = 8;

        this.mapOriginX = this.game.renderer.width / 2 - 75;
        this.mapOriginY = (this.game.renderer.height / 2) + (this.mapHeight * blockImageHeight / 3);
        
        this.tileHighlightActiveX = -1;
        this.tileHighlightActiveY = -1;
    }

    create() {
        // Background
        this.cameras.main.setBackgroundColor("#4287f5");

        // Blocks
        this.createTileMap();

        // Hover image
        this.hoverImage = this.add.image(0, 0, 'yellow').setScale(tileScale).setOrigin(0.5, 1);
        this.hoverImage.alpha = 0;
        this.hoverImageType = build.SpriteType.BUILDING_ONLY;

        // Click handler
        this.input.on("pointerup", this.handleClick, this);
        
        // Selected building listener
        map.addSelectedBuildingListener(this.selectedBuildingListener, this);

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
                let xDiff = (x - y) * blockImageWidth / 2;
                let yDiff = (x + y) * -blockImageWidth / 4;
                let tileImage = this.add.image(this.mapOriginX + xDiff, 
                    this.mapOriginY + yDiff, this.getBlockImageName(tileMap[x][y])).setScale(tileScale).setOrigin(0.5, 1);
                this.tileMapImages[x][y] = tileImage;
                let buildingImage = this.add.image(this.mapOriginX + xDiff, 
                    this.mapOriginY + yDiff - (0.325 * blockImageWidth), 'yellow').setScale(tileScale).setOrigin(0.5, 1);
                buildingImage.setVisible(false);
                this.buildingImages[x][y] = buildingImage;
            }
        }
    }

    getBlockImageName(mapTile) {
        switch(mapTile.type) {
            case tile.TileType.CONCRETE:
                return 'concrete';
            case tile.TileType.SAND:
                return 'sand';
            case tile.TileType.GRASS:
                return 'grass';
            case tile.TileType.DIRT:
            default:
                return 'dirt';
        }
    }

    handleClick(event) {
        if (this.areTileCoordinatesValid(this.tileHighlightActiveX, this.tileHighlightActiveY)) {
            // If highlighting a tile, build building
            this.placeBuilding();
        } else {
            // Otherwise add cash
            this.addClickCash(event);
        }
    }

    selectedBuildingListener(selectedBuilding, scene) {
        scene.hoverImageType = selectedBuilding.spriteType;
        if (scene.hoverImageType == build.SpriteType.BUILDING_ONLY) {
            scene.hoverImage.setTexture(selectedBuilding.getName());
        }
    }

    placeBuilding() {
        let x = this.tileHighlightActiveX;
        let y = this.tileHighlightActiveY;
        let tileMap = map.getMap();
        if (tileMap[x][y].getBuilding() == null) {
            state.setCurrentCash(state.getCurrentCash() - 10);
            tileMap[x][y].placeBuilding(map.getSelectedBuilding().buildingType);
            if (this.hoverImageType == build.SpriteType.TILE_AND_BUILDING) {
                this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].setTexture(map.getSelectedBuilding().getName());
                this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].alpha = 1;
            } else {
                this.buildingImages[x][y].setVisible(true);
                this.buildingImages[x][y].setTexture(map.getSelectedBuilding().getName());
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
        let yDiff = -1 * (y - this.mapOriginY + blockImageHeight / 2 - blockImageWidth / 4);
        
        // Determine if point is between lines for x=0, x=1, x=2, etc. Line for x=0: x/2 + y = -(blockImageWidth / 4)
        // Similar for determining if in between y lines. Line for y=0: -x/2 + y = blockImageWidth / 4
        let tileX = Math.floor((xDiff + 2 * yDiff) / blockImageWidth - 0.25);
        let tileY = Math.floor((-xDiff + 2 * yDiff) / blockImageWidth - 0.25);

        if (tileX == this.tileHighlightActiveX && tileY == this.tileHighlightActiveY) {
            return;
        }

        // Update tints
        if (this.areTileCoordinatesValid(this.tileHighlightActiveX, this.tileHighlightActiveY)) {
            if (this.hoverImageType == build.SpriteType.TILE_AND_BUILDING) {
                this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].setTexture(
                    this.getBlockImageName(map.getMap()[this.tileHighlightActiveX][this.tileHighlightActiveY]));
                this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].alpha = 1;
            }
        }

        if (this.areTileCoordinatesValid(tileX, tileY) && map.getMap()[tileX][tileY].getBuilding() == null) {
            this.tileHighlightActiveX = tileX;
            this.tileHighlightActiveY = tileY;
            if (this.hoverImageType == build.SpriteType.BUILDING_ONLY) {
                let xDiff = (tileX - tileY) * blockImageWidth / 2;
                let yDiff = (tileX + tileY) * -blockImageWidth / 4;
                this.hoverImage.x = this.mapOriginX + xDiff;
                this.hoverImage.y = this.mapOriginY + yDiff - (0.325 * blockImageWidth);
                this.hoverImage.alpha = 0.65;
            } else {
                this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].setTexture(map.getSelectedBuilding().getName());
                this.tileMapImages[this.tileHighlightActiveX][this.tileHighlightActiveY].alpha = 0.65;
            }
        } else {
            this.tileHighlightActiveX = -1;
            this.tileHighlightActiveY = -1;
            this.hoverImage.alpha = 0;
        }
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
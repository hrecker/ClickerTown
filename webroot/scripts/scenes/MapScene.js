import * as state from '../state/CashState';
import * as map from '../state/MapState';
import * as tile from '../model/Tile';

const blockImageHeight = 256;
const blockImageWidth = 128;

export class MapScene extends Phaser.Scene {
    constructor() {
        super({
            key: "MapScene"
        });
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

        // UI
        let titleTextStyle = { font: "bold 32px Arial", fill: "#15b800", boundsAlignH: "center", boundsAlignV: "middle" };
        let subtitleTextStyle = { font: "bold 24px Arial", fill: "#15b800", boundsAlignH: "center", boundsAlignV: "middle" };

        //TODO handle really large cash values
        this.add.rectangle(this.game.renderer.width / 2, 25, 200, 50, 0x404040);
        this.add.rectangle(this.game.renderer.width / 2, 65, 150, 30, 0x000000);
        //TODO comma formatting for cash
        this.currentCashText = this.add.text(this.game.renderer.width / 2, 25, '$' + state.getCurrentCash(), titleTextStyle);
        this.currentCashText.setOrigin(0.5);
        this.cashGrowthRateText = this.add.text(this.game.renderer.width / 2, 65, '+$' + state.getCashGrowthRate(), subtitleTextStyle);
        this.cashGrowthRateText.setOrigin(0.5);

        // Cash growth timer
        this.lastCashGrowth = -1;

        // Click handler
        this.input.on("pointerup", this.addClickCash, this);
    }

    // Origin of tile map coordinates is the tile closest to the bottom of the screen.
    // X increases diagonally up and to the right. Y increases diagonally up and to the left.
    createTileMap() {
        let tileMap = map.initializeMap(this.mapWidth, this.mapHeight);
        this.tileMapImages = new Array(this.mapWidth);

        for (let x = this.mapWidth - 1; x >= 0; x--) {
            this.tileMapImages[x] = new Array(this.mapHeight);
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

    addClickCash(event) {
        // Add cash text animation
        //TODO calculating amount to give per click
        let clickTextStyle = { font: "14px Arial", fill: "#15b800" };
        let cashClickText = this.add.text(event.upX, event.upY, "$1", clickTextStyle);
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
        this.addCashPerSecond(1);
    }

    addCashPerSecond(seconds) {
        state.setCurrentCash(state.getCurrentCash() + (seconds * state.getCashGrowthRate()));
        this.currentCashText.setText('$' + state.getCurrentCash());
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

        if (this.areTileCoordinatesValid(tileX, tileY)) {
            this.tileMapImages[tileX][tileY].setTint(0xff7c73);
            this.tileHighlightActiveX = tileX;
            this.tileHighlightActiveY = tileY;
            let hoverXDiff = (tileX - tileY) * blockImageWidth;
            let hoverYDiff = (tileX + tileY) * -blockImageWidth / 2;
            this.hoverImage.x = this.mapOriginX + hoverXDiff;
            this.hoverImage.y = this.mapOriginY + hoverYDiff - blockImageWidth / 4;
            console.log("x: " + tileX + ", y: " + tileY);
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

    // Add cash every second
    update() {
        let now = Date.now();
        if (this.lastCashGrowth === -1) {
            this.lastCashGrowth = now;
        }
        
        let timePassed = now - this.lastCashGrowth;
        if (timePassed >= 1000) {
            let secondsPassed = Math.floor(timePassed / 1000);
            this.addCashPerSecond(secondsPassed);
            let timeRemainder = timePassed - (secondsPassed * 1000);
            this.lastCashGrowth = now - timeRemainder;
        }
        
        this.updateTileHighlight(this.game.input.mousePointer.x, this.game.input.mousePointer.y);
    }
}
import * as state from '../state/CashState';

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
        this.load.image('block1', 'assets/sprites/Block_1.png');
        this.load.image('block2', 'assets/sprites/Block_2.png');
        this.load.image('block3', 'assets/sprites/Block_3.png');

        this.tileMap = []
        this.tileMap.push([1, 2, 2]);
        this.tileMap.push([1, 3, 1]);
        this.tileMap.push([3, 2, 3]);
        this.tileMapImages = [];
        this.tileMapImages.push([1, 2, 2]);
        this.tileMapImages.push([1, 3, 1]);
        this.tileMapImages.push([3, 2, 3]);
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

        // UI
        let titleTextStyle = { font: "bold 32px Arial", fill: "#15b800", boundsAlignH: "center", boundsAlignV: "middle" };
        let subtitleTextStyle = { font: "bold 24px Arial", fill: "#15b800", boundsAlignH: "center", boundsAlignV: "middle" };

        //TODO handle really large cash values
        this.add.rectangle(this.game.renderer.width / 2, 25, 200, 50, 0x404040);
        this.add.rectangle(this.game.renderer.width / 2, 65, 150, 30, 0x000000);
        //TODO commas for cash
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
        for (let x = this.mapWidth - 1; x >= 0; x--) {
            for (let y = this.mapHeight - 1; y >= 0; y--) {
                let xDiff = (x - y) * blockImageWidth;
                let yDiff = (x + y) * -blockImageWidth / 2;
                let tileImage = this.add.image(this.mapOriginX + xDiff, 
                    this.mapOriginY + yDiff, this.getBlockImageName(this.tileMap[x][y]));
                this.tileMapImages[x][y] = tileImage;
            }
        }
    }

    getBlockImageName(index) {
        switch(index) {
            case 1:
                return 'block1';
            case 2:
                return 'block2';
            case 3:
                return 'block3';
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
        } else {
            this.tileHighlightActiveX = -1;
            this.tileHighlightActiveY = -1;
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
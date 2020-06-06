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
    }

    create() {
        // Background
        this.add.image(0, 0, 'background').setOrigin(0, 0);

        // Blocks
        this.add.image(this.game.renderer.width / 2, this.game.renderer.height / 2, 'block1').setScale(0.5);
        this.add.image(this.game.renderer.width / 2 - blockImageWidth / 2, this.game.renderer.height / 2 + blockImageWidth / 4, 'block2').setScale(0.5);
        this.add.image(this.game.renderer.width / 2 + blockImageWidth / 2, this.game.renderer.height / 2 + blockImageWidth / 4, 'block3').setScale(0.5);
        this.add.image(this.game.renderer.width / 2, this.game.renderer.height / 2 + blockImageWidth / 2, 'block1').setScale(0.5);

        // Text
        this.add.text(16, 16, 'Map Scene', { fontSize: '32px', fill: '#FFFF' });
        
        console.log("created MapScene");
    }
}
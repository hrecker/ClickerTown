export class LoadingScene extends Phaser.Scene {
    constructor() {
        super({
            key: "LoadingScene"
        });
    }

    init() {

    }

    preload() {
        console.log("LoadingScene starting");
        this.load.image('concrete', 'assets/sprites/tiles/cityTiles_072.png');
        this.load.image('sand', 'assets/sprites/tiles/landscapeTiles_059.png');
        this.load.image('grass', 'assets/sprites/tiles/landscapeTiles_067.png');
        this.load.image('dirt', 'assets/sprites/tiles/landscapeTiles_083.png');
        this.load.image('yellow', 'assets/sprites/buildings/buildingTiles_008.png');
        this.load.image('red', 'assets/sprites/buildings/buildingTiles_016.png');
        this.load.image('red_awning', 'assets/sprites/buildings/buildingTiles_004.png');
        this.load.image('green_awning', 'assets/sprites/buildings/buildingTiles_018.png');
        this.load.image('no_awning', 'assets/sprites/buildings/buildingTiles_009.png');
    }

    create() {
        this.scene.start("MapScene").start("UIScene").stop();
    }
}
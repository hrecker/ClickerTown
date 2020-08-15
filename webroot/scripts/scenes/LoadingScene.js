import * as state from '../state/CashState';

// Load json and assets
export class LoadingScene extends Phaser.Scene {
    constructor() {
        super({
            key: "LoadingScene"
        });
    }

    preload() {
        // Load initial json values
        this.load.json('buildings', 'assets/data/buildings.json');
        this.load.json('initials', 'assets/data/initials.json');
        this.load.json('tiles', 'assets/data/tiles.json');
    }

    create() {
        // Set initial cash values
        state.setCurrentCash(this.cache.json.get('initials')['startingCash']);
        state.setCashGrowthRate(this.cache.json.get('initials')['startingGrowthRate']);
        state.setClickCashValue(this.cache.json.get('initials')['startingClickValue']);

        // Load assets
        // Building sprites
        for (let buildingName in this.cache.json.get('buildings')) {
            let building = this.cache.json.get('buildings')[buildingName];
            this.load.image(building['name'], 'assets/sprites/buildings/' + building['sprite']);
        }

        // Tile sprites
        for (let tileName in this.cache.json.get('tiles')) {
            let tile = this.cache.json.get('tiles')[tileName];
            this.load.image(tileName, 'assets/sprites/tiles/' + tile['sprite']);
        }
        
        this.load.start();
        this.load.once('complete', () => {
            this.scene.start("MapScene").start("UIScene").stop();
        });
    }
}
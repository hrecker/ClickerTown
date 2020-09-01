import * as state from '../state/CashState';
import * as map from '../state/MapState';

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

        // Load other sprites
        this.load.image('bomb', 'assets/sprites/ui/bomb.png');
    }

    create() {
        // Set initial cash values
        state.setCurrentCash(this.cache.json.get('initials')['startingCash']);
        state.setCashGrowthRate(this.cache.json.get('initials')['startingGrowthRate']);
        state.setClickCashValue(this.cache.json.get('initials')['startingClickValue']);
        state.setStartingCashGrowthRate(this.cache.json.get('initials')['startingGrowthRate']);
        state.setStartingClickValue(this.cache.json.get('initials')['startingClickValue']);
        map.setDemolitionCostFraction(this.cache.json.get('initials')['demolishFraction']);

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
        
        // Initialize tile map
        map.initializeMap(this.cache.json.get('tiles'),
            this.cache.json.get('initials')['mapWidth'], this.cache.json.get('initials')['mapHeight']);
        
        this.load.start();
        this.load.once('complete', () => {
            this.scene.start("MapScene").start("UIScene").stop();
        });
    }
}
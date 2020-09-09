import * as state from '../state/CashState';
import * as map from '../state/MapState';
import { initializeGame } from '../state/GameState';

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

        // Load UI elements
        this.load.image('bomb', 'assets/sprites/ui/bomb.png');
        this.load.image('dollarSign', 'assets/sprites/ui/cash_particle.png');
        for (let i = 1; i <= 9; i++) {
            this.load.image('cloud' + i, 'assets/sprites/background/cloud' + i + '.png');
        }
        this.load.image('resetButton', 'assets/sprites/ui/reset_button.png');
        this.load.image('resetButtonDown', 'assets/sprites/ui/reset_button_down.png');
        this.load.image('saveButton', 'assets/sprites/ui/save_button.png');
        this.load.image('saveButtonDown', 'assets/sprites/ui/save_button_down.png');
        this.load.image('confirmButton', 'assets/sprites/ui/confirm_button.png');
        this.load.image('confirmButtonDown', 'assets/sprites/ui/confirm_button_down.png');
        this.load.image('cancelButton', 'assets/sprites/ui/cancel_button.png');
        this.load.image('cancelButtonDown', 'assets/sprites/ui/cancel_button_down.png');
        this.load.image('promptPanel', 'assets/sprites/ui/prompt_panel.png');
        this.load.image('previewPanel', 'assets/sprites/ui/building_preview_panel.png');
        this.load.image('slider', 'assets/sprites/ui/grey_sliderVertical.png');
        this.load.image('shopItemPanel', 'assets/sprites/ui/shop_item_panel.png');
    }

    create() {
        // Set various initial values from json
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

        initializeGame(this.cache.json, false);
        
        this.load.start();
        this.load.once('complete', () => {
            this.scene.start("BackgroundScene")
                      .start("MapScene")
                      .start("UIScene")
                      .stop();
        });
    }
}
import * as state from '../state/CashState';
import * as map from '../state/MapState';
import { initializeGame, setPriceIncreaseRate } from '../state/GameState';
import { loadSelections } from '../state/ShopSelectionCache';

// Load json and assets
export class LoadingScene extends Phaser.Scene {
    constructor() {
        super({
            key: "LoadingScene"
        });
    }

    preload() {
        // Loading message
        this.cameras.main.setBackgroundColor("#4287f5");
        this.add.text(this.game.renderer.width / 2, this.game.renderer.height / 2, "Loading...",
            { font: "bold 48px Verdana" }).setOrigin(0.5, 0.5);

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
        this.load.image('rotateClockwiseButton', 'assets/sprites/ui/rotate_clockwise_button.png');
        this.load.image('rotateClockwiseButtonDown', 'assets/sprites/ui/rotate_clockwise_button_down.png');
        this.load.image('slider', 'assets/sprites/ui/grey_sliderVertical.png');
        this.load.image('greyPanel', 'assets/sprites/ui/grey_panel.png');
        this.load.image('titleImage', 'assets/sprites/ui/title_image.png');
        this.load.image('playButton', 'assets/sprites/ui/play_button.png');
        this.load.image('playButtonDown', 'assets/sprites/ui/play_button_down.png');
        this.load.image('musicOnButton', 'assets/sprites/ui/music_on_button.png');
        this.load.image('musicOnButtonDown', 'assets/sprites/ui/music_on_button_down.png');
        this.load.image('musicOffButton', 'assets/sprites/ui/music_off_button.png');
        this.load.image('musicOffButtonDown', 'assets/sprites/ui/music_off_button_down.png');
        this.load.image('soundOnButton', 'assets/sprites/ui/sound_on_button.png');
        this.load.image('soundOnButtonDown', 'assets/sprites/ui/sound_on_button_down.png');
        this.load.image('soundOffButton', 'assets/sprites/ui/sound_off_button.png');
        this.load.image('soundOffButtonDown', 'assets/sprites/ui/sound_off_button_down.png');

        // Load audio
        this.load.audio('backgroundMusic', 'assets/sound/music/Puzzle-Dreams.mp3');
        this.load.audio('buttonClick', 'assets/sound/sfx/button_click.ogg');
        this.load.audio('demolition', 'assets/sound/sfx/demolition.ogg');
        this.load.audio('leftClick', 'assets/sound/sfx/left_click.ogg');
        this.load.audio('placement', 'assets/sound/sfx/placement.ogg');
        this.load.audio('rotate', 'assets/sound/sfx/rotate.ogg');
        this.load.audio('shopDeselect', 'assets/sound/sfx/shop_deselect.ogg');
        this.load.audio('shopSelect', 'assets/sound/sfx/shop_select.ogg');
        this.load.audio('shopUnlock', 'assets/sound/sfx/shop_unlock.ogg');
    }

    create() {
        // Set various initial values from json
        state.setStartingCashGrowthRate(this.cache.json.get('initials')['startingGrowthRate']);
        state.setStartingClickValue(this.cache.json.get('initials')['startingClickValue']);
        map.setDemolitionCostFraction(this.cache.json.get('initials')['demolishFraction']);
        setPriceIncreaseRate(this.cache.json.get('initials')['priceIncreaseRate']);
        loadSelections(this.cache.json);

        // Load assets
        // Building sprites
        for (let buildingName in this.cache.json.get('buildings')) {
            let building = this.cache.json.get('buildings')[buildingName];
            this.load.image(building['name'], 'assets/sprites/buildings/' + building['sprite']);
            if (building['sprite90']) {
                this.load.image(building['name'] + "90", 'assets/sprites/buildings/' + building['sprite90']);
            }
            if (building['sprite180']) {
                this.load.image(building['name'] + "180", 'assets/sprites/buildings/' + building['sprite180']);
            }
            if (building['sprite270']) {
                this.load.image(building['name'] + "270", 'assets/sprites/buildings/' + building['sprite270']);
            }
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
                      .start("TitleScene")
                      .stop();
        });
    }
}
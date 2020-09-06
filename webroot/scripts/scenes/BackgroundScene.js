import { getRandomInt } from '../util/Util';

const cloudInitialX = -100;
const cloudDeleteTime = 60000;
const minCloudSpeed = 50;
const maxCloudSpeed = 125;
const cloudChance = 0.5;

// Add cloud images that scroll across the background left to right
export class BackgroundScene extends Phaser.Scene {
    constructor() {
        super({
            key: "BackgroundScene"
        });
    }

    create() {
        this.cameras.main.setBackgroundColor("#4287f5");
        this.lastAddedCloud = -1;
    }

    addRandomCloudImage() {
        let cloud = this.add.image(cloudInitialX, getRandomInt(0, this.game.renderer.height),
            'cloud' + getRandomInt(1, 10));
        this.physics.world.enable([ cloud ]);
        cloud.body.setVelocity(getRandomInt(minCloudSpeed, maxCloudSpeed), 0);
        this.time.delayedCall(cloudDeleteTime, this.deleteCloud, [cloud]);
    }

    deleteCloud(cloud) {
        cloud.destroy();
    }

    update() {
        let now = Date.now();
        if (this.lastAddedCloud === -1) {
            this.lastAddedCloud = now;
        }
        
        let timePassed = now - this.lastAddedCloud;
        // Chance to add a cloud every second
        if (timePassed >= 1000) {
            if (getRandomInt(0, 100) < cloudChance * 100) {
                this.addRandomCloudImage();
            }
            let secondsPassed = Math.floor(timePassed / 1000);
            let timeRemainder = timePassed - (secondsPassed * 1000);
            this.lastAddedCloud = now - timeRemainder;
        }
    }
}
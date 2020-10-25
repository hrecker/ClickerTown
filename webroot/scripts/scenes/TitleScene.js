// Starting scene
export class TitleScene extends Phaser.Scene {
    constructor() {
        super({
            key: "TitleScene"
        });
    }

    create() {
        let centerX = this.game.renderer.width / 2;
        let centerY = this.game.renderer.height / 2;
        let titleStyle = { 
            font: "bold 100px Verdana",
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 3,
                stroke: true,
                fill: true
            }
        };
        this.add.text(centerX, this.game.renderer.height / 8, "ClickerTown", titleStyle).setOrigin(0.5);
        this.add.image(centerX, centerY - 100, "titleImage").setScale(0.6);

        // Play button
        let playButton = this.add.image(centerX, centerY + 75, "playButton").setScale(1.5);
        let buttonDown = false;
        playButton.setInteractive();
        playButton.on('pointerout', () => {
            playButton.setTexture('playButton');
            buttonDown = false;
        });
        playButton.on('pointerdown', () => {
            playButton.setTexture("playButtonDown");
            buttonDown = true;
        });
        playButton.on('pointerup', () => {
            playButton.setTexture('playButton');
            if (buttonDown) {
                // Start game
                this.scene.start("MapScene")
                        .start("UIScene")
                        .stop();
            }
            buttonDown = false;
        });

        // Controls
        let controlsBox = this.add.graphics();
        controlsBox.fillStyle(0x4287f5, 0.5);
        controlsBox.fillRect(centerX - 230, playButton.y + 50, 460, 300);
        let controlsStyle = { 
            font: "30px Verdana",
            align: "center",
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 3,
                stroke: true,
                fill: true
            }
        };
        this.add.text(centerX, playButton.y + 75, "Controls:", { ...controlsStyle, font: "bold 40px Verdana" }).setOrigin(0.5);
        this.add.text(centerX, playButton.y + 125, "- WASD to move the camera", controlsStyle).setOrigin(0.5);
        this.add.text(centerX, playButton.y + 160, "- Q and E to control zoom", controlsStyle).setOrigin(0.5);
        this.add.text(centerX, playButton.y + 212, "- Right click to rotate building\nbefore placement", controlsStyle).setOrigin(0.5);
    }
}
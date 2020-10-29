import * as audio from '../state/AudioState';

// Starting scene
export class TitleScene extends Phaser.Scene {
    constructor() {
        super({
            key: "TitleScene"
        });
    }

    create() {
        // Add shadow to make text easier to read
        let shadowBox = this.add.graphics();
        shadowBox.fillStyle(0x4287f5, 0.5);
        shadowBox.fillRect(0, 0, this.game.renderer.width, this.game.renderer.height);

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
        this.playButtonTexture = "playButton";
        this.playButton = this.add.image(centerX, centerY + 75, "playButton").setScale(1.5);
        this.configureButton("playButton");

        // Controls
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
        this.add.text(centerX, this.playButton.y + 75, "Controls:", { ...controlsStyle, font: "bold 40px Verdana" }).setOrigin(0.5);
        this.add.text(centerX, this.playButton.y + 115, "- Left click to earn cash", controlsStyle).setOrigin(0.5);
        this.add.text(centerX, this.playButton.y + 155, "- Right click to rotate buildings", controlsStyle).setOrigin(0.5);
        this.add.text(centerX, this.playButton.y + 195, "- WASD to move the camera", controlsStyle).setOrigin(0.5);
        this.add.text(centerX, this.playButton.y + 235, "- Q and E to control zoom", controlsStyle).setOrigin(0.5);

        // Audio control buttons
        this.currentMusicButtonTexture = this.getMusicButtonTexture();
        this.musicControlButton = this.add.image(5, this.game.renderer.height - 60, this.currentMusicButtonTexture).setOrigin(0, 1);
        this.configureButton("musicControlButton", "currentMusicButtonTexture");

        this.currentSoundButtonTexture = this.getSoundButtonTexture();
        this.soundControlButton = this.add.image(5, this.game.renderer.height - 5, this.currentSoundButtonTexture).setOrigin(0, 1);
        this.configureButton("soundControlButton", "currentSoundButtonTexture");

        // Credits
        let creditsStyle = { 
            font: "16px Verdana",
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
        this.add.text(this.game.renderer.width - 115, this.game.renderer.height - 80, "Game assets from Kenney:\nwww.kenney.nl", creditsStyle).setOrigin(0.5);
        this.add.text(this.game.renderer.width - 115, this.game.renderer.height - 40, "Music by Eric Matyas:\nwww.soundimage.org", creditsStyle).setOrigin(0.5);
    }

    getMusicButtonTexture() {
        return audio.isMusicEnabled() ? "musicOnButton" : "musicOffButton";
    }

    getSoundButtonTexture() {
        return audio.isSoundEnabled() ? "soundOnButton" : "soundOffButton";
    }

    configureButton(buttonName, textureVarName) {
        let texture = buttonName;
        if (textureVarName) {
            texture = this[textureVarName];
        }
        this[buttonName].setInteractive();
        this[buttonName].on('pointerout', () => {
            this[buttonName].setTexture(texture); 
            this.selectedButton = null;
        });
        this[buttonName].on('pointerdown', () => {
            this[buttonName].setTexture(texture + "Down");
            this.selectedButton = buttonName;
            audio.playSound(this, 'buttonClick');
        });
        this[buttonName].on('pointerup', () => {
            if (this.selectedButton === buttonName) {
                this.handleButtonClick(this.selectedButton);
            }
            if (textureVarName) {
                texture = this[textureVarName];
            }
            this[buttonName].setTexture(texture);
            this.selectedButton = null;
        });
    }

    handleButtonClick(buttonName) {
        switch (buttonName) {
            case "playButton":
                // Start game
                this.scene.start("MapScene")
                          .start("UIScene")
                          .stop();
                break;
            case "musicControlButton":
                // Toggle music
                audio.setMusicEnabled(!audio.isMusicEnabled());
                this.currentMusicButtonTexture = this.getMusicButtonTexture();
                break;
            case "soundControlButton":
                // Toggle sound
                audio.setSoundEnabled(!audio.isSoundEnabled());
                this.currentSoundButtonTexture = this.getSoundButtonTexture();
                break;
        }
    }
}
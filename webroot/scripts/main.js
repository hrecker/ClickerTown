/** @type {import("../../typings/phaser")}*/

import { MapScene } from "./scenes/MapScene";

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [
        MapScene
    ]
};

var game = new Phaser.Game(config);

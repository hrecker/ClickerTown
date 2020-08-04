/** @type {import("../../typings/phaser")}*/

import { MapScene } from "./scenes/MapScene";
import { UIScene } from "./scenes/UIScene";

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [
        MapScene,
        UIScene
    ]
};

var game = new Phaser.Game(config);

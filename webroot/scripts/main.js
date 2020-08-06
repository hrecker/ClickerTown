/** @type {import("../../typings/phaser")}*/

import { MapScene } from "./scenes/MapScene";
import { UIScene } from "./scenes/UIScene";

var config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 750,
    scene: [
        MapScene,
        UIScene
    ]
};

var game = new Phaser.Game(config);

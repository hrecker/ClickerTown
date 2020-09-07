/** @type {import("../../typings/phaser")}*/

import { LoadingScene } from "./scenes/LoadingScene";
import { BackgroundScene } from "./scenes/BackgroundScene";
import { MapScene } from "./scenes/MapScene";
import { UIScene } from "./scenes/UIScene";

var config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 740,
    physics: {
        default: 'arcade'
    },
    scene: [
        LoadingScene,
        BackgroundScene,
        MapScene,
        UIScene
    ]
};

new Phaser.Game(config);

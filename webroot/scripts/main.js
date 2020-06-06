/** @type {import("../typings/phaser)} */

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

function preload ()
{
    this.load.image('star', 'assets/star.png');
}

function create ()
{
    this.add.image(400, 300, 'star');
    this.add.text(16, 16, 'Hello world', { fontSize: '32px', fill: '#FFFF' });
}

function update ()
{
}
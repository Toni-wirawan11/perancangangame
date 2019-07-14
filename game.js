let game;
let sfxLompat;
let musikLatar;
let timer;
let score;
let scoreText;
let namaText;

let gameOverText;
let respawnText;
let timerSpawn;
let isGameOver;

// global game options
let gameOptions = {
    platformStartSpeed: 350,
    spawnRange: [100, 350],
    platformSizeRange: [50, 250],
    playerGravity: 900,
    jumpForce: 400,
    playerStartPosition: 200,
    jumps: 10,
}

window.onload = function() {

    // object containing configuration options
    let gameConfig = {
        type: Phaser.AUTO,
        width: 1100,
        height: 750,
        scene: playGame,
        backgroundColor: '#003366',

        // physics settings
        physics: {
            default: "arcade"
        }
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
    resize();
    window.addEventListener("resize", resize, false);
}



// playGame scene
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
    preload(){
        this.load.image("platform", "platform.png");
        this.load.image('latar', 'darkbg.jpg'); // latar
        this.load.image('mountains-back','mountains-back.png');
        this.load.image('mountains-mid1','mountains-mid1.png');
        this.load.image('images','images.png');
        this.load.audio('lompat', 'jump.mp3'); // tambahan
        this.load.audio('musik', 'TrapAShamaluevMusic.mp3'); // tambahanTrap
        this.load.spritesheet('player', 'run.png', { frameWidth: 100, frameHeight: 100 }); 
    }
    
    create(){
        // siapkan latar paralax
        
        this.mountainsBack = this.add.tileSprite(650, 375, 2048, 894, 'mountains-back');
        this.mountainsMid1 = this.add.tileSprite(650, 400, 2048, 770, 'mountains-mid1');
        this.mountainsMid2 = this.add.tileSprite(550, 730, 2048, 278, 'images');
             
        
        // siapkan audio
        musikLatar = this.sound.add('musik', { loop: true })
        sfxLompat = this.sound.add('lompat')
        
        // siapkan timer (untuk mencatat skor)
        timer = this.time.addEvent({
			delay: 5,                // ms			
			loop: true
		});
        
        // siapkan teks score
        scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#fff' });
        
        // group with all active platforms.
        this.platformGroup = this.add.group({

            // once a platform is removed, it's added to the pool
            removeCallback: function(platform){
                platform.scene.platformPool.add(platform)
            }
        });

        // pool
        this.platformPool = this.add.group({

            // once a platform is removed from the pool, it's added to the active platforms group
            removeCallback: function(platform){
                platform.scene.platformGroup.add(platform)
            }
        });

        // number of consecutive jumps made by the player
        this.playerJumps = 0;

        // adding a platform to the game, the arguments are platform width and x position
        this.addPlatform(game.config.width, game.config.width / 2);

        // adding the player;
        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, game.config.height / 2, "player");
        this.player.setGravityY(gameOptions.playerGravity);
        
        // start playing background music
        musikLatar.play()

        // setting collisions between the player and the platform group
        this.physics.add.collider(this.player, this.platformGroup);

        // checking for input
        this.input.on("pointerdown", this.jump, this);

        // animasi
        this.anims.create({
            key: 'd',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 7 }),
            frameRate: 3,
            repeat: -1
        });
        this.anims.create({
            key: 'j',
            frames: this.anims.generateFrameNumbers('player', { start: 3, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
    }

    // the core of the script: platform are added from the pool or created on the fly
    addPlatform(platformWidth, posX){
        let platform;
        if(this.platformPool.getLength()){
            platform = this.platformPool.getFirst();
            platform.x = posX;
            platform.active = true;
            platform.visible = true;
            this.platformPool.remove(platform);
        }
        else{
            platform = this.physics.add.sprite(posX, game.config.height * 0.8, "platform");
            platform.setImmovable(true);
            platform.setVelocityX(gameOptions.platformStartSpeed * -1);
            this.platformGroup.add(platform);
        }
        platform.displayWidth = platformWidth;
        this.nextPlatformDistance = Phaser.Math.Between(gameOptions.spawnRange[0], gameOptions.spawnRange[1]);
    }

    // the player jumps when on the ground, or once in the air as long as there are jumps left and the first jump was on the ground
    jump(){
        if(this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps)){
            if(this.player.body.touching.down){
                this.playerJumps = 0;
            }
            this.player.setVelocityY(gameOptions.jumpForce * -1);
            this.playerJumps ++;
        }
    }
    update(){
		// Catat skor
		score = Math.round(timer.getElapsedSeconds());
        scoreText.setText('Jumlah Skor anda coy: ' + score);
		// Gerakkan latar
		this.mountainsBack.tilePositionX += 0.05;
        this.mountainsMid1.tilePositionX += 0.3;
        this.mountainsMid2.tilePositionX += 0.75;   
        // game over
        if(this.player.y > game.config.height){
			if (!isGameOver) {
				this.gameOver()
			} else {
				let t = Math.round(timerSpawn.getElapsedSeconds());
				let timeLeft = 6 - t;		
				if (timeLeft<=5) respawnText.setText(timeLeft);
				console.log('restarting in: '+timeLeft);
				if (timeLeft == 0) {
					this.restartGame();
				}
			} 
			
        }
        this.player.x = gameOptions.playerStartPosition;

        // animate player
        if(this.player.body.touching.down) {
            this.player.anims.play('d', true);
        } else {
			sfxLompat.play()
            this.player.anims.play('j', true);
        }
        // recycling platforms
        let minDistance = game.config.width;
        this.platformGroup.getChildren().forEach(function(platform){
            let platformDistance = game.config.width - platform.x - platform.displayWidth / 2;
            minDistance = Math.min(minDistance, platformDistance);
            if(platform.x < - platform.displayWidth / 2){
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);

        // adding new platforms
        if(minDistance > this.nextPlatformDistance){
            var nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1]);
            this.addPlatform(nextPlatformWidth, game.config.width + nextPlatformWidth / 2);
        }
    }
    gameOver(){
		isGameOver = true;
		scoreText.setText('');
		musikLatar.stop();
		gameOverText = this.make.text({
			x: game.config.width/2,
			y: game.config.height/2-50,
			text: 'GAME OVER',
			origin: { x: 0.5, y: 0.5 },
			style: {
				font: 'bold 55px Arial',
				fill: 'white',
				wordWrap: { width: 600 }
			}
		});
		respawnText = this.make.text({
			x: game.config.width/2,
			y: game.config.height/2+100,
			text: 'restart in',
			origin: { x: 0.5, y: 0.5 },
			style: {
				font: 'bold 70px Arial',
				fill: 'white',
				wordWrap: { width: 600 }
			}
		});
		timer.remove();
		timerSpawn = this.time.addEvent({
			delay: 8500,                // ms			
			loop: true			
		});
	}
	
	restartGame(){
		console.log('restarting');
		isGameOver = false;
		respawnText.setText('');
		// this.scene.stop();
		this.scene.start("PlayGame");
	}
    
};


function resize(){
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}

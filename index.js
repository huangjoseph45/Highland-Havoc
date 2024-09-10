const config = {
  windowWidth: document.body.offsetWidth,
  scoreBreakPoint: 50,
  deltaScore: 10,
  floorHeight: 95,
  obstacleSpawnTimer: 1, //seconds
  animationSpeed: 0.07,
  Sprite: {
    velocityX: 550,
    spriteHeight: 50,
    spriteWidth: 50,
    spriteStartX: window.screen.width,
  },
  Player: {
    animationSpeed: 0.09,
    playerHeight: 60,
    playerWidth: 50,
    positionX: 200,
    gravity: 0.7,
    jumpHeight: 16,
  },
};

window.addEventListener("load", () => {
  const title = document.querySelector(".title");
  const startButton = document.querySelector(".start-button");

  const startElements = [title, startButton];

  startButton.addEventListener("click", () => {
    runGame();
    startElements.forEach((element) => {
      element.style.display = "none";
    });
  });

  function runGame() {
    let score = 0;
    let requestId;
    let gameOverCondition = false;

    class InputHandler {
      keys = [];
      constructor() {
        window.addEventListener("keydown", (e) => {
          if (e.key === "ArrowUp" && this.keys.indexOf(e.key) === -1) {
            this.keys.push(e.key);
          }
        });

        window.addEventListener("keyup", (e) => {
          if (this.keys.indexOf(e.key) !== -1) {
            this.keys.splice(this.keys.indexOf(e.key), 1);
          }
        });
      }

      getKeys() {
        return this.keys;
      }
    }

    class Sprite {
      static idCounter = 0;
      static spriteList = [];
      static cloudList = [];

      spriteWidth;
      spriteHeight;
      spriteObject;
      id;
      velocityX;
      positionX;
      positionY;

      constructor(spriteWidth, spriteHeight, spritePositionY) {
        this.spriteHeight = spriteHeight;
        this.spriteWidth = spriteWidth;
        this.positionX = config.Sprite.spriteStartX;
        this.positionY = spritePositionY;
        this.velocityX = config.Sprite.velocityX;
        this.scoreable = true;
        this.goingUp = true;
        this.animationSpeed = Math.random() + 0.5;
        this.type = "sprite";

        this.spriteObject = document.createElement("span");
        this.spriteObject.className = "obstacle-ground";
        this.id = `sprite-${Sprite.idCounter++}`;
        this.spriteObject.id = this.id;

        this.spriteObject.style.bottom = `${this.positionY}px`;
        this.spriteObject.style.left = `${this.positionX}px`;
        this.spriteObject.style.height = `${this.spriteHeight}px`;
        this.spriteObject.style.width = `${this.spriteWidth}px`;

        document
          .querySelector(".obstacles-container")
          .appendChild(this.spriteObject);
      }

      update(deltaTime, currTime) {
        this.spriteObject.style.height = `${this.spriteHeight}px`;

        this.positionX -= this.velocityX * deltaTime;

        this.spriteObject.style.bottom = `${this.positionY}px`;
        this.spriteObject.style.left = `${this.positionX}px`;

        if (this.projectile === "ice" && currTime > this.previousTime + 0.07) {
          this.previousTime = currTime;

          if (this.iceCounter === 10) {
            this.spriteObject.style.backgroundImage =
              "url('assets/ice-projectile/ice-repeat/VFX 1 Repeatable10.png')";
            this.iceCounter = 1;
          } else {
            this.spriteObject.style.backgroundImage = `url('assets/ice-projectile/ice-repeat/VFX 1 Repeatable${this.iceCounter}.png')`;
            this.iceCounter += 1;
          }
        }

        if (
          this.projectile === "rockAttack" &&
          currTime > this.previousTime + config.animationSpeed
        ) {
          if (this.boulderCounter < 7) {
            this.animationSpeed = this.initialHeight / 6;
          } else {
            this.animationSpeed = this.initialHeight / -6;
          }

          this.previousTime = currTime;

          if (this.boulderCounter === 13) {
            this.spriteObject.style.backgroundImage =
              "url('assets/rock-projectile/rock-attack13.png')";
            this.boulderCounter = 1;
            this.previousTime += 0.7;
          } else {
            this.spriteObject.style.backgroundImage = `url('assets/rock-projectile/rock-attack${this.boulderCounter}.png')`;
            this.boulderCounter += 1;
          }
          this.spriteHeight += this.animationSpeed;
        }

        if (this.positionX <= -this.spriteWidth) {
          const elementToRemove = document.getElementById(this.id);
          if (elementToRemove) {
            elementToRemove.remove();
            if (this.type === "sprite") {
              Sprite.spriteList.splice(elementToRemove, 1);
            } else if (this.type === "cloud") {
              if (this.type === "sprite") {
                Sprite.cloudList.splice(elementToRemove, 1);
              }
            }
          }
        }
      }

      swirlingAnimation() {
        this.swirling = true;
      }

      iceProjectile() {
        this.type = "sprite";
        this.projectile = "ice";
        this.iceCounter = 1;
        this.previousTime = 0;

        this.animationIce = true;
        this.spriteObject.style.backgroundImage =
          "url('assets/ice-projectile/start1.png')";
        this.spriteObject.style.backgroundColor = "transparent";
        this.spriteObject.style.backgroundSize = "cover";
        this.spriteObject.style.backgroundPosition = "center";
        this.spriteObject.style.transform = "scaleX(-1)";
      }

      rockAttack() {
        this.type = "sprite";
        this.projectile = "rockAttack";
        this.boulderCounter = 1;
        this.previousTime = 0;
        this.animationRock = true;
        this.initialHeight = config.Sprite.spriteHeight * 1.6;

        this.spriteObject.style.backgroundColor = "transparent";
        this.spriteObject.style.backgroundImage = `url("assets/rock-projectile/rock-attack1.png")`;
        this.spriteObject.style.backgroundSize = "cover";
        this.spriteObject.style.backgroundRepeat = "no-repeat";
        this.spriteObject.style.backgroundPosition = "bottom";
      }

      pillar() {
        this.type = "sprite";
        this.projectile = "pillar";

        this.spriteObject.style.backgroundColor = "transparent";
        this.spriteObject.style.backgroundImage = `url("assets/pillar.png")`;
        this.spriteObject.style.backgroundSize = "cover";
        this.spriteObject.style.backgroundPosition = "center";
      }

      boulder() {
        this.type = "sprite";
        this.projectile = "boulder";

        this.spriteObject.style.backgroundColor = "transparent";
        this.spriteObject.style.backgroundImage = `url("assets/boulder-1.png")`;
        this.spriteObject.style.backgroundSize = "cover";
        this.spriteObject.style.backgroundPosition = "center";
      }

      cloud(positionX, positionY) {
        this.type = "cloud";
        this.positionX = positionX;
        this.positionY = positionY;
        this.velocityX = 50;
        this.spriteObject.style.backgroundColor = "transparent";
        this.spriteObject.style.backgroundImage = `url('assets/cloud-${Math.ceil(
          Math.random() * 3
        )}.png')`;
        this.spriteObject.style.backgroundSize = "cover";
        this.spriteObject.style.backgroundPosition = "center";
      }
    }

    class Player extends Sprite {
      velocityY = 0;
      jumpHeight = config.Player.jumpHeight;
      gravity = config.Player.gravity;

      constructor(spriteWidth, spriteHeight) {
        super(spriteWidth, spriteHeight);
        this.positionX = config.Player.positionX;
        this.positionY = config.floorHeight;
        this.spriteHeight = config.Player.playerHeight;
        this.spriteWidth = config.Player.playerWidth;
        this.currTime = 0;
        this.frameCounter = 0;

        this.playerObject = document.createElement("span");

        this.playerObject.id = "player";
        this.playerObject.style.left = `${this.positionX}px`;
        this.playerObject.style.bottom = `${this.positionY}px`;
        this.playerObject.style.height = `${this.spriteHeight}px`;
        this.playerObject.style.width = `${this.spriteWidth}px`;
        this.playerObject.style.backgroundColor = "transparent";
        this.playerObject.style.backgroundSize = "cover";
        this.playerObject.style.backgroundRepeat = "no-repeat";
        this.playerObject.style.backgroundPosition = "center";
        document.querySelector(".game-window").appendChild(this.playerObject);
      }

      update(input, deltaTime, currTime) {
        if (this.positionY !== config.floorHeight) {
          if (this.positionY < config.floorHeight) {
            this.positionY = config.floorHeight;
            this.velocityY = 0;
          }
        }

        if (this.positionY >= config.floorHeight + 20) {
          this.playerObject.style.backgroundImage = `url("assets/player/jump/jump.png")`;
          this.frameCounter = 0;
        } else if (this.currTime + config.Player.animationSpeed < currTime) {
          this.currTime = currTime;
          if (this.frameCounter >= 8) {
            this.frameCounter = 0;
          }
          this.frameCounter++;
          this.playerObject.style.backgroundImage = `url("assets/player/run/run${this.frameCounter}.png")`;
        }

        if (
          input.getKeys().indexOf("ArrowUp") !== -1 && //jumping
          this.positionY === config.floorHeight &&
          !pauseState
        ) {
          this.velocityY += this.jumpHeight;
        }
        this.positionY += this.velocityY;
        this.velocityY -= this.gravity;
        console.log(this.velocityY);

        this.playerObject.style.left = `${this.positionX}px`;
        this.playerObject.style.bottom = `${this.positionY}px`;
      }

      playerDeath() {
        this.startTime = this.currTime;

        this.playerObject.style.backgroundSize = "cover";
        this.playerObject.style.backgroundPosition = "center";
        this.playerObject.style.border = "none";
        this.dead = true;

        const player = this.playerObject;

        let animStep = 0;
        let deathId;
        let time;

        function step(timestamp) {
          if (timestamp > 70 + time) {
            time = timestamp;
            player.style.backgroundImage = `url('assets/blood/B10${animStep}.png')`;
            animStep += 1;
          }

          if (animStep <= 2) {
            deathId = requestAnimationFrame(step);
          } else {
            cancelAnimationFrame(deathId);
          }
        }
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            this.playerObject.style.backgroundImage = `url('assets/blood/B10${i}.png')`;
          }, 7000);
        }
        requestAnimationFrame(step);
        time = performance.now();
      }
    }

    function shiftGround(deltaTime) {
      const ground = document.querySelector(".ground");

      let groundPosition =
        parseInt(window.getComputedStyle(ground).getPropertyValue("left")) -
        config.Sprite.velocityX * deltaTime;
      if (
        parseInt(window.getComputedStyle(ground).getPropertyValue("width")) *
          -0.5 >
        parseInt(window.getComputedStyle(ground).getPropertyValue("left"))
      ) {
        groundPosition = 0;
      }
      ground.style.left = `${groundPosition}px`;
    }

    const playerObject = document.querySelector("#player"); // initiialize Player element
    const player = new Player(20, 20, playerObject); // initiialize Player class
    const input = new InputHandler(); // initiialize Player inputs

    function updateScore() {
      const scoreboard = document.querySelector(".score");
      scoreboard.style.left = `${
        config.windowWidth / 2 - scoreboard.offsetWidth / 2
      }px`;
      scoreboard.innerText = score;
    }

    let pauseState = false;

    function checkCollision(spriteList, player) {
      spriteList.forEach((sprite) => {
        if (
          player.positionX < sprite.positionX + sprite.spriteWidth &&
          player.positionX + player.spriteWidth > sprite.positionX &&
          player.positionY < sprite.positionY + sprite.spriteHeight &&
          player.positionY + player.spriteHeight > sprite.positionY
        ) {
          // Collision detected between player and sprite
          console.log("Collision detected!");
          gameOver();

          pauseState = true;

          // Handle the collision (e.g., stop movement, apply bounce, etc.)
        }

        if (sprite.positionX < player.positionX && sprite.scoreable) {
          score += config.deltaScore;
          sprite.scoreable = false;
        }
      });
    }

    function spawnCloud(cloudX, cloudY) {
      const newCloud = new Sprite(200, 100, cloudY);
      newCloud.cloud(cloudX);
      Sprite.cloudList.push(newCloud);
    }

    for (let i = 0; i < Math.random() * 4; i++) {
      spawnCloud(
        Math.random() * config.windowWidth,
        document.body.offsetHeight -
          Math.random() * document.body.offsetHeight * 0.5
      );
    }

    function pausing(pauseState) {
      const pauseButton = document.querySelector("#pause-button");
      const scoreboard = document.querySelector(".score");
      scoreboard.style.top = `${document.body.offsetHeight / 5}px`;

      if (pauseState) {
        pauseButton.style.display = "inline-block";
        pauseButton.style.top = `${
          document.body.offsetHeight / 2 -
          pauseButton.offsetHeight -
          config.floorHeight / 2
        }px`;
        pauseButton.style.left = `${
          config.windowWidth / 2 - pauseButton.offsetWidth / 2
        }px`;

        scoreboard.style.top = `${
          document.body.offsetHeight / 2 - config.floorHeight / 2
        }px`;
      } else {
        pauseButton.style.display = "none";
      }
    }

    function gameOver() {
      if (requestId) {
        cancelAnimationFrame(requestId);
        requestId = null;
      }
      gameOverCondition = true;
      player.playerDeath();
    }

    function animate() {
      const scoreboard = document.querySelector(".score");
      console.log(scoreboard);
      scoreboard.style.top = `${document.body.offsetHeight / 5}px`;

      scoreboard.style.removeProperty("display");
      scoreboard.style.display = "flex";
      scoreboard.style;

      spawnCloud(
        config.windowWidth,
        Math.random() * 350 + config.floorHeight + 300
      );
      window.addEventListener("visibilitychange", () => {
        //pause on lost focus
        pauseState = !pauseState;
      });

      let lastTime = 0;
      let secondTimer = 0;
      let cloudTimer = 0;
      let totalTime = 0;

      function gameLoop(timestamp) {
        checkCollision(Sprite.spriteList, player);
        if (pauseState) {
          cancelAnimationFrame(requestId);
        } //pause
        updateScore();

        if (!lastTime) {
          lastTime = timestamp;
        }

        const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;
        secondTimer += deltaTime;
        cloudTimer += deltaTime;
        totalTime += deltaTime;
        let newSprite;

        if (secondTimer > 1) {
          window.addEventListener("click", () => {
            //pause on click
            if (pauseState === false) {
              pauseState = true;
            } else if (pauseState && !gameOverCondition) {
              pauseState = false;
              requestId = requestAnimationFrame(gameLoop);
            }
            pausing(pauseState);
          });
        }

        if (cloudTimer > Math.random() * 50 + 10) {
          spawnCloud(
            document.body.offsetWidth,
            Math.random() * 350 + config.floorHeight + 300
          );
          cloudTimer = 0;
        }
        if (secondTimer > config.obstacleSpawnTimer) {
          //obstacle spawning. pausing functionality
          const which = Math.random() * 100;
          if (score < 10) {
            //choosing enemy spawns
            newSprite = new Sprite(
              config.Sprite.spriteWidth,
              config.Sprite.spriteHeight,
              config.floorHeight
            );
            newSprite.boulder();
          } else {
            config.obstacleSpawnTimer = 0.3 + Math.random() * 0.7;
            if (which < 20) {
              newSprite = new Sprite(
                config.Sprite.spriteWidth,
                2 * config.Sprite.spriteHeight,
                config.Player.playerHeight + config.floorHeight
              );
            } else if (which > 20 && which < 40) {
              newSprite = new Sprite(
                config.Sprite.spriteWidth,
                1.6 * config.Sprite.spriteHeight,
                config.floorHeight
              );
              newSprite.pillar();
            } else if (which > 40 && which < 60) {
              newSprite = new Sprite(
                config.Sprite.spriteWidth * 1.2,
                config.Sprite.spriteHeight * 0.36,
                config.floorHeight
              );
              newSprite.swirlingAnimation();
              newSprite.rockAttack();
            } else if (which > 60 && which < 75) {
              newSprite = new Sprite(
                config.Sprite.spriteWidth * 1.2,
                config.Sprite.spriteHeight * 0.7,
                config.floorHeight + config.Player.playerHeight
              );
              newSprite.iceProjectile();
            } else {
              if (which > 90) {
                newSprite = new Sprite(
                  config.Sprite.spriteWidth * 1.2,
                  config.Sprite.spriteHeight * 0.6,
                  config.floorHeight
                );
                newSprite.iceProjectile();
              } else {
                newSprite = new Sprite(
                  config.Sprite.spriteWidth,
                  config.Sprite.spriteHeight,
                  config.floorHeight
                );
                newSprite.boulder();
              }
            }
          }
          Sprite.spriteList.push(newSprite);
          secondTimer = 0;
        }
        shiftGround(deltaTime);
        player.update(input, deltaTime, totalTime);
        Sprite.spriteList.forEach((sprite) =>
          sprite.update(deltaTime, totalTime)
        );
        Sprite.cloudList.forEach((cloud) => cloud.update(deltaTime, totalTime));
        if (!gameOverCondition && !pauseState) {
          requestId = requestAnimationFrame(gameLoop);
        }
      }

      const firstSprite = new Sprite(
        config.Sprite.spriteWidth,
        config.Sprite.spriteHeight,
        config.floorHeight
      );
      firstSprite.boulder();
      Sprite.spriteList.push(firstSprite);

      requestId = requestAnimationFrame(gameLoop);
    }
    animate();
  }
});

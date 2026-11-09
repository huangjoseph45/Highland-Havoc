const config = {
  windowWidth: document.body.offsetWidth,
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

const BEST_SCORE_KEY = "highland-havoc-best";

function getBestScore() {
  return Number(window.localStorage.getItem(BEST_SCORE_KEY) || 0);
}

function saveBestScore(score) {
  window.localStorage.setItem(BEST_SCORE_KEY, String(score));
}

window.addEventListener("load", () => {
  const startButton = document.querySelector(".start-button");
  const playAgainButton = document.querySelector(".play-again-button");
  const gameOverScreen = document.querySelector(".game-over");

  // The teardown for the current run: removes its window listeners and
  // cancels its animation frame. Reassigned by each runGame() call.
  let destroyGame = null;

  const showBest = (selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.innerText = `Best: ${getBestScore()}`;
    });
  };
  showBest(".start-screen__best");

  startButton.addEventListener("click", () => {
    startButton.blur();
    runGame();
    document.querySelector(".start-screen").style.display = "none";
  });

  playAgainButton.addEventListener("click", () => {
    playAgainButton.blur();
    // Clear the previous run's sprites and player from the DOM; the new
    // runGame() builds fresh ones (and fresh static sprite lists).
    if (destroyGame) destroyGame();
    document
      .querySelectorAll("#player, .obstacle-ground")
      .forEach((element) => element.remove());
    gameOverScreen.style.display = "none";
    runGame();
  });

  function runGame() {
    let score = 0;
    let requestId;
    let gameOverCondition = false;
    let pauseState = false;
    // The spawn interval is mutated as the score grows; a fresh run
    // starts from the opening pace again.
    config.obstacleSpawnTimer = 1;

    class InputHandler {
      keys = [];
      constructor() {
        this.onKeyDown = (e) => {
          // Space would re-activate the focused START / PLAY AGAIN button.
          if (e.code === "Space") e.preventDefault();
          if (this.isJumpKey(e) && this.keys.indexOf("Jump") === -1) {
            this.keys.push("Jump");
          }
        };

        this.onKeyUp = (e) => {
          if (this.isJumpKey(e) && this.keys.indexOf("Jump") !== -1) {
            this.keys.splice(this.keys.indexOf("Jump"), 1);
          }
        };

        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
      }

      isJumpKey(e) {
        return e.key === "ArrowUp" || e.code === "Space" || e.code === "KeyW";
      }

      destroy() {
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
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
          }
          // Remove this sprite from its list by identity. Splicing by
          // the DOM element (or by a guessed index) removed the wrong
          // entry and leaked the off-screen one.
          if (this.type === "sprite") {
            const index = Sprite.spriteList.indexOf(this);
            if (index !== -1) Sprite.spriteList.splice(index, 1);
          } else if (this.type === "cloud") {
            const index = Sprite.cloudList.indexOf(this);
            if (index !== -1) Sprite.cloudList.splice(index, 1);
          }
        }
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

      constructor() {
        super(config.Player.playerWidth, config.Player.playerHeight);
        // Sprite's constructor creates an obstacle element for this
        // instance; the player renders its own element instead, so drop it.
        this.spriteObject.remove();
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
          input.getKeys().indexOf("Jump") !== -1 && //jumping
          this.positionY === config.floorHeight &&
          !pauseState
        ) {
          this.velocityY += this.jumpHeight;
        }
        this.positionY += this.velocityY;
        this.velocityY -= this.gravity;

        this.playerObject.style.left = `${this.positionX}px`;
        this.playerObject.style.bottom = `${this.positionY}px`;
      }

      playerDeath() {
        this.playerObject.style.backgroundSize = "cover";
        this.playerObject.style.backgroundPosition = "center";
        this.playerObject.style.border = "none";
        this.dead = true;

        const player = this.playerObject;

        // Play the three blood frames, one every 70ms, then stop.
        let animStep = 0;
        let lastFrameTime = performance.now();

        function step(timestamp) {
          if (timestamp - lastFrameTime > 70) {
            lastFrameTime = timestamp;
            player.style.backgroundImage = `url('assets/blood/B10${animStep}.png')`;
            animStep += 1;
          }

          if (animStep <= 2) {
            requestAnimationFrame(step);
          }
        }
        requestAnimationFrame(step);
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

    const player = new Player();
    const input = new InputHandler(); // initiialize Player inputs

    function updateScore() {
      const scoreboard = document.querySelector(".score");
      scoreboard.style.left = `${
        config.windowWidth / 2 - scoreboard.offsetWidth / 2
      }px`;
      scoreboard.innerText = score;
    }

    function checkCollision(spriteList, player) {
      spriteList.forEach((sprite) => {
        if (
          player.positionX < sprite.positionX + sprite.spriteWidth &&
          player.positionX + player.spriteWidth > sprite.positionX &&
          player.positionY < sprite.positionY + sprite.spriteHeight &&
          player.positionY + player.spriteHeight > sprite.positionY
        ) {
          // Collision detected between player and sprite
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
      newCloud.cloud(cloudX, cloudY);
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
      if (gameOverCondition) return;
      if (requestId) {
        cancelAnimationFrame(requestId);
        requestId = null;
      }
      gameOverCondition = true;
      player.playerDeath();

      const isNewBest = score > getBestScore();
      if (isNewBest) saveBestScore(score);
      document.querySelector(".final-score").innerText =
        `Score: ${score}${isNewBest ? " — new best!" : ""}`;
      showBest(".game-over__best");
      gameOverScreen.style.display = "flex";
      if (destroyGame) destroyGame();
    }

    function animate() {
      const scoreboard = document.querySelector(".score");
      scoreboard.style.top = `${document.body.offsetHeight / 5}px`;

      scoreboard.style.removeProperty("display");
      scoreboard.style.display = "flex";

      spawnCloud(
        config.windowWidth,
        Math.random() * 350 + config.floorHeight + 300
      );

      // Pause controls, registered once per run (not once per frame):
      // click anywhere, P / Escape, or hiding the tab. Tab-hide only
      // pauses; it never resumes on its own. Button clicks are ignored
      // so PLAY AGAIN doesn't instantly re-pause the new run.
      function setPaused(value) {
        if (gameOverCondition) return;
        if (value === pauseState) return;
        pauseState = value;
        pausing(pauseState);
        if (pauseState) {
          if (requestId) {
            cancelAnimationFrame(requestId);
            requestId = null;
          }
        } else {
          requestId = requestAnimationFrame(gameLoop);
        }
      }

      function onPauseClick(e) {
        if (e.target.closest("button")) return;
        setPaused(!pauseState);
      }

      function onPauseKey(e) {
        if (e.key === "p" || e.key === "P" || e.key === "Escape") {
          setPaused(!pauseState);
        }
      }

      function onVisibilityChange() {
        if (document.hidden) setPaused(true);
      }

      window.addEventListener("click", onPauseClick);
      window.addEventListener("keydown", onPauseKey);
      document.addEventListener("visibilitychange", onVisibilityChange);
      destroyGame = () => {
        window.removeEventListener("click", onPauseClick);
        window.removeEventListener("keydown", onPauseKey);
        document.removeEventListener("visibilitychange", onVisibilityChange);
        input.destroy();
        if (requestId) {
          cancelAnimationFrame(requestId);
          requestId = null;
        }
      };

      let lastTime = 0;
      let secondTimer = 0;
      let cloudTimer = 0;
      let totalTime = 0;

      function gameLoop(timestamp) {
        if (pauseState) {
          requestId = null;
          return;
        }
        checkCollision(Sprite.spriteList, player);
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

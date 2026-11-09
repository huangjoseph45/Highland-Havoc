# Highland Havoc

A fast endless runner set in the Highlands. You are the runner: jump the
boulders, pillars, and ice the mountain throws at you, and see how far you
get. Every obstacle you clear is 10 points.

## Play

Open `index.html` in a browser (or serve the folder with any static server,
e.g. `python3 -m http.server`) and press **START**.

| Input | Does |
| --- | --- |
| Arrow Up, Space, or W | Jump |
| Click anywhere, P, or Escape | Pause / resume |
| Switching tabs | Auto-pauses (resume with a click or P) |

Your best score is saved in the browser and shown on the start screen. When
you die, the game-over screen shows your score and a **PLAY AGAIN** button
that starts a fresh run immediately.

## How it works

Plain HTML, CSS, and JavaScript — no build step, no dependencies. The game
loop runs on `requestAnimationFrame`; obstacles (boulders, pillars, rock
attacks, ice projectiles) spawn from the right and scroll left at 550 px/s
while the ground tiles beneath the player. The player cycles run frames on
the ground and a jump frame in the air, with a short blood-sprite death
animation on collision. Clouds drift by on their own timer.

Files:

- `index.html` — the game window, start screen, and game-over screen
- `index.css` — layout, title animation, and the LCD score font
- `index.js` — the whole game: input, sprites, player physics, spawning,
  collision, scoring, pause, and game over
- `assets/` — background, ground tile, player run/jump frames, boulder,
  pillar, rock/ice projectiles, clouds, blood frames
- `font/` — LCD Solid, the score font (public domain)

## Notes

- The score font is bundled locally (`font/LcdSolid-VPzB.ttf`); the title
  font (Jersey 10) loads from Google Fonts.
- Difficulty ramps once you pass 10 points: the spawn interval shortens and
  pillars, rock attacks, and ice projectiles join the boulders.

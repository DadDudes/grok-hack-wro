/* EduBotGames Phaser runtime. Three fixed templates: collect, runner, quiz.
   The spec in #game-spec is data. This file does not eval it. */
(function () {
  var FONT = 'system-ui, Segoe UI, sans-serif';
  var node = document.getElementById('game-spec');

  function fail(message) {
    var p = document.createElement('p');
    p.style.cssText = 'color:#fff;font-family:system-ui,sans-serif;padding:24px';
    p.textContent = message;
    document.body.appendChild(p);
  }

  if (!node) {
    fail('Nie udało się odczytać gry.');
    return;
  }

  var spec;
  try {
    spec = JSON.parse(node.textContent || '');
  } catch (error) {
    fail('Nie udało się odczytać gry.');
    return;
  }

  if (!window.Phaser) {
    fail('Nie udało się wczytać silnika gry (cdn.jsdelivr.net).');
    return;
  }

  function hex(value) {
    return parseInt(String(value).slice(1), 16);
  }

  function sceneKey(template) {
    if (template === 'runner' || template === 'quiz' || template === 'collect') return template;
    return 'collect';
  }

  function sameAnswer(a, b) {
    return String(a).trim().toLocaleLowerCase() === String(b).trim().toLocaleLowerCase();
  }

  function shuffle(items, seed) {
    var copy = items.slice();
    var state = (seed + 1) * 9973;
    for (var i = copy.length - 1; i > 0; i -= 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      var j = state % (i + 1);
      var swap = copy[i];
      copy[i] = copy[j];
      copy[j] = swap;
    }
    return copy;
  }

  function choicesFor(task, index, limit) {
    var pool = [task.answer].concat(task.distractors || []);
    var shuffled = shuffle(pool, index + 3);
    var sliced = shuffled.slice(0, limit);
    var hasAnswer = sliced.some(function (item) {
      return sameAnswer(item, task.answer);
    });
    if (!hasAnswer) sliced[0] = task.answer;
    return shuffle(sliced, index + 9);
  }

  function questionSize(spec) {
    if (spec.ageBand === 'young') return '30px';
    if (spec.ageBand === 'older') return '22px';
    return '26px';
  }

  function markReady() {
    window.__EDUBOT_READY = true;
    document.documentElement.dataset.gameReady = '1';
  }

  function focusGame(scene) {
    var canvas = scene.game.canvas;
    if (!canvas) return;
    canvas.setAttribute('tabindex', '0');
    canvas.focus();
  }

  function ensureTextures(scene, current) {
    if (!scene.textures.exists('character')) {
      var player = scene.make.graphics({ add: false });
      player.fillStyle(hex(current.theme.palette.player), 1);
      player.fillCircle(24, 26, 20);
      player.fillStyle(0xffffff, 1);
      player.fillCircle(17, 22, 3);
      player.fillCircle(31, 22, 3);
      player.fillStyle(0x102027, 1);
      player.fillCircle(17, 22, 1.4);
      player.fillCircle(31, 22, 1.4);
      player.generateTexture('character', 48, 48);
      player.destroy();
    }
    if (!scene.textures.exists('item')) {
      var item = scene.make.graphics({ add: false });
      item.fillStyle(hex(current.theme.palette.item), 1);
      item.fillCircle(20, 20, 16);
      item.fillStyle(0xffffff, 0.9);
      item.fillCircle(14, 14, 4);
      item.generateTexture('item', 40, 40);
      item.destroy();
    }
  }

  function drawBackdrop(scene, current) {
    if (scene.textures.exists('background')) {
      scene.add.image(480, 270, 'background').setDisplaySize(960, 540).setDepth(0);
    } else {
      scene.cameras.main.setBackgroundColor(current.theme.palette.background);
    }
    scene.add.rectangle(480, 512, 960, 80, hex(current.theme.palette.ground)).setDepth(1);
  }

  function drawHud(scene, current, task) {
    var plate = scene.add.graphics().setDepth(20);
    plate.fillStyle(0x102027, 0.82);
    plate.fillRoundedRect(16, 12, 928, 112, 18);
    scene.add
      .text(36, 24, current.theme.name, {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#d8f3dc',
      })
      .setDepth(21);
    var score = scene.registry.get('score') || 0;
    scene.add
      .text(908, 24, current.texts.score + ': ' + score + '/' + current.tasks.length, {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ffffff',
      })
      .setOrigin(1, 0)
      .setDepth(21);
    scene.add
      .text(480, 82, task.prompt, {
        fontFamily: FONT,
        fontSize: questionSize(current),
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 860 },
      })
      .setOrigin(0.5)
      .setDepth(21);
    if ((scene.registry.get('index') || 0) === 0) {
      scene.add
        .text(480, 142, current.instructions, {
          fontFamily: FONT,
          fontSize: '16px',
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: 840 },
          backgroundColor: '#102027',
          padding: { left: 8, right: 8, top: 4, bottom: 4 },
        })
        .setOrigin(0.5)
        .setDepth(21);
    }
  }

  function currentTask(scene) {
    var current = scene.registry.get('spec');
    var index = scene.registry.get('index') || 0;
    if (!current || index >= current.tasks.length) return null;
    return current.tasks[index];
  }

  function showBanner(scene, message, good) {
    if (scene.banner) scene.banner.destroy();
    scene.banner = scene.add
      .text(480, 176, message, {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 760 },
        backgroundColor: good ? '#2d6a4f' : '#9b2226',
        padding: { left: 14, right: 14, top: 8, bottom: 8 },
      })
      .setOrigin(0.5)
      .setDepth(45);
  }

  function finishRound(scene) {
    var current = scene.registry.get('spec');
    scene.registry.set('score', (scene.registry.get('score') || 0) + 1);
    scene.registry.set('index', (scene.registry.get('index') || 0) + 1);
    var index = scene.registry.get('index') || 0;
    if (index >= current.tasks.length) scene.scene.start('end');
    else scene.scene.restart();
  }

  function grade(scene, task, choice, onWrong) {
    if (scene.locked) return;
    scene.locked = true;
    var current = scene.registry.get('spec');
    var correct = sameAnswer(choice, task.answer);
    var message = correct ? current.texts.correct : current.texts.wrong + ' ' + task.explanation;
    showBanner(scene, message, correct);
    scene.time.delayedCall(correct ? 650 : 1100, function () {
      if (correct) {
        finishRound(scene);
        return;
      }
      if (onWrong) onWrong();
      scene.locked = false;
      if (scene.banner) scene.banner.destroy();
    });
  }

  function holdButton(scene, x, y, label) {
    var bg = scene.add
      .rectangle(x, y, 118, 64, 0x102027, 0.88)
      .setStrokeStyle(3, 0xffffff, 0.95)
      .setDepth(60)
      .setInteractive({ useHandCursor: true });
    scene.add
      .text(x, y, label, { fontFamily: FONT, fontSize: '20px', color: '#ffffff' })
      .setOrigin(0.5)
      .setDepth(61);
    var state = { held: false, just: false };
    bg.on('pointerdown', function () {
      state.just = !state.held;
      state.held = true;
    });
    var release = function () {
      state.held = false;
    };
    bg.on('pointerup', release);
    bg.on('pointerout', release);
    return state;
  }

  function bindKeys(scene) {
    var codes = Phaser.Input.Keyboard.KeyCodes;
    var keys = scene.input.keyboard.addKeys({
      left: codes.LEFT,
      right: codes.RIGHT,
      a: codes.A,
      d: codes.D,
      up: codes.UP,
      w: codes.W,
      space: codes.SPACE,
    });
    scene.input.keyboard.addCapture(['SPACE', 'UP', 'DOWN', 'LEFT', 'RIGHT']);
    return keys;
  }

  var Boot = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function Boot() {
      Phaser.Scene.call(this, 'boot');
    },
    init: function () {
      this.registry.set('spec', spec);
      this.registry.set('index', 0);
      this.registry.set('score', 0);
      this.registry.set('startedAt', Date.now());
    },
    preload: function () {
      var assets = spec.assets || {};
      this.load.crossOrigin = 'anonymous';
      if (assets.characterUrl) this.load.image('character', assets.characterUrl);
      if (assets.backgroundUrl) this.load.image('background', assets.backgroundUrl);
      if (assets.itemUrl) this.load.image('item', assets.itemUrl);
    },
    create: function () {
      this.scene.start(sceneKey(spec.template));
    },
  });

  var CollectScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function CollectScene() {
      Phaser.Scene.call(this, 'collect');
    },
    create: function () {
      var task = currentTask(this);
      var current = this.registry.get('spec');
      if (!task) {
        this.scene.start('end');
        return;
      }
      this.physics.world.gravity.y = 0;
      ensureTextures(this, current);
      drawBackdrop(this, current);
      drawHud(this, current, task);
      focusGame(this);
      this.locked = false;
      this.keys = bindKeys(this);
      this.leftButton = holdButton(this, 78, 492, current.texts.left);
      this.rightButton = holdButton(this, 210, 492, current.texts.right);

      this.player = this.physics.add.sprite(180, 400, 'character');
      this.player.setCollideWorldBounds(true);
      this.player.body.setAllowGravity(false);

      var choices = choicesFor(task, this.registry.get('index') || 0, 3);
      var scene = this;
      choices.forEach(function (choice, index) {
        var x = 250 + index * 230;
        var sprite = scene.physics.add.sprite(x, 300, 'item');
        sprite.body.setAllowGravity(false);
        sprite.body.setImmovable(true);
        scene.add
          .text(x, 352, choice, {
            fontFamily: FONT,
            fontSize: '22px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 200 },
            backgroundColor: '#102027',
            padding: { left: 6, right: 6, top: 4, bottom: 4 },
          })
          .setOrigin(0.5)
          .setDepth(5);
        scene.physics.add.overlap(scene.player, sprite, function () {
          grade(scene, task, choice);
        });
      });
      markReady();
    },
    update: function () {
      if (!this.player) return;
      var vx = 0;
      if (this.keys.left.isDown || this.keys.a.isDown || this.leftButton.held) vx = -280;
      else if (this.keys.right.isDown || this.keys.d.isDown || this.rightButton.held) vx = 280;
      else if (this.input.activePointer.isDown && this.input.activePointer.y < 460) {
        var dx = this.input.activePointer.worldX - this.player.x;
        if (Math.abs(dx) > 12) vx = Math.sign(dx) * 280;
      }
      this.player.setVelocity(vx, 0);
    },
  });

  var RunnerScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function RunnerScene() {
      Phaser.Scene.call(this, 'runner');
    },
    create: function () {
      var task = currentTask(this);
      var current = this.registry.get('spec');
      if (!task) {
        this.scene.start('end');
        return;
      }
      this.physics.world.gravity.y = 1100;
      this.physics.world.setBounds(0, 0, 960, 540);
      ensureTextures(this, current);
      drawBackdrop(this, current);
      drawHud(this, current, task);
      focusGame(this);
      this.locked = false;
      this.keys = bindKeys(this);
      this.leftButton = holdButton(this, 78, 492, current.texts.left);
      this.rightButton = holdButton(this, 210, 492, current.texts.right);
      this.jumpButton = holdButton(this, 860, 492, current.texts.jump);

      var spots = [
        { x: 400, y: 430 },
        { x: 620, y: 375 },
        { x: 840, y: 325 },
      ];
      var mountains = this.add.graphics().setDepth(2);
      mountains.fillStyle(hex(current.theme.palette.ground), 1);
      spots.forEach(function (spot) {
        mountains.fillTriangle(spot.x - 120, 472, spot.x + 120, 472, spot.x, spot.y - 36);
      });

      var ground = this.add.rectangle(480, 520, 960, 48, hex(current.theme.palette.ground));
      this.physics.add.existing(ground, true);

      this.player = this.physics.add.sprite(150, 360, 'character');
      this.player.setCollideWorldBounds(true);
      this.player.setBounce(0);
      this.spawn = { x: 150, y: 360 };

      var blocks = [];
      var scene = this;
      var choices = choicesFor(task, this.registry.get('index') || 0, 3);
      spots.forEach(function (spot, index) {
        var block = scene.add.rectangle(spot.x, spot.y, 150, 22, hex(current.theme.palette.accent)).setDepth(3);
        scene.physics.add.existing(block, true);
        blocks.push(block);
        var choice = choices[index];
        scene.add
          .text(spot.x, spot.y - 46, choice, {
            fontFamily: FONT,
            fontSize: '20px',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: 160 },
            backgroundColor: '#102027',
            padding: { left: 6, right: 6, top: 3, bottom: 3 },
          })
          .setOrigin(0.5)
          .setDepth(6);
        var zone = scene.add.zone(spot.x, spot.y - 24, 130, 36);
        scene.physics.add.existing(zone);
        zone.body.setAllowGravity(false);
        zone.body.setImmovable(true);
        scene.physics.add.overlap(scene.player, zone, function () {
          var body = scene.player.body;
          if (!body.blocked.down && !body.touching.down) return;
          grade(scene, task, choice, function () {
            scene.player.setPosition(scene.spawn.x, scene.spawn.y);
            scene.player.setVelocity(0, 0);
          });
        });
      });
      this.physics.add.collider(this.player, ground);
      this.physics.add.collider(this.player, blocks);
      markReady();
    },
    update: function () {
      if (!this.player) return;
      var body = this.player.body;
      var vx = 0;
      if (this.keys.left.isDown || this.keys.a.isDown || this.leftButton.held) vx = -260;
      else if (this.keys.right.isDown || this.keys.d.isDown || this.rightButton.held) vx = 260;
      this.player.setVelocityX(vx);
      var onGround = body.blocked.down || body.touching.down;
      var jump =
        Phaser.Input.Keyboard.JustDown(this.keys.space) ||
        Phaser.Input.Keyboard.JustDown(this.keys.up) ||
        Phaser.Input.Keyboard.JustDown(this.keys.w) ||
        this.jumpButton.just;
      this.jumpButton.just = false;
      if (onGround && jump) this.player.setVelocityY(-580);
    },
  });

  var QuizScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function QuizScene() {
      Phaser.Scene.call(this, 'quiz');
    },
    create: function () {
      var task = currentTask(this);
      var current = this.registry.get('spec');
      if (!task) {
        this.scene.start('end');
        return;
      }
      ensureTextures(this, current);
      drawBackdrop(this, current);
      drawHud(this, current, task);
      focusGame(this);
      this.locked = false;
      var choices = choicesFor(task, this.registry.get('index') || 0, 4);
      var scene = this;
      var size = current.ageBand === 'young' ? '28px' : '24px';
      choices.forEach(function (choice, index) {
        var y = 214 + index * 78;
        var button = scene.add
          .rectangle(480, y, 840, 66, 0xffffff, 0.96)
          .setStrokeStyle(4, hex(current.theme.palette.accent))
          .setDepth(8)
          .setInteractive({ useHandCursor: true });
        scene.add
          .text(480, y, index + 1 + '. ' + choice, {
            fontFamily: FONT,
            fontSize: size,
            color: '#102027',
            align: 'center',
            wordWrap: { width: 780 },
          })
          .setOrigin(0.5)
          .setDepth(9);
        button.on('pointerdown', function () {
          grade(scene, task, choice);
        });
      });
      this.input.keyboard.on('keydown', function (event) {
        var n = parseInt(event.key, 10);
        if (n >= 1 && n <= choices.length) grade(scene, task, choices[n - 1]);
      });
      markReady();
    },
  });

  var EndScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function EndScene() {
      Phaser.Scene.call(this, 'end');
    },
    create: function () {
      var current = this.registry.get('spec');
      var score = this.registry.get('score') || 0;
      this.cameras.main.setBackgroundColor(current.theme.palette.background);
      this.add.rectangle(480, 270, 960, 540, 0x102027, 0.72);
      this.add
        .text(480, 150, current.texts.winTitle, {
          fontFamily: FONT,
          fontSize: '48px',
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: 800 },
        })
        .setOrigin(0.5);
      this.add
        .text(480, 230, current.texts.winBody, {
          fontFamily: FONT,
          fontSize: '26px',
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: 760 },
        })
        .setOrigin(0.5);
      this.add
        .text(480, 300, current.texts.score + ': ' + score + '/' + current.tasks.length, {
          fontFamily: FONT,
          fontSize: '32px',
          color: '#ffffff',
        })
        .setOrigin(0.5);
      var button = this.add
        .rectangle(480, 400, 380, 72, 0xffffff)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(480, 400, current.texts.playAgain, {
          fontFamily: FONT,
          fontSize: '24px',
          color: '#102027',
        })
        .setOrigin(0.5);
      var scene = this;
      button.on('pointerdown', function () {
        scene.registry.set('score', 0);
        scene.registry.set('index', 0);
        scene.registry.set('startedAt', Date.now());
        scene.scene.start(sceneKey(current.template));
      });
      this.input.keyboard.once('keydown-ENTER', function () {
        scene.registry.set('score', 0);
        scene.registry.set('index', 0);
        scene.scene.start(sceneKey(current.template));
      });
      var started = this.registry.get('startedAt') || Date.now();
      fetch(current.resultsUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          score: score,
          total: current.tasks.length,
          correct: score,
          durationMs: Math.max(0, Date.now() - started),
        }),
      }).catch(function () {});
      markReady();
    },
  });

  new Phaser.Game({
    type: Phaser.CANVAS,
    parent: 'game',
    width: 960,
    height: 540,
    backgroundColor: spec.theme.palette.background,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { y: 1100 }, debug: false },
    },
    scene: [Boot, CollectScene, RunnerScene, QuizScene, EndScene],
    input: { keyboard: true, touch: true },
    banner: false,
  });
})();

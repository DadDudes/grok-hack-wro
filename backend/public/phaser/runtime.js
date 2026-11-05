/* EduBotGames Phaser runtime. Three fixed templates: collect, runner, quiz.
   The spec in #game-spec is data. This file does not eval it.
   Generated images are framed to a fixed size. Physics bodies match that size. */
(function () {
  var FONT = 'system-ui, Segoe UI, sans-serif';
  var CHARACTER = 72;
  var ITEM = 64;
  var GRACE_MS = 700;
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

  var raw;
  try {
    raw = JSON.parse(node.textContent || '');
  } catch (error) {
    fail('Nie udało się odczytać gry.');
    return;
  }

  if (!window.Phaser) {
    fail('Nie udało się wczytać silnika gry (cdn.jsdelivr.net).');
    return;
  }

  function safeHex(value, fallback) {
    return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? String(value) : fallback;
  }

  function clip(value, max) {
    var text = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    if (text.length <= max) return text;
    return text.slice(0, max - 1) + '…';
  }

  function clampSpec(input) {
    var source = input || {};
    var theme = source.theme || {};
    var paletteIn = theme.palette || {};
    var palette = {
      background: safeHex(paletteIn.background, '#8ecae6'),
      ground: safeHex(paletteIn.ground, '#588157'),
      player: safeHex(paletteIn.player, '#f4d35e'),
      item: safeHex(paletteIn.item, '#e76f51'),
      accent: safeHex(paletteIn.accent, '#1d3557'),
      text: safeHex(paletteIn.text, '#1d3557'),
    };
    var english = String(source.language || '').toLowerCase().indexOf('en') === 0;
    var defaults = english
      ? { score: 'Score', correct: 'Yes!', wrong: 'Not quite. Try again.', winTitle: 'Finished', winBody: 'You did it!', playAgain: 'Play again', jump: 'Jump', left: 'Left', right: 'Right' }
      : { score: 'Punkty', correct: 'Dobrze!', wrong: 'Spróbuj jeszcze raz.', winTitle: 'Koniec gry', winBody: 'Świetnie ci poszło!', playAgain: 'Zagraj jeszcze raz', jump: 'Skok', left: 'Lewo', right: 'Prawo' };
    var textsIn = source.texts || {};
    var texts = {};
    Object.keys(defaults).forEach(function (key) {
      texts[key] = clip(textsIn[key] || defaults[key], 80);
    });
    var template = source.template;
    if (template !== 'runner' && template !== 'quiz' && template !== 'collect') template = 'collect';
    var tasks = Array.isArray(source.tasks) ? source.tasks.slice(0, 6) : [];
    tasks = tasks
      .map(function (task, index) {
        var answer = clip(task && task.answer, 32);
        if (!answer) return null;
        var distractors = Array.isArray(task.distractors) ? task.distractors : [];
        distractors = distractors
          .map(function (item) { return clip(item, 32); })
          .filter(function (item) { return item && item.toLocaleLowerCase() !== answer.toLocaleLowerCase(); })
          .slice(0, 3);
        while (distractors.length < 2) distractors.push(distractors.length === 0 ? '…' : '??');
        return {
          id: clip((task && task.id) || 'task-' + (index + 1), 40),
          prompt: clip((task && task.prompt) || answer, 180),
          answer: answer,
          distractors: distractors,
          explanation: clip((task && task.explanation) || answer, 180),
        };
      })
      .filter(Boolean);
    if (!tasks.length) return null;
    return {
      template: template,
      language: clip(source.language || 'pl', 16),
      ageBand: source.ageBand === 'young' || source.ageBand === 'older' ? source.ageBand : 'mid',
      title: clip(source.title || 'Gra', 80),
      instructions: clip(source.instructions || '', 180),
      theme: { name: clip(theme.name || 'Gra', 40), palette: palette },
      assets: source.assets || {},
      tasks: tasks,
      texts: texts,
      resultsUrl: clip(source.resultsUrl || '', 200),
    };
  }

  var spec = clampSpec(raw);
  if (!spec) {
    fail('Ta gra nie ma pytań.');
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
    if (!sliced.some(function (item) { return sameAnswer(item, task.answer); })) sliced[0] = task.answer;
    return shuffle(sliced, index + 9);
  }

  function questionSize(current) {
    if (current.ageBand === 'young') return '30px';
    if (current.ageBand === 'older') return '22px';
    return '26px';
  }

  var control = {
    left: { held: false, until: 0 },
    right: { held: false, until: 0 },
    jump: { held: false, until: 0, edge: false },
  };
  var keyState = { left: false, right: false, jumpEdge: false };

  function wantLeft() {
    return keyState.left || control.left.held || performance.now() < control.left.until;
  }
  function wantRight() {
    return keyState.right || control.right.held || performance.now() < control.right.until;
  }
  function consumeJump() {
    var jump = keyState.jumpEdge || control.jump.edge;
    keyState.jumpEdge = false;
    control.jump.edge = false;
    return jump;
  }

  window.addEventListener('keydown', function (event) {
    var key = event.key;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      keyState.left = true;
      event.preventDefault();
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      keyState.right = true;
      event.preventDefault();
    } else if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === ' ') {
      if (!event.repeat) keyState.jumpEdge = true;
      event.preventDefault();
    } else if (/^[1-4]$/.test(key) && typeof window.__EDUBOT_QUIZ === 'function') {
      window.__EDUBOT_QUIZ(Number(key));
      event.preventDefault();
    }
  }, true);
  window.addEventListener('keyup', function (event) {
    var key = event.key;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') keyState.left = false;
    if (key === 'ArrowRight' || key === 'd' || key === 'D') keyState.right = false;
  }, true);
  window.addEventListener('blur', function () {
    keyState.left = false;
    keyState.right = false;
  });

  function makeControl(name, label) {
    var button = document.createElement('button');
    button.type = 'button';
    button.dataset.control = name;
    button.textContent = label;
    button.style.cssText = 'pointer-events:auto;min-width:104px;min-height:58px;padding:0 16px;font:700 18px/1 system-ui,sans-serif;border-radius:14px;border:3px solid #fff;background:#102027;color:#fff;touch-action:manipulation;cursor:pointer;';
    var state = control[name];
    button.addEventListener('pointerdown', function (event) {
      event.preventDefault();
      state.held = true;
      state.until = performance.now() + 260;
      if (name === 'jump') state.edge = true;
      try { button.setPointerCapture(event.pointerId); } catch (error) { /* older browsers */ }
    });
    var release = function () { state.held = false; };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    return button;
  }

  function mountControls(mode) {
    var previous = document.getElementById('game-controls');
    if (previous) previous.remove();
    if (mode !== 'collect' && mode !== 'runner') return;
    var bar = document.createElement('div');
    bar.id = 'game-controls';
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:12px;display:flex;justify-content:space-between;align-items:center;padding:0 18px;z-index:40;pointer-events:none;';
    var group = document.createElement('div');
    group.style.cssText = 'display:flex;gap:10px;pointer-events:none;';
    group.append(makeControl('left', spec.texts.left), makeControl('right', spec.texts.right));
    bar.append(group);
    if (mode === 'runner') bar.append(makeControl('jump', spec.texts.jump));
    document.body.appendChild(bar);
  }

  function markReady() {
    window.__EDUBOT_READY = true;
    document.documentElement.dataset.gameReady = '1';
  }

  function postGameEvent(type, task, answer, correct) {
    if (!window.parent || window.parent === window) return;
    window.parent.postMessage({
      source: 'edubotgames-game',
      type: type,
      taskId: task && task.id ? task.id : null,
      answer: answer == null ? null : String(answer),
      correct: typeof correct === 'boolean' ? correct : null,
      player: null,
      at: new Date().toISOString(),
    }, '*');
  }

  function publish(scene) {
    var player = scene.player;
    window.__EDUBOT_STATE = {
      scene: scene.scene.key,
      score: scene.registry.get('score') || 0,
      index: scene.registry.get('index') || 0,
      prompt: scene.promptText || '',
      banner: scene.banner ? scene.banner.text : '',
      player: player
        ? {
            x: player.x,
            y: player.y,
            displayWidth: player.displayWidth,
            displayHeight: player.displayHeight,
          }
        : null,
      choices: scene.choiceMarks || [],
    };
  }

  /* Fit a generated image into a fixed circle and knock out a near-white backdrop. */
  function frameTexture(scene, sourceKey, destKey, size) {
    if (scene.textures.exists(destKey)) return true;
    if (!scene.textures.exists(sourceKey)) return false;
    var image = scene.textures.get(sourceKey).getSourceImage();
    if (!image) return false;
    var iw = image.naturalWidth || image.width || size;
    var ih = image.naturalHeight || image.height || size;
    var edge = Math.min(256, Math.max(iw, ih));
    var scale = edge / Math.max(iw, ih);
    var sw = Math.max(1, Math.round(iw * scale));
    var sh = Math.max(1, Math.round(ih * scale));
    var scratch = document.createElement('canvas');
    scratch.width = sw;
    scratch.height = sh;
    var sourceCtx = scratch.getContext('2d', { willReadFrequently: true });
    sourceCtx.drawImage(image, 0, 0, sw, sh);
    try {
      var pixels = sourceCtx.getImageData(0, 0, sw, sh);
      var data = pixels.data;
      for (var i = 0; i < data.length; i += 4) {
        var r = data[i];
        var g = data[i + 1];
        var b = data[i + 2];
        var min = r < g ? (r < b ? r : b) : (g < b ? g : b);
        var max = r > g ? (r > b ? r : b) : (g > b ? g : b);
        if (min > 236 && max - min < 20) data[i + 3] = 0;
        else if (min > 214 && max - min < 28) data[i + 3] = Math.round(data[i + 3] * ((236 - min) / 22));
      }
      sourceCtx.putImageData(pixels, 0, 0);
    } catch (error) {
      /* A tainted canvas still gets scaled into the circle. */
    }
    var texture = scene.textures.createCanvas(destKey, size, size);
    var ctx = texture.getContext();
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    var fit = Math.min((size - 6) / sw, (size - 6) / sh);
    var dw = sw * fit;
    var dh = sh * fit;
    ctx.drawImage(scratch, (size - dw) / 2, (size - dh) / 2, dw, dh);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2.5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 4;
    ctx.stroke();
    texture.refresh();
    return true;
  }

  function fallbackCircle(scene, key, size, color) {
    if (scene.textures.exists(key)) return;
    var gfx = scene.make.graphics({ add: false });
    gfx.fillStyle(color, 1);
    gfx.fillCircle(size / 2, size / 2, size / 2 - 2);
    gfx.lineStyle(4, 0xffffff, 1);
    gfx.strokeCircle(size / 2, size / 2, size / 2 - 4);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(size * 0.38, size * 0.42, size * 0.06);
    gfx.fillCircle(size * 0.62, size * 0.42, size * 0.06);
    gfx.generateTexture(key, size, size);
    gfx.destroy();
  }

  function prepareActors(scene) {
    if (!frameTexture(scene, 'character', 'character-framed', CHARACTER)) {
      fallbackCircle(scene, 'character-framed', CHARACTER, hex(spec.theme.palette.player));
    }
    if (!frameTexture(scene, 'item', 'item-framed', ITEM)) {
      fallbackCircle(scene, 'item-framed', ITEM, hex(spec.theme.palette.item));
    }
  }

  function fitBody(sprite, fraction) {
    var fw = sprite.frame.realWidth || sprite.width;
    var fh = sprite.frame.realHeight || sprite.height;
    sprite.body.setSize(Math.max(8, fw * fraction), Math.max(8, fh * fraction), true);
  }

  function drawBackdrop(scene) {
    scene.cameras.main.setBounds(0, 0, 960, 540);
    scene.cameras.main.centerOn(480, 270);
    if (scene.textures.exists('background')) {
      scene.add.image(480, 270, 'background').setDisplaySize(960, 540).setDepth(0);
    } else {
      scene.cameras.main.setBackgroundColor(spec.theme.palette.background);
    }
    scene.add.rectangle(480, 512, 960, 80, hex(spec.theme.palette.ground)).setDepth(1);
  }

  function drawHud(scene, task) {
    var plate = scene.add.graphics().setDepth(20);
    plate.fillStyle(0x102027, 0.84);
    plate.fillRoundedRect(16, 12, 928, 108, 18);
    scene.add.text(36, 22, spec.theme.name, {
      fontFamily: FONT, fontSize: '16px', color: '#d8f3dc',
    }).setDepth(21);
    var score = scene.registry.get('score') || 0;
    scene.scoreText = scene.add.text(908, 22, spec.texts.score + ': ' + score + '/' + spec.tasks.length, {
      fontFamily: FONT, fontSize: '18px', color: '#ffffff',
    }).setOrigin(1, 0).setDepth(21);
    scene.promptText = task.prompt;
    scene.add.text(480, 74, task.prompt, {
      fontFamily: FONT,
      fontSize: questionSize(spec),
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 860 },
    }).setOrigin(0.5).setDepth(21);
  }

  function showBanner(scene, message, good) {
    if (scene.banner) scene.banner.destroy();
    scene.banner = scene.add.text(480, 150, message, {
      fontFamily: FONT,
      fontSize: '22px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 760 },
      backgroundColor: good ? '#2d6a4f' : '#9b2226',
      padding: { left: 14, right: 14, top: 8, bottom: 8 },
    }).setOrigin(0.5).setDepth(45);
    publish(scene);
  }

  function finishRound(scene) {
    scene.registry.set('score', (scene.registry.get('score') || 0) + 1);
    scene.registry.set('index', (scene.registry.get('index') || 0) + 1);
    var index = scene.registry.get('index') || 0;
    if (index >= spec.tasks.length) scene.scene.start('end');
    else scene.scene.restart();
  }

  function grade(scene, task, choice, onWrong, source) {
    if (scene.locked) return;
    if (source !== 'click' && scene.time.now < scene.graceUntil) return;
    scene.locked = true;
    var correct = sameAnswer(choice, task.answer);
    postGameEvent('answer', task, choice, correct);
    var message = correct ? spec.texts.correct : spec.texts.wrong + ' ' + task.explanation;
    showBanner(scene, message, correct);
    scene.time.delayedCall(correct ? 650 : 1100, function () {
      if (correct) {
        finishRound(scene);
        return;
      }
      if (onWrong) onWrong();
      scene.graceUntil = scene.time.now + 450;
      scene.locked = false;
      if (scene.banner) scene.banner.destroy();
      scene.banner = null;
      publish(scene);
    });
  }

  function bindChoice(scene, object, choice, task, onWrong) {
    object.setInteractive({ useHandCursor: true });
    object.on('pointerover', function () { object.setAlpha(0.82); });
    object.on('pointerout', function () { object.setAlpha(1); });
    object.on('pointerdown', function () {
      grade(scene, task, choice, onWrong, 'click');
    });
  }

  function labelFor(scene, x, y, choice, task, onWrong) {
    var hit = scene.add.rectangle(x, y, 168, 46, 0x102027, 0.92).setDepth(8);
    var text = scene.add.text(x, y, choice, {
      fontFamily: FONT,
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 156 },
    }).setOrigin(0.5).setDepth(9);
    bindChoice(scene, hit, choice, task, onWrong);
    scene.choiceMarks.push({ text: choice, x: x, y: y });
    return text;
  }

  function currentTask(scene) {
    var index = scene.registry.get('index') || 0;
    if (index >= spec.tasks.length) return null;
    return spec.tasks[index];
  }

  var Boot = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function Boot() { Phaser.Scene.call(this, 'boot'); },
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
    initialize: function CollectScene() { Phaser.Scene.call(this, 'collect'); },
    create: function () {
      var task = currentTask(this);
      if (!task) { this.scene.start('end'); return; }
      this.physics.world.gravity.y = 0;
      this.physics.world.setBounds(0, 0, 960, 540);
      prepareActors(this);
      drawBackdrop(this);
      drawHud(this, task);
      mountControls('collect');
      this.locked = false;
      this.graceUntil = this.time.now + GRACE_MS;
      this.choiceMarks = [];
      this.spawn = { x: 100, y: 430 };
      this.player = this.physics.add.sprite(this.spawn.x, this.spawn.y, 'character-framed').setDepth(5);
      this.player.setCollideWorldBounds(true);
      this.player.body.setAllowGravity(false);
      fitBody(this.player, 0.72);
      var choices = choicesFor(task, this.registry.get('index') || 0, 3);
      var scene = this;
      var onWrong = function () {
        scene.player.setPosition(scene.spawn.x, scene.spawn.y);
        scene.player.setVelocity(0, 0);
      };
      choices.forEach(function (choice, index) {
        var x = 390 + index * 200;
        var sprite = scene.physics.add.sprite(x, 268, 'item-framed').setDepth(4);
        sprite.body.setAllowGravity(false);
        sprite.body.setImmovable(true);
        fitBody(sprite, 0.8);
        bindChoice(scene, sprite, choice, task, onWrong);
        scene.choiceMarks.push({ text: choice, x: x, y: 268 });
        labelFor(scene, x, 330, choice, task, onWrong);
        scene.physics.add.overlap(scene.player, sprite, function () {
          grade(scene, task, choice, onWrong, 'overlap');
        });
      });
      publish(this);
      markReady();
    },
    update: function () {
      if (!this.player) return;
      var vx = 0;
      if (wantLeft()) vx = -300;
      else if (wantRight()) vx = 300;
      this.player.setVelocity(vx, 0);
      publish(this);
    },
  });

  var RunnerScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function RunnerScene() { Phaser.Scene.call(this, 'runner'); },
    create: function () {
      var task = currentTask(this);
      if (!task) { this.scene.start('end'); return; }
      this.physics.world.gravity.y = 1100;
      this.physics.world.setBounds(0, 0, 960, 540);
      prepareActors(this);
      drawBackdrop(this);
      drawHud(this, task);
      mountControls('runner');
      this.locked = false;
      this.graceUntil = this.time.now + GRACE_MS;
      this.choiceMarks = [];
      this.spawn = { x: 120, y: 360 };
      var spots = [
        { x: 430, y: 448 },
        { x: 650, y: 384 },
        { x: 860, y: 328 },
      ];
      var mountains = this.add.graphics().setDepth(2);
      mountains.fillStyle(hex(spec.theme.palette.ground), 1);
      spots.forEach(function (spot) {
        mountains.fillTriangle(spot.x - 120, 472, spot.x + 120, 472, spot.x, spot.y - 40);
      });
      var ground = this.add.rectangle(480, 524, 960, 40, hex(spec.theme.palette.ground)).setDepth(2);
      this.physics.add.existing(ground, true);
      this.player = this.physics.add.sprite(this.spawn.x, this.spawn.y, 'character-framed').setDepth(5);
      this.player.setCollideWorldBounds(true);
      this.player.setBounce(0);
      this.player.setMaxVelocity(340, 900);
      fitBody(this.player, 0.7);
      var blocks = [];
      var scene = this;
      var choices = choicesFor(task, this.registry.get('index') || 0, 3);
      var onWrong = function () {
        scene.player.setPosition(scene.spawn.x, scene.spawn.y);
        scene.player.setVelocity(0, 0);
      };
      spots.forEach(function (spot, index) {
        var choice = choices[index];
        if (!choice) return;
        var block = scene.add.rectangle(spot.x, spot.y, 150, 22, hex(spec.theme.palette.accent)).setDepth(3);
        scene.physics.add.existing(block, true);
        blocks.push(block);
        labelFor(scene, spot.x, spot.y - 48, choice, task, onWrong);
        var zone = scene.add.zone(spot.x, spot.y - 20, 120, 36);
        scene.physics.add.existing(zone);
        zone.body.setAllowGravity(false);
        zone.body.setImmovable(true);
        scene.physics.add.overlap(scene.player, zone, function () {
          var body = scene.player.body;
          if (!body.blocked.down && !body.touching.down) return;
          grade(scene, task, choice, onWrong, 'overlap');
        });
      });
      this.physics.add.collider(this.player, ground);
      this.physics.add.collider(this.player, blocks);
      publish(this);
      markReady();
    },
    update: function () {
      if (!this.player) return;
      var body = this.player.body;
      var vx = 0;
      if (wantLeft()) vx = -280;
      else if (wantRight()) vx = 280;
      this.player.setVelocityX(vx);
      var onGround = body.blocked.down || body.touching.down;
      if (onGround && consumeJump()) this.player.setVelocityY(-640);
      publish(this);
    },
  });

  var QuizScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function QuizScene() { Phaser.Scene.call(this, 'quiz'); },
    create: function () {
      var task = currentTask(this);
      if (!task) { this.scene.start('end'); return; }
      mountControls('quiz');
      drawBackdrop(this);
      drawHud(this, task);
      this.locked = false;
      this.graceUntil = 0;
      this.choiceMarks = [];
      var choices = choicesFor(task, this.registry.get('index') || 0, 4);
      var scene = this;
      choices.forEach(function (choice, index) {
        var y = 200 + index * 78;
        var button = scene.add.rectangle(480, y, 820, 64, 0xffffff, 0.96)
          .setStrokeStyle(4, hex(spec.theme.palette.accent))
          .setDepth(8);
        scene.add.text(480, y, (index + 1) + '. ' + choice, {
          fontFamily: FONT,
          fontSize: spec.ageBand === 'young' ? '28px' : '24px',
          color: '#102027',
          align: 'center',
          wordWrap: { width: 760 },
        }).setOrigin(0.5).setDepth(9);
        bindChoice(scene, button, choice, task, null);
        scene.choiceMarks.push({ text: choice, x: 480, y: y });
      });
      window.__EDUBOT_QUIZ = function (number) {
        if (number >= 1 && number <= choices.length) grade(scene, task, choices[number - 1], null, 'click');
      };
      this.events.once('shutdown', function () { window.__EDUBOT_QUIZ = null; });
      publish(this);
      markReady();
    },
    update: function () { publish(this); },
  });

  var EndScene = new Phaser.Class({
    Extends: Phaser.Scene,
    initialize: function EndScene() { Phaser.Scene.call(this, 'end'); },
    create: function () {
      mountControls('end');
      postGameEvent('finish', null, null, null);
      var score = this.registry.get('score') || 0;
      this.choiceMarks = [];
      this.promptText = spec.texts.winTitle;
      this.cameras.main.setBackgroundColor(spec.theme.palette.background);
      this.add.rectangle(480, 270, 960, 540, 0x102027, 0.72);
      this.add.text(480, 150, spec.texts.winTitle, {
        fontFamily: FONT, fontSize: '48px', color: '#ffffff', align: 'center', wordWrap: { width: 800 },
      }).setOrigin(0.5);
      this.add.text(480, 230, spec.texts.winBody, {
        fontFamily: FONT, fontSize: '26px', color: '#ffffff', align: 'center', wordWrap: { width: 760 },
      }).setOrigin(0.5);
      this.add.text(480, 300, spec.texts.score + ': ' + score + '/' + spec.tasks.length, {
        fontFamily: FONT, fontSize: '32px', color: '#ffffff',
      }).setOrigin(0.5);
      var button = this.add.rectangle(480, 400, 380, 72, 0xffffff).setInteractive({ useHandCursor: true });
      this.add.text(480, 400, spec.texts.playAgain, {
        fontFamily: FONT, fontSize: '24px', color: '#102027',
      }).setOrigin(0.5);
      var scene = this;
      var again = function () {
        scene.registry.set('score', 0);
        scene.registry.set('index', 0);
        scene.registry.set('startedAt', Date.now());
        scene.scene.start(sceneKey(spec.template));
      };
      button.on('pointerdown', again);
      if (spec.resultsUrl) {
        fetch(spec.resultsUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            score: score,
            total: spec.tasks.length,
            correct: score,
            durationMs: Math.max(0, Date.now() - (this.registry.get('startedAt') || Date.now())),
          }),
        }).catch(function () {});
      }
      publish(this);
      markReady();
    },
  });

  window.__EDUBOT_GAME = new Phaser.Game({
    type: Phaser.CANVAS,
    parent: 'game',
    width: 960,
    height: 540,
    backgroundColor: spec.theme.palette.background,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { y: 1100 }, debug: false } },
    scene: [Boot, CollectScene, RunnerScene, QuizScene, EndScene],
    input: { keyboard: true, touch: true },
    banner: false,
  });
})();

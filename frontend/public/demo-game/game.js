const GAME_SOURCE = 'edubotgames-game';
const APP_SOURCE = 'edubotgames-app';
const NEXT_TASK_MS = 700;
const FINISH_MS = 1400;
const BUBBLE_MS = 4500;

const questionElement = document.getElementById('question');
const answersElement = document.getElementById('answers');
const bubbleElement = document.getElementById('bubble');
const doneElement = document.getElementById('done');

const game = {
  tasks: [],
  index: 0,
  locked: false,
  bubbleTimer: null,
};

function post(type, task, answer, correct) {
  const event = {
    source: GAME_SOURCE,
    type,
    taskId: task === null ? null : task.id,
    answer,
    correct,
    player: null,
    at: new Date().toISOString(),
  };

  window.parent.postMessage(event, '*');
}

function shuffled(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    const held = copy[index];
    copy[index] = copy[swapWith];
    copy[swapWith] = held;
  }

  return copy;
}

function finishGame() {
  questionElement.textContent = 'Well done!';
  answersElement.replaceChildren();
  doneElement.hidden = false;
  window.setTimeout(() => post('finish', null, null, null), FINISH_MS);
}

function pick(button, task, answer) {
  if (game.locked || button.disabled) {
    return;
  }

  const correct = answer === task.answer;
  post('answer', task, answer, correct);

  if (!correct) {
    button.disabled = true;
    button.classList.add('wrong');
    return;
  }

  game.locked = true;
  button.classList.add('caught');
  window.setTimeout(nextTask, NEXT_TASK_MS);
}

function showTask() {
  const task = game.tasks[game.index];
  const answers = shuffled([task.answer, ...task.distractors]);

  questionElement.textContent = task.question;
  answersElement.replaceChildren();
  game.locked = false;

  for (const answer of answers) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer';
    button.textContent = answer;
    button.addEventListener('click', () => pick(button, task, answer));
    answersElement.append(button);
  }
}

function nextTask() {
  game.index += 1;

  if (game.index >= game.tasks.length) {
    finishGame();
    return;
  }

  showTask();
}

function showHint(text) {
  bubbleElement.textContent = text;
  bubbleElement.hidden = false;
  window.clearTimeout(game.bubbleTimer);
  game.bubbleTimer = window.setTimeout(() => {
    bubbleElement.hidden = true;
  }, BUBBLE_MS);
}

function startGame(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    questionElement.textContent = 'No tasks yet. Ask a grown-up to set a goal.';
    return;
  }

  game.tasks = tasks;
  game.index = 0;
  doneElement.hidden = true;
  showTask();
}

function handleMessage(event) {
  const message = event.data;
  const isObject = typeof message === 'object' && message !== null;

  if (!isObject || message.source !== APP_SOURCE) {
    return;
  }

  if (message.type === 'start') {
    startGame(message.tasks);
    return;
  }

  if (message.type === 'hint') {
    showHint(message.text);
  }
}

window.addEventListener('message', handleMessage);

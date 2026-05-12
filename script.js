/* =========================================================
   THE TOY DID NOT MOVE
   script.js
   A harmless thing gets accused.
   Core experience:
   waiting screen → primer → user submits exhibits
   → suspicion rises → whisper wait → final glitch → reveal.
   ========================================================= */

/* =========================================================
   ASSET PATH
   ========================================================= */

const ASSET_PATH = "./assets/";

/* =========================================================
   TIMING SETTINGS
   ========================================================= */

const FINAL_WHISPER_WAIT = 8000;
// waits 8 seconds after all exhibits are submitted
// so the whispering can intensify before the final glitch

const FINAL_GLITCH_DURATION = 2600;

/* =========================================================
   DOM
   ========================================================= */

const app = document.getElementById("app");
const scene = document.getElementById("scene");
const globalGlitch = document.getElementById("globalGlitch");

const waitingScreen = document.getElementById("waitingScreen");
const startExperienceBtn = document.getElementById("startExperienceBtn");

const topStatus = document.getElementById("topStatus");

const teddy = document.getElementById("teddy");

const fearPrimer = document.getElementById("fearPrimer");
const bearNoBtn = document.getElementById("bearNoBtn");
const bearMaybeBtn = document.getElementById("bearMaybeBtn");
const primerResponse = document.getElementById("primerResponse");

const introOverlay = document.getElementById("introOverlay");
const revealOverlay = document.getElementById("revealOverlay");

const beginBtn = document.getElementById("beginBtn");
const againBtn = document.getElementById("againBtn");

const captionBox = document.getElementById("captionBox");
const captionText = document.getElementById("captionText");

const meterFill = document.getElementById("meterFill");
const meterLabel = document.getElementById("meterLabel");
const editCount = document.getElementById("editCount");

const statusText = document.getElementById("statusText");

const lightsBtn = document.getElementById("lightsBtn");
const shadingBtn = document.getElementById("shadingBtn");
const cutBtn = document.getElementById("cutBtn");
const lifeBtn = document.getElementById("lifeBtn");
const captionBtn = document.getElementById("captionBtn");

const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");
const soundBtn = document.getElementById("soundBtn");
const replayBtn = document.getElementById("replayBtn");
const soundIcon = document.getElementById("soundIcon");

const revealImage = document.getElementById("revealImage");
const addedList = document.getElementById("addedList");

/* =========================================================
   AUDIO ELEMENTS
   ========================================================= */

const clickAudio = document.getElementById("clickAudio");
const thudAudio = document.getElementById("thudAudio");
const scissorsAudio = document.getElementById("scissorsAudio");

const heartAudio = document.getElementById("heartAudio");
const breatheAudio = document.getElementById("breatheAudio");
const clockAudio = document.getElementById("clockAudio");
const whisperAudio = document.getElementById("whisperAudio");
const creepyBgAudio = document.getElementById("creepyBgAudio");

const loopAudios = [
  heartAudio,
  breatheAudio,
  clockAudio,
  whisperAudio,
  creepyBgAudio
].filter(Boolean);

const allAudios = [
  clickAudio,
  thudAudio,
  scissorsAudio,
  heartAudio,
  breatheAudio,
  clockAudio,
  whisperAudio,
  creepyBgAudio
].filter(Boolean);

/* =========================================================
   WEB AUDIO FOR PANNED WHISPERS
   ========================================================= */

let audioContext = null;
let whisperSource = null;
let whisperPanner = null;
let whisperGain = null;
let whisperPanRaf = null;

/* =========================================================
   STATE
   ========================================================= */

const state = {
  waitingCleared: false,

  primed: false,
  primerAnswer: "",
  started: false,
  finished: false,
  muted: false,

  finalSequenceStarted: false,
  finalSequenceTimer: null,

  intensity: 0,
  currentTeddy: `${ASSET_PATH}teddy.png`,

  edits: {
    lights: false,
    shading: false,
    cut: false,
    life: false,
    caption: false
  },

  usedEditOrder: [],

  captionIndex: 0,
  captionTimer: null,
  escalationTimer: null,
  idleTimer: null,
  glitchTimer: null,
  primerDriftTimer: null,

  escalated: false
};

/* =========================================================
   COPY
   ========================================================= */

const statusLines = {
  idle: "Answer first. The case comes after.",
  start: "Keep your first answer nearby.",
  lights: "Exhibit A submitted: low light.",
  shading: "Exhibit B submitted: shadow.",
  cut: "Exhibit C submitted: a cut.",
  life: "Exhibit D submitted: a pulse.",
  caption: "Exhibit E submitted: a voice.",
  pending: "The case is complete. Listen before the verdict arrives.",
  peak: "The exhibits are louder than the proof.",
  reveal: "Fear present. Threat unproven.",
  reset: "Back to the object before the case."
};

const topLines = {
  idle: "object admitted",
  primer: "answer held",
  start: "case opened",
  lights: "exhibit a",
  shading: "exhibit b",
  cut: "exhibit c",
  life: "exhibit d",
  caption: "exhibit e",
  pending: "verdict pending",
  peak: "verdict loading",
  reveal: "verdict"
};

const captionLines = [
  "[it has not moved]",
  "[the room is doing more than the toy]",
  "[the pulse arrived before the proof]",
  "[the voice is an exhibit]",
  "[a still thing can be made to look guilty]",
  "[nothing new was found]",
  "[the feeling is louder than the evidence]"
];

const editLabels = {
  lights: "low light",
  shading: "shadow",
  cut: "cut surface",
  life: "pulse",
  caption: "voice",
  escalation: "suspicion intensified"
};

/* =========================================================
   INIT
   ========================================================= */

window.addEventListener("load", init);

safeClick(startExperienceBtn, enterFromWaitingScreen);

safeClick(bearNoBtn, () => answerPrimer("no"));
safeClick(bearMaybeBtn, () => answerPrimer("not yet"));

safeClick(beginBtn, startExperience);
safeClick(playBtn, startExperience);

safeClick(lightsBtn, applyLights);
safeClick(shadingBtn, applyShading);
safeClick(cutBtn, applyCut);
safeClick(lifeBtn, applyLife);
safeClick(captionBtn, applyCaption);

safeClick(stopBtn, showReveal);
safeClick(againBtn, resetExperience);
safeClick(replayBtn, resetExperience);

safeClick(soundBtn, toggleSound);

function init() {
  if (teddy) {
    teddy.src = `${ASSET_PATH}teddy.png`;
  }

  state.currentTeddy = `${ASSET_PATH}teddy.png`;

  hide(introOverlay);
  hide(revealOverlay);

  resetAudio();

  preloadImages([
    "teddy.png",
    "teddy_shaded.png",
    "teddy_tore.png",
    "teddy_shaded_tore.png",
    "sound_on.png",
    "sound_off.png",
    "sound_on_1.png",
    "sound_off_1.png"
  ]);

  setIntensity(0);
  updateEditCount();
  setStatus(statusLines.idle, topLines.idle);

  lockAllTools();

  if (playBtn) playBtn.disabled = true;
  if (stopBtn) stopBtn.disabled = true;
  if (replayBtn) replayBtn.classList.add("hidden");

  /*
    IMPORTANT:
    If the waiting screen exists, we keep the primer hidden
    until the user clicks Start Experience.
  */
  if (waitingScreen) {
    state.waitingCleared = false;
    show(waitingScreen);
    waitingScreen.classList.remove("hide", "hidden");
    document.body.classList.add("waiting-active");

    hide(fearPrimer);
  } else {
    enterPrimerStage();
  }
}

/* =========================================================
   WAITING / LOADING SCREEN
   ========================================================= */

function enterFromWaitingScreen() {
  if (state.waitingCleared) return;

  state.waitingCleared = true;

  unlockAudioContext();
  playOneShot(clickAudio, 0.12, 1);

  if (waitingScreen) {
    waitingScreen.classList.add("hide");

    setTimeout(() => {
      hide(waitingScreen);
      document.body.classList.remove("waiting-active");
      enterPrimerStage();
    }, 850);
  } else {
    enterPrimerStage();
  }
}

function enterPrimerStage() {
  show(fearPrimer);
  hide(introOverlay);
  hide(revealOverlay);

  if (primerResponse) {
    primerResponse.textContent = "Notice your first reaction.";
  }

  startPrimerDrift();
}

/* =========================================================
   PRIMER
   ========================================================= */

function startPrimerDrift() {
  clearInterval(state.primerDriftTimer);

  const lines = [
    "Notice your first reaction.",
    "A teddy is just a teddy. There is nothing scary about it yet.",
    "Answer before the experience tells you what to fear.",
    "Nothing has changed yet."
  ];

  let index = 0;

  if (primerResponse) {
    primerResponse.textContent = lines[index];
  }

  state.primerDriftTimer = setInterval(() => {
    if (state.primed || !primerResponse) return;

    index = (index + 1) % lines.length;
    primerResponse.textContent = lines[index];
  }, 2800);
}

function answerPrimer(answer) {
  if (state.primed) return;

  state.primed = true;
  state.primerAnswer = answer;

  clearInterval(state.primerDriftTimer);

  unlockAudioContext();

  playOneShot(clickAudio, 0.12, 0.96);
  startLoop(creepyBgAudio, 0.03, 0.86);

  if (primerResponse) {
    primerResponse.textContent =
      answer === "not yet"
        ? "Hold that not yet. The room will try to turn it into yes."
        : "Hold that no. The room will try to build a case.";
  }

  setStatus("The object begins neutral. The case comes after.", topLines.primer);

  triggerWholeWebGlitch(180);

  setTimeout(() => {
    hide(fearPrimer);
    show(introOverlay);

    if (playBtn) playBtn.disabled = false;
  }, 1450);
}

/* =========================================================
   START
   ========================================================= */

function startExperience() {
  if (!state.primed || state.started || state.finished) return;

  state.started = true;

  if (app) {
    app.dataset.state = "started";
    app.classList.add("started");
  }

  hide(introOverlay);

  unlockAudioContext();

  playOneShot(clickAudio, 0.12, 1);
  startBaseAtmosphere();
  startOccasionalGlitches();

  setIntensity(6);
  setStatus(statusLines.start, topLines.start);

  if (playBtn) playBtn.disabled = true;
  if (stopBtn) stopBtn.disabled = true;

  enableTool(lightsBtn);
  enableTool(shadingBtn);

  clearTimeout(state.idleTimer);
  state.idleTimer = setTimeout(() => {
    if (!state.usedEditOrder.length && state.started && !state.finished) {
      setStatus("Submit the first exhibit. Then look again.", "waiting for exhibit");
    }
  }, 5200);
}

/* =========================================================
   EXHIBIT APPLICATION
   ========================================================= */

function applyLights() {
  if (!canUseTool("lights")) return;

  registerEdit("lights");

  app?.classList.add("lighted");
  markToolUsed(lightsBtn);

  setIntensityByEdits();
  setStatus(statusLines.lights, topLines.lights);

  addCommitPulse();
  triggerWholeWebGlitch(140);
  playOneShot(clickAudio, 0.14, 0.95);

  startLoop(clockAudio, 0.032, 0.9);
  startLoop(creepyBgAudio, 0.055, 0.86);

  updateAudioTension();

  enableTool(shadingBtn);

  unlockCompare();
  checkForFinalSequence();
}

function applyShading() {
  if (!canUseTool("shading")) return;

  registerEdit("shading");

  app?.classList.add("shadowed");
  markToolUsed(shadingBtn);

  updateTeddyImage();

  setIntensityByEdits();
  setStatus(statusLines.shading, topLines.shading);

  addCommitPulse();
  playOneShot(thudAudio, 0.2, 0.86);

  startLoop(breatheAudio, 0.05, 0.9);
  startLoop(creepyBgAudio, 0.075, 0.86);

  updateAudioTension();

  enableTool(cutBtn);

  unlockCompare();
  checkForFinalSequence();
}

function applyCut() {
  if (!canUseTool("cut")) return;

  registerEdit("cut");

  app?.classList.add("cut");
  markToolUsed(cutBtn);

  updateTeddyImage();

  setIntensityByEdits();
  setStatus(statusLines.cut, topLines.cut);

  addCommitFlash();
  triggerWholeWebGlitch(280);

  playOneShot(scissorsAudio, 0.28, 0.94);
  setTimeout(() => playOneShot(thudAudio, 0.15, 0.72), 210);

  captionBox?.classList.add("active");
  if (captionText) captionText.textContent = "[now it looks like something happened]";

  startLoop(creepyBgAudio, 0.1, 0.86);
  updateAudioTension();

  enableTool(lifeBtn);
  enableTool(captionBtn);

  unlockCompare();
  checkForFinalSequence();
}

function applyLife() {
  if (!canUseTool("life")) return;

  registerEdit("life");

  app?.classList.add("pulsing");
  markToolUsed(lifeBtn);

  setIntensityByEdits();
  setStatus(statusLines.life, topLines.life);

  addCommitPulse();
  playOneShot(thudAudio, 0.16, 0.78);

  startLoop(heartAudio, 0.085, 0.86);
  startLoop(breatheAudio, 0.085, 0.92);

  startPannedWhispers(0.08);
  startLoop(creepyBgAudio, 0.13, 0.88);

  updateAudioTension();

  enableTool(captionBtn);

  unlockCompare();
  checkForFinalSequence();
}

function applyCaption() {
  if (!canUseTool("caption")) return;

  registerEdit("caption");

  app?.classList.add("captioned");
  captionBox?.classList.add("active");
  markToolUsed(captionBtn);

  setIntensityByEdits();
  setStatus(statusLines.caption, topLines.caption);

  addCommitPulse();
  triggerWholeWebGlitch(160);
  playOneShot(clickAudio, 0.12, 0.78);

  startLoop(clockAudio, 0.064, 1.04);
  startLoop(breatheAudio, 0.085, 0.96);
  startPannedWhispers(0.1);
  startLoop(creepyBgAudio, 0.15, 0.86);

  startCaptionCycle();

  updateAudioTension();

  unlockCompare();
  checkForFinalSequence();
}

/* =========================================================
   IMAGE LOGIC
   ========================================================= */

function updateTeddyImage() {
  let nextImage = `${ASSET_PATH}teddy.png`;

  if (state.edits.shading && state.edits.cut) {
    nextImage = `${ASSET_PATH}teddy_shaded_tore.png`;
  } else if (state.edits.shading) {
    nextImage = `${ASSET_PATH}teddy_shaded.png`;
  } else if (state.edits.cut) {
    nextImage = `${ASSET_PATH}teddy_tore.png`;
  }

  swapTeddy(nextImage);
}

/* =========================================================
   FINAL SEQUENCE
   ========================================================= */

function allExhibitsSubmitted() {
  return (
    state.edits.lights &&
    state.edits.shading &&
    state.edits.cut &&
    state.edits.life &&
    state.edits.caption
  );
}

function checkForFinalSequence() {
  if (!allExhibitsSubmitted()) return;
  if (state.finalSequenceStarted || state.finished) return;

  state.finalSequenceStarted = true;

  if (stopBtn) stopBtn.disabled = true;

  setStatus(statusLines.pending, topLines.pending);

  captionBox?.classList.add("active");

  if (captionText) {
    captionText.textContent = "[all exhibits submitted]";
  }

  /*
    This is the new pause:
    instead of glitching immediately, the room waits,
    the whisper grows, and then the final glitch hits.
  */
  intensifyBeforeFinalGlitch();

  clearTimeout(state.finalSequenceTimer);
  state.finalSequenceTimer = setTimeout(() => {
    triggerFinalGlitchThenReveal();
  }, FINAL_WHISPER_WAIT);
}

function intensifyBeforeFinalGlitch() {
  app?.classList.add("waiting-for-verdict");

  startPannedWhispers(0.22);
  startLoop(creepyBgAudio, 0.22, 0.78);
  startLoop(breatheAudio, 0.13, 0.78);
  startLoop(heartAudio, 0.14, 1.05);
  startLoop(clockAudio, 0.12, 1.12);

  setWhisperGain(0.38, 1600);
  setLoopVolume(creepyBgAudio, 0.26, 2500);
  setLoopVolume(breatheAudio, 0.16, 2500);
  setLoopVolume(heartAudio, 0.18, 2500);
  setLoopVolume(clockAudio, 0.16, 2500);

  if (whisperAudio) {
    whisperAudio.volume = state.muted ? 0 : 0.38;
    whisperAudio.playbackRate = 0.9;
  }

  setTimeout(() => {
    if (state.finished) return;

    if (captionText) {
      captionText.textContent = "[listen to what the room has made]";
    }

    setWhisperGain(0.55, 2200);
    setLoopVolume(creepyBgAudio, 0.32, 2200);
  }, FINAL_WHISPER_WAIT * 0.45);
}

function triggerFinalGlitchThenReveal() {
  if (state.finished) return;

  state.escalated = true;

  app?.classList.remove("waiting-for-verdict");

  setIntensity(100);
  setStatus(statusLines.peak, topLines.peak);

  app?.classList.add("maxed", "glitching", "final-glitch");

  if (globalGlitch) {
    globalGlitch.classList.add("active");
  }

  captionBox?.classList.add("active");

  if (captionText) {
    captionText.textContent = "[the exhibits are louder than the proof]";
  }

  playOneShot(scissorsAudio, 0.28, 0.66);
  setTimeout(() => playOneShot(thudAudio, 0.28, 0.58), 420);
  setTimeout(() => triggerWholeWebGlitch(360), 760);
  setTimeout(() => playOneShot(scissorsAudio, 0.22, 0.52), 1120);

  startPannedWhispers(0.42);
  setWhisperGain(0.7, 500);
  startLoop(creepyBgAudio, 0.35, 0.72);

  updateAudioTension();
  updateEditCount();

  setTimeout(() => {
    app?.classList.remove("final-glitch");

    if (globalGlitch) {
      globalGlitch.classList.remove("active");
    }

    showReveal();
  }, FINAL_GLITCH_DURATION);
}

/* Kept for compatibility if you still call it somewhere. */
function triggerEscalationSoon() {
  checkForFinalSequence();
}

/* Kept for compatibility if you still call it somewhere. */
function triggerEscalation() {
  checkForFinalSequence();
}

/* =========================================================
   REVEAL
   ========================================================= */

function showReveal() {
  if (!state.started || state.finished) return;

  state.finished = true;

  if (app) {
    app.dataset.state = "revealed";
  }

  clearTimeout(state.escalationTimer);
  clearTimeout(state.idleTimer);
  clearTimeout(state.finalSequenceTimer);
  clearInterval(state.captionTimer);
  stopOccasionalGlitches();

  app?.classList.remove("final-glitch", "glitching", "waiting-for-verdict");

  if (globalGlitch) {
    globalGlitch.classList.remove("active");
  }

  setStatus(statusLines.reveal, topLines.reveal);

  if (revealImage) {
    revealImage.src = state.currentTeddy;
  }

  buildReceipt();

  show(revealOverlay);

  if (stopBtn) stopBtn.disabled = true;
  if (replayBtn) replayBtn.classList.remove("hidden");

  softenAudioForReveal();
}

function buildReceipt() {
  const added = state.usedEditOrder.map((edit) => `<li>${editLabels[edit]}</li>`);

  if (state.escalated) {
    added.push(`<li>${editLabels.escalation}</li>`);
  }

  if (addedList) {
    addedList.innerHTML = added.length ? added.join("") : "<li>nothing submitted</li>";
  }
}

/* =========================================================
   RESET
   ========================================================= */

function resetExperience() {
  clearTimeout(state.escalationTimer);
  clearTimeout(state.idleTimer);
  clearTimeout(state.finalSequenceTimer);
  clearInterval(state.captionTimer);
  clearInterval(state.primerDriftTimer);

  stopOccasionalGlitches();
  stopWhisperPan();

  state.primed = false;
  state.primerAnswer = "";
  state.started = false;
  state.finished = false;
  state.finalSequenceStarted = false;
  state.finalSequenceTimer = null;
  state.intensity = 0;
  state.currentTeddy = `${ASSET_PATH}teddy.png`;
  state.usedEditOrder = [];
  state.captionIndex = 0;
  state.escalated = false;

  state.edits = {
    lights: false,
    shading: false,
    cut: false,
    life: false,
    caption: false
  };

  if (app) {
    app.dataset.state = "idle";

    app.classList.remove(
      "started",
      "lighted",
      "shadowed",
      "cut",
      "pulsing",
      "captioned",
      "maxed",
      "flash",
      "glitching",
      "final-glitch",
      "waiting-for-verdict"
    );
  }

  if (globalGlitch) {
    globalGlitch.classList.remove("active");
  }

  if (teddy) {
    teddy.src = `${ASSET_PATH}teddy.png`;
    teddy.classList.remove("switching");
  }

  if (captionText) captionText.textContent = "";
  captionBox?.classList.remove("active");

  hide(revealOverlay);
  hide(introOverlay);
  show(fearPrimer);

  if (primerResponse) {
    primerResponse.textContent = "Notice your first reaction.";
  }

  if (playBtn) playBtn.disabled = true;
  if (stopBtn) stopBtn.disabled = true;
  if (replayBtn) replayBtn.classList.add("hidden");

  lockAllTools();
  resetToolButtons();
  resetAudio();

  setIntensity(0);
  updateEditCount();
  setStatus(statusLines.idle, topLines.idle);

  startPrimerDrift();
}

/* =========================================================
   EDIT / UI HELPERS
   ========================================================= */

function registerEdit(name) {
  state.edits[name] = true;

  if (!state.usedEditOrder.includes(name)) {
    state.usedEditOrder.push(name);
  }

  updateEditCount();
}

function canUseTool(name) {
  return (
    state.started &&
    !state.finished &&
    !state.edits[name] &&
    !state.finalSequenceStarted
  );
}

function enableTool(button) {
  if (!button || state.finalSequenceStarted) return;
  button.disabled = false;
  button.classList.remove("is-locked");
}

function disableTool(button) {
  if (!button) return;
  button.disabled = true;
  button.classList.add("is-locked");
}

function lockAllTools() {
  [lightsBtn, shadingBtn, cutBtn, lifeBtn, captionBtn].forEach(disableTool);
}

function resetToolButtons() {
  [lightsBtn, shadingBtn, cutBtn, lifeBtn, captionBtn].forEach((button) => {
    if (button) button.classList.remove("active");
  });
}

function markToolUsed(button) {
  if (!button) return;
  button.classList.add("active");
  button.disabled = true;
}

function unlockCompare() {
  if (state.finalSequenceStarted) return;
  if (stopBtn) stopBtn.disabled = false;
}

function setStatus(mainText, topText) {
  if (statusText) statusText.textContent = mainText;
  if (topStatus) topStatus.textContent = topText;
}

function setIntensityByEdits() {
  const weights = {
    lights: 16,
    shading: 22,
    cut: 18,
    life: 22,
    caption: 18
  };

  let total = 6;

  Object.keys(state.edits).forEach((key) => {
    if (state.edits[key]) total += weights[key] || 0;
  });

  setIntensity(Math.min(total, 96));
}

function setIntensity(value) {
  state.intensity = clamp(Math.round(value), 0, 100);

  document.documentElement.style.setProperty("--reading", `${state.intensity}%`);

  if (meterFill) meterFill.style.width = `${state.intensity}%`;

  if (meterLabel) {
    meterLabel.textContent = `suspicion / ${state.intensity}%`;
  }
}

function updateEditCount() {
  const count = state.usedEditOrder.length + (state.escalated ? 1 : 0);

  if (editCount) {
    editCount.textContent = `exhibits submitted / ${count}`;
  }
}

function swapTeddy(src) {
  if (!teddy || state.currentTeddy === src) return;

  teddy.classList.add("switching");

  setTimeout(() => {
    teddy.src = src;
    state.currentTeddy = src;

    requestAnimationFrame(() => {
      teddy.classList.remove("switching");
    });
  }, 220);
}

function addCommitPulse() {
  if (!scene) return;

  scene.animate(
    [
      { filter: "brightness(1)" },
      { filter: "brightness(0.92)" },
      { filter: "brightness(1)" }
    ],
    {
      duration: 520,
      easing: "ease-out"
    }
  );
}

function addCommitFlash() {
  if (!app) return;

  app.classList.add("flash");

  setTimeout(() => {
    app.classList.remove("flash");
  }, 850);
}

/* =========================================================
   CAPTIONS
   ========================================================= */

function startCaptionCycle() {
  clearInterval(state.captionTimer);

  state.captionIndex = 0;

  if (captionText) {
    captionText.textContent = captionLines[state.captionIndex];
  }

  state.captionTimer = setInterval(() => {
    if (state.finished || state.finalSequenceStarted) return;

    state.captionIndex = (state.captionIndex + 1) % captionLines.length;

    if (captionText) {
      captionText.textContent = captionLines[state.captionIndex];
    }
  }, 2800);
}

/* =========================================================
   WHOLE-WEB GLITCH
   ========================================================= */

function startOccasionalGlitches() {
  stopOccasionalGlitches();

  function scheduleNext() {
    if (!state.started || state.finished || state.finalSequenceStarted) return;

    const delay = randomBetween(6500, 12500);

    state.glitchTimer = setTimeout(() => {
      if (!state.started || state.finished || state.finalSequenceStarted) return;

      const chance =
        state.intensity < 30 ? 0.35 :
        state.intensity < 70 ? 0.58 :
        0.82;

      if (Math.random() < chance) {
        triggerWholeWebGlitch(randomBetween(160, 360));
      }

      scheduleNext();
    }, delay);
  }

  scheduleNext();
}

function stopOccasionalGlitches() {
  clearTimeout(state.glitchTimer);
  state.glitchTimer = null;
}

function triggerWholeWebGlitch(duration = 260) {
  if (!globalGlitch || state.finished || !app) return;

  app.classList.add("glitching");
  globalGlitch.classList.add("active");

  setTimeout(() => {
    if (!state.finalSequenceStarted) {
      app.classList.remove("glitching");
      globalGlitch.classList.remove("active");
    }
  }, duration);
}

/* =========================================================
   AUDIO
   ========================================================= */

function unlockAudioContext() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    setupWhisperPanner();
  } catch {
    /* Web Audio unavailable. Normal audio still works. */
  }
}

function setupWhisperPanner() {
  if (!audioContext || !whisperAudio || whisperSource) return;

  try {
    whisperSource = audioContext.createMediaElementSource(whisperAudio);
    whisperPanner = audioContext.createStereoPanner();
    whisperGain = audioContext.createGain();

    whisperGain.gain.value = 0;

    whisperSource
      .connect(whisperPanner)
      .connect(whisperGain)
      .connect(audioContext.destination);
  } catch {
    whisperSource = null;
    whisperPanner = null;
    whisperGain = null;
  }
}

function startBaseAtmosphere() {
  startLoop(breatheAudio, 0.022, 0.88);
  startLoop(creepyBgAudio, 0.04, 0.9);
}

function playOneShot(audio, volume = 0.15, rate = 1) {
  if (!audio || state.muted) return;

  try {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = clamp(volume, 0, 1);
    audio.playbackRate = rate;
    audio.play();
  } catch {}
}

function startLoop(audio, volume = 0.05, rate = 1) {
  if (!audio) return;

  try {
    audio.loop = true;
    audio.playbackRate = rate;
    audio.volume = state.muted ? 0 : clamp(volume, 0, 1);

    if (audio.paused) {
      audio.currentTime = 0;
      audio.play();
    }
  } catch {}
}

function startPannedWhispers(volume = 0.3) {
  if (!whisperAudio || state.muted) return;

  unlockAudioContext();

  try {
    whisperAudio.loop = true;
    whisperAudio.muted = false;
    whisperAudio.volume = clamp(volume, 0, 1);
    whisperAudio.playbackRate = 0.95;

    if (whisperAudio.paused) {
      whisperAudio.currentTime = 0;
      whisperAudio.play().catch((error) => {
        console.warn("Whisper audio could not play:", error);
      });
    }

    if (whisperGain && whisperPanner && audioContext) {
      setWhisperGain(volume);
      animateWhisperPan();
    }
  } catch (error) {
    console.warn("Whisper setup failed:", error);
  }
}

function animateWhisperPan() {
  if (!whisperPanner || !audioContext) return;

  cancelAnimationFrame(whisperPanRaf);

  const startedAt = performance.now();

  function frame(now) {
    if (state.finished || !state.started || state.muted) return;

    const t = (now - startedAt) / 1000;

    const pan =
      Math.sin(t * 0.85) * 0.75 +
      Math.sin(t * 1.71 + 1.2) * 0.2;

    whisperPanner.pan.setTargetAtTime(
      clamp(pan, -1, 1),
      audioContext.currentTime,
      0.08
    );

    whisperPanRaf = requestAnimationFrame(frame);
  }

  whisperPanRaf = requestAnimationFrame(frame);
}

function setWhisperGain(target, duration = 700) {
  if (!whisperGain || !audioContext) return;

  const value = state.muted ? 0 : clamp(target, 0, 1);

  whisperGain.gain.cancelScheduledValues(audioContext.currentTime);
  whisperGain.gain.setTargetAtTime(value, audioContext.currentTime, duration / 3000);
}

function stopWhisperPan() {
  cancelAnimationFrame(whisperPanRaf);
  whisperPanRaf = null;

  if (whisperGain && audioContext) {
    whisperGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.15);
  }
}

function setLoopVolume(audio, targetVolume, duration = 700) {
  if (!audio) return;

  const startVolume = audio.volume;
  const endVolume = state.muted ? 0 : clamp(targetVolume, 0, 1);
  const startTime = performance.now();

  function frame(now) {
    const progress = clamp((now - startTime) / duration, 0, 1);
    const eased = easeOut(progress);

    audio.volume = startVolume + (endVolume - startVolume) * eased;

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function updateAudioTension() {
  const level = state.intensity / 100;

  if (state.edits.life && heartAudio) {
    startLoop(heartAudio, 0.05 + level * 0.12, 0.82 + level * 0.25);
    setLoopVolume(heartAudio, 0.05 + level * 0.12, 900);
    heartAudio.playbackRate = 0.82 + level * 0.25;

    startPannedWhispers(0.05 + level * 0.08);
  }

  if ((state.edits.lights || state.edits.caption) && clockAudio) {
    startLoop(clockAudio, 0.018 + level * 0.09, 0.9 + level * 0.25);
    setLoopVolume(clockAudio, 0.018 + level * 0.09, 900);
    clockAudio.playbackRate = 0.9 + level * 0.25;
  }

  if (breatheAudio) {
    startLoop(breatheAudio, 0.02 + level * 0.1, 0.88 + level * 0.08);
    setLoopVolume(breatheAudio, 0.02 + level * 0.1, 900);
    breatheAudio.playbackRate = 0.88 + level * 0.08;
  }

  if (creepyBgAudio) {
    startLoop(creepyBgAudio, 0.035 + level * 0.13, 0.88);
    setLoopVolume(creepyBgAudio, 0.035 + level * 0.13, 900);
  }
}

function softenAudioForReveal() {
  setLoopVolume(heartAudio, 0.006, 1000);
  setLoopVolume(clockAudio, 0.004, 1000);
  setLoopVolume(breatheAudio, 0.01, 1000);
  setLoopVolume(creepyBgAudio, 0.018, 1000);
  setWhisperGain(0, 900);

  setTimeout(() => {
    loopAudios.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
    });

    stopWhisperPan();
  }, 1700);
}

function resetAudio() {
  stopWhisperPan();

  allAudios.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
    audio.volume = 0;
    audio.playbackRate = 1;
    audio.muted = state.muted;
  });
}

function toggleSound() {
  state.muted = !state.muted;

  allAudios.forEach((audio) => {
    audio.muted = state.muted;

    if (state.muted) {
      audio.volume = 0;
    }
  });

  if (whisperGain && audioContext) {
    whisperGain.gain.setTargetAtTime(
      state.muted ? 0 : 0.08,
      audioContext.currentTime,
      0.08
    );
  }

  if (soundIcon) {
    soundIcon.src = state.muted
      ? `${ASSET_PATH}sound_off_1.png`
      : `${ASSET_PATH}sound_on_1.png`;
  }

  if (!state.muted && state.started && !state.finished) {
    updateAudioTension();
  }
}

/* =========================================================
   PRELOAD
   ========================================================= */

function preloadImages(files) {
  files.forEach((file) => {
    const image = new Image();
    image.src = `${ASSET_PATH}${file}`;
  });
}

/* =========================================================
   VISIBILITY HELPERS
   ========================================================= */

function show(element) {
  if (!element) return;
  element.classList.remove("hidden");
  element.style.display = "";
}

function hide(element) {
  if (!element) return;
  element.classList.add("hidden");
}

function safeClick(element, handler) {
  if (!element) return;
  element.addEventListener("click", handler);
}

/* =========================================================
   UTILS
   ========================================================= */

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

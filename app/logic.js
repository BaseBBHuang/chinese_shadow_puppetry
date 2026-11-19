(function (root) {
  'use strict';
  var SPEC = {
    puppetDepth: 0.65, maxLampDepth: 0.45,
    anchorX: 157, anchorY: 405, baseHeight: 190, aspect: 580 / 760,
    handX: 0.95, handY: 0.155,
    moonX: 272, moonY: 116, moonRadius: 26,
    handRadius: 5, tolerance: 5, contactMs: 300, celebrationMs: 2600
  };
  function clamp(value, lo, hi) { return Math.max(lo, Math.min(hi, value)); }
  function projection(position) {
    var depth = clamp(position, 0, 1) * SPEC.maxLampDepth;
    var magnification = (1 - depth) / (SPEC.puppetDepth - depth);
    var scale = magnification * SPEC.puppetDepth;
    var height = SPEC.baseHeight * scale;
    var width = height * SPEC.aspect;
    var x = SPEC.anchorX - width / 2;
    var y = SPEC.anchorY - height;
    var handX = x + width * SPEC.handX;
    var handY = y + height * SPEC.handY;
    var distance = Math.sqrt(Math.pow(handX - SPEC.moonX, 2) + Math.pow(handY - SPEC.moonY, 2));
    return { x:x, y:y, width:width, height:height, handX:handX, handY:handY,
      magnification:magnification, distance:distance,
      touching:distance <= SPEC.moonRadius + SPEC.handRadius + SPEC.tolerance,
      near:distance < SPEC.moonRadius + 49 };
  }
  function Game() { this.reset(); }
  Game.prototype.reset = function () {
    this.position = 0; this.phase = 'playing'; this.contact = 0;
    this.elapsed = 0; this.interacted = false; this.paused = false;
  };
  Game.prototype.move = function (value) {
    if (this.phase !== 'playing' || this.paused || !Number.isFinite(value)) return false;
    this.position = clamp(value, 0, 1); this.interacted = true;
    if (!projection(this.position).touching) this.contact = 0;
    return true;
  };
  Game.prototype.step = function (delta) {
    if (this.paused) return;
    var dt = clamp(Number(delta) || 0, 0, 50);
    if (this.phase === 'playing') {
      if (this.interacted && projection(this.position).touching) {
        this.contact += dt;
        if (this.contact >= SPEC.contactMs) { this.phase = 'celebrating'; this.elapsed = 0; }
      } else this.contact = 0;
    } else if (this.phase === 'celebrating') {
      this.elapsed += dt;
      if (this.elapsed >= SPEC.celebrationMs) this.phase = 'complete';
    }
  };
  Game.prototype.pause = function () { this.paused = true; this.contact = 0; };
  Game.prototype.resume = function () { this.paused = false; this.contact = 0; };
  root.ShadowGame = { Game:Game, projection:projection, spec:SPEC };
})(typeof window !== 'undefined' ? window : this);

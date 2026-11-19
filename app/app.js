(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var game = new window.ShadowGame.Game();
  var elements = { shell:$('game'), lamp:$('lamp'), tray:$('tray'), projection:$('projection'),
    guide:$('guide'), goal:$('goal'), arrow:$('drag-arrow'), glow:$('moon-glow'), ring:$('contact-ring') };
  var ready = false, dragging = false, pointerId = null, startX = 0, startPosition = 0;
  var raf = 0, previousTime = 0, idleTimer = 0, hintTimer = 0, loadToken = 0;
  var previousPhase = 'playing', previousMessage = '', hinting = false, admiring = false;
  var contactSuspended = false, platformVersion = 0, windowRequest = 0;
  function message(text) {
    if (previousMessage !== text) { elements.guide.textContent = text; previousMessage = text; }
  }
  function activeClass(name, value) { elements.shell.classList.toggle(name, value); }
  function setHint(value) {
    hinting = value; activeClass('is-hinting', value);
    elements.arrow.style.display = value || !game.interacted ? '' : 'none';
  }
  function clearIdle() { clearTimeout(idleTimer); clearTimeout(hintTimer); }
  function scheduleIdle() {
    clearTimeout(idleTimer);
    if (!ready || game.phase !== 'playing' || game.paused) return;
    idleTimer = setTimeout(function () {
      if (!dragging && game.phase === 'playing' && !game.paused) showHint();
    }, 8000);
  }
  function showHint() {
    if (!ready || game.phase !== 'playing') return;
    clearTimeout(hintTimer); setHint(true);
    message('把灯推近，小兔的影子会变大。');
    hintTimer = setTimeout(function () { setHint(false); render(); }, 4000);
  }
  function render() {
    var p = window.ShadowGame.projection(game.position);
    elements.projection.setAttribute('x', p.x.toFixed(2));
    elements.projection.setAttribute('y', p.y.toFixed(2));
    elements.projection.setAttribute('width', p.width.toFixed(2));
    elements.projection.setAttribute('height', p.height.toFixed(2));
    elements.lamp.style.left = (16 + game.position * 32) + '%';
    elements.lamp.setAttribute('aria-valuenow', String(Math.round(game.position * 100)));
    elements.lamp.setAttribute('aria-valuetext', p.near ? '灯靠近皮影，兔影接近月亮' : '向右推近灯，兔影变大');
    elements.glow.setAttribute('opacity', game.phase === 'playing' ? (p.near ? '.65' : '.2') : '.8');
    elements.ring.setAttribute('opacity', game.contact > 0 ? String(game.contact / 300 * .8) : '0');
    if (game.phase === 'playing' && !hinting) {
      message(p.touching ? '碰到了，稳住这一束光…' : p.near ? '快碰到月亮了' : '把灯推近，小兔的影子会变大。');
    }
    if (previousPhase !== game.phase) {
      if (game.phase === 'celebrating') celebrate();
      if (game.phase === 'complete') complete();
      previousPhase = game.phase;
    }
  }
  function needsFrames() {
    return !game.paused && !contactSuspended &&
      (game.phase === 'celebrating' || (game.phase === 'playing' && game.interacted && window.ShadowGame.projection(game.position).touching));
  }
  function frame(time) {
    raf = 0;
    if (game.paused) return;
    var dt = previousTime ? time - previousTime : 0;
    previousTime = time;
    if (!contactSuspended) game.step(dt);
    render();
    if (needsFrames()) raf = requestAnimationFrame(frame); else previousTime = 0;
  }
  function wake() {
    if (!raf && !game.paused) { previousTime = 0; raf = requestAnimationFrame(frame); }
  }
  function releaseCapture() {
    if (pointerId !== null && elements.lamp.releasePointerCapture) {
      try { elements.lamp.releasePointerCapture(pointerId); } catch (e) { /* Already released. */ }
    }
    pointerId = null;
  }
  function endDrag(cancelled) {
    dragging = false; activeClass('is-dragging', false); releaseCapture();
    if (cancelled) { game.contact = 0; contactSuspended = true; }
    scheduleIdle(); render();
  }
  function beginDrag(x, id) {
    if (!ready || game.phase !== 'playing' || game.paused || dragging) return false;
    dragging = true; pointerId = id; startX = x; startPosition = game.position;
    contactSuspended = false; clearIdle(); setHint(false); activeClass('is-dragging', true);
    game.move(game.position); render(); return true;
  }
  function dragTo(x) {
    if (!dragging) return;
    var rect = elements.tray.getBoundingClientRect();
    game.move(startPosition + (x - startX) / (rect.width * .32));
    render(); wake();
  }
  if (window.PointerEvent) {
    elements.lamp.addEventListener('pointerdown', function (e) {
      if (e.isPrimary === false || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (!beginDrag(e.clientX, e.pointerId)) return;
      e.preventDefault();
      if (elements.lamp.setPointerCapture) { try { elements.lamp.setPointerCapture(e.pointerId); } catch (err) {} }
    });
    window.addEventListener('pointermove', function (e) {
      if (dragging && e.pointerId === pointerId) { e.preventDefault(); dragTo(e.clientX); }
    }, { passive:false });
    window.addEventListener('pointerup', function (e) { if (dragging && e.pointerId === pointerId) endDrag(false); });
    window.addEventListener('pointercancel', function (e) { if (dragging && e.pointerId === pointerId) endDrag(true); });
    elements.lamp.addEventListener('lostpointercapture', function () { if (dragging) endDrag(true); });
  } else {
    function touchAt(list) { for (var i=0;i<list.length;i++) if (list[i].identifier === pointerId) return list[i]; return null; }
    elements.lamp.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      if (beginDrag(e.changedTouches[0].clientX, e.changedTouches[0].identifier)) e.preventDefault();
    }, { passive:false });
    window.addEventListener('touchmove', function (e) { var t=touchAt(e.changedTouches); if (dragging && t) { e.preventDefault(); dragTo(t.clientX); } }, { passive:false });
    window.addEventListener('touchend', function (e) { if (dragging && touchAt(e.changedTouches)) endDrag(false); });
    window.addEventListener('touchcancel', function (e) { if (dragging && touchAt(e.changedTouches)) endDrag(true); });
    elements.lamp.addEventListener('mousedown', function (e) { if (e.button===0 && beginDrag(e.clientX,'mouse')) e.preventDefault(); });
    window.addEventListener('mousemove', function (e) { if (pointerId==='mouse') dragTo(e.clientX); });
    window.addEventListener('mouseup', function () { if (pointerId==='mouse' && dragging) endDrag(false); });
  }
  elements.lamp.addEventListener('keydown', function (e) {
    if (!ready || game.phase !== 'playing' || game.paused) return;
    var value=game.position;
    if (e.key==='ArrowRight' || e.key==='ArrowUp') value+=.02;
    else if (e.key==='ArrowLeft' || e.key==='ArrowDown') value-=.02;
    else if (e.key==='Home') value=0;
    else if (e.key==='End') value=1;
    else return;
    e.preventDefault(); contactSuspended=false; setHint(false); game.move(value); render(); wake(); scheduleIdle();
  });
  function celebrate() {
    clearIdle(); setHint(false); dragging=false; releaseCapture(); activeClass('is-dragging',false);
    activeClass('is-celebrating',true); activeClass('is-success',true);
    elements.lamp.tabIndex=-1; elements.lamp.setAttribute('aria-disabled','true');
    $('reset').disabled=true; $('hint').disabled=true;
    elements.goal.textContent='好戏，成了！'; message('今晚的月亮，被你摘下来了。');
    $('scene-title').textContent='小兔的影子终于触到了月亮，月光轻轻亮起';
    var mini=window.xhs && window.xhs.miniTool;
    if (platformVersion>=9500 && mini && typeof mini.vibrateShort==='function') {
      try { var result=mini.vibrateShort({ type:'light' }); if (result && result.catch) result.catch(function () {}); } catch (err) {}
    }
  }
  function complete() {
    activeClass('is-celebrating',false); $('sparkles').setAttribute('opacity','.65');
    $('play-actions').hidden=true; $('success-actions').hidden=false;
    $('footer-note').textContent='今夜，你为小兔点亮了月亮';
  }
  function reset() {
    if (!ready) return;
    clearIdle(); if (raf) cancelAnimationFrame(raf); raf=0; previousTime=0;
    dragging=false; releaseCapture(); game.reset(); previousPhase='playing'; contactSuspended=false; admiring=false;
    ['is-celebrating','is-success','is-admiring','is-dragging'].forEach(function (c) { activeClass(c,false); });
    elements.lamp.tabIndex=0; elements.lamp.setAttribute('aria-disabled','false');
    elements.goal.textContent='让兔影碰到月亮'; $('scene-title').textContent='小兔举起手，等待你用灯光帮助它够到月亮';
    $('sparkles').setAttribute('opacity','0'); $('play-actions').hidden=false; $('success-actions').hidden=true; $('admire-actions').hidden=true;
    $('reset').disabled=false; $('hint').disabled=false; $('footer-note').textContent='一束光 · 一台戏';
    setHint(false); render(); scheduleIdle();
  }
  $('reset').addEventListener('click',reset); $('replay').addEventListener('click',reset); $('hint').addEventListener('click',showHint);
  $('admire').addEventListener('click',function () {
    admiring=true; activeClass('is-admiring',true); $('success-actions').hidden=true; $('admire-actions').hidden=false;
    elements.goal.textContent='今晚的月亮，是你摘下来的'; $('curtain-caption').setAttribute('aria-hidden','false');
  });
  $('back').addEventListener('click',function () {
    admiring=false; activeClass('is-admiring',false); $('success-actions').hidden=false; $('admire-actions').hidden=true;
    elements.goal.textContent='好戏，成了！'; $('curtain-caption').setAttribute('aria-hidden','true');
  });
  function pause() {
    if (game.paused) return;
    if (dragging) endDrag(true); game.pause(); clearIdle();
    if (raf) cancelAnimationFrame(raf); raf=0; previousTime=0; activeClass('is-paused',true);
  }
  function resume() {
    if (!game.paused || document.hidden) return;
    game.resume(); contactSuspended=false; activeClass('is-paused',false); render(); wake(); scheduleIdle();
  }
  document.addEventListener('visibilitychange',function () { if (document.hidden) pause(); else resume(); });
  window.addEventListener('blur',pause); window.addEventListener('focus',resume);
  window.addEventListener('pagehide',pause); window.addEventListener('pageshow',resume);
  function withTimeout(promise) {
    return new Promise(function (resolve,reject) {
      var timer=setTimeout(function () { reject(new Error('platform timeout')); },1800);
      Promise.resolve(promise).then(function (value) { clearTimeout(timer); resolve(value); },function (err) { clearTimeout(timer); reject(err); });
    });
  }
  function readVersion(options) { return Math.floor(Number(options && options.miniToolEnv && options.miniToolEnv.buildVersion) / 1000) || 0; }
  function fitViewport() { elements.shell.style.setProperty('--app-height',window.innerHeight+'px'); }
  function applyWindowInfo(info) {
    if (!info || !Number.isFinite(info.windowHeight)) return;
    var top=info.safeArea && Number(info.safeArea.top) || 0;
    var bottom=info.safeArea && Number.isFinite(info.safeArea.bottom) ? Math.max(0,info.windowHeight-info.safeArea.bottom) : 0;
    var buttons=info.menuButtons || {};
    ['back','me','share'].forEach(function (name) {
      var button=buttons[name]; if (button && Number.isFinite(button.bottom) && button.top < info.windowHeight*.35) top=Math.max(top,button.bottom+5);
    });
    elements.shell.style.setProperty('--top-inset',Math.min(top,info.windowHeight*.3)+'px');
    elements.shell.style.setProperty('--bottom-inset',Math.min(bottom,80)+'px');
  }
  function readWindow() {
    var mini=window.xhs && window.xhs.miniTool; var id=++windowRequest;
    if (platformVersion<9490 || !mini || typeof mini.getWindowInfo!=='function') return;
    try { withTimeout(mini.getWindowInfo()).then(function (info) { if (id===windowRequest) applyWindowInfo(info); }).catch(function () {}); } catch (err) {}
  }
  function initPlatform() {
    var xhs=window.xhs; var mini=xhs && xhs.miniTool;
    platformVersion=readVersion(xhs && xhs.launchOptions);
    if (platformVersion) { readWindow(); return; }
    if (mini && typeof mini.getLaunchOptions==='function') {
      try { withTimeout(mini.getLaunchOptions()).then(function (value) { platformVersion=readVersion(value); readWindow(); }).catch(function () {}); } catch (err) {}
    }
  }
  var resizeTimer=0;
  window.addEventListener('resize',function () {
    fitViewport(); if (dragging) endDrag(true);
    clearTimeout(resizeTimer); resizeTimer=setTimeout(readWindow,150);
  });
  function loadArt() {
    var token=++loadToken, loaded=0, failed=false, timeout;
    ready=false; activeClass('is-loading',true); $('loading').hidden=false; $('retry').hidden=true;
    $('loading-text').textContent='正在点亮戏台…'; elements.lamp.tabIndex=-1;
    function fail() {
      if (token!==loadToken || failed) return;
      failed=true; clearTimeout(timeout); $('loading-text').textContent='戏台还没准备好，再点一次灯吧'; $('retry').hidden=false;
    }
    timeout=setTimeout(fail,15000);
    ['stage.webp','rabbit.webp','lamp.webp','moon.webp','wood.webp'].forEach(function (name) {
      var image=new Image();
      image.onload=function () {
        if (token!==loadToken || failed) return;
        loaded++;
        if (loaded===5) { clearTimeout(timeout); ready=true; activeClass('is-loading',false); $('loading').hidden=true; reset(); if (document.hidden) pause(); }
      };
      image.onerror=fail; image.src='./art/'+name;
    });
  }
  $('retry').addEventListener('click',loadArt);
  fitViewport(); initPlatform(); loadArt();
})();

'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync('app/logic.js','utf8'),context);
const {Game,projection,spec} = context.window.ShadowGame;
const tick = (g,ms) => { for(let t=0;t<ms;t+=10)g.step(Math.min(10,ms-t)); };
const contactPositions = Array.from({length:1001},(_,i)=>i/1000).filter(p=>projection(p).touching);
const target = contactPositions[Math.floor(contactPositions.length/2)];

test('the lamp has a solvable contact interval and the initial state cannot win',()=>{
 assert.equal(projection(0).touching,false);
 assert.ok(contactPositions.length>50,'finger contact must not require pixel precision');
 assert.ok(target>0.3 && target<1);
 const g=new Game(); tick(g,10000); assert.equal(g.phase,'playing');
});
test('moving the lamp closer enlarges the same silhouette continuously around one anchor',()=>{
 let prev=0;
 for(let i=0;i<=100;i++){
  const p=projection(i/100);
  assert.ok(p.height>prev); prev=p.height;
  assert.ok(Math.abs(p.width/p.height-spec.aspect)<1e-10);
  assert.ok(Math.abs(p.y+p.height-spec.anchorY)<1e-10);
  assert.ok(Math.abs(p.x+p.width/2-spec.anchorX)<1e-10);
  assert.ok(p.x>=0 && p.y>=0 && p.x+p.width<=390 && p.y+p.height<=420,'entire rabbit stays in view');
 }
});
test('short contact is insufficient; leaving the target resets the dwell',()=>{
 const g=new Game(); g.move(target);tick(g,290);assert.equal(g.phase,'playing');
 g.move(0);assert.equal(g.contact,0);g.move(target);tick(g,290);assert.equal(g.phase,'playing');
 tick(g,10);assert.equal(g.phase,'celebrating');
});
test('after contact, controls lock during the animation and completion waits for it',()=>{
 const g=new Game();g.move(target);tick(g,300);const locked=g.position;
 assert.equal(g.move(0),false);assert.equal(g.position,locked);
 tick(g,2590);assert.equal(g.phase,'celebrating');tick(g,10);assert.equal(g.phase,'complete');
});
test('pause clears pending contact and never accumulates background time',()=>{
 const g=new Game();g.move(target);tick(g,250);g.pause();tick(g,6000);assert.equal(g.phase,'playing');assert.equal(g.contact,0);
 g.resume();tick(g,290);assert.equal(g.phase,'playing');tick(g,10);assert.equal(g.phase,'celebrating');
 tick(g,800);g.pause();tick(g,6000);assert.equal(g.elapsed,800);g.resume();tick(g,1800);assert.equal(g.phase,'complete');
});
test('reset clears all progress, locks and elapsed animation state',()=>{
 const g=new Game();g.move(target);tick(g,3000);g.reset();assert.equal(g.phase,'playing');assert.equal(g.position,0);assert.equal(g.interacted,false);assert.equal(g.elapsed,0);assert.equal(g.contact,0);
});
test('out-of-range and non-finite input never corrupt projection or game state',()=>{
 const g=new Game();g.move(-100);assert.equal(g.position,0);g.move(100);assert.equal(g.position,1);
 assert.equal(g.move(NaN),false);assert.equal(g.move(Infinity),false);assert.equal(g.position,1);
 g.move(target);g.step(10000);assert.equal(g.phase,'playing');assert.equal(g.contact,50);
});
console.log('Contact position interval:',contactPositions[0],contactPositions.at(-1),'test midpoint:',target);

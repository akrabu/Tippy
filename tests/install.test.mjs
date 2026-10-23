import test from 'node:test';
import assert from 'node:assert/strict';
import { getInstallPlatform, requestNativeInstall } from '../dist/install.mjs';

test('iPhones and iPads show the Safari guide first',()=>{
  assert.equal(getInstallPlatform({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)'}),'ios');
  assert.equal(getInstallPlatform({userAgent:'Mozilla/5.0 (iPad; CPU OS 26_0 like Mac OS X)'}),'ios');
});
test('desktop-style iPad identification does not misclassify a Mac',()=>{
  assert.equal(getInstallPlatform({userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',platform:'MacIntel',maxTouchPoints:5}),'ios');
  assert.equal(getInstallPlatform({userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',platform:'MacIntel',maxTouchPoints:0}),'other');
});
test('Android shows the Chrome guide first and desktop keeps both guides',()=>{
  assert.equal(getInstallPlatform({userAgent:'Mozilla/5.0 (Linux; Android 16) Chrome/142 Mobile Safari/537.36'}),'android');
  assert.equal(getInstallPlatform({userAgent:'Mozilla/5.0 (Windows NT 10.0) Chrome/142 Safari/537.36'}),'other');
});
test('native install prompts once and waits for the user choice',async()=>{
  let prompted=0, resolveChoice;
  const choice=new Promise(resolve=>resolveChoice=resolve);
  const request=requestNativeInstall({prompt:async()=>{prompted++;},userChoice:choice});
  await Promise.resolve();
  assert.equal(prompted,1);
  resolveChoice({outcome:'accepted'});
  assert.equal(await request,'accepted');
});
test('dismissing installation remains a normal outcome',async()=>{
  assert.equal(await requestNativeInstall({prompt:async()=>{},userChoice:Promise.resolve({outcome:'dismissed'})}),'dismissed');
});
test('missing or failed prompts allow the manual guide to remain usable',async()=>{
  assert.equal(await requestNativeInstall(null),'unavailable');
  assert.equal(await requestNativeInstall({prompt:async()=>{throw new Error('Prompt unavailable');}}),'unavailable');
});

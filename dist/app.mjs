import { DEFAULT_PREFERENCES, calculate, enterDigit, hasExpired } from './calc.mjs';
import { getInstallPlatform, requestNativeInstall } from './install.mjs';

const $ = (selector) => document.querySelector(selector);
const root = document.documentElement;
const themes = [
  { id:'classic', name:'Classic Tippy', dark:['linear-gradient(#222337,#080b0e)','#ffffff','#77ffdf'], light:['#ffffff','#050505','#1d7564'] },
  { id:'forest', name:'Forest', dark:['#30434b','#d0d7cb','#8aaf91'], light:['#ced6ca','#527b70','#30434b'] },
  { id:'sky', name:'Sky', dark:['linear-gradient(#0d233c,#194d79)','#f0d1b4','#e8a58e'], light:['linear-gradient(#99afe0,#efb197)','#0e2941','#1c4e7a'] },
  { id:'ocean', name:'Ocean', dark:['#2a535c','#e5b78c','#f5ebdf'], light:['#f5ece1','#22a789','#2a535c'] },
  { id:'sunset', name:'Sunset', dark:['linear-gradient(#515c7e,#77718d)','#e7b297','#da7786'], light:['linear-gradient(#e4b497,#d77986)','#685b77','#405f7e'] },
  { id:'autumn', name:'Autumn', dark:['#54292c','#f1d79a','#b65f4d'], light:['#d9af98','#b3604f','#54292c'] },
  { id:'winter', name:'Winter', dark:['#102d46','#dfd2c7','#c5d2d6'], light:['#dfd2c7','#89a6b6','#102d46'] },
  { id:'mardi-gras', name:'Mardi Gras', dark:['#242424','#f0db49','#f5f5f5'], light:['#f5f5f5','#781a81','#242424'] },
];
const choices = {
  rounding:[['none','No Rounding'],['tip','Round Tip'],['total','Round Total']],
  layout:[['phone','Phone'],['calculator','Calculator']],
  appearance:[['automatic','Automatic'],['light','Light'],['dark','Dark']],
};
function readStorage(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
const saved = readStorage('tipsy.preferences') || {};
const preferences = { ...DEFAULT_PREFERENCES };
for (const field of ['rounding','layout','appearance']) if (choices[field].some(([id]) => id === saved[field])) preferences[field] = saved[field];
if (themes.some(({id}) => id === saved.theme)) preferences.theme = saved.theme;
for (const field of ['showRounding','tapRounding','autoClear']) if (typeof saved[field] === 'boolean') preferences[field] = saved[field];
if (Number.isFinite(saved.rate) && saved.rate >= 0 && saved.rate <= 100) preferences.rate = saved.rate;
if (Number.isInteger(saved.people) && saved.people >= 1 && saved.people <= 30) preferences.people = saved.people;
const previous = readStorage('tipsy.bill');
let billCents = previous && Number.isSafeInteger(previous.cents) && previous.cents >= 0 && previous.cents <= 999999999 && (!preferences.autoClear || !hasExpired(previous.lastActive)) ? previous.cents : 0;
let lastActive = previous?.lastActive || Date.now();
let announceTimer, expiryTimer, installPrompt, installConfirmed = false;
const colorQuery = matchMedia('(prefers-color-scheme: light)');
const standaloneQuery = matchMedia('(display-mode: standalone)');
const money = new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' });
const rates = [...new Set([0,5,10,12,15,18,20,22,25,30,35,40,50,75,100,preferences.rate])].sort((a,b)=>a-b);
const settings = $('#settings');
const wheelState = new Map();

function persist() {
  try {
    localStorage.setItem('tipsy.preferences', JSON.stringify(preferences));
    localStorage.setItem('tipsy.bill', JSON.stringify({ cents:billCents, lastActive }));
  } catch {}
}
function activity() { lastActive = Date.now(); scheduleExpiry(); persist(); }
function scheduleExpiry() {
  clearTimeout(expiryTimer);
  if (preferences.autoClear && billCents) expiryTimer = setTimeout(checkExpiry, Math.max(0, 900000 - (Date.now() - lastActive)));
}
function checkExpiry() {
  if (preferences.autoClear && hasExpired(lastActive)) { billCents = 0; renderAmounts(); persist(); }
  scheduleExpiry();
}
function applyAppearance() {
  const resolved = preferences.appearance === 'automatic' ? (colorQuery.matches ? 'light' : 'dark') : preferences.appearance;
  root.dataset.appearance = resolved;
  root.dataset.theme = preferences.theme;
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue('--background-top').trim();
  document.querySelectorAll('.theme-row').forEach((row) => {
    const colors = themes.find((theme)=>theme.id === row.dataset.value)[resolved];
    row.querySelectorAll('.swatch i').forEach((stripe,i) => stripe.style.background = colors[i]);
  });
}
function updateAmount(id, cents) {
  const element = $(id);
  element.textContent = money.format(cents / 100);
  element.classList.toggle('compact', element.textContent.length > 8);
  element.classList.toggle('very-compact', element.textContent.length > 10);
}
function renderAmounts(announce = false) {
  const result = calculate(billCents, preferences.rate, preferences.people, preferences.rounding);
  updateAmount('#bill', result.billCents);
  updateAmount('#tip', result.tipEachCents);
  updateAmount('#total', result.totalEachCents);
  $('#tip-indicator').hidden = !(preferences.showRounding && preferences.rounding === 'tip');
  $('#total-indicator').hidden = !(preferences.showRounding && preferences.rounding === 'total');
  $('#each-indicator').hidden = preferences.people === 1;
  $('#tip-button').setAttribute('aria-label', `Tip${preferences.people > 1 ? ' per person' : ''} ${money.format(result.tipEachCents/100)}${preferences.tapRounding ? ', tap to '+(preferences.rounding === 'tip' ? 'stop rounding' : 'round tip') : ''}`);
  $('#total-button').setAttribute('aria-label', `Total${preferences.people > 1 ? ' per person' : ''} ${money.format(result.totalEachCents/100)}${preferences.tapRounding ? ', tap to '+(preferences.rounding === 'total' ? 'stop rounding' : 'round total') : ''}`);
  if (announce) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => $('#announcement').textContent = `Bill ${money.format(billCents/100)}. ${preferences.rate} percent tip. Tip ${money.format(result.tipEachCents/100)}, total ${money.format(result.totalEachCents/100)}${preferences.people > 1 ? ' each, split '+preferences.people+' ways' : ''}.`, 300);
  }
}
function choiceRow(value, label, field, theme = null) {
  const row = document.createElement('button');
  row.type = 'button'; row.className = 'setting-row' + (theme ? ' theme-row' : '');
  row.dataset.value = value; row.dataset.field = field;
  const text = document.createElement('span'); text.textContent = label; row.append(text);
  if (theme) { const swatch=document.createElement('span');swatch.className='swatch';swatch.setAttribute('aria-hidden','true');for(let i=0;i<3;i++)swatch.append(document.createElement('i'));row.append(swatch); }
  row.insertAdjacentHTML('beforeend', '<svg class="check" aria-hidden="true"><use href="#check-icon"/></svg>');
  row.addEventListener('click', () => setPreference(field,value));
  return row;
}
function renderSettings() {
  document.querySelectorAll('[data-field]').forEach((row)=>row.setAttribute('aria-pressed', String(preferences[row.dataset.field] === row.dataset.value)));
  for (const [id,field] of [['show-rounding','showRounding'],['tap-rounding','tapRounding'],['auto-clear','autoClear']]) $('#'+id).checked = preferences[field];
}
function setPreference(field, value) {
  preferences[field] = value;
  if (field === 'layout') renderKeypad();
  if (field === 'appearance' || field === 'theme') applyAppearance();
  renderSettings(); renderAmounts(true); activity();
}
function createWheel(id, values, field, isPeople = false) {
  const element = $(id);
  const state = { values, field, element, target: null };
  wheelState.set(field,state);
  for(const value of values) {
    const option = document.createElement('div');
    option.className='wheel-option';option.role='option'; option.dataset.value=value;
    option.id = `${field}-${String(value).replace('.','-')}`;
    option.setAttribute('aria-label', isPeople ? `${value} ${value === 1 ? 'person' : 'people'}` : `${value} percent`);
    if(isPeople) option.innerHTML='<svg aria-hidden="true"><use href="#person-icon"/></svg>';
    option.append(document.createTextNode(isPeople ? String(value) : value+'%'));
    option.addEventListener('click',()=>selectWheel(field,value));
    element.append(option);
  }
  const markSelected = () => {
    element.querySelectorAll('[role="option"]').forEach((option)=>option.setAttribute('aria-selected', String(Number(option.dataset.value) === preferences[field])));
    element.setAttribute('aria-activedescendant', `${field}-${String(preferences[field]).replace('.','-')}`);
  };
  state.markSelected = markSelected;
  element.addEventListener('scroll', () => {
    const index = Math.max(0, Math.min(values.length-1,Math.round(element.scrollTop/30)));
    if(state.target !== null) {
      if(Math.abs(element.scrollTop - state.target) < 1) state.target = null;
      else return;
    }
    if(preferences[field] !== values[index]) { preferences[field]=values[index];markSelected();renderAmounts(true);activity(); }
  }, {passive:true});
  element.addEventListener('pointerdown',()=>state.target=null);
  element.addEventListener('wheel',()=>state.target=null,{passive:true});
  element.addEventListener('keydown',(event)=>{
    const index=values.indexOf(preferences[field]);let next;
    if(event.key==='ArrowUp') next=values[Math.max(0,index-1)];
    if(event.key==='ArrowDown') next=values[Math.min(values.length-1,index+1)];
    if(event.key==='Home') next=values[0];
    if(event.key==='End') next=values.at(-1);
    if(next!==undefined){event.preventDefault();selectWheel(field,next);}
    if(!isPeople && event.key==='Enter'){event.preventDefault();openCustomTip();}
  });
  if(!isPeople) element.addEventListener('dblclick',openCustomTip);
  markSelected();
  requestAnimationFrame(()=>{state.target=values.indexOf(preferences[field])*30;element.scrollTop=state.target;});
}
function selectWheel(field,value) {
  const state=wheelState.get(field);
  preferences[field]=value;state.markSelected();
  state.target=state.values.indexOf(value)*30;
  state.element.scrollTo({top:state.target,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  renderAmounts(true);activity();
}
function renderKeypad() {
  const digits = preferences.layout === 'phone' ? [1,2,3,4,5,6,7,8,9,'clear',0,'backspace'] : [7,8,9,4,5,6,1,2,3,'clear',0,'backspace'];
  $('#keypad').replaceChildren(...digits.map((value)=>{
    const button=document.createElement('button');button.type='button';button.className='key';button.dataset.action=value;
    if(typeof value==='number') {button.textContent=value;button.setAttribute('aria-label',String(value));}
    else {button.classList.add('utility');button.setAttribute('aria-label',value==='clear'?'Clear bill':'Delete last digit');button.innerHTML=`<svg aria-hidden="true"><use href="#${value === 'clear' ? 'clear' : 'backspace'}-icon"/></svg>`;}
    button.addEventListener('click',()=>input(value));return button;
  }));
}
function input(action) {
  checkExpiry();
  billCents = action === 'clear' ? 0 : action === 'backspace' ? Math.floor(billCents/10) : enterDigit(billCents, action);
  renderAmounts(true);activity();
}
function openCustomTip() { $('#custom-tip-input').value=preferences.rate;$('#custom-tip-dialog').showModal();$('#custom-tip-input').select(); }

for (const [field,entries] of Object.entries(choices)) entries.forEach(([value,label])=>$('#'+field+'-options').append(choiceRow(value,label,field)));
themes.forEach((theme)=>$('#theme-options').append(choiceRow(theme.id,theme.name,'theme',theme)));
for (const [id,field] of [['show-rounding','showRounding'],['tap-rounding','tapRounding'],['auto-clear','autoClear']]) $('#'+id).addEventListener('change',(event)=>setPreference(field,event.target.checked));
$('#settings-button').addEventListener('click',()=>{renderSettings();updateInstallHelp();settings.showModal();$('.settings-content').scrollTop=0;$('#settings-title').focus({preventScroll:true});});
$('#close-settings').addEventListener('click',()=>settings.close());
settings.addEventListener('click',(event)=>{if(event.target === settings){const rect=settings.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)settings.close();}});
for (const mode of ['tip','total']) $('#'+mode+'-button').addEventListener('click',()=>{if(preferences.tapRounding)setPreference('rounding',preferences.rounding === mode ? 'none' : mode);});
document.addEventListener('keydown',(event)=>{
  if(document.querySelector('dialog[open]') || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('.wheel-scroll'))return;
  let action;
  if(/^\d$/.test(event.key))action=Number(event.key);
  if(event.key==='Backspace'||event.key==='Delete')action='backspace';
  if(event.key==='Escape'||event.key.toLowerCase()==='c')action='clear';
  if(action!==undefined){event.preventDefault();input(action);const button=$(`[data-action="${action}"]`);button?.classList.add('pressed');setTimeout(()=>button?.classList.remove('pressed'),100);}
});
$('#custom-tip-form').addEventListener('submit',(event)=>{
  event.preventDefault();const value=Number($('#custom-tip-input').value);
  if(!Number.isFinite(value)||value<0||value>100)return;
  if(!rates.includes(value)){rates.push(value);rates.sort((a,b)=>a-b);$('#tip-options').replaceWith($('#tip-options').cloneNode(false));createWheel('#tip-options',rates,'rate');}
  selectWheel('rate',value);$('#custom-tip-dialog').close();
});
$('#cancel-custom-tip').addEventListener('click',()=>$('#custom-tip-dialog').close());
function updateInstallHelp() {
  const installed = standaloneQuery.matches || navigator.standalone === true || installConfirmed;
  const section = $('#install-section');
  if (installed) $('.settings-footer').before(section);
  else $('.settings-content').prepend(section);
  $('#install-entry-label').textContent = installed ? 'Installation help' : 'Install Tippy';
  $('#install-caption').textContent = installed ? 'How to add Tippy to a Home Screen.' : 'Add Tippy to your Home Screen for quick access.';
  $('#already-installed').hidden = !installed;
  const canInstall = !installed && !!installPrompt;
  $('#native-install').hidden = !canInstall;
  $('#close-install').classList.toggle('primary-button', !canInstall);
  $('#close-install').classList.toggle('secondary-button', canInstall);
}
const installPlatform = getInstallPlatform(navigator);
const preferredGuide = $(`[data-install-platform="${installPlatform}"]`);
if (preferredGuide) $('.install-platforms').prepend(preferredGuide);
window.addEventListener('beforeinstallprompt',(event)=>{event.preventDefault();installPrompt=event;updateInstallHelp();});
window.addEventListener('appinstalled',()=>{
  installConfirmed = true; installPrompt = null; updateInstallHelp();
  $('#install-status').hidden = false;
  $('#install-status').textContent = 'Tippy has been added to your Home Screen.';
});
standaloneQuery.addEventListener('change',updateInstallHelp);
$('#install-button').addEventListener('click',()=>{
  updateInstallHelp(); $('#install-status').hidden = true;
  $('#install-dialog').showModal(); $('#install-title').focus({preventScroll:true});
});
$('#native-install').addEventListener('click',async()=>{
  const prompt = installPrompt;
  installPrompt = null;
  $('#native-install').disabled = true;
  const outcome = await requestNativeInstall(prompt);
  updateInstallHelp(); $('#native-install').disabled = false;
  $('#install-status').hidden = false;
  $('#install-status').textContent = installConfirmed ? 'Tippy has been added to your Home Screen.' : outcome === 'accepted' ? 'Installation requested. Follow your browser’s confirmation.' : outcome === 'dismissed' ? 'You can install later using the steps above.' : 'Use the steps above to install Tippy from your browser.';
  $('#install-title').focus({preventScroll:true});
});
$('#close-install').addEventListener('click',()=>$('#install-dialog').close());
colorQuery.addEventListener('change',()=>{if(preferences.appearance==='automatic')applyAppearance();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkExpiry();else persist();});
window.addEventListener('pageshow',checkExpiry);
createWheel('#tip-options',rates,'rate');
createWheel('#people-options',Array.from({length:30},(_,i)=>i+1),'people',true);
renderKeypad();applyAppearance();renderSettings();renderAmounts();updateInstallHelp();scheduleExpiry();persist();

if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});

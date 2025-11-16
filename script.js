// Elements
const pwInput = document.getElementById('password');
const strengthBar = document.getElementById('strengthBar');
const strengthLabel = document.getElementById('strengthLabel');
const charCount = document.getElementById('charCount');

const checks = {
  length: document.getElementById('c-length'),
  upper: document.getElementById('c-upper'),
  lower: document.getElementById('c-lower'),
  number: document.getElementById('c-number'),
  symbol: document.getElementById('c-symbol'),
  pattern: document.getElementById('c-pattern')
};

const modal = document.getElementById('modal');

/// SLIDER SETUP
const sliderEl = document.getElementById('slider');
const sliderDots = document.getElementById('sliderDots');

const slides = [
  { type: 'warning', title: 'Weak passwords are a risk', text: 'Attackers can guess or crack short and common passwords quickly. Use long, unique passphrases.', level: 'warn' },
  { type: 'tip', title: 'Use a password manager', text: 'A password manager generates and stores unique passwords; you only remember one master passphrase.', level: 'tip' },
  { type: 'quote', title: 'Quote', text: '"A secure password is a shield — not a decoration."', level: 'quote' },
  { type: 'warning', title: 'Account takeover', text: 'Reused weak passwords can let attackers compromise multiple accounts at once.', level: 'warn' },
  { type: 'tip', title: 'Prefer length over complexity', text: 'A 16-character passphrase of random words is stronger and easier to remember than short complex strings.', level: 'tip' }
];

let currentSlide = 0;
let sliderTimer = null;
const SLIDE_INTERVAL = 4000;

function createSlides(){
  sliderEl.innerHTML = '';
  sliderDots.innerHTML = '';
  slides.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'slide';
    if(i === 0) div.classList.add('show');
    div.dataset.index = i;
    div.innerHTML = `<span class="type ${s.level}">${s.title}</span><div class="body">${s.text}</div>`;
    sliderEl.appendChild(div);

    const dot = document.createElement('button');
    dot.dataset.index = i;
    if(i === 0) dot.classList.add('active');
    dot.addEventListener('click', ()=>{ goToSlide(i); });
    sliderDots.appendChild(dot);
  });
}
function showSlide(i){
  const nodes = sliderEl.querySelectorAll('.slide');
  nodes.forEach(n => n.classList.remove('show'));
  const target = sliderEl.querySelector(`.slide[data-index="${i}"]`);
  if(target) target.classList.add('show');

  // update dots
  Array.from(sliderDots.children).forEach(d => d.classList.remove('active'));
  const activeDot = sliderDots.querySelector(`button[data-index="${i}"]`);
  if(activeDot) activeDot.classList.add('active');

  currentSlide = i;
}
function nextSlide(){ goToSlide((currentSlide + 1) % slides.length); }
function prevSlide(){ goToSlide((currentSlide - 1 + slides.length) % slides.length); }
function goToSlide(i){
  showSlide(i);
  restartSlider();
}
function startSlider(){
  if(sliderTimer) clearInterval(sliderTimer);
  sliderTimer = setInterval(nextSlide, SLIDE_INTERVAL);
}
function pauseSlider(){ if(sliderTimer) clearInterval(sliderTimer); sliderTimer = null; }
function restartSlider(){ pauseSlider(); startSlider(); }

// initial create
createSlides();
startSlider();

/// Utilities and main logic (same as before)

function toggleShow(){
  const btn = document.getElementById('toggleBtn');
  if(pwInput.type === 'password'){
    pwInput.type = 'text';
    btn.textContent = 'Hide';
  } else {
    pwInput.type = 'password';
    btn.textContent = 'Show';
  }
}

function generatePassword(){
  const len = Math.max(8, Math.min(32, Number(document.getElementById('genLen').value || 12)));
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}<>?,.';
  let out = '';
  // ensure at least one from each category
  out += randomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  out += randomChar('abcdefghijklmnopqrstuvwxyz');
  out += randomChar('0123456789');
  out += randomChar('!@#$%^&*()-_=+[]{}<>?,.');
  for(let i = 4; i < len; i++) out += randomChar(chars);
  // shuffle
  pwInput.value = shuffleString(out);
  updateAll();
  pwInput.focus();
}

function randomChar(set){
  return set[Math.floor(Math.random()*set.length)];
}
function shuffleString(s){
  return s.split('').sort(()=>0.5-Math.random()).join('');
}

function copyPassword(){
  const val = pwInput.value;
  if(!val){ alert('Nothing to copy'); return; }
  navigator.clipboard?.writeText(val).then(()=>{
    alert('Password copied to clipboard');
  }).catch(()=>{ alert('Copy failed — use manual copy'); });
}

function hasRepeatOrPattern(s){
  if(!s) return true; // empty -> treat as fail
  const low = s.toLowerCase();

  if(/(.)\1{2,}/.test(s)) return true;

  const patterns = ['1234','12345','password','qwerty','abcd','1111','0000','letmein','admin','pass','iloveyou'];
  for(const p of patterns) if(low.includes(p)) return true;

  if(/(?:0123|1234|2345|3456|4567|5678|6789|7890|abcd|bcde|cdef)/.test(low)) return true;

  return false; // OK
}

function scorePassword(pw){
  if(!pw) return 0;
  let score = 0;
  if(pw.length >= 8) score++;
  if(pw.length >= 12) score++; // extra point for longer
  if(/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if(/[0-9]/.test(pw)) score++;
  if(/[^A-Za-z0-9]/.test(pw)) score++;
  if(hasRepeatOrPattern(pw)) score = Math.max(0, score-1); // penalize if bad pattern
  return Math.min(5, score);
}

function getLabelAndColor(score){
  if(score <= 1) return {label:'Very Weak', color:'var(--bad)', pct:20};
  if(score === 2) return {label:'Weak', color:'var(--warn)', pct:40};
  if(score === 3) return {label:'Medium', color:'#facc15', pct:60};
  if(score === 4) return {label:'Strong', color:'var(--good)', pct:80};
  return {label:'Very Strong', color:'#059669', pct:100};
}

function updateChecks(pw){
  if(pw.length >= 8) passCheck(checks.length); else failCheck(checks.length);
  if(/[A-Z]/.test(pw)) passCheck(checks.upper); else failCheck(checks.upper);
  if(/[a-z]/.test(pw)) passCheck(checks.lower); else failCheck(checks.lower);
  if(/[0-9]/.test(pw)) passCheck(checks.number); else failCheck(checks.number);
  if(/[^A-Za-z0-9]/.test(pw)) passCheck(checks.symbol); else failCheck(checks.symbol);
  if(!hasRepeatOrPattern(pw)) passCheck(checks.pattern); else failCheck(checks.pattern);
}

function passCheck(el){ el.classList.remove('fail'); el.classList.add('pass'); }
function failCheck(el){ el.classList.remove('pass'); el.classList.add('fail'); }

function updateAll(){
  const pw = pwInput.value || '';
  charCount.textContent = 'Chars: ' + pw.length;

  updateChecks(pw);

  const score = scorePassword(pw);
  const {label, color, pct} = getLabelAndColor(score);

  strengthLabel.textContent = 'Strength: ' + label;
  strengthBar.style.width = pct + '%';
  strengthBar.style.background = color;

  // subtle background color hint on card
  const card = document.getElementById('card');
  if(score <= 1) card.style.backgroundColor = '#fff5f5';
  else if(score === 2) card.style.backgroundColor = '#fffaf0';
  else if(score === 3) card.style.backgroundColor = '#fffef0';
  else if(score === 4) card.style.backgroundColor = '#f7fffa';
  else card.style.backgroundColor = '#f0fdf4';

  // If weak password, make slider more urgent: show first warning slide
  if(score <= 2){
    goToSlide(0);
    // add small highlight to slider wrap
    document.getElementById('sliderWrap').style.borderColor = 'rgba(239,68,68,0.18)';
  } else {
    document.getElementById('sliderWrap').style.borderColor = '#eef2ff';
  }
}

function showTips(){ modal.classList.remove('hidden'); }
function closeTips(){ modal.classList.add('hidden'); }

pwInput.addEventListener('input', updateAll);
updateAll();

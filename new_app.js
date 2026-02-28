/* ─ ROUTING ─ */
const pages = {
  home:    { el:'page-home',    nav:true,  label:'Home',      navId:'nav-home' },
  log:     { el:'page-log',     nav:true,  label:'Log Book',  navId:'nav-log' },
  profile: { el:'page-profile', nav:true,  label:'Profile',   navId:null },
  login:   { el:'page-login',   nav:false, label:'Sign in',   navId:null },
};

function navigate(page) {
  // hide all pages
  Object.values(pages).forEach(p => {
    const el = document.getElementById(p.el);
    el.classList.remove('active');
    el.style.display = '';
  });

  const cfg = pages[page];
  const el = document.getElementById(cfg.el);

  // login page has its own special display
  if (page === 'login') {
    document.getElementById('main-nav').style.display = 'none';
    document.getElementById('page-indicator').style.display = 'none';
    el.style.display = 'grid';
    el.classList.add('active');
  } else {
    document.getElementById('main-nav').style.display = 'flex';
    document.getElementById('page-indicator').style.display = 'flex';
    el.classList.add('active');
  }

  // update nav active state
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  if (cfg.navId) {
    const navEl = document.getElementById(cfg.navId);
    if (navEl) navEl.classList.add('active');
  }

  document.getElementById('indicator-text').textContent = cfg.label;
  window.scrollTo({top:0, behavior:'smooth'});
}

/* ─ STAR RATING (Log page) ─ */
const ratingLabels = {1:'1 star — Didn\'t like it',2:'2 stars — It was ok',3:'3 stars — Liked it',4:'4 stars — Really liked it',5:'5 stars — It was amazing ✦'};
const starBtns = document.querySelectorAll('#star-rating .star-btn-big');

function updateStars(n) {
  starBtns.forEach((b, i) => b.classList.toggle('active', i < n));
  document.getElementById('rating-label').textContent = ratingLabels[n] || '';
}

starBtns.forEach((btn, i) => {
  btn.addEventListener('click', () => updateStars(i + 1));
  btn.addEventListener('mouseenter', () => starBtns.forEach((b, j) => { b.style.color = j <= i ? 'var(--accent-amber)' : ''; }));
  btn.addEventListener('mouseleave', () => starBtns.forEach(b => { b.style.color = ''; }));
});

/* ─ STATUS TABS ─ */
document.querySelectorAll('#status-tabs .status-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#status-tabs .status-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

/* ─ SELECT BOOK ─ */
function selectBook(title, author) {
  document.getElementById('selected-book-name').textContent = `${title} by ${author}`;
  document.getElementById('log-form-card').scrollIntoView({behavior:'smooth', block:'start'});
  document.getElementById('log-form-card').style.borderColor = 'rgba(0,200,117,.4)';
  setTimeout(() => { document.getElementById('log-form-card').style.borderColor = ''; }, 1500);
}

/* ─ TOAST ─ */
function showSaveToast() {
  const t = document.getElementById('toast');
  t.style.opacity = '1'; t.style.transform = 'translateY(0)';
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(20px)'; }, 2800);
}

/* ─ GENRE TAGS ─ */
document.querySelectorAll('.genre-tag').forEach(tag => {
  tag.addEventListener('click', () => tag.classList.toggle('active'));
});

/* ─ FOLLOW BUTTONS ─ */
document.querySelectorAll('.btn-follow').forEach(btn => {
  btn.addEventListener('click', () => {
    const following = btn.classList.toggle('following');
    btn.textContent = following ? 'Following' : 'Follow';
  });
});

/* ─ PROFILE TABS ─ */
function switchProfileTab(clickedBtn, tabId) {
  document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.profile-tab-content').forEach(c => c.style.display = 'none');
  clickedBtn.classList.add('active');
  document.getElementById(tabId).style.display = 'block';
}

/* ─ AUTH TABS (login page) ─ */
function switchAuth(mode) {
  document.querySelectorAll('#auth-tabs .auth-tab').forEach(t => t.classList.remove('active'));
  const idx = mode === 'signin' ? 0 : 1;
  document.querySelectorAll('#auth-tabs .auth-tab')[idx].classList.add('active');
  document.getElementById('signin-panel').style.display = mode === 'signin' ? 'block' : 'none';
  document.getElementById('signup-panel').style.display = mode === 'signup' ? 'block' : 'none';
}

/* ─ REVIEW LIKES ─ */
document.querySelectorAll('.rc-likes').forEach(btn => {
  btn.addEventListener('click', () => btn.style.color = btn.style.color === 'rgb(232, 64, 87)' ? '' : 'var(--accent-red)');
});

/* ─ INIT ─ */
navigate('home');
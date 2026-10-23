/* ---------- auth (F1) ---------- */
let authTab = 'login';
function renderAuth() {
  $('#app').hidden = true; const a = $('#auth'); a.hidden = false;
  const road = `<svg class="road" viewBox="0 0 600 220" aria-hidden="true"><path d="M-10 200 C 120 190, 160 120, 270 110 S 430 60, 610 20" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round"/>
    ${[[40, 196], [150, 160], [270, 110], [390, 78], [500, 45]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i < 3 ? 11 : 9}" fill="${i < 3 ? '#E3A33A' : 'none'}" stroke="${i < 3 ? '#E3A33A' : 'rgba(255,255,255,.55)'}" stroke-width="2.5"/>`).join('')}
    <path d="M565 6c7 0 11 5 11 10.5 0 9.5-11 16.5-11 16.5s-11-7-11-16.5C554 11 558 6 565 6z" fill="#fff"/></svg>`;
  a.innerHTML = `<div class="auth">
    <section class="auth-art"><div><span class="mark" style="width:52px;height:52px;margin-bottom:28px;background:rgba(255,255,255,.12)">${MARK}</span><h1>معاك في رحلة العلاج</h1>
      <p>منصة عربية بتساعد مريض السرطان وأسرته ينظموا رحلة العلاج، ويوصلوا لأماكن المساعدة الموثوقة في مصر، ويلاقوا ناس تسندهم.</p></div>
      <div class="promise"><span>${ic('lock', 'sm')} بياناتك ملكك</span><span>${ic('shield', 'sm')} كل محتوى طبي مراجَع</span><span>${ic('info', 'sm')} مش بديل عن دكتورك</span></div>${road}</section>
    <section class="auth-form">
      <div class="tabs" role="tablist"><button role="tab" data-auth="login" aria-selected="${authTab === 'login'}">تسجيل الدخول</button><button role="tab" data-auth="signup" aria-selected="${authTab === 'signup'}">حساب جديد</button></div>
      ${authTab === 'login' ? `<form id="loginF"><h2>أهلًا بيك تاني</h2><p class="muted" style="margin-bottom:18px">ادخل بالإيميل أو رقم الموبايل.</p>
        <label class="field"><span>الإيميل أو الموبايل</span><input class="input" name="email" dir="ltr" style="text-align:right" required autocomplete="username"></label>
        <label class="field"><span>كلمة السر</span><input class="input" type="password" name="pass" required autocomplete="current-password"></label>
        <div id="authErr"></div><button class="btn primary block">ادخل</button></form>`
      : `<form id="signupF"><h2>ابدأ في دقيقة</h2><p class="muted" style="margin-bottom:18px">بنطلب أقل بيانات ممكنة. أي بيان طبي هتضيفه بعدين لو حبيت.</p>
        <label class="field"><span>اسمك</span><input class="input" name="name" required autocomplete="name"></label>
        <label class="field"><span>الإيميل أو الموبايل</span><input class="input" name="email" dir="ltr" style="text-align:right" required></label>
        <label class="field"><span>كلمة السر</span><input class="input" type="password" name="pass" minlength="6" required autocomplete="new-password"><small>٦ حروف أو أرقام على الأقل</small></label>
        <div class="field"><span>هتستخدم المنصة كـ</span><div class="seg" role="group"><button type="button" data-r="patient" aria-pressed="true">مريض</button><button type="button" data-r="companion" aria-pressed="false">مرافق لمريض</button></div></div>
        <label class="check"><input type="checkbox" name="c1" required><span>موافق إن المنصة تحفظ بياناتي عشان تشغّل الخدمة، وفاهم إني أقدر أحملها أو أحذفها في أي وقت.</span></label>
        <label class="check"><input type="checkbox" name="c2" checked><span>عايز تذكيرات بالمواعيد والأدوية.</span></label>
        <label class="check"><input type="checkbox" name="c3"><span>موافق على استخدام إحصائيات مجهولة الهوية لتحسين الخدمة. <span class="tiny">(اختياري)</span></span></label>
        <div id="authErr"></div><button class="btn primary block">اعمل الحساب</button></form>`}
      <div style="margin-top:28px"><p class="tiny">أو جرّب النموذج ببيانات تجريبية:</p>
        <div class="demo-row"><button data-demo="patient"><b>مريضة</b><small>منى، في الدورة التالتة</small></button><button data-demo="companion"><b>مرافق</b><small>أحمد، أخو منى</small></button><button data-demo="admin"><b>أدمن</b><small>لوحة الإدارة</small></button></div></div>
    </section></div>`;
  $$('[data-auth]', a).forEach(b => b.onclick = () => { authTab = b.dataset.auth; renderAuth(); });
  $$('[data-demo]', a).forEach(b => b.onclick = () => { S = seed(b.dataset.demo); save(); enter(STAFF.includes(b.dataset.demo) ? 'admin' : 'home'); });
  let role = 'patient';
  $$('.seg [data-r]', a).forEach(b => b.onclick = () => { role = b.dataset.r; $$('.seg [data-r]', a).forEach(x => x.setAttribute('aria-pressed', x === b)); });
  const lf = $('#loginF'), sf = $('#signupF');
  if (lf) lf.onsubmit = e => {
    e.preventDefault(); const fd = new FormData(lf), stored = load();
    if (stored && stored.user && stored.user.email === fd.get('email').trim() && stored.user.pass === fd.get('pass')) { S = stored; S.session = true; save(); enter('home'); }
    else $('#authErr').innerHTML = `<p class="err">الإيميل أو كلمة السر مش مطابقين لحساب على الجهاز ده. جرّب الحساب التجريبي: demo@maak.eg وكلمة السر demo.</p>`;
  };
  if (sf) sf.onsubmit = e => {
    e.preventDefault(); const fd = new FormData(sf);
    if (!fd.get('c1')) { $('#authErr').innerHTML = '<p class="err">لازم توافق على حفظ البيانات عشان الخدمة تشتغل.</p>'; return; }
    const user = { name: fd.get('name').trim(), email: fd.get('email').trim(), pass: fd.get('pass'), role, gov: '', consent: { data: true, reminders: !!fd.get('c2'), research: !!fd.get('c3'), at: Date.now() }, medical: {} };
    S = blankState(user);
    if (role === 'companion') { S.patientName = 'المريض'; S.companion = { name: user.name, relation: 'مرافق', phone: '', perms: { appts: true, meds: true, symptoms: false, docs: false }, since: Date.now() }; }
    save(); enter('home'); toast(`أهلًا يا ${firstName(user.name)}. ابدأ بأول موعد أو أول دواء.`);
  };
}
function enter(r) { $('#auth').hidden = true; $('#app').hidden = false; if (location.hash === '#' + r) render(); else location.hash = r; }

/* ---------- render loop ---------- */
let current = null;
function render() {
  if (!S || !S.session) { renderAuth(); return; }
  $('#auth').hidden = true; $('#app').hidden = false;
  let { name, param } = route();
  if (!allowed(name)) name = 'home';
  if (current && current !== name && V[current].unmount) V[current].unmount();
  const routeKey = name + ':' + param, changed = routeKey !== UI.lastRoute;
  const view = $('#view');
  view.innerHTML = V[name].html(param);
  V[name].mount && V[name].mount(view, param);
  renderChrome(name);
  $('#bellPop').hidden = true;
  if (changed) { window.scrollTo(0, 0); UI.lastRoute = routeKey; if (current) view.focus({ preventScroll: true }); }
  current = name;
  const titles = { home: 'الرئيسية', journey: 'المواعيد', meds: 'الأدوية', symptoms: 'الأعراض', docs: 'المستندات', directory: 'دليل الخدمات', helpme: 'مين يساعدني؟', library: 'المكتبة', article: 'مقال', community: 'المجتمع', assistant: 'المساعد', support: 'راحة نفسية', companion: 'وضع المرافق', profile: 'حسابي', admin: 'لوحة الإدارة', future: 'جاي قريب' };
  document.title = `${titles[name]}، معاك في رحلة العلاج`;
}
window.addEventListener('hashchange', () => { if (S && S.session) render(); });
document.addEventListener('click', e => {
  const go_ = e.target.closest('[data-go]');
  if (go_) { $('#bellPop').hidden = true; go(go_.dataset.go); return; }
  const t = e.target.closest('[data-act]');
  if (t && ACT[t.dataset.act]) { if (t.tagName === 'BUTTON') e.preventDefault(); ACT[t.dataset.act](t, e); return; }
  if (!e.target.closest('#bellPop') && !e.target.closest('#bellBtn')) { const p = $('#bellPop'); if (p) p.hidden = true; }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('circle[data-act]')) { e.preventDefault(); ACT[e.target.dataset.act](e.target); }
  if (e.key === 'Escape') { const p = $('#bellPop'); if (p) p.hidden = true; }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]');
  if (!f) return;
  e.preventDefault();
  FORMS[f.dataset.form] && FORMS[f.dataset.form](f, new FormData(f));
});

/* ---------- boot ---------- */
(function boot() {
  try { const th = localStorage.getItem(KEY + '_theme'); if (th && th !== 'auto') document.documentElement.dataset.theme = th; } catch (e) {}
  S = load();
  if (S && S.session) render(); else renderAuth();
})();

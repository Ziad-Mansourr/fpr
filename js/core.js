/* ---------- ui helpers ---------- */
const UI = { cal: null, dir: { gov: 'all', type: 'all', need: 'all', q: '', mode: 'list', sel: null }, help: { step: 1, gov: null, needs: [], who: null }, lib: { tab: 'articles', cat: 'all', q: '' }, com: { g: 'g1', open: {} }, admin: null, chartSyms: ['pain', 'nausea', 'fatigue'], docCat: 'all', lastRoute: '' };
function toast(msg) {
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = msg;
  $('#toasts').append(el); setTimeout(() => el.remove(), 2800);
}
function modal(title, body, opts = {}) {
  const d = document.createElement('dialog');
  if (opts.wide) d.classList.add('wide');
  if (opts.cls) d.classList.add(opts.cls);
  d.innerHTML = `<div class="dlg-h"><h2>${title}</h2><button class="iconbtn" data-close aria-label="اقفل">${ic('x')}</button></div><div class="dlg-b">${body}</div>`;
  document.body.append(d);
  d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
  d.addEventListener('close', () => { d.remove(); opts.onClose && opts.onClose(); });
  d.showModal();
  opts.mount && opts.mount(d);
  return d;
}
function confirmBox(title, text, okLabel, onOk, danger = true) {
  const d = modal(title, `<p class="muted" style="margin-bottom:18px">${text}</p><div class="dlg-f"><button class="btn ${danger ? 'danger' : 'primary'}" data-ok>${okLabel}</button><button class="btn" data-close>رجوع</button></div>`);
  $('[data-ok]', d).onclick = () => { d.close(); onOk(); };
}
async function offerDownload(filename, data, mime) {
  try {
    if (window.claude && claude.use) {
      const dl = await claude.use('downloads');
      if (dl) { await dl.save({ filename, data }); return true; }
    }
  } catch (e) { if (e && e.code === 'declined') return false; }
  try { // local fallback (when the file is opened outside claude.ai)
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: mime })); a.download = filename; a.click(); return true;
  } catch (e) { return false; }
}
async function copyText(txt, el) {
  try { await navigator.clipboard.writeText(txt); toast('اتنسخ الرابط'); }
  catch (e) { if (el) { el.select(); } toast('حدد الرابط وانسخه يدويًا'); }
}

/* ---------- access & navigation ---------- */
const NAV = [
  { h: 'رحلتي', items: [['home', 'الرئيسية', 'home'], ['journey', 'المواعيد', 'cal'], ['meds', 'الأدوية', 'pill'], ['symptoms', 'الأعراض والتقرير', 'pulse'], ['docs', 'خزنة المستندات', 'folder']] },
  { h: 'مساعدة ومعرفة', items: [['helpme', 'مين يساعدني؟', 'compass'], ['directory', 'دليل الخدمات', 'map'], ['library', 'المكتبة والقاموس', 'book'], ['assistant', 'المساعد', 'bot']] },
  { h: 'دعم', items: [['community', 'مجتمع الدعم', 'users'], ['support', 'راحة نفسية', 'leaf'], ['companion', 'وضع المرافق', 'link']] },
  { h: 'حسابي', items: [['profile', 'حسابي والخصوصية', 'user'], ['admin', 'لوحة الإدارة', 'shield'], ['future', 'جاي قريب', 'spark']] }
];
function allowed(name) {
  const r = S.user.role;
  if (name === 'admin') return STAFF.includes(r);
  if (r === 'companion') {
    const p = (S.companion && S.companion.perms) || {};
    if (name === 'symptoms') return !!p.symptoms;
    if (name === 'docs') return !!p.docs;
    if (name === 'journey') return !!p.appts;
    if (name === 'meds') return !!p.meds;
  }
  return true;
}
function route() {
  const h = (location.hash || '#home').slice(1);
  const i = h.indexOf('-');
  const name = i > -1 ? h.slice(0, i) : h, param = i > -1 ? h.slice(i + 1) : '';
  return { name: V[name] ? name : 'home', param };
}
function go(r) { if (location.hash === '#' + r) render(); else location.hash = r; }
function openCount() { return S.reports.filter(r => r.status === 'open').length + S.flags.filter(f => f.status === 'open').length; }
function renderChrome(name) {
  $('#mark1').innerHTML = MARK; $('#mark2').innerHTML = MARK;
  $('#sidenav').innerHTML = NAV.map(g => {
    const items = g.items.filter(([k]) => allowed(k));
    if (!items.length) return '';
    return `<div class="navgroup"><h4>${g.h}</h4>${items.map(([k, l, i]) => `<a href="#${k}" ${k === name ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span>${k === 'admin' && openCount() ? `<span class="count">${n(openCount())}</span>` : ''}</a>`).join('')}</div>`;
  }).join('');
  const tabs = [['home', 'الرئيسية', 'home'], ['journey', 'المواعيد', 'cal'], ['meds', 'الأدوية', 'pill'], ['symptoms', 'الأعراض', 'pulse']].filter(([k]) => allowed(k));
  $('#tabbar').innerHTML = tabs.map(([k, l, i]) => `<a href="#${k}" ${k === name ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span></a>`).join('') + `<button data-act="more" ${tabs.some(t => t[0] === name) ? '' : 'aria-current="page"'}>${ic('more')}<span>المزيد</span></button>`;
  $('#tabbar').style.gridTemplateColumns = `repeat(${tabs.length + 1},1fr)`;
  const nots = notifications();
  $('#bellBtn').innerHTML = ic('bell') + (nots.length ? `<span class="dot">${n(nots.length)}</span>` : '');
  $('#avatarBtn').textContent = firstName(S.user.name).replace(/^د\.?/, '').trim().charAt(0) || 'م';
  const r = S.user.role;
  $('#roleBanner').innerHTML = r === 'patient' ? '' : `<div class="role-banner">${ic(r === 'companion' ? 'link' : 'shield')}<span>${r === 'companion' ? `أنت داخل كمرافق لـ ${esc(S.patientName)}، وبتشوف بس اللي هي سمحت بيه.` : `أنت داخل بدور «${ROLES[r]}». تقدر تفتح لوحة الإدارة من القائمة.`}</span></div>`;
}
function notifications() {
  const t = today(), out = [];
  S.appts.filter(a => a.date >= t && diffDays(t, a.date) <= 2 && a.remind !== false).sort(byDate).forEach(a => out.push({ ic: 'cal', text: `${daysWord(diffDays(t, a.date))}: ${a.title}${a.time ? '، الساعة ' + fmtTime(a.time) : ''}`, go: 'journey' }));
  if (S.user.consent.reminders) dosesFor(t).filter(d => d.status === 'late').forEach(d => out.push({ ic: 'pill', bad: true, text: `جرعة فاتت: ${d.med.name} (${fmtTime(d.time)})`, go: 'meds' }));
  if (!S.symptoms[t] && new Date().getHours() >= 12) out.push({ ic: 'pulse', text: 'لسه مسجلتش الأعراض النهارده', go: 'symptoms' });
  return out;
}
const byDate = (a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''));
function dosesFor(date) {
  const now = nowHM(), t = today(), out = [];
  S.meds.forEach(m => m.times.forEach(tm => {
    const key = `${date}|${m.id}|${tm}`;
    let status = S.doseLog[key] || ((date < t || (date === t && tm < now)) ? 'late' : 'due');
    out.push({ med: m, time: tm, key, status });
  }));
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

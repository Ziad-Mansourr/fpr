/* =========================================================
   VIEWS
   ========================================================= */
const V = {};
const ACT = {};
const FORMS = {};
const pageH = (title, sub, actions = '') => `<div class="page-h"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${actions ? `<div class="actions">${actions}</div>` : ''}</div>`;

/* ---------- F2 journey band (home) ---------- */
function journeyBand() {
  const t = today(), plan = S.plans[0];
  const who = S.user.role === 'companion' ? `رحلة ${esc(firstName(S.patientName))}` : 'رحلتك';
  if (!plan) return `<section class="journey"><div class="journey-h"><div><h2>${who}</h2><p class="when">اكتب خطة الدكتور مرة واحدة، والتقويم يترتب لوحده</p><p class="sub">مثلًا: جلسة كل ٢١ يوم، ٦ دورات</p></div><button class="btn" data-act="planNew">${ic('plus')} رتّب الدورات</button></div></section>`;
  const cyc = S.appts.filter(a => a.planId === plan.id).sort(byDate);
  const done = cyc.filter(c => c.date < t).length, next = cyc.find(c => c.date >= t);
  let pos = 0;
  if (done >= 1 && next) { const prev = cyc[done - 1]; pos = (done - 1 + diffDays(prev.date, t) / Math.max(1, diffDays(prev.date, next.date))) / (cyc.length - 1); }
  else if (!next) pos = 1;
  const when = next ? (diffDays(t, next.date) === 0 ? 'جلستك النهارده' : `الجلسة الجاية ${daysWord(diffDays(t, next.date))}`) : 'كل الدورات خلصت';
  const sub = next ? `الدورة ${n(cyc.indexOf(next) + 1)} من ${n(cyc.length)}، ${fmtDate(next.date)}${next.time ? ' الساعة ' + fmtTime(next.time) : ''}` : `${esc(plan.name)}: ${n(cyc.length)} دورات`;
  return `<section class="journey" aria-label="مسار دورات العلاج">
    <div class="journey-h"><div><h2>${who} مع ${esc(plan.name)}</h2><p class="when">${when}</p><p class="sub">${sub}</p></div><a class="btn" href="#journey">${ic('cal')} كل المواعيد</a></div>
    <div class="stones-wrap"><ol class="stones">
      <span class="rail" aria-hidden="true"></span><span class="fill" aria-hidden="true" style="width:calc((100% - 48px) * ${pos.toFixed(3)})"></span>
      ${cyc.map((c, i) => { const st = c.date < t ? 'done' : c === next ? 'next' : ''; return `<li class="stone ${st}"><span class="d">${st === 'done' ? ic('check') : n(i + 1)}</span><small><span class="lgd">${fmtDate(c.date, { day: 'numeric', month: 'short' })}</span><span class="smd">${fmtDate(c.date, { day: 'numeric', month: 'numeric' })}</span></small><span class="sr">${st === 'done' ? 'خلصت' : st === 'next' ? 'الجاية' : 'لسه'}</span></li>`; }).join('')}
    </ol></div>
  </section>`;
}
function doseRow(d, compact) {
  const late = d.status === 'late';
  const right = d.status === 'taken' ? `<button class="status taken" data-act="undoDose" data-key="${d.key}" title="تراجع">${ic('check', 'sm')} أخدتها</button>`
    : d.status === 'skipped' ? `<button class="status skipped" data-act="undoDose" data-key="${d.key}" title="تراجع">تخطيتها</button>`
    : `<div class="dose-btns"><button class="btn sm primary" data-act="dose" data-v="taken" data-key="${d.key}">أخدت</button><button class="btn sm" data-act="dose" data-v="skipped" data-key="${d.key}">تخطيت</button></div>`;
  return `<div class="dose"><time>${fmtTime(d.time)}</time><div class="grow"><h3>${esc(d.med.name)}</h3><p>${esc(d.med.dose)}${late ? '<span class="late">، عدّى معادها</span>' : ''}</p></div>${right}</div>`;
}
ACT.dose = el => { S.doseLog[el.dataset.key] = el.dataset.v; save(); render(); toast(el.dataset.v === 'taken' ? 'اتسجلت الجرعة: أخدتها' : 'اتسجلت الجرعة: تخطيتها'); };
ACT.undoDose = el => { delete S.doseLog[el.dataset.key]; save(); render(); toast('اتلغى التسجيل'); };
function apptRow(a, del) {
  const T = TYPES[a.type] || TYPES.other;
  return `<div class="list-row"><div class="datebox" style="--c:${T.c}"><b>${fmtDate(a.date, { day: 'numeric' })}</b><span>${fmtDate(a.date, { month: 'short' })}</span></div>
  <div class="grow"><h3>${esc(a.title)}</h3><p>${[a.time ? fmtTime(a.time) : '', a.place ? esc(a.place) : '', a.note ? esc(a.note) : ''].filter(Boolean).join('، ')}</p></div>
  ${del ? `<button class="iconbtn" data-act="delAppt" data-id="${a.id}" aria-label="احذف الموعد">${ic('trash', 'sm')}</button>` : ''}</div>`;
}

V.home = {
  html() {
    const t = today(), u = S.user, hr = new Date().getHours(), comp = u.role === 'companion';
    const greet = hr < 12 ? 'صباح الخير' : 'مساء الخير';
    const doses = dosesFor(t), taken = doses.filter(d => d.status === 'taken').length;
    const pend = doses.filter(d => d.status === 'due' || d.status === 'late').slice(0, 4);
    const up = S.appts.filter(a => a.date >= t).sort(byDate).slice(0, 4);
    const sy = S.symptoms[t];
    const showMeds = allowed('meds'), showAppts = allowed('journey'), showSym = allowed('symptoms');
    return `
    <section class="hello"><h1>${greet} يا ${esc(firstName(u.name))}</h1><p>${fmtDate(t, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></section>
    ${showAppts ? journeyBand() : ''}
    <div class="home-grid">
      ${showMeds ? `<section class="panel"><div class="panel-h"><div><h2>أدوية النهارده</h2><p>${doses.length ? `اتسجل ${n(taken)} من ${n(doses.length)} جرعات` : 'مفيش أدوية متسجلة'}</p></div><a class="btn sm ghost" href="#meds">كل الأدوية</a></div>
        ${pend.length ? pend.map(d => doseRow(d, true)).join('') : doses.length ? `<div class="empty"><p>كل جرعات النهارده اتسجلت.</p></div>` : `<div class="empty"><p>سجّل أدويتك زي ما في الروشتة وهتوصلك تذكيرات.</p><a class="btn primary sm" href="#meds">${ic('plus', 'sm')} أضف دواء</a></div>`}
      </section>` : ''}
      ${showAppts ? `<section class="panel"><div class="panel-h"><h2>المواعيد الجاية</h2><a class="btn sm ghost" href="#journey">التقويم</a></div>
        ${up.length ? up.map(a => apptRow(a)).join('') : `<div class="empty"><p>مفيش مواعيد جاية.</p><button class="btn primary sm" data-act="apptNew">${ic('plus', 'sm')} أضف موعد</button></div>`}
      </section>` : ''}
      ${showSym ? `<section class="panel"><div class="panel-h"><h2>${sy ? 'أعراض النهارده' : 'إحساسك النهارده عامل إزاي؟'}</h2>${sy ? `<a class="btn sm ghost" href="#symptoms">عدّل</a>` : ''}</div>
        ${sy ? `<div class="mini-bars">${SYMS.map(s => `<div><i style="height:${Math.max(4, sy[s.k] * 10)}%;background:${s.c}"></i><span>${s.label.split(' ')[0]}</span></div>`).join('')}</div><p class="tiny">الحرارة: ${sy.temp ? n(sy.temp) + '°' : 'متسجلتش'}</p>`
          : `<p class="muted" style="margin-bottom:14px">تسجيل سريع في أقل من دقيقة. بيبان في تقرير الدكتور بعدين، فمفيش حاجة تتنسي.</p><a class="btn warm" href="#symptoms">${ic('pulse', 'sm')} سجّل أعراض النهارده</a>`}
      </section>` : ''}
      <section class="panel"><div class="panel-h"><h2>محتاج مساعدة؟</h2></div>
        <a class="quick" href="#helpme"><span class="qi">${ic('compass')}</span><span><b>مين يساعدني؟</b><span>٣ أسئلة بسيطة ونرشحلك جهات في محافظتك</span></span></a>
        <a class="quick warm" href="#assistant"><span class="qi">${ic('bot')}</span><span><b>اسأل المساعد</b><span>عن أي مصطلح طبي في تقرير أو روشتة</span></span></a>
        <a class="quick" href="#community"><span class="qi">${ic('users')}</span><span><b>مجتمع الدعم</b><span>ناس عدّت بنفس التجربة</span></span></a>
      </section>
    </div>`;
  }
};

/* ---------- F2 appointments ---------- */
V.journey = {
  html() {
    const t = today();
    if (!UI.cal) UI.cal = { y: D(t).getFullYear(), m: D(t).getMonth(), sel: t };
    const { y, m, sel } = UI.cal;
    const first = new Date(y, m, 1, 12), off = (first.getDay() + 1) % 7; // week starts Saturday
    const startD = new Date(y, m, 1 - off, 12);
    const cells = [];
    for (let i = 0; i < 42; i++) { const d = new Date(startD); d.setDate(startD.getDate() + i); cells.push(iso(d)); }
    const byDay = {}; S.appts.forEach(a => (byDay[a.date] = byDay[a.date] || []).push(a));
    const dayList = (byDay[sel] || []).sort(byDate);
    const up = S.appts.filter(a => a.date >= t).sort(byDate);
    const monthName = new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(first);
    const canEdit = S.user.role !== 'companion';
    return pageH('المواعيد', 'الجلسات والأشعة والتحاليل والمتابعات في تقويم واحد، مع تذكير قبلها.', canEdit ? `<button class="btn" data-act="planNew">${ic('spark')} مولّد الدورات</button><button class="btn primary" data-act="apptNew">${ic('plus')} أضف موعد</button>` : '') + `
    <div class="grid2">
      <section class="panel">
        <div class="cal-h"><button class="iconbtn" data-act="calNav" data-d="-1" aria-label="الشهر اللي فات">${ic('prev')}</button><h2>${monthName}</h2><button class="iconbtn" data-act="calNav" data-d="1" aria-label="الشهر الجاي">${ic('next')}</button></div>
        <div class="cal" role="grid">
          ${['سبت', 'أحد', 'اتنين', 'تلات', 'أربع', 'خميس', 'جمعة'].map(w => `<div class="wd">${w}</div>`).join('')}
          ${cells.map(c => { const dd = D(c), list = byDay[c] || []; return `<button data-act="calSel" data-d="${c}" class="${dd.getMonth() !== m ? 'out' : ''} ${c === t ? 'today' : ''}" aria-pressed="${c === sel}" aria-label="${fmtDate(c)}${list.length ? '، ' + n(list.length) + ' مواعيد' : ''}"><span>${n(dd.getDate())}</span><span class="dots">${list.slice(0, 3).map(a => `<i style="--c:${TYPES[a.type].c}"></i>`).join('')}</span></button>`; }).join('')}
        </div>
        <div class="legend">${Object.values(TYPES).map(T => `<span><i style="--c:${T.c}"></i>${T.label}</span>`).join('')}</div>
      </section>
      <div class="stack">
        <section class="panel"><div class="panel-h"><h2>${fmtDate(sel)}</h2>${canEdit ? `<button class="btn sm" data-act="apptNew" data-d="${sel}">${ic('plus', 'sm')} موعد في اليوم ده</button>` : ''}</div>
          ${dayList.length ? dayList.map(a => apptRow(a, canEdit)).join('') : `<p class="muted">مفيش مواعيد في اليوم ده.</p>`}
        </section>
        <section class="panel"><div class="panel-h"><div><h2>خطط العلاج</h2><p>اكتب الخطة مرة واحدة والنظام يوزع المواعيد</p></div></div>
          ${S.plans.length ? S.plans.map(p => `<div class="list-row"><div class="grow"><h3>${esc(p.name)}</h3><p>كل ${n(p.every)} يوم، ${n(p.count)} دورات، من ${fmtDate(p.start, { day: 'numeric', month: 'long' })}</p></div>${canEdit ? `<button class="btn sm" data-act="delPlan" data-id="${p.id}">${ic('trash', 'sm')} احذف الخطة</button>` : ''}</div>`).join('') : `<div class="empty"><p>مفيش خطة متسجلة لسه.</p><button class="btn primary sm" data-act="planNew">رتّب الدورات</button></div>`}
        </section>
      </div>
    </div>
    <section class="panel" style="margin-top:20px"><div class="panel-h"><h2>كل المواعيد الجاية</h2><span class="tiny">${n(up.length)} موعد</span></div>
      ${up.length ? up.map(a => apptRow(a, canEdit)).join('') : '<p class="muted">مفيش مواعيد جاية.</p>'}
    </section>`;
  }
};
ACT.calNav = el => { const c = UI.cal; c.m += +el.dataset.d; if (c.m < 0) { c.m = 11; c.y--; } if (c.m > 11) { c.m = 0; c.y++; } render(); };
ACT.calSel = el => { UI.cal.sel = el.dataset.d; const d = D(el.dataset.d); UI.cal.y = d.getFullYear(); UI.cal.m = d.getMonth(); render(); };
ACT.delAppt = el => { const a = S.appts.find(x => x.id === el.dataset.id); confirmBox('تحذف الموعد؟', `«${esc(a.title)}» يوم ${fmtDate(a.date)} هيتشال من التقويم.`, 'احذف الموعد', () => { S.appts = S.appts.filter(x => x !== a); save(); render(); toast('اتحذف الموعد'); }); };
ACT.delPlan = el => { const p = S.plans.find(x => x.id === el.dataset.id); confirmBox('تحذف الخطة؟', `هتتحذف خطة «${esc(p.name)}» وكل جلساتها من التقويم.`, 'احذف الخطة', () => { S.plans = S.plans.filter(x => x !== p); S.appts = S.appts.filter(a => a.planId !== p.id); save(); render(); toast('اتحذفت الخطة'); }); };
ACT.apptNew = el => {
  const d0 = (el && el.dataset.d) || today();
  const d = modal('موعد جديد', `<form data-form="appt">
    <label class="field"><span>نوع الموعد</span><select class="input" name="type">${Object.entries(TYPES).map(([k, T]) => `<option value="${k}">${T.label}</option>`).join('')}</select></label>
    <label class="field"><span>الوصف <small>(اختياري)</small></span><input class="input" name="title" placeholder="مثلًا: تحليل وظائف كبد"></label>
    <div class="row2"><label class="field"><span>اليوم</span><input class="input" type="date" name="date" value="${d0}" required></label><label class="field"><span>الساعة</span><input class="input" type="time" name="time" value="10:00"></label></div>
    <label class="field"><span>المكان <small>(اختياري)</small></span><input class="input" name="place" placeholder="المستشفى أو المعمل"></label>
    <label class="field"><span>ملاحظة <small>(اختياري)</small></span><input class="input" name="note" placeholder="مثلًا: صايم من ٨ ساعات"></label>
    <label class="check"><input type="checkbox" name="remind" checked> فكّرني قبلها بيوم</label>
    <div class="dlg-f"><button class="btn primary">احفظ الموعد</button><button class="btn" type="button" data-close>إلغاء</button></div></form>`);
};
FORMS.appt = (f, fd) => {
  const type = fd.get('type');
  S.appts.push({ id: uid(), type, title: fd.get('title').trim() || TYPES[type].label, date: fd.get('date'), time: fd.get('time'), place: fd.get('place').trim(), note: fd.get('note').trim(), remind: !!fd.get('remind') });
  save(); f.closest('dialog').close(); UI.cal = null; UI.cal = { y: D(fd.get('date')).getFullYear(), m: D(fd.get('date')).getMonth(), sel: fd.get('date') };
  render(); toast('اتحفظ الموعد');
};
ACT.planNew = () => {
  if (route().name !== 'journey') { location.hash = 'journey'; setTimeout(() => ACT.planNew(), 60); return; }
  const d = modal('مولّد دورات العلاج', `<form data-form="plan">
    <p class="muted" style="margin-bottom:16px">اكتب الخطة زي ما الدكتور قالها مرة واحدة، والمنصة توزع المواعيد على التقويم. المنصة مش بتحدد الخطة، بتنظمها بس.</p>
    <label class="field"><span>اسم الخطة</span><input class="input" name="name" placeholder="مثلًا: كيماوي (اسم البروتوكول)" required></label>
    <div class="row2"><label class="field"><span>النوع</span><select class="input" name="type"><option value="chemo">جلسات كيماوي</option><option value="radio">جلسات إشعاعي</option><option value="other">علاج تاني</option></select></label>
    <label class="field"><span>أول جلسة</span><input class="input" type="date" name="start" value="${today()}" required></label></div>
    <div class="row3"><label class="field"><span>كل كام يوم</span><input class="input" type="number" name="every" value="21" min="1" max="120" required></label>
    <label class="field"><span>عدد الدورات</span><input class="input" type="number" name="count" value="6" min="1" max="40" required></label>
    <label class="field"><span>الساعة</span><input class="input" type="time" name="time" value="10:00"></label></div>
    <label class="field"><span>المكان <small>(اختياري)</small></span><input class="input" name="place"></label>
    <label class="check"><input type="checkbox" name="lab" checked> ضيف «صورة دم» قبل كل جلسة بيوم</label>
    <p class="tiny">المواعيد اللي هتتضاف:</p><div class="preview-dates" id="planPrev"></div>
    <div class="dlg-f"><button class="btn primary" id="planBtn">أضف المواعيد للتقويم</button><button class="btn" type="button" data-close>إلغاء</button></div></form>`, {
    mount(d) {
      const f = $('form', d);
      const up = () => { const fd = new FormData(f), c = Math.min(40, +fd.get('count') || 0), e = +fd.get('every') || 0, s = fd.get('start');
        $('#planPrev', d).innerHTML = s && c && e ? Array.from({ length: c }, (_, i) => `<span>${n(i + 1)}: ${fmtDate(addDays(s, i * e), { day: 'numeric', month: 'short' })}</span>`).join('') : '<span>اكتب البيانات</span>';
        $('#planBtn', d).textContent = c ? `أضف ${n(c)} مواعيد للتقويم` : 'أضف المواعيد للتقويم'; };
      f.addEventListener('input', up); up();
    }
  });
};
FORMS.plan = (f, fd) => {
  const p = { id: uid(), name: fd.get('name').trim(), type: fd.get('type'), start: fd.get('start'), every: +fd.get('every'), count: +fd.get('count'), time: fd.get('time'), place: fd.get('place').trim() };
  S.plans.push(p);
  for (let i = 0; i < p.count; i++) {
    const d = addDays(p.start, i * p.every);
    S.appts.push({ id: uid(), type: p.type, title: `${TYPES[p.type].label}، الدورة ${n(i + 1)} من ${n(p.count)}`, date: d, time: p.time, place: p.place, planId: p.id, remind: true });
    if (fd.get('lab')) S.appts.push({ id: uid(), type: 'lab', title: 'صورة دم كاملة قبل الجلسة', date: addDays(d, -1), time: '09:00', place: '', remind: true });
  }
  save(); f.closest('dialog').close(); UI.cal = { y: D(p.start).getFullYear(), m: D(p.start).getMonth(), sel: p.start }; render(); toast(`اتضافت ${n(p.count)} مواعيد للتقويم`);
};

/* ---------- F3 medications ---------- */
function adherence(days) {
  const t = today(), out = [];
  for (let k = days - 1; k >= 0; k--) {
    const d = addDays(t, -k), ds = dosesFor(d).filter(x => x.status !== 'due');
    out.push({ d, sched: ds.length, taken: ds.filter(x => x.status === 'taken').length });
  }
  return out;
}
function barChart(data) { // RTL: oldest on the right
  const W = 340, H = 150, pad = 24, bw = 26, gap = (W - pad * 2 - bw * data.length) / (data.length - 1);
  return `<svg class="chart" viewBox="0 0 ${W} ${H + 24}" role="img" aria-label="نسبة الالتزام آخر ${n(data.length)} أيام">
    <g class="grid">${[0, 50, 100].map(v => `<line x1="${pad - 6}" x2="${W - pad + 6}" y1="${H - v / 100 * (H - 20)}" y2="${H - v / 100 * (H - 20)}"/>`).join('')}</g>
    ${data.map((x, i) => { const p = x.sched ? x.taken / x.sched : null, h = p == null ? 4 : Math.max(4, p * (H - 20)), X = W - pad - bw - i * (bw + gap);
      return `<rect class="bar ${p == null ? 'empty' : p < .7 ? 'low' : ''}" x="${X}" y="${H - h}" width="${bw}" height="${h}" rx="6"/>
      <text class="val" x="${X + bw / 2}" y="${H - h - 6}" text-anchor="middle">${p == null ? '' : n(Math.round(p * 100)) + '٪'}</text>
      <text class="lbl" x="${X + bw / 2}" y="${H + 18}" text-anchor="middle">${i === data.length - 1 ? 'النهارده' : fmtDate(x.d, { weekday: 'short' })}</text>`; }).join('')}
  </svg>`;
}
V.meds = {
  html() {
    const t = today(), doses = dosesFor(t), ad = adherence(7);
    const tot = ad.reduce((a, x) => ({ s: a.s + x.sched, k: a.k + x.taken }), { s: 0, k: 0 });
    const pct = tot.s ? Math.round(tot.k / tot.s * 100) : 0;
    const canEdit = S.user.role !== 'companion';
    return pageH('الأدوية', 'سجّل أدويتك زي ما الدكتور كتبها بالظبط، وهنفكرك بمواعيدها.', canEdit ? `<button class="btn primary" data-act="medNew">${ic('plus')} أضف دواء</button>` : '') + `
    <div class="grid2">
      <section class="panel"><div class="panel-h"><div><h2>جرعات النهارده</h2><p>${fmtDate(t)}</p></div></div>
        ${doses.length ? doses.map(d => doseRow(d)).join('') : `<div class="empty"><p>مفيش أدوية متسجلة. ابدأ بأول دواء من الروشتة.</p>${canEdit ? `<button class="btn primary sm" data-act="medNew">${ic('plus', 'sm')} أضف دواء</button>` : ''}</div>`}
      </section>
      <section class="panel"><div class="panel-h"><div><h2>التزامك بالأدوية</h2><p>آخر ٧ أيام</p></div><div class="ring" style="--p:${pct}"><b>${n(pct)}٪</b></div></div>
        ${barChart(ad)}
        <p class="tiny" style="margin-top:8px">${pct >= 80 ? 'التزام كويس. كمّل كده.' : tot.s ? 'في جرعات فاتت. لو في سبب زي الغثيان أو النسيان، قول للدكتور في الزيارة الجاية.' : 'هتظهر النسبة أول ما تسجل جرعات.'}</p>
      </section>
    </div>
    <section class="panel" style="margin-top:20px"><div class="panel-h"><h2>أدويتي</h2><span class="tiny">${n(S.meds.length)} أدوية</span></div>
      ${S.meds.length ? S.meds.map(m => `<div class="list-row"><span class="qi" style="width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--nile-soft);color:var(--nile);flex:none">${ic('pill')}</span>
        <div class="grow"><h3>${esc(m.name)}</h3><p>${esc(m.dose)}، ${m.times.map(fmtTime).join(' و')}${m.note ? '. ' + esc(m.note) : ''}</p></div>
        ${canEdit ? `<button class="iconbtn" data-act="medEdit" data-id="${m.id}" aria-label="عدّل">${ic('edit', 'sm')}</button><button class="iconbtn" data-act="medDel" data-id="${m.id}" aria-label="احذف">${ic('trash', 'sm')}</button>` : ''}</div>`).join('') : '<p class="muted">لسه مفيش أدوية.</p>'}
      <div class="note" style="margin-top:14px">${ic('info')}<span>المنصة مش بتقترح أدوية ولا جرعات ولا بتعدّلها. أي تغيير لازم يكون بكلام دكتورك.</span></div>
    </section>`;
  }
};
function medForm(m = {}) {
  const times = m.times && m.times.length ? m.times : ['09:00'];
  return `<form data-form="med" data-id="${m.id || ''}">
    <label class="field"><span>اسم الدواء</span><input class="input" name="name" value="${esc(m.name || '')}" placeholder="زي ما مكتوب في الروشتة" required></label>
    <label class="field"><span>الجرعة زي ما الدكتور كتبها</span><input class="input" name="dose" value="${esc(m.dose || '')}" placeholder="مثلًا: قرص واحد بعد الأكل" required><small>اكتبها من الروشتة بالظبط. المنصة مش بتقترح أو تحسب جرعات.</small></label>
    <div class="field"><span>مواعيد التذكير</span><div id="timesBox" class="chips">${times.map(tm => `<input class="input" style="width:130px" type="time" name="time" value="${tm}" required>`).join('')}</div>
      <div style="display:flex;gap:8px;margin-top:6px"><button type="button" class="btn sm" data-addtime>${ic('plus', 'sm')} ميعاد كمان</button><button type="button" class="btn sm ghost" data-rmtime>شيل آخر ميعاد</button></div></div>
    <label class="field"><span>ملاحظة <small>(اختياري)</small></span><input class="input" name="note" value="${esc(m.note || '')}" placeholder="مثلًا: لمدة ٣ أيام بعد الجلسة"></label>
    <div class="dlg-f"><button class="btn primary">احفظ الدواء</button><button class="btn" type="button" data-close>إلغاء</button></div></form>`;
}
function mountMedForm(d) {
  $('[data-addtime]', d).onclick = () => { const b = $('#timesBox', d); if (b.children.length >= 6) return toast('أقصى حاجة ٦ مواعيد'); b.insertAdjacentHTML('beforeend', `<input class="input" style="width:130px" type="time" name="time" value="12:00" required>`); };
  $('[data-rmtime]', d).onclick = () => { const b = $('#timesBox', d); if (b.children.length > 1) b.lastElementChild.remove(); };
}
ACT.medNew = () => modal('دواء جديد', medForm(), { mount: mountMedForm });
ACT.medEdit = el => modal('عدّل الدواء', medForm(S.meds.find(m => m.id === el.dataset.id)), { mount: mountMedForm });
ACT.medDel = el => { const m = S.meds.find(x => x.id === el.dataset.id); confirmBox('تحذف الدواء؟', `«${esc(m.name)}» وتذكيراته هيتشالوا. سجل الجرعات القديم هيفضل في التقرير.`, 'احذف الدواء', () => { S.meds = S.meds.filter(x => x !== m); save(); render(); toast('اتحذف الدواء'); }); };
FORMS.med = (f, fd) => {
  const times = [...new Set(fd.getAll('time').filter(Boolean))].sort();
  const data = { name: fd.get('name').trim(), dose: fd.get('dose').trim(), times, note: fd.get('note').trim() };
  const id = f.dataset.id;
  if (id) Object.assign(S.meds.find(m => m.id === id), data); else S.meds.push({ id: uid(), ...data });
  save(); f.closest('dialog').close(); render(); toast(id ? 'اتحفظت التعديلات' : 'اتضاف الدواء');
};

/* ---------- F4 symptoms + doctor report ---------- */
function lineChart(days, keys) {
  const W = 480, H = 210, pl = 26, pr = 10, pt = 12, pb = 28, t = today();
  const dates = Array.from({ length: days }, (_, i) => addDays(t, -(days - 1 - i)));
  const X = i => W - pr - (i * (W - pl - pr) / (days - 1)); // RTL
  const Y = v => pt + (10 - v) * (H - pt - pb) / 10;
  const series = keys.map(k => { const s = SYMS.find(x => x.k === k); const pts = dates.map((d, i) => S.symptoms[d] ? [X(i), Y(S.symptoms[d][k] || 0), S.symptoms[d][k] || 0] : null);
    return `<path d="${fixPath(pts)}" fill="none" stroke="${s.c}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${pts.map(p => p ? `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="var(--surface)" stroke="${s.c}" stroke-width="2"><title>${s.label}: ${n(p[2])}</title></circle>` : '').join('')}`; });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="تطور الأعراض آخر ${n(days)} يوم">
    <g class="grid">${[0, 5, 10].map(v => `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}"/>`).join('')}</g>
    <g class="axis">${[0, 5, 10].map(v => `<text x="${pl - 8}" y="${Y(v) + 4}" text-anchor="end">${n(v)}</text>`).join('')}
    ${dates.map((d, i) => i % 2 === (days - 1) % 2 ? `<text x="${X(i)}" y="${H - 8}" text-anchor="middle">${i === days - 1 ? 'النهارده' : n(D(d).getDate())}</text>` : '').join('')}</g>
    ${series.join('')}
  </svg>`;
}
function fixPath(pts) { let d = '', pen = false; pts.forEach(p => { if (!p) { pen = false; return; } d += (pen ? ' L' : ' M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); pen = true; }); return d.trim(); }
V.symptoms = {
  html(param) {
    const t = today(), date = UI.symDate || t, e = S.symptoms[date] || {};
    const last7 = Array.from({ length: 7 }, (_, i) => addDays(t, -i));
    return pageH('الأعراض', 'سجّل إحساسك كل يوم من ٠ لـ ١٠، ووري التقرير لدكتورك في الزيارة.', `<button class="btn primary" data-act="report">${ic('print')} تقرير للدكتور</button>`) + `
    <div class="grid2 sym-grid">
      <section class="panel"><form data-form="sym">
        <div class="panel-h"><h2>${date === t ? 'تسجيل النهارده' : 'تسجيل يوم ' + fmtDate(date, { day: 'numeric', month: 'long' })}</h2>
          <input class="input" type="date" name="date" value="${date}" max="${t}" style="width:auto;min-height:36px" data-symdate aria-label="اليوم"></div>
        <p class="tiny" style="margin-bottom:6px">٠ يعني مفيش خالص، و١٠ يعني أشد حاجة ممكنة.</p>
        ${SYMS.map(s => { const v = e[s.k] ?? 0; return `<div class="sym"><div class="sym-top"><b>${s.label}</b><output><strong>${n(v)}</strong> ${sevWord(v)}</output></div><input type="range" min="0" max="10" step="1" name="${s.k}" value="${v}" style="--v:${v};--sc:${s.c}" aria-label="${s.label}"></div>`; }).join('')}
        <div class="row2" style="margin-top:14px"><label class="field"><span>الحرارة <small>(لو قستها)</small></span><input class="input" type="number" step="0.1" min="34" max="43" name="temp" value="${e.temp ?? ''}" placeholder="مثلًا ٣٧"></label>
        <label class="field"><span>ملاحظة <small>(اختياري)</small></span><input class="input" name="note" value="${esc(e.note || '')}" placeholder="أي حاجة عايز تفتكرها"></label></div>
        <button class="btn primary block">${S.symptoms[date] ? 'احفظ التعديل' : 'احفظ التسجيل'}</button>
      </form></section>
      <div class="stack">
        <section class="panel"><div class="panel-h"><div><h2>التطور</h2><p>آخر ١٤ يوم</p></div></div>
          <div class="chips" style="margin-bottom:10px">${SYMS.map(s => `<button class="chip" data-act="symToggle" data-k="${s.k}" aria-pressed="${UI.chartSyms.includes(s.k)}"><i style="width:10px;height:10px;border-radius:50%;background:${s.c}"></i>${s.label}</button>`).join('')}</div>
          ${Object.keys(S.symptoms).length ? lineChart(14, UI.chartSyms) : '<div class="empty"><p>الرسم هيظهر بعد أول تسجيل.</p></div>'}
        </section>
        <section class="panel"><div class="panel-h"><div><h2>علامات تستدعي التواصل الفوري</h2><p>كلّم فريق علاجك فورًا أو اطلب الإسعاف ١٢٣</p></div></div>
          <ul class="signs">${DANGER.map(d => `<li>${ic('alert', 'sm')}<span>${d}</span></li>`).join('')}</ul>
          <p class="tiny" style="margin-top:10px">صياغة مبدئية للنموذج، والنسخة النهائية بتتعتمد من طبيب.</p>
        </section>
      </div>
    </div>
    <section class="panel" style="margin-top:20px"><div class="panel-h"><h2>آخر ٧ أيام</h2></div><div class="scroll-x"><table class="t"><thead><tr><th>اليوم</th>${SYMS.map(s => `<th>${s.label}</th>`).join('')}<th>الحرارة</th><th></th></tr></thead><tbody>
      ${last7.map(d => { const x = S.symptoms[d]; return `<tr><td>${fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' })}</td>${SYMS.map(s => `<td>${x ? n(x[s.k]) : '<span class="tiny">لم يُسجل</span>'}</td>`).join('')}<td>${x && x.temp ? `<span class="${x.temp >= 38 ? 'tag bad' : ''}">${n(x.temp)}°</span>` : ''}</td><td><button class="btn sm ghost" data-act="symEdit" data-d="${d}">${x ? 'عدّل' : 'سجّل'}</button></td></tr>`; }).join('')}
    </tbody></table></div></section>`;
  },
  mount(root) {
    $$('input[type=range]', root).forEach(r => r.addEventListener('input', () => { r.style.setProperty('--v', r.value); const o = r.closest('.sym').querySelector('output'); o.innerHTML = `<strong>${n(+r.value)}</strong> ${sevWord(+r.value)}`; }));
    const ds = $('[data-symdate]', root); if (ds) ds.addEventListener('change', () => { UI.symDate = ds.value || today(); render(); });
  }
};
ACT.symToggle = el => { const k = el.dataset.k; UI.chartSyms = UI.chartSyms.includes(k) ? UI.chartSyms.filter(x => x !== k) : [...UI.chartSyms, k]; render(); };
ACT.symEdit = el => { UI.symDate = el.dataset.d; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
FORMS.sym = (f, fd) => {
  const date = fd.get('date') || today(), rec = {};
  SYMS.forEach(s => rec[s.k] = +fd.get(s.k));
  const tp = fd.get('temp'); rec.temp = tp ? +(+tp).toFixed(1) : null; rec.note = fd.get('note').trim();
  S.symptoms[date] = rec; save();
  const high = SYMS.filter(s => rec[s.k] >= 8);
  render();
  if ((rec.temp && rec.temp >= 38) || high.length) dangerModal(rec, high); else toast('اتحفظ التسجيل');
};
function dangerModal(rec, high) {
  modal('خلي بالك', `<div class="note alert" style="margin-bottom:14px">${ic('alert')}<span>${rec.temp >= 38 ? `سجلت حرارة ${n(rec.temp)}°. الحرارة ٣٨ أو أكتر أثناء العلاج ممكن تكون علامة عدوى، ` : ''}${high.length ? `سجلت ${high.map(s => s.label).join(' و')} بدرجة شديدة. ` : ''}<b>كلّم فريق علاجك دلوقتي.</b> لو الحالة شديدة أو في صعوبة تنفس، اطلب الإسعاف.</span></div>
    <a class="call" href="tel:123">${ic('phone', 'lg')}<span>اتصل بالإسعاف ١٢٣<small>من أي موبايل في مصر</small></span></a>
    <p class="tiny">التنبيه ده مش تشخيص. صياغة مبدئية في النموذج، والنسخة النهائية بيعتمدها طبيب.</p>
    <div class="dlg-f" style="margin-top:14px"><button class="btn" data-act="sos" data-close>افتح بطاقة الطوارئ</button><button class="btn ghost" data-close>تمام</button></div>`, { cls: 'sosd' });
}
function reportHTML(qs) {
  const t = today(), days = 14, from = addDays(t, -(days - 1));
  const recs = Array.from({ length: days }, (_, i) => addDays(from, i)).map(d => [d, S.symptoms[d]]).filter(x => x[1]);
  const stat = k => { const v = recs.map(r => r[1][k]); if (!v.length) return ['', '', '']; return [n(+(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1)), n(Math.max(...v)), n(v[v.length - 1])]; };
  const temps = recs.map(r => r[1].temp).filter(Boolean);
  const ad = adherence(14), tot = ad.reduce((a, x) => ({ s: a.s + x.sched, k: a.k + x.taken }), { s: 0, k: 0 });
  const notes = recs.filter(r => r[1].note);
  const up = S.appts.filter(a => a.date >= t).sort(byDate).slice(0, 4);
  const md = S.user.medical || {};
  return `<div class="report">
    <div class="rh"><div><h1>تقرير الأعراض للطبيب</h1><div>${esc(S.patientName)}${md.cancerType ? '، ' + esc(md.cancerType) : ''}</div></div><div style="text-align:left;font-size:12px">من ${fmtDate(from, { day: 'numeric', month: 'long' })} لـ ${fmtDate(t, { day: 'numeric', month: 'long', year: 'numeric' })}<br>اتعمل من منصة «معاك»</div></div>
    <h2>ملخص الأعراض (من ٠ لـ ١٠)، ${n(recs.length)} أيام متسجلة</h2>
    <table><thead><tr><th>العرض</th><th>المتوسط</th><th>الأعلى</th><th>آخر تسجيل</th></tr></thead><tbody>${SYMS.map(s => { const [a, m, l] = stat(s.k); return `<tr><td>${s.label}</td><td>${a}</td><td>${m}</td><td>${l}</td></tr>`; }).join('')}
    <tr><td>الحرارة</td><td>${temps.length ? n(+(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)) + '°' : 'مش متسجلة'}</td><td>${temps.length ? n(Math.max(...temps)) + '°' : ''}</td><td>${temps.length ? n(temps[temps.length - 1]) + '°' : ''}</td></tr></tbody></table>
    <h2>تطور الأعراض</h2>${lineChart(14, ['pain', 'nausea', 'fatigue', 'appetite', 'sleep']).replace('class="chart"', 'class="chart" style="max-height:220px"')}
    <div style="font-size:12px">${SYMS.map(s => `<span style="margin-inline-end:14px"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${s.c}"></span> ${s.label}</span>`).join('')}</div>
    <h2>الأدوية والالتزام</h2><p>نسبة الجرعات اللي اتاخدت آخر ١٤ يوم: <b>${tot.s ? n(Math.round(tot.k / tot.s * 100)) + '٪' : 'مفيش بيانات'}</b></p>
    <table><tbody>${S.meds.map(m => `<tr><td>${esc(m.name)}</td><td>${esc(m.dose)}</td><td>${m.times.map(fmtTime).join('، ')}</td></tr>`).join('') || '<tr><td>مفيش أدوية متسجلة</td></tr>'}</tbody></table>
    ${notes.length ? `<h2>ملاحظات المريض</h2><table><tbody>${notes.map(r => `<tr><td style="width:120px">${fmtDate(r[0], { day: 'numeric', month: 'short' })}</td><td>${esc(r[1].note)}</td></tr>`).join('')}</tbody></table>` : ''}
    ${qs ? `<h2>أسئلة عايز أسألها</h2><p style="white-space:pre-wrap">${esc(qs)}</p>` : ''}
    ${up.length ? `<h2>المواعيد الجاية</h2><table><tbody>${up.map(a => `<tr><td style="width:160px">${fmtDate(a.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td><td>${esc(a.title)}</td></tr>`).join('')}</tbody></table>` : ''}
    <p style="margin-top:18px;font-size:11px;color:#51665F">التقرير ده تسجيل ذاتي من المريض للمساعدة في الزيارة، ومش تشخيص طبي.</p>
  </div>`;
}
const REPORT_CSS = `body{font-family:"Readex Pro",Tahoma,sans-serif;color:#132A26;line-height:1.7}
.report h1{font-family:"Aref Ruqaa",serif;font-size:30px;color:#0E6B62;margin:0}.report h2{font-size:16px;margin:18px 0 8px}
.report table{width:100%;border-collapse:collapse}.report th,.report td{border-bottom:1px solid #D6DFD7;padding:6px 8px;text-align:start}
.report .rh{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #0E6B62;padding-bottom:10px}
.chart{width:100%;height:auto;display:block}.chart .grid line{stroke:#D6DFD7}.chart .axis text{fill:#7C8E88;font-size:11.5px}
:root{--surface:#fff}`;
ACT.report = () => {
  const d = modal('تقرير للدكتور', `<label class="field"><span>أسئلة عايز تسألها للدكتور <small>(هتظهر في التقرير)</small></span><textarea class="input" id="repQs" placeholder="مثلًا: التعب ده طبيعي بعد الجلسة التانية؟"></textarea></label>
    <div class="rep-wrap" id="repPrev">${reportHTML('')}</div>
    <div class="dlg-f" style="margin-top:16px"><button class="btn primary" data-print>${ic('print', 'sm')} اطبع أو احفظه PDF</button><button class="btn" data-dlrep>${ic('download', 'sm')} حمّل التقرير</button></div>
    <p class="tiny" style="margin-top:8px">لو الطباعة مش شغالة هنا، حمّل التقرير وافتحه واطبعه «حفظ كـ PDF».</p>`, {
    wide: true, mount(d) {
      $('#repQs', d).addEventListener('input', e => $('#repPrev', d).innerHTML = reportHTML(e.target.value));
      $('[data-print]', d).onclick = () => { $('#print-root').innerHTML = reportHTML($('#repQs', d).value); S.stats.reports++; save(); try { window.print(); } catch (e) { toast('الطباعة مش متاحة هنا. حمّل التقرير.'); } };
      $('[data-dlrep]', d).onclick = async () => {
        let css = [...document.styleSheets].map(ss => { try { return [...ss.cssRules].map(r => r.cssText).join('\n'); } catch (e) { return ''; } }).join('\n');
        if (!css.includes('.report')) css = REPORT_CSS; // when opened from file://, the browser may block reading the stylesheet
        const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير الأعراض</title><link href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@700&family=Readex+Pro:wght@300..700&display=swap" rel="stylesheet"><style>${css} body{background:#fff;padding:24px;max-width:820px;margin:auto}</style></head><body>${reportHTML($('#repQs', d).value)}<script>setTimeout(()=>print(),600)<\/script></body></html>`;
        S.stats.reports++; save();
        const ok = await offerDownload(`تقرير-الأعراض-${today()}.html`, html, 'text/html');
        toast(ok ? 'جاهز. افتحه واختار «حفظ كـ PDF»' : 'اتلغى التحميل');
      };
    }
  });
};

/* ---------- F5 documents vault ---------- */
const fmtSize = b => b > 1e6 ? `${n(+(b / 1e6).toFixed(1))} ميجا` : `${n(Math.max(1, Math.round(b / 1e3)))} كيلو`;
V.docs = {
  html() {
    const cat = UI.docCat, list = S.docs.filter(d => cat === 'all' || d.cat === cat).sort((a, b) => b.date.localeCompare(a.date));
    const now = Date.now(), shares = S.shares.filter(s => s.exp > now);
    const comp = S.user.role === 'companion';
    const visible = comp ? list.filter(d => d.vis === 'companion') : list;
    return pageH('خزنة المستندات', 'تحاليلك وأشعتك وتقاريرك وروشتاتك في مكان واحد، وأنت اللي بتقرر مين يشوف إيه.') + `
    ${comp ? '' : `<section class="panel" style="margin-bottom:20px"><div class="row3" style="align-items:end">
      <label class="field"><span>نوع المستند</span><select class="input" id="upCat">${DOC_CATS.map(c => `<option>${c}</option>`).join('')}</select></label>
      <label class="field"><span>تاريخ المستند</span><input class="input" type="date" id="upDate" value="${today()}" max="${today()}"></label>
      <label class="field"><span>مين يشوفه</span><select class="input" id="upVis">${Object.entries(VIS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label></div>
      <label class="drop" id="drop">${ic('upload', 'lg')}<b>اختار صور أو ملفات PDF</b><span class="tiny">أو اسحبها هنا. الملفات بتتحفظ على جهازك في النموذج ده.</span><input type="file" id="upFile" accept="image/*,application/pdf" multiple hidden></label>
    </section>`}
    <div class="chips" style="margin-bottom:14px">${['all', ...DOC_CATS].map(c => `<button class="chip" data-act="docCat" data-c="${c}" aria-pressed="${cat === c}">${c === 'all' ? 'الكل' : c} <span class="tiny">${n(c === 'all' ? S.docs.length : S.docs.filter(d => d.cat === c).length)}</span></button>`).join('')}</div>
    <section class="panel">
      ${visible.length ? visible.map(d => { const f = FILES[d.id] || d.data; return `<div class="list-row doc">
        <span class="thumb ${d.kind}">${d.kind === 'img' && f ? `<img src="${f}" alt="">` : d.kind === 'pdf' ? 'PDF' : 'صورة'}</span>
        <div class="grow"><h3>${esc(d.name)}</h3><p>${d.cat}، ${fmtDate(d.date, { day: 'numeric', month: 'short', year: 'numeric' })}، ${fmtSize(d.size)}</p></div>
        ${comp ? `<span class="tag">${VIS[d.vis]}</span>` : `<select class="input vis-select" data-vis="${d.id}" aria-label="مين يشوف ${esc(d.name)}">${Object.entries(VIS).map(([k, v]) => `<option value="${k}" ${d.vis === k ? 'selected' : ''}>${v}</option>`).join('')}</select>`}
        <button class="iconbtn" data-act="docView" data-id="${d.id}" aria-label="اعرض">${ic('eye', 'sm')}</button>
        ${comp ? '' : `<button class="iconbtn" data-act="docShare" data-id="${d.id}" aria-label="شارك مع الدكتور">${ic('share', 'sm')}</button><button class="iconbtn" data-act="docDel" data-id="${d.id}" aria-label="احذف">${ic('trash', 'sm')}</button>`}
      </div>`; }).join('') : `<div class="empty"><p>${comp ? 'مفيش مستندات مسموح للمرافق يشوفها.' : 'مفيش مستندات هنا. ارفع أول تحليل أو روشتة من فوق.'}</p></div>`}
    </section>
    ${comp ? '' : `<section class="panel" style="margin-top:20px"><div class="panel-h"><div><h2>روابط المشاركة المفتوحة</h2><p>كل رابط بيقفل لوحده بعد المدة، وتقدر تقفله قبلها</p></div></div>
      ${shares.length ? shares.map(s => { const d = S.docs.find(x => x.id === s.doc); const h = Math.ceil((s.exp - now) / 3600e3);
        return `<div class="list-row"><span class="qi" style="color:var(--nile)">${ic('link')}</span><div class="grow"><h3>${esc(d ? d.name : 'مستند محذوف')}</h3><p dir="ltr" style="text-align:right">maak.eg/s/${s.token}</p></div><span class="tag warn">${h > 24 ? `يقفل بعد ${n(Math.ceil(h / 24))} أيام` : `يقفل بعد ${n(h)} ساعة`}</span><button class="btn sm" data-act="shareClose" data-t="${s.token}">اقفل الرابط</button></div>`; }).join('') : '<p class="muted">مفيش روابط مفتوحة دلوقتي.</p>'}
    </section>`}`;
  },
  mount(root) {
    const inp = $('#upFile', root), drop = $('#drop', root); if (!inp) return;
    inp.addEventListener('change', () => addFiles(inp.files));
    ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => addFiles(e.dataTransfer.files));
    $$('[data-vis]', root).forEach(s => s.addEventListener('change', () => { S.docs.find(d => d.id === s.dataset.vis).vis = s.value; save(); toast(`بقى ظاهر لـ: ${VIS[s.value]}`); }));
  }
};
function addFiles(files) {
  const cat = $('#upCat').value, date = $('#upDate').value || today(), vis = $('#upVis').value;
  const ok = [...files].filter(f => /^image\//.test(f.type) || f.type === 'application/pdf');
  if (!ok.length) return toast('ارفع صور أو ملفات PDF بس');
  let left = ok.length;
  ok.forEach(f => {
    const r = new FileReader();
    r.onload = () => {
      const id = uid(); FILES[id] = r.result;
      const doc = { id, name: f.name.replace(/\.[^.]+$/, ''), cat, date, kind: f.type === 'application/pdf' ? 'pdf' : 'img', size: f.size, vis };
      if (f.size < 350e3) doc.data = r.result; // small files persist across reloads
      S.docs.push(doc);
      if (--left === 0) { save(); render(); toast(`اتحفظ ${n(ok.length)} مستند في الخزنة`); }
    };
    r.readAsDataURL(f);
  });
}
ACT.docCat = el => { UI.docCat = el.dataset.c; render(); };
ACT.docView = el => {
  const d = S.docs.find(x => x.id === el.dataset.id), f = FILES[d.id] || d.data;
  modal(esc(d.name), f && d.kind === 'img' ? `<img src="${f}" alt="${esc(d.name)}" style="border-radius:14px;display:block;margin:auto;max-height:60vh">`
    : `<div class="empty" style="background:var(--surface-2);border-radius:16px;padding:40px">${ic('file', 'lg')}<p style="margin-top:10px">${f ? 'ملف PDF محفوظ. المعاينة الكاملة بتشتغل في النسخة النهائية.' : 'ده مستند تجريبي من غير ملف فعلي.'}</p></div>`
    + `<dl class="meta" style="margin:16px 0 0"><dt>النوع</dt><dd>${d.cat}</dd><dt>التاريخ</dt><dd>${fmtDate(d.date)}</dd><dt>مين يشوفه</dt><dd>${VIS[d.vis]}</dd></dl>`);
};
ACT.docDel = el => { const d = S.docs.find(x => x.id === el.dataset.id); confirmBox('تحذف المستند؟', `«${esc(d.name)}» هيتحذف نهائي، وأي رابط مشاركة ليه هيتقفل.`, 'احذف المستند', () => { S.docs = S.docs.filter(x => x !== d); S.shares = S.shares.filter(s => s.doc !== d.id); delete FILES[d.id]; save(); render(); toast('اتحذف المستند'); }); };
ACT.docShare = el => {
  const d = S.docs.find(x => x.id === el.dataset.id);
  const m = modal('شارك مع الدكتور', `<p class="muted" style="margin-bottom:14px">هنعمل رابط مؤقت لـ «${esc(d.name)}» تبعته لدكتورك. محدش يقدر يفتحه بعد ما المدة تخلص.</p>
    <div class="field"><span>الرابط يفضل شغال لمدة</span><div class="seg" role="group">${[[24, '٢٤ ساعة'], [72, '٣ أيام'], [168, 'أسبوع']].map(([h, l], i) => `<button type="button" data-h="${h}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div></div>
    <div id="shareOut"></div><div class="dlg-f"><button class="btn primary" data-mk>${ic('link', 'sm')} اعمل الرابط</button><button class="btn" data-close>إلغاء</button></div>`, {
    mount(dl) {
      let hrs = 24;
      $$('.seg button', dl).forEach(b => b.onclick = () => { hrs = +b.dataset.h; $$('.seg button', dl).forEach(x => x.setAttribute('aria-pressed', x === b)); });
      $('[data-mk]', dl).onclick = () => {
        const token = Math.random().toString(36).slice(2, 10);
        S.shares.push({ token, doc: d.id, exp: Date.now() + hrs * 3600e3 }); save();
        const url = `https://maak.eg/s/${token}`;
        $('#shareOut', dl).innerHTML = `<div class="field"><span>الرابط جاهز</span><div class="linkbox"><input class="input" readonly value="${url}" id="shUrl"><button class="btn" data-cp>${ic('copy', 'sm')} انسخ</button></div><small>رابط تجريبي للنموذج.</small></div>`;
        $('[data-cp]', dl).onclick = () => copyText(url, $('#shUrl', dl));
        $('[data-mk]', dl).remove(); render();
      };
    }
  });
};
ACT.shareClose = el => { S.shares = S.shares.filter(s => s.token !== el.dataset.t); save(); render(); toast('اتقفل الرابط'); };

/* ---------- F6 directory + map ---------- */
const proj = (lng, lat) => [(lng - 24.6) * 40, (31.9 - lat) * 40];
const EG = [[25.15, 31.6], [27.3, 31.35], [29.9, 31.2], [30.4, 31.5], [31.8, 31.53], [32.3, 31.3], [34.22, 31.32], [34.9, 29.5], [34.25, 27.73], [33.6, 28.3], [33.1, 29.0], [32.55, 29.95], [32.65, 29.1], [33.2, 28.1], [33.8, 27.2], [34.4, 26.1], [34.9, 25.1], [35.5, 23.9], [35.7, 23.0], [36.9, 22.0], [31.4, 22.0], [25.0, 22.0], [25.0, 29.5], [24.85, 30.5]];
const NILE = [[32.9, 22.0], [32.9, 24.1], [32.85, 25.0], [32.65, 25.7], [32.72, 26.15], [31.9, 26.5], [31.18, 27.18], [30.75, 28.1], [31.1, 29.07], [31.24, 30.04], [31.15, 30.5]];
const LBL = { 'القاهرة': [16, 4, 'end'], 'الجيزة': [-12, 14, 'start'], 'الدقهلية': [14, -4, 'end'], 'الغربية': [-12, 6, 'start'], 'الإسكندرية': [-12, 2, 'start'] };
function egyptMap(list, sel) {
  const pts = a => a.map(p => proj(p[0], p[1]).map(v => v.toFixed(1)).join(',')).join(' ');
  const [dx, dy] = proj(31.15, 30.5);
  const pins = list.filter(o => o.lng);
  return `<svg class="chart egypt" viewBox="0 0 500 410" role="img" aria-label="خريطة الجهات">
    <rect class="sea" x="0" y="0" width="500" height="410" rx="18"/>
    <polygon class="land" points="${pts(EG)}"/>
    <polyline class="nile" points="${pts(NILE)}"/>
    <path class="nile" d="M${dx},${dy} L${proj(29.95, 31.45).join(',')} M${dx},${dy} L${proj(31.8, 31.45).join(',')}"/>
    <text x="${proj(27.2, 26.5)[0]}" y="${proj(27.2, 26.5)[1]}" text-anchor="middle" style="font-size:15px;opacity:.6">مصر</text>
    <text x="${proj(36.2, 25.5)[0]}" y="${proj(36.2, 25.5)[1]}" text-anchor="middle" style="opacity:.6">البحر الأحمر</text>
    <text x="${proj(28.4, 31.75)[0]}" y="${proj(28.4, 31.75)[1]}" text-anchor="middle" style="opacity:.6">البحر المتوسط</text>
    ${pins.map(o => { const [x, y] = proj(o.lng, o.lat); return `<circle class="pin ${o.id === sel ? 'sel' : ''}" cx="${x}" cy="${y}" r="${o.id === sel ? 10 : 7}" tabindex="0" role="button" data-act="orgSel" data-id="${o.id}" aria-label="${esc(o.name)}"><title>${esc(o.name)}</title></circle>`; }).join('')}
    ${[...new Set(pins.map(o => o.gov))].map(g => { const o = pins.find(p => p.gov === g); const [x, y] = proj(o.lng, o.lat); const [ox, oy, an] = LBL[g] || [-13, 4, 'start']; return `<text class="big" x="${x + ox}" y="${y + oy}" text-anchor="${an}" style="direction:rtl">${g}</text>`; }).join('')}
  </svg>`;
}
const verifiedDate = o => addDays(today(), o.verified);
function orgCard(o, reasons) {
  return `<article class="org ${UI.dir.sel === o.id ? 'sel' : ''}" id="org-${o.id}">
    <div class="org-h"><div><h3>${esc(o.name)}</h3><div class="chips" style="margin-top:6px"><span class="tag">${ORG_TYPES[o.type]}</span><span class="tag">${ic('pin', 'sm')}${o.gov}</span><span class="tag ok">${ic('check', 'sm')}موثّقة</span></div></div>
    ${o.lng ? `<button class="btn sm" data-act="orgMap" data-id="${o.id}">${ic('map', 'sm')} على الخريطة</button>` : ''}</div>
    <p class="desc">${esc(o.desc)}</p>
    <div class="chips">${o.needs.map(k => `<span class="tag">${NEEDS[k]}</span>`).join('')}</div>
    ${reasons ? `<ul class="why">${reasons.map(r => `<li>${ic('check', 'sm')}${r}</li>`).join('')}</ul>` : ''}
    <dl><div><dt>المصدر:</dt><dd>${esc(o.source)}</dd></div><div><dt>آخر تحقق:</dt><dd>${fmtDate(verifiedDate(o), { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div></dl>
  </article>`;
}
V.directory = {
  html() {
    const f = UI.dir, q = norm(f.q);
    const list = ORGS.filter(o => (f.gov === 'all' || o.gov === f.gov || o.gov === 'كل المحافظات') && (f.type === 'all' || o.type === f.type) && (f.need === 'all' || o.needs.includes(f.need)) && (!q || norm(o.name + o.desc + o.gov).includes(q)));
    const sel = f.sel && ORGS.find(o => o.id === f.sel);
    return pageH('دليل الخدمات', 'مستشفيات ومراكز أورام وجمعيات وبرامج دعم مالي ودوائي. كل جهة عليها مصدرها وتاريخ آخر تحقق.', `<a class="btn primary" href="#helpme">${ic('compass')} مين يساعدني؟</a>`) + `
    <div class="note warm" style="margin-bottom:18px">${ic('info')}<span>بيانات النموذج للعرض. في النسخة الحقيقية كل جهة بيتحقق منها فريق المنصة، وبيتضاف رقمها وعنوانها الرسمي.</span></div>
    <div class="filters">
      <label class="q" style="position:relative"><span class="sr">ابحث</span><input class="input" id="dirQ" value="${esc(f.q)}" placeholder="ابحث باسم الجهة أو المدينة"></label>
      <select class="input" data-f="gov" aria-label="المحافظة"><option value="all">كل المحافظات</option>${GOVS.map(g => `<option ${f.gov === g ? 'selected' : ''}>${g}</option>`).join('')}</select>
      <select class="input" data-f="type" aria-label="نوع الجهة"><option value="all">كل الأنواع</option>${Object.entries(ORG_TYPES).map(([k, v]) => `<option value="${k}" ${f.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <select class="input" data-f="need" aria-label="نوع المساعدة"><option value="all">كل الخدمات</option>${Object.entries(NEEDS).map(([k, v]) => `<option value="${k}" ${f.need === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
      <div class="seg" role="group" aria-label="طريقة العرض"><button data-act="dirMode" data-m="list" aria-pressed="${f.mode === 'list'}">${ic('list', 'sm')}قائمة</button><button data-act="dirMode" data-m="map" aria-pressed="${f.mode === 'map'}">${ic('map', 'sm')}خريطة</button></div>
    </div>
    <p class="tiny" style="margin-bottom:8px">${n(list.length)} جهة</p>
    ${f.mode === 'map' ? `<div class="map-wrap"><section class="panel" style="padding:12px">${egyptMap(list, f.sel)}<p class="tiny" style="padding:6px 8px 0">اضغط على أي نقطة. الجهات اللي بتخدم كل المحافظات موجودة في القائمة.</p></section>
      <section class="panel">${sel ? orgCard(sel) : `<p class="muted">اختار جهة من الخريطة عشان تشوف تفاصيلها.</p>`}${list.filter(o => !o.lng).length ? `<h3 style="font-size:15px;margin-top:16px">بتخدم كل المحافظات</h3>${list.filter(o => !o.lng).map(o => `<button class="btn sm" style="margin:6px 0 0 6px" data-act="orgSel" data-id="${o.id}">${esc(o.name)}</button>`).join('')}` : ''}</section></div>`
      : `<section class="panel">${list.length ? list.map(o => orgCard(o)).join('') : `<div class="empty"><p>مفيش جهات بالفلاتر دي. جرّب تشيل فلتر أو تستخدم «مين يساعدني؟».</p><button class="btn" data-act="dirReset">امسح الفلاتر</button></div>`}</section>`}`;
  },
  mount(root) {
    $$('[data-f]', root).forEach(s => s.addEventListener('change', () => { UI.dir[s.dataset.f] = s.value; render(); }));
    const q = $('#dirQ', root); let tm;
    q.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => { UI.dir.q = q.value; render(); const n2 = $('#dirQ'); n2.focus(); n2.setSelectionRange(n2.value.length, n2.value.length); }, 250); });
  }
};
ACT.dirMode = el => { UI.dir.mode = el.dataset.m; render(); };
ACT.dirReset = () => { Object.assign(UI.dir, { gov: 'all', type: 'all', need: 'all', q: '' }); render(); };
ACT.orgSel = el => { UI.dir.sel = el.dataset.id; UI.dir.mode = 'map'; render(); };
ACT.orgMap = el => { UI.dir.sel = el.dataset.id; UI.dir.mode = 'map'; if (route().name !== 'directory') location.hash = 'directory'; else render(); };

/* ---------- "مين يساعدني؟" wizard ---------- */
V.helpme = {
  html() {
    const h = UI.help, st = h.step;
    const steps = ['المحافظة', 'نوع المساعدة', 'المريض'];
    const head = `<ol class="steps">${steps.map((s, i) => `<li class="${st === i + 1 ? 'on' : st > i + 1 ? 'done' : ''}"><b>${st > i + 1 ? ic('check', 'sm') : n(i + 1)}</b>${s}</li>`).join('')}</ol>`;
    let body = '';
    if (st === 1) body = `<h2 style="font-size:22px;margin-bottom:6px">إنت في أنهي محافظة؟</h2><p class="muted" style="margin-bottom:16px">هنرشحلك الأقرب ليك الأول.</p>
      <div class="choice-grid">${GOVS.map(g => `<button class="choice" data-act="helpGov" data-g="${g}" aria-pressed="${h.gov === g}">${g}</button>`).join('')}<button class="choice" data-act="helpGov" data-g="أخرى" aria-pressed="${h.gov === 'أخرى'}">محافظة تانية</button></div>`;
    if (st === 2) body = `<h2 style="font-size:22px;margin-bottom:6px">محتاج مساعدة في إيه؟</h2><p class="muted" style="margin-bottom:16px">اختار كل اللي ينطبق.</p>
      <div class="choice-grid">${Object.entries(NEEDS).map(([k, v]) => `<button class="choice" data-act="helpNeed" data-k="${k}" aria-pressed="${h.needs.includes(k)}">${v}</button>`).join('')}</div>
      <div class="dlg-f" style="margin-top:20px"><button class="btn primary" data-act="helpStep" data-s="3" ${h.needs.length ? '' : 'disabled'}>التالي</button><button class="btn ghost" data-act="helpStep" data-s="1">رجوع</button></div>`;
    if (st === 3) body = `<h2 style="font-size:22px;margin-bottom:6px">المساعدة لمين؟</h2><p class="muted" style="margin-bottom:16px">في جهات متخصصة في الأطفال أو السيدات.</p>
      <div class="choice-grid">${[['kid', 'طفل', 'أقل من ١٨ سنة'], ['woman', 'ست', '١٨ سنة أو أكتر'], ['man', 'راجل', '١٨ سنة أو أكتر']].map(([k, l, s]) => `<button class="choice" data-act="helpWho" data-w="${k}" aria-pressed="${h.who === k}">${l}<small>${s}</small></button>`).join('')}</div>
      <div class="dlg-f" style="margin-top:20px"><button class="btn ghost" data-act="helpStep" data-s="2">رجوع</button></div>`;
    if (st === 4) {
      const res = ORGS.map(o => {
        if (o.audience === 'kids' && h.who !== 'kid') return null;
        if (o.audience === 'women' && h.who !== 'woman') return null;
        const why = [], match = o.needs.filter(k => h.needs.includes(k));
        if (!match.length) return null;
        let sc = match.length * 3;
        if (o.gov === h.gov) { sc += 5; why.push('في محافظتك'); }
        else if (h.gov !== 'أخرى' && o.lng && REGION(o.gov) === REGION(h.gov)) { sc += 2; why.push('في نفس المنطقة'); }
        if (o.national) { sc += 1; if (!why.length) why.push('بتستقبل من كل المحافظات'); }
        match.forEach(k => why.push(`بتقدم ${NEEDS[k]}`));
        if (o.audience === 'kids') why.push('متخصصة في الأطفال');
        if (o.audience === 'women') why.push('متخصصة في السيدات');
        return { o, sc, why };
      }).filter(Boolean).sort((a, b) => b.sc - a.sc).slice(0, 5);
      body = `<div class="panel-h"><div><h2 style="font-size:22px">رشحنالك ${n(res.length)} جهات</h2><p>${h.gov === 'أخرى' ? 'جهات بتخدم كل المحافظات' : 'في ' + h.gov + ' أو قريب منها'}، ل${h.needs.map(k => NEEDS[k]).join(' و')}</p></div><button class="btn" data-act="helpReset">ابدأ من الأول</button></div>
        ${res.length ? res.map(r => orgCard(r.o, r.why)).join('') : `<div class="empty"><p>ملقيناش جهة مناسبة في الدليل لسه. جرّب «دعم مالي» أو شوف الدليل كله.</p><a class="btn" href="#directory">الدليل كله</a></div>`}
        <div class="note" style="margin-top:12px">${ic('info')}<span>الترشيحات دي مبنية على إجاباتك بس. اتأكد من الجهة قبل ما تروح، وفريق علاجك يقدر يوجهك كمان.</span></div>`;
    }
    return pageH('مين يساعدني؟', 'جاوب على ٣ أسئلة بسيطة ونرشحلك الجهات المناسبة ليك.') + `<section class="panel">${head}${body}</section>`;
  }
};
ACT.helpGov = el => { UI.help.gov = el.dataset.g; UI.help.step = 2; render(); };
ACT.helpNeed = el => { const k = el.dataset.k, a = UI.help.needs; UI.help.needs = a.includes(k) ? a.filter(x => x !== k) : [...a, k]; render(); };
ACT.helpWho = el => { UI.help.who = el.dataset.w; UI.help.step = 4; render(); };
ACT.helpStep = el => { UI.help.step = +el.dataset.s; render(); };
ACT.helpReset = () => { UI.help = { step: 1, gov: null, needs: [], who: null }; render(); };

/* ---------- F7 library + glossary ---------- */
V.library = {
  html() {
    const L = UI.lib, q = norm(L.q), cats = [...new Set(ARTICLES.map(a => a.cat))];
    const arts = ARTICLES.filter(a => (L.cat === 'all' || a.cat === L.cat) && (!q || norm(a.title + a.summary + a.kw.join(' ')).includes(q)));
    const gl = GLOSSARY.filter(g => !q || norm(g.t + g.e + g.d + g.a.join(' ')).includes(q)).sort((a, b) => a.t.localeCompare(b.t, 'ar'));
    return pageH('المكتبة والقاموس', 'معلومات بلغة بسيطة، كل مقال عليه مصدره واسم اللي راجعه وتاريخ آخر مراجعة.') + `
    <div class="tabs" role="tablist"><button role="tab" data-act="libTab" data-t="articles" aria-selected="${L.tab === 'articles'}">المقالات (${n(ARTICLES.length)})</button><button role="tab" data-act="libTab" data-t="gloss" aria-selected="${L.tab === 'gloss'}">القاموس الطبي (${n(GLOSSARY.length)})</button></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;align-items:center"><input class="input" id="libQ" style="max-width:360px" value="${esc(L.q)}" placeholder="${L.tab === 'gloss' ? 'ابحث عن مصطلح، مثلًا: خزعة' : 'ابحث في المقالات'}">
      ${L.tab === 'articles' ? `<div class="chips">${['all', ...cats].map(c => `<button class="chip" data-act="libCat" data-c="${c}" aria-pressed="${L.cat === c}">${c === 'all' ? 'الكل' : c}</button>`).join('')}</div>` : ''}</div>
    <section class="panel">${L.tab === 'articles'
      ? (arts.length ? arts.map(a => `<a class="art-row" href="#article-${a.id}"><span class="cat-bar" style="--c:${a.c}"></span><span><span class="tiny">${a.cat}</span><h3>${a.title}</h3><p>${a.summary}</p></span><span class="min">${n(a.min)} دقايق قراءة</span></a>`).join('') : '<div class="empty"><p>مفيش مقالات بالكلمة دي. جرّب كلمة تانية أو اسأل المساعد.</p></div>')
      : (gl.length ? `<dl>${gl.map(g => `<div class="gloss"><dt>${g.t}<small>${g.e}</small></dt><dd>${g.d}</dd></div>`).join('')}</dl><p class="tiny" style="margin-top:12px">المصدر: قاموس المعهد الوطني للسرطان الأمريكي (NCI)، بصياغة مبسطة راجعها فريق المنصة.</p>` : '<div class="empty"><p>المصطلح ده مش في القاموس لسه.</p></div>')}
    </section>`;
  },
  mount(root) { const q = $('#libQ', root); let tm; q.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => { UI.lib.q = q.value; render(); const x = $('#libQ'); x.focus(); x.setSelectionRange(x.value.length, x.value.length); }, 250); }); }
};
ACT.libTab = el => { UI.lib.tab = el.dataset.t; render(); };
ACT.libCat = el => { UI.lib.cat = el.dataset.c; render(); };
V.article = {
  html(id) {
    const a = ARTICLES.find(x => x.id === id);
    if (!a) return `<div class="empty"><p>المقال ده مش موجود.</p><a class="btn" href="#library">رجوع للمكتبة</a></div>`;
    const rel = ARTICLES.filter(x => x.id !== a.id && x.cat === a.cat).concat(ARTICLES.filter(x => x.id !== a.id && x.cat !== a.cat)).slice(0, 3);
    return `<div class="article"><a class="btn ghost sm" href="#library" style="margin-top:12px">${ic('back', 'sm')} المكتبة</a>
      <p class="tiny" style="margin-top:14px">${a.cat}</p><h1>${a.title}</h1>
      <dl class="meta"><dt>المصدر</dt><dd>${a.source}</dd><dt>المراجعة الطبية</dt><dd>${a.reviewer}</dd><dt>آخر مراجعة</dt><dd>${fmtDate(addDays(today(), a.reviewed), { day: 'numeric', month: 'long', year: 'numeric' })}</dd></dl>
      <div class="body">${a.body.map(b => typeof b === 'string' ? `<p>${b}</p>` : `<ul>${b.list.map(li => `<li>${li}</li>`).join('')}</ul>`).join('')}</div>
      <div class="note warm">${ic('info')}<span>المعلومات دي عامة ومش بديل عن كلام دكتورك. أي سؤال عن حالتك بالذات، اسأل فريق علاجك.</span></div>
      <h2 style="font-size:17px;margin:28px 0 4px">مقالات تانية</h2>${rel.map(r => `<a class="art-row" href="#article-${r.id}"><span class="cat-bar" style="--c:${r.c}"></span><span><h3>${r.title}</h3><p>${r.summary}</p></span><span class="min">${n(r.min)} دقايق</span></a>`).join('')}
    </div>`;
  }
};

/* ---------- F8 community ---------- */
V.community = {
  html() {
    const g = UI.com.g, grp = GROUPS.find(x => x.id === g);
    const posts = S.posts.filter(p => p.g === g && (!p.removed)).sort((a, b) => b.ts - a.ts);
    return pageH('مجتمع الدعم', 'مساحة آمنة تحكي فيها وتسمع من ناس عدّت بنفس التجربة.') + `
    <div class="com">
      <nav class="groups" aria-label="المجموعات">${GROUPS.map(x => `<button data-act="comG" data-g="${x.id}" aria-pressed="${x.id === g}">${x.name}<span>${n(x.members)}</span></button>`).join('')}</nav>
      <div class="stack">
        <section class="panel composer"><form data-form="post">
          <label class="sr" for="postTxt">اكتب منشور</label><textarea id="postTxt" name="text" placeholder="شارك تجربتك أو اسأل المجموعة، «${grp.name}» بتسمعك…" required maxlength="1200"></textarea>
          <div id="postErr"></div>
          <div class="composer-f"><label class="check" style="margin:0"><input type="checkbox" name="anon"> انشر باسم مجهول</label><button class="btn primary">${ic('send', 'sm flip')} انشر</button></div>
        </form></section>
        <div class="note">${ic('shield')}<span>ممنوع نصايح الجرعات أو وقف العلاج أو بدائل له، وممنوع الإعلانات. المنشورات بتعدي على فلتر تلقائي، وتقدر تبلّغ عن أي حاجة.</span></div>
        <section class="panel">${posts.length ? posts.map(postHTML).join('') : '<div class="empty"><p>لسه مفيش منشورات هنا. ابدأ أنت.</p></div>'}</section>
      </div>
    </div>`;
  }
};
function postHTML(p) {
  const name = p.anon ? 'عضو مجهول' : p.author, open = UI.com.open[p.id];
  return `<article class="post" id="post-${p.id}">
    ${p.mine && p.flagged ? `<span class="held">${ic('heart', 'sm')} منشورك اتنشر، وفريق الدعم هيتواصل معاك لو حبيت.</span>` : ''}
    <div class="post-h"><span class="pa ${p.anon ? 'anon' : ''}">${p.anon ? '؟' : esc(name.charAt(0))}</span><div><b>${esc(name)}${p.mine ? ' (أنت)' : ''}</b><small>${agoWord(p.ts)}</small></div></div>
    <p class="txt">${esc(p.text)}</p>
    <div class="post-f"><button data-act="support" data-id="${p.id}" aria-pressed="${!!p.supported}">${ic('heart', 'sm')} دعمتك ${p.support ? '(' + n(p.support) + ')' : ''}</button>
      <button data-act="toggleReplies" data-id="${p.id}">${ic('chat', 'sm')} ${p.replies.length === 1 ? 'رد واحد' : p.replies.length === 2 ? 'ردين' : p.replies.length ? n(p.replies.length) + ' ردود' : 'رد'}</button>
      ${p.mine ? '' : `<button class="rep" data-act="reportPost" data-id="${p.id}">${ic('flag', 'sm')} بلّغ</button>`}</div>
    ${open ? `<div class="replies">${p.replies.map(r => `<div class="reply"><b>${esc(r.author)}</b><p>${esc(r.text)}</p></div>`).join('')}
      <form class="reply-in" data-form="reply" data-id="${p.id}"><input class="input" name="text" placeholder="اكتب رد داعم…" required><button class="btn sm primary">رد</button></form><div class="reply-err"></div></div>` : ''}
  </article>`;
}
const modMsg = {
  medical: 'المنشور فيه نصيحة عن جرعات أو وقف علاج أو بديل ليه، وده ممنوع حفاظًا على الأعضاء. احكي تجربتك من غير ما توجّه حد لدوا أو جرعة، والأسئلة الطبية اسألها لدكتورك.',
  ad: 'المنشور فيه رابط أو رقم تليفون أو إعلان، وده ممنوع في المجتمع. شيلهم وانشر تاني.'
};
ACT.comG = el => { UI.com.g = el.dataset.g; render(); };
ACT.support = el => { const p = S.posts.find(x => x.id === el.dataset.id); p.supported = !p.supported; p.support += p.supported ? 1 : -1; save(); render(); };
ACT.toggleReplies = el => { UI.com.open[el.dataset.id] = !UI.com.open[el.dataset.id]; render(); };
FORMS.post = (f, fd) => {
  const text = fd.get('text').trim(); if (!text) return;
  const m = moderate(text), err = $('#postErr');
  if (m === 'medical' || m === 'ad') { err.innerHTML = `<div class="note alert" style="margin:8px 0">${ic('alert')}<span>${modMsg[m]}</span></div>`; S.stats.blocked = (S.stats.blocked || 0) + 1; save(); return; }
  const p = { id: uid(), g: UI.com.g, author: firstName(S.user.name), anon: !!fd.get('anon'), ts: Date.now(), text, support: 0, supported: false, replies: [], mine: true };
  if (m === 'risk') { p.flagged = true; S.flags.push({ id: uid(), post: p.id, text, ts: Date.now(), status: 'open' }); }
  S.posts.push(p); save(); render();
  if (m === 'risk') riskModal(); else toast('اتنشر');
};
FORMS.reply = (f, fd) => {
  const text = fd.get('text').trim(), m = moderate(text), p = S.posts.find(x => x.id === f.dataset.id);
  if (m === 'medical' || m === 'ad') { f.nextElementSibling.innerHTML = `<p class="err" style="margin-top:6px">${modMsg[m]}</p>`; return; }
  p.replies.push({ author: firstName(S.user.name), text, ts: Date.now() });
  if (m === 'risk') S.flags.push({ id: uid(), post: p.id, text, ts: Date.now(), status: 'open' });
  save(); render(); if (m === 'risk') riskModal(); else toast('اتنشر الرد');
};
function riskModal() {
  modal('إحنا هنا معاك', `<p style="margin-bottom:14px;font-size:16.5px">واضح إنك شايل حاجات تقيلة دلوقتي. اللي بتحس بيه مهم، ومش لازم تعدّيه لوحدك.</p>
    <div class="stack" style="gap:10px"><a class="call" style="margin:0" href="tel:123">${ic('phone', 'lg')}<span>لو حاسس إنك مش في أمان دلوقتي، اتصل بالطوارئ ١٢٣</span></a>
    <a class="quick" href="#support" data-close><span class="qi">${ic('leaf')}</span><span><b>صفحة «أحتاج مساعدة الآن»</b><span>تمارين تهدئة وجهات دعم نفسي</span></span></a>
    <p class="muted">كلّم حد بتثق فيه وقوله إنك محتاجه جنبك. ومشرف المجموعة اتبلغ عشان يطمن عليك.</p></div>`);
}
ACT.reportPost = el => {
  const p = S.posts.find(x => x.id === el.dataset.id);
  const d = modal('بلّغ عن المنشور', `<p class="muted" style="margin-bottom:12px">البلاغ بيوصل للمشرفين بس، وصاحب المنشور مش هيعرف مين بلّغ.</p>
    <div class="stack" style="gap:8px">${['نصيحة طبية خطيرة', 'إعلان أو بيع', 'إساءة أو تنمر', 'حاجة تانية'].map(r => `<button class="choice" data-r="${r}">${r}</button>`).join('')}</div>`, {
    mount(dl) { $$('[data-r]', dl).forEach(b => b.onclick = () => { S.reports.push({ id: uid(), post: p.id, postText: p.text, reason: b.dataset.r, ts: Date.now(), status: 'open' }); save(); dl.close(); renderChrome(route().name); toast('وصل بلاغك للمشرفين. شكرًا إنك بتحافظ على المكان آمن.'); }); }
  });
};

/* ---------- F11 assistant ---------- */
const BOT_SUG = ['يعني إيه خزعة؟', 'إزاي أتعامل مع الغثيان؟', 'إيه هو البورت؟', 'أزود جرعة الدوا؟', 'الأكل أثناء الكيماوي'];
function botReply(q) {
  const t = norm(q);
  if (/(نزيف|مش قادر اتنفس|مش قادره اتنفس|ضيق تنفس|صعوبه في التنفس|الم في الصدر|اغمي|اغماء|طوارئ|(حراره|سخونيه)\s*(عاليه|3[89]|٣[٨٩]|40|٤٠))/.test(t))
    return { cls: 'urgent', html: `ده ممكن يكون موقف محتاج تصرف سريع، وأنا مش أقدر أقيّمه. <b>كلّم فريق علاجك فورًا، أو اطلب الإسعاف على ١٢٣.</b><div class="actions"><button class="btn sm danger" data-act="sos">${ic('phone', 'sm')} افتح بطاقة الطوارئ</button></div>` };
  if (/(جرعه|جرعات|كام (حبايه|قرص|مجم)|مجم|ملجم|ازود|اقلل|اوقف (الدوا|العلاج)|ينفع اخد|اخده مع|اخد ايه|اخد كام|بدل الدوا|ينفع اوقف)/.test(t))
    return { cls: 'refuse', html: 'السؤال ده عن جرعة أو تغيير في دوا، ودي حاجة لازم يحددها دكتورك أو الصيدلي اللي عارف حالتك بالتفصيل. ممكن تكتب السؤال في «أسئلة للدكتور» في تقرير الأعراض عشان متنساهوش.' };
  if (/(هل (ده|دي|دا|عندي)|عندي .*(سرطان|ورم)|تشخيص|شخصني|حالتي|مرحلتي|هعيش|هخف|نسبه الشفاء|نتيجه التحليل بتاعي|التحليل بتاعي)/.test(t))
    return { cls: 'refuse', html: 'مقدرش أشخّص أو أحكم على حالة معينة أو نتيجة تحليل، لأن ده محتاج دكتور شايف كل التفاصيل. أقدر أشرحلك أي مصطلح مكتوب في التقرير لو حبيت.' };
  const g = GLOSSARY.find(x => [x.t, ...x.a].some(a => t.includes(norm(a.replace(/[()]/g, '')))) || t.includes(norm(x.e)));
  const glossAns = () => ({ html: `<b>${g.t}</b> (${g.e}): ${g.d}`, src: `المصدر: القاموس الطبي في المكتبة` });
  let best = null, bs = 0;
  ARTICLES.forEach(a => { const s = a.kw.filter(k => t.includes(norm(k))).length + (t.includes(norm(a.title)) ? 3 : 0); if (s > bs) { bs = s; best = a; } });
  const defQ = /(يعني ايه|ايه هو|ايه هي|ايه معني|معني|ما هو|ما هي|اشرح|اشرحلي)/.test(t);
  if (g && (defQ || !best)) return glossAns();
  if (best) { const first = best.body.find(b => typeof b !== 'string'); return { html: `${best.summary}${first ? `<ul style="margin:8px 0 0;padding-inline-start:20px">${first.list.slice(0, 3).map(l => `<li>${l}</li>`).join('')}</ul>` : ''}`, src: `من مقال: <a href="#article-${best.id}">${best.title}</a>، مراجعة ${best.reviewer}` }; }
  return { html: 'ملقيتش إجابة للسؤال ده في مكتبة المعرفة المعتمدة، وأنا مش بجاوب من برّه المكتبة عشان أضمن إن المعلومة صح. جرّب تسأل عن مصطلح معين، أو اسأل فريق علاجك.' };
}
V.assistant = {
  html() {
    const msgs = S.chat.length ? S.chat : [{ me: false, html: `أهلًا يا ${esc(firstName(S.user.name))}. أنا مساعد «معاك». بشرح المصطلحات الطبية وبجاوب الأسئلة العامة من مكتبة المعرفة المعتمدة بس، وبقولك المصدر. مقدرش أشخّص أو أحدد علاج أو جرعات.` }];
    return pageH('المساعد', 'بيبسّط المصطلحات ويجاوب من مكتبة المعرفة المعتمدة بس.', S.chat.length ? `<button class="btn" data-act="chatClear">${ic('trash', 'sm')} امسح المحادثة</button>` : '') + `
    <section class="panel chat"><div class="msgs" id="msgs" aria-live="polite">${msgs.map(m => `<div class="msg ${m.me ? 'me' : 'bot'} ${m.cls || ''}">${m.html}${m.src ? `<span class="src">${m.src}</span>` : ''}</div>`).join('')}</div>
      <div class="chat-sug">${BOT_SUG.map(s => `<button class="chip" data-act="chatSug">${s}</button>`).join('')}</div>
      <form class="chat-in" data-form="chat"><label class="sr" for="chatQ">سؤالك</label><input class="input" id="chatQ" name="q" placeholder="اسأل عن مصطلح أو عرض جانبي…" autocomplete="off" required><button class="btn primary" aria-label="ابعت">${ic('send', 'flip')}</button></form>
    </section>`;
  },
  mount(root) { const m = $('#msgs', root); m.scrollTop = m.scrollHeight; }
};
function ask(q) {
  S.chat.push({ me: true, html: esc(q) }); save(); render();
  const m = $('#msgs'); m.insertAdjacentHTML('beforeend', `<div class="msg bot" id="typing"><span class="typing"><i></i><i></i><i></i></span></div>`); m.scrollTop = m.scrollHeight;
  setTimeout(() => { const r = botReply(q); S.chat.push({ me: false, ...r }); save(); if (route().name === 'assistant') { render(); $('#chatQ') && $('#chatQ').focus(); } }, 650);
}
FORMS.chat = (f, fd) => { const q = fd.get('q').trim(); if (q) ask(q); };
ACT.chatSug = el => ask(el.textContent);
ACT.chatClear = () => { S.chat = []; save(); render(); };

/* ---------- F10 psychological support ---------- */
const MOODS = [[1, 'تعبان جدًا', -3, '#B33A2C'], [2, 'مضايق', -1.5, '#C98A1E'], [3, 'عادي', 0, '#7C8E88'], [4, 'كويس', 1.8, '#3B6AA0'], [5, 'مرتاح', 3, '#0E6B62']];
const face = c => `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="14" cy="16" r="1.8" fill="currentColor"/><circle cx="26" cy="16" r="1.8" fill="currentColor"/><path d="M12.5 26 Q20 ${26 + c * 2} 27.5 26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;
let breathTimer = null;
V.support = {
  html() {
    const t = today(), cur = S.mood[t];
    const strip = Array.from({ length: 14 }, (_, i) => addDays(t, -(13 - i)));
    return pageH('راحة نفسية', 'أدوات بسيطة تساندك في الأيام الصعبة. مش علاج، ومش بديل عن الأخصائي النفسي.') + `
    <div class="grid2">
      <div class="stack">
        <section class="panel"><div class="panel-h"><div><h2>مزاجك النهارده</h2><p>اختيار واحد بس، ومحدش بيشوفه غيرك</p></div></div>
          <div class="moods">${MOODS.map(([v, l, c, col]) => `<button class="mood" data-act="mood" data-v="${v}" aria-pressed="${cur === v}" style="color:${cur === v ? col : 'var(--ink-3)'}">${face(c)}<span style="color:var(--ink-2)">${l}</span></button>`).join('')}</div>
          <div class="mood-strip" aria-label="مزاجك آخر ١٤ يوم">${strip.map(d => { const m = MOODS.find(x => x[0] === S.mood[d]); return `<i title="${fmtDate(d, { day: 'numeric', month: 'short' })}: ${m ? m[1] : 'متسجلش'}" style="${m ? `background:${m[3]};opacity:.75;border-color:transparent` : ''}"></i>`; }).join('')}</div>
          <p class="tiny" style="margin-top:6px">آخر ١٤ يوم، من اليمين للشمال</p>
        </section>
        <section class="panel now-help"><div class="panel-h"><h2>أحتاج مساعدة دلوقتي</h2></div>
          <p style="margin-bottom:12px">لو حاسس إنك مش في أمان أو بتفكر تأذي نفسك، متستناش.</p>
          <a class="call" href="tel:123" style="margin:0 0 12px">${ic('phone', 'lg')}<span>اتصل بالطوارئ ١٢٣</span></a>
          <div class="stack" style="gap:8px"><a class="quick" href="#directory" data-act="psychDir"><span class="qi">${ic('compass')}</span><span><b>جهات دعم نفسي</b><span>من دليل الخدمات</span></span></a>
          <p class="muted" style="font-size:14.5px">وكلّم حد بتثق فيه وقوله «محتاجك جنبي النهارده». ده مش ضعف.</p></div>
        </section>
      </div>
      <section class="panel"><div class="panel-h"><div><h2>تمرين تنفس</h2><p>شهيق ٤ ثواني، اكتم ٤، زفير ٦. كرره ٥ مرات.</p></div></div>
        <div class="breath"><div class="orb" id="orb"><span class="core" id="orbTxt">جاهز؟</span></div><div class="breath-bar"><i id="breathBar"></i></div><p class="muted" id="breathCount">ابدأ لما تحس إنك مرتاح في قعدتك</p>
        <button class="btn primary" data-act="breath" id="breathBtn">${ic('wind', 'sm')} ابدأ التمرين</button></div>
        <h3 style="font-size:15px;margin:18px 0 8px">تمارين تانية</h3>
        <div class="list-row"><div class="grow"><h3>٥ حاجات حواليك</h3><p>سمّي ٥ حاجات شايفها، ٤ سامعها، ٣ لامسها. بيرجعك للحظة الحالية.</p></div></div>
        <div class="list-row"><div class="grow"><h3>إرخاء العضلات</h3><p>اقبض إيدك ٥ ثواني وسيبها، وكمّل على كتافك ورجليك.</p></div></div>
      </section>
    </div>`;
  },
  unmount() { stopBreath(); }
};
ACT.mood = el => { S.mood[today()] = +el.dataset.v; save(); render(); toast(+el.dataset.v <= 2 ? 'شكرًا إنك قلت. جرّب تمرين التنفس أو كلّم حد قريب منك.' : 'اتسجل مزاجك'); };
ACT.psychDir = () => { Object.assign(UI.dir, { need: 'psych', type: 'all', gov: 'all', q: '', mode: 'list' }); };
function stopBreath() { clearTimeout(breathTimer); breathTimer = null; }
ACT.breath = () => {
  const orb = $('#orb'), txt = $('#orbTxt'), bar = $('#breathBar'), cnt = $('#breathCount'), btn = $('#breathBtn');
  if (breathTimer) { stopBreath(); orb.className = 'orb'; txt.textContent = 'جاهز؟'; bar.style.transition = 'none'; bar.style.width = '0'; cnt.textContent = 'وقفت التمرين'; btn.innerHTML = ic('wind', 'sm') + ' ابدأ التمرين'; return; }
  btn.innerHTML = ic('x', 'sm') + ' وقّف'; let round = 1;
  const phases = [['in', 'شهيق', 4], ['hold', 'اكتم', 4], ['out', 'زفير', 6]];
  const run = (i) => {
    if (i === phases.length) { round++; if (round > 5) { stopBreath(); orb.className = 'orb'; txt.textContent = 'أحسن؟'; cnt.textContent = 'خلصت ٥ مرات. خد لحظة قبل ما تقوم.'; btn.innerHTML = ic('wind', 'sm') + ' تاني'; return; } i = 0; }
    const [cls, label, sec] = phases[i];
    orb.style.setProperty('--dur', sec + 's'); orb.className = 'orb ' + cls; txt.textContent = label;
    cnt.textContent = `المرة ${n(round)} من ${n(5)}`;
    bar.style.transition = 'none'; bar.style.width = '0'; void bar.offsetWidth; bar.style.transition = `width ${sec}s linear`; bar.style.width = '100%';
    breathTimer = setTimeout(() => run(i + 1), sec * 1000);
  };
  run(0);
};

/* ---------- F9 companion mode ---------- */
const PERMS = { appts: ['المواعيد', 'يشوف التقويم ويوصله تذكير قبل كل موعد'], meds: ['الأدوية', 'يشوف الجرعات ويوصله تنبيه لو جرعة فاتت'], symptoms: ['الأعراض', 'يشوف تسجيل الأعراض والرسوم'], docs: ['المستندات', 'يشوف المستندات اللي معمولها «أنا والمرافق» بس'] };
V.companion = {
  html() {
    const c = S.companion, comp = S.user.role === 'companion';
    if (comp && !c) return pageH('وضع المرافق', '') + `<div class="empty panel"><p>${esc(S.patientName)} سحبت صلاحيات المرافق. مش هتقدر تشوف بياناتها دلوقتي.</p></div>`;
    if (comp) return pageH('وضع المرافق', `بتساعد ${esc(S.patientName)} في رحلتها بالصلاحيات اللي هي اختارتها.`) + `
      <div class="grid2"><section class="panel"><div class="panel-h"><h2>صلاحياتك</h2></div>${Object.entries(PERMS).map(([k, [l, d]]) => `<div class="switch"><span><b>${l}</b><small>${d}</small></span><span class="tag ${c.perms[k] ? 'ok' : ''}">${c.perms[k] ? 'مسموح' : 'مش مسموح'}</span></div>`).join('')}
      <p class="tiny" style="margin-top:10px">${esc(S.patientName)} بس هي اللي تقدر تغيّر الصلاحيات دي.</p></section>
      <section class="panel"><div class="panel-h"><h2>عشانك أنت كمان</h2></div>${caregiverTips()}</section></div>`;
    if (!c) return pageH('وضع المرافق', 'فرد من الأسرة يساعدك في متابعة المواعيد والأدوية، بالصلاحيات اللي أنت تحددها.') + `
      <div class="grid2"><section class="panel"><form data-form="invite"><h2 style="font-size:17px;margin-bottom:14px">ادعي مرافق</h2>
        <div class="row2"><label class="field"><span>الاسم</span><input class="input" name="name" required></label><label class="field"><span>صلة القرابة</span><input class="input" name="relation" placeholder="مثلًا: بنتي" required></label></div>
        <label class="field"><span>رقم الموبايل</span><input class="input" name="phone" type="tel" dir="ltr" style="text-align:right" placeholder="01xxxxxxxxx" pattern="01[0125][0-9]{8}" required><small>هيوصله رابط دعوة يعمل بيه حساب</small></label>
        <p style="font-weight:500;margin:6px 0">يقدر يشوف إيه؟</p>
        ${Object.entries(PERMS).map(([k, [l, d]]) => `<label class="switch"><span><b>${l}</b><small>${d}</small></span><input type="checkbox" class="toggle" name="p_${k}" ${k === 'appts' || k === 'meds' ? 'checked' : ''}></label>`).join('')}
        <button class="btn primary block" style="margin-top:14px">ابعت الدعوة</button></form></section>
        <section class="panel"><div class="panel-h"><h2>إزاي بيشتغل؟</h2></div>
          <div class="note">${ic('lock')}<span>المرافق بيشوف بس اللي أنت سمحت بيه، وتقدر تغيّر أو تسحب الصلاحيات في أي وقت، وهو بيبطل يشوف فورًا.</span></div>
          <h3 style="font-size:15px;margin:16px 0 8px">محتوى بيساعد المرافق</h3>${caregiverTips()}</section></div>`;
    const alerts = companionAlerts();
    return pageH('وضع المرافق', 'المرافق بيساعدك بالصلاحيات اللي أنت محددها، وتقدر تسحبها في أي وقت.') + `
    <div class="grid2"><section class="panel">
      <div class="list-row" style="padding-top:0"><span class="avatar" style="cursor:default">${esc(c.name.charAt(0))}</span><div class="grow"><h3>${esc(c.name)}</h3><p>${esc(c.relation)}، <span dir="ltr">${esc(c.phone)}</span></p></div><span class="tag ok">مفعّل</span></div>
      <h3 style="font-size:15px;margin:14px 0 4px">الصلاحيات</h3>
      ${Object.entries(PERMS).map(([k, [l, d]]) => `<label class="switch"><span><b>${l}</b><small>${d}</small></span><input type="checkbox" class="toggle" data-perm="${k}" ${c.perms[k] ? 'checked' : ''}></label>`).join('')}
      <button class="btn danger block" style="margin-top:16px" data-act="revoke">اسحب كل الصلاحيات وشيل المرافق</button>
    </section>
    <div class="stack"><section class="panel"><div class="panel-h"><div><h2>التنبيهات اللي بتوصله</h2><p>حسب الصلاحيات الحالية</p></div></div>
      ${alerts.length ? alerts.map(a => `<div class="noti ${a.bad ? 'bad' : ''}">${ic(a.ic)}<span>${a.text}</span></div>`).join('') : '<p class="muted">مفيش تنبيهات دلوقتي.</p>'}</section>
      <section class="panel"><div class="panel-h"><h2>محتوى للمرافق</h2></div>${caregiverTips()}</section></div></div>`;
  },
  mount(root) {
    $$('[data-perm]', root).forEach(t => t.addEventListener('change', () => { S.companion.perms[t.dataset.perm] = t.checked; save(); render(); toast(t.checked ? `${S.companion.name} يقدر يشوف ${PERMS[t.dataset.perm][0]}` : `اتسحبت صلاحية ${PERMS[t.dataset.perm][0]}`); }));
  }
};
function companionAlerts() {
  const c = S.companion, t = today(), out = [];
  if (!c) return out;
  if (c.perms.appts) S.appts.filter(a => a.date >= t && diffDays(t, a.date) <= 2).sort(byDate).forEach(a => out.push({ ic: 'cal', text: `موعد ${daysWord(diffDays(t, a.date))}: ${a.title}` }));
  if (c.perms.meds) dosesFor(t).filter(d => d.status === 'late' || d.status === 'skipped').forEach(d => out.push({ ic: 'pill', bad: true, text: `جرعة ${d.status === 'skipped' ? 'اتخطت' : 'فاتت'}: ${d.med.name} الساعة ${fmtTime(d.time)}` }));
  return out;
}
function caregiverTips() {
  return `<a class="quick" href="#article-a7"><span class="qi">${ic('heart')}</span><span><b>خلي بالك من نفسك كمان</b><span>إزاي تساعد من غير ما تستنزف نفسك</span></span></a>
  <a class="quick" href="#community" data-act="comCare"><span class="qi">${ic('users')}</span><span><b>مجموعة المرافقين والأسرة</b><span>ناس فاهمة اللي أنت فيه</span></span></a>`;
}
ACT.comCare = () => { UI.com.g = 'g4'; };
FORMS.invite = (f, fd) => {
  const perms = {}; Object.keys(PERMS).forEach(k => perms[k] = !!fd.get('p_' + k));
  S.companion = { name: fd.get('name').trim(), relation: fd.get('relation').trim(), phone: fd.get('phone').trim(), perms, since: Date.now() };
  save(); render(); toast('اتبعتت الدعوة');
};
ACT.revoke = () => confirmBox('تشيل المرافق؟', `${esc(S.companion.name)} هيبطل يشوف أي حاجة فورًا، ومش هيوصله تنبيهات.`, 'اسحب الصلاحيات', () => { S.companion = null; save(); render(); toast('اتسحبت كل الصلاحيات'); });

/* ---------- F1 account & privacy ---------- */
V.profile = {
  html() {
    const u = S.user, md = u.medical || {}, theme = document.documentElement.dataset.theme || 'auto';
    return pageH('حسابي والخصوصية', 'بياناتك ملكك. بنجمع أقل حاجة ممكنة، وكل بيان طبي اختياري.') + `
    <div class="grid2">
      <div class="stack">
        <section class="panel"><form data-form="profile">
          <div class="panel-h"><h2>البيانات الأساسية</h2></div>
          <div class="row2"><label class="field"><span>الاسم</span><input class="input" name="name" value="${esc(u.name)}" required></label>
          <label class="field"><span>الإيميل أو الموبايل</span><input class="input" name="email" value="${esc(u.email)}" dir="ltr" style="text-align:right" required></label></div>
          <label class="field"><span>المحافظة <small>(اختياري، بتساعد في ترشيح الجهات)</small></span><select class="input" name="gov"><option value="">من غير</option>${GOVS.map(g => `<option ${u.gov === g ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
          ${u.role === 'patient' ? `<div class="panel-h" style="margin-top:8px"><div><h2>بيانات طبية</h2><p>كلها اختيارية. بتظهر في تقرير الدكتور وبطاقة الطوارئ بس.</p></div></div>
          <div class="row2"><label class="field"><span>نوع المرض</span><input class="input" name="cancerType" value="${esc(md.cancerType || '')}"></label>
          <label class="field"><span>مكان العلاج</span><input class="input" name="hospital" value="${esc(md.hospital || '')}"></label></div>
          <div class="row2"><label class="field"><span>الدكتور المعالج</span><input class="input" name="doctor" value="${esc(md.doctor || '')}"></label>
          <label class="field"><span>رقم فريق العلاج</span><input class="input" name="teamPhone" type="tel" value="${esc(md.teamPhone || '')}" dir="ltr" style="text-align:right" placeholder="بيظهر في بطاقة الطوارئ"></label></div>` : ''}
          <button class="btn primary">احفظ البيانات</button>
        </form></section>
        <section class="panel"><div class="panel-h"><h2>المظهر</h2></div>
          <div class="seg" role="group" aria-label="المظهر">${[['auto', 'زي الجهاز'], ['light', 'فاتح'], ['dark', 'غامق']].map(([k, l]) => `<button data-act="theme" data-t="${k}" aria-pressed="${theme === k}">${l}</button>`).join('')}</div>
        </section>
      </div>
      <div class="stack">
        <section class="panel"><div class="panel-h"><div><h2>الموافقات</h2><p>وافقت يوم ${fmtDate(iso(new Date(u.consent.at)), { day: 'numeric', month: 'long', year: 'numeric' })}</p></div></div>
          <label class="switch"><span><b>حفظ بياناتي لتشغيل الخدمة</b><small>ضروري عشان المواعيد والأدوية والأعراض تتحفظ</small></span><input type="checkbox" class="toggle" data-consent="data" ${u.consent.data ? 'checked' : ''}></label>
          <label class="switch"><span><b>التذكيرات والتنبيهات</b><small>المواعيد والجرعات</small></span><input type="checkbox" class="toggle" data-consent="reminders" ${u.consent.reminders ? 'checked' : ''}></label>
          <label class="switch"><span><b>إحصائيات مجهولة الهوية</b><small>أرقام مجمعة لتحسين الخدمة، من غير أي اسم أو بيان يعرّفك</small></span><input type="checkbox" class="toggle" data-consent="research" ${u.consent.research ? 'checked' : ''}></label>
        </section>
        <section class="panel"><div class="panel-h"><h2>بياناتك ملكك</h2></div>
          <div class="list-row"><div class="grow"><h3>حمّل نسخة من بياناتك</h3><p>ملف فيه كل اللي سجلته على المنصة</p></div><button class="btn sm" data-act="exportData">${ic('download', 'sm')} حمّل</button></div>
          <div class="list-row"><div class="grow"><h3>احذف الحساب بالكامل</h3><p>كل البيانات والمستندات هتتمسح نهائي</p></div><button class="btn sm danger" data-act="deleteAccount">${ic('trash', 'sm')} احذف</button></div>
        </section>
        <section class="panel"><div class="panel-h"><div><h2>تجربة الأدوار</h2><p>في النموذج بس: شوف المنصة بعين كل دور</p></div></div>
          <select class="input" id="roleSel">${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${u.role === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
          <button class="btn block" style="margin-top:14px" data-act="logout">${ic('logout', 'sm')} اخرج من الحساب</button>
        </section>
      </div>
    </div>`;
  },
  mount(root) {
    $$('[data-consent]', root).forEach(t => t.addEventListener('change', () => {
      const k = t.dataset.consent;
      if (k === 'data' && !t.checked) { t.checked = true; confirmBox('تسحب الموافقة على حفظ البيانات؟', 'من غير الموافقة دي مش هنقدر نحفظ أي حاجة، فالسحب معناه حذف الحساب وكل بياناته. لو عايز تاخد نسخة الأول، حمّل بياناتك.', 'احذف الحساب', wipe); return; }
      S.user.consent[k] = t.checked; save(); renderChrome(route().name); toast(t.checked ? 'اتفعلت' : 'اتلغت');
    }));
    $('#roleSel', root).addEventListener('change', e => { S.user.role = e.target.value; if (e.target.value === 'companion' && !S.companion) S.companion = { name: firstName(S.user.name), relation: 'مرافق', phone: '', perms: { appts: true, meds: true, symptoms: false, docs: true }, since: Date.now() }; save(); toast(`بقيت داخل كـ ${ROLES[e.target.value]}`); go(STAFF.includes(e.target.value) ? 'admin' : 'home'); });
  }
};
FORMS.profile = (f, fd) => {
  S.user.name = fd.get('name').trim(); S.user.email = fd.get('email').trim(); S.user.gov = fd.get('gov');
  if (S.user.role === 'patient') { S.patientName = S.user.name; S.user.medical = { cancerType: fd.get('cancerType').trim(), hospital: fd.get('hospital').trim(), doctor: fd.get('doctor').trim(), teamPhone: fd.get('teamPhone').trim() }; }
  save(); render(); toast('اتحفظت البيانات');
};
ACT.theme = el => { const t = el.dataset.t; if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; try { localStorage.setItem(KEY + '_theme', t); } catch (e) {} render(); };
ACT.exportData = async () => {
  const data = JSON.parse(JSON.stringify(S)); delete data.session; delete data.users; delete data.pending; delete data.orgQueue; if (data.user) delete data.user.pass;
  const ok = await offerDownload(`بياناتي-معاك-${today()}.json`, JSON.stringify(data, null, 2), 'application/json');
  toast(ok ? 'اتجهز ملف بياناتك' : 'اتلغى التحميل');
};
function wipe() { try { localStorage.removeItem(KEY); } catch (e) {} S = null; Object.keys(FILES).forEach(k => delete FILES[k]); location.hash = ''; renderAuth(); toast('اتحذف الحساب وكل البيانات'); }
ACT.deleteAccount = () => confirmBox('تحذف الحساب نهائي؟', 'كل المواعيد والأدوية والأعراض والمستندات ومنشوراتك هتتمسح، ومش هينفع ترجعها.', 'احذف الحساب نهائي', wipe);
ACT.logout = () => { S.session = false; save(); location.hash = ''; renderAuth(); };

/* ---------- F13 admin ---------- */
V.admin = {
  html() {
    const r = S.user.role;
    if (!STAFF.includes(r)) return `<div class="empty"><p>الصفحة دي للأدمن والمراجعين والمشرفين بس.</p></div>`;
    const tabs = [['stats', 'الإحصائيات', ['admin']], ['users', 'المستخدمين', ['admin']], ['content', 'مراجعة المحتوى', ['admin', 'reviewer']], ['orgs', 'الجهات', ['admin', 'reviewer']], ['reports', 'البلاغات', ['admin', 'moderator']]].filter(t => t[2].includes(r));
    if (!UI.admin || !tabs.some(t => t[0] === UI.admin)) UI.admin = tabs[0][0];
    const tab = UI.admin, oc = openCount();
    let body = '';
    if (tab === 'stats') {
      const g = {}; S.users.forEach(u => g[u.gov] = (g[u.gov] || 0) + 1); const mx = Math.max(...Object.values(g));
      body = `<div class="stats">${[[S.users.filter(u => u.active).length, 'حساب نشط'], [S.appts.length, 'موعد متسجل'], [S.stats.reports || 0, 'تقرير للدكتور اتعمل'], [oc, 'بلاغ مفتوح']].map(([v, l]) => `<div class="stat"><b>${n(v)}</b><span>${l}</span></div>`).join('')}</div>
        <div class="grid2"><section class="panel"><div class="panel-h"><h2>المستخدمين حسب المحافظة</h2></div>${Object.entries(g).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="hbar"><span>${k}</span><div><i style="width:${v / mx * 100}%"></i></div><span>${n(v)}</span></div>`).join('')}</section>
        <section class="panel"><div class="panel-h"><h2>أكتر الخدمات استخدامًا</h2></div>${[['الأدوية والتذكيرات', 92], ['المواعيد', 88], ['الأعراض', 71], ['دليل الخدمات', 54], ['المجتمع', 47]].map(([k, v]) => `<div class="hbar"><span>${k}</span><div><i style="width:${v}%;background:var(--marigold)"></i></div><span>${n(v)}٪</span></div>`).join('')}</section></div>
        <div class="note" style="margin-top:16px">${ic('lock')}<span>كل الإحصائيات مجمعة. اللوحة مش بتعرض أي بيان طبي لأي مريض.</span></div>`;
    }
    if (tab === 'users') body = `<section class="panel"><div class="scroll-x"><table class="t"><thead><tr><th>الاسم</th><th>الدور</th><th>المحافظة</th><th>انضم</th><th>الحالة</th><th></th></tr></thead><tbody>
      ${S.users.map(u => `<tr><td>${esc(u.name)}</td><td><select class="input vis-select" data-urole="${u.id}">${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${u.role === k ? 'selected' : ''}>${v}</option>`).join('')}</select></td><td>${u.gov}</td><td>${agoWord(Date.now() + u.joined * 864e5)}</td><td><span class="tag ${u.active ? 'ok' : 'bad'}">${u.active ? 'نشط' : 'موقوف'}</span></td><td><button class="btn sm" data-act="uToggle" data-id="${u.id}">${u.active ? 'أوقف' : 'فعّل'}</button></td></tr>`).join('')}
      </tbody></table></div><p class="tiny" style="margin-top:10px">الأدمن بيشوف بيانات الحساب بس، مش البيانات الطبية.</p></section>`;
    if (tab === 'content') body = `<section class="panel"><div class="panel-h"><div><h2>محتاج مراجعة طبية</h2><p>مفيش محتوى طبي بيتنشر قبل ما مراجع يعتمده</p></div></div>
      ${S.pending.map(p => `<div class="list-row"><div class="grow"><h3>${esc(p.title)}</h3><p>${p.kind}، من ${p.author}، ${agoWord(p.ts)}</p></div>${p.status === 'pending' ? `<button class="btn sm primary" data-act="pApprove" data-id="${p.id}">${ic('check', 'sm')} اعتمد</button><button class="btn sm" data-act="pReject" data-id="${p.id}">اطلب تعديل</button>` : `<span class="tag ${p.status === 'approved' ? 'ok' : 'warn'}">${p.status === 'approved' ? 'اتعتمد' : 'اتطلب تعديل'}</span>`}</div>`).join('')}
      <h3 style="font-size:15px;margin:20px 0 6px">منشور ومعتمد</h3>${ARTICLES.slice(0, 4).map(a => `<div class="list-row"><div class="grow"><h3>${a.title}</h3><p>${a.reviewer}، آخر مراجعة ${fmtDate(addDays(today(), a.reviewed), { day: 'numeric', month: 'short' })}</p></div><span class="tag ok">منشور</span></div>`).join('')}</section>`;
    if (tab === 'orgs') body = `<section class="panel"><div class="panel-h"><div><h2>جهات مستنية تحقق</h2><p>الجهة مش بتظهر في الدليل غير بعد التحقق من مصدر رسمي</p></div></div>
      ${S.orgQueue.map(o => `<div class="list-row"><div class="grow"><h3>${esc(o.name)}</h3><p>${ORG_TYPES[o.type]}، ${o.gov}، ${o.submitted}</p></div>${o.status === 'pending' ? `<button class="btn sm primary" data-act="oVerify" data-id="${o.id}">${ic('shield', 'sm')} اتحققت</button><button class="btn sm" data-act="oReject" data-id="${o.id}">ارفض</button>` : `<span class="tag ${o.status === 'ok' ? 'ok' : 'bad'}">${o.status === 'ok' ? 'اتحققت النهارده' : 'اترفضت'}</span>`}</div>`).join('')}
      <h3 style="font-size:15px;margin:20px 0 6px">محتاجة إعادة تحقق (عدّى عليها أكتر من ٤٥ يوم)</h3>${ORGS.filter(o => o.verified < -44).map(o => `<div class="list-row"><div class="grow"><h3>${o.name}</h3><p>آخر تحقق ${fmtDate(verifiedDate(o), { day: 'numeric', month: 'long' })}</p></div><span class="tag warn">راجعها</span></div>`).join('')}</section>`;
    if (tab === 'reports') {
      const items = [...S.flags.map(f => ({ ...f, kind: 'risk' })), ...S.reports.map(r => ({ ...r, kind: 'report' }))].sort((a, b) => (a.status === 'open' ? 0 : 1) - (b.status === 'open' ? 0 : 1) || b.ts - a.ts);
      body = `<section class="panel"><div class="panel-h"><div><h2>البلاغات والتنبيهات</h2><p>${n(oc)} مفتوح</p></div></div>
      ${items.length ? items.map(i => `<div class="list-row" style="align-items:flex-start"><span class="tag ${i.kind === 'risk' ? 'bad' : 'warn'}" style="flex:none">${i.kind === 'risk' ? 'مؤشر خطر نفسي' : esc(i.reason)}</span>
        <div class="grow"><p style="color:var(--ink);font-size:14.5px">«${esc((i.text || i.postText || '').slice(0, 140))}»</p><p>${agoWord(i.ts)}${i.auto ? '، اتمسك بالفلتر التلقائي' : ''}</p></div>
        ${i.status === 'open' ? (i.kind === 'risk' ? `<button class="btn sm primary" data-act="flagDone" data-id="${i.id}">اتواصلت مع العضو</button>` : `<button class="btn sm danger" data-act="repRemove" data-id="${i.id}">احذف المنشور</button><button class="btn sm" data-act="repKeep" data-id="${i.id}">سيبه</button>`) : `<span class="tag ok">اتقفل</span>`}</div>`).join('') : '<p class="muted">مفيش بلاغات.</p>'}
      <div class="note" style="margin-top:14px">${ic('info')}<span>تنبيهات الخطر النفسي بتوصل للمشرف عشان يتواصل مع العضو بلطف ويوجهه لجهات الدعم، مش عشان يعاقبه.</span></div></section>`;
    }
    return pageH('لوحة الإدارة', `داخل كـ ${ROLES[r]}. إدارة المحتوى والجهات والمجتمع.`) + `<div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-act="adminTab" data-t="${k}" aria-selected="${tab === k}">${l}${k === 'reports' && oc ? ` (${n(oc)})` : ''}</button>`).join('')}</div>${body}`;
  },
  mount(root) { $$('[data-urole]', root).forEach(s => s.addEventListener('change', () => { S.users.find(u => u.id === s.dataset.urole).role = s.value; save(); toast('اتغير الدور'); })); }
};
ACT.adminTab = el => { UI.admin = el.dataset.t; render(); };
ACT.uToggle = el => { const u = S.users.find(x => x.id === el.dataset.id); u.active = !u.active; save(); render(); toast(u.active ? 'اتفعل الحساب' : 'اتوقف الحساب'); };
ACT.pApprove = el => { S.pending.find(p => p.id === el.dataset.id).status = 'approved'; save(); render(); toast('اتعتمد ونزل في المكتبة'); };
ACT.pReject = el => { S.pending.find(p => p.id === el.dataset.id).status = 'changes'; save(); render(); toast('اتبعت طلب التعديل'); };
ACT.oVerify = el => { S.orgQueue.find(o => o.id === el.dataset.id).status = 'ok'; save(); render(); toast('اتحققت الجهة'); };
ACT.oReject = el => { S.orgQueue.find(o => o.id === el.dataset.id).status = 'no'; save(); render(); toast('اترفضت الجهة'); };
ACT.flagDone = el => { S.flags.find(f => f.id === el.dataset.id).status = 'done'; save(); render(); toast('اتقفل التنبيه'); };
ACT.repRemove = el => { const r = S.reports.find(x => x.id === el.dataset.id); r.status = 'done'; const p = S.posts.find(x => x.id === r.post); if (p) p.removed = true; save(); render(); toast('اتحذف المنشور'); };
ACT.repKeep = el => { S.reports.find(x => x.id === el.dataset.id).status = 'done'; save(); render(); toast('اتقفل البلاغ'); };

/* ---------- future ideas (F12, F15) ---------- */
V.future = {
  html() {
    return pageH('جاي قريب', 'أفكار للمراحل الجاية، معروضة هنا للتوضيح.') + `<div class="grid2">
      <section class="panel"><div class="panel-h"><div><h2>شرح نتائج التحاليل</h2><p>صوّر ورقة التحليل، والنتائج تتعرض في جدول مرتب</p></div><span class="tag warn">فكرة</span></div>
        <div class="scroll-x"><table class="t"><thead><tr><th>التحليل</th><th>النتيجة</th><th>المدى في الورقة</th></tr></thead><tbody>
        <tr><td>الهيموجلوبين<br><span class="tiny">بروتين في كرات الدم الحمرا بيشيل الأكسجين</span></td><td>١٠٫٢</td><td><span class="tag warn">خارج المدى</span> ١٢ لـ ١٦</td></tr>
        <tr><td>كرات الدم البيضا<br><span class="tiny">خلايا بتحارب العدوى</span></td><td>٥٫١</td><td>٤ لـ ١١</td></tr>
        <tr><td>الصفائح الدموية<br><span class="tiny">بتساعد الدم يتجلط</span></td><td>٢١٠</td><td>١٥٠ لـ ٤٥٠</td></tr></tbody></table></div>
        <p class="tiny" style="margin-top:10px">أرقام مثال. المنصة بتشرح اسم كل تحليل وبتعلّم على القيمة اللي خارج المدى المكتوب في الورقة بس، من غير تفسير طبي لمعناها.</p></section>
      <section class="panel"><div class="panel-h"><div><h2>التبرع والتطوع</h2><p>حملات لجمعيات موثقة وطلبات مساعدة</p></div><span class="tag warn">فكرة</span></div>
        <div class="list-row"><div class="grow"><h3>توصيل مريض لجلسة الكيماوي</h3><p>القاهرة، الحد الجاي الساعة ٩ ص</p></div><button class="btn sm" disabled>أتطوع</button></div>
        <div class="list-row"><div class="grow"><h3>حملة أدوية لمرضى الصعيد</h3><p>جمعية موثقة، التبرع من رابطها الرسمي</p></div><button class="btn sm" disabled>رابط الجمعية</button></div>
        <p class="tiny" style="margin-top:10px">المنصة مش بتستلم فلوس بنفسها. التبرع بيروح للرابط الرسمي للجمعية مباشرة.</p></section></div>`;
  }
};

/* ---------- F14 emergency card ---------- */
ACT.sos = () => {
  const md = (S.user && S.user.medical) || {}, c = S && S.companion;
  modal(`${ic('alert')} بطاقة الطوارئ`, `
    <a class="call" href="tel:123">${ic('phone', 'lg')}<span>اتصل بالإسعاف ١٢٣<small>اضغط للاتصال المباشر</small></span></a>
    <h3 style="font-size:15px;margin-bottom:6px">أرقام مهمة</h3>
    <div class="contact"><span class="grow"><b>فريق العلاج</b><br><span class="tiny">${esc(md.hospital || 'مكان العلاج')}</span></span>${md.teamPhone ? `<a class="btn sm" href="tel:${esc(md.teamPhone)}">${ic('phone', 'sm')} اتصل</a>` : `<a class="btn sm ghost" href="#profile" data-close>أضف الرقم</a>`}</div>
    ${c && c.phone ? `<div class="contact"><span class="grow"><b>${esc(c.name)}</b><br><span class="tiny">${esc(c.relation)}</span></span><a class="btn sm" href="tel:${esc(c.phone)}">${ic('phone', 'sm')} اتصل</a></div>` : ''}
    <h3 style="font-size:15px;margin:16px 0 6px">اطلب مساعدة فورًا لو عندك:</h3>
    <ul class="signs">${DANGER.map(d => `<li>${ic('alert', 'sm')}<span>${d}</span></li>`).join('')}</ul>
    ${md.cancerType ? `<div class="note" style="margin-top:14px">${ic('info')}<span>وريها للمسعف: ${esc(S.patientName)}، ${esc(md.cancerType)}${S.plans[0] ? '، بتاخد ' + esc(S.plans[0].name) : ''}.</span></div>` : ''}
    <p class="tiny" style="margin-top:12px">البطاقة محفوظة على جهازك. في النسخة النهائية بتفتح من غير إنترنت.</p>`, { cls: 'sosd' });
};

/* ---------- notifications + more menu ---------- */
ACT.bell = () => {
  const pop = $('#bellPop'); if (!pop.hidden) { pop.hidden = true; return; }
  const ns = notifications();
  pop.innerHTML = `<h3>التنبيهات</h3>${ns.length ? ns.map(x => `<div class="noti ${x.bad ? 'bad' : ''}" data-go="${x.go}">${ic(x.ic, 'sm')}<span>${x.text}</span></div>`).join('') : '<p class="muted" style="padding:8px 0 12px">مفيش تنبيهات دلوقتي.</p>'}`;
  pop.hidden = false;
};
ACT.more = () => {
  const items = NAV.flatMap(g => g.items).filter(([k]) => allowed(k) && !['home', 'journey', 'meds', 'symptoms'].includes(k));
  modal('المزيد', `<div class="more-grid">${items.map(([k, l, i]) => `<a href="#${k}" data-close>${ic(i)}<span>${l}</span></a>`).join('')}</div>`);
};

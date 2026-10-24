// CanadianSME Business Tools: GST/HST, payroll deductions, 13-week cash flow and loan payments.
// Illustrative estimates on published 2026 rates with simplified assumptions — not tax advice.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ── 2026 federal figures ──
  const CPP = { rate: 0.0595, exempt: 3500, ympe: 74600, yampe: 85000, rate2: 0.04 };
  const QPP = { rate: 0.064, exempt: 3500, ympe: 74600, yampe: 85000, rate2: 0.04 };
  const EI = { rate: 0.0163, employerFactor: 1.4, mie: 68900 };
  const EI_QC = { rate: 0.013, employerFactor: 1.4, mie: 68900 };
  const FED = { bpa: 16452, brackets: [[58523, 0.14], [117045, 0.205], [181440, 0.26], [258482, 0.29], [Infinity, 0.33]] };

  // ── Provinces: sales tax + simplified income tax ──
  const PROVINCES = [
    { name: 'Alberta', gst: 5, extra: 0, extraLabel: '', system: 'GST only', bpa: 22323, brackets: [[60000, 0.08], [151234, 0.1], [181481, 0.12], [241975, 0.13], [362962, 0.14], [Infinity, 0.15]] },
    { name: 'British Columbia', gst: 5, extra: 7, extraLabel: 'PST', system: 'GST + 7% PST', bpa: 12932, brackets: [[49900, 0.0506], [99820, 0.077], [114600, 0.105], [139100, 0.1229], [188400, 0.147], [262460, 0.168], [Infinity, 0.205]] },
    { name: 'Manitoba', gst: 5, extra: 7, extraLabel: 'RST', system: 'GST + 7% RST', bpa: 15969, brackets: [[47900, 0.108], [102150, 0.1275], [Infinity, 0.174]] },
    { name: 'New Brunswick', gst: 0, extra: 15, extraLabel: 'HST', system: '15% HST', bpa: 13396, brackets: [[51300, 0.094], [102614, 0.14], [190060, 0.16], [Infinity, 0.195]] },
    { name: 'Newfoundland and Labrador', gst: 0, extra: 15, extraLabel: 'HST', system: '15% HST', bpa: 11067, brackets: [[44200, 0.087], [88400, 0.145], [157900, 0.158], [220900, 0.178], [282200, 0.198], [564500, 0.208], [1128500, 0.213], [Infinity, 0.218]] },
    { name: 'Northwest Territories', gst: 5, extra: 0, extraLabel: '', system: 'GST only', bpa: 17842, brackets: [[51900, 0.059], [103800, 0.086], [168800, 0.122], [Infinity, 0.1405]] },
    { name: 'Nova Scotia', gst: 0, extra: 14, extraLabel: 'HST', system: '14% HST', bpa: 11744, brackets: [[30500, 0.0879], [61000, 0.1495], [95900, 0.1667], [154650, 0.175], [Infinity, 0.21]] },
    { name: 'Nunavut', gst: 5, extra: 0, extraLabel: '', system: 'GST only', bpa: 19274, brackets: [[54700, 0.04], [109400, 0.07], [177900, 0.09], [Infinity, 0.115]] },
    { name: 'Ontario', gst: 0, extra: 13, extraLabel: 'HST', system: '13% HST', bpa: 12747, brackets: [[53000, 0.0505], [106000, 0.0915], [150000, 0.1116], [220000, 0.1216], [Infinity, 0.1316]] },
    { name: 'Prince Edward Island', gst: 0, extra: 15, extraLabel: 'HST', system: '15% HST', bpa: 14650, brackets: [[33300, 0.095], [66600, 0.1347], [105000, 0.166], [140000, 0.1762], [Infinity, 0.19]] },
    { name: 'Quebec', gst: 5, extra: 9.975, extraLabel: 'QST', system: 'GST + 9.975% QST', bpa: 18571, brackets: [[54400, 0.14], [108800, 0.19], [132600, 0.24], [Infinity, 0.2575]] },
    { name: 'Saskatchewan', gst: 5, extra: 6, extraLabel: 'PST', system: 'GST + 6% PST', bpa: 19491, brackets: [[55500, 0.105], [158700, 0.125], [Infinity, 0.145]] },
    { name: 'Yukon', gst: 5, extra: 0, extraLabel: '', system: 'GST only', bpa: 16452, brackets: [[58523, 0.064], [117045, 0.09], [181440, 0.109], [500000, 0.128], [Infinity, 0.15]] },
  ];
  const prov = (name) => PROVINCES.find((p) => p.name === name) || PROVINCES[8];

  const money = (n) => {
    const v = Math.round((Number(n) || 0) * 100) / 100;
    return (v < 0 ? '−$' : '$') + Math.abs(v).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const money0 = (n) => {
    const v = Math.round(Number(n) || 0);
    return (v < 0 ? '−$' : '$') + Math.abs(v).toLocaleString('en-CA');
  };
  const rateText = (r) => r.toFixed(r % 1 === 0 ? 0 : 3) + '%';
  const bracketTax = (income, brackets) => {
    let tax = 0;
    let floor = 0;
    for (const [cap, rate] of brackets) {
      if (income <= floor) break;
      tax += (Math.min(income, cap) - floor) * rate;
      floor = cap;
    }
    return tax;
  };
  const payment = (principal, annualRate, years) => {
    const r = annualRate / 100 / 12;
    const n = years * 12;
    if (principal <= 0 || n <= 0) return 0;
    if (r === 0) return principal / n;
    return (principal * r) / (1 - Math.pow(1 + r, -n));
  };

  const val = (id) => {
    const el = document.querySelector(`[data-in="${id}"]:checked`) || document.querySelector(`[data-in="${id}"]`);
    return el ? el.value : '';
  };
  const n = (id) => { const v = parseFloat(val(id)); return Number.isFinite(v) ? v : 0; };
  const out = (id, html) => { $$(`[data-out="${id}"]`).forEach((el) => { el.innerHTML = html; }); };
  const text = (id, s) => out(id, esc(s));
  const rows = (list) => list.map((r) => `<tr${r.cls ? ` class="${r.cls}"` : ''}>${r.cells.map((c, i) => `<td${i ? ' class="num"' : ''}>${c}</td>`).join('')}</tr>`).join('');

  // ── GST/HST ──
  function gst() {
    const p = prov(val('gst-prov'));
    const mode = val('gst-mode') || 'add';
    const total = p.gst + p.extra;
    const amt = Math.max(0, n('gst-amount'));
    const base = mode === 'add' ? amt : amt / (1 + total / 100);
    const tax = mode === 'add' ? (amt * total) / 100 : amt - base;
    const list = [{ cells: [mode === 'add' ? 'Amount before tax' : 'Amount before tax (backed out)', money(base)] }];
    if (p.gst > 0) list.push({ cells: [`GST at ${p.gst}%`, money((base * p.gst) / 100)] });
    if (p.extra > 0) list.push({ cells: [`${p.extraLabel} at ${p.extra}%`, money((base * p.extra) / 100)] });
    list.push({ cells: ['Total tax', money(tax)], cls: 'is-strong' });
    list.push({ cells: ['Total charged', money(base + tax)], cls: 'is-total' });
    text('gst-total-label', mode === 'add' ? 'Total to charge the customer' : 'Tax inside that total');
    text('gst-total', mode === 'add' ? money(base + tax) : money(tax));
    text('gst-rate-note', `${p.system} — ${rateText(total)} combined`);
    out('gst-rows', rows(list));
    text('gst-guide', p.extra > 0 && p.gst > 0
      ? `${p.extraLabel} is administered by ${p.name}, separately from GST. You file and remit the two taxes to different authorities on different schedules.`
      : p.gst === 0
        ? 'HST combines the federal and provincial portions into one tax, filed and remitted to the CRA in a single return.'
        : 'No provincial sales tax applies here — you charge the 5% GST only, and remit it to the CRA.');
    out('gst-table', PROVINCES.map((x) => `<tr${x.name === p.name ? ' class="is-picked"' : ''}><td>${esc(x.name)}</td><td>${esc(x.system)}</td><td class="num">${rateText(x.gst + x.extra)}</td></tr>`).join(''));
  }

  // ── Payroll ──
  function payroll() {
    const p = prov(val('pay-prov'));
    const qc = p.name === 'Quebec';
    const per = Number(val('pay-freq')) || 26;
    const hourly = val('pay-basis') === 'hourly';
    const rate = Math.max(0, n('pay-rate'));
    const hours = Math.max(0, n('pay-hours'));
    const gross = hourly ? rate * hours * 52 : Math.max(0, n('pay-gross'));
    $$('[data-show-when]').forEach((el) => { el.hidden = el.dataset.showWhen !== `pay-basis=${hourly ? 'hourly' : 'salary'}`; });

    const pen = qc ? QPP : CPP;
    const cpp1 = Math.min(Math.max(gross - pen.exempt, 0), pen.ympe - pen.exempt) * pen.rate;
    const cpp2 = Math.min(Math.max(gross - pen.ympe, 0), pen.yampe - pen.ympe) * pen.rate2;
    const cpp = cpp1 + cpp2;
    const ei = qc ? EI_QC : EI;
    const eiPrem = Math.min(gross, ei.mie) * ei.rate;
    const eiEmployer = eiPrem * ei.employerFactor;
    const taxable = Math.max(0, gross - cpp2);
    const federal = Math.max(0, bracketTax(taxable, FED.brackets) - (FED.bpa + cpp1 + eiPrem) * FED.brackets[0][1]);
    const provincial = Math.max(0, bracketTax(taxable, p.brackets) - (p.bpa + cpp1 + eiPrem) * p.brackets[0][1]);
    const totalDed = cpp + eiPrem + federal + provincial;
    const net = gross - totalDed;
    const employerTotal = gross + cpp + eiEmployer;
    const d = (x) => money(x / per);
    const penName = qc ? 'QPP' : 'CPP';

    text('pay-gross-note', `${money(gross / per)} gross each pay period`);
    text('pay-net', d(net));
    text('pay-period-note', `${per} pay periods a year · ${money0(net)} net annually`);
    text('pay-equiv', hourly ? `${money(rate)} × ${hours} h a week = ${money0(gross)} a year` : `About ${money(gross / 2080)} an hour at 40 h a week`);
    text('pay-employer', d(employerTotal));
    text('pay-employer-note', `${money0(employerTotal - gross)} a year above salary`);
    out('pay-rows', rows([
      { cells: [hourly ? `Gross pay (${(hours * (52 / per)).toFixed(1)} h)` : 'Gross pay', d(gross), '—'] },
      { cells: [`${penName} contribution`, d(cpp), d(cpp)] },
      { cells: [qc ? 'EI premium (Quebec rate)' : 'EI premium', d(eiPrem), d(eiEmployer)] },
      { cells: ['Federal income tax', d(federal), '—'] },
      { cells: [`${esc(p.name)} income tax`, d(provincial), '—'] },
      { cells: ['Total deductions', d(totalDed), d(cpp + eiEmployer)], cls: 'is-strong' },
      { cells: ['Net pay', d(net), '—'], cls: 'is-total' },
    ]));
    const loc = (x) => '$' + x.toLocaleString('en-CA');
    out('pay-ceilings', rows([
      { cells: [`${penName} rate and ceiling`, `${(pen.rate * 100).toFixed(2)}% to ${loc(pen.ympe)}`] },
      { cells: [`${penName}2 rate and band`, `4.00% from ${loc(pen.ympe)} to ${loc(pen.yampe)}`] },
      { cells: ['Basic exemption', loc(pen.exempt)] },
      { cells: ['EI rate and maximum insurable', `${(ei.rate * 100).toFixed(2)}% to ${loc(ei.mie)}`] },
      { cells: ['Federal basic personal amount', loc(FED.bpa)] },
      { cells: [`${esc(p.name)} basic personal amount`, loc(p.bpa)] },
    ]));
    text('pay-remit', qc
      ? 'Quebec employers remit QPP, QPIP, and Quebec income tax to Revenu Québec, and federal income tax and EI to the CRA. Two remittances, two schedules.'
      : 'New employers usually remit monthly, by the 15th of the month after you withheld the deductions. The CRA moves you to accelerated remitting once your average monthly withholding passes $25,000.');
  }

  // ── Cash flow ──
  function cash() {
    const open = n('cash-open');
    const inflow = Math.max(0, n('cash-in'));
    const opex = Math.max(0, n('cash-out'));
    const pay = Math.max(0, n('cash-pay'));
    const gstAmt = Math.max(0, n('cash-gst'));
    const oneOff = Math.max(0, n('cash-oneoff'));
    const oneOffWeek = Math.min(13, Math.max(1, Math.round(n('cash-week') || 1)));
    const step = Number(val('cash-freq')) || 2;
    let bal = open;
    let low = open;
    let lowWeek = 0;
    let firstNeg = 0;
    const list = [];
    for (let w = 1; w <= 13; w++) {
      let o = opex;
      const notes = [];
      if (w % step === 0) { o += pay; notes.push('Payroll'); }
      if (w === 13 && gstAmt > 0) { o += gstAmt; notes.push('GST/HST remittance'); }
      if (w === oneOffWeek && oneOff > 0) { o += oneOff; notes.push('One-off cost'); }
      bal += inflow - o;
      if (bal < low) { low = bal; lowWeek = w; }
      if (bal < 0 && firstNeg === 0) firstNeg = w;
      list.push(`<tr class="${bal < 0 ? 'is-neg' : bal < inflow ? 'is-low' : ''}"><td>Week ${w}${notes.length ? `<span class="row-note">${notes.join(' · ')}</span>` : ''}</td><td class="num">${money0(inflow)}</td><td class="num">${money0(o)}</td><td class="num bal">${money0(bal)}</td></tr>`);
    }
    const shortfall = low < 0;
    const tight = !shortfall && low < inflow;
    out('cash-rows', list.join(''));
    text('cash-low', money0(low));
    text('cash-verdict', shortfall
      ? `You run out of cash in week ${firstNeg}, bottoming out at ${money0(low)} in week ${lowWeek}. Line up an operating line, delay a discretionary cost, or tighten collections before then — arranging credit is far easier while the balance is still positive.`
      : tight
        ? `Tightest in week ${lowWeek}, with less than one week of collections in reserve. That is survivable but leaves no room for a late-paying customer.`
        : `You stay positive across the quarter, with your tightest week at ${money0(low)} in week ${lowWeek} and closing at ${money0(bal)}. Worth stress-testing: cut weekly collections by 20% and see what happens.`);
    const box = $('[data-out-box="cash-verdict"]');
    box.classList.toggle('is-short', shortfall);
    box.classList.toggle('is-tight', tight);
  }

  // ── Loan ──
  function loan() {
    const amt = Math.max(0, n('loan-amt'));
    const rate = n('loan-rate');
    const yrs = Math.max(1, Math.round(n('loan-yrs') || 1));
    const monthly = payment(amt, rate, yrs);
    const totalPaid = monthly * yrs * 12;
    const lineMonthly = (amt * (rate + 1.5)) / 100 / 12;
    const eqYrs = Math.min(yrs, 7);
    const equipMonthly = payment(amt, rate - 1, eqYrs);
    const yl = (y) => `${y} ${y === 1 ? 'year' : 'years'}`;
    text('loan-rate-label', `${rate.toFixed(2)}%`);
    text('loan-yrs-label', yl(yrs));
    text('loan-monthly', money(monthly));
    text('loan-interest', money0(totalPaid - amt));
    text('loan-total', money0(totalPaid));
    out('loan-compare', [
      ['Term loan', `Fixed amortizing payment over ${yl(yrs)}. Predictable, and the balance actually goes down.`, money(monthly), money0(totalPaid - amt)],
      ['Operating line of credit', 'Interest-only on what you draw, typically 1–2% above a term rate. Cheap monthly, but the principal never clears itself.', money(lineMonthly), `${money0(lineMonthly * 12)} a year, ongoing`],
      ['Equipment financing', 'Secured against the asset, so often a point cheaper — but tied to that purchase and capped near the asset life.', money(equipMonthly), money0(equipMonthly * eqYrs * 12 - amt)],
    ].map(([name, note, m, i]) => `<tr><td><strong>${name}</strong><span class="row-note">${note}</span></td><td class="num">${m}</td><td class="num">${i}</td></tr>`).join(''));
  }

  const calcs = { gst, payroll, cash, loan };
  $$('[data-calc]').forEach((form) => {
    const fn = calcs[form.dataset.calc];
    form.addEventListener('input', fn);
    form.addEventListener('change', fn);
    fn();
  });
  $$('[data-preset]').forEach((b) => b.addEventListener('click', () => {
    const [a, r, y] = b.dataset.preset.split(',');
    $('[data-in="loan-amt"]').value = a;
    $('[data-in="loan-rate"]').value = r;
    $('[data-in="loan-yrs"]').value = y;
    loan();
  }));

  // One calculator at a time, chosen by the address (#gst, #payroll, …).
  const root = $('[data-tools]');
  const views = $$('[data-view]');
  const tabs = $$('[data-tab]');
  const show = () => {
    const key = location.hash.slice(1);
    const on = views.some((v) => v.dataset.view === key) ? key : 'index';
    views.forEach((v) => {
      v.classList.toggle('is-active', v.dataset.view === on);
      v.removeAttribute('id');
    });
    tabs.forEach((t) => (t.dataset.tab === on ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current')));
    root.classList.add('is-ready');
    scrollTo(0, 0);
  };
  addEventListener('hashchange', show);
  show();
})();

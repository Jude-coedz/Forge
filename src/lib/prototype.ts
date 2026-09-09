import { looksLikeKoraflow } from "../data/sample";
import type { Conversation, PrototypeDoc } from "../types";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(title: string, accent: string, body: string, extraScript = "") {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(title)}</title>
<style>
  :root { --accent:${accent}; --bg:#f4f1ea; --card:#fff; --ink:#1c1916; --mute:#6b645c; --line:#e7e1d6; --ok:#0f7a62; --warn:#b45309; --bad:#b42318; }
  * { box-sizing:border-box; }
  body { margin:0; font:15px/1.45 ui-sans-serif, system-ui, sans-serif; background:var(--bg); color:var(--ink); }
  header { position:sticky; top:0; z-index:2; background:var(--card); border-bottom:1px solid var(--line); padding:12px 16px 10px; }
  header h1 { margin:0; font-size:17px; letter-spacing:-.02em; }
  header p { margin:2px 0 0; font-size:11px; color:var(--mute); }
  nav { display:flex; gap:6px; padding:10px 12px; }
  nav button { flex:1; border:1px solid var(--line); background:var(--card); border-radius:999px; padding:8px 6px; font-size:12px; color:var(--mute); }
  nav button.on { background:var(--accent); color:#fff; border-color:transparent; }
  main { padding:0 12px 28px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:16px; padding:14px; margin-top:10px; }
  .row { display:flex; justify-content:space-between; gap:8px; align-items:flex-start; }
  .k { font-size:11px; color:var(--mute); text-transform:uppercase; letter-spacing:.04em; }
  .pill { font-size:11px; border-radius:999px; padding:2px 8px; background:#f1ece3; }
  .pill.warn { background:#fef3c7; color:var(--warn); }
  .pill.ok { background:#d1fae5; color:var(--ok); }
  .pill.bad { background:#fee2e2; color:var(--bad); }
  .src { margin-top:8px; font-size:12px; color:var(--mute); border-left:2px solid var(--line); padding-left:8px; }
  .actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
  button.btn { border:0; border-radius:10px; padding:9px 12px; font-size:13px; font-weight:600; cursor:pointer; }
  button.primary { background:var(--accent); color:#fff; }
  button.ghost { background:#f1ece3; color:var(--ink); }
  button.danger { background:#fee2e2; color:var(--bad); }
  button:disabled { opacity:.4; cursor:not-allowed; }
  input, textarea { width:100%; border:1px solid var(--line); border-radius:10px; padding:8px 10px; font:inherit; margin-top:4px; background:#fff; }
  .toast { position:fixed; left:12px; right:12px; bottom:16px; background:var(--ink); color:#fff; padding:12px 14px; border-radius:12px; font-size:13px; display:none; z-index:5; }
  .banner { margin:10px 12px 0; padding:10px 12px; border-radius:12px; background:#ecfdf5; color:var(--ok); font-size:12px; }
  .page { display:none; }
  .page.on { display:block; }
  .log { font-size:12px; color:var(--mute); margin:0; padding-left:18px; }
  .log li { margin:6px 0; }
</style>
</head>
<body>
${body}
<div class="toast" id="toast"></div>
<script>
function show(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('on'));
  document.getElementById(id).classList.add('on');
  const btn=document.querySelector('[data-page="'+id+'"]');
  if(btn) btn.classList.add('on');
}
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.style.display='block';
  setTimeout(()=>{ t.style.display='none'; }, 2400);
}
function log(msg){
  const el=document.getElementById('log');
  if(!el) return;
  const li=document.createElement('li');
  li.textContent=new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) + ' · ' + msg;
  el.prepend(li);
}
${extraScript}
</script>
</body>
</html>`;
}

function koraflowHtml(): string {
  const body = `
<header>
  <h1>KoraFlow</h1>
  <p>Merchant system of record · chat is how work arrives, not the product</p>
</header>
<div class="banner">Paid and Send are merchant verbs. Chat language cannot confirm a transfer.</div>
<nav>
  <button class="on" data-page="today" onclick="show('today')">Today</button>
  <button data-page="order" onclick="show('order')">Order</button>
  <button data-page="follow" onclick="show('follow')">Follow-up</button>
  <button data-page="activity" onclick="show('activity')">Activity</button>
</nav>
<main>
  <section id="today" class="page on">
    <div class="card">
      <div class="row"><span class="k">Needs you</span><span class="pill warn">2 open</span></div>
      <p style="margin:8px 0 0;font-weight:600">Chioma Eze · Ankara two-piece</p>
      <p class="src">“I have transferred.” — 09:21 · not visible to Adunni yet</p>
      <div class="actions"><button class="btn primary" onclick="show('order')">Review extraction</button></div>
    </div>
    <div class="card">
      <div class="row"><span class="k">Missed inquiry</span><span class="pill bad">Staff</span></div>
      <p style="margin:8px 0 0;font-weight:600">Satin dress · Tunde replied 2 of 3</p>
      <p class="src">“I think I missed one.” — 10:02</p>
      <div class="actions"><button class="btn ghost" onclick="show('follow')">Open draft</button></div>
    </div>
  </section>
  <section id="order" class="page">
    <div class="card">
      <div class="row"><span class="k">Extracted order</span><span class="pill warn" id="payPill">Payment pending</span></div>
      <label class="k" style="display:block;margin-top:12px">Customer</label>
      <input id="cust" value="Chioma Eze"/>
      <label class="k" style="display:block;margin-top:10px">Product</label>
      <input id="prod" value="Ankara two-piece · size 12"/>
      <label class="k" style="display:block;margin-top:10px">Amount</label>
      <input id="amt" value="18500"/>
      <label class="k" style="display:block;margin-top:10px">Delivery</label>
      <input id="del" value="Dispatch to last Lekki address"/>
      <p class="src">Quoted from thread. Amount and size were said. Payment was claimed, not verified.</p>
      <div class="actions">
        <button class="btn primary" id="confirmBtn" onclick="confirmOrder()">Confirm order</button>
        <button class="btn ghost" onclick="tryPaid()">Mark paid</button>
      </div>
      <p class="k" id="orderState" style="margin-top:10px">Order is a suggestion until you confirm it.</p>
    </div>
  </section>
  <section id="follow" class="page">
    <div class="card">
      <div class="row"><span class="k">Suggested follow-up</span><span class="pill">Draft only</span></div>
      <p style="margin:8px 0 0">Someone asked about the satin dress and did not get a reply.</p>
      <label class="k" style="display:block;margin-top:10px">Message to customer</label>
      <textarea id="draft" rows="3">Hi, the satin dress is still available. Do you want me to hold a size?</textarea>
      <div class="actions">
        <button class="btn ghost" onclick="saveDraft()">Save draft</button>
        <button class="btn primary" onclick="trySend()">Send…</button>
      </div>
    </div>
  </section>
  <section id="activity" class="page">
    <div class="card">
      <p class="k">Correction &amp; approval log</p>
      <ul class="log" id="log">
        <li>10:16 · Extracted order from Chioma thread — unconfirmed</li>
        <li>10:02 · Flagged missed satin-dress inquiry from Tunde</li>
      </ul>
    </div>
  </section>
</main>`;

  const script = `
let orderOk=false, paid=false;
function confirmOrder(){
  orderOk=true;
  document.getElementById('orderState').textContent='Order is in the record. Payment is still pending.';
  document.getElementById('confirmBtn').disabled=true;
  log('Merchant confirmed order for '+document.getElementById('cust').value);
  toast('Order confirmed. Still not paid.');
}
function tryPaid(){
  if(!orderOk){ toast('Confirm the order first. Nothing is real yet.'); return; }
  if(!confirm('Chioma said “I have transferred.” That is chat language, not bank evidence.\\n\\nMark paid anyway?')) return;
  paid=true;
  document.getElementById('payPill').textContent='Paid · merchant override';
  document.getElementById('payPill').className='pill ok';
  log('Merchant marked paid (override — no provider evidence)');
  toast('Paid is a merchant verb. Logged as override.');
}
function saveDraft(){
  log('Saved follow-up draft. Not sent.');
  toast('Draft saved. Customer has not been contacted.');
}
function trySend(){
  if(!confirm('Send this to a customer? Forge defaults to draft. Sending is explicit.')) return;
  log('Merchant approved send: satin-dress follow-up');
  toast('Sent. This required your approval.');
}
`;
  return shell("KoraFlow", "#0f7a62", body, script);
}

function protoName(conv: Conversation) {
  const raw = (conv.spec?.productName || conv.productName || "").trim();
  const source = conv.sources.join("\n");
  if (!raw || /^whatsapp$/i.test(raw)) {
    if (looksLikeKoraflow(source)) return "KoraFlow";
    if (/gym|attendance|trainer/i.test(source)) return "Rollcall";
    if (/order|merchant|shop|seller/i.test(source)) return "Tillbook";
    return "Forge preview";
  }
  return raw;
}

function genericHtml(conv: Conversation): string {
  const spec = conv.spec;
  const name = protoName(conv);
  const thesis = spec?.thesis || "";
  const screens = spec?.screens?.length ? spec.screens.slice(0, 4) : ["Queue", "Review", "Record", "Activity"];
  const fm = spec?.failureModes?.[0]?.containment || "Nothing irreversible happens without you.";
  const reqs = spec?.requirements ?? [];
  const who = conv.brief.find((b) => b.id === "user")?.body || "Primary user";
  const problem = conv.brief.find((b) => b.id === "problem")?.body || "";
  const object = screens[0]?.replace(/ review/i, "") || "Item";
  const pages = ["queue", "review", "record", "activity"];
  const nav = pages
    .map((id, i) => `<button class="${i === 0 ? "on" : ""}" data-page="${id}" onclick="show('${id}')">${esc(screens[i] ?? id)}</button>`)
    .join("");
  const queueCards = reqs
    .slice(0, 3)
    .map(
      (r, i) => `<div class="card">
      <div class="row"><span class="k">${esc(r.priority)}</span><span class="pill warn">Needs review</span></div>
      <p style="margin:8px 0 0;font-weight:600">${esc(r.name)}</p>
      <p class="src">${esc(r.story)}</p>
      <div class="actions"><button class="btn ${i === 0 ? "primary" : "ghost"}" onclick="show('review')">${i === 0 ? "Review" : "Open"}</button></div>
    </div>`,
    )
    .join("");

  const body = `
<header>
  <h1>${esc(name)}</h1>
  <p>${esc(thesis.slice(0, 140) || "Clickable prototype generated from the locked spec")}</p>
</header>
<div class="banner">${esc(fm)}</div>
<nav>${nav}</nav>
<main>
  <section id="queue" class="page on">
    ${queueCards || `<div class="card"><p>Work queue is empty until source material is confirmed.</p></div>`}
    <p class="k" style="margin:14px 4px 0">For ${esc(who.slice(0, 120))}</p>
  </section>
  <section id="review" class="page">
    <div class="card">
      <div class="row"><span class="k">${esc(object)}</span><span class="pill warn" id="statusPill">Unconfirmed</span></div>
      <label class="k" style="display:block;margin-top:12px">Extracted title</label>
      <input id="title" value="${esc(reqs[0]?.name || object)}"/>
      <label class="k" style="display:block;margin-top:10px">Notes</label>
      <textarea id="notes" rows="3">${esc(problem.slice(0, 240))}</textarea>
      <p class="src">Low-confidence fields stay editable. Confirming writes the record.</p>
      <div class="actions">
        <button class="btn primary" id="confirmBtn" onclick="confirmRecord()">Confirm into the record</button>
        <button class="btn danger" onclick="tryAuto()">Do it automatically</button>
      </div>
    </div>
  </section>
  <section id="record" class="page">
    <div class="card">
      <p class="k">Live record</p>
      <p id="recordBody" style="margin:8px 0 0">Nothing is in the record until you confirm. That is the point of the spec.</p>
    </div>
  </section>
  <section id="activity" class="page">
    <div class="card">
      <p class="k">Activity</p>
      <ul class="log" id="log">
        <li>Prototype built from locked spec</li>
      </ul>
    </div>
  </section>
</main>`;

  const script = `
let confirmed=false;
function confirmRecord(){
  confirmed=true;
  document.getElementById('statusPill').textContent='In the record';
  document.getElementById('statusPill').className='pill ok';
  document.getElementById('confirmBtn').disabled=true;
  document.getElementById('recordBody').textContent=document.getElementById('title').value + ' — ' + document.getElementById('notes').value;
  log('Merchant confirmed the record');
  toast('Saved. Irreversible actions still need you.');
}
function tryAuto(){
  toast('Blocked by spec: no autonomous action.');
  log('Blocked automatic action — failure mode held');
}
`;
  return shell(name, "#5346e8", body, script);
}

export function generatePrototype(conv: Conversation): PrototypeDoc {
  const kora = looksLikeKoraflow(conv.sources.join("\n"));
  const name = protoName(conv);
  const html = kora ? koraflowHtml() : genericHtml(conv);
  const summary = kora
    ? "Clickable KoraFlow prototype: order review, pending payment, draft-only follow-up. Paid and Send require you."
    : `Clickable ${name} prototype from the locked spec. Confirm is required; automation is refused.`;
  return { html, summary, builtAt: Date.now() };
}

export function wantsUnsafeAutomation(text: string) {
  return /auto(-|\s)?(send|pay|paid|confirm)|send automatically|just send|skip approval|mark paid (for me|automatically)/i.test(
    text,
  );
}

export function wantsPrototype(text: string) {
  return /\b(prototype|preview|mock|mockup|clickable|lovable|v0|build (it|this|a|the)|make (a |the )?prototype)\b/i.test(
    text,
  );
}

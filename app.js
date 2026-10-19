const S={lang:'en',reg:'SE',city:0,role:'c',cat:-1,q:'',cart:{},prem:false,subs:false,rut:false,jobs:[],earn:0,user:null,isPartner:false,hide:[],rated:[],loc:{}};
const $=s=>document.querySelector(s),t=k=>T[S.lang][k],esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nm=s=>S.lang==='sv'?s[4]:s[3];
const fmt=n=>new Intl.NumberFormat(S.lang+'-u-nu-latn',{style:'currency',currency:R[S.reg].cur,maximumFractionDigits:R[S.reg].cur==='SEK'?0:2}).format(n);
const price=s=>s[5]*R[S.reg].f*(S.prem?1.2:1)*(S.subs?.9:1);
/* ===== Cart maths: subtotal, optional RUT (Sweden only), platform fee, VAT, total ===== */
function calc(){const r=R[S.reg];let sub=0,el=0;for(const id in S.cart){const s=SV.find(x=>x[0]==id),p=price(s)*S.cart[id];sub+=p;if(s[8])el+=p}
 const rut=S.reg==='SE'&&S.rut?el*.5:0,fee=r.fee,vat=(sub-rut+fee)*r.vat;return{sub,rut,fee,vat,tot:sub-rut+fee+vat}}
/* ===== Rendering ===== */
function head(){$('#reg').innerHTML=Object.entries(R).map(([k,v])=>`<option value="${k}" ${k==S.reg?'selected':''}>${v.n} (${v.cur})</option>`).join('');
 $('#city').innerHTML=R[S.reg].cities.map((c,i)=>`<option value="${i}" ${i==S.city?'selected':''}>${c}</option>`).join('');
 $('#q').placeholder=t('ph');$('#auth').textContent=S.user?'Log out ('+S.user.email.split('@')[0]+')':'Log in';$('#role').textContent='🧰 Partners';
 const n=Object.values(S.cart).reduce((a,b)=>a+b,0);$('#cnt').textContent=n;$('#cbar').style.display=n?'':'none';$('#cbar').textContent='🛒 '+n+' · '+fmt(calc().tot);
 $('#sug').innerHTML=SV.map(s=>`<option value="${esc(nm(s))}">`).join('')}
function grid(){const q=S.q.toLowerCase();$('#grid').innerHTML=SV.filter(s=>(S.cat<0||s[1]==S.cat)&&(nm(s)+s[3]).toLowerCase().includes(q)).map(s=>`
<div class="card"><div class="img" style="background:${s[11]?`center/cover url('${esc(s[11])}')`:`hsl(${s[1]*55+230} 70% 92%)`}" onclick="detail(${s[0]})">${s[11]?'':s[2]}</div><div class="cb"><b>${nm(s)}</b>
<div class="mut">★ ${s[7]} · ${s[6]} ${t('min')}</div><div class="row" style="margin-top:8px"><b>${fmt(price(s))}</b><button class="btn" onclick="add(${s[0]})">${t('add')}</button></div></div></div>`).join('')}
function app(){head();const sv=S.role=='c';$('#app').innerHTML=sv?`
<div class="hero"><h1>${t('hero')}</h1><div>${t('h2')} · ${R[S.reg].cities[S.city]}</div><div class="why">${t('w').map(x=>`<span>✔ ${x}</span>`).join('')}</div></div>
<div class="chips"><span class="chip ${S.cat<0?'on':''}" onclick="S.cat=-1;app()">${t('all')}</span>${t('cats').map((c,i)=>`<span class="chip ${S.cat==i?'on':''}" onclick="S.cat=${i};app()">${c}</span>`).join('')}</div>
<div class="grid" id="grid"></div><h2>${t('trk')}</h2><div id="trk"></div><h2>How it works</h2><div class="how"><div>1️⃣ Choose a service</div><div>2️⃣ Pick a time and pay</div><div>3️⃣ Track your pro live</div></div><div class="foot">© HemFix · <a href="partner.html">Partner portal</a> · <a href="worker.html">Worker app</a></div>`:`<h2>🧰 ${t('pro')}</h2><div id="dash"></div>`;
 if(sv){grid();track()}else dash();cartUI()}
function track(){const mine=S.jobs.filter(j=>j.mine);$('#trk').innerHTML=mine.length?mine.map(j=>`<div class="sec"><div class="row"><b>#${j.id} · ${esc(j.t)}</b><span>${fmt(j.pay)}</span></div>
<div class="steps">${t('st').map((_,i)=>`<i class="${i<=j.st?'d':''}"></i>`).join('')}</div><div><b>${t('st')[j.st]}</b>${j.who?` <span class="mut">👤 ${esc(j.who)}</span>`:''}${j.rej?` <span class="mut">${t('reass')}</span>`:''}</div>
<div class="mut">${esc(j.loc)} · ${esc(j.slot||'')}</div>${S.loc[j.id]&&j.st>1&&j.st<4?mapHtml(S.loc[j.id]):''}${j.st==4&&j.partner&&!S.rated.includes(j.id)?`<button class="btn o" style="margin-top:8px" onclick="rateModal(${j.id},'${j.partner}')">⭐ Rate</button>`:''}</div>`).join(''):`<p class="mut">${t('none')}</p>`}
function dash(){const pj=S.jobs.filter(j=>j.st==0||j.partner===(S.user&&S.user.id));const done=pj.filter(j=>j.st==4).length;$('#dash').innerHTML=`<div class="sec stat"><div><b>${fmt(S.earn)}</b>${t('earn')}</div><div><b>${done}</b>${t('done')}</div><div><b>${pj.length-done}</b>${t('open')}</div></div>
<h3>${t('jobs')}</h3>`+pj.map(j=>`<div class="sec"><div class="row"><b>${esc(j.t)}</b><span>${fmt(j.pay*.85)}</span></div><div class="mut">📍 ${esc(j.loc)}</div>
<div class="steps">${t('st').map((_,i)=>`<i class="${i<=j.st?'d':''}"></i>`).join('')}</div><b>${t('st')[j.st]}</b>
<div style="margin-top:8px">${j.st==0?`<button class="btn" onclick="adv('${j.id}')">${t('acc')}</button> <button class="btn o" onclick="rej('${j.id}')">${t('rej')}</button>`:j.st<4?`<button class="btn" onclick="adv('${j.id}')">${t('go')[j.st]}</button>`:'✅'}</div></div>`).join('')}
/* ===== Order state machine: 0 Confirmed → 1 Assigned → 2 In transit → 3 In progress → 4 Completed ===== */
async function adv(id){const j=S.jobs.find(x=>x.id==id);if(!j||j.st>=4)return;
 const patch=j.st==0?{status:1,partner_id:S.user.id}:{status:j.st+1};
 const {error}=await sb.from('orders').update(patch).eq('id',id);if(error)return toast(error.message);await load()}
function rej(id){S.hide.push(String(id));S.jobs=S.jobs.filter(x=>x.id!=id);app()}
/* ===== Load orders from the database (RLS decides which rows you may see) ===== */
async function load(){if(!S.user){S.jobs=[];S.earn=0;return app()}
 const {data,error}=await sb.from('orders').select('*').order('created_at',{ascending:false});if(error){toast(error.message);return}
 S.jobs=data.filter(o=>!S.hide.includes(String(o.id))).map(o=>({id:o.id,mine:o.customer_id===S.user.id,partner:o.partner_id,t:o.title,loc:`${o.address}, ${o.postal} ${o.city}`,slot:`${o.slot} · ${o.pay_method}`,pay:Number(o.subtotal),st:o.status,who:o.assigned_name}));
 const [rv,lc]=await Promise.all([sb.from('reviews').select('order_id').eq('customer_id',S.user.id),sb.from('locations').select('*')]);
 S.rated=(rv.data||[]).map(r=>r.order_id);S.loc={};(lc.data||[]).forEach(l=>S.loc[l.order_id]=l);
 S.earn=S.jobs.filter(j=>j.st==4&&j.partner===S.user.id).reduce((s,j)=>s+j.pay*.85,0);app()}
function add(id){S.cart[id]=(S.cart[id]||0)+1;cartUI();$('#drawer').classList.add('on')}
function cartUI(){head();const ids=Object.keys(S.cart),c=calc(),d=$('#drawer');
d.innerHTML=`<div class="row"><h3>${t('cart')}</h3><button class="btn o" onclick="$('#drawer').classList.remove('on')">✕</button></div>`+(ids.length?ids.map(id=>{const s=SV.find(x=>x[0]==id);return`<div class="row" style="margin:8px 0"><span>${s[2]} ${nm(s)}</span><span><button class="btn o" onclick="qty(${id},-1)">−</button> ${S.cart[id]} <button class="btn o" onclick="qty(${id},1)">+</button></span></div>`}).join('')+`
<label><input type="checkbox" ${S.prem?'checked':''} onchange="S.prem=this.checked;app()"> ${t('prem')}</label><br><label><input type="checkbox" ${S.subs?'checked':''} onchange="S.subs=this.checked;app()"> ${t('subs')}</label>
${S.reg=='SE'?`<br><label><input type="checkbox" ${S.rut?'checked':''} onchange="S.rut=this.checked;app()"> ${t('rutq')}</label>`:''}
<div style="margin-top:10px"><div class="row"><span>${t('sub')}</span><span>${fmt(c.sub)}</span></div>${c.rut?`<div class="row"><span>${t('rut')}</span><span>−${fmt(c.rut)}</span></div>`:''}
<div class="row"><span>${t('fee')}</span><span>${fmt(c.fee)}</span></div><div class="row"><span>${t('vat')} ${R[S.reg].vat*100}%</span><span>${fmt(c.vat)}</span></div>
<div class="row tot"><span>${t('tot')}</span><span>${fmt(c.tot)}</span></div></div><button class="btn" style="width:100%;margin-top:12px" onclick="checkout()">${t('chk')}</button>`:`<p class="mut">${t('empty')}</p>`)}
function qty(id,d){S.cart[id]+=d;if(S.cart[id]<1)delete S.cart[id];app()}
/* ===== Modals ===== */
const modal=h=>{$('#modal').innerHTML=h;$('#ov').classList.add('on')},close=()=>$('#ov').classList.remove('on');
$('#ov').onclick=e=>{if(e.target.id=='ov')close()};
function detail(id){const s=SV.find(x=>x[0]==id);modal(`${s[11]?`<img src="${esc(s[11])}" style="width:100%;border-radius:12px;margin-bottom:8px">`:''}<div class="row"><h2>${s[2]} ${nm(s)}</h2><button class="btn o" onclick="close()">✕</button></div>
<div class="mut">★ ${s[7]} · ${s[6]} ${t('min')} · ${fmt(price(s))}</div><h4>✔ ${t('inc')}</h4><div>${esc(s[9]||'Trained professional · Tools & materials · Cleanup')}</div>${s[10]?`<div class="mut">By <a href="#" onclick="partnerProfile('${s[12]}');return false">${esc(s[10])}</a></div>`:''}<h4>✘ ${t('exc')}</h4><div>Spare parts · Extra rooms</div>
<h4>${t('faq')}</h4><div><b>${t('f1')}</b><br>${t('a1')}<br><b>${t('f2')}</b><br>${t('a2')}</div><h4>${t('rev')}</h4><div>★★★★★ “Punctual and tidy.” <span class="mut">Anna, ${R[S.reg].cities[0]}</span><br>★★★★☆ “Great value.” <span class="mut">Omar</span></div>
<button class="btn" style="margin-top:12px" onclick="add(${id});close()">${t('add')}</button>`)}
let slot='';
function checkout(){if(!Object.keys(S.cart).length)return;if(!S.user)return authModal();const tm=new Date(Date.now()+864e5).toISOString().slice(0,10),sl=['08:00','10:00','12:00','14:00','16:00','18:00'];slot=sl[1];
 modal(`<div class="row"><h3>${t('chk')}</h3><button class="btn o" onclick="close()">✕</button></div>
<label class="f">${t('date')}</label><input type="date" id="dt" value="${tm}" min="${tm}"><label class="f">${t('time')}</label>
<div class="slots">${sl.map(x=>`<button class="${x==slot?'on':''}" onclick="slot='${x}';document.querySelectorAll('.slots button').forEach(b=>b.classList.toggle('on',b.textContent=='${x}'))">${x}</button>`).join('')}</div>
<label class="f">${t('addr')}</label><input id="ad" style="width:100%"><label class="f">${t('zip')}</label><input id="zp" style="width:100%"><div class="err" id="ze"></div>
<label class="f">${t('pay')}</label><div class="pays">${S.reg=='SE'?'<label><input type="radio" name="p" value="Swish" checked> Swish</label>':''}<label><input type="radio" name="p" value="Klarna" ${S.reg!='SE'?'checked':''}> Klarna (Pay Later / 3x)</label><label><input type="radio" name="p" value="Card"> 💳 Card</label></div>
<div class="row tot"><span>${t('tot')}</span><span>${fmt(calc().tot)}</span></div><button class="btn" style="width:100%;margin-top:10px" onclick="place()">${t('place')}</button>`)}
async function place(){const z=$('#zp').value.trim(),a=$('#ad').value.trim();$('#ze').textContent='';
 if(!R[S.reg].zip.test(z)){$('#ze').textContent=t('bad');return}if(!a){$('#ad').focus();return}
 const c=calc(),names=Object.keys(S.cart).map(id=>nm(SV.find(x=>x[0]==id))).join(', '),r2=x=>Math.round(x*100)/100;
 const {error}=await sb.from('orders').insert({title:names,address:a,postal:z,city:R[S.reg].cities[S.city],region:S.reg,slot:$('#dt').value+' '+slot,pay_method:document.querySelector('[name=p]:checked').value,currency:R[S.reg].cur,subtotal:r2(c.sub-c.rut),total:r2(c.tot)});
 if(error)return toast(error.message);
 S.cart={};close();$('#drawer').classList.remove('on');await load()}
/* ===== Login / sign up ===== */
function authModal(){modal(`<div class="row"><h3>Log in / Sign up</h3><button class="btn o" onclick="close()">✕</button></div>
<label class="f">Email</label><input id="em" type="email" style="width:100%"><label class="f">Password (min 6 characters)</label><input id="pw" type="password" style="width:100%"><div class="err" id="ae"></div>
<div style="margin-top:10px"><button class="btn" onclick="signIn()">Log in</button> <button class="btn o" onclick="signUp()">Sign up</button></div>`)}
async function signIn(){const {error}=await sb.auth.signInWithPassword({email:$('#em').value.trim(),password:$('#pw').value});if(error)$('#ae').textContent=error.message;else close()}
async function signUp(){const {data,error}=await sb.auth.signUp({email:$('#em').value.trim(),password:$('#pw').value});if(error)$('#ae').textContent=error.message;else if(!data.session)$('#ae').textContent='Check your email to confirm, then log in.';else close()}
/* Runs on page load, login and logout. setTimeout avoids a known supabase-js deadlock. */
sb.auth.onAuthStateChange((_e,session)=>{S.user=session?session.user:null;S.isPartner=false;
 setTimeout(async()=>{if(S.user){const {data}=await sb.from('profiles').select('role').maybeSingle();S.isPartner=!!data&&data.role==='partner'}
  if(!S.isPartner)S.role='c';await load()},0)});
/* Live tracking: reload when any visible order changes */
sb.channel('orders-live').on('postgres_changes',{event:'*',schema:'public',table:'orders'},()=>load()).on('postgres_changes',{event:'*',schema:'public',table:'locations'},()=>load()).subscribe();
/* ===== Events: language (+RTL), region, city, role, search, cart ===== */
$('#lang').onchange=e=>{S.lang=e.target.value;document.documentElement.lang=S.lang;document.documentElement.dir=S.lang=='ar'?'rtl':'ltr';app()};
$('#reg').onchange=e=>{S.reg=e.target.value;S.city=0;if(S.reg!='SE')S.rut=false;app()};
$('#city').onchange=e=>{S.city=+e.target.value;app()};
$('#role').onclick=()=>location.href='partner.html';
$('#auth').onclick=()=>S.user?sb.auth.signOut():authModal();
$('#q').oninput=e=>{S.q=e.target.value;if($('#grid'))grid()};
$('#cartb').onclick=()=>$('#drawer').classList.toggle('on');
app();
/* ===== Partner services from the database show for everyone (no login needed) ===== */
async function loadCatalog(){const {data}=await sb.from('partner_services').select('*');if(!data)return;
 for(let i=SV.length-1;i>=0;i--)if(SV[i][0]>=1000)SV.splice(i,1);
 data.forEach(p=>SV.push([1000+p.id,p.category,'🛠️',p.name,p.name,Number(p.price_sek),p.minutes,4.5,0,p.features,p.partner_name,p.photo_url,p.partner_id]));app()}
loadCatalog();

/* ===== Reviews and partner profile pages ===== */
let stars=5;
const starHtml=()=>[1,2,3,4,5].map(i=>`<span onclick="stars=${i};$('#stars').innerHTML=starHtml()">${i<=stars?'★':'☆'}</span>`).join('');
function rateModal(oid,pid){stars=5;modal(`<div class="row"><h3>Rate your service</h3><button class="btn o" onclick="close()">✕</button></div><div id="stars" style="font-size:34px;cursor:pointer;color:#f5a623">${starHtml()}</div>
<textarea id="rc" placeholder="Tell others about your experience" style="width:100%;margin-top:8px"></textarea><button class="btn" style="margin-top:8px" onclick="sendReview(${oid},'${pid}')">Submit review</button>`)}
async function sendReview(oid,pid){const {error}=await sb.from('reviews').insert({order_id:oid,partner_id:pid,rating:stars,comment:$('#rc').value.trim(),author:S.user.email.split('@')[0]});
 if(error)return toast(error.message);close();toast('Thank you for your review!');load()}
async function partnerProfile(pid){const [p,r]=await Promise.all([sb.from('public_partners').select('*').eq('id',pid).maybeSingle(),sb.from('reviews').select('*').eq('partner_id',pid).order('created_at',{ascending:false}).limit(20)]);
 const P=p.data;if(!P)return toast('Profile not found');const rv=r.data||[],avg=rv.length?(rv.reduce((s,x)=>s+x.rating,0)/rv.length).toFixed(1):null;
 modal(`<div class="row"><h3>${esc(P.business_name)}</h3><button class="btn o" onclick="close()">✕</button></div>
 <div style="display:flex;gap:12px;align-items:center">${P.logo_url?`<img class="avatar" src="${esc(P.logo_url)}">`:'<div class="avatar" style="background:var(--bg);display:grid;place-items:center;font-size:30px">🏢</div>'}
 <div><div class="mut">📍 ${esc(P.city)}</div><div>${avg?`<b>★ ${avg}</b> <span class="mut">(${rv.length})</span>`:'<span class="mut">No reviews yet</span>'}</div></div></div>
 <p>${esc(P.about||'')}</p><h4>Services</h4>${SV.filter(s=>s[12]==pid).map(s=>`<div class="row" style="margin:4px 0"><span>${esc(nm(s))} · ${fmt(price(s))}</span><button class="btn o" onclick="add(${s[0]});close()">${t('add')}</button></div>`).join('')||'<span class="mut">-</span>'}
 <h4>${t('rev')}</h4>${rv.map(x=>`<div style="margin:6px 0"><span style="color:#f5a623">${'★'.repeat(x.rating)}${'☆'.repeat(5-x.rating)}</span> <b>${esc(x.author)}</b><div>${esc(x.comment||'')}</div></div>`).join('')||'<span class="mut">-</span>'}`)}
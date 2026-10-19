const S={lang:'en',reg:'SE',city:0,role:'c',cat:-1,q:'',cart:{},prem:false,subs:false,rut:false,jobs:[
 {id:'D1',demo:1,t:'Electrician visit',loc:'Kungsgatan 12, Stockholm',pay:980,st:0},{id:'D2',demo:1,t:'Full home cleaning',loc:'Storgatan 5, Uppsala',pay:1190,st:0}],earn:0,n:100};
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
 $('#q').placeholder=t('ph');$('#role').textContent=S.role=='c'?'👤 '+t('cus'):'🧰 '+t('pro');
 $('#cnt').textContent=Object.values(S.cart).reduce((a,b)=>a+b,0);
 $('#sug').innerHTML=SV.map(s=>`<option value="${esc(nm(s))}">`).join('')}
function grid(){const q=S.q.toLowerCase();$('#grid').innerHTML=SV.filter(s=>(S.cat<0||s[1]==S.cat)&&(nm(s)+s[3]).toLowerCase().includes(q)).map(s=>`
<div class="card"><div class="img" style="background:hsl(${s[1]*55+230} 70% 92%)" onclick="detail(${s[0]})">${s[2]}</div><div class="cb"><b>${nm(s)}</b>
<div class="mut">★ ${s[7]} · ${s[6]} ${t('min')}</div><div class="row" style="margin-top:8px"><b>${fmt(price(s))}</b><button class="btn" onclick="add(${s[0]})">${t('add')}</button></div></div></div>`).join('')}
function app(){head();const sv=S.role=='c';$('#app').innerHTML=sv?`
<div class="hero"><h1>${t('hero')}</h1><div>${t('h2')} · ${R[S.reg].cities[S.city]}</div><div class="why">${t('w').map(x=>`<span>✔ ${x}</span>`).join('')}</div></div>
<div class="chips"><span class="chip ${S.cat<0?'on':''}" onclick="S.cat=-1;app()">${t('all')}</span>${t('cats').map((c,i)=>`<span class="chip ${S.cat==i?'on':''}" onclick="S.cat=${i};app()">${c}</span>`).join('')}</div>
<div class="grid" id="grid"></div><h2>${t('trk')}</h2><div id="trk"></div>`:`<h2>🧰 ${t('pro')}</h2><div id="dash"></div>`;
 if(sv){grid();track()}else dash();cartUI()}
function track(){const mine=S.jobs.filter(j=>j.mine);$('#trk').innerHTML=mine.length?mine.map(j=>`<div class="sec"><div class="row"><b>#${j.id} · ${esc(j.t)}</b><span>${fmt(j.pay)}</span></div>
<div class="steps">${t('st').map((_,i)=>`<i class="${i<=j.st?'d':''}"></i>`).join('')}</div><div><b>${t('st')[j.st]}</b>${j.rej?` <span class="mut">${t('reass')}</span>`:''}</div>
<div class="mut">${esc(j.loc)} · ${esc(j.slot||'')}</div>${j.st<4?`<button class="btn o" style="margin-top:8px" onclick="adv('${j.id}')">▶ ${t('go')[j.st]} (demo)</button>`:''}</div>`).join(''):`<p class="mut">${t('none')}</p>`}
function dash(){const done=S.jobs.filter(j=>j.st==4).length;$('#dash').innerHTML=`<div class="sec stat"><div><b>${fmt(S.earn)}</b>${t('earn')}</div><div><b>${done}</b>${t('done')}</div><div><b>${S.jobs.length-done}</b>${t('open')}</div></div>
<h3>${t('jobs')}</h3>`+S.jobs.map(j=>`<div class="sec"><div class="row"><b>${esc(j.t)}</b><span>${fmt(j.pay*.85)}</span></div><div class="mut">📍 ${esc(j.loc)}</div>
<div class="steps">${t('st').map((_,i)=>`<i class="${i<=j.st?'d':''}"></i>`).join('')}</div><b>${t('st')[j.st]}</b>
<div style="margin-top:8px">${j.st==0?`<button class="btn" onclick="adv('${j.id}')">${t('acc')}</button> <button class="btn o" onclick="rej('${j.id}')">${t('rej')}</button>`:j.st<4?`<button class="btn" onclick="adv('${j.id}')">${t('go')[j.st]}</button>`:'✅'}</div></div>`).join('')}
/* ===== Order state machine: 0 Confirmed → 1 Assigned → 2 In transit → 3 In progress → 4 Completed ===== */
function adv(id){const j=S.jobs.find(x=>x.id==id);if(j.st>=4)return;j.rej=0;j.st++;if(j.st==4)S.earn+=j.pay*.85;app()}
function rej(id){const j=S.jobs.find(x=>x.id==id);j.rej=1;S.jobs=S.jobs.filter(x=>x.id!=id||x.mine);app()}
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
function detail(id){const s=SV.find(x=>x[0]==id);modal(`<div class="row"><h2>${s[2]} ${nm(s)}</h2><button class="btn o" onclick="close()">✕</button></div>
<div class="mut">★ ${s[7]} · ${s[6]} ${t('min')} · ${fmt(price(s))}</div><h4>✔ ${t('inc')}</h4><div>Trained professional · Tools &amp; materials · Cleanup</div><h4>✘ ${t('exc')}</h4><div>Spare parts · Extra rooms</div>
<h4>${t('faq')}</h4><div><b>${t('f1')}</b><br>${t('a1')}<br><b>${t('f2')}</b><br>${t('a2')}</div><h4>${t('rev')}</h4><div>★★★★★ “Punctual and tidy.” <span class="mut">Anna, ${R[S.reg].cities[0]}</span><br>★★★★☆ “Great value.” <span class="mut">Omar</span></div>
<button class="btn" style="margin-top:12px" onclick="add(${id});close()">${t('add')}</button>`)}
let slot='';
function checkout(){if(!Object.keys(S.cart).length)return;const tm=new Date(Date.now()+864e5).toISOString().slice(0,10),sl=['08:00','10:00','12:00','14:00','16:00','18:00'];slot=sl[1];
 modal(`<div class="row"><h3>${t('chk')}</h3><button class="btn o" onclick="close()">✕</button></div>
<label class="f">${t('date')}</label><input type="date" id="dt" value="${tm}" min="${tm}"><label class="f">${t('time')}</label>
<div class="slots">${sl.map(x=>`<button class="${x==slot?'on':''}" onclick="slot='${x}';document.querySelectorAll('.slots button').forEach(b=>b.classList.toggle('on',b.textContent=='${x}'))">${x}</button>`).join('')}</div>
<label class="f">${t('addr')}</label><input id="ad" style="width:100%"><label class="f">${t('zip')}</label><input id="zp" style="width:100%"><div class="err" id="ze"></div>
<label class="f">${t('pay')}</label><div class="pays">${S.reg=='SE'?'<label><input type="radio" name="p" value="Swish" checked> Swish</label>':''}<label><input type="radio" name="p" value="Klarna" ${S.reg!='SE'?'checked':''}> Klarna (Pay Later / 3x)</label><label><input type="radio" name="p" value="Card"> 💳 Card</label></div>
<div class="row tot"><span>${t('tot')}</span><span>${fmt(calc().tot)}</span></div><button class="btn" style="width:100%;margin-top:10px" onclick="place()">${t('place')}</button>`)}
function place(){const z=$('#zp').value.trim(),a=$('#ad').value.trim();$('#ze').textContent='';
 if(!R[S.reg].zip.test(z)){$('#ze').textContent=t('bad');return}if(!a){$('#ad').focus();return}
 const c=calc(),names=Object.keys(S.cart).map(id=>nm(SV.find(x=>x[0]==id))).join(', ');
 S.jobs.unshift({id:'O'+(++S.n),mine:1,t:names,loc:`${a}, ${z} ${R[S.reg].cities[S.city]}`,slot:$('#dt').value+' '+slot+' · '+document.querySelector('[name=p]:checked').value,pay:c.sub-c.rut,st:0});
 S.cart={};close();$('#drawer').classList.remove('on');app()}
/* ===== Events: language (+RTL), region, city, role, search, cart ===== */
$('#lang').onchange=e=>{S.lang=e.target.value;document.documentElement.lang=S.lang;document.documentElement.dir=S.lang=='ar'?'rtl':'ltr';app()};
$('#reg').onchange=e=>{S.reg=e.target.value;S.city=0;if(S.reg!='SE')S.rut=false;app()};
$('#city').onchange=e=>{S.city=+e.target.value;app()};
$('#role').onclick=()=>{S.role=S.role=='c'?'p':'c';app()};
$('#q').oninput=e=>{S.q=e.target.value;if($('#grid'))grid()};
$('#cartb').onclick=()=>$('#drawer').classList.toggle('on');
app();
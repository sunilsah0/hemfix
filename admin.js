/* Admin dashboard: approve / suspend partners, view orders, remove reviews. No SQL needed. */
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ST=['Confirmed','Assigned','In transit','In progress','Completed'];
let user=null,ok=false,tab='pending',partners=[],orders=[],reviews=[];
sb.auth.onAuthStateChange((_e,s)=>{user=s?s.user:null;setTimeout(refresh,0)});
async function refresh(){$('#out').style.display=user?'':'none';ok=false;
 if(user){ok=(await sb.rpc('is_admin')).data===true;
  if(ok){const [p,o,v]=await Promise.all([sb.rpc('admin_partners'),sb.from('orders').select('*').order('created_at',{ascending:false}).limit(100),sb.from('reviews').select('*').order('created_at',{ascending:false}).limit(100)]);
   if(p.error)toast(p.error.message);partners=p.data||[];orders=o.data||[];reviews=v.data||[]}}
 view()}
async function login(){const {error}=await sb.auth.signInWithPassword({email:$('#em').value.trim(),password:$('#pw').value});if(error)$('#ae').textContent=error.message}
async function register(){const {data,error}=await sb.auth.signUp({email:$('#em').value.trim(),password:$('#pw').value});$('#ae').textContent=error?error.message:(data.session?'':'Check your email to confirm, then log in.')}
async function setOk(id,v){const {error}=await sb.rpc('admin_set_approval',{pid:id,ok:v});if(error)toast(error.message);else{toast(v?'Partner approved':'Partner suspended');refresh()}}
async function delP(id){if(!confirm('Delete this partner and all their services?'))return;const {error}=await sb.rpc('admin_delete_partner',{pid:id});if(error)toast(error.message);else refresh()}
async function delRev(id){if(!confirm('Delete this review?'))return;const {error}=await sb.from('reviews').delete().eq('id',id);if(error)toast(error.message);else refresh()}
function pcard(p){return `<div class="sec"><div class="row"><b>${esc(p.business_name)}</b><span class="mut">${new Date(p.created_at).toLocaleDateString()}</span></div>
 <div class="mut">${esc(p.email)} · ${esc(p.phone)} · ${esc(p.city)}, ${esc(p.region)} · ${p.services} service(s)</div><p>${esc(p.about||'')}</p>
 ${p.approved?`<button class="btn o" onclick="setOk('${p.id}',false)">Suspend</button>`:`<button class="btn" onclick="setOk('${p.id}',true)">Approve</button>`} <button class="btn o" onclick="delP('${p.id}')">Delete</button></div>`}
function view(){const a=$('#app');
 if(!user)return a.innerHTML=`<div class="sec" style="max-width:420px;margin:auto"><h2>Admin login</h2><label class="f">Email</label><input id="em" type="email" style="width:100%"><label class="f">Password</label><input id="pw" type="password" style="width:100%"><div class="err" id="ae"></div>
 <div style="margin-top:10px"><button class="btn" onclick="login()">Log in</button> <button class="btn o" onclick="register()">Create account</button></div></div>`;
 if(!ok)return a.innerHTML='<div class="sec">This account is not an admin. The owner must add it once (see README, Admin dashboard).</div>';
 const pend=partners.filter(p=>!p.approved),act=partners.filter(p=>p.approved),done=orders.filter(o=>o.status==4),gmv={};
 done.forEach(o=>gmv[o.currency]=(gmv[o.currency]||0)+Number(o.total));
 const g=Object.entries(gmv).map(([c,v])=>Math.round(v)+' '+c).join(' · ')||'0';
 a.innerHTML=`<div class="sec stat"><div><b>${pend.length}</b>Waiting</div><div><b>${act.length}</b>Active partners</div><div><b>${orders.length}</b>Orders</div></div><div class="sec">Completed order value: <b>${g}</b></div>
 <div class="chips">${[['pending','Pending ('+pend.length+')'],['active','Partners'],['orders','Orders'],['reviews','Reviews']].map(([k,l])=>`<span class="chip ${tab==k?'on':''}" onclick="tab='${k}';view()">${l}</span>`).join('')}</div>`+
 (tab=='pending'?(pend.map(pcard).join('')||'<p class="mut">No partners waiting.</p>'):tab=='active'?act.map(pcard).join(''):
  tab=='orders'?orders.map(o=>`<div class="sec"><div class="row"><b>${esc(o.title)}</b><span>${Math.round(o.total)} ${esc(o.currency)}</span></div><div class="mut">${esc(o.address)}, ${esc(o.city)} · ${ST[o.status]} · ${new Date(o.created_at).toLocaleString()}</div></div>`).join('')||'<p class="mut">No orders.</p>':
  reviews.map(r=>`<div class="sec row"><div><span class="stars">${'★'.repeat(r.rating)}</span> <b>${esc(r.author)}</b><div>${esc(r.comment||'')}</div></div><button class="btn o" onclick="delRev(${r.id})">Delete</button></div>`).join('')||'<p class="mut">No reviews.</p>')}
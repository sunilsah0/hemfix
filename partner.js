/* Partner portal: register, sell services, manage team, accept jobs and assign people. */
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CATS=['Beauty & Salon','Home Cleaning','AC & Appliance','Plumbing & Electrician','Handyman & Painting','Wellness & Massage'];
const ST=['Booking Confirmed','Partner Assigned','In Transit','Service In Progress','Completed'],GO=['Accept job','Start travel','Start service','Mark completed'];
let user=null,P=null,tab='jobs',jobs=[],svc=[],team=[],locs={};
const say=(id,m)=>{const e=$('#'+id);if(e)e.textContent=m};
sb.auth.onAuthStateChange((_e,s)=>{user=s?s.user:null;setTimeout(refresh,0)});
sb.channel('p-live').on('postgres_changes',{event:'*',schema:'public',table:'orders'},()=>refresh()).on('postgres_changes',{event:'*',schema:'public',table:'locations'},()=>refresh()).on('postgres_changes',{event:'*',schema:'public',table:'team_members'},()=>refresh()).subscribe();
async function refresh(){$('#out').style.display=user?'':'none';P=null;jobs=[];svc=[];team=[];
 if(user){P=(await sb.from('partners').select('*').maybeSingle()).data;
  if(P){const [o,s,t,l]=await Promise.all([sb.from('orders').select('*').order('created_at',{ascending:false}),sb.from('partner_services').select('*').eq('partner_id',user.id).order('id'),sb.from('team_members').select('*').order('id'),sb.from('locations').select('*')]);jobs=o.data||[];svc=s.data||[];team=t.data||[];locs={};(l.data||[]).forEach(x=>locs[x.order_id]=x)}}
 view()}
/* ----- login / register ----- */
async function login(){const {error}=await sb.auth.signInWithPassword({email:$('#em').value.trim(),password:$('#pw').value});if(error)say('ae',error.message)}
async function register(){const {data,error}=await sb.auth.signUp({email:$('#em').value.trim(),password:$('#pw').value});if(error)say('ae',error.message);else if(!data.session)say('ae','Check your email to confirm, then log in here.')}
function cities(){$('#ct').innerHTML=R[$('#rg').value].cities.map(c=>`<option>${c}</option>`).join('')}
async function saveProfile(){const bn=$('#bn').value.trim(),ph=$('#ph').value.trim();if(!bn||!ph)return say('pe','Business name and phone are required.');
 const {error}=await sb.from('partners').insert({business_name:bn,phone:ph,region:$('#rg').value,city:$('#ct').value,about:$('#ab').value.trim()});if(error)say('pe',error.message);else refresh()}
/* ----- jobs ----- */
async function adv(id,st){const {error}=await sb.from('orders').update(st==0?{status:1,partner_id:user.id}:{status:st+1}).eq('id',id);if(error)toast(error.message);refresh()}
async function assign(id,v){const m=team.find(x=>x.id==v);const {error}=await sb.from('orders').update({assigned_to:v||null,assigned_name:m?m.name:null,worker_accepted:false}).eq('id',id);if(error)toast(error.message);refresh()}
function jobsV(){const L=jobs.filter(o=>o.partner_id===user.id||(o.partner_id==null&&o.status===0&&o.customer_id!==user.id)),earn={};
 L.filter(o=>o.status==4&&o.partner_id===user.id).forEach(o=>earn[o.currency]=(earn[o.currency]||0)+Number(o.subtotal)*.85);
 const e=Object.entries(earn).map(([c,v])=>Math.round(v)+' '+c).join(' · ')||'0';
 return `<div class="sec stat"><div><b>${e}</b>Earnings (after 15% fee)</div><div><b>${L.filter(o=>o.status==4).length}</b>Done</div><div><b>${L.filter(o=>o.status<4).length}</b>Open</div></div>`+
 (L.map(o=>`<div class="sec"><div class="row"><b>${esc(o.title)}</b><span>${Math.round(o.subtotal)} ${esc(o.currency)}</span></div>
 <div class="mut">📍 ${esc(o.address)}, ${esc(o.postal)} ${esc(o.city)} · ${esc(o.slot)}</div>
 <div class="steps">${ST.map((_,i)=>`<i class="${i<=o.status?'d':''}"></i>`).join('')}</div><b>${ST[o.status]}</b>${o.assigned_name?`<div class="mut">👤 ${esc(o.assigned_name)} · ${o.worker_accepted?'✔ accepted':'⏳ waiting for acceptance'}</div>`:''}${locs[o.id]&&o.status>1&&o.status<4?mapHtml(locs[o.id]):''}
 <div style="margin-top:8px">${o.status<4?`<button class="btn" onclick="adv(${o.id},${o.status})">${GO[o.status]}</button>`:'✅'}
 ${o.partner_id===user.id&&o.status<4?` 👤 <select onchange="assign(${o.id},this.value)"><option value="">Assign person…</option>${team.filter(m=>m.active).map(m=>`<option value="${m.id}" ${o.assigned_to==m.id?'selected':''}>${esc(m.name)}</option>`).join('')}</select>`:''}</div></div>`).join('')||'<p class="mut">No jobs yet. Jobs in your region appear here.</p>')}
/* ----- services you sell ----- */
async function addSvc(){const n=$('#sn').value.trim(),p=+$('#sp').value,m=+$('#sm').value;if(!n||p<=0||m<15)return say('se','Name, price (>0) and minutes (15+) are required.');
 let url=null;try{url=await upload($('#sph').files[0])}catch(e){return}
 const {error}=await sb.from('partner_services').insert({name:n,category:+$('#sc').value,price_sek:p,minutes:m,features:$('#sf').value.trim(),partner_name:P.business_name,photo_url:url});if(error)say('se',error.message);else refresh()}
async function togSvc(id,on){await sb.from('partner_services').update({active:on}).eq('id',id);refresh()}
async function delSvc(id){if(confirm('Delete this service?')){await sb.from('partner_services').delete().eq('id',id);refresh()}}
function svcV(){return `<div class="sec"><h3>Add a service</h3><input id="sn" placeholder="Service name" style="width:100%;margin-bottom:6px">
 <select id="sc">${CATS.map((c,i)=>`<option value="${i}">${c}</option>`).join('')}</select> <input id="sp" type="number" min="1" placeholder="Price (SEK)" style="width:130px"> <input id="sm" type="number" min="15" placeholder="Minutes" style="width:100px">
 <textarea id="sf" placeholder="Features: what is included" style="width:100%;margin-top:6px"></textarea><label class="f">Photo of your service (optional, max 2 MB)</label><input id="sph" type="file" accept="image/*"><div class="err" id="se"></div><button class="btn" style="margin-top:6px" onclick="addSvc()">Publish service</button>
 <p class="mut">Enter prices in SEK; the customer site converts to EUR. Services are public once your account is approved.</p></div>`+
 svc.map(s=>`<div class="sec row"><div>${s.photo_url?`<img src="${esc(s.photo_url)}" style="width:56px;height:56px;object-fit:cover;border-radius:10px;float:inline-start;margin-inline-end:8px">`:''}<b>${esc(s.name)}</b><div class="mut">${esc(CATS[s.category])} · ${s.price_sek} SEK · ${s.minutes} min</div><div class="mut">${esc(s.features||'')}</div></div>
 <div><button class="btn o" onclick="togSvc(${s.id},${!s.active})">${s.active?'Hide':'Show'}</button> <button class="btn o" onclick="delSvc(${s.id})">🗑</button></div></div>`).join('')}
/* ----- your team (people you assign to jobs) ----- */
async function addMember(){const n=$('#tn').value.trim();if(!n)return say('te','Name is required.');
 const {error}=await sb.from('team_members').insert({name:n,phone:$('#tp').value.trim(),skill:$('#tk').value.trim()});if(error)say('te',error.message);else refresh()}
async function delMember(id){if(confirm('Remove this person?')){await sb.from('team_members').delete().eq('id',id);refresh()}}
function teamV(){return `<div class="sec"><h3>Add a team member</h3><input id="tn" placeholder="Name"> <input id="tp" placeholder="Phone"> <input id="tk" placeholder="Skill (e.g. electrician)"><div class="err" id="te"></div><button class="btn" style="margin-top:6px" onclick="addMember()">Add person</button></div>`+
 team.map(m=>`<div class="sec row"><div><span class="dot ${m.online?'on':''}"></span> <b>${esc(m.name)}</b><div class="mut">${esc(m.skill||'')} ${esc(m.phone||'')} · ${m.user_id?(m.online?'online':'offline'):'invite code: <b>'+esc(m.code)+'</b> (worker enters it in the Worker app)'}</div></div><button class="btn o" onclick="delMember(${m.id})">🗑</button></div>`).join('')}
/* ----- screens ----- */
function view(){const a=$('#app');
 if(!user)return a.innerHTML=`<div class="sec" style="max-width:420px;margin:auto"><h2>Partner login</h2><p class="mut">Sell your services, manage your team and receive jobs.</p>
 <label class="f">Email</label><input id="em" type="email" style="width:100%"><label class="f">Password (min 6)</label><input id="pw" type="password" style="width:100%"><div class="err" id="ae"></div>
 <div style="margin-top:10px"><button class="btn" onclick="login()">Log in</button> <button class="btn o" onclick="register()">Register as partner</button></div></div>`;
 if(!P)return a.innerHTML=`<div class="sec" style="max-width:480px;margin:auto"><h2>Tell us about your business</h2>
 <label class="f">Business name</label><input id="bn" style="width:100%"><label class="f">Phone</label><input id="ph" style="width:100%">
 <label class="f">Region / city</label><select id="rg" onchange="cities()">${Object.entries(R).map(([k,v])=>`<option value="${k}">${v.n}</option>`).join('')}</select> <select id="ct"></select>
 <label class="f">About your business</label><textarea id="ab" style="width:100%"></textarea><div class="err" id="pe"></div><button class="btn" style="margin-top:8px" onclick="saveProfile()">Submit for approval</button></div>`,cities();
 a.innerHTML=`<h2>${esc(P.business_name)}</h2>${P.approved?'':'<div class="sec">⏳ Waiting for approval. Your services go public and you receive jobs after the HemFix team approves your account.</div>'}
 <div class="chips">${['jobs','services','team','profile'].map(x=>`<span class="chip ${tab==x?'on':''}" onclick="tab='${x}';view()">${x[0].toUpperCase()+x.slice(1)}</span>`).join('')}</div>`+(tab=='jobs'?jobsV():tab=='services'?svcV():tab=='team'?teamV():profV())}

/* ----- photo upload (Supabase Storage, public bucket 'photos') ----- */
async function upload(f){if(!f)return null;if(f.size>2097152||!f.type.startsWith('image/')){say('se','Photo must be an image under 2 MB.');throw 0}
 const path=`${user.id}/${Date.now()}-${f.name.replace(/[^\w.]/g,'_')}`;const {error}=await sb.storage.from('photos').upload(path,f);if(error){say('se',error.message);throw 0}
 return sb.storage.from('photos').getPublicUrl(path).data.publicUrl}
/* ----- business profile page ----- */
function profV(){return `<div class="sec"><h3>Business profile</h3>${P.logo_url?`<img class="avatar" src="${esc(P.logo_url)}">`:''}
 <label class="f">Logo / photo (max 2 MB)</label><input id="lg" type="file" accept="image/*"><label class="f">Business name</label><input id="bn2" value="${esc(P.business_name)}" style="width:100%">
 <label class="f">Phone</label><input id="ph2" value="${esc(P.phone)}" style="width:100%"><label class="f">About</label><textarea id="ab2" style="width:100%">${esc(P.about||'')}</textarea>
 <div class="err" id="se"></div><button class="btn" style="margin-top:6px" onclick="saveProf()">Save profile</button></div>`}
async function saveProf(){let url=P.logo_url;try{const f=$('#lg').files[0];if(f)url=await upload(f)}catch(e){return}
 const {error}=await sb.from('partners').update({business_name:$('#bn2').value.trim(),phone:$('#ph2').value.trim(),about:$('#ab2').value.trim(),logo_url:url}).eq('id',user.id);if(error)toast(error.message);else{toast('Saved');refresh()}}
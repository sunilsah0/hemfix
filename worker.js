/* Worker app: log in, link with the partner's invite code, go online, accept jobs, share live location. */
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ST=['Booking Confirmed','Partner Assigned','In Transit','Service In Progress','Completed'],GO=['','Start travel','Start service','Mark completed'];
let user=null,M=null,jobs=[],watch=null,cur=null,lastSent=0;
const say=(id,m)=>{const e=$('#'+id);if(e)e.textContent=m};
sb.auth.onAuthStateChange((_e,s)=>{user=s?s.user:null;setTimeout(refresh,0)});
sb.channel('w-live').on('postgres_changes',{event:'*',schema:'public',table:'orders'},()=>refresh()).subscribe();
async function refresh(){$('#out').style.display=user?'':'none';M=null;jobs=[];
 if(user){M=(await sb.from('team_members').select('*').maybeSingle()).data;
  if(M)jobs=((await sb.from('orders').select('*').order('created_at',{ascending:false})).data||[]).filter(o=>o.assigned_to===M.id)}
 view();track()}
async function login(){const {error}=await sb.auth.signInWithPassword({email:$('#em').value.trim(),password:$('#pw').value});if(error)say('ae',error.message)}
async function register(){const {data,error}=await sb.auth.signUp({email:$('#em').value.trim(),password:$('#pw').value});if(error)say('ae',error.message);else if(!data.session)say('ae','Check your email to confirm, then log in.')}
async function claim(){const {error}=await sb.rpc('claim_member',{p_code:$('#cd').value.trim()});if(error)say('ce',error.message);else refresh()}
async function setOnline(on){await sb.from('team_members').update({online:on,last_seen:new Date().toISOString()}).eq('id',M.id);refresh()}
async function accept(id){const {error}=await sb.from('orders').update({worker_accepted:true}).eq('id',id);if(error)toast(error.message);refresh()}
async function step(id,st){const {error}=await sb.from('orders').update({status:st+1}).eq('id',id);if(error)return toast(error.message);
 if(st+1==4)await sb.from('locations').delete().eq('order_id',id);refresh()}
async function logout(){if(M)await sb.from('team_members').update({online:false,last_seen:new Date().toISOString()}).eq('id',M.id);stop();await sb.auth.signOut()}
/* Live location: only while you are ONLINE and a job you accepted is in transit / in progress */
function track(){const act=M&&M.online&&jobs.find(o=>o.worker_accepted&&(o.status==2||o.status==3));
 if(!act)return stop();cur=act.id;if(watch!=null)return;
 if(!navigator.geolocation)return toast('Location is not supported on this device');
 watch=navigator.geolocation.watchPosition(p=>{const n=Date.now();if(n-lastSent<10000||cur==null)return;lastSent=n;
  sb.from('locations').upsert({order_id:cur,lat:p.coords.latitude,lng:p.coords.longitude,updated_at:new Date().toISOString()}).then(r=>{if(r.error)toast(r.error.message)})},
  e=>toast('Location blocked: '+e.message),{enableHighAccuracy:true,maximumAge:5000})}
function stop(){if(watch!=null&&navigator.geolocation)navigator.geolocation.clearWatch(watch);watch=null;cur=null}
function view(){const a=$('#app');
 if(!user)return a.innerHTML=`<div class="sec" style="max-width:420px;margin:auto"><h2>Worker login</h2><p class="mut">For people assigned jobs by a partner. Ask your partner for an invite code.</p>
 <label class="f">Email</label><input id="em" type="email" style="width:100%"><label class="f">Password (min 6)</label><input id="pw" type="password" style="width:100%"><div class="err" id="ae"></div>
 <div style="margin-top:10px"><button class="btn" onclick="login()">Log in</button> <button class="btn o" onclick="register()">Create account</button></div></div>`;
 if(!M)return a.innerHTML=`<div class="sec" style="max-width:420px;margin:auto"><h2>Enter your invite code</h2><p class="mut">Your partner gives you a 6-character code.</p><input id="cd" placeholder="ABC123" style="width:100%;text-transform:uppercase"><div class="err" id="ce"></div><button class="btn" style="margin-top:8px" onclick="claim()">Link my account</button></div>`;
 a.innerHTML=`<div class="sec row"><div><h2 style="margin:0">Hi ${esc(M.name)}</h2><span class="dot ${M.online?'on':''}"></span> ${M.online?'Online':'Offline'}</div>
 <button class="btn ${M.online?'o':''}" onclick="setOnline(${!M.online})">${M.online?'Go offline':'Go online'}</button></div>
 ${M.online?'':'<div class="sec">Go online to receive jobs and share your location during a job.</div>'}`+
 (jobs.map(o=>`<div class="sec"><div class="row"><b>${esc(o.title)}</b><span class="mut">${esc(o.slot)}</span></div>
 <div>📍 <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.address+' '+o.postal+' '+o.city)}" target="_blank" rel="noopener">${esc(o.address)}, ${esc(o.postal)} ${esc(o.city)}</a></div>
 <div class="steps">${ST.map((_,i)=>`<i class="${i<=o.status?'d':''}"></i>`).join('')}</div><b>${ST[o.status]}</b>
 <div style="margin-top:8px">${o.status==4?'✅':!o.worker_accepted?`<button class="btn" onclick="accept(${o.id})">Accept job</button>`:o.status>=1?`<button class="btn" onclick="step(${o.id},${o.status})">${GO[o.status]}</button>`:'⏳ Waiting for your partner'}</div>
 ${M.online&&o.worker_accepted&&(o.status==2||o.status==3)?'<div class="mut">📡 Sharing your live location with the customer and your partner</div>':''}</div>`).join('')||'<p class="mut">No jobs assigned yet.</p>')}
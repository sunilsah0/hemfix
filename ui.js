/* Shared helpers: toast messages and a free OpenStreetMap live-location map */
function toast(m){const e=document.createElement('div');e.className='toast';e.textContent=m;document.body.appendChild(e);setTimeout(()=>e.remove(),3500)}
function mapHtml(l){const la=Number(l.lat),ln=Number(l.lng),d=.008;
 return `<iframe class="map" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${ln-d}%2C${la-d*.6}%2C${ln+d}%2C${la+d*.6}&layer=mapnik&marker=${la}%2C${ln}"></iframe>
 <div class="mut">📍 Live location, updated ${new Date(l.updated_at).toLocaleTimeString()} · <a href="https://www.openstreetmap.org/?mlat=${la}&mlon=${ln}#map=16/${la}/${ln}" target="_blank" rel="noopener">Open map</a></div>`}
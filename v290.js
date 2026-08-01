/* Sobre Ruedas v2.9.0 — apertura animada, perfil profesional y refuerzos operativos */
(()=>{
  'use strict';
  const VERSION='2.9.0';
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const role=typeof APP_ROLE!=='undefined'?APP_ROLE:(location.pathname.includes('conductor')?'driver':'passenger');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rideId=()=>typeof currentRideId!=='undefined'?currentRideId:null;
  const profileObj=()=>typeof currentProfile!=='undefined'?currentProfile:null;
  const userObj=()=>typeof user!=='undefined'?user:null;

  function updateBrand(){
    document.title=`${role==='driver'?'Sobre Ruedas Conductor':'Sobre Ruedas'} v${VERSION}`;
    q('meta[name="theme-color"]')?.setAttribute('content','#061522');
    qa('.brand small').forEach(el=>el.textContent=`CUBA · v${VERSION}`);
    qa('.logo').forEach(el=>{el.innerHTML='<img src="assets/brand-mark.svg" alt="R" style="width:100%;height:100%;display:block">';el.style.background='transparent'});
    qa('body *').forEach(el=>{if(el.childNodes.length===1&&el.firstChild?.nodeType===Node.TEXT_NODE)el.textContent=el.textContent.replace(/v2\.(?:5|6|7|8)\.\d/g,`v${VERSION}`).replace(/Ciego de Ávila/g,'Cuba')});
  }

  function splash(){
    if(q('#srSplash290'))return;
    const el=document.createElement('div');el.id='srSplash290';el.innerHTML=`
      <div class="sr-splash-map"></div><div class="sr-splash-core">
        <img class="sr-wordmark" src="assets/brand-wordmark.svg" alt="Sobre Ruedas Cuba">
        <div class="sr-route-stage"><svg viewBox="0 0 520 210" preserveAspectRatio="none"><defs><linearGradient id="srG"><stop stop-color="#25e5bd"/><stop offset="1" stop-color="#287cff"/></linearGradient></defs><path class="sr-route-glow" d="M10 180 C120 85 190 210 285 115 S410 115 505 20"/><path class="sr-route-main" d="M10 180 C120 85 190 210 285 115 S410 115 505 20"/></svg><img class="sr-moto-moving" src="assets/moto.svg" alt="Moto"></div>
        <div class="sr-splash-loading">Cargando tu experiencia</div><div class="sr-progress"><i></i></div>
      </div>`;
    document.body.appendChild(el);
    setTimeout(()=>el.classList.add('hide'),2600);setTimeout(()=>{el.remove();showOnboarding()},3150);
  }

  function showOnboarding(){
    if(role!=='passenger'||localStorage.getItem('sr_onboarding_v290_seen')==='1'||localStorage.getItem('rueda_passenger_user'))return;
    const el=document.createElement('section');el.id='srOnboarding290';el.innerHTML=`<button class="sr-onboard-skip">Omitir</button><div class="sr-onboard-card"><img src="assets/brand-wordmark.svg" alt="Sobre Ruedas Cuba"><h1>¿Cómo deseas continuar?</h1><p>Selecciona el espacio que necesitas. Pasajero y conductor permanecen totalmente separados.</p><button data-role="passenger" class="sr-role-choice passenger"><span>♙</span><div><strong>Pasajero</strong><small>Solicita viajes de forma rápida, segura y confiable.</small></div><b>›</b></button><button data-role="driver" class="sr-role-choice driver"><span>◉</span><div><strong>Conductor</strong><small>Recibe servicios, navega y administra tus ganancias.</small></div><b>›</b></button><a href="admin.html">Administrador</a><a href="#" data-help>Ayuda y soporte</a></div>`;
    document.body.appendChild(el);
    const close=()=>{localStorage.setItem('sr_onboarding_v290_seen','1');el.classList.add('hide');setTimeout(()=>el.remove(),420)};
    q('.sr-onboard-skip',el).onclick=close;q('[data-role="passenger"]',el).onclick=close;q('[data-role="driver"]',el).onclick=()=>{localStorage.setItem('sr_onboarding_v290_seen','1');location.href='conductor.html'};q('[data-help]',el).onclick=e=>{e.preventDefault();close();setTimeout(()=>q('#helpBtn')?.click(),450)};
  }

  function initials(name){return String(name||'Usuario').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'U'}
  function profile(){
    const panel=q('#accountPanel');if(!panel||panel.dataset.v290)return;panel.dataset.v290='1';panel.classList.add('sr-profile-290');
    const p=profileObj()||{},u=userObj()||{};const oldCard=q('.driver-card',panel);const photo=p.photo_url||q('#accountAvatar img')?.src||'';const name=p.full_name||u.name||q('#accountName')?.textContent||'Usuario';const email=p.email||u.email||q('#accountEmail')?.textContent||'Cuenta verificada';
    const head=document.createElement('section');head.className='sr-profile-head';head.innerHTML=`<div class="sr-profile-user"><div class="sr-profile-photo">${/^https?:\/\//.test(photo)?`<img src="${esc(photo)}" alt="Foto de perfil">`:esc(initials(name))}</div><div><h2 id="srProfileName">${esc(name)}</h2><span class="sr-verified">✓ ${role==='driver'?'Conductor':'Pasajero'} verificado</span></div><button class="sr-edit" type="button">Editar perfil</button></div><div class="sr-profile-contact"><span>☎ ${esc(p.phone||u.phone||'Teléfono protegido')}</span><span>✉ ${esc(email)}</span></div><div class="sr-profile-stats"><div class="sr-stat"><strong id="srTripCount">0</strong><small>Viajes completados</small></div><div class="sr-stat"><strong id="srRating">${esc(p.rating?Number(p.rating).toFixed(1):'—')}</strong><small>Calificación promedio</small></div><div class="sr-stat"><strong id="srSavedCount">0</strong><small>${role==='driver'?'Reportes':'Lugares guardados'}</small></div></div>`;
    if(oldCard)oldCard.replaceWith(head);else panel.prepend(head);
    const menu=document.createElement('div');menu.className='sr-profile-menu';menu.innerHTML=`<button type="button" data-profile-action="details"><span class="ico">${role==='driver'?'🛵':'💳'}</span><span><strong>${role==='driver'?'Vehículo y documentos':'Métodos de pago'}</strong><small>${role==='driver'?'Fotos, matrícula y características':'Efectivo / CUP'}</small></span><b>›</b></button><button type="button" data-profile-action="saved"><span class="ico">⌖</span><span><strong>${role==='driver'?'Estado de aprobación':'Lugares guardados'}</strong><small>${role==='driver'?'Revisión administrativa':'Casa, trabajo y favoritos'}</small></span><b>›</b></button><button type="button" data-profile-action="history"><span class="ico">◷</span><span><strong>Historial de viajes</strong><small>Consulta tus servicios anteriores</small></span><b>›</b></button><button type="button" data-profile-action="help"><span class="ico">🎧</span><span><strong>Ayuda y soporte</strong><small>Reportes y atención dentro de la plataforma</small></span><b>›</b></button><button type="button"><span class="ico">♢</span><span><strong>Privacidad y seguridad</strong><small>Control de cuenta y datos personales</small></span><b>›</b></button>`;
    const logout=q('#logoutBtn',panel);if(logout){logout.classList.add('hidden');menu.insertAdjacentHTML('beforeend','<button type="button" class="danger" data-profile-action="logout"><span class="ico">↪</span><span><strong>Cerrar sesión</strong><small>Salir de tu cuenta</small></span><b>›</b></button>')}
    panel.appendChild(menu);
    q('.sr-edit',head).onclick=()=>q('#profileEditor')?.scrollIntoView({behavior:'smooth',block:'start'});q('[data-profile-action="history"]',menu).onclick=()=>q('.nav [data-page="history"]')?.click();q('[data-profile-action="help"]',menu).onclick=()=>q('#helpBtn')?.click();q('[data-profile-action="logout"]',menu)?.addEventListener('click',()=>logout?.click());
    const sync=()=>{q('#srTripCount').textContent=String(qa('.trip').length||0);q('#srSavedCount').textContent=String(role==='driver'?0:qa('.saved-card').length||0)};sync();setInterval(sync,2500);
  }

  async function vehicleCard(){
    if(role!=='passenger'||!rideId()||typeof sb==='undefined')return;const panel=q('#tripPanel');if(!panel)return;
    const {data:r}=await sb.from('rides').select('*').eq('id',String(rideId())).maybeSingle();if(!r?.driver_id)return;let p=null;
    for(const field of ['device_id','id']){const x=await sb.from('profiles').select('*').eq('role','driver').eq(field,String(r.driver_id)).maybeSingle();if(x.data){p=x.data;break}}
    const s={...(p||{}),...r};let box=q('#srVehicleCard');if(!box){box=document.createElement('section');box.id='srVehicleCard';box.className='sr-vehicle-card';panel.querySelector('.driver-card')?.after(box)}
    const img=s.vehicle_photo_url||'';const title=[s.vehicle_type||'Vehículo',s.vehicle_make,s.vehicle_model].filter(Boolean).join(' · ');
    box.innerHTML=`<div class="sr-vehicle-image">${/^https?:\/\//.test(img)?`<img src="${esc(img)}" alt="Vehículo">`:'🛵'}</div><div><h3>${esc(title||'Vehículo registrado')}</h3><p>${esc([s.vehicle_year,s.vehicle_color].filter(Boolean).join(' · ')||'Características pendientes')}</p><strong>Matrícula ${esc(s.vehicle_plate||'pendiente')}</strong><small>✓ Vehículo registrado en Sobre Ruedas</small></div>`;
  }

  function enableCommunication(){if(!rideId())return;['chatBtn','callBtn','driverChatV270','driverCallV270','driverCallPassenger'].forEach(id=>{const b=q('#'+id);if(b){b.disabled=false;b.removeAttribute('aria-disabled')}});vehicleCard()}

  function replaceSupportSubmit(){
    const old=q('#srHelpSubmit');if(!old||old.dataset.v290)return;const b=old.cloneNode(true);b.dataset.v290='1';old.replaceWith(b);
    b.onclick=async e=>{e.preventDefault();const description=String(q('#srHelpDescription')?.value||'').trim();if(description.length<8)return typeof toast==='function'&&toast('Describe el problema con más detalle.');const category=q('[data-help-category].active')?.dataset.helpCategory||'Otro problema';const priority=q('[data-priority].active')?.dataset.priority||'normal';b.disabled=true;b.textContent='Enviando…';try{let x=await sb.rpc('create_support_case_v290',{p_creator_id:String(typeof deviceId!=='undefined'?deviceId:''),p_creator_role:role,p_ride_id:rideId()?String(rideId()):'',p_category:category,p_subject:category,p_description:description,p_priority:priority});if(x.error&&/does not exist|schema cache/i.test(x.error.message||''))x=await sb.rpc('create_support_case_v280',{p_creator_id:String(deviceId),p_creator_role:role,p_ride_id:rideId()?String(rideId()):'',p_category:category,p_subject:category,p_description:description,p_priority:priority});if(x.error)throw x.error;q('#srHelpModal')?.classList.remove('show');if(q('#srHelpDescription'))q('#srHelpDescription').value='';typeof toast==='function'&&toast(`Reporte #${x.data?.case_number||''} recibido por administración.`)}catch(err){typeof toast==='function'&&toast('No se pudo enviar el reporte: '+(err.message||err))}finally{b.disabled=false;b.textContent='Enviar a soporte'}};
  }

  function init(){updateBrand();document.body.classList.add('app-v290');splash();setTimeout(profile,450);setTimeout(replaceSupportSubmit,900);enableCommunication();setInterval(()=>{enableCommunication();replaceSupportSubmit()},2200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

/* Sobre Ruedas v2.6.0 — perfiles, fotos, vehículo y control de suspensiones */
(() => {
  const MEDIA_BUCKET='sobre-ruedas-media';
  const q=s=>document.querySelector(s);
  const qa=s=>[...document.querySelectorAll(s)];
  const roleLabel=APP_ROLE==='driver'?'conductor':'pasajero';

  function safeText(value){return String(value??'').trim()}
  function publicImage(url){return /^https?:\/\//i.test(safeText(url))?safeText(url):''}
  function formatDateTime(value){
    if(!value)return '';
    const d=new Date(value);
    if(Number.isNaN(d.getTime()))return '';
    return d.toLocaleString('es-US',{dateStyle:'medium',timeStyle:'short'});
  }
  function suspensionInfo(profile){
    const until=profile?.suspended_until?new Date(profile.suspended_until):null;
    const active=Boolean(until&&!Number.isNaN(until.getTime())&&until.getTime()>Date.now());
    return {active,until,reason:profile?.suspension_reason||'',by:profile?.suspended_by||''};
  }
  function initials(name){
    const parts=safeText(name).split(/\s+/).filter(Boolean).slice(0,2);
    return parts.map(p=>p[0]?.toUpperCase()).join('')||(APP_ROLE==='driver'?'C':'P');
  }
  function setAvatar(element,url,fallback){
    if(!element)return;
    const valid=publicImage(url);
    element.innerHTML=valid?`<img src="${valid.replace(/"/g,'&quot;')}" alt="Foto de perfil">`:`<span>${fallback||initials(user?.name)}</span>`;
  }
  function vehicleDescription(source={}){
    const type=source.vehicle_type||source.vehicle||'Vehículo';
    const details=[source.vehicle_make,source.vehicle_model,source.vehicle_year,source.vehicle_color].filter(Boolean).join(' ');
    const plate=source.vehicle_plate?` · ${source.vehicle_plate}`:'';
    return `${type}${details?' · '+details:''}${plate}`;
  }

  // Actualiza referencias visibles de versión y enlaces entre aplicaciones.
  document.title=(APP_ROLE==='driver'?'Sobre Ruedas Conductor':'Sobre Ruedas')+' v2.6.0';
  qa('.brand small').forEach(el=>el.textContent='CIEGO DE ÁVILA · v2.6.0');
  qa('p.muted').forEach(el=>{if(/Sobre Ruedas.*v2\.5\.1/.test(el.textContent))el.textContent=(APP_ROLE==='driver'?'Sobre Ruedas Conductor':'Sobre Ruedas')+' v2.6.0 · Ciego de Ávila'});
  const authCard=q('.auth-card');
  if(authCard&&!q('#separateAppLink')){
    const a=document.createElement('a');
    a.id='separateAppLink';
    a.href=APP_ROLE==='driver'?'./':'./conductor.html';
    a.textContent=APP_ROLE==='driver'?'¿Necesitas viajar? Abrir Sobre Ruedas':'¿Eres conductor? Abrir Sobre Ruedas Conductor';
    a.style.cssText='display:block;text-align:center;margin-top:13px;color:#59606b;font-size:12px;font-weight:800;text-decoration:none';
    authCard.appendChild(a);
  }

  // Banner central para sanciones administrativas.
  const sheetContent=q('#sheetContent');
  if(sheetContent&&!q('#accountRestriction')){
    const banner=document.createElement('div');
    banner.id='accountRestriction';
    banner.className='account-restriction';
    banner.innerHTML='<span class="restriction-icon">⏳</span><div><strong id="restrictionTitle">Cuenta suspendida</strong><small id="restrictionText"></small></div>';
    sheetContent.prepend(banner);
  }

  // Foto obligatoria en el registro de ambas aplicaciones.
  const regName=q('#regName');
  if(regName&&!q('#regProfilePhoto')){
    const box=document.createElement('div');
    box.className='registration-profile';
    box.innerHTML=`
      <h4>Foto de perfil</h4>
      <div class="profile-photo-row">
        <div class="profile-photo" id="regProfilePreview"><span>${APP_ROLE==='driver'?'C':'P'}</span></div>
        <div>
          <p>${APP_ROLE==='driver'?'El pasajero usará esta foto para reconocerte.':'El conductor usará esta foto para reconocerte en la recogida.'}</p>
          <label class="photo-label" for="regProfilePhoto">📷 Elegir foto</label>
          <input id="regProfilePhoto" type="file" accept="image/*" capture="user">
        </div>
      </div>`;
    regName.before(box);
  }

  // Información detallada del vehículo y fotos del conductor.
  const driverVehicle=q('#driverVehicle');
  if(driverVehicle&&!q('#driverVehicleDetails')){
    const details=document.createElement('div');
    details.id='driverVehicleDetails';
    details.className='vehicle-registration-grid';
    details.style.marginTop='8px';
    details.innerHTML=`
      <input id="driverVehicleMake" placeholder="Marca (ej. Mishozuki)">
      <input id="driverVehicleModel" placeholder="Modelo">
      <input id="driverVehicleYear" type="number" min="1950" max="2035" placeholder="Año">
      <input id="driverVehicleColor" placeholder="Color">
      <input id="driverVehiclePlate" class="full" placeholder="Matrícula o identificación">
      <select id="driverVehicleCapacity" class="full"><option value="">Capacidad de pasajeros</option><option value="1">1 pasajero</option><option value="2">2 pasajeros</option><option value="3">3 pasajeros</option><option value="4">4 pasajeros</option><option value="5">5 pasajeros</option><option value="6">6 pasajeros</option></select>
      <div class="upload-box full">
        <strong>Foto del vehículo</strong>
        <p class="muted" style="font-size:11px;margin:5px 0 9px;text-align:center">Debe verse completo, limpio y con la matrícula legible.</p>
        <label class="upload-label" for="driverVehiclePhoto">📷 Tomar o seleccionar foto</label>
        <input id="driverVehiclePhoto" type="file" accept="image/*" capture="environment">
        <div class="vehicle-photo" id="driverVehiclePreview">Sin foto del vehículo</div>
      </div>`;
    driverVehicle.after(details);
  }

  // Editor de perfil permanente dentro de Mi cuenta.
  const accountPanel=q('#accountPanel');
  if(accountPanel&&!q('#profileEditor')){
    const notice=q('#accountPanel .notice-card');
    const editor=document.createElement('section');
    editor.id='profileEditor';
    editor.className='profile-editor';
    editor.innerHTML=`
      <div class="profile-editor-head">
        <div class="profile-photo" id="profilePhotoPreview"><span>${APP_ROLE==='driver'?'C':'P'}</span></div>
        <div class="profile-photo-actions">
          <strong>Foto e información</strong>
          <small>${APP_ROLE==='driver'?'Datos que verá el pasajero al aceptar el viaje.':'Datos que verá el conductor durante la recogida.'}</small>
          <label class="photo-label" for="profilePhotoInput">Cambiar foto</label>
          <input id="profilePhotoInput" type="file" accept="image/*" capture="user">
        </div>
      </div>
      <div class="profile-grid">
        <label class="full">Nombre completo<input id="profileFullName" autocomplete="name"></label>
        <label>Teléfono<input id="profilePhone" type="tel" autocomplete="tel"></label>
        <label>Correo<input id="profileEmail" type="email" autocomplete="email"></label>
        <div id="driverProfileFields" class="full ${APP_ROLE==='driver'?'':'hidden'}">
          <div class="profile-grid">
            <label>Tipo<select id="profileVehicleType"><option>Motorina</option><option>Moto</option><option>Triciclo</option><option>Bicitaxi</option></select></label>
            <label>Marca<input id="profileVehicleMake"></label>
            <label>Modelo<input id="profileVehicleModel"></label>
            <label>Año<input id="profileVehicleYear" type="number" min="1950" max="2035"></label>
            <label>Color<input id="profileVehicleColor"></label>
            <label>Matrícula<input id="profileVehiclePlate"></label>
            <label>Capacidad<input id="profileVehicleCapacity" type="number" min="1" max="12"></label>
            <label class="full">Foto del vehículo
              <span class="photo-label" style="margin-top:3px" onclick="document.getElementById('profileVehiclePhotoInput').click()">Cambiar foto del vehículo</span>
              <input id="profileVehiclePhotoInput" type="file" accept="image/*" capture="environment">
              <span class="vehicle-photo" id="profileVehiclePhotoPreview">Sin foto del vehículo</span>
            </label>
            <label class="full">Identificación
              <span class="photo-label" style="margin-top:3px" onclick="document.getElementById('profileDocumentInput').click()">Actualizar identificación</span>
              <input id="profileDocumentInput" type="file" accept="image/*" capture="environment">
            </label>
          </div>
        </div>
      </div>
      <button class="profile-save" id="saveProfileBtn">Guardar cambios del perfil</button>`;
    (notice||accountPanel.lastElementChild).before(editor);
  }

  // Identificadores necesarios para actualizar imágenes durante un viaje.
  const drawerAvatar=q('.drawer-user .avatar');if(drawerAvatar)drawerAvatar.id='drawerAvatar';
  const driverPassengerCard=q('.driver-passenger-card');
  if(driverPassengerCard){
    const av=driverPassengerCard.querySelector('.avatar');if(av)av.id='driverPassengerAvatar';
    const strong=driverPassengerCard.querySelector('strong');if(strong)strong.id='driverPassengerName';
    const small=driverPassengerCard.querySelector('small');if(small)small.id='driverPassengerMeta';
  }

  async function previewFile(input,container){
    const file=input?.files?.[0];if(!file)return;
    const url=URL.createObjectURL(file);
    container.innerHTML=`<img src="${url}" alt="Vista previa">`;
  }
  q('#regProfilePhoto')?.addEventListener('change',e=>previewFile(e.currentTarget,q('#regProfilePreview')));
  q('#driverVehiclePhoto')?.addEventListener('change',e=>previewFile(e.currentTarget,q('#driverVehiclePreview')));
  q('#profilePhotoInput')?.addEventListener('change',e=>previewFile(e.currentTarget,q('#profilePhotoPreview')));
  q('#profileVehiclePhotoInput')?.addEventListener('change',e=>previewFile(e.currentTarget,q('#profileVehiclePhotoPreview')));

  async function compressedImage(file,maxSide=1280,quality=.8){
    if(!file||!file.type?.startsWith('image/'))return file;
    try{
      const bitmap=await createImageBitmap(file);
      const ratio=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
      const width=Math.max(1,Math.round(bitmap.width*ratio));
      const height=Math.max(1,Math.round(bitmap.height*ratio));
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,width,height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
      bitmap.close?.();
      if(!blob)return file;
      return new File([blob],(file.name||'foto').replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'});
    }catch(error){console.warn('No se pudo comprimir la imagen:',error);return file}
  }
  async function uploadMedia(file,kind){
    if(!file)return null;
    const ready=await compressedImage(file,kind==='document'?1600:1280,kind==='document' ? .84 : .8);
    const ext=(ready.name?.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase()||'jpg';
    const cleanId=String(deviceId).replace(/[^a-zA-Z0-9_-]/g,'_');
    const path=`${APP_ROLE}/${cleanId}/${kind}-${Date.now()}.${ext}`;
    const {error}=await sb.storage.from(MEDIA_BUCKET).upload(path,ready,{upsert:true,contentType:ready.type||'image/jpeg',cacheControl:'3600'});
    if(error)throw new Error(error.message||'No se pudo subir la foto');
    const {data}=sb.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    return data?.publicUrl||null;
  }

  function applyProfileToUser(profile){
    if(!profile||!user)return;
    Object.assign(user,{
      name:profile.full_name||user.name,
      email:profile.email||user.email,
      phone:profile.phone||user.phone,
      photo:profile.photo_url||user.photo,
      documentUrl:profile.document_url||user.documentUrl,
      vehicle:profile.vehicle_type||user.vehicle,
      vehicleMake:profile.vehicle_make||user.vehicleMake,
      vehicleModel:profile.vehicle_model||user.vehicleModel,
      vehicleYear:profile.vehicle_year||user.vehicleYear,
      vehicleColor:profile.vehicle_color||user.vehicleColor,
      vehiclePlate:profile.vehicle_plate||user.vehiclePlate,
      vehicleCapacity:profile.vehicle_capacity||user.vehicleCapacity,
      vehiclePhoto:profile.vehicle_photo_url||user.vehiclePhoto
    });
    localStorage.setItem(AUTH,JSON.stringify(user));
  }

  function renderRestriction(profile=currentProfile){
    const banner=q('#accountRestriction');if(!banner)return;
    const state=suspensionInfo(profile);
    const deleted=profile&&(profile.approval_status==='deleted'||profile.status==='deleted');
    banner.classList.toggle('show',state.active||deleted);
    banner.classList.toggle('danger',deleted);
    if(deleted){q('#restrictionTitle').textContent='Cuenta eliminada';q('#restrictionText').textContent='Esta cuenta fue retirada de Sobre Ruedas por administración.';return}
    if(state.active){
      q('#restrictionTitle').textContent='Cuenta suspendida temporalmente';
      q('#restrictionText').textContent=`No puedes ${APP_ROLE==='driver'?'conectarte ni aceptar viajes':'solicitar viajes'} hasta ${formatDateTime(state.until)}.${state.reason?' Motivo: '+state.reason:''}`;
    }
  }

  function renderProfile(profile=currentProfile){
    if(!profile)return;
    applyProfileToUser(profile);
    const photo=profile.photo_url||user?.photo;
    setAvatar(q('#accountAvatar'),photo,initials(profile.full_name));
    setAvatar(q('#drawerAvatar'),photo,initials(profile.full_name));
    setAvatar(q('#profilePhotoPreview'),photo,initials(profile.full_name));
    q('#accountName').textContent=profile.full_name||user?.name||'Usuario';
    q('#accountEmail').textContent=profile.email||profile.phone||'Cuenta verificada';
    q('#profileFullName').value=profile.full_name||user?.name||'';
    q('#profilePhone').value=profile.phone||user?.phone||'';
    q('#profileEmail').value=profile.email||user?.email||'';
    if(APP_ROLE==='driver'){
      q('#profileVehicleType').value=profile.vehicle_type||'Motorina';
      q('#profileVehicleMake').value=profile.vehicle_make||'';
      q('#profileVehicleModel').value=profile.vehicle_model||'';
      q('#profileVehicleYear').value=profile.vehicle_year||'';
      q('#profileVehicleColor').value=profile.vehicle_color||'';
      q('#profileVehiclePlate').value=profile.vehicle_plate||'';
      q('#profileVehicleCapacity').value=profile.vehicle_capacity||'';
      const vehiclePhoto=profile.vehicle_photo_url||user?.vehiclePhoto;
      q('#profileVehiclePhotoPreview').innerHTML=publicImage(vehiclePhoto)?`<img src="${vehiclePhoto}" alt="Foto del vehículo">`:'Sin foto del vehículo';
      q('#roleStatus').textContent=suspensionInfo(profile).active?'Conductor suspendido temporalmente.':profile.approval_status==='approved'?'Conductor aprobado y listo para operar.':'Perfil pendiente de aprobación administrativa.';
    }else q('#roleStatus').textContent=suspensionInfo(profile).active?'Pasajero suspendido temporalmente.':'Cuenta de pasajero activa.';
    renderRestriction(profile);
  }

  // Amplía las funciones base sin romper instalaciones anteriores.
  const originalFetchCurrentProfile=fetchCurrentProfile;
  fetchCurrentProfile=async function(){
    const profile=await originalFetchCurrentProfile();
    if(profile){
      const state=suspensionInfo(profile);
      if(!state.active&&profile.suspended_until){
        sb.from('profiles').update({suspended_until:null,suspension_reason:null,suspended_at:null,suspended_by:null,updated_at:new Date().toISOString()}).eq('id',profile.id).then(()=>{});
        profile.suspended_until=null;profile.suspension_reason=null;
      }
      currentProfile=profile;renderProfile(profile);
    }
    return profile;
  };

  const originalSaveProfileForUser=saveProfileForUser;
  saveProfileForUser=async function(sessionUser,approvalOverride){
    const profile=await originalSaveProfileForUser(sessionUser,approvalOverride);if(!profile)return null;
    const source=sessionUser||{};const changes={};
    const map={photo_url:'photo',document_url:'documentUrl',vehicle_make:'vehicleMake',vehicle_model:'vehicleModel',vehicle_year:'vehicleYear',vehicle_color:'vehicleColor',vehicle_plate:'vehiclePlate',vehicle_capacity:'vehicleCapacity',vehicle_photo_url:'vehiclePhoto'};
    Object.entries(map).forEach(([column,key])=>{if(source[key]!==undefined&&source[key]!==null&&source[key]!=='')changes[column]=source[key]});
    if(Object.keys(changes).length){
      changes.updated_at=new Date().toISOString();
      const {data,error}=await sb.from('profiles').update(changes).eq('id',profile.id).select().single();
      if(error){backendError(error,'No se pudieron guardar las fotos y datos del vehículo');return profile}
      currentProfile=data;renderProfile(data);return data;
    }
    renderProfile(profile);return profile;
  };

  const originalSyncProfileUi=syncProfileUi;
  syncProfileUi=async function(){await originalSyncProfileUi();if(currentProfile)renderProfile(currentProfile)};

  const originalOpenApp=openApp;
  openApp=function(){originalOpenApp();setTimeout(()=>{if(currentProfile)renderProfile(currentProfile);else fetchCurrentProfile()},100)};

  async function canOperate(show=true){
    const profile=await fetchCurrentProfile();
    if(!profile)return true;
    const state=suspensionInfo(profile);
    if(state.active){if(show)toast(`Cuenta suspendida hasta ${formatDateTime(state.until)}`);renderRestriction(profile);return false}
    if(profile.approval_status==='deleted'||profile.status==='deleted'){if(show)toast('Esta cuenta fue eliminada por administración');return false}
    return true;
  }
  const originalDriverCanOperate=driverCanOperate;
  driverCanOperate=async function(showMessage=true){if(!(await canOperate(showMessage)))return false;return originalDriverCanOperate(showMessage)};

  // Registro profesional con foto personal y, para el conductor, vehículo completo.
  q('#registerBtn').onclick=async()=>{
    const name=safeText(q('#regName').value),email=safeText(q('#regEmail').value),phone=safeText(q('#regPhone').value),pass=q('#regPass').value;
    const profilePhoto=q('#regProfilePhoto').files?.[0];
    if(!name||!email||!phone||pass.length<4)return toast('Completa correctamente nombre, correo, teléfono y contraseña');
    if(!profilePhoto)return toast('Selecciona una foto clara de perfil');
    const data={name,email,phone,role:APP_ROLE,approved:APP_ROLE!=='driver'};
    let vehiclePhoto=null,documentFile=null;
    if(APP_ROLE==='driver'){
      const vehicle=safeText(q('#driverVehicle').value),make=safeText(q('#driverVehicleMake').value),model=safeText(q('#driverVehicleModel').value),year=Number(q('#driverVehicleYear').value)||null,color=safeText(q('#driverVehicleColor').value),plate=safeText(q('#driverVehiclePlate').value),capacity=Number(q('#driverVehicleCapacity').value)||null;
      vehiclePhoto=q('#driverVehiclePhoto').files?.[0];documentFile=q('#driverDocument').files?.[0];
      if(!vehicle||!make||!model||!color||!plate||!capacity)return toast('Completa tipo, marca, modelo, color, matrícula y capacidad del vehículo');
      if(!vehiclePhoto)return toast('Sube una foto clara del vehículo');
      if(!documentFile)return toast('Sube una foto de tu identificación');
      if(!q('#driverTerms').checked)return toast('Confirma que la información es correcta');
      Object.assign(data,{vehicle,vehicleMake:make,vehicleModel:model,vehicleYear:year,vehicleColor:color,vehiclePlate:plate,vehicleCapacity:capacity,approved:false,verificationStatus:'pending'});
    }
    const button=q('#registerBtn');button.disabled=true;button.textContent='Creando perfil profesional…';
    try{
      data.photo=await uploadMedia(profilePhoto,'profile');
      if(APP_ROLE==='driver'){
        data.vehiclePhoto=await uploadMedia(vehiclePhoto,'vehicle');
        data.documentUrl=await uploadMedia(documentFile,'document');
        setNotice('Tu perfil, identificación y vehículo fueron enviados para aprobación.');
      }
      const profile=await saveProfileForUser(data,APP_ROLE==='driver'?'pending':'approved');if(!profile)return;
      await saveSession(data);
      toast(APP_ROLE==='driver'?'Perfil enviado. Espera la aprobación del administrador':'Cuenta creada correctamente');
    }catch(error){console.error(error);toast('No se pudo subir la foto. Ejecuta el SQL v2.6.0 y vuelve a intentar')}
    finally{button.disabled=false;button.textContent=APP_ROLE==='driver'?'Crear cuenta de conductor':'Crear cuenta de pasajero'}
  };

  q('#saveProfileBtn').onclick=async()=>{
    const profile=currentProfile||await fetchCurrentProfile();if(!profile)return toast('No se encontró el perfil');
    const button=q('#saveProfileBtn');button.disabled=true;button.textContent='Guardando…';
    try{
      const changes={
        full_name:safeText(q('#profileFullName').value)||profile.full_name,
        phone:safeText(q('#profilePhone').value)||null,
        email:safeText(q('#profileEmail').value)||null,
        updated_at:new Date().toISOString()
      };
      const profileFile=q('#profilePhotoInput').files?.[0];if(profileFile)changes.photo_url=await uploadMedia(profileFile,'profile');
      if(APP_ROLE==='driver'){
        Object.assign(changes,{vehicle_type:safeText(q('#profileVehicleType').value),vehicle_make:safeText(q('#profileVehicleMake').value)||null,vehicle_model:safeText(q('#profileVehicleModel').value)||null,vehicle_year:Number(q('#profileVehicleYear').value)||null,vehicle_color:safeText(q('#profileVehicleColor').value)||null,vehicle_plate:safeText(q('#profileVehiclePlate').value)||null,vehicle_capacity:Number(q('#profileVehicleCapacity').value)||null});
        const vehicleFile=q('#profileVehiclePhotoInput').files?.[0];if(vehicleFile)changes.vehicle_photo_url=await uploadMedia(vehicleFile,'vehicle');
        const documentFile=q('#profileDocumentInput').files?.[0];if(documentFile)changes.document_url=await uploadMedia(documentFile,'document');
      }
      const {data,error}=await sb.from('profiles').update(changes).eq('id',profile.id).select().single();
      if(error)throw error;
      currentProfile=data;renderProfile(data);toast('Perfil actualizado correctamente');
    }catch(error){console.error(error);toast('No se pudo guardar el perfil. Revisa el SQL v2.6.0')}
    finally{button.disabled=false;button.textContent='Guardar cambios del perfil'}
  };

  // El pasajero no puede solicitar durante una suspensión y la solicitud conserva su foto.
  const requestButton=q('#requestBtn');
  if(requestButton){
    const originalRequest=requestButton.onclick;
    requestButton.onclick=async function(){
      if(!(await canOperate(true)))return;
      await originalRequest.call(this);
      if(currentRideId){
        await sb.from('rides').update({passenger_photo:currentProfile?.photo_url||user?.photo||null,client_version:'2.6.0',updated_at:new Date().toISOString()}).eq('id',currentRideId);
      }
    };
  }

  // La aceptación conserva foto y ficha completa del vehículo.
  const acceptButton=q('#acceptBtn');
  if(acceptButton){
    const originalAccept=acceptButton.onclick;
    acceptButton.onclick=async function(){
      if(!(await driverCanOperate(true)))return;
      await originalAccept.call(this);
      if(currentRideId){
        const p=currentProfile||await fetchCurrentProfile();
        await sb.from('rides').update({
          driver_photo:p?.photo_url||user?.photo||null,
          driver_vehicle_make:p?.vehicle_make||null,
          driver_vehicle_model:p?.vehicle_model||null,
          driver_vehicle_year:p?.vehicle_year||null,
          driver_vehicle_color:p?.vehicle_color||null,
          driver_vehicle_plate:p?.vehicle_plate||null,
          driver_vehicle_photo:p?.vehicle_photo_url||null,
          driver_version:'2.6.0',updated_at:new Date().toISOString()
        }).eq('id',currentRideId);
      }
    };
  }

  // Presentación profesional de ambos participantes durante el viaje.
  const originalShowIncomingRide=showIncomingRide;
  showIncomingRide=function(ride){
    originalShowIncomingRide(ride);
    setAvatar(q('#driverPassengerAvatar'),ride?.passenger_photo,'P');
    if(q('#driverPassengerName'))q('#driverPassengerName').textContent=ride?.passenger_name||'Pasajero';
    if(q('#driverPassengerMeta'))q('#driverPassengerMeta').textContent=`${ride?.payment_method||'Efectivo'} · código ${ride?.trip_code||'—'}`;
  };
  const originalApplyPassengerRide=applyPassengerRide;
  applyPassengerRide=function(ride){
    originalApplyPassengerRide(ride);
    if(!ride)return;
    setAvatar(q('#passengerDriverAvatar'),ride.driver_photo,'C');
    const card=q('#tripPanel .driver-card');
    const name=card?.querySelector('strong');const meta=card?.querySelector('small');
    if(name)name.textContent=ride.driver_name||'Conductor asignado';
    if(meta)meta.textContent=vehicleDescription({vehicle_type:ride.vehicle_type,vehicle_make:ride.driver_vehicle_make,vehicle_model:ride.driver_vehicle_model,vehicle_year:ride.driver_vehicle_year,vehicle_color:ride.driver_vehicle_color,vehicle_plate:ride.driver_vehicle_plate});
  };

  // Desconecta inmediatamente al conductor si administración lo suspende.
  const originalSetDriverPresence=setDriverPresence;
  setDriverPresence=async function(online,coords=null){
    if(online&&!(await canOperate(false))){driverOnline=false;q('#onlineToggle')?.classList.remove('on');if(q('#onlineText'))q('#onlineText').textContent='Suspendido';return}
    return originalSetDriverPresence(online,coords);
  };

  // Primer render de perfiles ya existentes.
  setTimeout(async()=>{if(user){const p=await fetchCurrentProfile();if(p)renderProfile(p)}},250);
  if('serviceWorker' in navigator){navigator.serviceWorker.getRegistration?.().then(r=>r?.update()).catch(()=>{})}
})();

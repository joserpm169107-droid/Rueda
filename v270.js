/* Sobre Ruedas v2.8.0 — perfiles, fotos, vehículo y control de suspensiones */
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
  document.title=(APP_ROLE==='driver'?'Sobre Ruedas Conductor':'Sobre Ruedas')+' v2.8.0';
  qa('.brand small').forEach(el=>el.textContent='CIEGO DE ÁVILA · v2.8.0');
  qa('p.muted').forEach(el=>{if(/Sobre Ruedas.*v2\.5\.1/.test(el.textContent))el.textContent=(APP_ROLE==='driver'?'Sobre Ruedas Conductor':'Sobre Ruedas')+' v2.8.0 · Ciego de Ávila'});
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

  function uploadProgress(show,label='Preparando foto…',percent=0){
    let box=q('#mediaUploadProgress');
    if(!box){
      box=document.createElement('div');box.id='mediaUploadProgress';box.className='media-upload-progress';
      box.innerHTML='<div class="media-upload-card"><strong id="mediaUploadLabel">Preparando foto…</strong><div class="media-progress-track"><span id="mediaProgressBar"></span></div><small id="mediaUploadHint">Optimizando para consumir menos datos</small></div>';
      document.body.appendChild(box);
    }
    box.classList.toggle('show',Boolean(show));
    if(q('#mediaUploadLabel'))q('#mediaUploadLabel').textContent=label;
    if(q('#mediaProgressBar'))q('#mediaProgressBar').style.width=Math.max(0,Math.min(100,percent))+'%';
  }
  async function canvasBlob(canvas,type,quality){
    return new Promise(resolve=>canvas.toBlob(resolve,type,quality));
  }
  async function decodeImageFile(file){
    if('createImageBitmap' in window){
      try{
        const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
        return {source:bitmap,width:bitmap.width,height:bitmap.height,cleanup:()=>bitmap.close?.()};
      }catch(error){console.warn('createImageBitmap no disponible para esta foto',error)}
    }
    const url=URL.createObjectURL(file);
    try{
      const image=new Image();image.decoding='async';
      await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('El formato de la foto no es compatible'));image.src=url});
      return {source:image,width:image.naturalWidth,height:image.naturalHeight,cleanup:()=>URL.revokeObjectURL(url)};
    }catch(error){URL.revokeObjectURL(url);throw error}
  }
  async function compressedImage(file,kind='vehicle'){
    if(!file||!file.type?.startsWith('image/'))throw new Error('Selecciona un archivo de imagen válido');
    const config=kind==='profile'
      ?{maxW:512,maxH:512,target:200*1024,startQuality:.78,minQuality:.46,square:true}
      :kind==='vehicle'
        ?{maxW:1280,maxH:960,target:500*1024,startQuality:.8,minQuality:.48,square:false}
        :{maxW:1600,maxH:1600,target:900*1024,startQuality:.82,minQuality:.52,square:false};
    let decoded=null;
    try{
      uploadProgress(true,'Optimizando imagen…',18);
      decoded=await decodeImageFile(file);
      const source=decoded.source;
      let sourceX=0,sourceY=0,sourceW=decoded.width,sourceH=decoded.height;
      let width,height;
      if(config.square){
        const side=Math.min(sourceW,sourceH);sourceX=Math.max(0,(sourceW-side)/2);sourceY=Math.max(0,(sourceH-side)/2);sourceW=sourceH=side;
        width=height=Math.min(config.maxW,side);
      }else{
        const ratio=Math.min(1,config.maxW/sourceW,config.maxH/sourceH);
        width=Math.max(1,Math.round(sourceW*ratio));height=Math.max(1,Math.round(sourceH*ratio));
      }
      let canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(width));canvas.height=Math.max(1,Math.round(height));
      let ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('El teléfono no pudo preparar la imagen');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,sourceX,sourceY,sourceW,sourceH,0,0,canvas.width,canvas.height);
      decoded.cleanup?.();decoded=null;
      let quality=config.startQuality,type='image/webp',blob=await canvasBlob(canvas,type,quality);
      if(!blob){type='image/jpeg';blob=await canvasBlob(canvas,type,quality)}
      let pass=0;
      while(blob&&blob.size>config.target&&pass<8){
        pass++;quality=Math.max(config.minQuality,quality-.07);
        if(quality<=config.minQuality+.01&&blob.size>config.target&&canvas.width>320){
          const ratio=.86,newW=Math.max(config.square?320:280,Math.round(canvas.width*ratio)),newH=config.square?newW:Math.max(210,Math.round(canvas.height*ratio));
          const smaller=document.createElement('canvas');smaller.width=newW;smaller.height=newH;
          const smallerCtx=smaller.getContext('2d',{alpha:false});smallerCtx.fillStyle='#fff';smallerCtx.fillRect(0,0,newW,newH);smallerCtx.drawImage(canvas,0,0,newW,newH);canvas=smaller;
        }
        blob=await canvasBlob(canvas,type,quality);uploadProgress(true,'Reduciendo peso de la imagen…',22+pass*7);
      }
      if(!blob)throw new Error('No se pudo procesar la imagen');
      const ext=type==='image/webp'?'webp':'jpg';
      const base=(file.name||'foto').replace(/\.[^.]+$/,'').replace(/[^a-z0-9_-]+/gi,'-').slice(0,60)||'foto';
      return new File([blob],`${base}.${ext}`,{type,lastModified:Date.now()});
    }catch(error){
      decoded?.cleanup?.();uploadProgress(false);console.warn('No se pudo comprimir la imagen:',error);
      throw new Error(error?.message||'El teléfono no pudo optimizar esta foto. Prueba con otra imagen.');
    }
  }
  async function uploadMedia(file,kind){
    if(!file)return null;
    const ready=await compressedImage(file,kind);
    uploadProgress(true,`Subiendo ${kind==='profile'?'foto de perfil':kind==='vehicle'?'foto del vehículo':'documento'}…`,78);
    const ext=(ready.name?.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase()||'jpg';
    const cleanId=String(deviceId).replace(/[^a-zA-Z0-9_-]/g,'_');
    const path=`${APP_ROLE}/${cleanId}/${kind}-${Date.now()}.${ext}`;
    const {error}=await sb.storage.from(MEDIA_BUCKET).upload(path,ready,{upsert:true,contentType:ready.type||'image/jpeg',cacheControl:'86400'});
    if(error){uploadProgress(false);throw new Error(error.message||'No se pudo subir la foto')}
    const {data}=sb.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    uploadProgress(true,'Foto lista',100);setTimeout(()=>uploadProgress(false),450);
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
  syncProfileUi=async function(){
    await originalSyncProfileUi();if(currentProfile)renderProfile(currentProfile);
    const state=suspensionInfo(currentProfile);
    if(APP_ROLE==='driver'&&state.active){
      driverOnline=false;stopPresenceHeartbeat?.();stopDriverChannel?.();clearInterval(driverTimer);incomingRide=null;
      q('#onlineToggle')?.classList.remove('on');if(q('#onlineText'))q('#onlineText').textContent='Suspendido';
      q('#driverRequest')?.classList.add('hidden');q('#driverSummary')?.classList.remove('hidden');
      toast(`Conductor suspendido hasta ${formatDateTime(state.until)}`);
    }
  };

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
    }catch(error){console.error(error);toast('No se pudo subir la foto. Ejecuta el SQL v2.8.0 y vuelve a intentar')}
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
    }catch(error){console.error(error);toast('No se pudo guardar el perfil. Revisa el SQL v2.8.0')}
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
        await sb.from('rides').update({passenger_photo:currentProfile?.photo_url||user?.photo||null,client_version:'2.7.0',updated_at:new Date().toISOString()}).eq('id',currentRideId);
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
          driver_version:'2.7.0',updated_at:new Date().toISOString()
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

/* Sobre Ruedas v2.8.0 — buscador reforzado, chat, ayuda y llamada privada por internet */
(() => {
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  const ROLE=APP_ROLE;
  const QUICK_MESSAGES=ROLE==='driver'
    ?['Estoy en camino','Ya llegué','No encuentro el lugar','Espérame unos minutos']
    :['Ya estoy saliendo','Estoy en el punto de recogida','No encuentro el vehículo','Espérame unos minutos'];
  const HELP_CATEGORIES=ROLE==='driver'
    ?[
      ['📍','No encuentro al pasajero'],['🙋','El pasajero no aparece'],['🗺️','Recogida o destino incorrecto'],['💵','Problema con precio o pago'],
      ['▶️','No puedo iniciar el viaje'],['⏹️','No puedo finalizar el viaje'],['🧭','Problema con navegación'],['🛠️','Accidente o avería'],
      ['🛡️','Situación insegura'],['📦','Objeto olvidado'],['✕','Cancelación justificada'],['⋯','Otro problema']
    ]
    :[
      ['🛵','No encuentro al conductor'],['⏳','El conductor no llega'],['🗺️','Recogida o destino incorrecto'],['💵','Problema con precio o pago'],
      ['✕','Problema al cancelar'],['🧭','Problema con el mapa'],['🛡️','Situación insegura'],['📦','Objeto olvidado'],
      ['⭐','Problema con calificación'],['⋯','Otro problema']
    ];
  let activeRide=null;
  let chatChannel=null;
  let callChannel=null;
  let callChannelReady=null;
  let unreadMessages=0;
  let selectedHelpCategory=HELP_CATEGORIES[0][1];
  let selectedHelpPriority='normal';
  let peer=null;
  let localStream=null;
  let remoteAudio=null;
  let incomingOffer=null;
  let incomingCaller=null;
  let pendingIce=[];
  let callMuted=false;
  let selectedSupportCase=null;
  let supportThreadChannel=null;

  function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function timeLabel(value){const d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleTimeString('es-US',{hour:'numeric',minute:'2-digit'})}
  function statusLabel(value){return ({open:'Abierto',in_review:'En revisión',resolved:'Resuelto',closed:'Cerrado'})[value]||value||'Abierto'}
  function ownName(){return user?.name||currentProfile?.full_name||(ROLE==='driver'?'Conductor':'Pasajero')}
  function activeRideOpen(){return activeRide&&['searching','accepted','arrived','in_progress'].includes(activeRide.status)}
  function otherParticipant(){
    if(!activeRide)return {id:null,name:ROLE==='driver'?'Pasajero':'Conductor'};
    return ROLE==='driver'
      ?{id:activeRide.passenger_id,name:activeRide.passenger_name||'Pasajero'}
      :{id:activeRide.driver_id,name:activeRide.driver_name||'Conductor'};
  }

  // ---------- Buscador de direcciones reforzado ----------
  const localPlaces=[
    {label:'Parque José Martí',detail:'Centro de Ciego de Ávila',point:[21.842038,-78.759973]},
    {label:'Hospital Provincial Antonio Luaces Iraola',detail:'Ciego de Ávila',point:[21.8485,-78.7618]},
    {label:'Terminal de Ómnibus de Ciego de Ávila',detail:'Ciego de Ávila',point:[21.8384,-78.7707]},
    {label:'Universidad de Ciego de Ávila Máximo Gómez Báez',detail:'Carretera a Morón',point:[21.8754,-78.6949]},
    {label:'Zoológico de Ciego de Ávila',detail:'Ciego de Ávila',point:[21.8467,-78.7507]},
    {label:'Estadio José Ramón Cepero',detail:'Ciego de Ávila',point:[21.8462,-78.7662]}
  ];
  const normalize=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9ñ ]/g,' ').replace(/\s+/g,' ').trim();
  const inProvince=p=>Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1])&&+p[0]>=20.75&&+p[0]<=22.65&&+p[1]>=-79.65&&+p[1]<=-77.75;
  const candidateDistance=p=>{try{return haversineKm(currentStart,p)}catch{return 999}};
  const candidateKeyV270=c=>`${Number(c.point[0]).toFixed(5)},${Number(c.point[1]).toFixed(5)}`;
  async function fetchAddressJSON(url,timeout=14000){
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeout);
    try{const response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});if(!response.ok)throw new Error('HTTP '+response.status);return await response.json()}finally{clearTimeout(timer)}
  }
  function localResults(text){const n=normalize(text);return localPlaces.filter(p=>normalize(p.label+' '+p.detail).includes(n)).map(p=>({...p,source:'Guía local',icon:'★',distance:candidateDistance(p.point)}))}
  async function photonV270(text){
    const queries=[text,/ciego de [áa]vila|cuba/i.test(text)?text:`${text}, Ciego de Ávila, Cuba`];
    const jobs=queries.map(q=>{const p=new URLSearchParams({q,limit:'10',lang:'es',lat:String(currentStart[0]),lon:String(currentStart[1])});return fetchAddressJSON('https://photon.komoot.io/api/?'+p)});
    const settled=await Promise.allSettled(jobs);const out=[];
    settled.forEach(result=>{if(result.status!=='fulfilled')return;(result.value.features||[]).forEach(f=>{const prop=f.properties||{},co=f.geometry?.coordinates||[];const point=[Number(co[1]),Number(co[0])];if(!inProvince(point))return;out.push({point,label:prop.name||prop.street||text,detail:[prop.housenumber,prop.street,prop.district,prop.city||prop.county,prop.state].filter(Boolean).join(', ')||'Ciego de Ávila',source:'OpenStreetMap',icon:'⌖',distance:candidateDistance(point)})})});
    return out;
  }
  async function nominatimV270(text){
    const q=/ciego de [áa]vila|cuba/i.test(text)?text:`${text}, Ciego de Ávila, Cuba`;
    const p=new URLSearchParams({q,format:'jsonv2',limit:'10',countrycodes:'cu',addressdetails:'1','accept-language':'es'});
    const data=await fetchAddressJSON('https://nominatim.openstreetmap.org/search?'+p,16000);
    return (data||[]).map(r=>{const point=[Number(r.lat),Number(r.lon)];return {point,label:r.name||String(r.display_name||text).split(',')[0],detail:r.display_name||q,source:'OpenStreetMap',icon:'⌖',distance:candidateDistance(point)}}).filter(c=>inProvince(c.point));
  }
  function mergeCandidates(items){
    const seen=new Set(),out=[];
    items.flat().forEach(c=>{if(!c?.point||!inProvince(c.point))return;const key=candidateKeyV270(c);if(seen.has(key))return;seen.add(key);out.push(c)});
    return out.sort((a,b)=>(a.distance??999)-(b.distance??999)).slice(0,12);
  }
  function renderSearchV270(items,{loading=false,error=false}={}){
    const box=$('#addressSuggestions');if(!box)return;box.classList.remove('hidden');box.innerHTML='';
    if(loading){box.innerHTML='<div class="address-loading">Buscando calles y lugares…</div>';return}
    items.forEach(c=>{
      const b=document.createElement('button');b.type='button';b.className='address-suggestion';
      b.innerHTML=`<span class="place-icon">${escapeHtml(c.icon||'⌖')}</span><span><strong>${escapeHtml(c.label)}</strong><small>${escapeHtml(c.detail||'Ciego de Ávila')}</small><span class="address-source">${escapeHtml(c.source||'Mapa')} ${Number.isFinite(c.distance)?'· '+c.distance.toFixed(1)+' km':''}</span></span><span class="distance-hint">›</span>`;
      b.onclick=async()=>{
        destinationPoint=c.point;pendingDestination=null;$('#destination').value=c.label;setDestinationPoint(c.point,c.label);box.classList.add('hidden');map.setView(c.point,17);setRouteStatus('Dirección seleccionada',c.detail||c.label,'ok');
        const ok=await prepareRealRoute(true);if(ok)toast('Dirección encontrada y ruta calculada');
      };box.appendChild(b);
    });
    const manual=document.createElement('button');manual.type='button';manual.className='address-suggestion manual-result';manual.innerHTML='<span class="place-icon">📍</span><span><strong>Marcar esta dirección en el mapa</strong><small>Conserva el texto escrito y coloca el pin exactamente.</small></span><span class="distance-hint">›</span>';manual.onclick=()=>{box.classList.add('hidden');startPinMode('destination')};box.appendChild(manual);
    if(error&&!items.length){const msg=document.createElement('div');msg.className='address-empty';msg.innerHTML='<strong>No hubo respuesta del buscador.</strong><br>La conexión puede estar lenta. Puedes marcar el punto en el mapa.';box.prepend(msg)}
  }
  async function searchV270(text,{explicit=false,autoSelect=false}={}){
    const clean=String(text||'').trim();if(clean.length<3){hideAddressSuggestions();return []}
    renderSearchV270([],{loading:true});
    const jobs=[Promise.resolve(localResults(clean)),photonV270(clean)];if(explicit)jobs.push(nominatimV270(clean));
    const settled=await Promise.allSettled(jobs);const items=mergeCandidates(settled.filter(x=>x.status==='fulfilled').map(x=>x.value));
    const failed=settled.every(x=>x.status==='rejected');addressCandidates=items;renderSearchV270(items,{error:failed});
    if(autoSelect&&items.length===1){const first=$('#addressSuggestions .address-suggestion');first?.click()}
    return items;
  }
  try{
    searchAddressCandidates=async function(text){return searchV270(text,{explicit:false})};
    runAddressSearch=async function({autoSelect=false}={}){return searchV270($('#destination').value,{explicit:true,autoSelect})};
    geocodeCubanAddress=async function(text){const items=await searchV270(text,{explicit:true});return items[0]?{point:items[0].point,label:items[0].label,source:items[0].source,confidence:'medium'}:null};
    const oldInput=$('#destination');
    if(oldInput){
      const input=oldInput.cloneNode(true);oldInput.replaceWith(input);
      let timer=null;
      input.addEventListener('input',()=>{destinationPoint=null;pendingDestination=null;clearRoute();clearRouteStatus();clearTimeout(timer);const text=input.value.trim();if(text.length<3)return hideAddressSuggestions();timer=setTimeout(()=>searchV270(text,{explicit:false}),450)});
      input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchV270(input.value,{explicit:true,autoSelect:true})}});
      input.addEventListener('focus',()=>{if(addressCandidates?.length)renderSearchV270(addressCandidates)});
    }
    const oldSearch=$('#searchAddressBtn');if(oldSearch){const button=oldSearch.cloneNode(true);oldSearch.replaceWith(button);button.onclick=async()=>{button.disabled=true;const label=button.textContent;button.textContent='…';try{await searchV270($('#destination').value,{explicit:true,autoSelect:true})}finally{button.disabled=false;button.textContent=label||'⌕'}}}
  }catch(error){console.warn('Buscador v2.8.0:',error)}

  // ---------- Interfaz de chat, llamadas y soporte ----------
  function installModals(){
    if($('#srChatModal'))return;
    document.body.insertAdjacentHTML('beforeend',`
      <div class="sr-modal-backdrop" id="srChatModal"><section class="sr-modal"><header class="sr-modal-head"><div><h3>Chat del viaje</h3><small id="srChatSubtitle">Comunicación privada dentro de Sobre Ruedas</small></div><button data-close-modal="srChatModal">✕</button></header><div class="chat-list" id="srChatList"><div class="chat-empty">Todavía no hay mensajes.</div></div><div class="chat-quick" id="srChatQuick"></div><form class="chat-compose" id="srChatForm"><input id="srChatInput" maxlength="800" placeholder="Escribe un mensaje…" autocomplete="off"><button>Enviar</button></form></section></div>
      <div class="sr-modal-backdrop" id="srHelpModal"><section class="sr-modal"><header class="sr-modal-head"><div><h3>Ayuda y seguridad</h3><small>El caso llegará al centro de operaciones</small></div><button data-close-modal="srHelpModal">✕</button></header><div class="help-grid" id="srHelpGrid"></div><div class="help-form"><label>Describe lo ocurrido</label><textarea id="srHelpDescription" maxlength="1800" placeholder="Incluye los detalles necesarios para que soporte pueda ayudarte."></textarea><label>Prioridad</label><div class="help-priority" id="srHelpPriority"><button data-priority="normal" class="active">Normal</button><button data-priority="high">Alta</button><button data-priority="emergency">Emergencia</button></div><button class="help-submit" id="srHelpSubmit">Enviar a soporte</button></div></section></div>
      <div class="sr-modal-backdrop" id="srCallModal"><section class="sr-modal"><header class="sr-modal-head"><div><h3>Llamada privada</h3><small>El número telefónico real no se comparte</small></div><button data-call-action="hangup">✕</button></header><div class="call-panel"><div class="call-orb">📞</div><div class="call-status" id="srCallStatus">Preparando llamada…</div><div class="call-subtitle" id="srCallSubtitle">Llamada de audio por internet dentro de Sobre Ruedas.</div><div class="call-actions"><button class="accept hidden" id="srAcceptCall" data-call-action="accept">✓</button><button class="mute" id="srMuteCall" data-call-action="mute">🎙️</button><button class="hangup" data-call-action="hangup">✕</button></div></div><audio id="srRemoteAudio" autoplay playsinline></audio></section></div>
      <div class="sr-modal-backdrop" id="srSupportCaseModal"><section class="sr-modal"><header class="sr-modal-head"><div><h3 id="srSupportCaseTitle">Caso de soporte</h3><small id="srSupportCaseMeta">Conversación con administración</small></div><button data-close-modal="srSupportCaseModal">✕</button></header><div class="support-thread-user" id="srSupportThread"><div class="chat-empty">Cargando conversación…</div></div><form class="chat-compose" id="srSupportReplyForm"><input id="srSupportReplyInput" maxlength="1800" placeholder="Responder a soporte…" autocomplete="off"><button>Enviar</button></form></section></div>`);
    $$('.sr-modal-backdrop').forEach(backdrop=>backdrop.addEventListener('click',e=>{if(e.target===backdrop&&backdrop.id!=='srCallModal')closeModal(backdrop.id)}));
    $$('[data-close-modal]').forEach(b=>b.onclick=()=>closeModal(b.dataset.closeModal));
    $('#srChatForm').onsubmit=e=>{e.preventDefault();sendChatMessage($('#srChatInput').value,'text')};
    $('#srSupportReplyForm').onsubmit=e=>{e.preventDefault();sendSupportReplyUser()};
    $('#srChatQuick').innerHTML=QUICK_MESSAGES.map(m=>`<button type="button" data-quick="${escapeHtml(m)}">${escapeHtml(m)}</button>`).join('');
    $('#srChatQuick').onclick=e=>{const b=e.target.closest('[data-quick]');if(b)sendChatMessage(b.dataset.quick,'quick')};
    $('#srHelpGrid').innerHTML=HELP_CATEGORIES.map(([icon,label],i)=>`<button class="help-option ${i===0?'active':''}" data-help-category="${escapeHtml(label)}"><span>${icon}</span>${escapeHtml(label)}</button>`).join('');
    $('#srHelpGrid').onclick=e=>{const b=e.target.closest('[data-help-category]');if(!b)return;selectedHelpCategory=b.dataset.helpCategory;$$('[data-help-category]').forEach(x=>x.classList.toggle('active',x===b))};
    $('#srHelpPriority').onclick=e=>{e.preventDefault();const b=e.target.closest('[data-priority]');if(!b)return;selectedHelpPriority=b.dataset.priority;$$('[data-priority]').forEach(x=>x.classList.toggle('active',x===b))};
    $('#srHelpSubmit').onclick=submitSupportCase;
    $$('[data-call-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.callAction;if(a==='accept')acceptIncomingCall();if(a==='hangup')endCall(true);if(a==='mute')toggleMute()});
    remoteAudio=$('#srRemoteAudio');
  }
  function openModal(id){installModals();$('#'+id)?.classList.add('show')}
  function closeModal(id){$('#'+id)?.classList.remove('show')}
  function setCallStatus(title,subtitle=''){$('#srCallStatus').textContent=title;if(subtitle)$('#srCallSubtitle').textContent=subtitle}

  function installHelpPage(){
    const nav=$('.nav');if(!nav||$('#v270HelpPanel'))return;
    const panel=document.createElement('div');panel.id='v270HelpPanel';panel.className='hidden help-panel-v270';panel.innerHTML='<h2>Ayuda y soporte</h2><div class="notice-card" style="margin-top:12px"><strong>Centro de ayuda</strong><small style="display:block;margin-top:5px">Reporta problemas, revisa tus casos y comunícate con administración sin salir de la plataforma.</small></div><button class="primary" id="v270OpenHelp" style="margin-top:12px">Reportar un problema</button><div class="section-title"><h3>Mis casos</h3><button id="v270RefreshCases">Actualizar</button></div><div id="v270CaseList" class="support-case-list"><div class="chat-empty">Cargando casos…</div></div>';
    nav.parentElement.insertBefore(panel,nav);
    const b=document.createElement('button');b.dataset.page='v270-help';b.innerHTML='<span>?</span>Ayuda';nav.insertBefore(b,nav.lastElementChild);nav.classList.add('v270-nav-five');
    nav.addEventListener('click',e=>{const button=e.target.closest('button[data-page]');if(!button)return;const custom=button.dataset.page==='v270-help';panel.classList.toggle('hidden',!custom);if(custom){$$('.nav button').forEach(x=>x.classList.toggle('active',x===button));['homePanel','driverPanel','historyPanel','savedPanel','accountPanel'].forEach(id=>$('#'+id)?.classList.add('hidden'));loadSupportCases()}else panel.classList.add('hidden')});
    $('#v270OpenHelp').onclick=()=>openHelp();$('#v270RefreshCases').onclick=loadSupportCases;
  }

  async function fetchActiveRide(){
    if(!currentRideId){activeRide=null;syncCommunicationButtons();return null}
    const {data,error}=await sb.from('rides').select('*').eq('id',currentRideId).maybeSingle();
    if(error){console.warn('No se pudo cargar el contexto de comunicación',error.message);return null}
    activeRide=data||null;syncCommunicationButtons();if(activeRide)subscribeRideCommunication();return activeRide;
  }
  function syncCommunicationButtons(){
    const show=Boolean(currentRideId&&activeRide&&activeRide.driver_id&&activeRide.passenger_id);
    ['chatBtn','callBtn','driverCallPassenger','driverTripProblemBtn'].forEach(id=>{const el=$('#'+id);if(el)el.disabled=!show&&id!=='driverTripProblemBtn'});
    const bar=$('#driverCommunicationBar');if(bar)bar.classList.toggle('show',show);
  }
  function installDriverCommunicationBar(){
    const target=$('#driverActiveTrip');if(!target||$('#driverCommunicationBar'))return;
    const bar=document.createElement('div');bar.id='driverCommunicationBar';bar.className='communication-bar';bar.innerHTML='<button class="primary" id="driverChatV270">💬 Chat <span id="driverChatBadge" class="comm-badge hidden">0</span></button><button id="driverCallV270">📞 Llamada privada</button><button class="emergency" id="driverHelpV270">🛡️ Ayuda</button>';target.insertBefore(bar,target.querySelector('.driver-action'));
    $('#driverChatV270').onclick=openChat;$('#driverCallV270').onclick=startPrivateCall;$('#driverHelpV270').onclick=()=>openHelp();
  }
  function updateUnread(){['driverChatBadge'].forEach(id=>{const b=$('#'+id);if(!b)return;b.textContent=unreadMessages;b.classList.toggle('hidden',unreadMessages===0)})}

  async function openChat(){
    if(!currentRideId)return toast('El chat se habilita cuando el viaje está asignado');
    await fetchActiveRide();if(!activeRide?.driver_id)return toast('Espera a que un conductor acepte el viaje');
    unreadMessages=0;updateUnread();openModal('srChatModal');$('#srChatSubtitle').textContent=`${otherParticipant().name} · mensajes asociados al viaje`;
    await loadMessages();$('#srChatInput').focus();
  }
  async function loadMessages(){
    const list=$('#srChatList');if(!list||!currentRideId)return;
    const {data,error}=await sb.from('ride_messages').select('*').eq('ride_id',String(currentRideId)).order('created_at',{ascending:true}).limit(150);
    if(error){list.innerHTML='<div class="chat-empty">No se pudo cargar el chat. Ejecuta el SQL v2.8.0.</div>';return}
    renderMessages(data||[]);
    try{await sb.rpc('mark_ride_messages_read',{p_ride_id:String(currentRideId),p_reader_id:deviceId,p_reader_role:ROLE})}catch{}
  }
  function renderMessages(messages){
    const list=$('#srChatList');if(!list)return;
    if(!messages.length){list.innerHTML='<div class="chat-empty">Todavía no hay mensajes. Usa una respuesta rápida o escribe debajo.</div>';return}
    list.innerHTML=messages.map(m=>{const mine=String(m.sender_id)===String(deviceId);const cls=m.sender_role==='system'?'system':mine?'mine':'theirs';return `<div class="chat-message ${cls}">${escapeHtml(m.message)}<small>${mine?'Tú':m.sender_role==='driver'?'Conductor':'Pasajero'} · ${timeLabel(m.created_at)}${mine&&m.read_at?' · leído':''}</small></div>`}).join('');
    list.scrollTop=list.scrollHeight;
  }
  async function sendChatMessage(message,type='text'){
    const clean=String(message||'').trim();if(!clean)return;if(!currentRideId)return toast('No hay viaje activo');
    const input=$('#srChatInput');if(input)input.disabled=true;
    const {error}=await sb.rpc('send_ride_message',{p_ride_id:String(currentRideId),p_sender_id:deviceId,p_sender_role:ROLE,p_message:clean,p_message_type:type});
    if(input){input.disabled=false;input.value='';input.focus()}
    if(error){console.error(error);return toast(error.message?.includes('CHAT_CLOSED')?'El chat de este viaje ya cerró':'No se pudo enviar el mensaje')}
    await loadMessages();
  }
  function subscribeRideCommunication(){
    if(!activeRide||!currentRideId)return;
    if(chatChannel)sb.removeChannel(chatChannel);
    chatChannel=sb.channel(`ride-chat-${currentRideId}-${Date.now()}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'ride_messages',filter:`ride_id=eq.${currentRideId}`},payload=>{
        const msg=payload.new;if(String(msg.sender_id)!==String(deviceId)&&!$('#srChatModal')?.classList.contains('show')){unreadMessages++;updateUnread();toast('Nuevo mensaje del viaje')}
        if($('#srChatModal')?.classList.contains('show'))loadMessages();
      }).subscribe();
    subscribeCallChannel();
  }

  function openHelp(priority='normal',category=null){
    installModals();selectedHelpPriority=priority;selectedHelpCategory=category||HELP_CATEGORIES[0][1];
    $$('[data-help-category]').forEach(x=>x.classList.toggle('active',x.dataset.helpCategory===selectedHelpCategory));
    $$('[data-priority]').forEach(x=>x.classList.toggle('active',x.dataset.priority===selectedHelpPriority));
    $('#srHelpDescription').value='';openModal('srHelpModal');
  }
  async function submitSupportCase(){
    const description=$('#srHelpDescription').value.trim();if(description.length<8)return toast('Describe el problema con un poco más de detalle');
    const button=$('#srHelpSubmit');button.disabled=true;button.textContent='Enviando…';
    const {data,error}=await sb.rpc('create_support_case',{p_creator_id:deviceId,p_creator_role:ROLE,p_ride_id:currentRideId?String(currentRideId):'',p_category:selectedHelpCategory,p_subject:selectedHelpCategory,p_description:description,p_priority:selectedHelpPriority});
    button.disabled=false;button.textContent='Enviar a soporte';
    if(error){console.error(error);return toast('No se pudo crear el caso. Ejecuta el SQL v2.8.0')}
    closeModal('srHelpModal');toast(`Caso #${data?.case_number||''} enviado al administrador`);loadSupportCases();
  }
  async function loadSupportCases(){
    const list=$('#v270CaseList');if(!list)return;
    list.innerHTML='<div class="chat-empty">Actualizando casos…</div>';
    const {data,error}=await sb.from('support_cases').select('*').eq('created_by_id',deviceId).order('created_at',{ascending:false}).limit(30);
    if(error){list.innerHTML='<div class="chat-empty">No se pudieron cargar los casos. Ejecuta el SQL v2.8.0.</div>';return}
    list.innerHTML=(data||[]).map(c=>`<button type="button" class="support-case-card" data-user-case-id="${escapeHtml(c.id)}"><strong>#${escapeHtml(c.case_number)} · ${escapeHtml(c.subject)}</strong><small>${escapeHtml(c.description)}</small><span class="case-status ${escapeHtml(c.status)}">${escapeHtml(statusLabel(c.status))} · ${escapeHtml(c.priority)}</span><span class="case-open-hint">Abrir conversación ›</span></button>`).join('')||'<div class="chat-empty">No has abierto casos de soporte.</div>';
    list.onclick=e=>{const card=e.target.closest('[data-user-case-id]');if(card)openSupportCaseUser(card.dataset.userCaseId)};
  }
  async function openSupportCaseUser(caseId){
    const {data,error}=await sb.from('support_cases').select('*').eq('id',caseId).eq('created_by_id',deviceId).maybeSingle();
    if(error||!data)return toast('No se pudo abrir este caso');
    selectedSupportCase=data;$('#srSupportCaseTitle').textContent=`Caso #${data.case_number} · ${data.subject}`;$('#srSupportCaseMeta').textContent=`${statusLabel(data.status)} · prioridad ${data.priority}`;
    const closed=['resolved','closed'].includes(data.status);$('#srSupportReplyInput').disabled=closed;$('#srSupportReplyForm button').disabled=closed;$('#srSupportReplyInput').placeholder=closed?'Este caso está cerrado':'Responder a soporte…';
    openModal('srSupportCaseModal');await loadSupportThreadUser();subscribeSupportThread();
  }
  async function loadSupportThreadUser(){
    if(!selectedSupportCase)return;const list=$('#srSupportThread');list.innerHTML='<div class="chat-empty">Cargando conversación…</div>';
    const {data,error}=await sb.from('support_messages').select('*').eq('case_id',selectedSupportCase.id).order('created_at',{ascending:true}).limit(300);
    if(error){list.innerHTML='<div class="chat-empty">No se pudo cargar la conversación.</div>';return}
    list.innerHTML=(data||[]).map(m=>{const mine=String(m.sender_id)===String(deviceId);return `<div class="support-user-message ${mine?'mine':'admin'}">${escapeHtml(m.message)}<small>${mine?'Tú':m.sender_role==='admin'?'Administración':m.sender_role==='system'?'Sistema':'Soporte'} · ${timeLabel(m.created_at)}</small></div>`}).join('')||'<div class="chat-empty">No hay mensajes en este caso.</div>';list.scrollTop=list.scrollHeight;
  }
  async function sendSupportReplyUser(){
    if(!selectedSupportCase)return;const input=$('#srSupportReplyInput'),message=input.value.trim();if(!message)return;
    input.disabled=true;const {error}=await sb.rpc('send_support_message',{p_case_id:selectedSupportCase.id,p_sender_id:deviceId,p_sender_role:ROLE,p_message:message});input.disabled=false;
    if(error){console.error(error);return toast(error.message?.includes('SUPPORT_CASE_CLOSED')?'Este caso ya está cerrado':'No se pudo enviar la respuesta')}
    input.value='';await loadSupportThreadUser();
  }
  function subscribeSupportThread(){
    if(supportThreadChannel)sb.removeChannel(supportThreadChannel);if(!selectedSupportCase)return;
    supportThreadChannel=sb.channel(`support-thread-${selectedSupportCase.id}-${Date.now()}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'support_messages',filter:`case_id=eq.${selectedSupportCase.id}`},loadSupportThreadUser).on('postgres_changes',{event:'UPDATE',schema:'public',table:'support_cases',filter:`id=eq.${selectedSupportCase.id}`},payload=>{selectedSupportCase=payload.new;$('#srSupportCaseMeta').textContent=`${statusLabel(payload.new.status)} · prioridad ${payload.new.priority}`}).subscribe();
  }

  // ---------- Llamada privada por internet (WebRTC + Supabase Broadcast) ----------
  function callTopic(){return activeRide?`sr-call:${activeRide.id}:${activeRide.communication_token||'legacy'}`:null}
  function subscribeCallChannel(){
    const topic=callTopic();if(!topic)return;
    if(callChannel)sb.removeChannel(callChannel);
    let readyResolve;callChannelReady=new Promise(resolve=>{readyResolve=resolve});
    callChannel=sb.channel(topic,{config:{broadcast:{ack:true}}}).on('broadcast',{event:'call'},({payload})=>handleCallSignal(payload));
    callChannel.subscribe(status=>{if(status==='SUBSCRIBED')readyResolve(true);if(['CHANNEL_ERROR','TIMED_OUT','CLOSED'].includes(status))readyResolve(false)});
  }
  async function sendCallSignal(payload){
    if(!callChannel)subscribeCallChannel();if(!callChannel)throw new Error('Canal no disponible');
    const ready=await Promise.race([callChannelReady||Promise.resolve(true),new Promise(resolve=>setTimeout(()=>resolve(false),5000))]);if(!ready)throw new Error('No se pudo conectar el canal de llamada');
    await callChannel.send({type:'broadcast',event:'call',payload:{...payload,from:deviceId,role:ROLE,to:payload.to||otherParticipant().id,rideId:String(currentRideId)}});
  }
  async function preparePeer(){
    if(!window.RTCPeerConnection||!navigator.mediaDevices?.getUserMedia)throw new Error('Este navegador no admite llamadas de audio');
    if(peer)peer.close();pendingIce=[];
    peer=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}]});
    localStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
    localStream.getTracks().forEach(track=>peer.addTrack(track,localStream));
    peer.ontrack=e=>{if(remoteAudio){remoteAudio.srcObject=e.streams[0];remoteAudio.play().catch(()=>{})}};
    peer.onicecandidate=e=>{if(e.candidate)sendCallSignal({kind:'ice',candidate:e.candidate}).catch(()=>{})};
    peer.onconnectionstatechange=()=>{if(peer?.connectionState==='connected')setCallStatus('Llamada conectada','Audio protegido dentro de Sobre Ruedas.');if(['failed','disconnected'].includes(peer?.connectionState))setCallStatus('Conexión inestable','Intentando mantener la llamada por internet…')};
  }
  async function startPrivateCall(){
    if(!currentRideId)return toast('La llamada se habilita durante un viaje asignado');await fetchActiveRide();
    const other=otherParticipant();if(!other.id)return toast('La otra persona todavía no está asignada');
    openModal('srCallModal');$('#srAcceptCall').classList.add('hidden');setCallStatus(`Llamando a ${other.name}…`,'El número real de ninguno de los dos se mostrará.');
    try{await preparePeer();const offer=await peer.createOffer({offerToReceiveAudio:true});await peer.setLocalDescription(offer);await sendCallSignal({kind:'offer',sdp:offer,name:ownName()})}
    catch(error){console.error(error);setCallStatus('No se pudo iniciar la llamada',error.message||'Revisa el permiso del micrófono')}
  }
  async function handleCallSignal(signal){
    if(!signal||String(signal.to)!==String(deviceId)||String(signal.from)===String(deviceId))return;
    if(signal.kind==='offer'){
      incomingOffer=signal.sdp;incomingCaller={id:signal.from,name:signal.name||(signal.role==='driver'?'Conductor':'Pasajero')};
      openModal('srCallModal');$('#srAcceptCall').classList.remove('hidden');setCallStatus(`Llamada de ${incomingCaller.name}`,'Llamada privada por internet. Tu número no se comparte.');
    }else if(signal.kind==='answer'&&peer){
      await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));for(const c of pendingIce.splice(0))await peer.addIceCandidate(c).catch(()=>{});setCallStatus('Conectando llamada…');
    }else if(signal.kind==='ice'){
      const candidate=new RTCIceCandidate(signal.candidate);if(peer?.remoteDescription)await peer.addIceCandidate(candidate).catch(()=>{});else pendingIce.push(candidate);
    }else if(signal.kind==='reject'){setCallStatus('Llamada rechazada');setTimeout(()=>endCall(false),1000)}
    else if(signal.kind==='hangup'){setCallStatus('Llamada finalizada');setTimeout(()=>endCall(false),600)}
  }
  async function acceptIncomingCall(){
    if(!incomingOffer||!incomingCaller)return;
    $('#srAcceptCall').classList.add('hidden');setCallStatus('Conectando…');
    try{await preparePeer();await peer.setRemoteDescription(new RTCSessionDescription(incomingOffer));const answer=await peer.createAnswer();await peer.setLocalDescription(answer);await sendCallSignal({kind:'answer',to:incomingCaller.id,sdp:answer,name:ownName()});for(const c of pendingIce.splice(0))await peer.addIceCandidate(c).catch(()=>{});incomingOffer=null}
    catch(error){console.error(error);setCallStatus('No se pudo contestar',error.message||'Revisa el permiso del micrófono')}
  }
  function toggleMute(){if(!localStream)return;callMuted=!callMuted;localStream.getAudioTracks().forEach(t=>t.enabled=!callMuted);$('#srMuteCall').textContent=callMuted?'🔇':'🎙️'}
  async function endCall(notify=true){
    if(notify&&activeRide)sendCallSignal({kind:'hangup'}).catch(()=>{});
    peer?.close();peer=null;localStream?.getTracks().forEach(t=>t.stop());localStream=null;if(remoteAudio)remoteAudio.srcObject=null;incomingOffer=null;incomingCaller=null;pendingIce=[];callMuted=false;$('#srAcceptCall')?.classList.add('hidden');closeModal('srCallModal');
  }

  // Botones existentes: nunca abren tel: ni muestran números reales.
  installModals();installHelpPage();installDriverCommunicationBar();
  if($('#chatBtn'))$('#chatBtn').onclick=openChat;
  if($('#callBtn'))$('#callBtn').onclick=startPrivateCall;
  if($('#sosBtn'))$('#sosBtn').onclick=()=>openHelp('emergency','Situación insegura');
  if($('#driverCallPassenger'))$('#driverCallPassenger').onclick=startPrivateCall;
  if($('#driverTripProblemBtn'))$('#driverTripProblemBtn').onclick=()=>openHelp('high');
  if($('#helpBtn'))$('#helpBtn').onclick=()=>openHelp();

  // Revisa periódicamente el contexto sin recargar la aplicación completa.
  setInterval(()=>{
    if(currentRideId&&String(activeRide?.id)!==String(currentRideId))fetchActiveRide();
    if(!currentRideId&&activeRide){activeRide=null;syncCommunicationButtons();if(chatChannel){sb.removeChannel(chatChannel);chatChannel=null}if(callChannel){sb.removeChannel(callChannel);callChannel=null}}
  },1800);
  setTimeout(fetchActiveRide,400);
  window.addEventListener('beforeunload',()=>{if(chatChannel)sb.removeChannel(chatChannel);if(callChannel)sb.removeChannel(callChannel);if(supportThreadChannel)sb.removeChannel(supportThreadChannel);peer?.close();localStream?.getTracks().forEach(t=>t.stop())});
})();

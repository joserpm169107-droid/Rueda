/* Sobre Ruedas Admin v2.8.0 — suspensiones temporales y eliminación definitiva */
(() => {
  const q=s=>document.querySelector(s);
  const qa=s=>[...document.querySelectorAll(s)];
  const ADMIN_CODE='RUEDA2026';
  let suspensionTarget=null;

  document.title='Sobre Ruedas Admin v2.8.0';
  q('.version').textContent='Admin v2.8.0';
  qa('*').forEach(el=>{
    if(el.childNodes.length===1&&el.firstChild?.nodeType===Node.TEXT_NODE){
      el.textContent=el.textContent.replace(/v2\.5\.1/g,'v2.8.0').replace(/ACTUALIZAR_SUPABASE_v2\.5\.0\.sql/g,'ACTUALIZAR_SUPABASE_v2.8.0.sql');
    }
  });

  function suspensionState(profile){
    const until=profile?.suspended_until?new Date(profile.suspended_until):null;
    return {active:Boolean(until&&!Number.isNaN(until.getTime())&&until.getTime()>Date.now()),until,reason:profile?.suspension_reason||'',by:profile?.suspended_by||''};
  }
  function suspensionDate(profile){const state=suspensionState(profile);return state.active?state.until.toLocaleString('es-US',{dateStyle:'medium',timeStyle:'short'}):''}
  function vehicleLabel(profile,person){
    if(!profile)return person?.vehicle||'Vehículo sin definir';
    const detail=[profile.vehicle_type,profile.vehicle_make,profile.vehicle_model,profile.vehicle_year,profile.vehicle_color].filter(Boolean).join(' · ');
    return detail+(profile.vehicle_plate?` · Matrícula ${profile.vehicle_plate}`:'');
  }
  function profileComplete(profile,type){
    if(!profile)return false;
    if(type==='passenger')return Boolean(profile.photo_url&&profile.full_name&&profile.phone);
    return Boolean(profile.photo_url&&profile.vehicle_type&&profile.vehicle_make&&profile.vehicle_model&&profile.vehicle_color&&profile.vehicle_plate&&profile.vehicle_photo_url&&profile.document_url);
  }

  // Modal real para escoger duración y motivo.
  if(!q('#suspensionModal')){
    const wrapper=document.createElement('div');
    wrapper.id='suspensionModal';wrapper.className='modal-backdrop hidden';
    wrapper.innerHTML=`<div class="modal suspension-modal">
      <div class="modal-head"><div><h3>Suspender cuenta</h3><small id="suspensionSubtitle" style="color:var(--muted)"></small></div><button id="closeSuspension" class="close-btn">✕</button></div>
      <div class="suspension-presets">
        <button data-suspend-days="7">7 días</button><button data-suspend-days="30">1 mes</button><button data-suspend-days="60">2 meses</button><button data-suspend-days="custom">Otra fecha</button>
      </div>
      <div class="suspension-form">
        <label>Suspender hasta<input id="suspensionUntil" type="datetime-local"></label>
        <label>Motivo<textarea id="suspensionReason" placeholder="Explica el motivo de la sanción administrativa"></textarea></label>
      </div>
      <div class="delete-warning" style="margin-top:12px">La cuenta no podrá operar durante la suspensión. Los viajes activos se cancelarán y quedarán registrados por administración.</div>
      <div class="modal-actions"><button id="cancelSuspension" class="cancel">Cancelar</button><button id="confirmSuspension" class="confirm">Aplicar suspensión</button></div>
    </div>`;
    document.body.appendChild(wrapper);
  }

  // Indicador general de sanciones activas.
  const stats=q('.stats');
  if(stats&&!q('[data-stat-action="suspensions"]')){
    const card=document.createElement('div');card.className='stat actionable attention';card.tabIndex=0;card.dataset.statAction='suspensions';
    card.innerHTML='<small>SUSPENSIONES ACTIVAS</small><strong id="sSuspensions">0</strong><div class="sub">Pasajeros y conductores sancionados</div>';
    stats.appendChild(card);
  }
  ['driver','passenger'].forEach(type=>{
    const select=q('#'+type+'Status');if(select&&!select.querySelector('[value="suspended"]')){
      const option=document.createElement('option');option.value='suspended';option.textContent='Suspendidos';select.appendChild(option);
    }
  });

  const originalIsProfileOnline=isProfileOnline;
  isProfileOnline=function(profile){if(suspensionState(profile).active)return false;return originalIsProfileOnline(profile)};

  personCard=function(person,type){
    const reportCount=type==='driver'?(reportGroups().get(person.id)?.count||0):0;
    const level=type==='driver'?riskForDriver(person.id):'green';
    const average=person.ratingCount?person.ratingSum/person.ratingCount:null;
    const profile=person.profile||profileFor(person.id);
    const state=suspensionState(profile);
    const deleted=profile?.status==='deleted'||profile?.approval_status==='deleted';
    const approval=type==='driver'?(profile?.approval_status||person.approval_status||'pending'):'approved';
    const complete=profileComplete(profile,type);
    const photo=profile?.photo_url||person.photo;
    const avatar=photo?`<img src="${esc(photo)}" alt="Foto de ${esc(person.name)}">`:(type==='driver'?'🛵':'👤');
    const cardClass=deleted?' deleted-card':state.active?' suspended-card':approval==='rejected'?' blocked':approval==='pending'?' pending-card':'';
    const statusLabelHtml=state.active?`<span class="suspension-chip">⏳ Suspendido hasta ${esc(suspensionDate(profile))}</span>`:`<span class="approval approval-${approvalClass(approval)}">${approvalLabel(approval)}</span>`;
    const contact=[profile?.phone,profile?.email].filter(Boolean).join(' · ');
    const reason=state.active?state.reason:(profile?.deleted_reason||profile?.rejection_reason||'');
    const common=`<button class="neutral" data-person-action="trips" data-person-id="${esc(person.id)}">Viajes</button>`;
    let actions='';
    if(type==='driver'){
      actions=`<div class="actions wrap">${common}<button class="neutral" data-person-action="reports" data-person-id="${esc(person.id)}">Reportes</button>${approval!=='approved'?`<button class="ok" data-person-action="approve" data-person-id="${esc(person.id)}">Aprobar</button>`:''}${approval==='approved'?`<button class="warning" data-person-action="reject" data-person-id="${esc(person.id)}">Desaprobar</button>`:''}${state.active?`<button class="unsuspend-btn" data-person-action="unsuspend" data-person-id="${esc(person.id)}">Levantar suspensión</button>`:`<button class="suspend-btn" data-person-action="suspend" data-person-id="${esc(person.id)}">Suspender</button>`}<button class="delete-permanent" data-person-action="delete-permanent" data-person-id="${esc(person.id)}">Eliminar definitivamente</button></div>`;
    }else{
      actions=`<div class="actions wrap">${common}${state.active?`<button class="unsuspend-btn" data-person-action="unsuspend" data-person-id="${esc(person.id)}">Levantar suspensión</button>`:`<button class="suspend-btn" data-person-action="suspend" data-person-id="${esc(person.id)}">Suspender</button>`}<button class="delete-permanent" data-person-action="delete-permanent" data-person-id="${esc(person.id)}">Eliminar definitivamente</button></div>`;
    }
    return `<article class="person${cardClass}" data-person-id="${esc(person.id)}" data-status="${state.active?'suspended':esc(deleted?'deleted':approval)}" data-online="${person.is_online&&!state.active?'1':'0'}">
      <div class="person-top"><div class="avatar">${avatar}</div><div><strong>${esc(person.name||'Sin nombre')}</strong><small class="vehicle-detail">${type==='driver'?esc(vehicleLabel(profile,person)):'Pasajero de Sobre Ruedas'}</small>${contact?`<small class="person-contact">${esc(contact)}</small>`:''}${statusLabelHtml}<span class="profile-completeness ${complete?'complete':'incomplete'}">${complete?'Perfil completo':'Faltan datos o fotos'}</span>${reason?`<div class="admin-reason">Motivo: ${esc(reason)}${state.active&&state.by?` · Aplicada por ${esc(state.by)}`:''}</div>`:''}</div></div>
      <div class="meta"><div><small>Viajes</small><b>${person.trips}</b></div><div><small>${type==='driver'?'Ganado':'Gastado'}</small><b>${money(person.total)}</b></div><div><small>Cancelados</small><b>${person.canceled}</b></div><div><small>${type==='driver'?'Promedio':'Última actividad'}</small><b>${type==='driver'?(average?'⭐ '+average.toFixed(1):'Sin evaluar'):dateFmt(person.last)}</b></div>${type==='driver'?`<div><small>Reportes</small><b>${reportCount}</b></div><div><small>Riesgo</small><b><span class="risk risk-${level}">${riskLabel(level)}</span></b></div>`:''}</div>
      <div class="profile-id">ID: ${esc(person.id)}</div>${actions}
    </article>`;
  };

  applyPeopleFilters=function(type){
    const query=q('#'+type+'Search').value.toLowerCase().trim();const status=q('#'+type+'Status').value;
    qa(`#${type}Cards .person`).forEach(card=>{
      const text=card.textContent.toLowerCase(),cardStatus=card.dataset.status,online=card.dataset.online==='1';let ok=!query||text.includes(query);
      if(status!=='all'){
        if(status==='online')ok=ok&&online;
        else if(status==='active')ok=ok&&!['deleted','suspended'].includes(cardStatus);
        else ok=ok&&cardStatus===status;
      }
      card.classList.toggle('hidden',!ok);
    });
  };

  function defaultSuspensionDate(days=7){const d=new Date(Date.now()+days*86400000);d.setSeconds(0,0);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
  function openSuspension(personId,type){
    const person=uniquePeople(type).find(p=>String(p.id)===String(personId));
    suspensionTarget={personId:String(personId),type,name:person?.name||'esta cuenta'};
    q('#suspensionSubtitle').textContent=`${type==='driver'?'Conductor':'Pasajero'} · ${suspensionTarget.name}`;
    q('#suspensionUntil').value=defaultSuspensionDate(7);q('#suspensionReason').value='';
    qa('[data-suspend-days]').forEach(b=>b.classList.toggle('active',b.dataset.suspendDays==='7'));
    q('#suspensionModal').classList.remove('hidden');
  }
  function closeSuspension(){q('#suspensionModal').classList.add('hidden');suspensionTarget=null}
  q('#closeSuspension').onclick=q('#cancelSuspension').onclick=closeSuspension;
  qa('[data-suspend-days]').forEach(button=>button.onclick=()=>{
    qa('[data-suspend-days]').forEach(b=>b.classList.toggle('active',b===button));
    if(button.dataset.suspendDays!=='custom')q('#suspensionUntil').value=defaultSuspensionDate(Number(button.dataset.suspendDays));
    else q('#suspensionUntil').focus();
  });
  q('#confirmSuspension').onclick=async()=>{
    if(!suspensionTarget)return;
    const until=q('#suspensionUntil').value,reason=q('#suspensionReason').value.trim();
    if(!until||new Date(until)<=new Date())return toast('Selecciona una fecha futura');
    if(!reason)return toast('El motivo de la suspensión es obligatorio');
    const button=q('#confirmSuspension');button.disabled=true;button.textContent='Aplicando…';
    const {error}=await sb.rpc('admin_suspend_profile',{p_person_id:suspensionTarget.personId,p_role:suspensionTarget.type,p_until:new Date(until).toISOString(),p_reason:reason,p_admin_name:ownerIdentity(),p_admin_code:ADMIN_CODE});
    button.disabled=false;button.textContent='Aplicar suspensión';
    if(error){console.error(error);return toast('No se pudo suspender. Ejecuta el SQL v2.8.0')}
    toast(`${suspensionTarget.type==='driver'?'Conductor':'Pasajero'} suspendido correctamente`);closeSuspension();await refreshOperations();
  };

  async function unsuspendPerson(personId,type){
    const person=uniquePeople(type).find(p=>String(p.id)===String(personId));
    if(!confirm(`¿Levantar ahora la suspensión de ${person?.name||'esta cuenta'}?`))return;
    const {error}=await sb.rpc('admin_unsuspend_profile',{p_person_id:String(personId),p_role:type,p_admin_name:ownerIdentity(),p_admin_code:ADMIN_CODE});
    if(error){console.error(error);return toast('No se pudo levantar la suspensión. Ejecuta el SQL v2.8.0')}
    toast('Suspensión levantada');await refreshOperations();
  }

  async function permanentDelete(personId,type){
    const person=uniquePeople(type).find(p=>String(p.id)===String(personId));const name=person?.name||'esta cuenta';
    const reason=prompt(`Motivo de la eliminación definitiva de ${name}:`,'Incumplimiento grave de las normas');
    if(reason===null)return;if(!reason.trim())return toast('El motivo es obligatorio');
    const confirmation=prompt(`Esta acción borrará el perfil, las fotos y TODOS sus viajes de la base de datos.\n\nEscribe ELIMINAR para borrar definitivamente a ${name}.`,'');
    if(confirmation!=='ELIMINAR')return toast('Eliminación cancelada');
    const {data,error}=await sb.rpc('admin_delete_person_permanently',{p_person_id:String(personId),p_role:type,p_reason:reason.trim(),p_admin_name:ownerIdentity(),p_admin_code:ADMIN_CODE});
    if(error){console.error(error);return toast('No se pudo eliminar definitivamente. Ejecuta el SQL v2.8.0')}
    const result=Array.isArray(data)?data[0]:data;
    toast(`Cuenta eliminada · ${Number(result?.rides_deleted||0)} viaje(s) borrado(s)`);if(!q('#opsModal').classList.contains('hidden'))closeOpsModal();await refreshOperations();
  }

  const originalHandlePersonAction=handlePersonAction;
  handlePersonAction=async function(action,personId,type='driver'){
    if(action==='suspend')return openSuspension(personId,type);
    if(action==='unsuspend')return unsuspendPerson(personId,type);
    if(action==='delete-permanent'||action==='delete-driver'||action==='delete-passenger')return permanentDelete(personId,type);
    return originalHandlePersonAction(action,personId,type);
  };

  function openSuspensions(){
    const people=[...uniquePeople('driver').map(p=>({...p,type:'driver'})),...uniquePeople('passenger').map(p=>({...p,type:'passenger'}))].filter(p=>suspensionState(p.profile).active);
    const html=`<div class="ops-list">${people.map(p=>`<div class="ops-item"><div><strong>${esc(p.name)}</strong><p>${p.type==='driver'?'Conductor':'Pasajero'} · hasta ${esc(suspensionDate(p.profile))}<br>${esc(p.profile?.suspension_reason||'Sin motivo')}</p></div><div class="ops-actions"><button class="neutral" data-ops-action="trips" data-person-id="${esc(p.id)}">Viajes</button><button class="ok" data-ops-action="unsuspend" data-person-id="${esc(p.id)}" data-person-role="${p.type}">Levantar</button></div></div>`).join('')||'<div class="empty">No hay suspensiones activas.</div>'}</div>`;
    openOpsModal('Suspensiones activas','Control temporal de pasajeros y conductores',html);
  }
  const originalHandleStatAction=handleStatAction;
  handleStatAction=function(action){if(action==='suspensions')return openSuspensions();return originalHandleStatAction(action)};
  q('[data-stat-action="suspensions"]').onclick=()=>handleStatAction('suspensions');

  // El modal operativo puede contener acciones de roles distintos.
  const oldOpsHandler=q('#opsBody').onclick;
  q('#opsBody').onclick=event=>{
    const button=event.target.closest('[data-ops-action]');
    if(button&&button.dataset.opsAction==='unsuspend')return handlePersonAction('unsuspend',button.dataset.personId,button.dataset.personRole||'driver');
    return oldOpsHandler?.call(q('#opsBody'),event);
  };

  const originalRenderDashboard=renderDashboard;
  renderDashboard=function(){originalRenderDashboard();const count=profiles.filter(p=>suspensionState(p).active).length;if(q('#sSuspensions'))q('#sSuspensions').textContent=count};

  // Re-render para aplicar inmediatamente las tarjetas nuevas si el panel ya estaba abierto.
  if(!q('#app').classList.contains('hidden')){renderPeople();renderDashboard()}
})();

/* Sobre Ruedas Admin v2.8.0 — soporte, chat y cierre atómico de viajes */
(() => {
  const q=s=>document.querySelector(s);
  const qa=s=>[...document.querySelectorAll(s)];
  const ADMIN_CODE='RUEDA2026';
  let supportCases=[];
  let supportMessages=[];
  let selectedCase=null;
  let supportChannel=null;

  const escHtml=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const caseStatus=value=>({open:'Abierto',in_review:'En revisión',resolved:'Resuelto',closed:'Cerrado'})[value]||value||'Abierto';
  const casePriority=value=>({normal:'Normal',high:'Alta',emergency:'Emergencia'})[value]||value||'Normal';

  function installSupportSection(){
    if(q('#page-support'))return;
    const reportsButton=q('[data-page="reports"]');
    const button=document.createElement('button');button.className='nav-btn';button.dataset.page='support';button.innerHTML='💬 Soporte';
    reportsButton?.after(button);
    const content=q('.content');
    const section=document.createElement('section');section.id='page-support';section.className='section-page';section.innerHTML=`
      <div class="support-dashboard">
        <div class="support-kpi"><small>CASOS ABIERTOS</small><strong id="supportOpenCount">0</strong></div>
        <div class="support-kpi"><small>EN REVISIÓN</small><strong id="supportReviewCount">0</strong></div>
        <div class="support-kpi"><small>PRIORIDAD ALTA</small><strong id="supportHighCount">0</strong></div>
        <div class="support-kpi"><small>EMERGENCIAS</small><strong id="supportEmergencyCount">0</strong></div>
      </div>
      <div class="toolbar"><div class="toolbar-group"><input id="supportSearch" class="search" placeholder="Buscar caso, usuario, categoría o viaje…"><select id="supportStatus" class="search"><option value="">Todos los estados</option><option value="open">Abiertos</option><option value="in_review">En revisión</option><option value="resolved">Resueltos</option><option value="closed">Cerrados</option></select><select id="supportPriority" class="search"><option value="">Todas las prioridades</option><option value="normal">Normal</option><option value="high">Alta</option><option value="emergency">Emergencia</option></select><button id="supportRefresh" class="clear-btn">Actualizar</button></div></div>
      <div class="support-layout"><div id="supportCaseList" class="support-list"></div><div id="supportCaseDetail" class="support-detail"><div class="empty">Selecciona un caso para revisar la conversación y tomar acciones.</div></div></div>`;
    content.appendChild(section);
    button.onclick=()=>{showPage('support');loadSupportData()};
    q('#supportSearch').oninput=renderSupportList;q('#supportStatus').onchange=renderSupportList;q('#supportPriority').onchange=renderSupportList;q('#supportRefresh').onclick=loadSupportData;
    q('#supportCaseList').onclick=e=>{const card=e.target.closest('[data-case-id]');if(card)openSupportCase(card.dataset.caseId)};
  }

  const originalShowPage=showPage;
  showPage=function(page){originalShowPage(page);if(page==='support'){q('#pageTitle').textContent='Soporte e incidencias'}};

  async function loadSupportData(){
    const [casesResult,messagesResult]=await Promise.all([
      sb.from('support_cases').select('*').order('created_at',{ascending:false}).limit(500),
      sb.from('support_messages').select('*').order('created_at',{ascending:true}).limit(3000)
    ]);
    if(casesResult.error){console.error(casesResult.error);q('#supportCaseList').innerHTML='<div class="empty">No se pudo cargar soporte. Ejecuta el SQL v2.8.0.</div>';return}
    supportCases=casesResult.data||[];supportMessages=messagesResult.data||[];renderSupportList();renderSupportStats();
    if(selectedCase){const updated=supportCases.find(c=>String(c.id)===String(selectedCase.id));if(updated)openSupportCase(updated.id)}
  }
  function renderSupportStats(){
    q('#supportOpenCount').textContent=supportCases.filter(c=>c.status==='open').length;
    q('#supportReviewCount').textContent=supportCases.filter(c=>c.status==='in_review').length;
    q('#supportHighCount').textContent=supportCases.filter(c=>c.priority==='high').length;
    q('#supportEmergencyCount').textContent=supportCases.filter(c=>c.priority==='emergency').length;
  }
  function filteredSupportCases(){
    const text=(q('#supportSearch')?.value||'').toLowerCase().trim(),status=q('#supportStatus')?.value||'',priority=q('#supportPriority')?.value||'';
    return supportCases.filter(c=>(!status||c.status===status)&&(!priority||c.priority===priority)&&(!text||[c.case_number,c.created_by_id,c.created_by_role,c.category,c.subject,c.description,c.related_ride_id].some(v=>String(v||'').toLowerCase().includes(text))));
  }
  function renderSupportList(){
    const list=q('#supportCaseList');if(!list)return;
    const cases=filteredSupportCases();
    list.innerHTML=cases.map(c=>`<article class="support-case ${selectedCase?.id===c.id?'active':''}" data-case-id="${escHtml(c.id)}"><strong>#${escHtml(c.case_number)} · ${escHtml(c.subject)}</strong><small>${escHtml(c.created_by_role==='driver'?'Conductor':c.created_by_role==='passenger'?'Pasajero':'Administración')} · ${escHtml(dateFmt(c.created_at))}</small><small>${escHtml(c.description)}</small><div class="support-meta"><span class="support-chip ${escHtml(c.priority)}">${escHtml(casePriority(c.priority))}</span><span class="support-chip ${['resolved','closed'].includes(c.status)?'resolved':''}">${escHtml(caseStatus(c.status))}</span>${c.related_ride_id?`<span class="support-chip">Viaje #${escHtml(String(c.related_ride_id).slice(0,6))}</span>`:''}</div></article>`).join('')||'<div class="empty">No hay casos con esos filtros.</div>';
  }
  function relatedRide(c){return c?.related_ride_id?rides.find(r=>String(r.id)===String(c.related_ride_id)):null}
  function openSupportCase(caseId){
    selectedCase=supportCases.find(c=>String(c.id)===String(caseId));if(!selectedCase)return;
    renderSupportList();const messages=supportMessages.filter(m=>String(m.case_id)===String(selectedCase.id));const ride=relatedRide(selectedCase);
    q('#supportCaseDetail').innerHTML=`<div class="support-detail-head"><div><h3>#${escHtml(selectedCase.case_number)} · ${escHtml(selectedCase.subject)}</h3><small>${escHtml(selectedCase.created_by_role)} · ${escHtml(selectedCase.created_by_id)} · ${escHtml(dateFmt(selectedCase.created_at))}</small></div><div class="support-actions"><button class="neutral" data-case-action="review">En revisión</button><button class="ok" data-case-action="resolve">Resolver</button><button class="danger" data-case-action="close">Cerrar</button></div></div>${ride?`<div class="filters ride-action-grid"><button class="neutral" data-case-action="open-ride">Ver viaje</button>${['accepted','arrived','in_progress'].includes(ride.status)?'<button class="ok" data-case-action="finish-ride">Finalizar viaje</button>':''}${ACTIVE_STATUSES.includes(ride.status)?'<button class="danger" data-case-action="cancel-ride">Cancelar y liberar</button>':''}<span class="status ${statusClass(ride.status)}">${escHtml(statusLabel(ride.status))}</span></div>`:''}<div class="support-thread" id="supportThread">${messages.map(m=>`<div class="support-msg ${m.sender_role==='admin'?'admin':''}">${escHtml(m.message)}<small>${escHtml(m.sender_role==='admin'?'Administración':m.sender_role)} · ${escHtml(dateFmt(m.created_at))}</small></div>`).join('')||'<div class="empty">No hay mensajes adicionales.</div>'}</div><form class="support-reply" id="supportReply"><input id="supportReplyText" maxlength="1800" placeholder="Responder al usuario…"><button>Enviar respuesta</button></form>`;
    q('#supportThread').scrollTop=q('#supportThread').scrollHeight;
    q('#supportReply').onsubmit=e=>{e.preventDefault();sendSupportReply()};
    q('#supportCaseDetail').onclick=e=>{const b=e.target.closest('[data-case-action]');if(!b)return;handleCaseAction(b.dataset.caseAction)};
  }
  async function sendSupportReply(){
    const input=q('#supportReplyText'),message=input.value.trim();if(!message)return;
    const {error}=await sb.from('support_messages').insert({case_id:selectedCase.id,sender_id:ownerIdentity(),sender_role:'admin',message});
    if(error){console.error(error);return toast('No se pudo enviar la respuesta')}
    await sb.from('support_cases').update({status:selectedCase.status==='open'?'in_review':selectedCase.status,assigned_to:ownerIdentity(),updated_at:new Date().toISOString()}).eq('id',selectedCase.id);
    input.value='';toast('Respuesta enviada');await loadSupportData();
  }
  async function updateCaseStatus(status){
    const payload={status,assigned_to:ownerIdentity(),updated_at:new Date().toISOString(),resolved_at:['resolved','closed'].includes(status)?new Date().toISOString():null};
    const {error}=await sb.from('support_cases').update(payload).eq('id',selectedCase.id);if(error)return toast('No se pudo actualizar el caso');
    await sb.from('support_messages').insert({case_id:selectedCase.id,sender_id:ownerIdentity(),sender_role:'system',message:`Estado cambiado a ${caseStatus(status)} por administración.`});
    toast('Caso actualizado');await loadSupportData();
  }
  async function handleCaseAction(action){
    if(action==='review')return updateCaseStatus('in_review');if(action==='resolve')return updateCaseStatus('resolved');if(action==='close')return updateCaseStatus('closed');
    const ride=relatedRide(selectedCase);if(!ride)return toast('El caso no tiene un viaje relacionado');
    if(action==='open-ride'){q('#rideSearch').value=String(ride.id);rideFilter='all';showPage('rides');renderRideTable();return}
    if(action==='finish-ride')return resolveRideAtomic('finish',ride.id,`Caso de soporte #${selectedCase.case_number}: ${selectedCase.subject}`);
    if(action==='cancel-ride')return resolveRideAtomic('cancel',ride.id,`Caso de soporte #${selectedCase.case_number}: ${selectedCase.subject}`);
  }

  async function resolveRideAtomic(action,rideId,defaultReason='Incidencia operativa'){  
    const promptText=action==='finish'?'Motivo o confirmación para finalizar el viaje:':'Motivo para cancelar y liberar el viaje:';
    const reason=prompt(promptText,defaultReason);if(reason===null)return;if(!reason.trim())return toast('El motivo es obligatorio');
    const confirmation=action==='finish'?'¿Confirmas que el viaje terminó y que pasajero y conductor deben quedar liberados?':'¿Cancelar el viaje y liberar al pasajero y al conductor?';
    if(!confirm(confirmation))return;
    const {data,error}=await sb.rpc('admin_resolve_ride',{p_ride_id:String(rideId),p_action:action,p_reason:reason.trim(),p_admin_name:ownerIdentity(),p_admin_code:ADMIN_CODE});
    if(error){console.error(error);const msg=error.message||'';if(msg.includes('CURRENT_STATUS'))return toast('El estado actual del viaje no permite esa acción');return toast('No se pudo procesar el viaje: '+msg)}
    toast(action==='finish'?'Viaje finalizado y perfiles liberados':'Viaje cancelado y perfiles liberados');await refreshOperations();await loadSupportData();return data;
  }

  const originalRideAction=handleRideAdminAction;
  handleRideAdminAction=async function(action,rideId){
    if(action==='finish')return resolveRideAtomic('finish',rideId,'Finalizado por administración');
    if(action==='cancel')return resolveRideAtomic('cancel',rideId,'Incidencia operativa');
    return originalRideAction(action,rideId);
  };

  // Añade controles directos a cada viaje activo.
  const originalRenderRows=renderRows;
  renderRows=function(list,target,compact=false){
    if(target!=='#rideRows')return originalRenderRows(list,target,compact);
    const rows=list.map(ride=>`<tr><td>${dateFmt(ride.created_at)}</td><td><strong>${esc(ride.passenger_name)}</strong></td><td>${esc(ride.driver_name||'Sin asignar')}</td><td>${esc(ride.pickup_address)}</td><td>${esc(ride.destination_address)}</td><td>${esc(ride.vehicle_type)}</td><td><span class="status ${statusClass(ride.status)}">${esc(statusLabel(ride.status))}</span></td><td><strong>${money(ride.price)}</strong></td><td><div class="ride-action-grid"><button class="neutral" data-admin-ride="open" data-ride-id="${esc(ride.id)}">Detalle</button>${['accepted','arrived','in_progress'].includes(ride.status)?`<button class="ok" data-admin-ride="finish" data-ride-id="${esc(ride.id)}">Finalizar</button>`:''}${ACTIVE_STATUSES.includes(ride.status)?`<button class="danger" data-admin-ride="cancel" data-ride-id="${esc(ride.id)}">Cancelar</button>`:''}</div></td></tr>`).join('');
    q(target).innerHTML=rows||'<tr><td colspan="9" class="empty">No hay viajes para mostrar.</td></tr>';
  };
  q('#rideRows')?.addEventListener('click',e=>{const b=e.target.closest('[data-admin-ride]');if(!b)return;const action=b.dataset.adminRide,id=b.dataset.rideId;if(action==='open'){q('#rideSearch').value=id;renderRideTable()}else handleRideAdminAction(action,id)});

  function setupSupportRealtime(){
    if(supportChannel)sb.removeChannel(supportChannel);
    supportChannel=sb.channel('admin-support-v270').on('postgres_changes',{event:'*',schema:'public',table:'support_cases'},loadSupportData).on('postgres_changes',{event:'*',schema:'public',table:'support_messages'},loadSupportData).subscribe();
  }

  installSupportSection();
  // v2.8.0 controla la carga y el tiempo real de soporte para evitar renderizados duplicados.
  window.addEventListener('beforeunload',()=>{if(supportChannel)sb.removeChannel(supportChannel)});
})();

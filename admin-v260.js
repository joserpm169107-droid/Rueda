/* Sobre Ruedas Admin v2.6.0 — suspensiones temporales y eliminación definitiva */
(() => {
  const q=s=>document.querySelector(s);
  const qa=s=>[...document.querySelectorAll(s)];
  const ADMIN_CODE='RUEDA2026';
  let suspensionTarget=null;

  document.title='Sobre Ruedas Admin v2.6.0';
  q('.version').textContent='Admin v2.6.0';
  qa('*').forEach(el=>{
    if(el.childNodes.length===1&&el.firstChild?.nodeType===Node.TEXT_NODE){
      el.textContent=el.textContent.replace(/v2\.5\.1/g,'v2.6.0').replace(/ACTUALIZAR_SUPABASE_v2\.5\.0\.sql/g,'ACTUALIZAR_SUPABASE_v2.6.0.sql');
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
    if(error){console.error(error);return toast('No se pudo suspender. Ejecuta el SQL v2.6.0')}
    toast(`${suspensionTarget.type==='driver'?'Conductor':'Pasajero'} suspendido correctamente`);closeSuspension();await refreshOperations();
  };

  async function unsuspendPerson(personId,type){
    const person=uniquePeople(type).find(p=>String(p.id)===String(personId));
    if(!confirm(`¿Levantar ahora la suspensión de ${person?.name||'esta cuenta'}?`))return;
    const {error}=await sb.rpc('admin_unsuspend_profile',{p_person_id:String(personId),p_role:type,p_admin_name:ownerIdentity(),p_admin_code:ADMIN_CODE});
    if(error){console.error(error);return toast('No se pudo levantar la suspensión. Ejecuta el SQL v2.6.0')}
    toast('Suspensión levantada');await refreshOperations();
  }

  async function permanentDelete(personId,type){
    const person=uniquePeople(type).find(p=>String(p.id)===String(personId));const name=person?.name||'esta cuenta';
    const reason=prompt(`Motivo de la eliminación definitiva de ${name}:`,'Incumplimiento grave de las normas');
    if(reason===null)return;if(!reason.trim())return toast('El motivo es obligatorio');
    const confirmation=prompt(`Esta acción borrará el perfil, las fotos y TODOS sus viajes de la base de datos.\n\nEscribe ELIMINAR para borrar definitivamente a ${name}.`,'');
    if(confirmation!=='ELIMINAR')return toast('Eliminación cancelada');
    const {data,error}=await sb.rpc('admin_delete_person_permanently',{p_person_id:String(personId),p_role:type,p_reason:reason.trim(),p_admin_name:ownerIdentity(),p_admin_code:ADMIN_CODE});
    if(error){console.error(error);return toast('No se pudo eliminar definitivamente. Ejecuta el SQL v2.6.0')}
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

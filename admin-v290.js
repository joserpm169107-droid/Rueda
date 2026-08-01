/* Sobre Ruedas Admin v2.9.0 */
(() => {
  'use strict';
  const VERSION='2.9.0', ADMIN_CODE='RUEDA2026';
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  document.title=`Sobre Ruedas Admin v${VERSION}`;

  function brand(){
    q('.side-brand .mark')?.replaceChildren(Object.assign(document.createElement('img'),{src:'assets/brand-mark.svg',alt:'R'}));
    const mark=q('.side-brand .mark');if(mark){mark.style.background='transparent';mark.style.overflow='hidden'}
    if(q('.version'))q('.version').textContent=`Admin v${VERSION}`;
    qa('body *').forEach(el=>{if(el.childNodes.length===1&&el.firstChild?.nodeType===3)el.textContent=el.textContent.replace(/v2\.(?:5|6|7|8)\.\d/g,`v${VERSION}`).replace(/Ciego de Ávila/g,'Cuba')});
  }
  function hero(){
    const dash=q('#page-dashboard');if(!dash||q('#srAdminHero'))return;
    const box=document.createElement('div');box.id='srAdminHero';box.className='sr-admin-hero';box.innerHTML=`<section class="sr-admin-welcome"><img src="assets/brand-wordmark.svg" alt="Sobre Ruedas Cuba"><h2>Centro de operaciones</h2><p>Supervisa viajes, personas, soporte y alertas desde una sola vista.</p></section><section class="sr-admin-health"><h3>Estado de la plataforma</h3><div class="sr-admin-health-row"><span><i class="sr-dot"></i>Base de datos</span><strong id="srDbState">Conectando</strong></div><div class="sr-admin-health-row"><span><i class="sr-dot"></i>Soporte</span><strong id="srSupportState">Sincronizando</strong></div><div class="sr-admin-health-row"><span><i class="sr-dot"></i>Tiempo real</span><strong id="srRealtimeState">Activo</strong></div></section>`;
    dash.prepend(box);
  }
  function ensureSupportPage(){
    if(q('#page-support'))return;
    const reports=q('[data-page="reports"]');if(reports){const b=document.createElement('button');b.className='nav-btn';b.dataset.page='support';b.textContent='☏ Soporte';reports.after(b)}
    const content=q('.content');if(!content)return;
    const sec=document.createElement('section');sec.id='page-support';sec.className='section-page';sec.innerHTML=`<div class="support-kpis"><div class="support-kpi"><small>ABIERTOS</small><strong id="supportOpenCount">0</strong></div><div class="support-kpi"><small>EN REVISIÓN</small><strong id="supportReviewCount">0</strong></div><div class="support-kpi"><small>ALTA PRIORIDAD</small><strong id="supportHighCount">0</strong></div><div class="support-kpi"><small>EMERGENCIAS</small><strong id="supportEmergencyCount">0</strong></div></div><div class="filters"><input id="supportSearch" placeholder="Buscar caso, usuario o viaje"><select id="supportStatus"><option value="">Todos los estados</option><option value="open">Abierto</option><option value="in_review">En revisión</option><option value="resolved">Resuelto</option></select><select id="supportPriority"><option value="">Todas las prioridades</option><option value="normal">Normal</option><option value="high">Alta</option><option value="emergency">Emergencia</option></select><button id="supportRefresh">Actualizar</button></div><div class="support-layout"><div id="supportCaseList" class="support-list"></div><div id="supportCaseDetail" class="support-detail"><div class="empty">Selecciona un reporte.</div></div></div>`;content.appendChild(sec);
  }

  async function supportCount(){
    if(typeof sb==='undefined')return;
    const r=await sb.from('support_cases').select('id,status,priority',{count:'exact'}).limit(1000);
    if(r.error){if(q('#srSupportState'))q('#srSupportState').textContent='Error';return}
    const rows=r.data||[], count=s=>rows.filter(x=>x.status===s).length;
    if(q('#supportOpenCount'))q('#supportOpenCount').textContent=count('open');if(q('#supportReviewCount'))q('#supportReviewCount').textContent=count('in_review');if(q('#supportHighCount'))q('#supportHighCount').textContent=rows.filter(x=>x.priority==='high').length;if(q('#supportEmergencyCount'))q('#supportEmergencyCount').textContent=rows.filter(x=>x.priority==='emergency').length;
    if(q('#srSupportState'))q('#srSupportState').textContent=`${count('open')+count('in_review')} pendientes`;
    if(q('#srDbState'))q('#srDbState').textContent='Conectada';
  }

  async function deleteV290(button){
    const personId=button.dataset.personId;if(!personId)return;
    let type=button.closest('#passengerCards')?'passenger':'driver';
    if(q('#page-passengers.active'))type='passenger';
    const reason=prompt('Motivo de la eliminación definitiva:','Incumplimiento grave de las normas');if(reason===null||!reason.trim())return;
    if(prompt('Esta acción es irreversible. Escribe ELIMINAR para continuar:','')!=='ELIMINAR')return typeof toast==='function'&&toast('Eliminación cancelada.');
    button.disabled=true;button.textContent='Eliminando…';
    try{
      let r=await sb.rpc('admin_delete_account_v290',{p_person_id:String(personId),p_role:type,p_reason:reason.trim(),p_admin_name:typeof ownerIdentity==='function'?ownerIdentity():'Administración',p_admin_code:ADMIN_CODE});
      if(r.error&&/does not exist|schema cache/i.test(r.error.message||''))r=await sb.rpc('admin_delete_account_v280',{p_person_id:String(personId),p_role:type,p_reason:reason.trim(),p_admin_name:typeof ownerIdentity==='function'?ownerIdentity():'Administración',p_admin_code:ADMIN_CODE});
      if(r.error)throw r.error;
      typeof toast==='function'&&toast('Cuenta eliminada definitivamente.');
      if(typeof refreshOperations==='function')await refreshOperations();
    }catch(e){console.error(e);typeof toast==='function'&&toast('No se pudo eliminar: '+(e.message||e));}
    finally{button.disabled=false;button.textContent='Eliminar definitivamente'}
  }

  function interceptDelete(){
    document.addEventListener('click',e=>{
      const b=e.target.closest('[data-person-action="delete-permanent"],[data-person-action="delete-driver"],[data-person-action="delete-passenger"]');if(!b)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();deleteV290(b);
    },true);
  }

  function bindSupportNav(){
    document.addEventListener('click',e=>{const b=e.target.closest('[data-page="support"]');if(!b)return;setTimeout(supportCount,250)});
    q('#supportRefresh')?.addEventListener('click',supportCount);
  }
  function init(){brand();ensureSupportPage();hero();interceptDelete();bindSupportNav();setTimeout(supportCount,700);setInterval(()=>{if(!document.hidden)supportCount()},7000)}
  setTimeout(init,120);
})();

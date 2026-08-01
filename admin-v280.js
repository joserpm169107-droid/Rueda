/* Sobre Ruedas Admin v2.9.0 — cuentas, viajes y soporte operativo */
(() => {
  'use strict';

  const q = selector => document.querySelector(selector);
  const qa = selector => [...document.querySelectorAll(selector)];
  const VERSION = '2.8.0';
  const ADMIN_CODE = 'RUEDA2026';
  const ACTIVE_RIDES = ['searching', 'accepted', 'arrived', 'in_progress'];
  let supportCasesV280 = [];
  let supportMessagesV280 = [];
  let rideMessagesV280 = [];
  let selectedCaseV280 = null;
  let supportChannelV280 = null;
  let supportPollV280 = null;
  let actionBusyV280 = false;

  document.title = `Sobre Ruedas Admin v${VERSION}`;
  if (q('.version')) q('.version').textContent = `Admin v${VERSION}`;

  function html(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function exactError(error) {
    const raw = error?.message || error?.details || String(error || 'Error desconocido');
    const messages = {
      ADMIN_CODE_INVALID: 'Código administrativo inválido.',
      PROFILE_NOT_FOUND: 'No se encontró el perfil. Actualiza el listado.',
      DELETE_REASON_REQUIRED: 'Debes escribir el motivo de eliminación.',
      ROLE_INVALID: 'El tipo de cuenta no es válido.',
      ACCOUNT_ACTION_INVALID: 'La acción solicitada no es válida.',
      SUSPENSION_DATE_INVALID: 'La fecha de suspensión debe ser futura.',
      SUSPENSION_REASON_REQUIRED: 'Debes escribir el motivo de suspensión.',
      DEACTIVATION_REASON_REQUIRED: 'Debes escribir el motivo de desactivación.',
      RIDE_NOT_FOUND: 'No se encontró el viaje.',
      RIDE_CANNOT_BE_FINISHED_FROM_CURRENT_STATUS: 'Ese viaje no puede finalizarse desde su estado actual.',
      RIDE_CANNOT_BE_CANCELED_FROM_CURRENT_STATUS: 'Ese viaje no puede cancelarse desde su estado actual.'
    };
    const key = Object.keys(messages).find(item => raw.includes(item));
    return key ? messages[key] : raw;
  }

  function personFor(personId, type) {
    try { return uniquePeople(type).find(person => String(person.id) === String(personId)); }
    catch { return null; }
  }

  function profileState(person) {
    const profile = person?.profile || {};
    const suspended = profile.suspended_until && new Date(profile.suspended_until).getTime() > Date.now();
    const deactivated = profile.status !== 'active' || profile.approval_status === 'rejected';
    const approved = profile.approval_status === 'approved';
    return { profile, suspended, deactivated, approved };
  }

  function parseSuspensionUntil(input) {
    const clean = String(input || '').trim();
    if (/^\d+$/.test(clean)) {
      const days = Number(clean);
      if (days < 1 || days > 3650) return null;
      return new Date(Date.now() + days * 86400000).toISOString();
    }
    const date = new Date(clean.length === 10 ? `${clean}T23:59:59` : clean);
    return Number.isNaN(date.getTime()) || date.getTime() <= Date.now() ? null : date.toISOString();
  }

  async function setAccountStateV280(personId, type, action) {
    if (actionBusyV280) return;
    const person = personFor(personId, type);
    const name = person?.name || 'esta cuenta';
    let until = null;
    let reason = '';

    if (action === 'suspend') {
      const duration = prompt(`Suspender a ${name}.\n\nEscribe la cantidad de días (por ejemplo 60) o una fecha YYYY-MM-DD:`, '60');
      if (duration === null) return;
      until = parseSuspensionUntil(duration);
      if (!until) return toast('Fecha o duración de suspensión inválida.');
      reason = prompt('Motivo de la suspensión:', 'Incumplimiento de las normas') ?? '';
      if (!reason.trim()) return toast('El motivo es obligatorio.');
      if (!confirm(`¿Suspender a ${name} hasta ${new Date(until).toLocaleString('es-CU')}?\nLos viajes activos se cancelarán y la cuenta quedará bloqueada.`)) return;
    } else if (action === 'deactivate') {
      reason = prompt(`Motivo para desactivar a ${name}:`, 'Cuenta desactivada por administración') ?? '';
      if (!reason.trim()) return toast('El motivo es obligatorio.');
      if (!confirm(`¿Desactivar a ${name}? No podrá usar la plataforma hasta que sea reactivado.`)) return;
    } else if (action === 'unsuspend') {
      if (!confirm(`¿Levantar ahora la suspensión de ${name}?`)) return;
      reason = 'Suspensión levantada por administración';
    } else if (action === 'reactivate') {
      if (!confirm(`¿Reactivar la cuenta de ${name}?`)) return;
      reason = 'Cuenta reactivada por administración';
    }

    actionBusyV280 = true;
    try {
      const { data, error } = await sb.rpc('admin_set_account_state_v280', {
        p_person_id: String(personId),
        p_role: type,
        p_action: action,
        p_until: until,
        p_reason: reason,
        p_admin_name: ownerIdentity(),
        p_admin_code: ADMIN_CODE
      });
      if (error) throw error;
      const canceled = Number(data?.rides_canceled || 0);
      const labels = { suspend: 'Cuenta suspendida', unsuspend: 'Suspensión levantada', deactivate: 'Cuenta desactivada', reactivate: 'Cuenta reactivada' };
      toast(`${labels[action]}.${canceled ? ` ${canceled} viaje(s) cancelado(s).` : ''}`);
      await refreshOperations();
      await loadSupportV280();
    } catch (error) {
      console.error('Estado de cuenta v2.9.0:', error);
      toast('No se pudo completar la acción: ' + exactError(error));
    } finally {
      actionBusyV280 = false;
    }
  }

  async function deleteAccountV280(personId, type) {
    if (actionBusyV280) return;
    const person = personFor(personId, type);
    const name = person?.name || 'esta cuenta';
    const reason = prompt(`Motivo para eliminar definitivamente a ${name}:`, 'Incumplimiento grave de las normas');
    if (reason === null) return;
    if (!reason.trim()) return toast('El motivo es obligatorio.');
    const confirmation = prompt(
      `ATENCIÓN: se eliminarán definitivamente perfil, viajes, mensajes, reportes y fotografías relacionados con ${name}.\n\nEscribe ELIMINAR para continuar:`,
      ''
    );
    if (confirmation !== 'ELIMINAR') return toast('Eliminación cancelada.');

    actionBusyV280 = true;
    const buttons = qa('[data-person-id]').filter(button => String(button.dataset.personId) === String(personId) && button.dataset.personAction === 'delete-permanent');
    buttons.forEach(button => { button.disabled = true; button.textContent = 'Eliminando…'; });
    try {
      const { data, error } = await sb.rpc('admin_delete_account_v280', {
        p_person_id: String(personId),
        p_role: type,
        p_reason: reason.trim(),
        p_admin_name: ownerIdentity(),
        p_admin_code: ADMIN_CODE
      });
      if (error) throw error;
      toast(`Cuenta eliminada definitivamente. ${Number(data?.rides_deleted || 0)} viaje(s) borrado(s).`);
      try { closeOpsModal?.(); } catch {}
      await refreshOperations();
      await loadSupportV280();
    } catch (error) {
      console.error('Eliminación v2.9.0:', error);
      toast('No se pudo eliminar la cuenta: ' + exactError(error));
    } finally {
      actionBusyV280 = false;
      buttons.forEach(button => { button.disabled = false; button.textContent = 'Eliminar definitivamente'; });
    }
  }

  const previousHandlePersonAction = handlePersonAction;
  handlePersonAction = async function (action, personId, type = 'driver') {
    if (action === 'suspend') return setAccountStateV280(personId, type, 'suspend');
    if (action === 'unsuspend') return setAccountStateV280(personId, type, 'unsuspend');
    if (action === 'deactivate') return setAccountStateV280(personId, type, 'deactivate');
    if (action === 'reactivate') return setAccountStateV280(personId, type, 'reactivate');
    if (['delete-permanent', 'delete-driver', 'delete-passenger'].includes(action)) return deleteAccountV280(personId, type);
    return previousHandlePersonAction(action, personId, type);
  };

  function accountButtonsV280(person, type) {
    const { suspended, deactivated, approved, profile } = profileState(person);
    const id = html(person.id);
    const base = `<button class="neutral" data-person-action="trips" data-person-id="${id}">Viajes</button>`;
    const reports = type === 'driver' ? `<button class="neutral" data-person-action="reports" data-person-id="${id}">Reportes</button>` : '';
    const approval = type === 'driver' && !approved && !deactivated
      ? `<button class="ok" data-person-action="approve" data-person-id="${id}">Aprobar</button>` : '';
    const suspend = suspended
      ? `<button class="ok" data-person-action="unsuspend" data-person-id="${id}">Levantar suspensión</button>`
      : `<button class="warning" data-person-action="suspend" data-person-id="${id}">Suspender</button>`;
    const deactivate = deactivated
      ? `<button class="ok" data-person-action="reactivate" data-person-id="${id}">Reactivar</button>`
      : `<button class="warning" data-person-action="deactivate" data-person-id="${id}">Desactivar</button>`;
    const remove = `<button class="danger" data-person-action="delete-permanent" data-person-id="${id}">Eliminar definitivamente</button>`;
    const state = suspended
      ? `<div class="admin-reason sr-v280-admin-state">Suspendido hasta ${html(new Date(profile.suspended_until).toLocaleString('es-CU'))}${profile.suspension_reason ? ` · ${html(profile.suspension_reason)}` : ''}</div>`
      : deactivated && profile.deactivation_reason
        ? `<div class="admin-reason sr-v280-admin-state">Desactivado · ${html(profile.deactivation_reason)}</div>` : '';
    return { buttons: `<div class="actions wrap sr-v280-person-actions">${base}${reports}${approval}${suspend}${deactivate}${remove}</div>`, state };
  }

  function patchPeopleCardsV280(type) {
    const container = q(type === 'driver' ? '#driverCards' : '#passengerCards');
    if (!container) return;
    const people = uniquePeople(type);
    container.querySelectorAll('.person[data-person-id]').forEach(card => {
      const person = people.find(item => String(item.id) === String(card.dataset.personId));
      if (!person) return;
      const action = accountButtonsV280(person, type);
      card.querySelector('.actions')?.remove();
      card.querySelector('.sr-v280-person-actions')?.remove();
      card.querySelector('.sr-v280-admin-state')?.remove();
      card.insertAdjacentHTML('beforeend', action.state + action.buttons);
    });
  }

  const previousRenderPeople = renderPeople;
  renderPeople = function (type) {
    previousRenderPeople(type);
    patchPeopleCardsV280(type);
  };

  async function resolveRideV280(action, rideId, presetReason = '') {
    if (actionBusyV280) return;
    const verb = action === 'finish' ? 'finalizar' : 'cancelar';
    const reason = prompt(`Motivo para ${verb} este viaje desde administración:`, presetReason || (action === 'finish' ? 'Servicio completado' : 'Incidencia operativa'));
    if (reason === null) return;
    if (!reason.trim()) return toast('El motivo es obligatorio.');
    if (!confirm(action === 'finish'
      ? '¿Finalizar el viaje y liberar automáticamente a pasajero y conductor?'
      : '¿Cancelar el viaje y liberar automáticamente a pasajero y conductor?')) return;
    actionBusyV280 = true;
    try {
      const { data, error } = await sb.rpc('admin_resolve_ride_v280', {
        p_ride_id: String(rideId),
        p_action: action,
        p_reason: reason.trim(),
        p_admin_name: ownerIdentity(),
        p_admin_code: ADMIN_CODE
      });
      if (error) throw error;
      toast(action === 'finish' ? 'Viaje finalizado. Ambas aplicaciones se actualizarán automáticamente.' : 'Viaje cancelado y participantes liberados.');
      await refreshOperations();
      await loadSupportV280();
      return data;
    } catch (error) {
      console.error('Viaje administrativo v2.9.0:', error);
      toast('No se pudo procesar el viaje: ' + exactError(error));
    } finally { actionBusyV280 = false; }
  }

  const previousRideAction = handleRideAdminAction;
  handleRideAdminAction = async function (action, rideId) {
    if (action === 'finish') return resolveRideV280('finish', rideId, 'Finalizado por administración');
    if (action === 'cancel') return resolveRideV280('cancel', rideId, 'Cancelado por administración');
    return previousRideAction(action, rideId);
  };

  function supportReady() {
    return Boolean(q('#page-support') && q('#supportCaseList') && q('#supportCaseDetail'));
  }

  function supportStatus(value) {
    return ({ open: 'Abierto', in_review: 'En revisión', resolved: 'Resuelto', closed: 'Cerrado' })[value] || value || 'Abierto';
  }

  function supportPriority(value) {
    return ({ normal: 'Normal', high: 'Alta', emergency: 'Emergencia' })[value] || value || 'Normal';
  }

  function filteredCasesV280() {
    const text = safeLower(q('#supportSearch')?.value);
    const status = q('#supportStatus')?.value || '';
    const priority = q('#supportPriority')?.value || '';
    return supportCasesV280.filter(item => {
      if (status && item.status !== status) return false;
      if (priority && item.priority !== priority) return false;
      if (!text) return true;
      return [item.case_number, item.created_by_id, item.created_by_role, item.category, item.subject, item.description, item.related_ride_id]
        .some(value => safeLower(value).includes(text));
    });
  }

  function safeLower(value) { return String(value || '').toLowerCase().trim(); }

  function updateSupportCountersV280() {
    const count = status => supportCasesV280.filter(item => item.status === status).length;
    if (q('#supportOpenCount')) q('#supportOpenCount').textContent = count('open');
    if (q('#supportReviewCount')) q('#supportReviewCount').textContent = count('in_review');
    if (q('#supportHighCount')) q('#supportHighCount').textContent = supportCasesV280.filter(item => item.priority === 'high').length;
    if (q('#supportEmergencyCount')) q('#supportEmergencyCount').textContent = supportCasesV280.filter(item => item.priority === 'emergency').length;
    const nav = q('[data-page="support"]');
    if (nav) {
      let badge = nav.querySelector('.support-count-v280');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'support-count-v280';
        nav.appendChild(badge);
      }
      const open = supportCasesV280.filter(item => ['open', 'in_review'].includes(item.status)).length;
      badge.textContent = open;
      badge.classList.toggle('hidden', !open);
    }
  }

  function renderSupportListV280() {
    if (!supportReady()) return;
    const list = q('#supportCaseList');
    const cases = filteredCasesV280();
    list.innerHTML = cases.map(item => `<article class="support-case ${selectedCaseV280?.id === item.id ? 'active' : ''}" data-case-v280="${html(item.id)}">
      <strong>#${html(item.case_number)} · ${html(item.subject)}</strong>
      <small>${html(item.created_by_role === 'driver' ? 'Conductor' : item.created_by_role === 'passenger' ? 'Pasajero' : item.created_by_role)} · ${html(dateFmt(item.created_at))}</small>
      <small>${html(item.description)}</small>
      <div class="support-meta"><span class="support-chip ${html(item.priority)}">${html(supportPriority(item.priority))}</span><span class="support-chip ${['resolved', 'closed'].includes(item.status) ? 'resolved' : ''}">${html(supportStatus(item.status))}</span>${item.related_ride_id ? `<span class="support-chip">Viaje #${html(String(item.related_ride_id).slice(0, 8))}</span>` : ''}</div>
    </article>`).join('') || '<div class="empty">No hay reportes con esos filtros.</div>';
    list.onclick = event => {
      const card = event.target.closest('[data-case-v280]');
      if (card) openSupportCaseV280(card.dataset.caseV280);
    };
    updateSupportCountersV280();
  }

  function relatedRideV280(item) {
    return item?.related_ride_id ? rides.find(ride => String(ride.id) === String(item.related_ride_id)) : null;
  }

  function renderConversationV280(caseItem) {
    const support = supportMessagesV280.filter(message => String(message.case_id) === String(caseItem.id))
      .map(message => ({ ...message, source: 'support' }));
    const chat = caseItem.related_ride_id
      ? rideMessagesV280.filter(message => String(message.ride_id) === String(caseItem.related_ride_id)).map(message => ({ ...message, source: 'ride' }))
      : [];
    return [...support, ...chat].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }

  function openSupportCaseV280(caseId) {
    selectedCaseV280 = supportCasesV280.find(item => String(item.id) === String(caseId));
    if (!selectedCaseV280) return;
    renderSupportListV280();
    const ride = relatedRideV280(selectedCaseV280);
    const conversation = renderConversationV280(selectedCaseV280);
    const detail = q('#supportCaseDetail');
    detail.innerHTML = `<div class="support-detail-head"><div><h3>#${html(selectedCaseV280.case_number)} · ${html(selectedCaseV280.subject)}</h3><small>${html(selectedCaseV280.created_by_role)} · ${html(selectedCaseV280.created_by_id)} · ${html(dateFmt(selectedCaseV280.created_at))}</small></div><div class="support-actions"><button class="neutral" data-case-v280-action="review">En revisión</button><button class="ok" data-case-v280-action="resolve">Resolver</button><button class="danger" data-case-v280-action="close">Cerrar</button></div></div>
      <div class="support-original"><strong>Reporte original</strong><p>${html(selectedCaseV280.description)}</p></div>
      ${ride ? `<div class="filters ride-action-grid"><button class="neutral" data-case-v280-action="open-ride">Ver viaje</button>${['accepted', 'arrived', 'in_progress'].includes(ride.status) ? '<button class="ok" data-case-v280-action="finish-ride">Finalizar viaje</button>' : ''}${ACTIVE_RIDES.includes(ride.status) ? '<button class="danger" data-case-v280-action="cancel-ride">Cancelar y liberar</button>' : ''}<span class="status ${statusClass(ride.status)}">${html(statusLabel(ride.status))}</span></div>` : ''}
      <div class="support-thread" id="supportThreadV280">${conversation.map(message => {
        const role = message.sender_role === 'admin' ? 'Administración' : message.sender_role === 'driver' ? 'Conductor' : message.sender_role === 'passenger' ? 'Pasajero' : 'Sistema';
        return `<div class="support-msg ${message.sender_role === 'admin' ? 'admin' : ''}">${html(message.message)}<small>${html(role)} · ${message.source === 'ride' ? 'Chat del viaje · ' : ''}${html(dateFmt(message.created_at))}</small></div>`;
      }).join('') || '<div class="empty">No hay mensajes adicionales.</div>'}</div>
      <form class="support-reply" id="supportReplyV280"><input id="supportReplyTextV280" maxlength="1800" placeholder="Responder al usuario…"><button>Enviar respuesta</button></form>`;
    const thread = q('#supportThreadV280');
    if (thread) thread.scrollTop = thread.scrollHeight;
    q('#supportReplyV280').onsubmit = event => { event.preventDefault(); sendSupportReplyV280(); };
    detail.onclick = event => {
      const button = event.target.closest('[data-case-v280-action]');
      if (button) handleSupportActionV280(button.dataset.caseV280Action);
    };
  }

  async function sendSupportReplyV280() {
    if (!selectedCaseV280) return;
    const input = q('#supportReplyTextV280');
    const message = String(input?.value || '').trim();
    if (!message) return;
    input.disabled = true;
    try {
      const { error } = await sb.from('support_messages').insert({
        case_id: selectedCaseV280.id,
        sender_id: ownerIdentity(),
        sender_role: 'admin',
        message
      });
      if (error) throw error;
      await sb.from('support_cases').update({
        status: selectedCaseV280.status === 'open' ? 'in_review' : selectedCaseV280.status,
        assigned_to: ownerIdentity(),
        updated_at: new Date().toISOString()
      }).eq('id', selectedCaseV280.id);
      input.value = '';
      toast('Respuesta enviada.');
      await loadSupportV280();
    } catch (error) {
      toast('No se pudo responder: ' + exactError(error));
    } finally { input.disabled = false; }
  }

  async function updateCaseStatusV280(status) {
    if (!selectedCaseV280) return;
    const { error } = await sb.from('support_cases').update({
      status,
      assigned_to: ownerIdentity(),
      resolved_at: ['resolved', 'closed'].includes(status) ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }).eq('id', selectedCaseV280.id);
    if (error) return toast('No se pudo actualizar el caso: ' + exactError(error));
    await sb.from('support_messages').insert({
      case_id: selectedCaseV280.id,
      sender_id: ownerIdentity(),
      sender_role: 'system',
      message: `Estado cambiado a ${supportStatus(status)} por administración.`
    });
    toast('Caso actualizado.');
    await loadSupportV280();
  }

  async function handleSupportActionV280(action) {
    if (action === 'review') return updateCaseStatusV280('in_review');
    if (action === 'resolve') return updateCaseStatusV280('resolved');
    if (action === 'close') return updateCaseStatusV280('closed');
    const ride = relatedRideV280(selectedCaseV280);
    if (!ride) return toast('Este reporte no tiene un viaje relacionado.');
    if (action === 'open-ride') {
      showPage('rides');
      if (q('#rideSearch')) q('#rideSearch').value = String(ride.id);
      renderRideTable();
      return;
    }
    if (action === 'finish-ride') return resolveRideV280('finish', ride.id, `Caso #${selectedCaseV280.case_number}: ${selectedCaseV280.subject}`);
    if (action === 'cancel-ride') return resolveRideV280('cancel', ride.id, `Caso #${selectedCaseV280.case_number}: ${selectedCaseV280.subject}`);
  }

  async function loadSupportV280() {
    if (!supportReady() || !localStorage.getItem('sr_admin_beta')) return;
    const list = q('#supportCaseList');
    if (list && !supportCasesV280.length) list.innerHTML = '<div class="empty">Cargando reportes de soporte…</div>';
    const [cases, messages, rideMessages] = await Promise.all([
      sb.from('support_cases').select('*').order('created_at', { ascending: false }).limit(600),
      sb.from('support_messages').select('*').order('created_at', { ascending: true }).limit(4000),
      sb.from('ride_messages').select('*').order('created_at', { ascending: true }).limit(4000)
    ]);
    if (cases.error) {
      if (list) list.innerHTML = `<div class="empty">No se pudo cargar soporte: ${html(exactError(cases.error))}</div>`;
      return;
    }
    supportCasesV280 = cases.data || [];
    supportMessagesV280 = messages.data || [];
    rideMessagesV280 = rideMessages.data || [];
    renderSupportListV280();
    if (selectedCaseV280) {
      const found = supportCasesV280.find(item => String(item.id) === String(selectedCaseV280.id));
      if (found) openSupportCaseV280(found.id);
      else selectedCaseV280 = null;
    }
  }

  function installSupportV280() {
    if (!supportReady()) return;
    const nav = q('[data-page="support"]');
    if (nav) nav.onclick = () => {
      showPage('support');
      if (q('#pageTitle')) q('#pageTitle').textContent = 'Soporte e incidencias';
      loadSupportV280();
    };
    if (q('#supportRefresh')) q('#supportRefresh').onclick = loadSupportV280;
    if (q('#supportSearch')) q('#supportSearch').oninput = renderSupportListV280;
    if (q('#supportStatus')) q('#supportStatus').onchange = renderSupportListV280;
    if (q('#supportPriority')) q('#supportPriority').onchange = renderSupportListV280;
    if (supportChannelV280) sb.removeChannel(supportChannelV280);
    supportChannelV280 = sb.channel(`admin-support-v280-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_cases' }, loadSupportV280)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_messages' }, loadSupportV280)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_messages' }, loadSupportV280)
      .subscribe();
    clearInterval(supportPollV280);
    supportPollV280 = setInterval(() => { if (!document.hidden) loadSupportV280(); }, 6500);
    loadSupportV280();
  }

  function patchVersionTextV280() {
    qa('body *').forEach(element => {
      if (element.childNodes.length !== 1 || element.firstChild?.nodeType !== Node.TEXT_NODE) return;
      element.textContent = element.textContent.replace(/v2\.7\.1/g, `v${VERSION}`).replace(/ACTUALIZAR_SUPABASE_v2\.7\.1\.sql/g, `ACTUALIZAR_SUPABASE_v${VERSION}.sql`);
    });
  }

  patchVersionTextV280();
  setTimeout(() => {
    try { renderPeople('driver'); renderPeople('passenger'); } catch {}
    installSupportV280();
  }, 520);
  window.addEventListener('online', loadSupportV280);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loadSupportV280(); });
  window.addEventListener('beforeunload', () => {
    clearInterval(supportPollV280);
    if (supportChannelV280) sb.removeChannel(supportChannelV280);
  });
})();

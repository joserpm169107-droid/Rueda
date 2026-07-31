/* Sobre Ruedas v2.8.0 — controlador operativo final */
(() => {
  'use strict';

  const q = selector => document.querySelector(selector);
  const qa = selector => [...document.querySelectorAll(selector)];
  const ROLE = typeof APP_ROLE === 'string' ? APP_ROLE : (document.body.dataset.appRole || 'passenger');
  const VERSION = '2.8.0';
  const ACTIVE = ['searching', 'accepted', 'arrived', 'in_progress'];
  const COMMUNICABLE = ['accepted', 'arrived', 'in_progress'];
  const CLOSED = ['finished', 'canceled'];
  const RIDE_CACHE_KEY = ROLE === 'driver' ? 'rueda_driver_active_ride' : 'rueda_passenger_active_ride';
  const PENDING_RATING_KEY = 'sr_v280_pending_rating';

  let activeRideV280 = null;
  let rideChannelV280 = null;
  let profileChannelV280 = null;
  let pollV280 = null;
  let profilePollV280 = null;
  let syncingRideV280 = false;
  let lastRenderedV280 = '';
  let closingRideV280 = '';
  let ratingValueV280 = 5;
  let profileBlockedV280 = false;
  let subscribedRideIdV280 = null;
  let addressTimerV280 = null;
  let addressRequestV280 = 0;

  document.title = `${ROLE === 'driver' ? 'Sobre Ruedas Conductor' : 'Sobre Ruedas'} v${VERSION}`;
  qa('.brand small').forEach(el => { el.textContent = `CIEGO DE ÁVILA · v${VERSION}`; });

  function safeText(value) {
    return String(value ?? '').trim();
  }

  function html(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function errorMessage(error) {
    const raw = error?.message || error?.details || String(error || 'Error desconocido');
    const known = {
      ACCOUNT_PERMANENTLY_DELETED: 'Esta cuenta fue eliminada definitivamente.',
      DRIVER_NOT_OPERABLE: 'El conductor está suspendido, desactivado o no aprobado.',
      PASSENGER_NOT_OPERABLE: 'El pasajero está suspendido o desactivado.',
      RIDE_NOT_FOUND_OR_NOT_RATEABLE: 'Este viaje no está disponible para calificar.',
      RATING_INVALID: 'Selecciona una calificación entre 1 y 5 estrellas.',
      SUPPORT_DETAILS_REQUIRED: 'Describe el problema con más detalle.'
    };
    const key = Object.keys(known).find(item => raw.includes(item));
    return key ? known[key] : raw;
  }

  function participantKeys() {
    return [...new Set([deviceId, currentProfile?.id, currentProfile?.device_id].filter(Boolean).map(String))];
  }

  function isSuspended(profile) {
    if (!profile?.suspended_until) return false;
    const until = new Date(profile.suspended_until);
    return !Number.isNaN(until.getTime()) && until.getTime() > Date.now();
  }

  function isBlocked(profile) {
    if (!profile) return false;
    return profile.status !== 'active' || ['deleted', 'rejected'].includes(profile.approval_status) || isSuspended(profile);
  }

  function blockedLabel(profile) {
    if (!profile) return '';
    if (isSuspended(profile)) {
      const date = new Date(profile.suspended_until).toLocaleString('es-CU', { dateStyle: 'medium', timeStyle: 'short' });
      return `Cuenta suspendida hasta ${date}`;
    }
    if (profile.status === 'deleted' || profile.approval_status === 'deleted') return 'Cuenta eliminada';
    if (profile.approval_status === 'rejected') return 'Cuenta desactivada o no aprobada';
    return 'Cuenta bloqueada';
  }

  async function accountDeleted() {
    if (!user) return false;
    try {
      const { data, error } = await sb.rpc('is_deleted_account_v280', {
        p_device_id: deviceId,
        p_role: ROLE,
        p_email: user.email || null,
        p_phone: user.phone || null
      });
      if (error) {
        if (!/does not exist|schema cache/i.test(error.message || '')) console.warn(error);
        return false;
      }
      return data === true;
    } catch {
      return false;
    }
  }

  function destroySession(message = 'Esta cuenta fue eliminada definitivamente') {
    clearInterval(pollV280);
    clearInterval(profilePollV280);
    if (rideChannelV280) sb.removeChannel(rideChannelV280);
    if (profileChannelV280) sb.removeChannel(profileChannelV280);
    rideChannelV280 = profileChannelV280 = null;
    try { stopPassengerChannel?.(); } catch {}
    try { stopDriverChannel?.(); } catch {}
    try { stopProfileChannel?.(); } catch {}
    try { localStorage.removeItem(AUTH); } catch {}
    try { localStorage.removeItem(RIDE_CACHE_KEY); } catch {}
    user = null;
    currentProfile = null;
    currentRideId = null;
    incomingRide = null;
    activeRideV280 = null;
    q('#auth')?.classList.remove('hidden');
    ['homePanel', 'tripPanel', 'driverPanel', 'historyPanel', 'savedPanel', 'accountPanel'].forEach(id => q('#' + id)?.classList.add('hidden'));
    toast(message);
  }

  async function fetchProfileV280() {
    if (!user) return null;
    if (await accountDeleted()) {
      destroySession();
      return null;
    }
    const result = await sb.from('profiles').select('*').eq('device_id', deviceId).eq('role', ROLE).maybeSingle();
    if (result.error) {
      console.warn('Perfil v2.8.0:', result.error.message);
      return currentProfile;
    }
    if (!result.data) {
      if (await accountDeleted()) destroySession();
      return null;
    }
    currentProfile = result.data;
    applyOperabilityV280(result.data);
    return result.data;
  }

  function applyOperabilityV280(profile) {
    profileBlockedV280 = isBlocked(profile);
    const label = blockedLabel(profile);
    const roleStatus = q('#roleStatus');
    if (roleStatus) roleStatus.textContent = profileBlockedV280 ? label : 'Cuenta activa.';

    if (ROLE === 'passenger') {
      const request = q('#requestBtn');
      if (request) {
        request.disabled = profileBlockedV280 || Boolean(activeRideV280 && ACTIVE.includes(activeRideV280.status));
        request.title = profileBlockedV280 ? label : '';
      }
    }

    if (ROLE === 'driver' && profileBlockedV280) {
      driverOnline = false;
      q('#onlineToggle')?.classList.remove('on');
      if (q('#onlineText')) q('#onlineText').textContent = isSuspended(profile) ? 'Suspendido' : 'Desactivado';
      q('#driverRequest')?.classList.add('hidden');
      try { stopDriverChannel?.(); } catch {}
      try { stopPresenceHeartbeat?.(); } catch {}
      sb.from('profiles').update({ is_online: false, updated_at: new Date().toISOString() }).eq('id', profile.id).then(() => {});
    }
  }

  function installProfileRealtimeV280() {
    if (!user) return;
    if (profileChannelV280) sb.removeChannel(profileChannelV280);
    profileChannelV280 = sb.channel(`sr-v280-profile-${deviceId}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
        const row = payload.new || payload.old || {};
        if (String(row.device_id || '') !== String(deviceId) || row.role !== ROLE) return;
        if (payload.eventType === 'DELETE') return destroySession();
        currentProfile = payload.new;
        applyOperabilityV280(payload.new);
      })
      .subscribe();
  }

  function rideParticipantMatches(ride) {
    if (!ride) return false;
    const field = ROLE === 'driver' ? ride.driver_id : ride.passenger_id;
    return participantKeys().includes(String(field || ''));
  }

  async function lookupRideByKey(field, key, statuses) {
    const { data, error } = await sb.from('rides').select('*').eq(field, key).in('status', statuses)
      .order('updated_at', { ascending: false }).limit(1);
    if (error) return null;
    return data?.[0] || null;
  }

  async function findActiveRideV280() {
    if (!user || syncingRideV280) return activeRideV280;
    syncingRideV280 = true;
    try {
      if (currentRideId) {
        const direct = await sb.from('rides').select('*').eq('id', currentRideId).maybeSingle();
        if (!direct.error && direct.data) {
          handleRideV280(direct.data);
          return direct.data;
        }
      }

      const field = ROLE === 'driver' ? 'driver_id' : 'passenger_id';
      for (const key of participantKeys()) {
        const ride = await lookupRideByKey(field, key, ACTIVE);
        if (ride) {
          handleRideV280(ride);
          return ride;
        }
      }

      if (activeRideV280?.id) {
        const closed = await sb.from('rides').select('*').eq('id', activeRideV280.id).maybeSingle();
        if (!closed.error && closed.data) handleRideV280(closed.data);
      }

      if (!activeRideV280 && ROLE === 'passenger') await recoverPendingRatingV280();
      return null;
    } finally {
      syncingRideV280 = false;
    }
  }

  function subscribeRideV280(rideId) {
    if (!rideId || (rideChannelV280 && String(subscribedRideIdV280) === String(rideId))) return;
    if (rideChannelV280) sb.removeChannel(rideChannelV280);
    subscribedRideIdV280 = String(rideId);
    rideChannelV280 = sb.channel(`sr-v280-ride-${rideId}-${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` }, payload => handleRideV280(payload.new))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rides' }, payload => {
        if (String(payload.old?.id || '') === String(rideId)) handleClosedRideV280({ ...payload.old, status: 'canceled' });
      })
      .subscribe();
  }

  async function hydrateDriverV280(ride) {
    if (!ride?.driver_id) return ride;
    if (ride.driver_photo && (ride.driver_vehicle_model || ride.vehicle_type)) return ride;
    const candidates = [String(ride.driver_id)];
    let profile = null;
    for (const id of candidates) {
      let result = await sb.from('profiles').select('*').eq('role', 'driver').eq('device_id', id).maybeSingle();
      if (!result.error && result.data) { profile = result.data; break; }
      result = await sb.from('profiles').select('*').eq('role', 'driver').eq('id', id).maybeSingle();
      if (!result.error && result.data) { profile = result.data; break; }
    }
    if (!profile) return ride;
    return {
      ...ride,
      driver_name: ride.driver_name || profile.full_name,
      driver_photo: ride.driver_photo || profile.photo_url,
      driver_rating: ride.driver_rating || profile.rating,
      vehicle_type: ride.vehicle_type || profile.vehicle_type,
      driver_vehicle_make: ride.driver_vehicle_make || profile.vehicle_make,
      driver_vehicle_model: ride.driver_vehicle_model || profile.vehicle_model,
      driver_vehicle_year: ride.driver_vehicle_year || profile.vehicle_year,
      driver_vehicle_color: ride.driver_vehicle_color || profile.vehicle_color,
      driver_vehicle_plate: ride.driver_vehicle_plate || profile.vehicle_plate
    };
  }

  function statusCopyV280(status) {
    return ({
      searching: ['Buscando conductor', 'Estamos enviando tu solicitud a conductores cercanos.'],
      accepted: ['Conductor en camino', 'Sigue su ubicación hasta tu punto de recogida.'],
      arrived: ['Tu conductor llegó', 'Acércate al vehículo y verifica la matrícula.'],
      in_progress: ['Viaje en curso', 'Estás avanzando hacia tu destino.'],
      finished: ['Viaje finalizado', 'Ya puedes revisar el resumen y calificar.'],
      canceled: ['Viaje cancelado', 'La solicitud fue cerrada.']
    })[status] || ['Actualizando viaje', 'Sincronizando información.'];
  }

  function vehicleDescriptionV280(ride) {
    const parts = [ride?.vehicle_type, ride?.driver_vehicle_make, ride?.driver_vehicle_model, ride?.driver_vehicle_year, ride?.driver_vehicle_color].filter(Boolean);
    const plate = ride?.driver_vehicle_plate ? ` · Matrícula ${ride.driver_vehicle_plate}` : '';
    return (parts.join(' · ') || 'Vehículo pendiente de identificar') + plate;
  }

  function setCommunicationV280(ride) {
    const enabled = Boolean(ride && COMMUNICABLE.includes(ride.status) && ride.driver_id && ride.passenger_id);
    ['chatBtn', 'callBtn', 'driverChatV270', 'driverCallV270', 'driverCallPassenger'].forEach(id => {
      const button = q('#' + id);
      if (!button) return;
      button.disabled = !enabled;
      button.setAttribute('aria-disabled', String(!enabled));
      button.title = enabled ? '' : 'Disponible cuando el conductor acepte el viaje';
    });
    q('#driverCommunicationBar')?.classList.toggle('show', enabled);
  }

  async function renderPassengerRideV280(rawRide) {
    const ride = await hydrateDriverV280(rawRide);
    if (!activeRideV280 || String(activeRideV280.id) !== String(ride.id)) return;
    activeRideV280 = ride;
    currentRideId = ride.id;
    incomingRide = ride;
    activeRidePrice = Number(ride.price || 0);
    try { persist(ride); } catch { localStorage.setItem(RIDE_CACHE_KEY, JSON.stringify(ride)); }

    document.body.classList.add('sr-v280-active-ride');
    q('#homePanel')?.classList.add('hidden');
    q('#driverPanel')?.classList.add('hidden');
    q('#historyPanel')?.classList.add('hidden');
    q('#savedPanel')?.classList.add('hidden');
    q('#accountPanel')?.classList.add('hidden');
    q('#v270HelpPanel')?.classList.add('hidden');
    q('#tripPanel')?.classList.remove('hidden');

    const [title, subtitle] = statusCopyV280(ride.status);
    if (q('#tripStatus')) q('#tripStatus').textContent = title;
    if (q('#passengerRouteTitle')) q('#passengerRouteTitle').textContent = title;
    if (q('#passengerRouteMeta')) q('#passengerRouteMeta').textContent = subtitle;
    if (q('#tripCode')) q('#tripCode').textContent = ride.trip_code || '—';
    if (q('#tripPrice')) q('#tripPrice').textContent = `${Math.round(Number(ride.price || 0))} CUP`;
    if (q('#pickupText')) q('#pickupText').textContent = ride.pickup_address || 'Punto de recogida';
    if (q('#distance')) q('#distance').textContent = `${Number(ride.distance_km || 0).toFixed(1)} km`;

    const card = q('#tripPanel .driver-card');
    if (card) {
      const name = card.querySelector('strong');
      const meta = card.querySelector('small');
      if (name) name.textContent = ride.driver_name || (ride.status === 'searching' ? 'Buscando conductor' : 'Conductor asignado');
      if (meta) meta.textContent = ride.driver_id ? vehicleDescriptionV280(ride) : 'Te avisaremos cuando un conductor acepte';
    }
    if (q('#passengerDriverRating')) {
      q('#passengerDriverRating').textContent = ride.driver_id ? `⭐ ${Number(ride.driver_rating || 5).toFixed(1)}` : 'Pendiente';
    }
    const avatar = q('#passengerDriverAvatar');
    if (avatar) avatar.innerHTML = ride.driver_photo ? `<img src="${html(ride.driver_photo)}" alt="Foto del conductor">` : (ride.driver_id ? '🧑🏽‍✈️' : '⌛');

    const progress = { searching: '12%', accepted: '38%', arrived: '62%', in_progress: '84%' }[ride.status] || '12%';
    if (q('#progress')) q('#progress').style.width = progress;
    try { updateTripStage({ searching: 1, accepted: 1, arrived: 2, in_progress: 3 }[ride.status] || 1); } catch {}
    setCommunicationV280(ride);

    if (ride.status === 'searching') {
      if (q('#eta')) q('#eta').textContent = 'Buscando';
    } else {
      try { await updatePassengerLiveMap(ride); } catch (error) { console.warn('Seguimiento:', error); }
    }
    try { setSheetHeight(sheetLimits().min, true); } catch {}
  }

  function renderDriverRideV280(ride) {
    currentRideId = ride.id;
    incomingRide = ride;
    activeRidePrice = Number(ride.price || 0);
    try { persist(ride); } catch { localStorage.setItem(RIDE_CACHE_KEY, JSON.stringify(ride)); }

    document.body.classList.add('sr-v280-active-ride');
    q('#driverSummary')?.classList.add('hidden');
    q('#driverRequest')?.classList.add('hidden');
    q('#driverActiveTrip')?.classList.remove('hidden');
    q('#homePanel')?.classList.add('hidden');
    q('#driverPanel')?.classList.remove('hidden');

    const state = ride.status === 'in_progress' ? 'in_progress' : ride.status === 'arrived' ? 'arrived' : 'accepted';
    driverTripState = state;
    try { setDriverTripState(state); } catch {}
    if (q('#driverPickupAddress')) q('#driverPickupAddress').textContent = ride.pickup_address || 'Punto de recogida';
    if (q('#driverDestinationAddress')) q('#driverDestinationAddress').textContent = ride.destination_address || 'Destino';
    const passengerCard = q('#driverActiveTrip .driver-passenger-card');
    if (passengerCard) {
      const name = passengerCard.querySelector('strong');
      const meta = passengerCard.querySelector('small');
      if (name) name.textContent = ride.passenger_name || 'Pasajero';
      if (meta) meta.textContent = 'Pago en efectivo · viaje protegido';
      const avatar = passengerCard.querySelector('.avatar');
      if (avatar) avatar.innerHTML = ride.passenger_photo ? `<img src="${html(ride.passenger_photo)}" alt="Foto del pasajero">` : '🙋';
    }
    setCommunicationV280(ride);
    try { drawDriverNavigation(ride, state, true); } catch {}
  }

  async function handleRideV280(ride) {
    if (!ride) return;
    if (!rideParticipantMatches(ride) && String(ride.id) !== String(currentRideId || '')) return;
    const fingerprint = `${ride.id}:${ride.status}:${ride.updated_at || ''}:${ride.driver_lat || ''}:${ride.driver_lng || ''}`;
    activeRideV280 = ride;

    if (ACTIVE.includes(ride.status)) {
      currentRideId = ride.id;
      subscribeRideV280(ride.id);
      setCommunicationV280(ride);
      if (ROLE === 'passenger') await renderPassengerRideV280(ride);
      else renderDriverRideV280(ride);
      lastRenderedV280 = fingerprint;
      return;
    }

    if (CLOSED.includes(ride.status)) await handleClosedRideV280(ride);
  }

  async function handleClosedRideV280(ride) {
    const closureKey = `${ride.id}:${ride.status}`;
    if (closingRideV280 === closureKey) return;
    closingRideV280 = closureKey;
    if (rideChannelV280) sb.removeChannel(rideChannelV280);
    rideChannelV280 = null;
    subscribedRideIdV280 = null;
    localStorage.removeItem(RIDE_CACHE_KEY);
    document.body.classList.remove('sr-v280-active-ride');
    activeRideV280 = null;
    currentRideId = null;
    incomingRide = null;
    activeRidePrice = 0;
    setCommunicationV280(null);

    if (ROLE === 'passenger') {
      q('#tripPanel')?.classList.add('hidden');
      q('#homePanel')?.classList.remove('hidden');
      if (ride.status === 'finished') {
        localStorage.setItem(PENDING_RATING_KEY, String(ride.id));
        showRatingV280(ride);
      } else {
        toast('Viaje cancelado. Ya puedes solicitar otro.');
      }
      try { clearRoute(); } catch {}
      try { updateFare(); } catch {}
    } else {
      try { resetDriverAfterRemoteClose(ride.status === 'finished' ? 'Viaje finalizado. Ya puedes recibir otro.' : 'Viaje cancelado. Ya estás disponible.'); }
      catch {
        q('#driverActiveTrip')?.classList.add('hidden');
        q('#driverRequest')?.classList.add('hidden');
        q('#driverSummary')?.classList.remove('hidden');
      }
      await loadEarningsV280();
    }
    setTimeout(() => { closingRideV280 = ''; findActiveRideV280(); }, 800);
  }

  function installGlobalRideOverrideV280() {
    applyPassengerRide = function (ride) { handleRideV280(ride); };
    const oldShowPage = showPage;
    showPage = function (page) {
      oldShowPage(page);
      if (ROLE === 'passenger' && page === 'home' && activeRideV280 && ACTIVE.includes(activeRideV280.status)) renderPassengerRideV280(activeRideV280);
      if (ROLE === 'driver' && page === 'home' && activeRideV280 && ACTIVE.includes(activeRideV280.status)) renderDriverRideV280(activeRideV280);
    };
  }

  function installOperabilityGuardsV280() {
    const toggle = q('#onlineToggle');
    if (toggle) {
      toggle.addEventListener('click', event => {
        if (!profileBlockedV280) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        driverOnline = false;
        toggle.classList.remove('on');
        toast(blockedLabel(currentProfile));
      }, true);
    }
    const accept = q('#acceptBtn');
    if (accept) {
      accept.addEventListener('click', event => {
        if (!profileBlockedV280) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        toast(blockedLabel(currentProfile));
      }, true);
    }
    const request = q('#requestBtn');
    if (request) {
      request.addEventListener('click', event => {
        if (!profileBlockedV280) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        toast(blockedLabel(currentProfile));
      }, true);
    }
  }

  async function loadEarningsV280() {
    if (ROLE !== 'driver') return;
    const summary = { today: 0, week: 0, month: 0, trips_today: 0 };
    try {
      const { data, error } = await sb.rpc('driver_earnings_summary_v280', { p_driver_id: deviceId });
      if (!error && data) Object.assign(summary, data);
      else {
        const keys = participantKeys();
        let rows = [];
        for (const key of keys) {
          const result = await sb.from('rides').select('id,price,finished_at,updated_at,created_at').eq('driver_id', key).eq('status', 'finished');
          if (!result.error) rows.push(...(result.data || []));
        }
        rows = [...new Map(rows.map(row => [String(row.id), row])).values()];
        const now = new Date();
        const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const week = new Date(day); week.setDate(day.getDate() - ((now.getDay() + 6) % 7));
        const month = new Date(now.getFullYear(), now.getMonth(), 1);
        const time = row => new Date(row.finished_at || row.updated_at || row.created_at);
        const sum = start => rows.filter(row => time(row) >= start).reduce((total, row) => total + Number(row.price || 0), 0);
        Object.assign(summary, { today: sum(day), week: sum(week), month: sum(month), trips_today: rows.filter(row => time(row) >= day).length });
      }
    } catch (error) { console.warn('Ganancias v2.8.0:', error); }
    const cup = value => `${Math.round(Number(value) || 0)} CUP`;
    ['earnToday', 'earnTodayPage', 'earnTodayHero'].forEach(id => { if (q('#' + id)) q('#' + id).textContent = cup(summary.today); });
    ['earnWeek', 'earnWeekPage'].forEach(id => { if (q('#' + id)) q('#' + id).textContent = cup(summary.week); });
    ['earnMonth', 'earnMonthPage'].forEach(id => { if (q('#' + id)) q('#' + id).textContent = cup(summary.month); });
    if (q('#earnTripsToday')) {
      const count = Number(summary.trips_today) || 0;
      q('#earnTripsToday').textContent = `${count} viaje${count === 1 ? '' : 's'} completado${count === 1 ? '' : 's'}`;
    }
  }

  function installRatingV280() {
    if (ROLE !== 'passenger') return;
    const stars = qa('#starPicker button');
    stars.forEach(old => {
      const fresh = old.cloneNode(true);
      old.replaceWith(fresh);
      fresh.addEventListener('click', () => {
        ratingValueV280 = Number(fresh.dataset.star) || 5;
        qa('#starPicker button').forEach(button => button.classList.toggle('on', Number(button.dataset.star) <= ratingValueV280));
      });
    });
    const oldSend = q('#sendRatingBtn');
    if (oldSend) {
      const send = oldSend.cloneNode(true);
      oldSend.replaceWith(send);
      send.addEventListener('click', submitRatingV280);
    }
    const oldSkip = q('#skipRatingBtn');
    if (oldSkip) {
      const skip = oldSkip.cloneNode(true);
      oldSkip.replaceWith(skip);
      skip.addEventListener('click', () => {
        q('#ratingModal')?.classList.add('hidden');
        toast('Podrás calificar este viaje al volver a abrir la aplicación.');
      });
    }
  }

  function showRatingV280(ride) {
    if (!ride || ride.rating != null) {
      localStorage.removeItem(PENDING_RATING_KEY);
      return;
    }
    ratingValueV280 = 5;
    if (q('#ratingDriverName')) q('#ratingDriverName').textContent = ride.driver_name || 'Conductor';
    const avatar = q('#ratingDriverAvatar');
    if (avatar) avatar.innerHTML = ride.driver_photo ? `<img src="${html(ride.driver_photo)}" alt="Conductor">` : '🛵';
    if (q('#ratingComment')) q('#ratingComment').value = '';
    qa('#starPicker button').forEach(button => button.classList.toggle('on', Number(button.dataset.star) <= 5));
    if (q('#sendRatingBtn')) q('#sendRatingBtn').dataset.id = String(ride.id);
    q('#ratingModal')?.classList.remove('hidden');
  }

  async function submitRatingV280() {
    const button = q('#sendRatingBtn');
    const rideId = button?.dataset.id || localStorage.getItem(PENDING_RATING_KEY);
    if (!rideId || button?.disabled) return;
    button.disabled = true;
    button.textContent = 'Enviando…';
    const comment = safeText(q('#ratingComment')?.value);
    try {
      const { error } = await sb.rpc('submit_ride_rating_v280', {
        p_ride_id: String(rideId),
        p_passenger_id: deviceId,
        p_rating: ratingValueV280,
        p_comment: comment || null
      });
      if (error) throw error;
      localStorage.removeItem(PENDING_RATING_KEY);
      button.dataset.id = '';
      q('#ratingModal')?.classList.add('hidden');
      toast('Gracias por calificar al conductor.');
      try { loadHistory(); } catch {}
    } catch (error) {
      console.error(error);
      toast('No se pudo enviar la calificación: ' + errorMessage(error));
    } finally {
      button.disabled = false;
      button.textContent = 'Enviar calificación';
    }
  }

  async function recoverPendingRatingV280() {
    if (ROLE !== 'passenger' || !user || activeRideV280) return;
    const cachedId = localStorage.getItem(PENDING_RATING_KEY);
    if (cachedId) {
      const direct = await sb.from('rides').select('*').eq('id', cachedId).maybeSingle();
      if (!direct.error && direct.data?.status === 'finished' && direct.data.rating == null) return showRatingV280(direct.data);
      localStorage.removeItem(PENDING_RATING_KEY);
    }
    for (const key of participantKeys()) {
      const result = await sb.from('rides').select('*').eq('passenger_id', key).eq('status', 'finished').is('rating', null)
        .order('finished_at', { ascending: false }).limit(1);
      if (!result.error && result.data?.[0]) {
        localStorage.setItem(PENDING_RATING_KEY, String(result.data[0].id));
        return showRatingV280(result.data[0]);
      }
    }
  }

  function installSupportSubmitV280() {
    const old = q('#srHelpSubmit');
    if (!old) return;
    const button = old.cloneNode(true);
    old.replaceWith(button);
    button.addEventListener('click', async event => {
      event.preventDefault();
      const description = safeText(q('#srHelpDescription')?.value);
      if (description.length < 8) return toast('Describe el problema con un poco más de detalle.');
      const category = q('[data-help-category].active')?.dataset.helpCategory || 'Otro problema';
      const priority = q('[data-priority].active')?.dataset.priority || 'normal';
      button.disabled = true;
      button.textContent = 'Enviando…';
      try {
        const { data, error } = await sb.rpc('create_support_case_v280', {
          p_creator_id: deviceId,
          p_creator_role: ROLE,
          p_ride_id: currentRideId ? String(currentRideId) : '',
          p_category: category,
          p_subject: category,
          p_description: description,
          p_priority: priority
        });
        if (error) throw error;
        q('#srHelpModal')?.classList.remove('show');
        if (q('#srHelpDescription')) q('#srHelpDescription').value = '';
        toast(`Reporte #${data?.case_number || ''} enviado a administración.`);
        setTimeout(() => q('#v270RefreshCases')?.click(), 250);
      } catch (error) {
        console.error(error);
        toast('No se pudo enviar el reporte: ' + errorMessage(error));
      } finally {
        button.disabled = false;
        button.textContent = 'Enviar a soporte';
      }
    });
  }

  async function fetchAddressJSONV280(url, timeout = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }

  function normalizeAddressResultV280(item, source) {
    if (source === 'photon') {
      const p = item.properties || {};
      const coords = item.geometry?.coordinates || [];
      const label = [p.name, p.street, p.housenumber, p.district, p.city, p.state, p.country].filter(Boolean).join(', ');
      return Number.isFinite(coords[0]) && Number.isFinite(coords[1]) ? { label, point: [coords[1], coords[0]], source } : null;
    }
    return item?.lat && item?.lon ? { label: item.display_name, point: [Number(item.lat), Number(item.lon)], source } : null;
  }

  async function searchAddressesV280(term) {
    const clean = safeText(term);
    if (clean.length < 3) return [];
    const expanded = /cuba|ciego/i.test(clean) ? clean : `${clean}, Ciego de Ávila, Cuba`;
    const photon = new URLSearchParams({ q: expanded, limit: '8', lang: 'es', lat: String(currentStart[0]), lon: String(currentStart[1]) });
    const nominatim = new URLSearchParams({ q: expanded, format: 'jsonv2', addressdetails: '1', limit: '8', countrycodes: 'cu', 'accept-language': 'es' });
    const settled = await Promise.allSettled([
      fetchAddressJSONV280(`https://photon.komoot.io/api/?${photon}`),
      fetchAddressJSONV280(`https://nominatim.openstreetmap.org/search?${nominatim}`)
    ]);
    const rows = [];
    if (settled[0].status === 'fulfilled') rows.push(...(settled[0].value.features || []).map(item => normalizeAddressResultV280(item, 'photon')));
    if (settled[1].status === 'fulfilled') rows.push(...(settled[1].value || []).map(item => normalizeAddressResultV280(item, 'nominatim')));
    const unique = new Map();
    rows.filter(Boolean).forEach(row => {
      const key = `${row.point[0].toFixed(5)},${row.point[1].toFixed(5)}`;
      if (!unique.has(key)) unique.set(key, row);
    });
    return [...unique.values()].slice(0, 10);
  }

  function renderAddressV280(results, query) {
    const box = q('#addressSuggestions');
    if (!box) return;
    const manual = `<button type="button" class="address-suggestion sr-v280-manual-pin" data-v280-manual="1"><span>📍</span><div><strong>Marcar el punto en el mapa</strong><small>No encuentro “${html(query)}”</small></div></button>`;
    box.innerHTML = results.map((result, index) => `<button type="button" class="address-suggestion" data-v280-address="${index}"><span>⌖</span><div><strong>${html(result.label.split(',')[0] || result.label)}</strong><small>${html(result.label)}</small></div></button>`).join('') + manual;
    box.classList.remove('hidden');
    box.onclick = async event => {
      const manualButton = event.target.closest('[data-v280-manual]');
      if (manualButton) {
        box.classList.add('hidden');
        startPinMode('destination');
        return;
      }
      const button = event.target.closest('[data-v280-address]');
      if (!button) return;
      const result = results[Number(button.dataset.v280Address)];
      if (!result) return;
      q('#destination').value = result.label;
      destinationPoint = result.point;
      pendingDestination = null;
      setDestinationPoint(result.point, result.label);
      box.classList.add('hidden');
      try { await prepareRealRoute(true); } catch (error) { toast('Dirección seleccionada. No se pudo calcular la ruta todavía.'); }
    };
  }

  async function executeAddressSearchV280(explicit = false) {
    const input = q('#destination');
    const box = q('#addressSuggestions');
    if (!input || !box) return;
    const term = safeText(input.value);
    if (term.length < 3) {
      if (explicit) toast('Escribe al menos tres caracteres.');
      box.classList.add('hidden');
      return;
    }
    const request = ++addressRequestV280;
    box.innerHTML = '<div class="address-loading">Buscando direcciones y lugares…</div>';
    box.classList.remove('hidden');
    try {
      const results = await searchAddressesV280(term);
      if (request !== addressRequestV280) return;
      renderAddressV280(results, term);
      if (!results.length && explicit) toast('No encontramos esa dirección. Puedes marcarla directamente en el mapa.');
    } catch (error) {
      if (request !== addressRequestV280) return;
      console.warn('Buscador v2.8.0:', error);
      renderAddressV280([], term);
      if (explicit) toast('No se pudo consultar el buscador. Marca el punto en el mapa.');
    }
  }

  function installAddressSearchV280() {
    if (ROLE !== 'passenger') return;
    const oldInput = q('#destination');
    if (!oldInput) return;
    const input = oldInput.cloneNode(true);
    oldInput.replaceWith(input);
    input.addEventListener('input', () => {
      clearTimeout(addressTimerV280);
      addressTimerV280 = setTimeout(() => executeAddressSearchV280(false), 420);
    });
    input.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      executeAddressSearchV280(true);
    }, true);
    const old = q('#searchAddressBtn');
    if (old) {
      const button = old.cloneNode(true);
      old.replaceWith(button);
      button.addEventListener('click', () => executeAddressSearchV280(true));
    }
  }

  function bindEarningsV280() {
    if (ROLE !== 'driver') return;
    earnings = loadEarningsV280;
    ['refreshEarningsBtn','refreshEarningsPage'].forEach(id => { const button=q('#'+id); if(button) button.onclick=loadEarningsV280; });
  }

  async function bootstrapV280() {
    if (!user) return;
    installSupportSubmitV280();
    bindEarningsV280();
    await fetchProfileV280();
    installProfileRealtimeV280();
    await findActiveRideV280();
    if (ROLE === 'driver') await loadEarningsV280();
    clearInterval(pollV280);
    pollV280 = setInterval(() => { if (!document.hidden && user) findActiveRideV280(); }, 2600);
    clearInterval(profilePollV280);
    profilePollV280 = setInterval(() => { if (!document.hidden && user) fetchProfileV280(); }, 6500);
  }

  installGlobalRideOverrideV280();
  installOperabilityGuardsV280();
  installRatingV280();
  installAddressSearchV280();
  setTimeout(installSupportSubmitV280, 100);

  const oldOpenApp = openApp;
  openApp = function () {
    oldOpenApp();
    setTimeout(bootstrapV280, 220);
  };

  setTimeout(bootstrapV280, 450);
  window.addEventListener('online', () => { findActiveRideV280(); fetchProfileV280(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    findActiveRideV280();
    fetchProfileV280();
    if (ROLE === 'driver') loadEarningsV280();
  });
  window.addEventListener('beforeunload', () => {
    clearInterval(pollV280);
    clearInterval(profilePollV280);
    if (rideChannelV280) sb.removeChannel(rideChannelV280);
    if (profileChannelV280) sb.removeChannel(profileChannelV280);
  });
})();

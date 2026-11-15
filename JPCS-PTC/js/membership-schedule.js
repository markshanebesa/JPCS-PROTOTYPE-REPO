document.addEventListener('DOMContentLoaded', () => {
  const panel = document.getElementById('sharedMembershipSchedule');
  if (!panel) return;

  const dateNodes = {
    start: panel.querySelector('[data-schedule-date="start"]'),
    deadline: panel.querySelector('[data-schedule-date="deadline"]'),
    end: panel.querySelector('[data-schedule-date="end"]')
  };
  const captionNodes = {
    start: panel.querySelector('[data-schedule-caption="start"]'),
    deadline: panel.querySelector('[data-schedule-caption="deadline"]'),
    end: panel.querySelector('[data-schedule-caption="end"]')
  };
  const statusNode = panel.querySelector('[data-schedule-status]');
  const statusWrap = panel.querySelector('#sharedScheduleStatus');

  const prettyDate = value => {
    if (!value) return 'Not set';
    const parsed = new Date(value + 'T00:00:00');
    if (Number.isNaN(parsed.getTime())) return 'Not set';
    return parsed.toLocaleDateString('en-PH', {month:'short', day:'numeric', year:'numeric'});
  };
  const dayDiff = (from, to) => Math.ceil((new Date(to + 'T00:00:00') - new Date(from + 'T00:00:00')) / 86400000);

  function renderSchedule() {
    const calendar = typeof getMembershipCalendar === 'function' ? getMembershipCalendar() : null;
    const complete = calendar && calendar.applicationStartDate && calendar.applicationDeadline && calendar.membershipEndDate;
    if (!complete) {
      Object.values(dateNodes).forEach(node => { if (node) node.textContent = 'Not set'; });
      if (statusNode) statusNode.textContent = 'The JPCS administrator has not published the membership schedule yet.';
      panel.classList.add('schedule-not-set');
      if (statusWrap) statusWrap.className = 'shared-schedule-status is-neutral';
      return;
    }

    panel.classList.remove('schedule-not-set');
    dateNodes.start.textContent = prettyDate(calendar.applicationStartDate);
    dateNodes.deadline.textContent = prettyDate(calendar.applicationDeadline);
    dateNodes.end.textContent = prettyDate(calendar.membershipEndDate);

    const today = typeof localDateISO === 'function' ? localDateISO() : new Date().toISOString().slice(0,10);
    let state, message;
    if (today < calendar.applicationStartDate) {
      const days = dayDiff(today, calendar.applicationStartDate);
      state = 'upcoming';
      message = `Applications open on ${prettyDate(calendar.applicationStartDate)}${days > 0 ? ` — ${days} day${days === 1 ? '' : 's'} to go.` : '.'} Please prepare your student information.`;
      captionNodes.start.textContent = 'Opening date';
      captionNodes.deadline.textContent = 'Last day to apply and pay';
      captionNodes.end.textContent = 'Membership expiry';
    } else if (today <= calendar.applicationDeadline) {
      const days = dayDiff(today, calendar.applicationDeadline);
      state = 'open';
      message = `JPCS membership applications are OPEN. Apply and complete in-person payment/verification on or before ${prettyDate(calendar.applicationDeadline)}${days > 0 ? ` (${days} day${days === 1 ? '' : 's'} remaining).` : ' (last day).'} `;
      captionNodes.start.textContent = 'Applications are open';
      captionNodes.deadline.textContent = days === 0 ? 'Deadline is today' : 'Last day to apply and pay';
      captionNodes.end.textContent = 'Membership expiry';
    } else if (today < calendar.membershipEndDate) {
      state = 'closed';
      message = `The application period ended on ${prettyDate(calendar.applicationDeadline)}. Verified Active members remain active until ${prettyDate(calendar.membershipEndDate)}.`;
      captionNodes.start.textContent = 'Application opening date';
      captionNodes.deadline.textContent = 'Application period closed';
      captionNodes.end.textContent = 'Membership expiry';
    } else {
      state = 'expired';
      message = `The application period and membership cycle have ended. The membership end date was ${prettyDate(calendar.membershipEndDate)}. Watch for the next schedule from JPCS.`;
      captionNodes.start.textContent = 'Previous opening date';
      captionNodes.deadline.textContent = 'Previous deadline';
      captionNodes.end.textContent = 'Membership period ended';
    }

    panel.dataset.state = state;
    if (statusNode) statusNode.textContent = message;
    if (statusWrap) statusWrap.className = `shared-schedule-status is-${state}`;
    panel.querySelectorAll('[data-schedule-step]').forEach(card => {
      const step = card.dataset.scheduleStep;
      card.classList.toggle('is-current', (state === 'upcoming' && step === 'start') || (state === 'open' && (step === 'start' || step === 'deadline')) || (state === 'closed' && step === 'end'));
      card.classList.toggle('is-complete', (state === 'open' && step === 'start') || (state === 'closed' && step !== 'end') || state === 'expired');
    });
    panel.querySelectorAll('[data-schedule-track]').forEach((node, index) => {
      node.classList.toggle('is-passed', (state === 'open' && index === 0) || (state === 'closed' && index < 2) || state === 'expired');
    });
  }

  renderSchedule();
  window.addEventListener('storage', event => {
    if (!event.key || event.key === 'jpcsMembershipCalendar') renderSchedule();
  });
  window.addEventListener('jpcs-membership-calendar-updated', renderSchedule);
  window.addEventListener('focus', renderSchedule);
  window.setInterval(renderSchedule, 60000);
});

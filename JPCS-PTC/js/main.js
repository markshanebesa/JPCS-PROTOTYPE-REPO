
// Per-account announcement read receipts (prototype uses this browser's localStorage).
function jpcsAnnouncementReadKey(user = me()){
  const identity = String(user?.email || user?.studentId || 'guest').trim().toLowerCase();
  return 'jpcsAnnouncementReads:' + identity;
}
function jpcsUnreadAnnouncementCount(user = me()){
  if (!user || user.role === 'admin') return 0;
  try {
    const posts = JSON.parse(localStorage.getItem('jpcsAnnouncements') || '[]');
    const readIds = JSON.parse(localStorage.getItem(jpcsAnnouncementReadKey(user)) || '[]');
    const read = new Set(Array.isArray(readIds) ? readIds : []);
    return (Array.isArray(posts) ? posts : []).filter(post => post && post.id && !read.has(post.id)).length;
  } catch (_) { return 0; }
}
function refreshJpcsAnnouncementBadges(){
  const count = jpcsUnreadAnnouncementCount();
  document.querySelectorAll('[data-announcement-badge]').forEach(badge => {
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.hidden = count < 1;
    badge.setAttribute('aria-label', count + ' unread announcements');
  });
}

// Keep the prior V6 migration marker without wiping student records. V7 performs the requested selective cleanup below.
(function preserveExistingPrototypeData(){
  try { if (localStorage.getItem('jpcsV6ResetDone') !== 'yes') localStorage.setItem('jpcsV6ResetDone', 'yes'); }
  catch (error) { console.warn('Could not update JPCS migration marker:', error); }
})();

// V8 requested reset: remove all student-created accounts and their application records,
// while preserving administrator accounts and an active administrator session.
(function resetStudentAccountsKeepAdmin(){
  try {
    if (localStorage.getItem('jpcsV8StudentResetDone') === 'yes') return;
    const accountList = JSON.parse(localStorage.getItem('jpcsUsers') || '[]');
    localStorage.setItem('jpcsUsers', JSON.stringify(accountList.filter(account => account && account.role === 'admin')));
    localStorage.setItem('jpcsApps', JSON.stringify([]));
    localStorage.setItem('jpcsLateApplications', JSON.stringify([]));
    const activeSession = JSON.parse(localStorage.getItem('jpcsMe') || 'null');
    if (activeSession && activeSession.role !== 'admin') localStorage.removeItem('jpcsMe');
    for (let index = localStorage.length - 1; index >= 0; index--) {
      const key = localStorage.key(index);
      if (key && key.startsWith('jpcsAnnouncementReads:')) localStorage.removeItem(key);
    }
    localStorage.setItem('jpcsV8StudentResetDone', 'yes');
  } catch (error) {
    console.warn('Unable to complete the V8 student-account reset:', error);
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  const currentUser = me();
  migrateJpcsDemoRecords();
  syncMembershipStatuses();
  const publicPages = ['index.html', 'login.html', 'signup.html', 'forgot-password.html'];
  const adminPages = ['admin.html', 'members.html', 'applications.html'];

  if (!publicPages.includes(currentPage) && !currentUser) {
    location.replace('login.html');
    return;
  }
  if (adminPages.includes(currentPage) && currentUser && currentUser.role !== 'admin') {
    location.replace('dashboard.html');
    return;
  }
  if (currentUser && currentUser.role === 'admin' && ['dashboard.html','profile.html','membership.html','about.html','benefits.html'].includes(currentPage)) {
    location.replace('admin.html');
    return;
  }
  if (currentUser && currentUser.role !== 'admin' && ['admin.html','members.html','applications.html'].includes(currentPage)) {
    location.replace('dashboard.html');
    return;
  }
  if (['login.html','signup.html'].includes(currentPage) && currentUser) {
    location.replace(currentUser.role === 'admin' ? 'admin.html' : 'dashboard.html');
    return;
  }

  const isSignedIn = !!currentUser;
  const links = document.querySelector('.links');

  if (links) {
    if (!isSignedIn) {
      links.innerHTML = currentPage === 'index.html' || currentPage === 'signup.html'
        ? '<a href="login.html">Login</a><a class="btn primary" href="signup.html">Sign Up</a>'
        : '<a href="login.html">Login</a><a class="btn primary" href="signup.html">Sign Up</a>';
    } else if (currentUser.role === 'admin') {
      const adminLinks = [
        ['admin.html','Admin Panel'],
        ['announcements.html','Announcements']
      ];
      links.innerHTML = adminLinks.map(([href,label]) => `<a href="${href}">${label}</a>`).join('') +
        '<a class="nav-logout" href="#" onclick="logout();return false">Logout</a>';
    } else {
      const memberLinks = [['dashboard.html','My Profile'], ['#studentSettings','Settings']];
      links.innerHTML = memberLinks.map(([href,label]) => `<a href="${href}"${label === 'Settings' ? ' data-open-settings' : ''}>${label}</a>`).join('') +
        '<a class="nav-logout" href="#" onclick="logout();return false">Logout</a>';
    }
    links.querySelectorAll('a[href]').forEach(link => {
      if (link.getAttribute('href') === currentPage) link.setAttribute('aria-current','page');
    });
    links.querySelector('[data-open-settings]')?.addEventListener('click', event => { event.preventDefault(); document.getElementById('studentSettings')?.classList.add('is-open'); if(document.getElementById('studentSettings')) document.getElementById('studentSettings').hidden=false; });
  }

  // Persistent student quick navigation: stays visible on every member page.
  if (isSignedIn && currentUser.role !== 'admin') {
    const appList = (() => { try { return JSON.parse(localStorage.getItem('jpcsApps') || '[]'); } catch (_) { return []; } })();
    const norm = value => String(value || '').trim().toLowerCase();
    const hasApplication = appList.some(item =>
      (currentUser.email && norm(item.accountEmail || item.email) === norm(currentUser.email)) ||
      (currentUser.studentId && norm(item.accountStudentId || item.studentId || item.studentNo) === norm(currentUser.studentId))
    );
    const dock = document.createElement('nav');
    dock.className = 'student-quick-dock';
    dock.setAttribute('aria-label', 'Quick access');
    const items = [
      ['about.html','About JPCS','♧','Learn about the organization'],
      ['announcements.html','Announcements','◉','Updates and activities'],
      ['benefits.html','Member Benefits','🌱','Member opportunities'],
      ['membership.html',hasApplication ? 'Application Submitted' : 'Membership','▤',hasApplication ? 'View your application status' : 'Apply for membership']
    ];
    dock.innerHTML = items.map(([href,label,icon,description]) => {
      const active = href === currentPage;
      return `<a class="quick-dock-item${active ? ' is-active' : ''}" href="${href}"${active ? ' aria-current="page"' : ''}>
        <span class="quick-dock-icon" aria-hidden="true">${icon}</span>
        <span class="quick-dock-copy"><b>${label}</b><small>${description}</small></span>
        ${href === 'announcements.html' ? '<span class="announcement-unread-badge" data-announcement-badge hidden></span>' : ''}
        <span class="quick-dock-indicator" aria-hidden="true"></span>
      </a>`;
    }).join('');
    document.body.appendChild(dock);
    document.body.classList.add('has-student-dock');

    // Also show the unread count on the Announcements shortcut in My Profile.
    if (currentPage === 'dashboard.html') {
      const profileAnnouncementLink = document.querySelector('.dashboard-quick-card[href="announcements.html"]');
      if (profileAnnouncementLink && !profileAnnouncementLink.querySelector('[data-announcement-badge]')) {
        const badge = document.createElement('span');
        badge.className = 'announcement-unread-badge profile-announcement-badge';
        badge.setAttribute('data-announcement-badge', '');
        badge.hidden = true;
        profileAnnouncementLink.appendChild(badge);
      }
    }
    refreshJpcsAnnouncementBadges();
    window.addEventListener('storage', event => {
      if (event.key === 'jpcsAnnouncements' || (event.key || '').startsWith('jpcsAnnouncementReads:')) refreshJpcsAnnouncementBadges();
    });
    window.addEventListener('jpcs-announcements-updated', refreshJpcsAnnouncementBadges);
    window.addEventListener('focus', refreshJpcsAnnouncementBadges);
  }

  const toggle = document.querySelector('.toggle');
  const nav = document.querySelector('.links');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('open') ? 'true' : 'false');
    });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(item => observer.observe(item));
  } else {
    document.querySelectorAll('.reveal').forEach(item => item.classList.add('visible'));
  }

  document.querySelectorAll('[data-year]').forEach(item => item.textContent = new Date().getFullYear());

  document.querySelectorAll('.password-wrap').forEach(wrapper => {
    const input = wrapper.querySelector('input');
    if (!input) return;
    const syncEye = () => wrapper.classList.toggle('has-password', input.value.length > 0);
    input.addEventListener('input', syncEye);
    input.addEventListener('change', syncEye);
    window.addEventListener('pageshow', syncEye);
    syncEye();
  });

  document.querySelectorAll('[data-toggle-password]').forEach(button => {
    const field = document.getElementById(button.dataset.togglePassword);
    if (!field) return;
    const refreshVisibility = () => {
      button.classList.toggle('password-eye-visible', field.value.length > 0);
      if (!field.value && field.type === 'text') {
        field.type = 'password';
        button.setAttribute('aria-label', 'Show password');
        button.setAttribute('title', 'Show password');
        button.setAttribute('aria-pressed', 'false');
      }
    };
    field.addEventListener('input', refreshVisibility);
    field.addEventListener('change', refreshVisibility);
    refreshVisibility();

    button.addEventListener('click', () => {
      const show = field.type === 'password';
      field.type = show ? 'text' : 'password';
      button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      button.setAttribute('title', show ? 'Hide password' : 'Show password');
      button.setAttribute('aria-pressed', show ? 'true' : 'false');
      button.innerHTML = show
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.8 4.4 10 7-.4 1-1.2 2.2-2.4 3.4"/><path d="M6.2 6.2C3.9 7.7 2.5 10 2 12c1.2 0 2.3-.2 3.3-.7"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
    });
  });
});



function localDateISO(){
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0,10);
}

function getMembershipCalendar(){
  try {
    const raw = JSON.parse(localStorage.getItem('jpcsMembershipCalendar') || 'null');
    if (!raw) return null;
    // Migrate the previous two-date calendar to the new three-date structure.
    if (!raw.applicationStartDate && raw.startDate) raw.applicationStartDate = raw.startDate;
    if (!raw.applicationDeadline && raw.endDate) raw.applicationDeadline = raw.endDate;
    if (!raw.membershipEndDate && raw.endDate) raw.membershipEndDate = raw.endDate;
    return raw;
  } catch (_) { return null; }
}
function saveMembershipCalendar(calendar){
  localStorage.setItem('jpcsMembershipCalendar', JSON.stringify(calendar));
}
function membershipApplicationState(calendar = getMembershipCalendar()){
  if (!calendar || !calendar.applicationStartDate || !calendar.applicationDeadline || !calendar.membershipEndDate) return 'not-set';
  if (calendar.applicationDeadline < calendar.applicationStartDate || calendar.membershipEndDate < calendar.applicationStartDate) return 'invalid';
  const today = localDateISO();
  if (today < calendar.applicationStartDate) return 'upcoming';
  if (today > calendar.applicationDeadline) return 'closed';
  return 'open';
}
function membershipWindowState(calendar = getMembershipCalendar()){
  return membershipApplicationState(calendar);
}
function syncMembershipStatuses(){
  try {
    const list = JSON.parse(localStorage.getItem('jpcsApps') || '[]');
    const calendar = getMembershipCalendar();
    if (!calendar) return list;
    const today = localDateISO();
    let changed = false;
    list.forEach(item => {
      if (item.adminManualStatus) return;
      const status = item.status || 'Pending';
      let next = status;
      // Students who did not complete the in-person payment/verification by the
      // application deadline become Inactive. Verified members remain Active
      // until the separate membership end date.
      if (today > calendar.applicationDeadline && status === 'Pending') next = 'Inactive';
      if (today >= calendar.membershipEndDate && (status === 'Active' || status === 'Pending')) next = 'Inactive';
      if (next !== status) {
        item.status = next;
        item.statusUpdatedAt = today;
        changed = true;
      }
    });
    if (changed) localStorage.setItem('jpcsApps', JSON.stringify(list));
    return list;
  } catch (error) {
    console.warn('Unable to refresh membership status:', error);
    return [];
  }
}
function migrateJpcsDemoRecords(){
  try {
    const appsList = JSON.parse(localStorage.getItem('jpcsApps') || '[]');
    let appsChanged = false;
    appsList.forEach(item => {
      const fullName = String(item.fullName || '').toLowerCase().replace(/\s+/g,' ').trim();
      const email = String(item.email || item.accountEmail || '').toLowerCase();
      if (fullName.includes('mark olorvida') || email.startsWith('molorvida@')) {
        if (String(item.studentId) === '1234') { item.studentId = '1233'; appsChanged = true; }
        if (String(item.accountStudentId) === '1234') { item.accountStudentId = '1233'; appsChanged = true; }
      }
    });
    if (appsChanged) localStorage.setItem('jpcsApps', JSON.stringify(appsList));

    const usersList = JSON.parse(localStorage.getItem('jpcsUsers') || '[]');
    let usersChanged = false;
    usersList.forEach(user => {
      const name = String(user.name || '').toLowerCase();
      const email = String(user.email || '').toLowerCase();
      if ((name.includes('mark olorvida') || email.startsWith('molorvida@')) && String(user.studentId) === '1234') {
        user.studentId = '1233'; usersChanged = true;
      }
    });
    if (usersChanged) localStorage.setItem('jpcsUsers', JSON.stringify(usersList));

    const session = JSON.parse(localStorage.getItem('jpcsMe') || 'null');
    if (session) {
      const name = String(session.name || '').toLowerCase();
      const email = String(session.email || '').toLowerCase();
      if ((name.includes('mark olorvida') || email.startsWith('molorvida@')) && String(session.studentId) === '1234') {
        session.studentId = '1233';
        localStorage.setItem('jpcsMe', JSON.stringify(session));
      }
    }
  } catch (error) { console.warn('Unable to migrate JPCS demo records:', error); }
}

function users(){return JSON.parse(localStorage.getItem('jpcsUsers')||'[]')}
function saveUsers(value){localStorage.setItem('jpcsUsers',JSON.stringify(value))}
function apps(){return JSON.parse(localStorage.getItem('jpcsApps')||'[]')}
function saveApps(value){localStorage.setItem('jpcsApps',JSON.stringify(value))}
function me(){return JSON.parse(localStorage.getItem('jpcsMe')||'null')}
function logout(){localStorage.removeItem('jpcsMe');location.href='index.html'}
function alertMsg(element,message,type){if(!element)return;element.textContent=message;element.className='alert show '+type}
function safe(value){return String(value||'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]))}

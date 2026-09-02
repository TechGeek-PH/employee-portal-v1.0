(function() {
  const sidebar = document.querySelector('[data-employee-sidebar]');
  if (!sidebar) return;

  const groups = Array.prototype.slice.call(sidebar.querySelectorAll('.nav-group'));
  const attendanceGroup = groups.find(function(group) {
    const toggle = group.querySelector('.nav-toggle');
    return toggle && /attendance/i.test(toggle.textContent || '');
  });

  if (attendanceGroup) {
    const panel = attendanceGroup.querySelector('.nav-panel');
    if (panel && !panel.querySelector('a[href="on_duty_monitoring.html"]')) {
      const link = document.createElement('a');
      link.href = 'on_duty_monitoring.html';
      link.textContent = 'On Duty Monitoring';
      const timeRecord = panel.querySelector('a[href="daily_time_record.html"]');
      if (timeRecord && timeRecord.nextSibling) panel.insertBefore(link, timeRecord.nextSibling);
      else panel.appendChild(link);
    }
  }

  const operationsGroup = groups.find(function(group) {
    const toggle = group.querySelector('.nav-toggle');
    return toggle && /operations/i.test(toggle.textContent || '');
  });

  if (operationsGroup) {
    const panel = operationsGroup.querySelector('.nav-panel');

    if (panel && !panel.querySelector('a[href="collections.html"]')) {
      const collectionLink = document.createElement('a');
      collectionLink.href = 'collections.html';
      collectionLink.textContent = 'Collections';
      collectionLink.title = 'Collection list, field status updates, notes and monitoring log';
      const nap = panel.querySelector('a[href="nap-checker.html"]');
      if (nap) panel.insertBefore(collectionLink, nap);
      else panel.appendChild(collectionLink);
    }

    if (panel && !panel.querySelector('[data-unified-tech-tickets]')) {
      const link = document.createElement('a');
      link.href = 'https://techgeek-ph.github.io/admin-portal/app.html';
      link.textContent = 'Technician Tickets App';
      link.setAttribute('data-unified-tech-tickets','1');
      link.title = 'Get tickets, choose co-technicians, and update shared field work';
      const legacy = panel.querySelector('a[href="tickets.html"]');
      if (legacy && legacy.nextSibling) panel.insertBefore(link, legacy.nextSibling);
      else panel.appendChild(link);
    }
  }

  const quickActions = document.querySelector('.quick-actions');
  if (quickActions && !quickActions.querySelector('[data-page="collections.html"]')) {
    const button = document.createElement('button');
    button.className = 'action';
    button.type = 'button';
    button.setAttribute('data-page', 'collections.html');
    button.innerHTML = '<span class="action-icon">$</span><span><b>Collections</b><span>View collection list and update field status</span></span>';
    button.addEventListener('click', function() { window.location.href = 'collections.html'; });

    const napButton = quickActions.querySelector('[data-page="nap-checker.html"]');
    if (napButton) quickActions.insertBefore(button, napButton);
    else quickActions.appendChild(button);
  }

  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const links = Array.prototype.slice.call(sidebar.querySelectorAll('a[href]'));

  links.forEach(function(link) {
    const raw = String(link.getAttribute('href') || '');
    if (/^https?:\/\//i.test(raw)) return;
    const href = raw.split('#')[0].split('?')[0].toLowerCase();
    const isActive = href === page;
    link.classList.toggle('is-active', isActive);

    if (isActive) {
      const group = link.closest('.nav-group');
      if (group) {
        group.classList.add('is-open');
        const toggle = group.querySelector('.nav-toggle');
        if (toggle) toggle.classList.add('is-active');
      }
    }
  });

  if (page === 'tickets.html' && !document.querySelector('script[data-ticket-aging-priority]')) {
    const aging = document.createElement('script');
    aging.src = 'https://techgeek-ph.github.io/admin-portal/assets/ticket-aging-priority.js?v=20260902-aging1';
    aging.async = false;
    aging.dataset.ticketAgingPriority = '1';
    document.head.appendChild(aging);
  }
})();

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
})();

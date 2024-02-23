(() => {
  if (!window.$docsify) {
    throw new Error('Docsify must be loaded before installing this plugin.');
  }

  window.$docsify.plugins = window.$docsify.plugins || [];
  window.$docsify.plugins.push(hook => {
    hook.mounted(() => {
      function getTheme() {
        return localStorage.getItem('theme') || 'auto';
      }

      function isDark() {
        if (theme === 'auto') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return theme !== 'light';
      }

      function setTheme(newTheme) {
        const noTransitions = Object.assign(document.createElement('style'), {
          textContent: '* { transition: none !important; }'
        });

        theme = newTheme;
        localStorage.setItem('theme', theme);

        // Update the UI
        // [...menu.querySelectorAll('dwc-menuitem')].map(item => (item.checked = item.getAttribute('value') === theme));
        icon.name = theme === 'auto' ? isDark() ? icons['dark'] : icons['light'] : icons[theme];

        // Toggle the dark mode class without transitions
        document.body.appendChild(noTransitions);
        requestAnimationFrame(() => {
          const attr = theme === 'auto' ? (isDark() ? 'dark' : 'light') : theme;
          document.documentElement.setAttribute('data-app-theme', attr);
          window.dispatchEvent(new CustomEvent('docsify-theme-picker-updated', { detail: attr }));
          requestAnimationFrame(() => document.body.removeChild(noTransitions));
        });

      }

      let theme = getTheme();

      const icons = {
        'light': 'sun',
        'dark': 'shadow',
        'dark-pure': 'moon-stars'
      }
      // Generate the theme picker dropdown
      const icon = document.createElement('dwc-icon');
      icon.name = 'sun';
      const popup = document.createElement('dwc-popupmenu');
      icon.classList.add('theme-picker');
      popup.innerHTML = `
        <dwc-menu>
          <dwc-menuitem label="Light" value="light" checked></dwc-menuitem>
          <dwc-menuitem label="Dark" value="dark"></dwc-menuitem>
          <dwc-menuitem label="Dark Pure" value="dark-pure"></dwc-menuitem>
          <dwc-separator></dwc-separator>
          <dwc-menuitem label="System Preference" value="auto"></dwc-menuitem>
        </dwc-menu>
      `;
      icon.addEventListener('click', (ev) => {
        popup.contextElement = ev.target;
        popup.x = ev.clientX;
        popup.y = ev.clientY;
        popup.opened = !popup.opened;
      })
      document.body.appendChild(popup)
      document.querySelector('.sidebar-toggle').insertAdjacentElement('afterend', icon);

      // Listen for selections
      popup.addEventListener('dwc-clicked', event => setTheme(event.detail.item.getAttribute('value')));

      // Update the theme when the preference changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setTheme(theme));

      // Set the initial theme and sync the UI
      setTheme(theme);
    });
  });
})();
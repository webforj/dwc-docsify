(() => {
  let flavor = getFlavor();
  let count = 1;

  // Sync flavor UI on page load
  setFlavor(getFlavor());

  if (!window.$docsify) {
    throw new Error('Docsify must be loaded before installing this plugin.');
  }

  function getAdjacentExample(name, pre) {
    let currentPre = pre.nextElementSibling;

    while (currentPre?.tagName.toLowerCase() === 'pre') {
      if (currentPre?.getAttribute('data-lang').split(' ').includes(name)) {
        return currentPre;
      }

      currentPre = currentPre.nextElementSibling;
    }

    return null;
  }

  function runScript(script) {
    const newScript = document.createElement('script');

    if (script.type === 'module') {
      newScript.type = 'module';
      newScript.textContent = script.innerHTML;
    } else {
      newScript.appendChild(document.createTextNode(`(() => { ${script.innerHTML} })();`));
    }

    script.parentNode.replaceChild(newScript, script);
  }

  function getFlavor() {
    return localStorage.getItem('flavor') || 'html';
  }

  function setFlavor(newFlavor) {
    flavor = ['html', 'BBj'].includes(newFlavor) ? newFlavor : 'html';
    localStorage.setItem('flavor', flavor);

    // Set the flavor class on the body
    document.body.classList.toggle('flavor-html', flavor === 'html');
    document.body.classList.toggle('flavor-BBj', flavor === 'BBj');
  }

  window.$docsify.plugins = window.$docsify.plugins || []
  window.$docsify.plugins.push(hook => {
    // Convert code blocks to previews
    hook.afterEach((html, next) => {
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(html, 'text/html');

      const htmlButton = /*html*/`
            <button
              type="button"
              title="Show HTML code"
              class="code-block__button code-block__button--html ${flavor === 'html' ? 'code-block__button--selected' : ''}"
            >
              HTML
            </button>
          `;

      const BBjButton = /*html*/`
            <button
              type="button"
              title="Show BBj code"
              class="code-block__button code-block__button--BBj ${flavor === 'BBj' ? 'code-block__button--selected' : ''
        }"
            >
              BBj
            </button>
          `;

      [...doc.querySelectorAll('code[class^="lang-"]')].forEach(code => {
        const isPreview = code.classList.contains('preview')
        if (isPreview) {
          const isExpanded = code.classList.contains('expanded');
          const pre = code.closest('pre');
          const sourceGroupId = `code-block-source-group-${count}`;
          const toggleId = `code-block-toggle-${count}`;
          const BBjPre = getAdjacentExample('BBj', pre);
          const hasBBj = BBjPre !== null;

          pre.setAttribute('data-lang', pre.getAttribute('data-lang').replace(/ preview$/, ''));
          pre.setAttribute('aria-labelledby', toggleId);

          const codeBlock = /*html*/`
<div class="code-block ${isExpanded ? 'code-block--expanded' : ''}">
  <div class="code-block__preview">
    ${code.textContent}
  </div>

  <div class="code-block__source-group" id="${sourceGroupId}">
    ${hasBBj ? /*html*/`
    <div class="code-block__source code-block__source--BBj" data-flavor="BBj"><pre data-lang="BBj"><code class="lang-bbj preview">${Prism.highlight(BBjPre.outerText, Prism.languages.BBj, 'BBj')}</code></pre></div>`
              : ''}

    <div class="code-block__source code-block__source--html" data-flavor="html"><pre data-lang="html"><code class="lang-html preview">${Prism.highlight(pre.outerText, Prism.languages.html, 'html')}</code></pre></div>
  </div>

  <div class="code-block__buttons">
    ${hasBBj ? ` ${BBjButton} ${htmlButton} ` : ''}

    <button
      type="button"
      class="code-block__button code-block__toggle"
      aria-expanded="${isExpanded ? 'true' : 'false'}"
      aria-controls="${sourceGroupId}"
    >
      Source
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
  </div>
</div>`;

          pre.replaceWith(domParser.parseFromString(codeBlock, 'text/html').body);
          BBjPre?.remove();

          count++;
        }
      });

      next(doc.body.innerHTML);
    });


    // After the page is done loading, force scripts in previews to execute
    hook.doneEach(() => {
      [...document.querySelectorAll('.code-block__preview script')].map(script => runScript(script));
    });
  });

  // Toggle source mode
  document.addEventListener('click', event => {
    const button = event.target.closest('button');

    if (button?.classList.contains('code-block__button--html')) {
      setFlavor('html');
    } else if (button?.classList.contains('code-block__button--BBj')) {
      setFlavor('BBj');
    } else {
      return;
    }

    // Update flavor buttons
    [...document.querySelectorAll('.code-block')].forEach(codeBlock => {
      codeBlock
        .querySelector('.code-block__button--html')
        ?.classList.toggle('code-block__button--selected', flavor === 'html');
      codeBlock
        .querySelector('.code-block__button--BBj')
        ?.classList.toggle('code-block__button--selected', flavor === 'BBj');
    });
  });

  // Expand and collapse code blocks
  document.addEventListener('click', event => {
    const toggle = event.target.closest('.code-block__toggle');
    if (toggle) {
      const codeBlock = event.target.closest('.code-block');
      codeBlock.classList.toggle('code-block--expanded');
      event.target.setAttribute('aria-expanded', codeBlock.classList.contains('code-block--expanded'));
    }
  });
})();
// Update year
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// Contact form handling for Netlify Forms (progressive enhancement)
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');

function encode(data) {
  return Object.keys(data)
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
    .join('&');
}

if (form) {
  form.addEventListener('submit', async (e) => {
    // Only enhance if Netlify attributes are present
    const isNetlify = form.hasAttribute('data-netlify');
    if (!isNetlify) return; // allow normal submit

    // In local file preview, avoid network and show guidance
    if (location.protocol === 'file:') {
      e.preventDefault();
      if (status) {
        status.className = 'text-sm text-amber-700';
        status.textContent = 'Form submissions work after deploying to Netlify.';
      }

  // Manual refresh handler (bypass cache)
  if (refreshBtn && citEl && hEl && i10El) {
    refreshBtn.addEventListener('click', () => {
      // reset displays
      citEl.textContent = hEl.textContent = i10El.textContent = '...';
      if (citSrcEl) citSrcEl.textContent = '';
      if (hSrcEl) hSrcEl.textContent = '';
      if (i10SrcEl) i10SrcEl.textContent = '';
      if (updatedEl) updatedEl.textContent = '';
      fetch('/.netlify/functions/scholar?refresh=1')
        .then(r => r.ok ? r.json() : Promise.reject(new Error('Bad response')))
        .then(data => {
          setVals(data.citations, data.hindex, data.i10index);
          setSources(data.sources, 'Google Scholar');
          setUpdated(data.lastUpdated, 'Google Scholar');
          if (!data || !data.citations || !data.hindex || !data.i10index) {
            // continue fallbacks if partial
            fetch('/.netlify/functions/researchid?refresh=1')
              .then(r => r.ok ? r.json() : Promise.reject(new Error('Bad response')))
              .then(d2 => {
                if (d2) {
                  if (!data.citations && d2.citations) citEl.textContent = d2.citations;
                  if (!data.hindex && d2.hindex) hEl.textContent = d2.hindex;
                  if (!data.i10index && d2.i10index) i10El.textContent = d2.i10index;
                  setSources(d2.sources, 'ResearchID.co');
                  setUpdated(d2.lastUpdated, 'ResearchID.co');
                }
              })
              .catch(() => {})
              .finally(() => {
                const missing = citEl.textContent === '—' || citEl.textContent === '...'
                  || hEl.textContent === '—' || hEl.textContent === '...';
                if (missing) {
                  fetch('/.netlify/functions/openalex?refresh=1')
                    .then(r => r.ok ? r.json() : Promise.reject(new Error('Bad response')))
                    .then(d3 => {
                      if (d3) {
                        if (citEl.textContent === '—' || citEl.textContent === '...') citEl.textContent = d3.citations || '—';
                        if (hEl.textContent === '—' || hEl.textContent === '...') hEl.textContent = d3.hindex || '—';
                        if (i10El.textContent === '—' || i10El.textContent === '...') i10El.textContent = d3.i10index || '—';
                        setSources(d3.sources, 'OpenAlex');
                        setUpdated(d3.lastUpdated, 'OpenAlex');
                      }
                    })
                    .catch(() => {});
                }
              });
          }
        })
        .catch(() => {
          // if scholar refresh fails outright, try fallbacks
          fetch('/.netlify/functions/researchid?refresh=1')
            .then(r => r.ok ? r.json() : Promise.reject(new Error('Bad response')))
            .then(d2 => {
              if (d2) {
                setVals(d2.citations, d2.hindex, d2.i10index);
                setSources(d2.sources, 'ResearchID.co');
                setUpdated(d2.lastUpdated, 'ResearchID.co');
              }
            })
            .catch(() => {})
            .finally(() => {
              const missing = citEl.textContent === '—' || citEl.textContent === '...'
                || hEl.textContent === '—' || hEl.textContent === '...';
              if (missing) {
                fetch('/.netlify/functions/openalex?refresh=1')
                  .then(r => r.ok ? r.json() : Promise.reject(new Error('Bad response')))
                  .then(d3 => {
                    if (d3) {
                      setVals(d3.citations, d3.hindex, d3.i10index);
                      setSources(d3.sources, 'OpenAlex');
                      setUpdated(d3.lastUpdated, 'OpenAlex');
                    }
                  })
                  .catch(() => {});
              }
            });
        });
    });
  }
      return;
    }

    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    if (status) {
      status.className = 'text-sm text-slate-600';
      status.textContent = 'Sending...';
    }

    try {
      const data = new FormData(form);
      // honeypot check
      if (data.get('_gotcha')) {
        if (status) {
          status.className = 'text-sm text-slate-600';
          status.textContent = 'Thank you!';
        }
        return;
      }

      // Netlify requires URL-encoded POST to '/'
      const payload = {};
      data.forEach((v, k) => (payload[k] = v));
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode(payload)
      });

      if (res.ok) {
        form.reset();
        if (status) {
          status.className = 'text-sm text-green-700';
          status.textContent = 'Message sent successfully. I will get back to you soon.';
        }
      } else {
        if (status) {
          status.className = 'text-sm text-rose-700';
          status.textContent = 'Something went wrong. Please try again later.';
        }
      }
    } catch (err) {
      if (status) {
        status.className = 'text-sm text-rose-700';
        status.textContent = 'Network error. Please try again.';
      }
    } finally {
      const submitBtn2 = form.querySelector('button[type="submit"]');
      if (submitBtn2) submitBtn2.disabled = false;
    }
  });
}

// Welcome banner
document.addEventListener('DOMContentLoaded', () => {
  const banner = document.getElementById('welcome-banner');
  const closeBtn = document.getElementById('welcome-close');
  const backdrop = document.getElementById('welcome-backdrop');
  if (banner) {
    banner.classList.remove('hidden');
    let timer = setTimeout(() => {
      banner.classList.add('hidden');
    }, 8000);
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        banner.classList.add('hidden');
        clearTimeout(timer);
      });
    }
    if (backdrop) {
      backdrop.addEventListener('click', () => {
        banner.classList.add('hidden');
        clearTimeout(timer);
      });
    }
  }
  // Google Scholar metrics fetch
  const citEl = document.getElementById('citations-value');
  const hEl = document.getElementById('hindex-value');
  const i10El = document.getElementById('i10index-value');
  const updatedEl = document.getElementById('metrics-updated');
  const citSrcEl = document.getElementById('citations-src');
  const hSrcEl = document.getElementById('hindex-src');
  const i10SrcEl = document.getElementById('i10index-src');
  const refreshBtn = document.getElementById('metrics-refresh');
  if (citEl && hEl && i10El) {
    const setVals = (c, h, i10) => {
      if (c) citEl.textContent = c; else citEl.textContent = '—';
      if (h) hEl.textContent = h; else hEl.textContent = '—';
      if (i10) i10El.textContent = i10; else i10El.textContent = '—';
    };
    const setUpdated = (iso, source) => {
      if (!updatedEl) return;
      try {
        const d = iso ? new Date(iso) : new Date();
        updatedEl.textContent = `Last updated: ${d.toLocaleString()} • Source: ${source}`;
      } catch {
        updatedEl.textContent = `Last updated: just now • Source: ${source}`;
      }
    };
    const setSources = (sources, fallbackSource) => {
      const srcs = sources || {};
      // Only set labels if corresponding metric has a value and label not already set
      if (citEl.textContent && citEl.textContent !== '—' && citEl.textContent !== '...') {
        if (citSrcEl && !citSrcEl.textContent) citSrcEl.textContent = srcs.citations || fallbackSource || '';
      }
      if (hEl.textContent && hEl.textContent !== '—' && hEl.textContent !== '...') {
        if (hSrcEl && !hSrcEl.textContent) hSrcEl.textContent = srcs.hindex || fallbackSource || '';
      }
      if (i10El.textContent && i10El.textContent !== '—' && i10El.textContent !== '...') {
        if (i10SrcEl && !i10SrcEl.textContent) i10SrcEl.textContent = srcs.i10index || fallbackSource || '';
      }
    };
    const tryResearchId = () =>
      fetch('/.netlify/functions/researchid')
        .then(r => r.ok ? r.json() : Promise.reject(new Error('Bad response')))
        .then(data => {
          if (data) {
            setVals(data.citations, data.hindex, data.i10index);
            setSources(data.sources, 'ResearchID.co');
            setUpdated(data.lastUpdated, 'ResearchID.co');
          }
        })
        .catch(() => setVals(null, null, null));
    const tryOpenAlex = () =>
      fetch('/.netlify/functions/openalex')
        .then(r => r.ok ? r.json() : Promise.reject(new Error('Bad response')))
        .then(data => {
          if (data) {
            setVals(data.citations, data.hindex, data.i10index);
            setSources(data.sources, 'OpenAlex');
            setUpdated(data.lastUpdated, 'OpenAlex');
          }
        })
        .catch(() => setVals(null, null, null));
    // show loading dots briefly
    citEl.textContent = '...';
    hEl.textContent = '...';
    i10El.textContent = '...';
    fetch('/.netlify/functions/scholar')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Bad response')))
      .then(data => {
        setVals(data.citations, data.hindex, data.i10index);
        setSources(data.sources, 'Google Scholar');
        setUpdated(data.lastUpdated, 'Google Scholar');
        // if any value missing, try ResearchID fallback
        if (!data || !data.citations || !data.hindex || !data.i10index) {
          tryResearchId();
        }
      })
      .catch(() => {
        // fallback to ResearchID on error
        tryResearchId();
      });
    // After ResearchID, if still missing key values, try OpenAlex
    // Use a small delay to allow ResearchID to set values first
    setTimeout(() => {
      const missing = citEl.textContent === '—' || hEl.textContent === '—';
      if (missing) tryOpenAlex();
    }, 2000);
  }
});

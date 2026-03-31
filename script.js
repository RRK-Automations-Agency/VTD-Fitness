/* ============================================
   VTD Fitness Solution — TITAN PULSE INTERACTION ENGINE
   Advanced Scroll, Hover, and Core Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {

  // 1. COMPONENT LOADER
  async function loadComponent(id, url) {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      const res = await fetch(url);
      const html = await res.text();
      el.innerHTML = html;
      initAfterComponents(); // Re-trigger initializations if necessary
    } catch (err) {
      console.error(`Failed to load ${url}:`, err);
    }
  }

  // 2. KINETIC CURSOR (Removed)


  // 3. MAGNETIC BUTTONS
  function initMagnetic() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const magnets = document.querySelectorAll('.btn, .magnetic-wrap');
    magnets.forEach(magnet => {
      magnet.addEventListener('mousemove', (e) => {
        const bounds = magnet.getBoundingClientRect();
        const x = e.clientX - bounds.left - bounds.width / 2;
        const y = e.clientY - bounds.top - bounds.height / 2;
        
        magnet.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        if (magnet.children.length > 0) {
           magnet.children[0].style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
        }
      });
      magnet.addEventListener('mouseleave', () => {
        magnet.style.transform = 'translate(0px, 0px)';
        if (magnet.children.length > 0) {
           magnet.children[0].style.transform = 'translate(0px, 0px)';
        }
      });
    });
  };

  // 4. GLASS PANEL GLOW TRACKING
  const initGlows = () => {
    document.querySelectorAll('.glass-panel, .contact-info-card').forEach(panel => {
      panel.addEventListener('mousemove', (e) => {
        const rect = panel.getBoundingClientRect();
        panel.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        panel.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      });
    });
  };

  // 5. SCROLL REVEAL & TEXT SPLIT
  const initReveals = () => {
    // Wrap text characters for cinematic headers
    document.querySelectorAll('.split-text').forEach(el => {
      const text = el.innerText;
      let html = '';
      text.split(' ').forEach(word => {
        html += `<span class="word">`;
        word.split('').forEach(char => {
          html += `<span class="char">${char}</span>`;
        });
        html += `</span> `;
      });
      el.innerHTML = html;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          
          // If it's a staggered container
          if (entry.target.classList.contains('stagger-box')) {
             const children = entry.target.querySelectorAll('.stagger-item');
             children.forEach((child, i) => {
                 setTimeout(() => child.classList.add('in-view'), i * 150);
             });
          }

          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.anim-el, .split-text, .stagger-box').forEach(el => {
      observer.observe(el);
    });

    // Header Scroll State
    const header = document.querySelector('.header');
    if (header) {
      window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 80);
      });
    }
  };

  // 6. ANIMATED COUNTERS
  const initCounters = () => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const digits = entry.target.querySelectorAll('[data-count]');
          digits.forEach(el => {
            const target = parseInt(el.getAttribute('data-count'), 10);
            const duration = 2500;
            const startStr = el.innerText;
            const startTime = performance.now();
            
            const tick = (now) => {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // easeOutQuart
              const ease = 1 - Math.pow(1 - progress, 4);
              const val = Math.floor(ease * target);
              
              el.innerText = val.toString() + (el.getAttribute('data-suffix') || '');
              
              if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('.stats-container').forEach(c => observer.observe(c));
  };

  // 7. FORM SUBMISSION
  const initForm = () => {
    const form = document.getElementById('contactForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const ogText = btn.innerHTML;
        btn.innerHTML = 'Sending...';
        btn.style.pointerEvents = 'none';
        
        setTimeout(() => {
          btn.innerHTML = 'Message Received <i class="fas fa-check"></i>';
          btn.style.boxShadow = 'inset 0 0 0 1px #25D366';
          
          setTimeout(() => {
            form.reset();
            btn.innerHTML = ogText;
            btn.style.pointerEvents = 'auto';
            btn.style.boxShadow = '';
          }, 3000);
        }, 1500);
      });
    }
  };

  // Helper function to call after lazy loaded components (like header) are injected
  let _hamburgerInitialized = false;
  function initAfterComponents() {
    initMagnetic();
    
    // CRITICAL: Only register hamburger once. This function is called for EACH
    // loadComponent call (header + footer), and duplicate listeners cancel each other.
    if (_hamburgerInitialized) return;
    
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav-menu');
    const overlay = document.getElementById('nav-overlay');
    
    if (hamburger && nav && overlay) {
      _hamburgerInitialized = true;
      
      const toggleMenu = (show) => {
        const isActive = typeof show === 'boolean' ? show : !nav.classList.contains('active');
        nav.classList.toggle('active', isActive);
        overlay.classList.toggle('active', isActive);
        hamburger.innerHTML = isActive 
          ? '<i class="fas fa-times"></i>' 
          : '<i class="fas fa-bars"></i>';
        
        // Prevent scrolling when menu is open
        document.body.style.overflow = isActive ? 'hidden' : '';
      };

      hamburger.addEventListener('click', toggleMenu);
      overlay.addEventListener('click', () => toggleMenu(false));

      nav.querySelectorAll('.nav-link').forEach(l => {
        l.addEventListener('click', () => toggleMenu(false));
      });
    }
  }

  // BOOTSTRAP
  await loadComponent('header', 'components/header.html');
  await loadComponent('footer-placeholder', 'components/footer.html');
  
  initGlows();
  initReveals();
  initCounters();
  initForm();
  
  // Try initializing magnetic after a short delay in case header isn't parsed yet natively
  setTimeout(initMagnetic, 100);
});

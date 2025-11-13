// Mobile nav toggle, smooth-scroll helpers, scroll reveal, form handling, and theme toggle
document.addEventListener('DOMContentLoaded', function(){
  // Update year
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Force dark theme only (site is dark-mode only)
  const html = document.documentElement;

  // THEME: initialize from localStorage, then default to dark to ensure
  // the site loads in dark mode first (avoids a flash of light theme).
  // saved preference still wins when present.
  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme || 'dark';
  html.setAttribute('data-theme', initialTheme);

  // Contrast helper: When in light mode, find very-light text and add a subtle dark background
  function adjustContrastForLightMode(theme){
    // selectors to check (inline highlights, tags, badges, platform buttons, etc.)
    const selectors = [
      '.highlight-text', '.fast-response', '.tag', '.platform-btn', '.platform-buttons a', '.brand-name', '.header-title', '.portfolio-item .portfolio-icon', '.section-title', '.notice-highlight', '.profile-caption'
    ];

    // Remove any previously applied class first
    document.querySelectorAll('.needs-dark-bg').forEach(el => el.classList.remove('needs-dark-bg'));

    if(theme !== 'light') return; // only apply in light mode

    function parseRgb(colorStr){
      if(!colorStr) return null;
      const rgb = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
      if(rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
      // hex fallback
      const hex = colorStr.trim();
      if(hex[0] === '#'){
        let h = hex.slice(1);
        if(h.length === 3) h = h.split('').map(c => c + c).join('');
        if(h.length === 6){
          return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
        }
      }
      return null;
    }

    function luminanceFromRgb([r,g,b]){
      const srgb = [r,g,b].map(v => v/255).map(c => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4));
      return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    }

    const nodes = document.querySelectorAll(selectors.join(','));
    nodes.forEach(el => {
      try{
        const cs = window.getComputedStyle(el);
        const rgb = parseRgb(cs.color);
        if(!rgb) return;
        const lum = luminanceFromRgb(rgb);
        // if text is very light (close to white), give it a subtle dark pill background for legibility
        if(lum > 0.85){
          el.classList.add('needs-dark-bg');
        }
      }catch(err){/* ignore */}
    });
  }

  // Run non-critical tasks during idle to avoid blocking first paint
  function runWhenIdle(fn, timeout = 250){
    if('requestIdleCallback' in window){
      try{ requestIdleCallback(fn, { timeout }); return; }catch(e){}
    }
    // fallback
    setTimeout(fn, timeout);
  }

  // Theme toggle wiring
  const themeToggle = document.getElementById('theme-toggle');
  // Inline SVGs for a slightly more 'futuristic' sun and a simple crescent moon.
  // We inject SVG markup (using currentColor) so it matches surrounding text color and scales crisply.
  const SUN_SVG = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
      <g stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3.2" fill="currentColor" fill-opacity="0.14" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M4.93 4.93l1.41 1.41" />
        <path d="M17.66 17.66l1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="M4.93 19.07l1.41-1.41" />
        <path d="M17.66 6.34l1.41-1.41" />
      </g>
    </svg>`;

  const MOON_SVG = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" opacity="0.98"/>
    </svg>`;
  function applyTheme(t){
    html.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    if(themeToggle){
      const isDark = t === 'dark';
      themeToggle.setAttribute('aria-pressed', String(isDark));
      const icon = themeToggle.querySelector('.theme-icon');
      // Inject inline SVG so the icon looks crisp and 'futuristic' rather than an emoji.
      if(icon) icon.innerHTML = isDark ? MOON_SVG : SUN_SVG;
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    adjustContrastForLightMode(t);
    updateProfileImage(t);
  }

    if(themeToggle){
    // set initial toggle state
    const isDarkInit = initialTheme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDarkInit));
    const iconInit = themeToggle.querySelector('.theme-icon');
    if(iconInit) iconInit.innerHTML = isDarkInit ? MOON_SVG : SUN_SVG;
    themeToggle.addEventListener('click', function(){
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';

      // Create or reuse a full-viewport overlay to smoothly hide flicker during theme swap.
      let overlay = document.querySelector('.theme-transition-overlay');
      if(!overlay){
        overlay = document.createElement('div');
        overlay.className = 'theme-transition-overlay';
        document.body.appendChild(overlay);
      }

      // Pick overlay color based on direction so the fade feels natural
      if(next === 'light'){
        // fade to white then reveal light theme
        overlay.style.backgroundColor = 'rgba(255,255,255,0.94)';
      } else {
        // fade to near-black then reveal dark theme
        overlay.style.backgroundColor = 'rgba(0,0,0,0.92)';
      }

      // Start theme-transition class to scope element transitions
      try{
        html.classList.add('theme-transition');
        window.setTimeout(() => html.classList.remove('theme-transition'), 900);
      }catch(err){ /* ignore */ }

      // Fade overlay in, swap theme when overlay is opaque, then fade out and remove
      overlay.classList.add('active');

      // Wait for overlay fade-in (CSS 350ms) before applying theme to avoid flash
      setTimeout(() => {
        applyTheme(next);

        // give the theme a moment to apply (paint) then fade the overlay out
        setTimeout(() => {
          overlay.classList.remove('active');
          // remove overlay from DOM after fade-out completes
          setTimeout(() => {
            try{ overlay.remove(); }catch(e){}
          }, 420);
        }, 160);
      }, 260);
    });
  }

  // Defer heavy contrast checks until the browser is idle so first paint isn't delayed
  runWhenIdle(() => adjustContrastForLightMode(initialTheme));

  // --- Dynamic profile image switching based on theme ---
  function updateProfileImage(theme){
    const profileImg = document.querySelector('.hero-profile img');
    if(!profileImg) return;
    
    // Fade out
    profileImg.style.opacity = '0';
    
    // Change image after fade starts
    setTimeout(() => {
      if(theme === 'light'){
        // Use white/light version in light mode
        profileImg.src = 'images/ceowhite.jpg';
        profileImg.alt = 'Profile portrait';
      } else {
        // Use original image in dark mode
        profileImg.src = 'images/ceo.jpg';
        profileImg.alt = 'Profile portrait';
      }
      
      // Fade in
      profileImg.style.opacity = '1';
    }, 250);
  }

  // Update profile image on initial load (no animation on first load)
  const profileImg = document.querySelector('.hero-profile img');
  if(profileImg) {
    profileImg.style.opacity = '1';
    if(initialTheme === 'light'){
      profileImg.src = 'images/ceowhite.jpg';
    } else {
      profileImg.src = 'images/ceo.jpg';
    }
  }

  // --- Dynamic blue gradient blobs for background (light mode) ---
  function randomInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)] }

  // darker blue palettes for stronger visual impact
  const bluePalettes = [
    ['#053a8b', '#0b63d9', '#0369a1'],
    ['#023f8a', '#0b4fd6', '#0ea5e9'],
    ['#042f6b', '#075aa8', '#0ea5e9']
  ];

  // Build radial gradients. Positions are computed from a random angle (degrees)
  // which is converted to x/y offsets around center — this gives control via degrees
  // Also adds a black vignette on left/right sides
  function buildRadials(){
    const parts = [];
    const palette = pick(bluePalettes);
    const count = randomInt(2,4);
    for(let i=0;i<count;i++){
      const color = palette[i % palette.length];
      const size = randomInt(28,56); // percent size
      // pick an angle in degrees and a radius offset (how far from center)
      const angleDeg = randomInt(0,359);
      const angleRad = angleDeg * (Math.PI/180);
      const radiusOffset = randomInt(10,40); // percent offset from center
      // compute x/y around center (50% is center)
      const x = 50 + Math.cos(angleRad) * radiusOffset;
      const y = 50 + Math.sin(angleRad) * radiusOffset;
      // darker, slightly stronger alpha for deeper blues
      const alpha = (Math.random() * 0.22 + 0.12).toFixed(3);
      parts.push(`radial-gradient(circle at ${x.toFixed(1)}% ${y.toFixed(1)}%, ${hexToRgba(color, alpha)} ${size}%, transparent 65%)`);
    }
    // Add black vignette gradients on left and right sides
    parts.push('linear-gradient(90deg, #000000 0%, transparent 15%, transparent 85%, #000000 100%)');
    return parts.join(', ');
  }

  function hexToRgba(hex, a){
    const h = hex.replace('#','');
    const bigint = parseInt(h.length===3? h.split('').map(c=>c+c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function applyRandomBackground(){
    const htmlEl = document.documentElement;
    // Background gradients disabled - always clear radials
    htmlEl.style.removeProperty('--bg-radials');
  }

  // Run once on load and again periodically for subtle variation
  applyRandomBackground();
  // refresh every 18-28 seconds
  setInterval(applyRandomBackground, randomInt(18000, 28000));

  // Disable double-tap zoom for app-like feel on mobile
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function(event) {
    const now = Date.now();
    if(now - lastTouchEnd <= 300){
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // Also disable zoom on touch events
  document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
  }, false);

  // Hero section animations and interactions
  const heroCopy = document.querySelector('.hero-copy');
  const ctaButtons = document.querySelectorAll('.cta-row .btn');
  
  // Add hover pulse effect to CTA buttons
  // Use CSS for hover effects (removing inline JS transforms avoids layout thrash and is much cheaper).
  // If you want JS-driven micro-interactions later, prefer toggling a class and scheduling via rAF.

  // Smooth scroll to section functionality
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if(href !== '#' && document.querySelector(href)) {
        e.preventDefault();
        const target = document.querySelector(href);
        // compute header height and optional extra padding on mobile
        const header = document.querySelector('.site-header');
        const headerHeight = header ? header.offsetHeight : 70;
        const extraPadding = window.innerWidth <= 720 ? 20 : 0; // mobile: add 20px top padding
        const rect = target.getBoundingClientRect();
        const top = window.scrollY + rect.top - headerHeight - extraPadding;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });

        // if mobile nav is open, close it and reset toggle state
        const nav = document.getElementById('primary-nav');
        const navToggle = document.querySelector('.nav-toggle');
        if(nav && nav.classList.contains('open')){
          nav.classList.remove('open');
          if(navToggle){
            navToggle.setAttribute('aria-expanded','false');
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-label','Open navigation');
          }
        }
      }
    });
  });

  // Mobile nav toggle with hamburger to X animation
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if(navToggle && nav){
    navToggle.addEventListener('click', function(){
      const expanded = this.getAttribute('aria-expanded') === 'true';
      const newState = !expanded;
      this.setAttribute('aria-expanded', String(newState));
      nav.classList.toggle('open');
      navToggle.classList.toggle('active');
      // update accessible label
      this.setAttribute('aria-label', newState ? 'Close navigation' : 'Open navigation');
    });
  }

  // Close mobile nav when a link is clicked
  nav && nav.addEventListener('click', function(e){
    if(e.target.tagName === 'A'){
      nav.classList.remove('open');
      if(navToggle){
        navToggle.setAttribute('aria-expanded','false');
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-label','Open navigation');
      }
    }
  });

  // Active nav link using IntersectionObserver (far cheaper than measuring offsets on every scroll)
  const sections = Array.from(document.querySelectorAll('main section[id], #home, #about'));
  const navLinks = Array.from(document.querySelectorAll('#primary-nav a'));

  function setActiveLinkById(id){
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === ('#' + id)));
  }

  function observeSectionsForNav(){
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 70;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          const id = entry.target.id;
          if(id) setActiveLinkById(id);
        }
      });
    }, { root: null, rootMargin: `-${headerHeight}px 0px -40% 0px`, threshold: [0.25, 0.5, 0.75] });

    sections.forEach(sec => {
      try{ io.observe(sec); }catch(e){/* ignore */}
    });
  }

  observeSectionsForNav();

  // Give instant feedback when clicking nav links (so the user sees the link active immediately)
  navLinks.forEach(link => {
    link.addEventListener('click', function(){
      navLinks.forEach(a => a.classList.remove('active'));
      this.classList.add('active');
    }, { passive: true });
  });

  // Simple throttle
  function throttle(fn, wait){
    let last = 0;
    return function(...args){
      const now = Date.now();
      if(now - last >= wait){ last = now; fn.apply(this,args); }
    }
  }

  // Scroll reveal for elements with .reveal (or add reveal to sections)
  const observer = new IntersectionObserver((items)=>{
    items.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.08});

  document.querySelectorAll('section, .feature, .plan, .contact-form').forEach(el=>{
    el.classList.add('reveal'); observer.observe(el);
  });



  // Demo button quick-scroll to form and focus
  const demoBtn = document.getElementById('demo-button');
  if(demoBtn){
    demoBtn.addEventListener('click', function(){
      const el = document.getElementById('contact');
      el && el.scrollIntoView({behavior:'smooth',block:'start'});
      setTimeout(()=>{
        const first = form && form.querySelector('input,textarea');
        first && first.focus();
      },450);
    });
  }

  // Contact form submission with email redirection
  function setupContactForm(){
    const form = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if(!form) {
      console.warn('Contact form not found');
      return;
    }

    function showFormStatus(message, type){
      if(formStatus){
        formStatus.textContent = message;
        formStatus.className = `form-status ${type}`;
        formStatus.style.display = 'block';
        
        // Auto-clear success messages after 4 seconds
        if(type === 'success'){
          setTimeout(() => {
            formStatus.style.display = 'none';
          }, 4000);
        }
      }
    }

    form.addEventListener('submit', async function(e){
      e.preventDefault();
      console.log('Form submitted');

  // Get form values
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const serviceSelect = document.getElementById('service');
  const service = serviceSelect ? serviceSelect.value.trim() : '';
  const serviceLabel = (serviceSelect && serviceSelect.options[serviceSelect.selectedIndex]) ? serviceSelect.options[serviceSelect.selectedIndex].text.trim() : '';
  const message = document.getElementById('message').value.trim();

      console.log('Form values:', { name, service, message });

      // Validate required fields
      if(!name){
        showFormStatus('Please enter your full name.', 'error');
        return;
      }
      if(!service){
        showFormStatus('Please select a service.', 'error');
        return;
      }
      if(!message){
        showFormStatus('Please enter your message.', 'error');
        return;
      }

  // Build email subject + body (use human-readable service label instead of the option value)
  const subjectServicePart = service ? ` - ${serviceLabel}` : '';
  const emailSubject = `New Message from ${name}`;

  // Only include the service line in the body when a real service is selected
  const serviceLine = service ? `Service Interest: ${serviceLabel}\n` : '';
  const emailBody = `Hello Mr. Enoch,\n\nMy name is ${name}. I'm contacting you regarding a potential project opportunity and would like to discuss how your expertise can support our goals.\n\nMessage:\n\n${message}\n\n${serviceLine}Phone: ${phone || 'Not provided'}\n\nI look forward to your response and guidance on the next steps.\n\nBest regards,\n${name}`;

        // Create mailto link
        const toAddress = 'chukwudi.enoch.work@gmail.com';
        const mailtoLink = `mailto:${toAddress}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

        console.log('Mailto link:', mailtoLink);

        // Also build common webmail compose URLs (Gmail, Outlook, Yahoo)
        const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(toAddress)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        const outlookLink = `https://outlook.live.com/owa/?path=/mail/action/compose&to=${encodeURIComponent(toAddress)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        const yahooLink = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(toAddress)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

        // Helper to open safely (must be in user gesture to avoid popup blocking)
        function openUrl(url){
          try{
            const win = window.open(url, '_blank');
            // window.open may return null if blocked
            return !!win;
          }catch(err){
            return false;
          }
        }

  // Show a friendly status message
  showFormStatus('Opening your email... Few seconds...', 'success');

        // Detect mobile (prefer native mail apps)
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        if(isMobile){
          // Mobile: use mailto to open native mail app
          console.log('Mobile detected — using mailto');
          clearForm();
          window.location.href = mailtoLink;
          return;
        }

        // Desktop: try to open Gmail compose in a new tab/window
        console.log('Desktop detected — attempting webmail compose');

        // Try opening Gmail in a new tab (most reliable UX). window.open is allowed from user gesture.
        let win = null;
        try{
          win = window.open(gmailLink, '_blank');
        }catch(err){
          console.warn('window.open threw', err);
          win = null;
        }

        if(win){
          console.log('Opened Gmail compose in new tab/window');
          // Clear the form now that the flow has started
          clearForm();
          // Show success message and redirect back to site
          showFormStatus('✓ Message received! Your message will be replied to within the next 4 hours. Thank you!', 'success');
          return;
        }

        // If window.open was blocked, try opening Outlook compose in same tab (navigation)
        try{
          // Clear the form before navigating
          clearForm();
          // Show success message instead of redirecting away
          showFormStatus('✓ Message received! Your message will be replied to within the next 4 hours. Thank you!', 'success');
          // Open in new tab without leaving the page
          window.open(outlookLink, '_blank');
          return;
        }catch(err){
          console.warn('Navigation to Outlook failed', err);
        }

        // Try Yahoo compose
        try{
          clearForm();
          // Show success message instead of redirecting away
          showFormStatus('✓ Message received! Your message will be replied to within the next 4 hours. Thank you!', 'success');
          // Open in new tab without leaving the page
          window.open(yahooLink, '_blank');
          return;
        }catch(err){
          console.warn('Navigation to Yahoo failed', err);
        }

        // Final fallback: use mailto without navigating away
        console.log('All webmail attempts failed or blocked — falling back to mailto');
        try{
          clearForm();
          // Show success message for user
          showFormStatus('✓ Message received! Your message will be replied to within the next 4 hours. Thank you!', 'success');
          // Open mailto without leaving the page
          window.open(mailtoLink, '_blank');
        }catch(err){
          console.warn('mailTo failed', err);
          // As last resort show a visible fallback link for the user to click
          showFormStatus('Could not open your email automatically — click the link below to compose.', 'error');
          addFallbackLink(mailtoLink);
        }
      });

      // Adds a small visible fallback link under the form status
      function addFallbackLink(href){
        const existing = document.getElementById('fallback-email-link');
        if(existing) return;
        const p = document.createElement('p');
        p.className = 'form-status';
        p.style.marginTop = '0.6rem';
        p.innerHTML = `If nothing opened, <a id="fallback-email-link" href="${href}">click here to compose an email</a>.`;
        const container = document.getElementById('form-status')?.parentElement || document.querySelector('.form-actions');
        container && container.appendChild(p);
      }

      function removeFallbackLink(){
        const link = document.getElementById('fallback-email-link');
        if(link){
          const p = link.closest('p');
          p && p.remove();
        }
      }

      function clearForm(){
        try{
          // reset inputs
          form.reset();
          // hide status
          if(formStatus){ formStatus.style.display = 'none'; }
          // remove any fallback
          removeFallbackLink();
        }catch(err){
          console.warn('Failed to clear form', err);
        }
      }
  }

  setupContactForm();

  // Portfolio carousel navigation
  const carouselPrev = document.querySelector('.carousel-prev');
  const carouselNext = document.querySelector('.carousel-next');
  const carouselContainer = document.querySelector('.portfolio-carousel');
  
  if(carouselPrev && carouselNext && carouselContainer){
    const items = Array.from(carouselContainer.querySelectorAll('.portfolio-item'));

    function getCenteredIndex(){
      const center = carouselContainer.scrollLeft + (carouselContainer.clientWidth / 2);
      let bestIndex = 0;
      let bestDistance = Infinity;
      items.forEach((it, idx) => {
        const itemCenter = it.offsetLeft + (it.offsetWidth / 2);
        const dist = Math.abs(itemCenter - center);
        if(dist < bestDistance){ bestDistance = dist; bestIndex = idx; }
      });
      return bestIndex;
    }

    function scrollToIndex(idx){
      const clampedIdx = Math.max(0, Math.min(items.length - 1, idx));
      const item = items[clampedIdx];
      if(!item) return;
      // Use scrollIntoView with smooth behavior and center alignment
      // This respects the scroll-padding-inline set in CSS
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    carouselPrev.addEventListener('click', () => {
      const cur = getCenteredIndex();
      scrollToIndex(cur - 1);
    });

    carouselNext.addEventListener('click', () => {
      const cur = getCenteredIndex();
      scrollToIndex(cur + 1);
    });
  }

  // Make portfolio cards keyboard-focusable and accessible
  const portfolioCards = Array.from(document.querySelectorAll('.portfolio-item'));
  if(portfolioCards.length){
    portfolioCards.forEach((card, idx) => {
      // ensure focusable
      if(!card.hasAttribute('tabindex')) card.setAttribute('tabindex','0');
      if(!card.hasAttribute('role')) card.setAttribute('role','article');

      // provide an accessible label from the heading when possible
      const title = card.querySelector('h3')?.textContent?.trim();
      if(title && !card.hasAttribute('aria-label')){
        card.setAttribute('aria-label', `Project: ${title}`);
      }

      // Activate primary link/button on Enter or Space
      card.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'){
          const primary = card.querySelector('a.btn, button.btn');
          if(primary){
            e.preventDefault();
            primary.click();
          }
        }
      });
    });
  }
});


  // Mail icon behavior: on mobile rewrite the anchor to a mailto and remove target so
  // the native mail app opens. On desktop, attach a click handler that attempts to
  // open Gmail compose in a new tab and falls back to mailto if blocked.
  (function(){
    const links = document.querySelectorAll('a.gmail-link');
    if(!links || !links.length) return;

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if(isMobile){
      // For mobile devices, ensure the anchor uses a mailto: href so the
      // native mail client is used. Also remove target/rel to avoid opening
      // the Gmail web interface in a new tab.
      links.forEach(link => {
        const to = link.dataset.email || (link.getAttribute('href')||'').replace(/^mailto:/i,'');
        if(!to) return;
        link.setAttribute('href', `mailto:${to}`);
        link.removeAttribute('target');
        link.removeAttribute('rel');
      });
      return;
    }

    // Desktop: attach handler to open Gmail compose in a new tab, falling back to mailto
    links.forEach(link => {
      link.addEventListener('click', function(e){
        // Allow user to use native ctrl/cmd+click or middle-click to open directly
        if(e.metaKey || e.ctrlKey || e.button === 1) return;

        e.preventDefault();
        const to = this.dataset.email || (this.getAttribute('href')||'').replace(/^mailto:/i,'');
        if(!to) return;

        const subject = '';
        const body = '';
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        // Try opening Gmail in a new tab/window. If blocked, fallback to mailto navigation.
        let opened = null;
        try{ opened = window.open(gmailUrl, '_blank'); }catch(err){ opened = null; }
        if(!opened){
          // popup blocked or failed — navigate to mailto as fallback
          window.location.href = `mailto:${to}`;
        }
      });
    });
  })();


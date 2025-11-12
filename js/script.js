// Mobile nav toggle, smooth-scroll helpers, scroll reveal, form handling, and theme toggle
document.addEventListener('DOMContentLoaded', function(){
  // Update year
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Force dark theme only (site is dark-mode only)
  const html = document.documentElement;
  html.setAttribute('data-theme', 'dark');

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
  ctaButtons.forEach(btn => {
    btn.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.05)';
    });
    btn.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });
  });

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

  // Active nav link by scroll position
  const sections = Array.from(document.querySelectorAll('[id="home"], [id="about"], main section[id]'));
  const navLinks = Array.from(document.querySelectorAll('#primary-nav a'));

  function onScroll(){
    const scrollPos = window.scrollY + 100;
    let current = sections[0];
    for(const sec of sections){
      if(sec.offsetTop <= scrollPos) current = sec;
    }
    const id = current.id;
    navLinks.forEach(a => {
      const isActive = a.getAttribute('href') === ('#'+id);
      a.classList.toggle('active', isActive);
    });
  }
  window.addEventListener('scroll', throttle(onScroll, 100));
  onScroll();
  
  // Update active link immediately when clicking a nav link
  navLinks.forEach(link => {
    link.addEventListener('click', function(){
      setTimeout(() => {
        onScroll();
      }, 800);
    });
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

    form.addEventListener('submit', function(e){
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
          // Clear the form before redirecting
          clearForm();
          window.location.href = mailtoLink;
          return;
        }

        // Desktop: try to open Gmail compose in a new tab/window (most users use Gmail).
        // If that fails (popup blocked), fall back to Outlook/Yahoo and finally to mailto in-place.
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
          // provide a fallback link in case the user isn't signed into Gmail in that tab
          setTimeout(() => {
            showFormStatus('If your email didn\'t open, click the link below to compose manually.', 'success');
            addFallbackLink(mailtoLink);
          }, 1200);
          return;
        }

        // If window.open was blocked, try opening Outlook compose in same tab (navigation)
        try{
          // Clear the form before navigating
          clearForm();
          window.location.href = outlookLink;
          return;
        }catch(err){
          console.warn('Navigation to Outlook failed', err);
        }

        // Try Yahoo compose
        try{
          clearForm();
          window.location.href = yahooLink;
          return;
        }catch(err){
          console.warn('Navigation to Yahoo failed', err);
        }

        // Final fallback: navigate to mailto (this should open the default mail app or handler)
        console.log('All webmail attempts failed or blocked — falling back to mailto navigation');
        try{
          clearForm();
          window.location.href = mailtoLink;
        }catch(err){
          console.warn('mailTo navigation failed', err);
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

// Small helper if needed elsewhere
function $(sel){return document.querySelector(sel)}

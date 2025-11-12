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

  // Form handling (no network call) — simple validation and success message
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const fm = new FormData(form);
      const name = fm.get('name')?.toString().trim();
      const email = fm.get('email')?.toString().trim();
      const message = fm.get('message')?.toString().trim();
      if(!name || !email || !message){
        status.textContent = 'Please complete all fields.';
        status.style.color = 'crimson';
        return;
      }
      // Simulate success
      status.textContent = 'Thanks — we received your message. We will reply within one business day.';
      status.style.color = ''; // use stylesheet color
      form.reset();
    });
  }

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

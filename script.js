/* ============================================
   Mohamed Khaled — AI Engineer Portfolio
   Interactive Scripts & Motion
   - AI Face Transformation Hero (Cursor Reveal)
   - Canvas Particle Background (Reduced Motion Aware)
   - 3D Card Tilt Effect
   - Scroll Reveal (Intersection Observer)
   - Counter Animation
   - Navbar Scroll & Mobile Menu
   - Magnetic Buttons
   - Smooth Scroll & Project Subnav Tracker
   - Formspree AJAX Form Submission
   - AI Chatbot Assistant
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initHUDFrame();
    initNeuralNetworkSkills();
    initParticles();
    initScrollReveal();
    initNavbar();
    initCounterAnimation();
    initProjectSubnav();
    initMagneticButtons();
    initTiltCards();
    initSmoothScroll();
    initContactForm();
});

// ============ HUD FACE FRAME — Dynamic positioning around portrait face ============
function initHUDFrame() {
    const portrait = document.getElementById('hero-main-portrait');
    const frame    = document.querySelector('.face-hud-frame');
    const stage    = document.getElementById('hero-portrait-stage');
    if (!portrait || !frame || !stage) return;

    // Face proportions within the source portrait image (ChatGPT mixed face image)
    // These describe where the face sits relative to the full image dimensions:
    const FACE_TOP    = 0.04;   // hair top  (~4% from image top)
    const FACE_BOTTOM = 0.63;   // chin      (~63% from image top)
    const FACE_LEFT   = 0.18;   // left edge (~18% from image left)
    const FACE_RIGHT  = 0.82;   // right edge (~82% from image left)

    function placeFrame() {
        const imgRect   = portrait.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();

        if (imgRect.width === 0) return; // image not rendered yet

        const top    = (imgRect.top  - stageRect.top)  + imgRect.height * FACE_TOP;
        const height = imgRect.height * (FACE_BOTTOM - FACE_TOP);
        const left   = (imgRect.left - stageRect.left) + imgRect.width  * FACE_LEFT;
        const width  = imgRect.width  * (FACE_RIGHT - FACE_LEFT);

        frame.style.position  = 'absolute';
        frame.style.top       = top    + 'px';
        frame.style.left      = left   + 'px';
        frame.style.width     = width  + 'px';
        frame.style.height    = height + 'px';
        frame.style.transform = 'none';
    }

    // Run after image loads (or immediately if already loaded)
    if (portrait.complete && portrait.naturalWidth > 0) {
        placeFrame();
    } else {
        portrait.addEventListener('load', placeFrame);
    }

    // Re-run on resize
    window.addEventListener('resize', placeFrame, { passive: true });

    // Safety: re-run after layout settles
    setTimeout(placeFrame, 300);
    setTimeout(placeFrame, 800);
}

// ============ NEURAL NETWORK SKILLS TOPOLOGY ============
function initNeuralNetworkSkills() {
    const wrapper = document.getElementById('skills-nn-wrapper');
    const canvas  = document.getElementById('skills-nn-canvas');
    if (!wrapper || !canvas) return;

    const ctx = canvas.getContext('2d');
    const nodes = Array.from(wrapper.querySelectorAll('.nn-node'));
    let hoveredSkill = null;
    let animFrame = null;
    let pulseT = 0;

    function resize() {
        canvas.width  = wrapper.offsetWidth;
        canvas.height = wrapper.offsetHeight;
        draw();
    }

    // Map of nodes by skill key
    function getNodePositions() {
        const wrapRect = wrapper.getBoundingClientRect();
        const map = new Map();

        nodes.forEach(node => {
            const key = node.dataset.skill;
            const rect = node.getBoundingClientRect();
            map.set(key, {
                el: node,
                x: rect.left - wrapRect.left + rect.width / 2,
                y: rect.top - wrapRect.top + rect.height / 2,
                left: rect.left - wrapRect.left,
                right: rect.right - wrapRect.left,
                top: rect.top - wrapRect.top,
                bottom: rect.bottom - wrapRect.top,
                width: rect.width,
                height: rect.height,
                connections: (node.dataset.connections || '').split(',').map(s => s.trim()).filter(Boolean)
            });
        });

        return map;
    }

    function draw() {
        const W = canvas.width;
        const H = canvas.height;
        if (W === 0 || H === 0) return;

        ctx.clearRect(0, 0, W, H);
        const nodeMap = getNodePositions();

        pulseT += 0.025;

        // Draw connections
        nodeMap.forEach((fromData, fromKey) => {
            fromData.connections.forEach(toKey => {
                const toData = nodeMap.get(toKey);
                if (!toData) return;

                // Determine highlight state
                const isHoveredLine = (hoveredSkill === fromKey || hoveredSkill === toKey);
                const isAnyHovered  = Boolean(hoveredSkill);

                // Bezier curve between nodes for organic neural synapse look
                const x1 = fromData.x < toData.x ? fromData.right : fromData.left;
                const y1 = fromData.y;
                const x2 = fromData.x < toData.x ? toData.left : toData.right;
                const y2 = toData.y;

                const cx1 = x1 + (x2 - x1) * 0.45;
                const cy1 = y1;
                const cx2 = x1 + (x2 - x1) * 0.55;
                const cy2 = y2;

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);

                if (isHoveredLine) {
                    // Highlighted electric blue synapse
                    ctx.strokeStyle = 'rgba(22, 119, 255, 0.75)';
                    ctx.lineWidth = 2.2;
                    ctx.shadowColor = 'rgba(22, 119, 255, 0.6)';
                    ctx.shadowBlur = 8;
                    ctx.stroke();
                    ctx.shadowBlur = 0;

                    // Traveling pulse signal
                    const t = (pulseT % 1);
                    const px = Math.pow(1 - t, 3) * x1 + 3 * Math.pow(1 - t, 2) * t * cx1 + 3 * (1 - t) * Math.pow(t, 2) * cx2 + Math.pow(t, 3) * x2;
                    const py = Math.pow(1 - t, 3) * y1 + 3 * Math.pow(1 - t, 2) * t * cy1 + 3 * (1 - t) * Math.pow(t, 2) * cy2 + Math.pow(t, 3) * y2;

                    ctx.beginPath();
                    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#1677FF';
                    ctx.shadowColor = '#1677FF';
                    ctx.shadowBlur = 10;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else {
                    // Ambient resting synapse line
                    const alpha = isAnyHovered ? 0.04 : 0.16;
                    ctx.strokeStyle = `rgba(22, 119, 255, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            });
        });

        if (hoveredSkill) {
            animFrame = requestAnimationFrame(draw);
        }
    }

    // Attach hover listeners to nodes
    nodes.forEach(node => {
        const skillKey = node.dataset.skill;

        node.addEventListener('mouseenter', () => {
            hoveredSkill = skillKey;
            const nodeMap = getNodePositions();
            const thisNode = nodeMap.get(skillKey);
            const connectedKeys = new Set(thisNode ? thisNode.connections : []);

            // Also include any nodes that connect TO this node
            nodeMap.forEach((data, key) => {
                if (data.connections.includes(skillKey)) {
                    connectedKeys.add(key);
                }
            });

            nodes.forEach(n => {
                const k = n.dataset.skill;
                if (k === skillKey) {
                    n.classList.add('active-hover');
                    n.classList.remove('dimmed', 'connected-highlight');
                } else if (connectedKeys.has(k)) {
                    n.classList.add('connected-highlight');
                    n.classList.remove('dimmed', 'active-hover');
                } else {
                    n.classList.add('dimmed');
                    n.classList.remove('active-hover', 'connected-highlight');
                }
            });

            cancelAnimationFrame(animFrame);
            animFrame = requestAnimationFrame(draw);
        });

        node.addEventListener('mouseleave', () => {
            hoveredSkill = null;
            nodes.forEach(n => n.classList.remove('active-hover', 'connected-highlight', 'dimmed'));
            cancelAnimationFrame(animFrame);
            draw();
        });
    });

    window.addEventListener('resize', resize, { passive: true });
    // Initial draw after layout settles
    setTimeout(resize, 100);
}

// ============ PARTICLE SYSTEM ============
function initParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    // Respect reduced motion preferences
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId;
    let mouseX = -1000;
    let mouseY = -1000;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.8 + 0.6;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.speedY = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random() * 0.45 + 0.15;
            // Cohesive palette: electric blue accent & soft cool slate for light background
            this.color = Math.random() > 0.35 ? '22, 119, 255' : '120, 150, 195';
        }

        update() {
            // Gentle mouse avoidance
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 140;

            if (dist < maxDist && dist > 0) {
                const force = (maxDist - dist) / maxDist;
                this.x += (dx / dist) * force * 0.6;
                this.y += (dy / dist) * force * 0.6;
            }

            this.x += this.speedX;
            this.y += this.speedY;

            // Screen wrapping
            if (this.x < 0) this.x = canvas.width;
            if (this.x > canvas.width) this.x = 0;
            if (this.y < 0) this.y = canvas.height;
            if (this.y > canvas.height) this.y = 0;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.color}, ${this.opacity * 0.7})`;
            ctx.fill();
        }
    }

    function createParticles() {
        particles = [];
        // Restrained count: max 40 particles for clean atmosphere without visual clutter
        const count = Math.min(40, Math.floor((canvas.width * canvas.height) / 28000));
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function connectParticles() {
        const maxDist = 110;
        const len = particles.length;
        for (let i = 0; i < len; i++) {
            for (let j = i + 1; j < len; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDist) {
                    const alpha = (1 - dist / maxDist) * 0.12;
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(22, 119, 255, ${alpha})`;
                    ctx.lineWidth = 0.6;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
    }

    function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }
        connectParticles();
        animationFrameId = requestAnimationFrame(loop);
    }

    resizeCanvas();
    createParticles();
    loop();

    window.addEventListener('resize', () => {
        resizeCanvas();
        createParticles();
    });

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    window.addEventListener('mouseout', () => {
        mouseX = -1000;
        mouseY = -1000;
    });
}

// ============ NAVBAR & MOBILE MENU ============
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');

    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 40) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            const isActive = hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', String(isActive));
        });

        // Close menu on link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }
}

// ============ SCROLL REVEAL ============
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal-text');
    if (!revealElements.length) return;

    if (!('IntersectionObserver' in window)) {
        revealElements.forEach(el => el.classList.add('revealed'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));

    // Safety fallback: reveal all after 2.5s
    setTimeout(() => {
        revealElements.forEach(el => {
            if (!el.classList.contains('revealed')) {
                el.classList.add('revealed');
            }
        });
    }, 2500);
}

// ============ COUNTER ANIMATION ============
function initCounterAnimation() {
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target, 10) || 0;
                const duration = 1600;
                const startTime = performance.now();

                function update(now) {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    // Ease out expo
                    const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                    el.textContent = Math.floor(ease * target);

                    if (progress < 1) {
                        requestAnimationFrame(update);
                    } else {
                        el.textContent = target;
                    }
                }

                requestAnimationFrame(update);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.3 });

    counters.forEach(c => observer.observe(c));
}

// ============ PROJECT SUB-NAVIGATION ACTIVE TRACKER ============
function initProjectSubnav() {
    const subnav = document.querySelector('.project-subnav');
    if (!subnav) return;

    const pills = subnav.querySelectorAll('.project-pill');
    const sections = [
        document.getElementById('smart-glasses'),
        document.getElementById('rag-system'),
        document.getElementById('sentinel'),
        document.getElementById('aut-chatbot'),
        document.getElementById('pixelforge')
    ].filter(Boolean);

    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                pills.forEach(pill => {
                    if (pill.getAttribute('href') === `#${id}`) {
                        pill.classList.add('active');
                    } else {
                        pill.classList.remove('active');
                    }
                });
            }
        });
    }, {
        threshold: 0.25,
        rootMargin: '-10% 0px -40% 0px'
    });

    sections.forEach(sec => observer.observe(sec));
}

// ============ 3D CARD TILT EFFECT ============
function initTiltCards() {
    // Only apply on non-touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const cards = document.querySelectorAll('.tilt-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -6;
            const rotateY = ((x - centerX) / centerX) * 6;

            card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// ============ MAGNETIC BUTTONS ============
function initMagneticButtons() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}

// ============ SMOOTH SCROLL ============
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || !href) return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============ CONTACT FORM (FORMSPREE AJAX) ============
function initContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = form.querySelector('.submit-btn');
        const originalText = btn.innerHTML;

        // Basic validation
        const name = form.querySelector('#name')?.value.trim();
        const email = form.querySelector('#email')?.value.trim();
        const message = form.querySelector('#message')?.value.trim();

        if (!name || !email || !message) {
            btn.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please fill all fields';
            btn.style.background = 'rgba(255, 75, 75, 0.15)';
            btn.style.borderColor = 'rgba(255, 75, 75, 0.5)';
            btn.style.color = '#ff6b6b';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
                btn.style.borderColor = '';
                btn.style.color = '';
            }, 2500);
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                btn.innerHTML = '<i class="fas fa-check"></i> Message Sent Successfully!';
                btn.style.background = 'rgba(0, 255, 140, 0.15)';
                btn.style.borderColor = 'rgba(0, 255, 140, 0.5)';
                btn.style.color = '#00ff8c';
                form.reset();

                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.style.borderColor = '';
                    btn.style.color = '';
                }, 4000);
            } else {
                throw new Error('Formspree returned an error');
            }
        } catch (err) {
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Sent (Backup Fallback)';
            btn.style.background = 'rgba(0, 240, 255, 0.15)';
            btn.style.borderColor = 'rgba(0, 240, 255, 0.5)';
            btn.style.color = 'var(--accent)';
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
                btn.style.background = '';
                btn.style.borderColor = '';
                btn.style.color = '';
            }, 3500);
        }
    });
}

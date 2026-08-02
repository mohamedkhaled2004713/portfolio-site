/* ============================================
   Mohamed Milege — AI Portfolio
   Enhanced Interactions & Animations
   - Particle System
   - Mouse Parallax Effects
   - 3D Card Tilt
   - Scroll Reveal
   - Counter Animation
   ============================================ */

// ============ PARTICLE SYSTEM ============
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouseX = 0;
let mouseY = 0;
let animationFrame;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.color = Math.random() > 0.5 ? '0, 240, 255' : '211, 0, 255';
    }

    update() {
        // Mouse interaction - particles move away from mouse slightly
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 200;

        if (distance < maxDistance) {
            const force = (maxDistance - distance) / maxDistance;
            this.x += (dx / distance) * force * 0.8;
            this.y += (dy / distance) * force * 0.8;
        }

        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around edges
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    const particleCount = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function connectParticles() {
    const maxDistance = 120;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < maxDistance) {
                const opacity = (1 - distance / maxDistance) * 0.15;
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
                ctx.lineWidth = 0.5;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });
    
    connectParticles();
    animationFrame = requestAnimationFrame(animateParticles);
}

// ============ MOUSE GLOW FOLLOWER ============
const mouseGlow = document.getElementById('mouse-glow');
let glowX = 0;
let glowY = 0;
let targetGlowX = 0;
let targetGlowY = 0;

function animateMouseGlow() {
    glowX += (targetGlowX - glowX) * 0.1;
    glowY += (targetGlowY - glowY) * 0.1;
    mouseGlow.style.left = glowX + 'px';
    mouseGlow.style.top = glowY + 'px';
    requestAnimationFrame(animateMouseGlow);
}

// ============ MOUSE PARALLAX ============
function handleMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Update glow target
    targetGlowX = e.clientX;
    targetGlowY = e.clientY;
    
    // Parallax for background orbs
    const orbs = document.querySelectorAll('.bg-orb');
    orbs.forEach(orb => {
        const speed = parseFloat(orb.dataset.parallax) || 0.02;
        const x = (window.innerWidth - e.pageX) * speed;
        const y = (window.innerHeight - e.pageY) * speed;
        orb.style.transform = `translate(${x}px, ${y}px)`;
    });
    
    // Hero image subtle parallax
    const heroImg = document.querySelector('.hero-banner-img');
    if (heroImg) {
        const x = (e.clientX / window.innerWidth - 0.5) * -15;
        const y = (e.clientY / window.innerHeight - 0.5) * -15;
        heroImg.style.transform = `scale(1.05) translate(${x}px, ${y}px)`;
    }
}

// ============ 3D TILT EFFECT ============
function initTiltCards() {
    const cards = document.querySelectorAll('.tilt-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / centerY * -8;
            const rotateY = (x - centerX) / centerX * 8;
            
            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            
            // Add shine effect
            const shineX = (x / rect.width) * 100;
            const shineY = (y / rect.height) * 100;
            card.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(0, 240, 255, 0.08) 0%, transparent 50%), var(--card-bg)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            card.style.background = '';
        });
    });
}

// ============ SCROLL REVEAL ============
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal-text');
    let revealedCount = 0;
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealedCount++;
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05,
        rootMargin: '0px 0px 20px 0px'
    });
    
    revealElements.forEach(el => revealObserver.observe(el));
    
    // Fallback: reveal all elements after 2 seconds if observer fails
    setTimeout(() => {
        revealElements.forEach(el => {
            if (!el.classList.contains('revealed')) {
                el.classList.add('revealed');
            }
        });
    }, 2000);
}

// ============ NAVBAR SCROLL ============
function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

// ============ COUNTER ANIMATION ============
function initCounterAnimation() {
    const counters = document.querySelectorAll('.counter');
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.dataset.target);
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;
                
                const updateCounter = () => {
                    current += step;
                    if (current < target) {
                        counter.textContent = Math.floor(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };
                
                updateCounter();
                counterObserver.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => counterObserver.observe(counter));
}

// ============ HAMBURGER MENU ============
function initHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }
    
    // Close menu on link click
    const links = navLinks?.querySelectorAll('a');
    links?.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
}

// ============ MAGNETIC BUTTON EFFECT ============
function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn');
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    
    if (isTouchDevice) return;
    
    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
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
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    // Initialize canvas
    resizeCanvas();
    initParticles();
    animateParticles();
    
    // Initialize mouse glow
    animateMouseGlow();
    
    // Event listeners
    window.addEventListener('resize', () => {
        resizeCanvas();
        initParticles();
    });
    
    document.addEventListener('mousemove', handleMouseMove);
    
    // Initialize features
    initScrollReveal();
    initNavbarScroll();
    initCounterAnimation();
    initHamburgerMenu();
    initMagneticButtons();
    initSmoothScroll();
    initTiltCards();
});

// ============ FORM SUBMIT HANDLER ============
document.querySelector('.contact-form')?.addEventListener('submit', function(e) {
    const btn = this.querySelector('.submit-btn');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
        btn.style.background = 'rgba(0, 255, 100, 0.2)';
        btn.style.borderColor = '#00ff64';
        btn.style.color = '#00ff64';
        
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.color = '';
        }, 3000);
    }, 1500);
});

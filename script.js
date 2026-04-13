/* ============================================
   Mohamed Milege — AI Portfolio
   Interactive Scripts & Animations
   ============================================ */

// ============ PARTICLE BACKGROUND ============
const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let mouseX = 0;
let mouseY = 0;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.color = Math.random() > 0.5 ? '0, 240, 255' : '211, 0, 255';
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Mouse interaction - subtle attraction
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
            this.x += dx * 0.002;
            this.y += dy * 0.002;
            this.opacity = Math.min(this.opacity + 0.01, 0.8);
        }

        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.reset();
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.fill();
    }
}

// Create particles
for (let i = 0; i < 80; i++) {
    particles.push(new Particle());
}

function drawLines() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 120) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(0, 240, 255, ${0.08 * (1 - dist / 120)})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    drawLines();
    requestAnimationFrame(animateParticles);
}

animateParticles();

// Mouse tracking for particles
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// ============ NAVBAR SCROLL EFFECT ============
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ============ HAMBURGER MENU ============
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Close menu when a link is clicked
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// ============ SCROLL REVEAL ANIMATION ============
const revealElements = document.querySelectorAll('.reveal-text');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            // Stagger the animation
            setTimeout(() => {
                entry.target.classList.add('revealed');
            }, index * 100);
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => {
    revealObserver.observe(el);
});

// ============ SMOOTH SCROLL FOR ANCHORS ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
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

// ============ COUNTER ANIMATION ============
const counters = document.querySelectorAll('.counter');

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = parseInt(entry.target.getAttribute('data-target'));
            let current = 0;
            const increment = target / 40;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    entry.target.textContent = target;
                    clearInterval(timer);
                } else {
                    entry.target.textContent = Math.ceil(current);
                }
            }, 50);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

counters.forEach(counter => {
    counterObserver.observe(counter);
});

// ============ TILT EFFECT ON ROBOT CARD ============
const robotCard = document.querySelector('.robot-card');

if (robotCard) {
    robotCard.addEventListener('mousemove', (e) => {
        const rect = robotCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 15;
        const rotateY = (centerX - x) / 15;

        robotCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    robotCard.addEventListener('mouseleave', () => {
        robotCard.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        robotCard.style.transition = 'transform 0.5s ease';
    });

    robotCard.addEventListener('mouseenter', () => {
        robotCard.style.transition = 'none';
    });
}

// ============ SKILL TAG STAGGERED ANIMATION ============
const skillTags = document.querySelectorAll('.tag');

const tagObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = entry.target.getAttribute('data-delay') || 0;
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, delay * 120);
            tagObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

skillTags.forEach(tag => {
    tag.style.opacity = '0';
    tag.style.transform = 'translateY(15px)';
    tag.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    tagObserver.observe(tag);
});

// ============ PARALLAX ON HERO BANNER IMAGE ============
const heroBannerImg = document.querySelector('.hero-banner-img');

window.addEventListener('scroll', () => {
    if (heroBannerImg) {
        const scrollY = window.scrollY;
        const speed = 0.3;
        heroBannerImg.style.transform = `scale(${1.05 + scrollY * 0.0001}) translateY(${scrollY * speed}px)`;
    }
});

// ============ ACTIVE NAV LINK HIGHLIGHT ============
const sections = document.querySelectorAll('section, header');
const navLinksAll = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinksAll.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === `#${current}`) {
            link.style.color = 'var(--accent)';
        }
    });
});

// ============ TYPING EFFECT ON TAGLINE ============
const tagline = document.querySelector('.hero-tagline');
if (tagline) {
    const text = tagline.innerHTML;
    tagline.innerHTML = '';
    tagline.style.opacity = '1';

    let i = 0;
    function typeWriter() {
        if (i < text.length) {
            // Handle HTML tags
            if (text[i] === '<') {
                let tag = '';
                while (text[i] !== '>' && i < text.length) {
                    tag += text[i];
                    i++;
                }
                tag += text[i];
                i++;
                tagline.innerHTML += tag;
                typeWriter();
            } else {
                tagline.innerHTML += text[i];
                i++;
                setTimeout(typeWriter, 30);
            }
        }
    }

    // Start typing after initial animations
    setTimeout(typeWriter, 1800);
}

console.log('🚀 Mohamed Milege Portfolio — Loaded Successfully');

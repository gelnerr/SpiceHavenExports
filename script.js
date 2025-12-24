/* script.js - Interactive functions */

function toggleMenu() {
    const menu = document.getElementById('nav-menu');
    menu.classList.toggle('active');
}

// Header scroll effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    const currentScroll = window.pageYOffset;
    if (currentScroll > 100) {
        header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    } else {
        header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
    }
});

// HERO SLIDER LOGIC (Only runs if slides exist)
const slides = document.querySelectorAll('.slide');
if(slides.length > 0) {
    let currentSlide = 0;
    setInterval(() => {
        // Remove active class from current
        slides[currentSlide].classList.remove('active');
        
        // Move to next slide
        currentSlide = (currentSlide + 1) % slides.length;
        
        // Add active class to new slide
        slides[currentSlide].classList.add('active');
    }, 5000); // Change every 5 seconds
}

// SCROLL REVEAL ANIMATION
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.15 }); // Trigger when 15% of item is visible

revealElements.forEach(el => revealObserver.observe(el));
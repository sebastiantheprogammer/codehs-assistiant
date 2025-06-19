document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Contact form handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = contactForm.querySelector('input[type="email"]').value;
            const message = contactForm.querySelector('textarea').value;
            
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, message })
                });

                if (response.ok) {
                    alert('Thank you for your message! We will get back to you soon.');
                    contactForm.reset();
                } else {
                    throw new Error('Failed to send message');
                }
            } catch (error) {
                alert('Sorry, there was an error sending your message. Please try again later.');
                console.error('Contact form error:', error);
            }
        });
    }

    // Add scroll-based animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        observer.observe(section);
    });

    // Header scroll effect
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled-header');
        } else {
            header.classList.remove('scrolled-header');
        }
    });

    // Initialize header state
    if (window.scrollY > 50) {
        header.classList.add('scrolled-header');
    }

    // Activation code display logic for delivery pages
    function showActivationCode() {
        const codeDisplay = document.getElementById('activation-code-display');
        if (codeDisplay) {
            // Try to get code from URL param first
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            if (code) {
                codeDisplay.textContent = code;
            } else {
                // Fallback: fetch from backend (if endpoint exists)
                fetch('/api/activation-code')
                    .then(res => res.json())
                    .then(data => {
                        if (data.code) {
                            codeDisplay.textContent = data.code;
                        } else {
                            codeDisplay.textContent = 'No code found.';
                        }
                    })
                    .catch(() => {
                        codeDisplay.textContent = 'Error loading code.';
                    });
            }
        }
    }

    // Download extension button logic
    function setupDownloadButton() {
        const downloadBtn = document.querySelector('.download-button');
        if (downloadBtn) {
            downloadBtn.setAttribute('href', '/static/extension.zip');
            downloadBtn.setAttribute('download', 'CodeHS-Assistant-Extension.zip');
        }
    }

    showActivationCode();
    setupDownloadButton();
}); 
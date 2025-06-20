document.addEventListener('DOMContentLoaded', () => {
    // Security check for delivery pages
    function checkDeliveryPageAccess() {
        const deliveryPages = [
            'monthly-pass-delivery.html',
            'yearly-pass-delivery.html', 
            'week-pass-delivery.html',
            'day-pass-delivery.html'
        ];
        
        const currentPage = window.location.pathname.split('/').pop();
        if (deliveryPages.includes(currentPage)) {
            // Check if user came from a valid source or has proper authorization
            const referrer = document.referrer;
            const hasCode = new URLSearchParams(window.location.search).get('code');
            const hasValidReferrer = referrer && (
                referrer.includes('codehs-assistiant.onrender.com') || 
                referrer.includes('localhost') ||
                referrer.includes('127.0.0.1')
            );
            
            if (!hasCode && !hasValidReferrer) {
                // Redirect to home page if accessed directly without authorization
                window.location.href = 'index.html';
                return false;
            }
        }
        return true;
    }

    // Run security check first
    if (!checkDeliveryPageAccess()) {
        return;
    }

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
                codeDisplay.style.color = '#00ff88';
            } else {
                // Check if this is a direct access without authorization
                const referrer = document.referrer;
                const hasValidReferrer = referrer && (
                    referrer.includes('codehs-assistiant.onrender.com') || 
                    referrer.includes('localhost') ||
                    referrer.includes('127.0.0.1')
                );
                
                if (!hasValidReferrer) {
                    codeDisplay.textContent = 'Access denied. Please complete your purchase first.';
                    codeDisplay.style.color = '#ff6b6b';
                    return;
                }
                
                // Fallback: fetch from backend (if endpoint exists)
                fetch('/api/activation-code')
                    .then(res => {
                        if (!res.ok) {
                            throw new Error('No activation code available');
                        }
                        return res.json();
                    })
                    .then(data => {
                        if (data.code) {
                            codeDisplay.textContent = data.code;
                            codeDisplay.style.color = '#00ff88';
                        } else {
                            codeDisplay.textContent = 'No activation code found. Please contact support.';
                            codeDisplay.style.color = '#ff6b6b';
                        }
                    })
                    .catch((error) => {
                        console.error('Activation code error:', error);
                        codeDisplay.textContent = 'Unable to load activation code. Please contact support.';
                        codeDisplay.style.color = '#ff6b6b';
                    });
            }
        }
    }

    // Download extension button logic
    function setupDownloadButton() {
        const downloadBtn = document.querySelector('.download-button');
        if (downloadBtn) {
            // Check if user has a valid activation code
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            
            if (code) {
                // User has a code, show download button
                downloadBtn.style.display = 'inline-block';
                downloadBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    
                    try {
                        const response = await fetch('/api/download-extension');
                        if (response.ok) {
                            // Create a blob from the response
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            
                            // Create a temporary link and trigger download
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'CodeHS-Assistant-Extension.zip';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                        } else {
                            const errorData = await response.json();
                            alert('Download failed: ' + (errorData.message || 'Please contact support'));
                        }
                    } catch (error) {
                        console.error('Download error:', error);
                        alert('Download failed. Please contact support.');
                    }
                });
            } else {
                // No code, hide download button
                downloadBtn.style.display = 'none';
            }
        }
    }

    showActivationCode();
    setupDownloadButton();
}); 
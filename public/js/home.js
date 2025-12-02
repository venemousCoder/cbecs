document.addEventListener('DOMContentLoaded', function() {
    console.log('CBECS Home Script Loaded');

    // --- Simple Hero Slider Logic ---
    const sliderContainer = document.querySelector('.hero-slider');
    if (sliderContainer) {
        const slides = sliderContainer.querySelectorAll('.hero-slide');
        let currentSlide = 0;

        // If multiple slides exist (currently EJS prints one, but if improved)
        // We need to ensure CSS supports multiple slides first. 
        // For now, let's just make the slider container strictly relative for future.
        
        // (Optional: If you later output all slides in EJS, this logic will cycle them)
        if (slides.length > 1) {
            setInterval(() => {
                slides[currentSlide].style.display = 'none';
                currentSlide = (currentSlide + 1) % slides.length;
                slides[currentSlide].style.display = 'flex';
            }, 5000);
        }
    }

    // --- Sticky Header Shadow on Scroll ---
    const header = document.querySelector('.main-header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        } else {
            header.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
        }
    });

    // --- Toast Notification for "Add to Cart" ---
    const actionBtns = document.querySelectorAll('.action-btn, .slide-btn');
    
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Prevent default if it's just a dummy link #
            const href = this.getAttribute('href');
            if(href === '#' || !href) {
                e.preventDefault();
                showToast('Action triggered! (Prototype)');
            }
        });
    });

    function showToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.background = '#323232';
        toast.style.color = 'white';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '4px';
        toast.style.zIndex = '9999';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';

        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => { toast.style.opacity = '1'; }, 10);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => { toast.remove(); }, 300);
        }, 3000);
    }
});
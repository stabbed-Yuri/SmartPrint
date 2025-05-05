/**
 * SmartPrint Debug Utilities
 * This file contains debugging tools and fixes for CSS and JavaScript issues
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Debug utilities loaded');
    
    // Fix navigation/hero section
    fixNavigation();
    
    // Fix modal display issues
    fixModals();
    
    // Add listeners for printer form debugging
    setupPrinterFormDebug();
});

/**
 * Fix navigation and hero section styling issues
 */
function fixNavigation() {
    // Add missing CSS for navigation
    const style = document.createElement('style');
    style.textContent = `
        .main-header, .admin-header {
            position: sticky;
            top: 0;
            z-index: 99;
            background-color: #fff;
        }
        
        .main-menu, .desktop-menu {
            display: flex;
            align-items: center;
        }
        
        .mobile-menu {
            display: none;
        }
        
        .mobile-menu.active {
            display: block;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: #fff;
            z-index: 100;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 1rem 0;
        }
        
        .mobile-menu ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .mobile-menu li {
            padding: 0.5rem 1rem;
        }
        
        @media (max-width: 768px) {
            .main-menu, .desktop-menu {
                display: none;
            }
            
            .hamburger {
                display: block;
            }
        }
    `;
    document.head.appendChild(style);
    
    console.log('Navigation styles fixed');
}

/**
 * Fix modal display issues
 */
function fixModals() {
    // Check for and fix modal CSS
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0, 0, 0, 0.4);
        }
        
        .modal.active {
            display: block !important;
        }
    `;
    document.head.appendChild(style);
    
    // Ensure all modal open buttons work
    const modalButtons = document.querySelectorAll('[data-modal]');
    modalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('active');
                console.log(`Opened modal: ${modalId}`);
            }
        });
    });
    
    // Add click handler to "Add Printer" button if it exists
    const addPrinterBtn = document.querySelector('.add-button');
    if (addPrinterBtn) {
        addPrinterBtn.addEventListener('click', function() {
            const modal = document.getElementById('add-printer-modal');
            if (modal) {
                modal.classList.add('active');
                console.log('Opened add printer modal manually');
            } else {
                console.warn('Add printer modal not found');
            }
        });
    }
    
    console.log('Modal styles and handlers fixed');
}

/**
 * Setup debugging for printer form submission
 */
function setupPrinterFormDebug() {
    const addPrinterForm = document.getElementById('add-printer-form');
    if (addPrinterForm) {
        console.log('Printer form found, adding debug listener');
        
        // Use the default form submission but add logging
        addPrinterForm.addEventListener('submit', function(event) {
            // Don't prevent default - let the form submit normally
            
            console.log('Form submitted with data:');
            const formData = new FormData(this);
            formData.forEach((value, key) => {
                console.log(`${key}: ${value}`);
            });
            
            // Log where the form is being submitted to
            console.log(`Submitting to: ${this.action} with method: ${this.method}`);
        });
        
        // Ensure action is set correctly
        if (!addPrinterForm.action || addPrinterForm.action === '') {
            addPrinterForm.action = '/printers/new';
            console.log('Set form action to /printers/new');
        }
        
        // Ensure method is POST
        if (addPrinterForm.method !== 'post') {
            addPrinterForm.method = 'post';
            console.log('Set form method to POST');
        }
    } else {
        console.warn('Add printer form not found');
    }
} 
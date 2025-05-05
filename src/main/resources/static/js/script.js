// Global variables
let uploadedFiles = [];
let totalPages = 0;
let selectedPrinterId = null;
let printerData = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            this.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            const expanded = this.getAttribute('aria-expanded') === 'true' || false;
            this.setAttribute('aria-expanded', !expanded);
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!hamburger.contains(event.target) && !mobileMenu.contains(event.target) && mobileMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });
    
    // File upload functionality
    setupFileUpload();
    
    // Setup calculator event listeners
    setupCalculator();
    
    // Setup filters
    setupFilters();
    
    // Get printer data from the server or from the rendered HTML
    fetchPrinterData();
    
    // Add event listeners to printer select buttons
    setupPrinterSelectButtons();
});

// Fetch printer data either from API or extract from HTML
function fetchPrinterData() {
    // Extract from the printer grid that was rendered by Thymeleaf
    const printerCards = document.querySelectorAll('.printer-card');
    
    if (printerCards.length > 0) {
        printerData = Array.from(printerCards).map(card => {
            const id = card.querySelector('button').getAttribute('data-id');
            const name = card.querySelector('h3').textContent;
            const location = card.querySelector('.printer-location span').textContent;
            const owner = card.querySelector('.printer-owner').textContent;
            const priceElement = card.querySelector('.printer-price span');
            const pricePerPage = priceElement ? parseFloat(priceElement.textContent) : 0;
            const statusElement = card.querySelector('.printer-status span:last-child');
            const status = statusElement ? statusElement.textContent.toLowerCase() : 'offline';
            
            return {
                id,
                name,
                location,
                locationName: location,
                owner,
                pricePerPage,
                status
            };
        });
        
        // Populate printer select in calculator
        if (document.getElementById('selected-printer')) {
            populatePrinterSelect();
        }
    } else {
        // Alternatively, fetch from API if HTML doesn't have it
        fetch('/api/printers')
            .then(response => response.json())
            .then(data => {
                printerData = data;
                if (document.getElementById('selected-printer')) {
                    populatePrinterSelect();
                }
            })
            .catch(error => {
                console.error('Error fetching printer data:', error);
            });
    }
}

// Setup printer select buttons
function setupPrinterSelectButtons() {
    const selectButtons = document.querySelectorAll('.printer-card button');
    
    selectButtons.forEach(button => {
        button.addEventListener('click', function() {
            const printerId = this.getAttribute('data-id');
            selectedPrinterId = printerId;
            
            // Scroll to calculator section
            document.getElementById('calculator').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Select the printer in calculator
            const selectedPrinterSelect = document.getElementById('selected-printer');
            if (selectedPrinterSelect) {
                selectedPrinterSelect.value = printerId;
                updateCalculator();
            }
        });
    });
}

// Setup file upload functionality
function setupFileUpload() {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const filePreviews = document.getElementById('file-previews');
    const totalPagesElement = document.getElementById('total-pages');
    const locationFilter = document.getElementById('location-filter');
    const priceFilter = document.getElementById('price-filter');
    const printerGrid = document.querySelector('.printer-grid');
    const pageCountInput = document.getElementById('page-count');
    const deliveryOptions = document.querySelectorAll('input[name="delivery"]');
    const paymentToggle = document.getElementById('payment-toggle');
    const printingCostElement = document.getElementById('printing-cost');
    const deliveryCostElement = document.getElementById('delivery-cost');
    const totalCostElement = document.getElementById('total-cost');
    
    if (!dropArea || !fileInput) return;
    
    // Click on browse link
    const browseLink = document.querySelector('.browse-link');
    if (browseLink) {
        browseLink.addEventListener('click', () => {
            fileInput.click();
        });
    }
    
    // File input change
    fileInput.addEventListener('change', handleFiles);
    
    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    dropArea.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    const dropArea = document.getElementById('drop-area');
    dropArea.classList.add('drag-over');
}

function unhighlight() {
    const dropArea = document.getElementById('drop-area');
    dropArea.classList.remove('drag-over');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    handleFiles({ target: { files: files } });
}

function handleFiles(e) {
    if (!filePreviews || !totalPagesElement) return;
    
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
        // Check if it's a PDF
        if (file.type !== 'application/pdf') {
            alert('Only PDF files are allowed.');
            return;
        }
        
        // Generate a unique ID
        const fileId = Date.now() + Math.random().toString(36).substr(2, 5);
        
        // Create a FileReader to count pages
        const fileReader = new FileReader();
        fileReader.onload = function() {
            const typedarray = new Uint8Array(this.result);
            
            // Count PDF pages (simplified version)
            let pageCount = countPdfPages(typedarray);
            
            // Create file object
            const fileObj = {
                id: fileId,
                file: file,
                name: file.name,
                size: file.size,
                pages: pageCount
            };
            
            uploadedFiles.push(fileObj);
            totalPages += pageCount;
            
            // Render file preview
            renderFilePreview(fileObj);
            
            // Update total pages
            totalPagesElement.textContent = totalPages;
            
            // Update page count in calculator
            if (pageCountInput) {
                pageCountInput.value = totalPages;
                updateCalculator();
            }
        };
        
        fileReader.readAsArrayBuffer(file);
    });
    
    // Reset file input
    fileInput.value = '';
}

// Function to count PDF pages
function countPdfPages(data) {
    // In a real implementation, you would use a library like pdf.js
    // This is a simple estimation by counting /Page objects
    const pdfString = String.fromCharCode.apply(null, data.slice(0, Math.min(data.length, 5000)));
    const pageMatch = pdfString.match(/\/Type\s*\/Page\b/g);
    
    // Return page count or default to 1 if can't determine
    return pageMatch ? pageMatch.length : 1;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

function renderFilePreview(fileObj) {
    if (!filePreviews) return;
    
    const filePreview = document.createElement('div');
    filePreview.className = 'file-preview';
    filePreview.dataset.id = fileObj.id;
    
    filePreview.innerHTML = `
        <div class="file-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
        </div>
        <div class="file-info">
            <span class="file-name">${fileObj.name}</span>
            <span class="file-size">${formatFileSize(fileObj.size)}</span>
        </div>
        <span class="file-pages">${fileObj.pages} pages</span>
        <button class="file-remove" data-id="${fileObj.id}" aria-label="Remove file">×</button>
    `;
    
    filePreviews.appendChild(filePreview);
    
    // Add event listener to remove button
    const removeBtn = filePreview.querySelector('.file-remove');
    removeBtn.addEventListener('click', () => removeFile(fileObj.id));
}

function removeFile(id) {
    if (!filePreviews || !totalPagesElement) return;
    
    // Find file in array
    const index = uploadedFiles.findIndex(file => file.id === id);
    
    if (index !== -1) {
        // Update total pages
        totalPages -= uploadedFiles[index].pages;
        
        // Remove from array
        uploadedFiles.splice(index, 1);
        
        // Remove from DOM
        const filePreview = document.querySelector(`.file-preview[data-id="${id}"]`);
        if (filePreview) {
            filePreview.remove();
        }
        
        // Update total pages display
        totalPagesElement.textContent = totalPages;
        
        // Update page count in calculator
        if (pageCountInput) {
            pageCountInput.value = totalPages;
            updateCalculator();
        }
    }
}

function renderPrinterGrid(printers) {
    if (!printerGrid) return;
    
    printerGrid.innerHTML = '';
    
    if (printers.length === 0) {
        printerGrid.innerHTML = '<p class="no-results">No printers available for selected filters.</p>';
        return;
    }
    
    printers.forEach(printer => {
        const printerCard = document.createElement('div');
        printerCard.className = 'printer-card';
        
        printerCard.innerHTML = `
            <h3>${printer.name}</h3>
            <div class="printer-location">
                <span>${printer.locationName}</span>
            </div>
            <div class="printer-owner">${printer.owner}</div>
            <div class="printer-price">৳${printer.pricePerPage.toFixed(2)} per page</div>
            <div class="printer-status">
                <span class="status-indicator status-${printer.status}"></span>
                <span>${printer.status}</span>
            </div>
            <button class="btn btn-primary btn-full" data-id="${printer.id}">Select Printer</button>
        `;
        
        printerGrid.appendChild(printerCard);
    });
}

function setupFilters() {
    const locationFilter = document.getElementById('location-filter');
    const priceFilter = document.getElementById('price-filter');
    
    if (!locationFilter || !priceFilter) return;
    
    locationFilter.addEventListener('change', applyFilters);
    priceFilter.addEventListener('change', applyFilters);
}

function applyFilters() {
    const locationFilter = document.getElementById('location-filter');
    const priceFilter = document.getElementById('price-filter');
    
    if (!locationFilter || !priceFilter) return;
    
    const locationValue = locationFilter.value;
    const priceValue = priceFilter.value;
    
    let filteredPrinters = [...printerData];
    
    // Filter by location
    if (locationValue !== 'all') {
        filteredPrinters = filteredPrinters.filter(printer => printer.location === locationValue);
    }
    
    // Sort by price
    if (priceValue === 'low') {
        filteredPrinters.sort((a, b) => a.pricePerPage - b.pricePerPage);
    } else if (priceValue === 'high') {
        filteredPrinters.sort((a, b) => b.pricePerPage - a.pricePerPage);
    }
    
    renderPrinterGrid(filteredPrinters);
}

function populatePrinterSelect() {
    const selectedPrinterSelect = document.getElementById('selected-printer');
    if (!selectedPrinterSelect) return;
    
    // Clear existing options except the first one
    while (selectedPrinterSelect.options.length > 1) {
        selectedPrinterSelect.remove(1);
    }
    
    // Add printer options
    printerData.forEach(printer => {
        const option = document.createElement('option');
        option.value = printer.id;
        option.textContent = `${printer.name} (${printer.location}) - ৳${parseFloat(printer.pricePerPage).toFixed(2)}/page`;
        
        if (printer.status === 'offline') {
            option.disabled = true;
            option.textContent += ' (Offline)';
        }
        
        selectedPrinterSelect.appendChild(option);
    });
}

function setupCalculator() {
    const selectedPrinterSelect = document.getElementById('selected-printer');
    const pageCountInput = document.getElementById('page-count');
    const deliveryOptions = document.querySelectorAll('input[name="delivery"]');
    const paymentToggle = document.getElementById('payment-toggle');
    const printingCostElement = document.getElementById('printing-cost');
    const deliveryCostElement = document.getElementById('delivery-cost');
    const totalCostElement = document.getElementById('total-cost');
    
    if (!selectedPrinterSelect || !pageCountInput) return;
    
    selectedPrinterSelect.addEventListener('change', updateCalculator);
    pageCountInput.addEventListener('input', updateCalculator);
    
    if (deliveryOptions) {
        deliveryOptions.forEach(option => {
            option.addEventListener('change', updateCalculator);
        });
    }
    
    if (paymentToggle) {
        paymentToggle.addEventListener('change', updatePaymentMethod);
    }
    
    // Initial calculation
    updateCalculator();
}

function updatePaymentMethod() {
    const paymentToggle = document.getElementById('payment-toggle');
    const toggleLabel = document.querySelector('.toggle-label');
    
    const isToggled = paymentToggle.checked;
    
    if (isToggled) {
        toggleLabel.classList.add('toggled');
        // Additional logic for using credits instead of bKash
    } else {
        toggleLabel.classList.remove('toggled');
        // Additional logic for using bKash
    }
    
    updateCalculator();
}

function updateCalculator() {
    if (!printingCostElement || !deliveryCostElement || !totalCostElement) return;
    
    const selectedPrinter = printerData.find(printer => printer.id == selectedPrinterSelect.value);
    const pageCount = parseInt(pageCountInput.value) || 0;
    const deliveryOption = document.querySelector('input[name="delivery"]:checked')?.value || 'self';
    const isUsingCredits = paymentToggle && paymentToggle.checked;
    
    let printingCost = 0;
    let deliveryCost = 0;
    
    // Calculate printing cost
    if (selectedPrinter) {
        printingCost = selectedPrinter.pricePerPage * pageCount;
    }
    
    // Calculate delivery cost
    if (deliveryOption === 'class') {
        deliveryCost = 10; // ৳10 for class delivery
    }
    
    // Total cost
    const totalCost = printingCost + deliveryCost;
    
    // Update display
    printingCostElement.textContent = `৳${printingCost.toFixed(2)}`;
    deliveryCostElement.textContent = `৳${deliveryCost.toFixed(2)}`;
    totalCostElement.textContent = `৳${totalCost.toFixed(2)}`;
    
    // Add discount logic if using credits (for example)
    if (isUsingCredits) {
        // Add a discount indicator or other credit-specific UI updates
        const discountText = document.createElement('div');
        discountText.className = 'cost-item discount';
        discountText.innerHTML = '<span>Credit Balance Applied</span>';
        
        // Remove any existing discount elements before adding a new one
        const existingDiscount = document.querySelector('.cost-item.discount');
        if (existingDiscount) {
            existingDiscount.remove();
        }
        
        const totalElement = document.querySelector('.cost-item.total');
        if (totalElement) {
            totalElement.parentNode.insertBefore(discountText, totalElement);
        }
    } else {
        // Remove any discount elements if not using credits
        const existingDiscount = document.querySelector('.cost-item.discount');
        if (existingDiscount) {
            existingDiscount.remove();
        }
    }
} 
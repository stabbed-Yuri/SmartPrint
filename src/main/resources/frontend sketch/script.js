// Sample data for printers
const printers = [
    {
        id: 1,
        name: 'HP LaserJet Pro',
        location: 'library',
        locationName: 'Main Library',
        owner: 'Library Services',
        pricePerPage: 2.00,
        status: 'online'
    },
    {
        id: 2,
        name: 'Canon PIXMA',
        location: 'science',
        locationName: 'Science Building',
        owner: 'Science Department',
        pricePerPage: 2.50,
        status: 'online'
    },
    {
        id: 3,
        name: 'Epson EcoTank',
        location: 'student-center',
        locationName: 'Student Center',
        owner: 'Student Union',
        pricePerPage: 1.50,
        status: 'online'
    },
    {
        id: 4,
        name: 'Brother MFC',
        location: 'dorm',
        locationName: 'North Dormitory',
        owner: 'Residence Life',
        pricePerPage: 3.00,
        status: 'offline'
    },
    {
        id: 5,
        name: 'Xerox WorkCentre',
        location: 'library',
        locationName: 'Research Library',
        owner: 'Library Services',
        pricePerPage: 1.75,
        status: 'online'
    },
    {
        id: 6,
        name: 'Samsung ProXpress',
        location: 'science',
        locationName: 'Engineering Lab',
        owner: 'Engineering Department',
        pricePerPage: 2.25,
        status: 'offline'
    },
    {
        id: 7,
        name: 'Lexmark MS',
        location: 'student-center',
        locationName: 'Cafeteria',
        owner: 'Food Services',
        pricePerPage: 2.00,
        status: 'online'
    },
    {
        id: 8,
        name: 'Ricoh SP',
        location: 'dorm',
        locationName: 'South Dormitory',
        owner: 'Residence Life',
        pricePerPage: 2.50,
        status: 'online'
    }
];

// Sample data for owner's printers
const ownerPrinters = [
    {
        id: 101,
        name: 'HP LaserJet Pro',
        location: 'library',
        locationName: 'Main Library',
        pricePerPage: 2.00,
        status: 'online',
        totalJobs: 45,
        revenue: 1350
    },
    {
        id: 102,
        name: 'Xerox WorkCentre',
        location: 'library',
        locationName: 'Research Library',
        pricePerPage: 1.75,
        status: 'online',
        totalJobs: 62,
        revenue: 2170
    },
    {
        id: 103,
        name: 'Epson EcoTank',
        location: 'student-center',
        locationName: 'Student Center',
        pricePerPage: 1.50,
        status: 'offline',
        totalJobs: 17,
        revenue: 1040
    }
];

// DOM Elements
const hamburgerBtn = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const filePreviews = document.getElementById('file-previews');
const totalPagesElement = document.getElementById('total-pages');
const locationFilter = document.getElementById('location-filter');
const priceFilter = document.getElementById('price-filter');
const printerGrid = document.querySelector('.printer-grid');
const selectedPrinterSelect = document.getElementById('selected-printer');
const pageCountInput = document.getElementById('page-count');
const deliveryOptions = document.querySelectorAll('input[name="delivery"]');
const paymentToggle = document.getElementById('payment-toggle');
const printingCostElement = document.getElementById('printing-cost');
const deliveryCostElement = document.getElementById('delivery-cost');
const totalCostElement = document.getElementById('total-cost');
const ownerDashboard = document.getElementById('owner-dashboard');
const printerTableBody = document.getElementById('printer-table-body');
const addPrinterForm = document.getElementById('add-printer-form');

// Global variables
let uploadedFiles = [];
let totalPages = 0;
let selectedPrinterId = null;
let isOwner = false; // Set to true to show owner dashboard

// Initialize the application
function init() {
    // Mobile menu toggle
    hamburgerBtn.addEventListener('click', toggleMobileMenu);
    
    // File upload functionality
    setupFileUpload();
    
    // Render printer grid
    renderPrinterGrid(printers);
    
    // Populate printer select in calculator
    populatePrinterSelect();
    
    // Setup calculator event listeners
    setupCalculator();
    
    // Setup filters
    setupFilters();
    
    // Check if user is owner and render owner dashboard
    if (isOwner) {
        ownerDashboard.classList.remove('hidden');
        renderOwnerDashboard();
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    hamburgerBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    
    // Update ARIA attributes
    const isExpanded = hamburgerBtn.classList.contains('active');
    hamburgerBtn.setAttribute('aria-expanded', isExpanded);
}

// Setup file upload functionality
function setupFileUpload() {
    // Click on browse link
    document.querySelector('.browse-link').addEventListener('click', () => {
        fileInput.click();
    });
    
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

// Prevent default drag and drop behavior
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop area
function highlight() {
    dropArea.classList.add('drag-over');
}

// Remove highlight from drop area
function unhighlight() {
    dropArea.classList.remove('drag-over');
}

// Handle dropped files
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// Handle selected files
function handleFiles(e) {
    const files = e.target?.files || e;
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type (PDF only)
        if (file.type !== 'application/pdf') {
            alert('Only PDF files are allowed.');
            continue;
        }
        
        // Add file to uploaded files array
        const fileObj = {
            id: Date.now() + i,
            file: file,
            name: file.name,
            size: formatFileSize(file.size),
            pages: Math.floor(Math.random() * 20) + 1 // Simulate page count (in real app, would extract from PDF)
        };
        
        uploadedFiles.push(fileObj);
        
        // Update total pages
        totalPages += fileObj.pages;
        totalPagesElement.textContent = totalPages;
        
        // Update page count in calculator
        pageCountInput.value = totalPages;
        updateCalculator();
        
        // Render file preview
        renderFilePreview(fileObj);
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

// Render file preview
function renderFilePreview(fileObj) {
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
            <div class="file-name">${fileObj.name}</div>
            <div class="file-size">${fileObj.size}</div>
        </div>
        <div class="file-pages">${fileObj.pages} pages</div>
        <button class="file-remove" aria-label="Remove file">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    
    // Add remove event listener
    filePreview.querySelector('.file-remove').addEventListener('click', () => {
        removeFile(fileObj.id);
    });
    
    filePreviews.appendChild(filePreview);
}

// Remove file
function removeFile(id) {
    const fileIndex = uploadedFiles.findIndex(file => file.id === id);
    if (fileIndex !== -1) {
        // Update total pages
        totalPages -= uploadedFiles[fileIndex].pages;
        totalPagesElement.textContent = totalPages;
        
        // Update page count in calculator
        pageCountInput.value = totalPages > 0 ? totalPages : 1;
        updateCalculator();
        
        // Remove file from array
        uploadedFiles.splice(fileIndex, 1);
        
        // Remove file preview
        document.querySelector(`.file-preview[data-id="${id}"]`).remove();
    }
}

// Render printer grid
function renderPrinterGrid(printers) {
    printerGrid.innerHTML = '';
    
    printers.forEach(printer => {
        const printerCard = document.createElement('div');
        printerCard.className = 'printer-card';
        
        printerCard.innerHTML = `
            <h3>${printer.name}</h3>
            <div class="printer-location">${printer.locationName}</div>
            <div class="printer-owner">Owner: ${printer.owner}</div>
            <div class="printer-price">৳${printer.pricePerPage.toFixed(2)} per page</div>
            <div class="printer-status">
                <span class="status-indicator status-${printer.status}"></span>
                ${printer.status === 'online' ? 'Online' : 'Offline'}
            </div>
        `;
        
        printerGrid.appendChild(printerCard);
    });
}

// Setup filters
function setupFilters() {
    locationFilter.addEventListener('change', applyFilters);
    priceFilter.addEventListener('change', applyFilters);
}

// Apply filters
function applyFilters() {
    const locationValue = locationFilter.value;
    const priceValue = priceFilter.value;
    
    let filteredPrinters = [...printers];
    
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

// Populate printer select in calculator
function populatePrinterSelect() {
    selectedPrinterSelect.innerHTML = '<option value="">Select a printer</option>';
    
    printers.forEach(printer => {
        if (printer.status === 'online') {
            const option = document.createElement('option');
            option.value = printer.id;
            option.textContent = `${printer.name} (${printer.locationName}) - ৳${printer.pricePerPage.toFixed(2)}/page`;
            selectedPrinterSelect.appendChild(option);
        }
    });
}

// Setup calculator
function setupCalculator() {
    selectedPrinterSelect.addEventListener('change', updateCalculator);
    pageCountInput.addEventListener('input', updateCalculator);
    
    deliveryOptions.forEach(option => {
        option.addEventListener('change', updateCalculator);
    });
    
    paymentToggle.addEventListener('change', updateCalculator);
}

// Update calculator
function updateCalculator() {
    const selectedPrinterId = selectedPrinterSelect.value;
    const pageCount = parseInt(pageCountInput.value) || 0;
    const deliveryOption = document.querySelector('input[name="delivery"]:checked').value;
    
    let printerPrice = 0;
    if (selectedPrinterId) {
        const selectedPrinter = printers.find(printer => printer.id == selectedPrinterId);
        printerPrice = selectedPrinter ? selectedPrinter.pricePerPage : 0;
    }
    
    // Calculate costs
    const printingCost = printerPrice * pageCount;
    const deliveryCost = deliveryOption === 'class' ? 10 : 0;
    const totalCost = printingCost + deliveryCost;
    
    // Update display
    printingCostElement.textContent = `৳${printingCost.toFixed(2)}`;
    deliveryCostElement.textContent = `৳${deliveryCost.toFixed(2)}`;
    totalCostElement.textContent = `৳${totalCost.toFixed(2)}`;
}

// Render owner dashboard
function renderOwnerDashboard() {
    // Render printer table
    renderPrinterTable();
    
    // Setup add printer form
    setupAddPrinterForm();
}

// Render printer table
function renderPrinterTable() {
    printerTableBody.innerHTML = '';
    
    ownerPrinters.forEach(printer => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${printer.name}</td>
            <td>${printer.locationName}</td>
            <td>৳${printer.pricePerPage.toFixed(2)}</td>
            <td>
                <button class="status-toggle ${printer.status}" data-id="${printer.id}" data-status="${printer.status}">
                    ${printer.status === 'online' ? 'Online' : 'Offline'}
                </button>
            </td>
            <td>
                <button class="btn btn-secondary" data-action="edit" data-id="${printer.id}">Edit</button>
                <button class="btn btn-secondary" data-action="delete" data-id="${printer.id}">Delete</button>
            </td>
        `;
        
        // Add event listeners
        row.querySelector('.status-toggle').addEventListener('click', togglePrinterStatus);
        row.querySelector('[data-action="edit"]').addEventListener('click', editPrinter);
        row.querySelector('[data-action="delete"]').addEventListener('click', deletePrinter);
        
        printerTableBody.appendChild(row);
    });
}

// Toggle printer status
function togglePrinterStatus(e) {
    const button = e.target;
    const printerId = button.dataset.id;
    const currentStatus = button.dataset.status;
    const newStatus = currentStatus === 'online' ? 'offline' : 'online';
    
    // Update printer status in data
    const printerIndex = ownerPrinters.findIndex(printer => printer.id == printerId);
    if (printerIndex !== -1) {
        ownerPrinters[printerIndex].status = newStatus;
    }
    
    // Update button
    button.dataset.status = newStatus;
    button.textContent = newStatus === 'online' ? 'Online' : 'Offline';
    button.className = `status-toggle ${newStatus}`;
}

// Edit printer
function editPrinter(e) {
    const printerId = e.target.dataset.id;
    alert(`Edit printer ${printerId} (functionality would be implemented in a real app)`);
}

// Delete printer
function deletePrinter(e) {
    const printerId = e.target.dataset.id;
    if (confirm('Are you sure you want to delete this printer?')) {
        // Remove printer from data
        const printerIndex = ownerPrinters.findIndex(printer => printer.id == printerId);
        if (printerIndex !== -1) {
            ownerPrinters.splice(printerIndex, 1);
            
            // Re-render printer table
            renderPrinterTable();
        }
    }
}

// Setup add printer form
function setupAddPrinterForm() {
    addPrinterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('printer-name').value;
        const location = document.getElementById('printer-location').value;
        const locationName = document.getElementById('printer-location').options[document.getElementById('printer-location').selectedIndex].text;
        const pricePerPage = parseFloat(document.getElementById('printer-price').value);
        const status = document.getElementById('printer-status').value;
        
        // Create new printer object
        const newPrinter = {
            id: Date.now(),
            name,
            location,
            locationName,
            pricePerPage,
            status,
            totalJobs: 0,
            revenue: 0
        };
        
        // Add to owner printers
        ownerPrinters.push(newPrinter);
        
        // Re-render printer table
        renderPrinterTable();
        
        // Reset form
        addPrinterForm.reset();
    });
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
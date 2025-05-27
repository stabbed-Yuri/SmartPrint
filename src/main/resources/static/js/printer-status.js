/**
 * Printer Status Refresh Functionality
 * Automatically refreshes printer status every 10 seconds
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize printer status refresh
    initPrinterStatusRefresh();
    setupToggleButtons();
});

/**
 * Initialize the printer status refresh functionality
 */
function initPrinterStatusRefresh() {
    // Check if we're on a page with printer status elements
    const printerStatusElements = document.querySelectorAll('.printer-status');
    if (printerStatusElements.length === 0) return;
    
    // Perform initial refresh
    refreshPrinterStatus();
    
    // Set up the interval to refresh every 10 seconds
    setInterval(refreshPrinterStatus, 10000);
    
    console.log('Printer status refresh initialized. Will update every 10 seconds.');
}

/**
 * Refresh the printer status by fetching current data from the server
 */
function refreshPrinterStatus() {
    fetch('/api/printers/status')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updatePrinterStatusUI(data);
        })
        .catch(error => {
            console.error('Error refreshing printer status:', error);
        });
}

/**
 * Update the UI with the latest printer status data
 * @param {Array} printers - Array of printer objects with status information
 */
function updatePrinterStatusUI(printers) {
    // Find all printer cards in the DOM
    const printerCards = document.querySelectorAll('.printer-card');
    
    // Create a lookup map for faster printer data access
    const printersMap = {};
    printers.forEach(printer => {
        printersMap[printer.id] = printer;
    });
    
    printerCards.forEach(card => {
        // Get the printer ID either from the card attribute or from the toggle button
        let printerId = card.getAttribute('data-printer-id');
        if (!printerId) {
            const toggleBtn = card.querySelector('.printer-toggle-btn');
            if (toggleBtn) {
                printerId = toggleBtn.getAttribute('data-printer-id');
            }
        }
        
        if (!printerId) return;
        
        // Find the matching printer in the data
        const printer = printersMap[printerId];
        if (!printer) {
            console.warn(`No data received for printer ID: ${printerId}`);
            // If no data for this printer, mark it as offline
            updateCardAsOffline(card);
            return;
        }
        
        // Update the status display
        const statusElement = card.querySelector('.printer-status');
        if (statusElement) {
            // Remove all previous status classes
            statusElement.classList.remove('online', 'offline', 'maintenance', 'error');
            
            // Add the new status class and update text
            const statusLower = printer.status.toLowerCase();
            statusElement.classList.add(statusLower);
            statusElement.textContent = printer.status;
        }
        
        // Update toggle buttons
        const onlineBtn = card.querySelector('.printer-toggle-btn[data-action="online"]');
        const offlineBtn = card.querySelector('.printer-toggle-btn[data-action="offline"]');
        
        if (onlineBtn && offlineBtn) {
            if (printer.status === 'ONLINE') {
                onlineBtn.style.display = 'none';
                offlineBtn.style.display = 'inline-block';
            } else {
                onlineBtn.style.display = 'inline-block';
                offlineBtn.style.display = 'none';
            }
        }
        
        // Update queue length if available
        const queueElement = card.querySelector('.printer-details p:nth-child(4) span');
        if (queueElement && printer.queueLength !== undefined) {
            queueElement.textContent = `Queue: ${printer.queueLength} jobs`;
        }
    });
    
    // Also update status count in stats section if present
    updateStatusCounts(printers);
    
    console.log('Printer status updated at:', new Date().toLocaleTimeString());
}

/**
 * Set a printer card to offline state when no data is received
 * @param {Element} card - The printer card element
 */
function updateCardAsOffline(card) {
    const statusElement = card.querySelector('.printer-status');
    if (statusElement) {
        statusElement.classList.remove('online', 'maintenance', 'error');
        statusElement.classList.add('offline');
        statusElement.textContent = 'OFFLINE';
    }
    
    const onlineBtn = card.querySelector('.printer-toggle-btn[data-action="online"]');
    const offlineBtn = card.querySelector('.printer-toggle-btn[data-action="offline"]');
    
    if (onlineBtn && offlineBtn) {
        onlineBtn.style.display = 'inline-block';
        offlineBtn.style.display = 'none';
    }
}

/**
 * Update the printer status counts in the stats section
 * @param {Array} printers - Array of printer objects
 */
function updateStatusCounts(printers) {
    const totalElement = document.querySelector('.stats-card:nth-child(1) .stats-number');
    const onlineElement = document.querySelector('.stats-card:nth-child(2) .stats-number');
    const offlineElement = document.querySelector('.stats-card:nth-child(3) .stats-number');
    const maintenanceElement = document.querySelector('.stats-card:nth-child(4) .stats-number');
    
    if (totalElement) {
        totalElement.textContent = printers.length;
    }
    
    if (onlineElement) {
        const onlineCount = printers.filter(p => p.status === 'ONLINE').length;
        onlineElement.textContent = onlineCount;
    }
    
    if (offlineElement) {
        const offlineCount = printers.filter(p => p.status === 'OFFLINE').length;
        offlineElement.textContent = offlineCount;
    }
    
    if (maintenanceElement) {
        const maintenanceCount = printers.filter(p => p.status === 'MAINTENANCE').length;
        maintenanceElement.textContent = maintenanceCount;
    }
}

/**
 * Set up event listeners for the toggle buttons
 */
function setupToggleButtons() {
    const toggleButtons = document.querySelectorAll('.printer-toggle-btn');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const printerId = this.getAttribute('data-printer-id');
            const action = this.getAttribute('data-action');
            
            let newStatus = action === 'online' ? 'ONLINE' : 'OFFLINE';
            
            fetch(`/api/printers/${printerId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            })
            .then(response => {
                if (response.ok) {
                    // Manually update the UI immediately without waiting for the refresh interval
                    const card = this.closest('.printer-card');
                    const statusElement = card.querySelector('.printer-status');
                    
                    if (statusElement) {
                        statusElement.classList.remove('online', 'offline', 'maintenance', 'error');
                        statusElement.classList.add(newStatus.toLowerCase());
                        statusElement.textContent = newStatus;
                    }
                    
                    // Toggle button visibility
                    const onlineBtn = card.querySelector('.printer-toggle-btn[data-action="online"]');
                    const offlineBtn = card.querySelector('.printer-toggle-btn[data-action="offline"]');
                    
                    if (onlineBtn && offlineBtn) {
                        if (newStatus === 'ONLINE') {
                            onlineBtn.style.display = 'none';
                            offlineBtn.style.display = 'inline-block';
                        } else {
                            onlineBtn.style.display = 'inline-block';
                            offlineBtn.style.display = 'none';
                        }
                    }
                    
                    // Refresh all printer statuses to update counts and other information
                    refreshPrinterStatus();
                } else {
                    console.error('Failed to update printer status');
                }
            })
            .catch(error => {
                console.error('Error updating printer status:', error);
            });
        });
    });
} 
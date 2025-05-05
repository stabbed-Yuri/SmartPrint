document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const hamburgerBtn = document.querySelector('.hamburger');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function() {
            hamburgerBtn.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            
            // Update ARIA attributes
            const isExpanded = hamburgerBtn.classList.contains('active');
            hamburgerBtn.setAttribute('aria-expanded', isExpanded);
        });
    }
    
    // Job status filter
    const statusFilter = document.getElementById('job-status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterJobsByStatus);
    }
    
    // Add event listeners to action buttons
    setupActionButtons();
    
    // Add event listener to add printer button
    const addPrinterBtn = document.querySelector('.add-button');
    if (addPrinterBtn) {
        addPrinterBtn.addEventListener('click', showAddPrinterModal);
    }
    
    // Modal close button
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideAddPrinterModal);
    }
    
    // Cancel button in modal
    const cancelBtn = document.getElementById('cancel-add-printer');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideAddPrinterModal);
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('add-printer-modal');
        if (event.target === modal) {
            hideAddPrinterModal();
        }
    });
    
    // Add printer form submission
    const addPrinterForm = document.getElementById('add-printer-form');
    if (addPrinterForm) {
        addPrinterForm.addEventListener('submit', handleAddPrinterFormSubmit);
    }
});

function filterJobsByStatus() {
    const statusFilter = document.getElementById('job-status-filter');
    const selectedStatus = statusFilter.value.toUpperCase();
    const jobRows = document.querySelectorAll('.job-table tbody tr');
    
    jobRows.forEach(row => {
        const statusCell = row.querySelector('td:nth-child(6) .status-indicator');
        const rowStatus = statusCell.textContent.trim().toUpperCase();
        
        if (selectedStatus === 'ALL' || rowStatus === selectedStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function setupActionButtons() {
    // Edit printer buttons
    const editButtons = document.querySelectorAll('.btn-icon.edit');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const printerId = this.getAttribute('data-id');
            editPrinter(printerId);
        });
    });
    
    // Delete printer buttons
    const deleteButtons = document.querySelectorAll('.btn-icon.delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const printerId = this.getAttribute('data-id');
            deletePrinter(printerId);
        });
    });
    
    // View job buttons
    const viewButtons = document.querySelectorAll('.btn-icon.view');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const jobId = this.getAttribute('data-id');
            viewJobDetails(jobId);
        });
    });
    
    // Print job buttons
    const printButtons = document.querySelectorAll('.btn-icon.print');
    printButtons.forEach(button => {
        button.addEventListener('click', function() {
            const jobId = this.getAttribute('data-id');
            printJob(jobId);
        });
    });
}

function editPrinter(printerId) {
    // In a real implementation, this would fetch the printer details and show an edit modal
    fetch(`/api/printers/${printerId}`)
        .then(response => response.json())
        .then(printer => {
            console.log('Editing printer:', printer);
            // Show edit modal with printer data
            // ...
        })
        .catch(error => {
            console.error('Error fetching printer details:', error);
            alert('Failed to load printer details. Please try again.');
        });
}

function deletePrinter(printerId) {
    // Confirm deletion
    if (confirm('Are you sure you want to delete this printer? This action cannot be undone.')) {
        // In a real implementation, this would send a DELETE request to the server
        fetch(`/api/printers/${printerId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (response.ok) {
                    // Remove the row from the table
                    const row = document.querySelector(`.printer-table tr [data-id="${printerId}"]`).closest('tr');
                    row.remove();
                    alert('Printer deleted successfully.');
                } else {
                    alert('Failed to delete printer. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error deleting printer:', error);
                alert('Failed to delete printer. Please try again.');
            });
    }
}

function viewJobDetails(jobId) {
    // In a real implementation, this would fetch the job details and show a details modal
    fetch(`/api/print/${jobId}`)
        .then(response => response.json())
        .then(job => {
            console.log('Viewing job details:', job);
            // Show job details modal
            // ...
        })
        .catch(error => {
            console.error('Error fetching job details:', error);
            alert('Failed to load job details. Please try again.');
        });
}

function printJob(jobId) {
    // In a real implementation, this would send a request to trigger printing
    fetch(`/api/print/${jobId}/print`, {
        method: 'POST'
    })
        .then(response => {
            if (response.ok) {
                alert('Print job sent to printer successfully.');
                // Update the job status in the UI
                const statusCell = document.querySelector(`.job-table tr [data-id="${jobId}"]`).closest('tr').querySelector('td:nth-child(6) .status-indicator');
                statusCell.textContent = 'printing';
                statusCell.className = 'status-indicator status-printing';
            } else {
                alert('Failed to send print job. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error sending print job:', error);
            alert('Failed to send print job. Please try again.');
        });
}

function showAddPrinterModal() {
    const modal = document.getElementById('add-printer-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

function hideAddPrinterModal() {
    const modal = document.getElementById('add-printer-modal');
    if (modal) {
        modal.classList.remove('active');
        // Reset form
        const form = document.getElementById('add-printer-form');
        if (form) {
            form.reset();
        }
    }
}

// Function to check printer status via the Raspberry Pi API
function checkPrinterStatus(ipAddress) {
    // Add a timeout to prevent blocking if the printer is unreachable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    fetch(`http://${ipAddress}:5000/status`, { 
        signal: controller.signal,
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Printer status:', data);
        // Update printer status in the UI
        clearTimeout(timeoutId);
    })
    .catch(error => {
        console.error('Error checking printer status:', error);
        // Update printer status to offline
        clearTimeout(timeoutId);
    });
}

// Periodically check status of all printers (e.g., every 30 seconds)
setInterval(() => {
    const printerRows = document.querySelectorAll('.printer-table tbody tr');
    printerRows.forEach(row => {
        const ipAddressCell = row.querySelector('td:nth-child(4)');
        if (ipAddressCell) {
            const ipAddress = ipAddressCell.textContent.trim();
            checkPrinterStatus(ipAddress);
        }
    });
}, 30000);

function handleAddPrinterFormSubmit(event) {
    event.preventDefault();
    console.log('Form submission started');
    
    const form = event.target;
    const formData = new FormData(form);
    
    console.log('Form action:', form.action);
    console.log('Form method:', form.method);
    
    // Log form data
    console.log('Form data:');
    formData.forEach((value, key) => {
        console.log(`${key}: ${value}`);
    });
    
    // Convert FormData to JSON
    const printerData = {};
    formData.forEach((value, key) => {
        printerData[key] = value;
    });
    
    console.log('Printer data JSON:', JSON.stringify(printerData));
    
    // Validate IP address format
    const ipAddress = printerData.ipAddress;
    if (!isValidIpAddress(ipAddress)) {
        alert('Please enter a valid IP address (e.g., 192.168.1.100)');
        return;
    }
    
    console.log('IP address validation passed');
    
    // Send form data to server
    console.log('Sending fetch request to:', form.action);
    
    // Check if we need to include CSRF token
    const csrfToken = document.querySelector('input[name="_csrf"]');
    if (csrfToken) {
        console.log('CSRF token found:', csrfToken.value);
    } else {
        console.log('No CSRF token found in the form');
    }
    
    // Instead of using JSON, let's use the form's natural submission
    form.submit();
    
    // The code below is commented out as we're using form.submit() instead
    /*
    fetch(form.action, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(printerData)
    })
    .then(response => {
        console.log('Response status:', response.status);
        
        if (response.ok) {
            return response.json().then(data => {
                console.log('Success response data:', data);
                alert('Printer added successfully!');
                hideAddPrinterModal();
                // Reload the page to show the new printer
                window.location.reload();
            }).catch(error => {
                console.log('Response is not JSON but status is OK');
                // If response is ok but not JSON, still consider it success
                alert('Printer added successfully!');
                hideAddPrinterModal();
                window.location.reload();
            });
        } else {
            return response.text().then(text => {
                console.error('Server error:', text);
                alert(`Failed to add printer: ${text || 'Unknown error'}`);
            });
        }
    })
    .catch(error => {
        console.error('Error adding printer:', error);
        alert('Failed to add printer. Please try again.');
    });
    */
}

function isValidIpAddress(ip) {
    // Simple IP address validation regex
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
        return false;
    }
    
    // Check that each octet is between 0 and 255
    const octets = ip.split('.');
    for (let octet of octets) {
        const num = parseInt(octet, 10);
        if (num < 0 || num > 255) {
            return false;
        }
    }
    
    return true;
} 
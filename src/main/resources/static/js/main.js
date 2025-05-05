/**
 * SmartPrint - Main JavaScript File
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });

    // Initialize Bootstrap popovers
    const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
    popovers.forEach(popover => {
        new bootstrap.Popover(popover);
    });
    
    // File upload functionality
    setupFileUpload();
    
    // Check all data-action elements
    setupDataActions();
    
    // Console log for debugging
    console.log('SmartPrint JavaScript initialized');
});

/**
 * File Upload Functionality
 */
function setupFileUpload() {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const filePreviews = document.getElementById('file-previews');
    
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
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropArea.classList.add('drag-over');
    }
    
    function unhighlight() {
        dropArea.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        handleFiles({ target: { files: files } });
    }
    
    function handleFiles(e) {
        if (!filePreviews) return;
        
        const files = Array.from(e.target.files);
        
        files.forEach(file => {
            // Check if it's a PDF
            if (file.type !== 'application/pdf') {
                showToast('Error', 'Only PDF files are allowed.', 'danger');
                return;
            }
            
            // Generate a unique ID
            const fileId = Date.now() + Math.random().toString(36).substr(2, 5);
            
            // Count PDF pages
            countPdfPages(file, (pageCount) => {
                // Create file preview
                renderFilePreview({
                    id: fileId,
                    file: file,
                    name: file.name,
                    size: file.size,
                    pages: pageCount
                });
                
                // Update total pages if there's a counter
                updateTotalPages();
            });
        });
        
        // Reset file input
        fileInput.value = '';
    }
    
    function countPdfPages(file, callback) {
        // In a real implementation, you would use a library like pdf.js
        // For now, we'll just estimate based on file size (very rough)
        const pageEstimate = Math.max(1, Math.floor(file.size / 30000));
        callback(pageEstimate);
    }
    
    function renderFilePreview(fileObj) {
        if (!filePreviews) return;
        
        const filePreview = document.createElement('div');
        filePreview.className = 'file-preview';
        filePreview.dataset.id = fileObj.id;
        
        filePreview.innerHTML = `
            <div class="file-icon">
                <i class="far fa-file-pdf fa-2x text-danger"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${fileObj.name}</div>
                <div class="file-size">${formatFileSize(fileObj.size)}</div>
            </div>
            <div class="file-pages">${fileObj.pages} pages</div>
            <button class="file-remove" data-id="${fileObj.id}" aria-label="Remove file">×</button>
        `;
        
        filePreviews.appendChild(filePreview);
        
        // Add event listener to remove button
        const removeBtn = filePreview.querySelector('.file-remove');
        removeBtn.addEventListener('click', () => removeFile(fileObj.id));
    }
    
    function removeFile(id) {
        if (!filePreviews) return;
        
        // Remove from DOM
        const filePreview = document.querySelector(`.file-preview[data-id="${id}"]`);
        if (filePreview) {
            filePreview.remove();
        }
        
        // Update total pages
        updateTotalPages();
    }
    
    function updateTotalPages() {
        const totalPagesElement = document.getElementById('total-pages');
        const pageCountInput = document.getElementById('page-count');
        
        if (!totalPagesElement && !pageCountInput) return;
        
        // Count pages from all files
        let totalPages = 0;
        document.querySelectorAll('.file-preview').forEach(preview => {
            const pagesText = preview.querySelector('.file-pages').textContent;
            const pages = parseInt(pagesText);
            if (!isNaN(pages)) {
                totalPages += pages;
            }
        });
        
        // Update display
        if (totalPagesElement) {
            totalPagesElement.textContent = totalPages;
        }
        
        // Update input
        if (pageCountInput) {
            pageCountInput.value = totalPages;
            // Trigger change event
            const event = new Event('change');
            pageCountInput.dispatchEvent(event);
        }
    }
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }
}

/**
 * Setup for data-action elements
 */
function setupDataActions() {
    document.querySelectorAll('[data-action]').forEach(element => {
        const action = element.dataset.action;
        
        if (action === 'check-printer-status') {
            element.addEventListener('click', function() {
                const printerId = this.dataset.id;
                const ipAddress = this.dataset.ip;
                
                if (!ipAddress) {
                    showToast('Error', 'IP address is missing', 'danger');
                    return;
                }
                
                const statusIndicator = document.querySelector(`[data-status-for="${printerId}"]`);
                if (statusIndicator) {
                    checkPrinterStatus(ipAddress, statusIndicator, printerId);
                }
            });
        }
    });
}

/**
 * Check Printer Status
 */
function checkPrinterStatus(ipAddress, statusElement, printerId) {
    // Update UI to show checking
    statusElement.textContent = 'Checking...';
    statusElement.className = 'status-badge';
    
    // In a real implementation, this would make an API call to check the status
    setTimeout(() => {
        try {
            fetch(`http://${ipAddress}:5000/status`, { 
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                // Set a timeout to avoid hanging
                signal: AbortSignal.timeout(5000)
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Failed to connect to printer');
            })
            .then(data => {
                statusElement.textContent = 'ONLINE';
                statusElement.className = 'status-badge online';
                
                // Update the printer status in the database
                if (printerId) {
                    updatePrinterStatus(printerId, 'ONLINE');
                }
            })
            .catch(error => {
                statusElement.textContent = 'OFFLINE';
                statusElement.className = 'status-badge offline';
                console.error('Error checking printer status:', error);
                
                // Update the printer status in the database
                if (printerId) {
                    updatePrinterStatus(printerId, 'OFFLINE');
                }
            });
        } catch (error) {
            statusElement.textContent = 'ERROR';
            statusElement.className = 'status-badge error';
            console.error('Error:', error);
        }
    }, 1000);
}

/**
 * Update Printer Status in Database
 */
function updatePrinterStatus(printerId, status) {
    fetch(`/api/printers/${printerId}/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: status })
    }).catch(error => console.error('Error updating printer status:', error));
}

/**
 * Show Toast Message
 */
function showToast(title, message, type = 'info') {
    // Check if toast container exists, if not create it
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast text-white bg-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.setAttribute('id', toastId);
    
    // Toast content
    toast.innerHTML = `
        <div class="toast-header bg-${type} text-white">
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Initialize and show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove after hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
} 
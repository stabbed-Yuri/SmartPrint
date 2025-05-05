document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadPrinters();
    setupFileUpload();
    setupPrintOptions();
    setupPrintButton();
});

let currentFiles = [];
let totalPages = 0;

async function loadPrinters() {
    try {
        const response = await fetch('/api/printers', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const printers = await response.json();
            const printerSelect = document.getElementById('printerSelect');
            
            // Clear existing options except the first one
            while (printerSelect.options.length > 1) {
                printerSelect.remove(1);
            }
            
            printers.forEach(printer => {
                const option = document.createElement('option');
                option.value = printer.id;
                option.textContent = `${printer.name} (${printer.status})`;
                printerSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading printers:', error);
        showError('Failed to load printers. Please try again later.');
    }
}

function setupFileUpload() {
    const fileInput = document.getElementById('pdfUpload');
    const fileList = document.getElementById('fileList');

    fileInput.addEventListener('change', async (event) => {
        currentFiles = Array.from(event.target.files);
        fileList.innerHTML = '';
        totalPages = 0;

        if (currentFiles.length === 0) {
            document.getElementById('printButton').disabled = true;
            updateCostEstimate();
            return;
        }

        for (const file of currentFiles) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            try {
                const pageCount = await getPDFPageCount(file);
                totalPages += pageCount;
                
                fileItem.innerHTML = `
                    <span>${file.name}</span>
                    <span>${pageCount} pages</span>
                    <button class="remove-file" data-filename="${file.name}">×</button>
                `;
            } catch (error) {
                console.error('Error processing PDF:', error);
                fileItem.innerHTML = `
                    <span>${file.name}</span>
                    <span class="error">Error processing file</span>
                    <button class="remove-file" data-filename="${file.name}">×</button>
                `;
            }
            
            fileList.appendChild(fileItem);
        }

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-file').forEach(button => {
            button.addEventListener('click', (e) => {
                const filename = e.target.dataset.filename;
                currentFiles = currentFiles.filter(file => file.name !== filename);
                e.target.parentElement.remove();
                updateCostEstimate();
                document.getElementById('printButton').disabled = currentFiles.length === 0;
            });
        });

        updateCostEstimate();
        document.getElementById('printButton').disabled = currentFiles.length === 0;
    });
}

function setupPrintOptions() {
    const printOptions = document.querySelectorAll('input[type="radio"]');
    printOptions.forEach(option => {
        option.addEventListener('change', updateCostEstimate);
    });

    const printerSelect = document.getElementById('printerSelect');
    printerSelect.addEventListener('change', updateCostEstimate);
}

function setupPrintButton() {
    const printButton = document.getElementById('printButton');
    printButton.addEventListener('click', submitPrintJob);
}

async function getPDFPageCount(file) {
    // This is a placeholder. In a real implementation, you would need to:
    // 1. Send the file to the server
    // 2. Use a PDF library to count pages
    // 3. Return the count
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            // This is a simplified example. In reality, you'd need proper PDF parsing
            resolve(10); // Placeholder value
        };
        reader.readAsArrayBuffer(file);
    });
}

function updateCostEstimate() {
    const printType = document.querySelector('input[name="printType"]:checked').value;
    const pageSize = document.querySelector('input[name="pageSize"]:checked').value;
    const printerId = document.getElementById('printerSelect').value;
    
    if (!printerId) {
        document.getElementById('pageCount').textContent = `Total Pages: ${totalPages}`;
        document.getElementById('costEstimate').textContent = 'Please select a printer';
        return;
    }
    
    // Cost calculation (example rates)
    const rates = {
        blackAndWhite: {
            a4: 0.10,
            letter: 0.12
        },
        color: {
            a4: 0.50,
            letter: 0.60
        }
    };

    const costPerPage = rates[printType][pageSize];
    const totalCost = totalPages * costPerPage;

    document.getElementById('pageCount').textContent = `Total Pages: ${totalPages}`;
    document.getElementById('costEstimate').textContent = `Estimated Cost: $${totalCost.toFixed(2)}`;
}

async function submitPrintJob() {
    const printerId = document.getElementById('printerSelect').value;
    if (!printerId) {
        showError('Please select a printer');
        return;
    }

    const printType = document.querySelector('input[name="printType"]:checked').value;
    const pageSize = document.querySelector('input[name="pageSize"]:checked').value;
    const orientation = document.querySelector('input[name="orientation"]:checked').value;
    const deliveryOption = document.querySelector('input[name="deliveryOption"]:checked').value;

    const formData = new FormData();
    currentFiles.forEach(file => {
        formData.append('files', file);
    });

    formData.append('printerId', printerId);
    formData.append('printType', printType);
    formData.append('pageSize', pageSize);
    formData.append('orientation', orientation);
    formData.append('deliveryOption', deliveryOption);

    try {
        const response = await fetch('/api/print', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (response.ok) {
            showSuccess('Print job submitted successfully!');
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1500);
        } else {
            try {
                const errorData = await response.json();
                showError(errorData.message || 'Failed to submit print job');
            } catch (e) {
                showError('Failed to submit print job: ' + response.status);
            }
        }
    } catch (error) {
        console.error('Error submitting print job:', error);
        showError('An error occurred while submitting the print job');
    }
}

// Update printer status periodically
setInterval(async () => {
    try {
        const response = await fetch('/api/printers/status', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const status = await response.json();
            updatePrinterStatus(status);
        }
    } catch (error) {
        console.error('Error updating printer status:', error);
    }
}, 30000); // Update every 30 seconds

function updatePrinterStatus(status) {
    const statusContainer = document.getElementById('printerStatus');
    statusContainer.innerHTML = '';

    status.forEach(printer => {
        const statusElement = document.createElement('div');
        statusElement.className = `printer-status-item ${printer.status.toLowerCase()}`;
        statusElement.innerHTML = `
            <h4>${printer.name}</h4>
            <p>Status: ${printer.status}</p>
            <p>Location: ${printer.location}</p>
            <p>Queue: ${printer.queueLength} jobs</p>
        `;
        statusContainer.appendChild(statusElement);
    });
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.printing-container').prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.querySelector('.printing-container').prepend(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
} 
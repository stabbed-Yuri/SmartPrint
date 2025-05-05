document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserProfile();
    setupEventListeners();
});

async function loadUserProfile() {
    try {
        const response = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const profile = await response.json();
            updateProfileUI(profile);

            if (profile.userType === 'admin') {
                document.getElementById('adminSection').style.display = 'block';
                loadPrinterManagement();
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function updateProfileUI(profile) {
    document.getElementById('userName').textContent = profile.name;
    document.getElementById('userEmail').textContent = profile.email;
    document.getElementById('userType').textContent = profile.userType;

    // Update printing history
    const historyContainer = document.getElementById('printingHistory');
    historyContainer.innerHTML = '';

    profile.printingHistory.forEach(job => {
        const jobElement = document.createElement('div');
        jobElement.className = 'printing-history-item';
        jobElement.innerHTML = `
            <p><strong>Date:</strong> ${new Date(job.date).toLocaleDateString()}</p>
            <p><strong>Document:</strong> ${job.documentName}</p>
            <p><strong>Pages:</strong> ${job.pageCount}</p>
            <p><strong>Cost:</strong> $${job.cost.toFixed(2)}</p>
            <p><strong>Status:</strong> ${job.status}</p>
        `;
        historyContainer.appendChild(jobElement);
    });

    // Update payment information
    const paymentContainer = document.getElementById('paymentInfo');
    paymentContainer.innerHTML = `
        <p><strong>Payment Method:</strong> ${profile.paymentMethod || 'Not set'}</p>
        <p><strong>Balance:</strong> $${profile.balance.toFixed(2)}</p>
    `;
}

async function loadPrinterManagement() {
    try {
        const response = await fetch('/api/admin/printers', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const printers = await response.json();
            updatePrinterList(printers);
        }
    } catch (error) {
        console.error('Error loading printers:', error);
    }
}

function updatePrinterList(printers) {
    const printerList = document.getElementById('printerList');
    printerList.innerHTML = '';

    printers.forEach(printer => {
        const printerElement = document.createElement('div');
        printerElement.className = 'printer-item';
        printerElement.innerHTML = `
            <h4>${printer.name}</h4>
            <p>Status: ${printer.status}</p>
            <p>Location: ${printer.location}</p>
            <p>Queue: ${printer.queueLength} jobs</p>
            <button onclick="editPrinter('${printer.id}')">Edit</button>
            <button onclick="deletePrinter('${printer.id}')">Delete</button>
        `;
        printerList.appendChild(printerElement);
    });
}

function setupEventListeners() {
    const editProfileButton = document.getElementById('editProfile');
    if (editProfileButton) {
        editProfileButton.addEventListener('click', handleEditProfile);
    }

    const addPrinterButton = document.getElementById('addPrinter');
    if (addPrinterButton) {
        addPrinterButton.addEventListener('click', handleAddPrinter);
    }
}

async function handleEditProfile() {
    const newName = prompt('Enter new name:', document.getElementById('userName').textContent);
    if (!newName) return;

    try {
        const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newName })
        });

        if (response.ok) {
            loadUserProfile();
            alert('Profile updated successfully!');
        } else {
            alert('Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('An error occurred while updating profile');
    }
}

async function handleAddPrinter() {
    const name = prompt('Enter printer name:');
    if (!name) return;

    const location = prompt('Enter printer location:');
    if (!location) return;

    try {
        const response = await fetch('/api/admin/printers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, location })
        });

        if (response.ok) {
            loadPrinterManagement();
            alert('Printer added successfully!');
        } else {
            alert('Failed to add printer');
        }
    } catch (error) {
        console.error('Error adding printer:', error);
        alert('An error occurred while adding printer');
    }
}

async function editPrinter(printerId) {
    const name = prompt('Enter new printer name:');
    if (!name) return;

    const location = prompt('Enter new printer location:');
    if (!location) return;

    try {
        const response = await fetch(`/api/admin/printers/${printerId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, location })
        });

        if (response.ok) {
            loadPrinterManagement();
            alert('Printer updated successfully!');
        } else {
            alert('Failed to update printer');
        }
    } catch (error) {
        console.error('Error updating printer:', error);
        alert('An error occurred while updating printer');
    }
}

async function deletePrinter(printerId) {
    if (!confirm('Are you sure you want to delete this printer?')) return;

    try {
        const response = await fetch(`/api/admin/printers/${printerId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            loadPrinterManagement();
            alert('Printer deleted successfully!');
        } else {
            alert('Failed to delete printer');
        }
    } catch (error) {
        console.error('Error deleting printer:', error);
        alert('An error occurred while deleting printer');
    }
} 
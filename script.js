// --- STATE MANAGEMENT ---
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];
let customers = JSON.parse(localStorage.getItem('customers')) || [];
let storeName = localStorage.getItem('storeName') || "Krushna's Store";

let currentImageBase64 = "";

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('storeNameText').innerText = storeName;
    updateDashboard();
    renderInventory();
    renderSales();
    renderCustomers();
    updateSalesDropdowns();
});

// --- EDIT STORE NAME ---
document.getElementById('editStoreNameBtn').addEventListener('click', () => {
    const newName = prompt("Enter your new store name:", storeName);
    if (newName && newName.trim() !== "") {
        storeName = newName.trim();
        document.getElementById('storeNameText').innerText = storeName;
        saveData();
    }
});

// --- NAVIGATION LOGIC ---
function showSection(sectionId, element) {
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.sidebar ul li').forEach(li => li.classList.remove('active'));
    element.classList.add('active');
}

// --- SAFE IMAGE UPLOAD ---
document.getElementById('itemImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Prevent huge images from crashing LocalStorage (500KB limit)
        if (file.size > 500 * 1024) {
            alert("This image is too large! Please choose an image smaller than 500KB to ensure your database doesn't crash.");
            this.value = ""; // Clear the bad file
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            currentImageBase64 = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// --- INVENTORY FUNCTIONS ---
document.getElementById('addItemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('itemName').value;
    const category = document.getElementById('itemCategory').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    const stock = parseInt(document.getElementById('itemStock').value);

    const imgData = currentImageBase64 || "https://via.placeholder.com/50?text=No+Img";

    inventory.push({ id: Date.now(), image: imgData, name, category, price, stock });
    
    saveData(); 
    renderInventory(); 
    updateDashboard(); 
    updateSalesDropdowns();
    
    this.reset();
    currentImageBase64 = "";
});

function renderInventory() {
    const tbody = document.getElementById('inventoryTableBody');
    tbody.innerHTML = '';
    inventory.forEach((item, index) => {
        const delay = index * 0.05; 
        tbody.innerHTML += `
            <tr style="animation-delay: ${delay}s">
                <td><img src="${item.image}" class="product-thumb" alt="Product"></td>
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>₹${item.price.toFixed(2)}</td>
                <td style="color: ${item.stock < 5 ? '#ff7675' : '#55efc4'}; font-weight:bold;">${item.stock}</td>
                <td><button class="btn-delete" onclick="deleteItem(${item.id})"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`;
    });
}

function deleteItem(id) {
    if(confirm('Are you sure you want to delete this product?')) {
        inventory = inventory.filter(item => item.id !== id);
        saveData(); renderInventory(); updateDashboard(); updateSalesDropdowns();
    }
}

// --- CUSTOMER FUNCTIONS ---
document.getElementById('addCustomerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const email = document.getElementById('custEmail').value || 'N/A';
    const city = document.getElementById('custCity').value;

    customers.push({ id: Date.now(), name, phone, email, city });
    
    saveData(); renderCustomers(); updateDashboard(); updateSalesDropdowns();
    this.reset();
});

function renderCustomers() {
    const tbody = document.getElementById('customersTableBody');
    tbody.innerHTML = '';
    customers.forEach((cust, index) => {
        const delay = index * 0.05;
        tbody.innerHTML += `
            <tr style="animation-delay: ${delay}s">
                <td>${cust.name}</td>
                <td>${cust.phone}</td>
                <td>${cust.email}</td>
                <td>${cust.city}</td>
                <td><button class="btn-delete" onclick="deleteCustomer(${cust.id})"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`;
    });
}

function deleteCustomer(id) {
    if(confirm('Delete this customer?')) {
        customers = customers.filter(c => c.id !== id);
        saveData(); renderCustomers(); updateDashboard(); updateSalesDropdowns();
    }
}

// --- SALES FUNCTIONS ---
function updateSalesDropdowns() {
    const prodSelect = document.getElementById('saleProductSelect');
    prodSelect.innerHTML = '<option value="" class="dark-option">Select Product</option>';
    inventory.forEach(item => {
        if(item.stock > 0) {
            prodSelect.innerHTML += `<option value="${item.id}" class="dark-option">${item.name} (Stock: ${item.stock}) - ₹${item.price}</option>`;
        }
    });

    const custSelect = document.getElementById('saleCustomerSelect');
    custSelect.innerHTML = '<option value="" class="dark-option">Select Customer</option>';
    customers.forEach(cust => {
        custSelect.innerHTML += `<option value="${cust.name}" class="dark-option">${cust.name} (${cust.phone})</option>`;
    });
}

function getPaymentBadgeClass(method) {
    if(method === 'Cash') return 'badge-cash';
    if(method === 'UPI') return 'badge-upi';
    if(method === 'Card') return 'badge-card';
    if(method === 'Pay Later') return 'badge-paylater';
    return '';
}

document.getElementById('sellItemForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const customerName = document.getElementById('saleCustomerSelect').value;
    const productId = parseInt(document.getElementById('saleProductSelect').value);
    const quantity = parseInt(document.getElementById('saleQuantity').value);
    const paymentMethod = document.getElementById('salePaymentMethod').value;
    
    const productIndex = inventory.findIndex(p => p.id === productId);
    
    // Safety check just in case product was deleted while form was open
    if(productIndex === -1) return alert('Error: Product not found.');
    
    const product = inventory[productIndex];

    if (quantity > product.stock) return alert('Not enough stock available!');

    // Deduct stock
    inventory[productIndex].stock -= quantity;
    
    // Record Sale
    sales.push({
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        customerName: customerName,
        productName: product.name,
        paymentMethod: paymentMethod,
        quantity: quantity,
        total: quantity * product.price
    });
    
    saveData(); renderInventory(); renderSales(); updateDashboard(); updateSalesDropdowns();
    this.reset();
});

function renderSales() {
    const tbody = document.getElementById('salesTableBody');
    tbody.innerHTML = '';
    sales.slice().reverse().forEach((sale, index) => {
        const delay = index * 0.05;
        const badgeClass = getPaymentBadgeClass(sale.paymentMethod);
        
        tbody.innerHTML += `
            <tr style="animation-delay: ${delay}s">
                <td>${sale.date}</td>
                <td><strong>${sale.customerName}</strong></td>
                <td>${sale.productName}</td>
                <td>${sale.quantity}</td>
                <td><span class="badge ${badgeClass}">${sale.paymentMethod}</span></td>
                <td>₹${sale.total.toFixed(2)}</td>
            </tr>`;
    });
}

// --- DASHBOARD & UTILITY ---
function updateDashboard() {
    document.getElementById('total-products').innerText = inventory.length;
    document.getElementById('total-customers').innerText = customers.length;
    
    const totalStockValue = inventory.reduce((sum, item) => sum + (item.price * item.stock), 0);
    document.getElementById('stock-value').innerText = totalStockValue.toLocaleString();
}

function saveData() {
    try {
        localStorage.setItem('inventory', JSON.stringify(inventory));
        localStorage.setItem('sales', JSON.stringify(sales));
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('storeName', storeName);
    } catch (e) {
        alert("CRITICAL ERROR: Your browser's local storage is completely full! You need to delete some items or use smaller pictures before you can save anything else.");
    }
}
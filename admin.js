// admin.js
// --- CONFIGURATION ---
// IMPORTANT: Replace these with your actual Supabase URL and public Anon Key.
const SUPABASE_URL = 'https://kwrteqlhcikruoqxdnwd.supabase.co/'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3cnRlcWxoY2lrcnVvcXhkbndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDQyNDQsImV4cCI6MjA4MzM4MDI0NH0.nfVAwZbR_zAx2fADSoZ-mB4v1SzjXfxFqx7lZP3apZ8';

// --- SANITY CHECK ---
if (SUPABASE_URL.includes('YOUR_SUPABASE_URL') || SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')) {
    const warning = "Supabase credentials are not set in admin.js. Please replace the placeholder values.";
    alert(warning);
    throw new Error(warning);
}

// --- ELEMENT SELECTORS ---
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutButton = document.getElementById('logout-button');
const addProductForm = document.getElementById('add-product-form');
const addProductMessage = document.getElementById('add-product-message');
const existingProductsList = document.getElementById('existing-products-list');
const productImageFile = document.getElementById('product-image-file');

// Edit Mode Selectors
const productIdInput = document.getElementById('product-id');
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const cancelEditButton = document.getElementById('cancel-edit-button');

// --- STATE ---
let currentEditingProduct = null;

// --- SUPABASE CLIENT ---
const { createClient } = supabase;
const dbClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- AUTHENTICATION ---

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    loginError.textContent = '';

    try {
        const { data, error } = await dbClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) await showDashboard();
    } catch (error) {
        loginError.textContent = `Login failed: ${error.message}`;
    }
});

logoutButton.addEventListener('click', async () => {
    const { error } = await dbClient.auth.signOut();
    if (error) {
        alert(`Logout failed: ${error.message}`);
    } else {
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'block';
    }
});

async function checkSession() {
    const { data } = await dbClient.auth.getSession();
    if (data.session) {
        await showDashboard();
    } else {
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'block';
    }
}

// --- UI MANAGEMENT ---

async function showDashboard() {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    await fetchAndDisplayProducts();
}

// --- PRODUCT MANAGEMENT (FRONTEND) ---

async function fetchAndDisplayProducts() {
    existingProductsList.innerHTML = '<p>Loading products...</p>';
    try {
        const response = await fetch('/.netlify/functions/get-products');
        if (!response.ok) throw new Error('Failed to fetch from API.');
        const products = await response.json();

        if (products.length === 0) {
            existingProductsList.innerHTML = '<p>No products found. Add one using the form above!</p>';
            return;
        }

        existingProductsList.innerHTML = '';
        products.forEach(product => {
            // Encode product data to store in dataset
            const productJson = JSON.stringify(product).replace(/"/g, '&quot;');
            
            const item = document.createElement('div');
            item.className = 'product-item';
            item.innerHTML = `
                <span class="product-item-name">
                    ${product.name.replace(/</g, "&lt;")}
                    ${product.price ? `<span style="color:var(--gold); font-size:0.9em;">(₹${product.price})</span>` : ''}
                </span>
                <div class="actions">
                    <button class="edit-button" data-product="${productJson}" style="margin-right: 10px; background: var(--deep-green); color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Edit</button>
                    <button class="delete-button" data-id="${product.id}" style="background: red; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">Delete</button>
                </div>
            `;
            existingProductsList.appendChild(item);
        });
    } catch (error) {
        existingProductsList.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

// Handle Form Submit (Add or Update)
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const isEditing = !!productIdInput.value;
    const actionText = isEditing ? 'Updating' : 'Adding';
    
    addProductMessage.textContent = `${actionText} product...`;
    addProductMessage.style.color = 'var(--text-light)';

    const { data: { session }, error: sessionError } = await dbClient.auth.getSession();
    if (sessionError || !session) {
        addProductMessage.textContent = 'Authentication error. Please log in again.';
        addProductMessage.style.color = 'red';
        return;
    }

    const token = session.access_token;
    
    let imageUrl = isEditing && currentEditingProduct ? currentEditingProduct.image_url : null;

    // Handle file upload if a file is selected
    const imageFile = productImageFile.files[0];
    if (imageFile) {
        const fileExtension = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExtension}`; 
        const filePath = `product_images/${fileName}`; 

        try {
            const { error: uploadError } = await dbClient.storage
                .from('product-images')
                .upload(filePath, imageFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw new Error(`Image upload failed: ${uploadError.message}`);
            }

            const { data: publicUrlData } = dbClient.storage
                .from('product-images')
                .getPublicUrl(filePath);
            
            imageUrl = publicUrlData.publicUrl;

        } catch (error) {
            addProductMessage.textContent = `Error: ${error.message}`;
            addProductMessage.style.color = 'red';
            return;
        }
    }

    const productData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: document.getElementById('product-price').value,
        image_url: imageUrl,
    };

    if (isEditing) {
        productData.id = productIdInput.value;
    }

    try {
        const endpoint = isEditing ? '/.netlify/functions/update-product' : '/.netlify/functions/add-product';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(productData),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `Failed to ${isEditing ? 'update' : 'add'} product.`);
        }

        addProductMessage.textContent = `Product ${isEditing ? 'updated' : 'added'} successfully!`;
        addProductMessage.style.color = 'var(--deep-green)';
        
        // Reset form and mode
        resetForm();
        await fetchAndDisplayProducts();
        
    } catch (error) {
        addProductMessage.textContent = `Error: ${error.message}`;
        addProductMessage.style.color = 'red';
    }
});

// Handle List Clicks (Edit / Delete)
existingProductsList.addEventListener('click', async (e) => {
    // DELETE
    if (e.target.classList.contains('delete-button')) {
        const productId = e.target.dataset.id;
        
        if (confirm(`Are you sure you want to delete product ID ${productId}?`)) {
            const { data: { session }, error: sessionError } = await dbClient.auth.getSession();
            if (sessionError || !session) {
                alert('Authentication error. Please log in again.');
                return;
            }

            const token = session.access_token;

            try {
                const response = await fetch('/.netlify/functions/delete-product', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ product_id: productId }),
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error || 'Failed to delete product.');
                }
                
                alert(`Product ${productId} deleted successfully.`);
                await fetchAndDisplayProducts();
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }
    }
    
    // EDIT
    if (e.target.classList.contains('edit-button')) {
        const productData = JSON.parse(e.target.dataset.product);
        enterEditMode(productData);
    }
});

// Helper: Enter Edit Mode
function enterEditMode(product) {
    currentEditingProduct = product;
    
    // Populate form
    productIdInput.value = product.id;
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-price').value = product.price || '';
    
    // Update UI
    formTitle.textContent = `Edit Product: ${product.name}`;
    submitButton.textContent = 'Update Product';
    submitButton.style.background = 'var(--deep-green)'; // Ensure color
    cancelEditButton.style.display = 'inline-block';
    
    // Scroll to form
    addProductForm.scrollIntoView({ behavior: 'smooth' });
}

// Helper: Reset Form (Exit Edit Mode)
function resetForm() {
    addProductForm.reset();
    productIdInput.value = '';
    currentEditingProduct = null;
    
    // Reset UI
    formTitle.textContent = 'Add New Product';
    submitButton.textContent = 'Add Product';
    cancelEditButton.style.display = 'none';
}

// Handle Cancel Edit
cancelEditButton.addEventListener('click', (e) => {
    e.preventDefault();
    resetForm();
    addProductMessage.textContent = 'Edit cancelled.';
});

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', checkSession);
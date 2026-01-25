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
const productImageFile = document.getElementById('product-image-file'); // New: File input element

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
            const item = document.createElement('div');
            item.className = 'product-item';
            item.innerHTML = `
                <span class="product-item-name">
                    ${product.name.replace(/</g, "&lt;")}
                    ${product.price ? `<span style="color:var(--gold); font-size:0.9em;">(₹${product.price})</span>` : ''}
                </span>
                <button class="delete-button" data-id="${product.id}">Delete</button>
            `;
            existingProductsList.appendChild(item);
        });
    } catch (error) {
        existingProductsList.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}

addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addProductMessage.textContent = 'Adding product...';
    addProductMessage.style.color = 'var(--text-light)';

    const { data: { session }, error: sessionError } = await dbClient.auth.getSession();
    if (sessionError || !session) {
        addProductMessage.textContent = 'Authentication error. Please log in again.';
        addProductMessage.style.color = 'red';
        return;
    }

    const token = session.access_token;
    
    let imageUrl = null; // Initialize imageUrl to null

    // Handle file upload if a file is selected
    const imageFile = productImageFile.files[0];
    if (imageFile) {
        const fileExtension = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExtension}`; // Unique filename
        const filePath = `product_images/${fileName}`; // Path in your Supabase storage bucket

        try {
            const { error: uploadError } = await dbClient.storage
                .from('product-images')
                .upload(filePath, imageFile, {
                    cacheControl: '3600',
                    upsert: false // Don't overwrite if file exists
                });

            if (uploadError) {
                throw new Error(`Image upload failed: ${uploadError.message}`);
            }

            // Get public URL of the uploaded image
            const { data: publicUrlData } = dbClient.storage
                .from('product-images')
                .getPublicUrl(filePath);
            
            imageUrl = publicUrlData.publicUrl;

        } catch (error) {
            addProductMessage.textContent = `Error: ${error.message}`;
            addProductMessage.style.color = 'red';
            return; // Stop execution if upload fails
        }
    }

    const newProduct = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: document.getElementById('product-price').value, // Add price
        image_url: imageUrl, // Use the uploaded image URL or null
    };

    try {
        const response = await fetch('/.netlify/functions/add-product', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(newProduct),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to add product.');
        }

        addProductMessage.textContent = 'Product added successfully!';
        addProductMessage.style.color = 'var(--deep-green)';
        addProductForm.reset();
        await fetchAndDisplayProducts();
    } catch (error) {
        addProductMessage.textContent = `Error: ${error.message}`;
        addProductMessage.style.color = 'red';
    }
});

existingProductsList.addEventListener('click', async (e) => {
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
});

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', checkSession);

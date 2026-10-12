// Product Data with Indian Pricing and Images
const products = [
    {
        id: 1,
        name: 'Premium Moisturizer',
        category: 'Skincare',
        price: 1299,
        originalPrice: 1799,
        rating: 5,
        reviews: 120,
        badge: 'Best Seller',
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&q=80'
    },
    {
        id: 2,
        name: 'Liquid Foundation',
        category: 'Makeup',
        price: 899,
        originalPrice: 1299,
        rating: 5,
        reviews: 95,
        badge: 'Popular',
        image: 'https://images.unsplash.com/photo-1565958011504-98d7e66c53e5?w=500&q=80'
    },
    {
        id: 3,
        name: 'Volumizing Shampoo',
        category: 'Haircare',
        price: 699,
        originalPrice: 999,
        rating: 5,
        reviews: 85,
        badge: '',
        image: 'https://images.unsplash.com/photo-1535585209827-a15fbb76f996?w=500&q=80'
    },
    {
        id: 4,
        name: 'Luxury Perfume',
        category: 'Fragrance',
        price: 1799,
        originalPrice: 2499,
        rating: 5,
        reviews: 150,
        badge: 'Best Seller',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80'
    },
    {
        id: 5,
        name: 'Matte Lipstick',
        category: 'Makeup',
        price: 449,
        originalPrice: 649,
        rating: 5,
        reviews: 110,
        badge: 'New',
        image: 'https://images.unsplash.com/photo-1576426863848-c21f53c60b7b?w=500&q=80'
    },
    {
        id: 6,
        name: 'Eye Cream',
        category: 'Skincare',
        price: 1099,
        originalPrice: 1499,
        rating: 5,
        reviews: 75,
        badge: '',
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&q=80'
    },
    {
        id: 7,
        name: 'SPF 50 Sunscreen',
        category: 'Skincare',
        price: 649,
        originalPrice: 899,
        rating: 5,
        reviews: 200,
        badge: 'Best Seller',
        image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b3f4?w=500&q=80'
    },
    {
        id: 8,
        name: 'Hydrating Body Lotion',
        category: 'Skincare',
        price: 599,
        originalPrice: 799,
        rating: 5,
        reviews: 130,
        badge: '',
        image: 'https://images.unsplash.com/photo-1596887190198-01abce5d98e3?w=500&q=80'
    },
    {
        id: 9,
        name: 'Hair Conditioner',
        category: 'Haircare',
        price: 749,
        originalPrice: 999,
        rating: 5,
        reviews: 88,
        badge: '',
        image: 'https://images.unsplash.com/photo-1535585209827-a15fbb76f996?w=500&q=80'
    },
    {
        id: 10,
        name: 'Blush Palette',
        category: 'Makeup',
        price: 999,
        originalPrice: 1399,
        rating: 5,
        reviews: 92,
        badge: 'Popular',
        image: 'https://images.unsplash.com/photo-1565958011504-98d7e66c53e5?w=500&q=80'
    },
    {
        id: 11,
        name: 'Face Serum',
        category: 'Skincare',
        price: 1199,
        originalPrice: 1599,
        rating: 5,
        reviews: 110,
        badge: 'New',
        image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&q=80'
    },
    {
        id: 12,
        name: 'Cologne Set',
        category: 'Fragrance',
        price: 1499,
        originalPrice: 1999,
        rating: 5,
        reviews: 78,
        badge: '',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80'
    },
    {
        id: 13,
        name: 'Face Mask',
        category: 'Skincare',
        price: 399,
        originalPrice: 599,
        rating: 5,
        reviews: 145,
        badge: 'Trending',
        image: 'https://images.unsplash.com/photo-1596887190198-01abce5d98e3?w=500&q=80'
    },
    {
        id: 14,
        name: 'Eyeshadow Palette',
        category: 'Makeup',
        price: 799,
        originalPrice: 1099,
        rating: 5,
        reviews: 89,
        badge: '',
        image: 'https://images.unsplash.com/photo-1565958011504-98d7e66c53e5?w=500&q=80'
    },
    {
        id: 15,
        name: 'Hair Oil',
        category: 'Haircare',
        price: 549,
        originalPrice: 749,
        rating: 5,
        reviews: 176,
        badge: 'Best Seller',
        image: 'https://images.unsplash.com/photo-1535585209827-a15fbb76f996?w=500&q=80'
    },
    {
        id: 16,
        name: 'Perfume Spray',
        category: 'Fragrance',
        price: 999,
        originalPrice: 1399,
        rating: 5,
        reviews: 102,
        badge: 'New',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80'
    }
];

// Shopping Cart
let cart = [];

// DOM Elements
const productsContainer = document.getElementById('productsContainer');
const searchBox = document.getElementById('searchBox');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const cartBtn = document.getElementById('cartBtn');
const cartModal = document.getElementById('cartModal');
const cartItems = document.getElementById('cartItems');
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const cartCount = document.getElementById('cartCount');
const continueShop = document.getElementById('continueShop');

// Enhanced Navigation & Effects
const headerEl = document.querySelector('header');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

// Sticky header shrink on scroll
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        headerEl.classList.add('scrolled');
    } else {
        headerEl.classList.remove('scrolled');
    }
});

// Mobile hamburger menu toggle
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('open');
        navMenu.classList.toggle('open');
    });

    // Close menu when a nav link is clicked
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('open');
            navMenu.classList.remove('open');
        });
    });
}

// Active link highlighting based on scroll position
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

window.addEventListener('scroll', () => {
    if (sections.length > 0) {
        let current = '';
        const headerOffset = headerEl ? headerEl.offsetHeight : 0;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerOffset - 80;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    }
});

// Smooth scrolling with sticky-header offset
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href.length > 1 && !href.includes('#')) {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerOffset = headerEl ? headerEl.offsetHeight : 0;
                const top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset + 8;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        }
    });
});

// Event Listeners
cartBtn.addEventListener('click', openCart);
loginBtn.addEventListener('click', openLoginModal);
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.target.closest('.modal').style.display = 'none';
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

searchBox.addEventListener('input', filterProducts);
categoryFilter.addEventListener('change', filterProducts);
sortFilter.addEventListener('change', filterProducts);
continueShop.addEventListener('click', () => {
    cartModal.style.display = 'none';
});

// Contact Form
document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    e.target.reset();
});

// Login Form
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Login successful! Welcome to GlowNest!');
    loginModal.style.display = 'none';
    e.target.reset();
});

// Register Form
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Account created successfully! You can now login.');
    registerModal.style.display = 'none';
    e.target.reset();
});

// Initialize
function init() {
    displayProducts(products);
}

// Display Products
function displayProducts(productsToDisplay) {
    productsContainer.innerHTML = '';
    
    if (productsToDisplay.length === 0) {
        productsContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #757575;">No products found</p>';
        return;
    }

    productsToDisplay.forEach(product => {
        const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300?text=Product'">
                ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
                ${discount > 0 ? `<div class="product-discount">-${discount}%</div>` : ''}
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-rating">
                    <span class="stars">★★★★★</span>
                    <span>(${product.reviews} reviews)</span>
                </div>
                <div class="product-prices">
                    <div class="product-price">₹${product.price.toLocaleString('en-IN')}</div>
                    <div class="product-original-price">₹${product.originalPrice.toLocaleString('en-IN')}</div>
                </div>
                <div class="product-actions">
                    <input type="number" class="quantity-input" value="1" min="1">
                    <button class="add-cart-btn" onclick="addToCart(${product.id}, this)">Add to Cart</button>
                </div>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
}

// Filter Products
function filterProducts() {
    let filtered = products;

    // Search filter
    const searchTerm = searchBox.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm)
        );
    }

    // Category filter
    const selectedCategory = categoryFilter.value;
    if (selectedCategory) {
        filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Sort filter
    const sortBy = sortFilter.value;
    if (sortBy === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    displayProducts(filtered);
}

// Add to Cart
function addToCart(productId, button) {
    const product = products.find(p => p.id === productId);
    const quantity = parseInt(button.previousElementSibling.value);
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            ...product,
            quantity: quantity
        });
    }

    updateCart();
    
    // Show feedback
    button.textContent = '✓ Added!';
    setTimeout(() => {
        button.textContent = 'Add to Cart';
    }, 1500);
}

// Update Cart
function updateCart() {
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    displayCartItems();
}

// Display Cart Items
function displayCartItems() {
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #757575; padding: 30px;">Your cart is empty</p>';
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">Qty: ${item.quantity} × ₹${item.price.toLocaleString('en-IN')}</div>
                </div>
                <button class="remove-item" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `).join('');
    }

    // Update totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 599 ? 0 : 49;
    const total = subtotal + shipping;

    document.getElementById('subtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    document.getElementById('shipping').textContent = shipping === 0 ? 'Free' : `₹${shipping.toLocaleString('en-IN')}`;
    document.getElementById('total').textContent = `₹${total.toLocaleString('en-IN')}`;
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

// Open Cart Modal
function openCart() {
    cartModal.style.display = 'flex';
}

// Open Login Modal
function openLoginModal() {
    loginModal.style.display = 'flex';
}

// Open Register Modal
function openRegisterModal() {
    registerModal.style.display = 'flex';
    loginModal.style.display = 'none';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
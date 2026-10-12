'use strict';

(() => {
    const cartKey = 'nectarCart';
    const wishlistKey = 'nectarWishlist';
    const buyNowKey = 'nectarBuyNow';
    const checkoutSourceKey = 'nectarCheckoutSource';
    const productGrid = document.getElementById('productsGrid');
    const searchInput = document.getElementById('productSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const priceFilter = document.getElementById('priceFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const sortFilter = document.getElementById('sortFilter');
    const results = document.getElementById('productResults');
    const noProducts = document.getElementById('noProducts');
    const wishlistGrid = document.getElementById('wishlistGrid');
    const wishlistEmpty = document.getElementById('wishlistEmpty');

    if (!productGrid || !searchInput || !categoryFilter || !priceFilter || !ratingFilter || !sortFilter) return;

    const productCards = Array.from(productGrid.querySelectorAll('.product-card'));
    const cardsById = new Map(productCards.map(card => [card.dataset.productId, card]));
    const numberFormat = new Intl.NumberFormat('en-IN');
    let toastTimer;

    function readStored(key, storage = localStorage) {
        try {
            const value = JSON.parse(storage.getItem(key) || '[]');
            return Array.isArray(value) ? value : [];
        } catch {
            return [];
        }
    }

    function showToast(message, isError = false) {
        let toast = document.getElementById('storeToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'storeToast';
            toast.className = 'store-toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.append(toast);
        }
        toast.textContent = message;
        toast.dataset.error = String(isError);
        toast.hidden = false;
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            toast.hidden = true;
        }, 2600);
    }

    function writeStored(key, value, storage = localStorage) {
        try {
            storage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            showToast('Could not save your changes in this browser. Check available storage and try again.', true);
            return false;
        }
    }

    function productFromCard(card, quantity = 1) {
        const image = card.querySelector('.product-image img');
        return {
            id: card.dataset.productId,
            name: card.querySelector('.product-name').textContent.trim(),
            price: Number(card.dataset.price),
            image: image ? image.getAttribute('src') : '',
            quantity
        };
    }

    function updateCartCount() {
        const count = readStored(cartKey).reduce((total, item) => total + (Number(item.quantity) || 0), 0);
        const countElement = document.getElementById('cartCount');
        if (countElement) countElement.textContent = String(count);
    }

    function readWishlist() {
        return new Set(readStored(wishlistKey).filter(id => cardsById.has(id)));
    }

    function syncWishlistButtons() {
        const saved = readWishlist();
        document.querySelectorAll('.wishlist-toggle').forEach(button => {
            const card = button.closest('[data-product-id]');
            const selected = card ? saved.has(card.dataset.productId) : false;
            button.setAttribute('aria-pressed', String(selected));
            button.setAttribute('aria-label', selected ? 'Remove from wishlist' : 'Add to wishlist');
            button.textContent = selected ? '♥' : '♡';
        });
        const count = document.getElementById('wishlistCount');
        if (count) count.textContent = String(saved.size);
    }

    function renderWishlist() {
        if (!wishlistGrid || !wishlistEmpty) return;
        const saved = readWishlist();
        wishlistGrid.replaceChildren();
        saved.forEach(id => {
            const card = cardsById.get(id);
            if (card) wishlistGrid.append(card.cloneNode(true));
        });
        wishlistEmpty.hidden = saved.size > 0;
        syncWishlistButtons();
    }

    function setupProductCards() {
        productCards.forEach(card => {
            const imageArea = card.querySelector('.product-image');
            const actions = card.querySelector('.product-actions');
            if (!imageArea || !actions) return;

            const wishlistButton = document.createElement('button');
            wishlistButton.type = 'button';
            wishlistButton.className = 'wishlist-toggle';
            wishlistButton.setAttribute('aria-pressed', 'false');
            imageArea.append(wishlistButton);

            const addButton = actions.querySelector('button');
            if (addButton) {
                addButton.type = 'button';
                addButton.classList.add('market-add');
            }

            const buyButton = document.createElement('button');
            buyButton.type = 'button';
            buyButton.className = 'market-buy-now';
            buyButton.textContent = 'Buy now';
            actions.insertAdjacentElement('afterend', buyButton);
        });
        syncWishlistButtons();
    }

    function filterProducts() {
        const query = searchInput.value.trim().toLocaleLowerCase();
        const category = categoryFilter.value;
        const rating = Number(ratingFilter.value) || 0;
        const range = priceFilter.value ? priceFilter.value.split('-').map(Number) : null;
        const filtered = productCards.filter(card => {
            const matchesSearch = !query || card.textContent.toLocaleLowerCase().includes(query);
            const matchesCategory = !category || card.dataset.category === category;
            const price = Number(card.dataset.price);
            const matchesPrice = !range || (price >= range[0] && price <= range[1]);
            const matchesRating = Number(card.dataset.rating) >= rating;
            return matchesSearch && matchesCategory && matchesPrice && matchesRating;
        });

        const compare = {
            'price-low': (a, b) => Number(a.dataset.price) - Number(b.dataset.price),
            'price-high': (a, b) => Number(b.dataset.price) - Number(a.dataset.price),
            rating: (a, b) => Number(b.dataset.rating) - Number(a.dataset.rating),
            name: (a, b) => a.querySelector('.product-name').textContent.localeCompare(b.querySelector('.product-name').textContent)
        }[sortFilter.value];
        if (compare) filtered.sort(compare);

        productGrid.replaceChildren(...filtered, ...productCards.filter(card => !filtered.includes(card)));
        productCards.forEach(card => {
            card.hidden = !filtered.includes(card);
        });
        noProducts.hidden = filtered.length > 0;
        results.textContent = `${filtered.length} ${filtered.length === 1 ? 'product' : 'products'} found`;
    }

    function addToCart(card, quantityInput, buyNow = false) {
        const quantity = Math.floor(Number(quantityInput && quantityInput.value) || 1);
        const product = productFromCard(card, Math.max(1, quantity));
        if (buyNow) {
            if (!writeStored(buyNowKey, [product], sessionStorage)) return;
            try {
                sessionStorage.setItem(checkoutSourceKey, 'buy-now');
            } catch {
                showToast('Could not start checkout because browser storage is unavailable.', true);
                return;
            }
            window.location.href = 'checkout.htlm.html';
            return;
        }

        const cart = readStored(cartKey);
        const existing = cart.find(item => item.id === product.id);
        if (existing) existing.quantity = (Number(existing.quantity) || 0) + product.quantity;
        else cart.push(product);
        if (!writeStored(cartKey, cart)) return;
        updateCartCount();
        showToast(`${product.name} added to your cart.`);
    }

    productGrid.addEventListener('click', event => {
        const button = event.target.closest('button');
        const card = button && button.closest('.product-card');
        if (!button || !card) return;
        if (button.classList.contains('wishlist-toggle')) {
            const saved = readWishlist();
            const id = card.dataset.productId;
            if (saved.has(id)) saved.delete(id);
            else saved.add(id);
            if (writeStored(wishlistKey, [...saved])) renderWishlist();
        } else if (button.classList.contains('market-add')) {
            addToCart(card, card.querySelector('.quantity'));
        } else if (button.classList.contains('market-buy-now')) {
            addToCart(card, card.querySelector('.quantity'), true);
        }
    });

    if (wishlistGrid) {
        wishlistGrid.addEventListener('click', event => {
            const button = event.target.closest('button');
            const card = button && button.closest('.product-card');
            if (!button || !card) return;
            if (button.classList.contains('wishlist-toggle')) {
                const saved = readWishlist();
                saved.delete(card.dataset.productId);
                if (writeStored(wishlistKey, [...saved])) renderWishlist();
            } else if (button.classList.contains('market-add')) {
                addToCart(card, card.querySelector('.quantity'));
            } else if (button.classList.contains('market-buy-now')) {
                addToCart(card, card.querySelector('.quantity'), true);
            }
        });
    }

    [searchInput, categoryFilter, priceFilter, ratingFilter, sortFilter].forEach(control => {
        control.addEventListener(control === searchInput ? 'input' : 'change', filterProducts);
    });

    document.getElementById('marketSearchForm').addEventListener('submit', event => {
        event.preventDefault();
        filterProducts();
        document.getElementById('shop').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.getElementById('clearFilters').addEventListener('click', () => {
        searchInput.value = '';
        categoryFilter.value = '';
        priceFilter.value = '';
        ratingFilter.value = '0';
        sortFilter.value = 'featured';
        filterProducts();
    });

    document.querySelectorAll('[data-category-link]').forEach(link => {
        link.addEventListener('click', () => {
            categoryFilter.value = link.dataset.categoryLink;
            filterProducts();
        });
    });

    setupProductCards();
    updateCartCount();
    renderWishlist();
    filterProducts();
})();

'use strict';

(function () {
const cartStorageKey = 'nectarCart';
const buyNowStorageKey = 'nectarBuyNow';
const checkoutSourceKey = 'nectarCheckoutSource';
const money = amount => `₹${new Intl.NumberFormat('en-IN').format(amount)}`;

async function apiRequest(url, options = {}) {
    let response;
    try {
        response = await fetch(url, {
            credentials: 'same-origin',
            ...options,
            headers: {
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...options.headers
            }
        });
    } catch {
        throw new Error('Could not reach Nectar’s backend. Start the server with npm start and open http://localhost:3000.');
    }

    let payload;
    try {
        payload = await response.json();
    } catch {
        throw new Error('The server returned an invalid response. Please try again.');
    }
    if (!response.ok) throw new Error(payload.error || 'The request could not be completed.');
    return payload;
}

function readCart() {
    try {
        const cart = JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
        return Array.isArray(cart) ? cart : [];
    } catch {
        return [];
    }
}

function updateCartCount() {
    const countElement = document.getElementById('cartCount');
    if (countElement) {
        countElement.textContent = readCart().reduce((total, item) => total + (Number(item.quantity) || 0), 0);
    }
}

function setStatus(element, message, isError = false) {
    if (!element) return;
    element.textContent = message;
    element.hidden = !message;
    element.dataset.state = isError ? 'error' : 'success';
    element.style.color = isError ? '#a52e2e' : '';
}

function attachAuthentication(user) {
    const navigation = document.getElementById('navMenu');
    if (!navigation || !user) return;

    navigation.querySelectorAll('a[href="login.html"], a[href="Registration%20.html"]')
        .forEach(link => link.remove());
    if (!navigation.querySelector('.session-user')) {
        const greeting = document.createElement('span');
        greeting.className = 'session-user';
        greeting.textContent = `Hi, ${user.name}`;
        greeting.style.cssText = 'color:inherit;font-size:13px;font-weight:600';
        const logout = document.createElement('button');
        logout.type = 'button';
        logout.className = 'session-logout';
        logout.textContent = 'Sign out';
        logout.style.cssText = 'padding:8px 12px;border:1px solid currentColor;border-radius:6px;background:transparent;color:inherit;font:inherit;cursor:pointer';
        logout.addEventListener('click', async () => {
            logout.disabled = true;
            try {
                await apiRequest('/api/auth/logout', { method: 'POST', body: '{}' });
                window.location.reload();
            } catch (error) {
                logout.disabled = false;
                window.alert(error.message);
            }
        });
        navigation.append(greeting, logout);
    }
}

async function initAuthentication() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authStatus = document.getElementById('authStatus');
    const pendingAdvisorQuestion = sessionStorage.getItem('nectarPendingAdvisorQuestion');
    const returnFromAdvisor = () => {
        if (!pendingAdvisorQuestion) return 'Home.html';
        const returnTarget = sessionStorage.getItem('nectarAdvisorReturnTarget') || 'Home.html';
        sessionStorage.removeItem('nectarPendingAdvisorQuestion');
        sessionStorage.removeItem('nectarAdvisorReturnTarget');
        const separator = returnTarget.includes('#') ? '&' : '#';
        return `${returnTarget}${separator}ask=${encodeURIComponent(pendingAdvisorQuestion)}`;
    };

    if (pendingAdvisorQuestion && loginForm) {
        const notice = document.createElement('p');
        notice.className = 'form-intro';
        notice.textContent = 'Sign in to save your Beauty Advisor question to your account history.';
        loginForm.before(notice);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async event => {
            event.preventDefault();
            const submitButton = loginForm.querySelector('[type="submit"]');
            submitButton.disabled = true;
            setStatus(authStatus, 'Signing you in…');
            try {
                await apiRequest('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: loginForm.elements.email.value,
                        password: loginForm.elements.password.value
                    })
                });
                window.location.href = returnFromAdvisor();
            } catch (error) {
                setStatus(authStatus, error.message, true);
                submitButton.disabled = false;
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async event => {
            event.preventDefault();
            const submitButton = registerForm.querySelector('[type="submit"]');
            submitButton.disabled = true;
            setStatus(authStatus, 'Creating your account…');
            try {
                await apiRequest('/api/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: registerForm.elements.name.value,
                        email: registerForm.elements.email.value,
                        password: registerForm.elements.password.value,
                        phone: registerForm.elements.phone.value,
                        address: registerForm.elements.address.value
                    })
                });
                window.location.href = returnFromAdvisor();
            } catch (error) {
                setStatus(authStatus, error.message, true);
                submitButton.disabled = false;
            }
        });
    }

    try {
        const { user } = await apiRequest('/api/auth/me');
        if (user) {
            attachAuthentication(user);
            if (document.getElementById('advisorHistory')) await loadAdvisorHistory();
        }
    } catch (error) {
        if (error.message.includes('Could not reach')) setStatus(authStatus, error.message, true);
    }
}

function displayAdvisorResponse(payload) {
    const result = document.getElementById('finderResult');
    const message = document.getElementById('finderMessage');
    const name = document.getElementById('finderProduct');
    const price = document.getElementById('finderPrice');
    const image = document.getElementById('finderImage');
    const link = document.getElementById('finderLink');

    result.hidden = false;
    message.textContent = payload.message;
    if (!payload.recommendation) {
        name.textContent = '';
        price.textContent = '';
        image.hidden = true;
        link.hidden = true;
        return;
    }

    const product = payload.recommendation;
    name.textContent = product.name;
    price.textContent = `${money(product.price)}${product.offer ? ` · ${product.offer}` : ''}`;
    image.src = product.image;
    image.alt = product.name;
    image.hidden = false;
    link.href = `#product-${product.id}`;
    link.hidden = false;
}

async function loadAdvisorHistory() {
    const section = document.getElementById('advisorHistory');
    const list = document.getElementById('advisorHistoryList');
    if (!section || !list) return;

    const { history } = await apiRequest('/api/advisor/history?limit=8');
    list.replaceChildren();
    if (history.length === 0) {
        section.hidden = true;
        return;
    }

    history.forEach(entry => {
        const item = document.createElement('li');
        const question = document.createElement('p');
        question.textContent = entry.question;
        const response = document.createElement('p');
        response.textContent = entry.product_name
            ? `${entry.response} Suggested: ${entry.product_name}.`
            : entry.response;
        item.append(question, response);
        list.append(item);
    });
    section.hidden = false;
}

function initAdvisor() {
    const form = document.getElementById('finderForm');
    if (!form) return;
    const question = document.getElementById('finderQuestion');

    form.addEventListener('submit', async event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const submitButton = form.querySelector('[type="submit"]');
        submitButton.disabled = true;

        try {
            const payload = await apiRequest('/api/advisor/ask', {
                method: 'POST',
                body: JSON.stringify({ question: question.value.trim() })
            });
            displayAdvisorResponse(payload);
            await loadAdvisorHistory();
        } catch (error) {
            const result = document.getElementById('finderResult');
            result.hidden = false;
            const message = document.getElementById('finderMessage');
            message.textContent = error.message.includes('sign in')
                ? 'Sign in to ask the Beauty Advisor and save your consultation history.'
                : error.message;
            document.getElementById('finderProduct').textContent = '';
            document.getElementById('finderPrice').textContent = '';
            document.getElementById('finderImage').hidden = true;
            document.getElementById('finderLink').hidden = true;

            if (error.message.includes('sign in')) {
                sessionStorage.setItem('nectarPendingAdvisorQuestion', question.value.trim());
                sessionStorage.setItem('nectarAdvisorReturnTarget', `${window.location.pathname}${window.location.search}`);
                const login = document.createElement('a');
                login.href = 'login.html';
                login.textContent = 'Sign in';
                login.style.cssText = 'display:inline-block;margin-top:10px;padding:9px 13px;border-radius:6px;background:#ffe500;color:#212121;text-decoration:none;font-weight:700';
                message.append(login);
            }
        } finally {
            submitButton.disabled = false;
        }
    }, true);

    document.querySelectorAll('.finder-example').forEach(button => {
        const cleanButton = button.cloneNode(true);
        button.replaceWith(cleanButton);
        cleanButton.addEventListener('click', () => {
            question.value = cleanButton.dataset.concern;
            form.requestSubmit();
        });
    });
}

function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'card';
    card.id = `product-${product.id}`;
    card.dataset.productId = product.id;
    card.dataset.category = product.category;

    const visual = document.createElement('div');
    visual.className = 'product-image';
    const tag = document.createElement('span');
    tag.className = 'product-tag';
    tag.textContent = product.category === 'hair' ? 'Hair care' : product.category;
    const image = document.createElement('img');
    image.src = product.image;
    image.alt = product.name;
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-haspopup', 'dialog');
    image.setAttribute('aria-label', `View larger image of ${product.name}`);
    visual.append(tag, image);

    const copy = document.createElement('div');
    copy.className = 'card-copy';
    const category = document.createElement('div');
    category.className = 'category';
    category.textContent = product.category === 'hair' ? 'HAIR CARE' : product.category.toUpperCase();
    const name = document.createElement('h3');
    name.textContent = product.name;
    const description = document.createElement('p');
    description.className = 'card-description';
    description.textContent = product.description;
    const price = document.createElement('div');
    price.className = 'price';

    if (product.mrp > product.price) {
        const salePrice = document.createElement('span');
        salePrice.className = 'sale-price';
        salePrice.textContent = money(product.price);
        const mrp = document.createElement('del');
        mrp.textContent = money(product.mrp);
        const offer = document.createElement('span');
        offer.className = 'discount';
        offer.textContent = product.offer || 'Offer';
        price.append(salePrice, ' ', mrp, offer);
    } else {
        price.textContent = money(product.price);
    }

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const addButton = document.createElement('button');
    addButton.className = 'btn add-to-cart';
    addButton.type = 'button';
    addButton.textContent = 'Add to Cart';
    addButton.addEventListener('click', () => {
        const cart = readCart();
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) existingItem.quantity += 1;
        else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
        localStorage.setItem(cartStorageKey, JSON.stringify(cart));
        updateCartCount();
        addButton.textContent = 'Added';
        window.setTimeout(() => { addButton.textContent = 'Add to Cart'; }, 1000);
    });

    const buyButton = document.createElement('button');
    buyButton.className = 'btn buy-now';
    buyButton.type = 'button';
    buyButton.textContent = 'Buy Now';
    buyButton.addEventListener('click', () => {
        sessionStorage.setItem(buyNowStorageKey, JSON.stringify([{
            id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1
        }]));
        sessionStorage.setItem(checkoutSourceKey, 'buy-now');
        window.location.href = 'checkout.htlm.html';
    });

    actions.append(addButton, buyButton);
    copy.append(category, name, description, price, actions);
    card.append(visual, copy);
    return card;
}

async function initShop() {
    const grid = document.getElementById('products');
    if (!grid) return;

    const searchInput = document.getElementById('productSearch');
    const filters = Array.from(document.querySelectorAll('.filter-button'));
    const count = document.getElementById('productCount');
    const empty = document.getElementById('noProducts');
    let products = [];
    let category = 'all';

    function filterProducts() {
        const term = searchInput.value.trim().toLowerCase();
        let visible = 0;
        grid.querySelectorAll('.card').forEach(card => {
            const matchesCategory = category === 'all' || card.dataset.category === category;
            const matchesText = `${card.querySelector('h3').textContent} ${card.querySelector('.category').textContent} ${card.querySelector('.card-description').textContent}`.toLowerCase().includes(term);
            card.hidden = !(matchesCategory && matchesText);
            if (!card.hidden) visible += 1;
        });
        empty.hidden = visible !== 0;
        count.textContent = `${visible} ${visible === 1 ? 'essential' : 'essentials'} to explore`;
    }

    filters.forEach(button => button.addEventListener('click', () => {
        category = button.dataset.filter;
        filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
        filterProducts();
    }));
    document.querySelectorAll('[data-category-link]').forEach(link => link.addEventListener('click', () => {
        category = link.dataset.categoryLink;
        filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter.dataset.filter === category)));
        filterProducts();
    }));
    searchInput.addEventListener('input', filterProducts);
    const requestedQuestion = new URLSearchParams(window.location.hash.slice(1)).get('ask');

    try {
        const payload = await apiRequest('/api/products');
        products = payload.products;
        grid.replaceChildren(...products.map(createProductCard), empty);
        filterProducts();
        if (requestedQuestion) {
            history.replaceState(null, '', `${window.location.pathname}${window.location.search}#finderHeading`);
            document.getElementById('finderQuestion').value = requestedQuestion;
            document.getElementById('finderForm').requestSubmit();
        }
    } catch (error) {
        const savedProducts = grid.querySelectorAll('.card');
        if (savedProducts.length > 0) {
            filterProducts();
            count.textContent = `${count.textContent} · showing saved products (live catalog unavailable)`;
        } else {
            grid.replaceChildren(empty);
            empty.hidden = false;
            empty.textContent = error.message;
            count.textContent = 'Catalog unavailable';
        }
    }
}

function initNavigation() {
    updateCartCount();
    window.addEventListener('storage', updateCartCount);

    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            const isOpen = menuToggle.classList.toggle('open');
            navMenu.classList.toggle('open', isOpen);
            menuToggle.setAttribute('aria-expanded', String(isOpen));
        });
        navMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
            menuToggle.classList.remove('open');
            navMenu.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
        }));
    }
}

function initProductImagePreview() {
    const dialog = document.getElementById('productPreview');
    const previewImage = document.getElementById('productPreviewImage');
    const caption = document.getElementById('productPreviewCaption');
    const closeButton = dialog?.querySelector('.product-preview-close');
    if (!dialog || !previewImage || !caption || !closeButton) return;

    function openPreview(image) {
        const card = image.closest('.card');
        previewImage.src = image.currentSrc || image.src;
        previewImage.alt = image.alt;
        caption.textContent = card?.querySelector('h3')?.textContent.trim() || image.alt;
        dialog.showModal();
    }

    document.querySelectorAll('.product-image img').forEach(image => {
        image.tabIndex = 0;
        image.setAttribute('role', 'button');
        image.setAttribute('aria-haspopup', 'dialog');
        image.setAttribute('aria-label', `View larger image of ${image.alt}`);
    });

    document.addEventListener('click', event => {
        if (event.target instanceof HTMLImageElement && event.target.closest('.product-image')) {
            openPreview(event.target);
        }
    });

    document.addEventListener('keydown', event => {
        if (event.target instanceof HTMLImageElement && event.target.closest('.product-image')
            && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            openPreview(event.target);
        }
    });

    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initAdvisor();
    initShop();
    initAuthentication();
    initProductImagePreview();
});
})();

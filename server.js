'use strict';

require('dotenv').config();

const crypto = require('node:crypto');
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { rateLimit } = require('express-rate-limit');
const { products } = require('./catalog');
const { AdvisorHistory, Product, Session, User } = require('./models');

const app = express();
const port = Number(process.env.PORT) || 3000;
const projectRoot = __dirname;
const sessionCookieName = 'nectar_session';
const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === 'production';
const categoryOrder = new Map(['skincare', 'makeup', 'hair', 'body'].map((category, index) => [category, index]));

function publicProduct(product) {
    return {
        id: product._id,
        name: product.name,
        category: product.category,
        description: product.description,
        image: product.image,
        price: product.price,
        mrp: product.mrp,
        offer: product.offer
    };
}

function publicUser(user) {
    return { id: user._id.toString(), name: user.name, email: user.email };
}

function getCookie(request, cookieName) {
    const cookieHeader = request.headers.cookie || '';
    for (const entry of cookieHeader.split(';')) {
        const separator = entry.indexOf('=');
        if (separator < 0) continue;
        if (entry.slice(0, separator).trim() === cookieName) {
            try {
                return decodeURIComponent(entry.slice(separator + 1).trim());
            } catch {
                return null;
            }
        }
    }
    return null;
}

function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function setSessionCookie(response, token, maxAge) {
    const attributes = [
        `${sessionCookieName}=${encodeURIComponent(token)}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        `Max-Age=${maxAge}`
    ];
    if (isProduction) attributes.push('Secure');
    response.setHeader('Set-Cookie', attributes.join('; '));
}

function clearSessionCookie(response) {
    const attributes = [`${sessionCookieName}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
    if (isProduction) attributes.push('Secure');
    response.setHeader('Set-Cookie', attributes.join('; '));
}

async function requireUser(request, response, next) {
    const token = getCookie(request, sessionCookieName);
    if (!token || token.length > 200) {
        response.status(401).json({ error: 'Please sign in to continue.' });
        return;
    }
    try {
        const session = await Session.findOne({
            _id: hashToken(token),
            expiresAt: { $gt: new Date() }
        }).populate('user', 'name email');
        if (!session?.user) {
            clearSessionCookie(response);
            response.status(401).json({ error: 'Your session has expired. Please sign in again.' });
            return;
        }
        request.user = session.user;
        next();
    } catch (error) {
        next(error);
    }
}

const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many account attempts. Please try again in a little while.' }
});
const advisorRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many advisor requests. Please try again in a little while.' }
});

async function seedProducts() {
    const operations = products.map(({ _id, ...fields }) => ({
        updateOne: {
            filter: { _id },
            update: fields.offer?.includes('sample')
                ? { $set: fields }
                : { $setOnInsert: fields },
            upsert: true
        }
    }));
    await Product.bulkWrite(operations);
}

app.disable('x-powered-by');
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"]
        }
    }
}));
app.use(express.json({ limit: '16kb', type: 'application/json' }));
app.use((request, response, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) || !request.path.startsWith('/api/')) {
        next();
        return;
    }
    const origin = request.get('origin');
    if (origin && origin !== `${request.protocol}://${request.get('host')}`) {
        response.status(403).json({ error: 'Cross-origin requests are not allowed.' });
        return;
    }
    next();
});

app.get('/api/health', (request, response) => {
    response.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.get('/api/products', async (request, response) => {
    const rows = await Product.find().lean();
    rows.sort((left, right) =>
        (categoryOrder.get(left.category) - categoryOrder.get(right.category)) ||
        left.name.localeCompare(right.name)
    );
    response.json({ products: rows.map(publicProduct) });
});

app.post('/api/auth/register', authRateLimit, async (request, response) => {
    const name = typeof request.body?.name === 'string' ? request.body.name.trim() : '';
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    const phone = typeof request.body?.phone === 'string' ? request.body.phone.trim().slice(0, 30) : '';
    const address = typeof request.body?.address === 'string' ? request.body.address.trim().slice(0, 300) : '';

    if (name.length < 2 || name.length > 80) {
        response.status(400).json({ error: 'Enter a name between 2 and 80 characters.' });
        return;
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        response.status(400).json({ error: 'Enter a valid email address.' });
        return;
    }
    if (password.length < 10 || Buffer.byteLength(password, 'utf8') > 72) {
        response.status(400).json({ error: 'Password must be at least 10 characters and no more than 72 UTF-8 bytes.' });
        return;
    }

    try {
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({
            name,
            email,
            passwordHash,
            phone: phone || undefined,
            address: address || undefined
        });
        const token = crypto.randomBytes(32).toString('base64url');
        await Session.create({
            _id: hashToken(token),
            user: user._id,
            expiresAt: new Date(Date.now() + sessionLifetimeMs)
        });
        setSessionCookie(response, token, Math.floor(sessionLifetimeMs / 1000));
        response.status(201).json({ user: publicUser(user) });
    } catch (error) {
        if (error?.code === 11000 && error.keyPattern?.email) {
            response.status(409).json({ error: 'An account with that email already exists. Please sign in instead.' });
            return;
        }
        throw error;
    }
});

app.post('/api/auth/login', authRateLimit, async (request, response) => {
    const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
    const password = typeof request.body?.password === 'string' ? request.body.password : '';
    const user = await User.findOne({ email }).select('+passwordHash');
    const passwordMatches = user && Buffer.byteLength(password, 'utf8') <= 72 &&
        await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
        response.status(401).json({ error: 'Email or password is incorrect.' });
        return;
    }

    const token = crypto.randomBytes(32).toString('base64url');
    await Session.create({
        _id: hashToken(token),
        user: user._id,
        expiresAt: new Date(Date.now() + sessionLifetimeMs)
    });
    setSessionCookie(response, token, Math.floor(sessionLifetimeMs / 1000));
    response.json({ user: publicUser(user) });
});

app.get('/api/auth/me', async (request, response) => {
    const token = getCookie(request, sessionCookieName);
    const session = token && token.length <= 200
        ? await Session.findOne({ _id: hashToken(token), expiresAt: { $gt: new Date() } })
            .populate('user', 'name email')
        : null;
    if (!session?.user && token) clearSessionCookie(response);
    response.json({ user: session?.user ? publicUser(session.user) : null });
});

app.post('/api/auth/logout', async (request, response) => {
    const token = getCookie(request, sessionCookieName);
    if (token && token.length <= 200) await Session.deleteOne({ _id: hashToken(token) });
    clearSessionCookie(response);
    response.json({ status: 'signed-out' });
});

app.get('/api/advisor/history', requireUser, async (request, response) => {
    const requestedLimit = Number.parseInt(request.query.limit, 10);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 10;
    const history = await AdvisorHistory.find({ user: request.user._id })
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit)
        .populate('product_id', 'name')
        .lean();
    response.json({
        history: history.map(entry => ({
            id: entry._id.toString(),
            question: entry.question,
            response: entry.response,
            product_id: entry.product_id?._id || null,
            product_name: entry.product_id?.name || null,
            created_at: entry.createdAt
        }))
    });
});

app.post('/api/advisor/ask', requireUser, advisorRateLimit, async (request, response) => {
    const question = typeof request.body?.question === 'string' ? request.body.question.trim() : '';
    if (question.length < 2 || question.length > 500) {
        response.status(400).json({ error: 'Enter a beauty question between 2 and 500 characters.' });
        return;
    }

    const normalizedQuestion = question.toLowerCase();
    const catalog = await Product.find().lean();
    let bestMatch = null;
    let bestScore = 0;
    for (const product of catalog) {
        const score = product.keywords.reduce((total, keyword) => {
            return total + (normalizedQuestion.includes(keyword) ? keyword.length * (keyword.includes(' ') ? 3 : 1) : 0);
        }, 0);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = product;
        }
    }

    const recommendation = bestMatch ? publicProduct(bestMatch) : null;
    const message = recommendation
        ? `Based on what you shared, ${recommendation.name} may be a useful match from our collection.`
        : 'I could not find a close product match. Try describing a concern about your skin, hair, lips, or body care.';
    const history = await AdvisorHistory.create({
        user: request.user._id,
        question,
        response: message,
        product_id: recommendation?.id || undefined
    });
    response.status(201).json({
        recommendation,
        message,
        history: {
            id: history._id.toString(),
            question,
            response: message,
            product_id: recommendation?.id || null
        }
    });
});

app.get('/', (request, response) => response.sendFile(path.join(projectRoot, 'index.html')));

const publicFiles = new Set([
    'Home.html', 'shopepage.html', 'login.html', 'Registration .html',
    'cart.html', 'checkout.htlm.html', 'index.html', 'main.html',
    'app.js', 'style.css', 'main.css', 'storefront.css', 'storefront.js',
    'face wash.jpg', 'lipstick.webp', 'hair serum.jpg', 'body lotion.jpg',
    'mamaearth-onion-hair-fall-shampoo.png',
    'mamaearth-flaxseed-damage-repair-shampoo-duo.png',
    'mamaearth-lemon-anti-dandruff-duo.png',
    'mamaearth-vitamin-c-face-wash.png',
    'mamaearth-tea-tree-pimple-control-face-wash.png'
]);

app.get('*path', (request, response, next) => {
    let decodedPath;
    try {
        decodedPath = decodeURIComponent(request.path);
    } catch {
        response.status(400).end();
        return;
    }
    if (decodedPath.split('/').some(part => part === '..')) {
        response.status(400).end();
        return;
    }
    const fileName = path.basename(decodedPath);
    if (!publicFiles.has(fileName)) {
        next();
        return;
    }
    response.sendFile(path.join(projectRoot, fileName), error => {
        if (error && !response.headersSent) next(error);
    });
});

app.use((request, response) => {
    response.status(404).json({ error: 'The requested page or API route was not found.' });
});

app.use((error, request, response, next) => {
    if (response.headersSent) {
        next(error);
        return;
    }
    if (error instanceof SyntaxError && Object.hasOwn(error, 'body')) {
        response.status(400).json({ error: 'The request body must contain valid JSON.' });
        return;
    }
    console.error('Unhandled request error:', error);
    response.status(500).json({ error: 'An unexpected server error occurred.' });
});

async function start() {
    if (!process.env.DB_URI) {
        throw new Error('DB_URI is required. Copy .env.example to .env and set your MongoDB connection string.');
    }
    await mongoose.connect(process.env.DB_URI);
    await seedProducts();

    const server = app.listen(port, () => {
        console.log(`Nectar Cosmetics is available at http://localhost:${port}`);
        console.log(`MongoDB database: ${mongoose.connection.name}`);
    });

    let shuttingDown = false;
    async function shutdown() {
        if (shuttingDown) return;
        shuttingDown = true;
        server.close(async () => {
            await mongoose.disconnect();
            process.exit(0);
        });
    }
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

start().catch(error => {
    console.error('Unable to start Nectar Cosmetics:', error.message);
    process.exitCode = 1;
});

'use strict';

require('dotenv').config();

const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const mongoose = require('mongoose');
const { AdvisorHistory, Product, Session, User } = require('./models');

async function migrate() {
    if (!process.env.DB_URI) {
        throw new Error('DB_URI is required. Copy .env.example to .env and set your MongoDB connection string.');
    }
    const databasePath = path.resolve(process.argv[2] || path.join(__dirname, 'data', 'nectar.sqlite'));
    const sqlite = new DatabaseSync(databasePath, { readOnly: true });

    try {
        await mongoose.connect(process.env.DB_URI);
        const products = sqlite.prepare('SELECT * FROM products').all();
        if (products.length) {
            await Product.bulkWrite(products.map(product => ({
                updateOne: {
                    filter: { _id: product.id },
                    update: {
                        $setOnInsert: {
                            name: product.name,
                            category: product.category,
                            description: product.description,
                            image: product.image,
                            price: product.price,
                            mrp: product.mrp,
                            offer: product.offer,
                            keywords: JSON.parse(product.keywords)
                        }
                    },
                    upsert: true
                }
            })));
        }

        const legacyUsers = sqlite.prepare('SELECT * FROM users').all();
        const userIds = new Map();
        for (const legacyUser of legacyUsers) {
            const user = await User.findOneAndUpdate(
                { email: legacyUser.email.toLowerCase() },
                {
                    $setOnInsert: {
                        name: legacyUser.name,
                        passwordHash: legacyUser.password_hash,
                        phone: legacyUser.phone || undefined,
                        address: legacyUser.address || undefined,
                        createdAt: new Date(`${legacyUser.created_at}Z`)
                    },
                },
                { upsert: true, new: true, runValidators: true }
            );
            userIds.set(legacyUser.id, user._id);
        }

        const legacySessions = sqlite.prepare('SELECT * FROM sessions').all();
        const sessions = legacySessions
            .filter(session => userIds.has(session.user_id))
            .map(session => ({
                updateOne: {
                    filter: { _id: session.token_hash },
                    update: {
                        $set: {
                            user: userIds.get(session.user_id),
                            expiresAt: new Date(session.expires_at)
                        }
                    },
                    upsert: true
                }
            }));
        if (sessions.length) await Session.bulkWrite(sessions);

        const legacyHistory = sqlite.prepare('SELECT * FROM advisor_history').all();
        const history = legacyHistory
            .filter(entry => userIds.has(entry.user_id))
            .map(entry => ({
                updateOne: {
                    filter: { legacyId: String(entry.id) },
                    update: {
                        $set: {
                            user: userIds.get(entry.user_id),
                            question: entry.question,
                            response: entry.response,
                            product_id: entry.product_id || null,
                            createdAt: new Date(`${entry.created_at}Z`)
                        }
                    },
                    upsert: true
                }
            }));
        if (history.length) await AdvisorHistory.bulkWrite(history);

        console.log(`Migrated ${products.length} products, ${legacyUsers.length} users, ${sessions.length} sessions, and ${history.length} advisor history entries.`);
    } finally {
        sqlite.close();
        await mongoose.disconnect();
    }
}

migrate().catch(error => {
    console.error('SQLite to MongoDB migration failed:', error.message);
    process.exitCode = 1;
});

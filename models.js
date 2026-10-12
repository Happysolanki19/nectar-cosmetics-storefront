'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, maxlength: 30 },
    address: { type: String, maxlength: 300 },
    createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['skincare', 'makeup', 'hair', 'body'], required: true },
    description: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    mrp: {
        type: Number,
        required: true,
        min: 0,
        validate: { validator(value) { return value >= this.price; }, message: 'MRP must be at least the sale price.' }
    },
    offer: { type: String, default: null },
    keywords: { type: [String], default: [] }
}, { id: false });
productSchema.index({ category: 1, name: 1 });

const sessionSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true }
}, { id: false });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const advisorHistorySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true, minlength: 2, maxlength: 500 },
    response: { type: String, required: true },
    product_id: { type: String, ref: 'Product', default: null },
    createdAt: { type: Date, default: Date.now },
    legacyId: { type: String, unique: true, sparse: true }
});
advisorHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = {
    AdvisorHistory: mongoose.models.AdvisorHistory || mongoose.model('AdvisorHistory', advisorHistorySchema),
    Product: mongoose.models.Product || mongoose.model('Product', productSchema),
    Session: mongoose.models.Session || mongoose.model('Session', sessionSchema),
    User: mongoose.models.User || mongoose.model('User', userSchema)
};

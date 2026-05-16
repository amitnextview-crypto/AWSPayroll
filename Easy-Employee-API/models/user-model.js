const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 50,
        trim: true
    },
    username: {
  type: String,
  required: [true, 'Enter Username'],
  unique: true,
  trim: true,
},
    email: {
        type: String,
        required: [true, 'Enter Email Address'],
        unique: [true, 'Email Already Exists'],
        trim: true,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
    },
    mobile: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 13,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    type: {
        type: String,
        enum: ['admin', 'employee', 'leader'],
        default: 'employee',
        set: v => String(v).toLowerCase() // normalize
    },
    status: {
        type: String,
        enum: ['active', 'banned'],
        default: 'active'
    },
    team: {
        type: Schema.Types.ObjectId,
        ref: 'Team'
    },
    profile: {
        type: String,
        default: 'user.png'
    },
    address: {
        type: String,
        trim: true,
        default: 'No Address Specified',
        maxlength: 300
    },

    // 🆕 Additional Info
    employeeCode: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    designation: {
        type: String,
        trim: true,
        default: 'Employee'
    },
    date: {
        type: String,
        default: () => new Date().toISOString().split('T')[0] // yyyy-mm-dd
    },
    panNumber: { type: String, trim: true, default: '' },
    aadhaarNumber: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    accountNumber: { type: String, trim: true, default: '' },
    ifscCode: { type: String, trim: true, default: '' },
     // 🆕 Newly Added Fields
    workType: {
        type: String,
        enum: ['Onsite', 'Remote', 'Hybrid'],
        default: 'Onsite',
        trim: true
    },
    uan: {
        type: String,
        trim: true,
        default: ''
    },
    esi: {
        type: String,
        trim: true,
        default: ''
    },
    emergencyContact: {
        name: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
        relation: { type: String, trim: true, default: '' }
    },
    documents: [{
        name: { type: String, trim: true },
        file: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now }
    }],
    notificationSettings: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true }
    },
    securitySettings: {
        twoFactorEnabled: { type: Boolean, default: false }
    },
}, { timestamps: true });

// ===============================
// PASSWORD ENCRYPTION MIDDLEWARE
// ===============================
const SALT_FACTOR = 10;

// Encrypt password before save
userSchema.pre('save', function (done) {
    const user = this;
    if (!user.isModified('password')) return done();
    bcrypt.genSalt(SALT_FACTOR, (err, salt) => {
        if (err) return done(err);
        bcrypt.hash(user.password, salt, (err, hashed) => {
            if (err) return done(err);
            user.password = hashed;
            done();
        });
    });
});

// Encrypt on updateOne
userSchema.pre('updateOne', async function (next) {
    const update = this.getUpdate();
    if (!update || !update.password) return next();
    try {
        const salt = await bcrypt.genSalt(SALT_FACTOR);
        const hashed = await bcrypt.hash(update.password, salt);
        if (!update.$set) update.$set = {};
        update.$set.password = hashed;
        delete update.password;
        next();
    } catch (err) { next(err); }
});

// Encrypt on findOneAndUpdate
userSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();
    if (!update || !update.password) return next();
    try {
        const salt = await bcrypt.genSalt(SALT_FACTOR);
        const hashed = await bcrypt.hash(update.password, salt);
        if (!update.$set) update.$set = {};
        update.$set.password = hashed;
        delete update.password;
        next();
    } catch (err) { next(err); }
});

module.exports = mongoose.model('User', userSchema, 'users');

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const generateDietPlan = require('./dietEngine');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const JWT_SECRET = 'super-secret-fatloss-key-2026';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- AUTH ROUTES ---

// Register
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], function(err) {
            if (err) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    });
});

// --- DIET & PROFILE ROUTES ---

// Get Profile & Plan
app.get('/api/profile', authenticateToken, (req, res) => {
    db.get('SELECT * FROM health_profiles WHERE user_id = ?', [req.user.id], (err, profile) => {
        if (err) return res.status(500).json({ error: 'Error fetching profile' });
        res.json({ profile });
    });
});

// Save Profile & Generate Plan
app.post('/api/profile', authenticateToken, (req, res) => {
    const { age, weight, height, activity_level, goal, region, disease } = req.body;
    
    // Calculate and generate diet plan
    const generatedPlan = generateDietPlan({ age, weight, height, activity_level, goal, region, disease });
    
    const planJson = JSON.stringify(generatedPlan);

    // Upsert health profile
    db.get('SELECT id FROM health_profiles WHERE user_id = ?', [req.user.id], (err, row) => {
        if (row) {
            // Update
            db.run(`
                UPDATE health_profiles 
                SET age = ?, weight = ?, height = ?, activity_level = ?, goal = ?, region = ?, disease = ?, generated_plan = ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `, [age, weight, height, activity_level, goal, region, disease, planJson, req.user.id], (err) => {
                if (err) return res.status(500).json({ error: 'Error updating profile' });
                res.json({ message: 'Profile updated and plan generated successfully', plan: generatedPlan });
            });
        } else {
            // Insert
            db.run(`
                INSERT INTO health_profiles (user_id, age, weight, height, activity_level, goal, region, disease, generated_plan)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [req.user.id, age, weight, height, activity_level, goal, region, disease, planJson], (err) => {
                if (err) return res.status(500).json({ error: 'Error saving profile' });
                res.json({ message: 'Profile saved and plan generated successfully', plan: generatedPlan });
            });
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

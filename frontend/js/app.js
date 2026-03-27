const API_URL = 'http://localhost:3000/api';

// Global State
let userToken = localStorage.getItem('sattva_token');
let userData = JSON.parse(localStorage.getItem('sattva_user'));
let currentPlan = null;
let currentDay = 'Monday';

// DOM Elements
const views = document.querySelectorAll('.view');
const navAuth = document.getElementById('nav-auth');
const navUser = document.getElementById('nav-user');
const welcomeText = document.getElementById('welcome-text');

// Init application
document.addEventListener('DOMContentLoaded', () => {
    checkContextAndRoute();
    document.getElementById('form-register').addEventListener('submit', handleRegister);
    document.getElementById('form-login').addEventListener('submit', handleLogin);
    document.getElementById('form-profile').addEventListener('submit', handleProfileSubmit);
});

// Routing helper
function showView(viewId) {
    views.forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`view-${viewId}`);
    if(target) target.classList.add('active');
}

// Global Routing Logic
async function checkContextAndRoute() {
    if (userToken) {
        navAuth.style.display = 'none';
        navUser.style.display = 'flex';
        welcomeText.textContent = `Hello, ${userData.name}`;

        try {
            const res = await fetch(`${API_URL}/profile`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            const data = await res.json();

            if (data.profile && data.profile.generated_plan) {
                fillProfileForm(data.profile);
                currentPlan = JSON.parse(data.profile.generated_plan);
                renderDashboard();
                showView('dashboard');
            } else {
                showView('profile');
            }
        } catch (e) {
            console.error(e);
            logout();
        }
    } else {
        navAuth.style.display = 'flex';
        navUser.style.display = 'none';
        showView('landing');
    }
}

// Authentication Handlers
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast('Registration successful! Please login.');
            showView('login');
        } else {
            showToast(data.error || 'Registration failed');
        }
    } catch (e) {
        showToast('Server error');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
            userToken = data.token;
            userData = data.user;
            localStorage.setItem('sattva_token', userToken);
            localStorage.setItem('sattva_user', JSON.stringify(userData));
            checkContextAndRoute();
            showToast('Welcome back!');
        } else {
            showToast(data.error || 'Login failed');
        }
    } catch (e) {
        showToast('Server error');
    }
}

function logout() {
    userToken = null;
    userData = null;
    currentPlan = null;
    localStorage.removeItem('sattva_token');
    localStorage.removeItem('sattva_user');
    checkContextAndRoute();
    showToast('Logged out');
}

// Profile & Diet Engine Handlers
async function handleProfileSubmit(e) {
    e.preventDefault();
    document.getElementById('generate-btn').innerHTML = "Generating ⏳";
    
    const profile = {
        age: document.getElementById('prof-age').value,
        weight: document.getElementById('prof-weight').value,
        height: document.getElementById('prof-height').value,
        activity_level: document.getElementById('prof-activity').value,
        region: document.getElementById('prof-region').value,
        goal: document.getElementById('prof-goal').value,
        disease: document.getElementById('prof-disease').value
    };

    try {
        const res = await fetch(`${API_URL}/profile`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify(profile)
        });
        const data = await res.json();
        
        if (res.ok) {
            currentPlan = data.plan;
            renderDashboard();
            showView('dashboard');
            showToast('Diet plan generated successfully!');
        } else {
            showToast('Failed to generate plan');
        }
    } catch (e) {
        showToast('Server error during generation');
    } finally {
        document.getElementById('generate-btn').innerHTML = "✨ Generate Smart Diet Plan";
    }
}

function fillProfileForm(profile) {
    if(!profile) return;
    document.getElementById('prof-age').value = profile.age || '';
    document.getElementById('prof-weight').value = profile.weight || '';
    document.getElementById('prof-height').value = profile.height || '';
    if(profile.activity_level) document.getElementById('prof-activity').value = profile.activity_level;
    if(profile.region) document.getElementById('prof-region').value = profile.region;
    if(profile.goal) document.getElementById('prof-goal').value = profile.goal;
    if(profile.disease) document.getElementById('prof-disease').value = profile.disease;
}

// DASHBOARD RENDERING
function renderDashboard() {
    if (!currentPlan) return;
    
    document.getElementById('dash-calories').textContent = currentPlan.targetCalories;
    
    // Render Disease Alerts
    const alertContainer = document.getElementById('disease-warnings');
    alertContainer.innerHTML = '';
    
    if (currentPlan.diseaseAdjustments && currentPlan.diseaseAdjustments.length > 0) {
        currentPlan.diseaseAdjustments.forEach(adj => {
            const div = document.createElement('div');
            div.className = 'alert';
            div.innerHTML = `⚠️ ${adj}`;
            alertContainer.appendChild(div);
        });
    }

    // Render Tabs
    const tabsContainer = document.getElementById('day-tabs');
    tabsContainer.innerHTML = '';
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    days.forEach(day => {
        const btn = document.createElement('button');
        btn.className = `tab-btn ${day === currentDay ? 'active' : ''}`;
        btn.textContent = day;
        btn.onclick = () => {
            currentDay = day;
            renderMeals();
            // sync active tab
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
        tabsContainer.appendChild(btn);
    });

    renderMeals();
    renderGroceryList();
}

function renderMeals() {
    const dailyPlan = currentPlan.weeklyPlan[currentDay];
    if(!dailyPlan) return;

    const parseMeal = (str) => {
        // Splitting "Meal Name [150g, 50g]" -> Title: "Meal Name", Subtitle: "150g, 50g"
        const match = str.match(/(.*?) \[(.*?)\]/);
        if (match) return { name: match[1], portions: match[2] };
        return { name: str, portions: "" };
    };

    const b = parseMeal(dailyPlan.breakfast);
    const l = parseMeal(dailyPlan.lunch);
    const s = parseMeal(dailyPlan.snack);
    const d = parseMeal(dailyPlan.dinner);

    const formatHtml = (meal, icon, title) => `
        <div class="meal-card slide-up">
            <div class="meal-icon">${icon}</div>
            <h3>${title}</h3>
            <p class="meal-item">${meal.name}</p>
            <p class="meal-portions">Portions: <span>${meal.portions}</span></p>
        </div>
    `;

    document.getElementById('meal-grid').innerHTML = 
        formatHtml(b, '🌅', 'Breakfast') +
        formatHtml(l, '☀️', 'Lunch') +
        formatHtml(s, '☕', 'Snack') +
        formatHtml(d, '🌙', 'Dinner');
}

function renderGroceryList() {
    const list = currentPlan.groceryList;
    const container = document.getElementById('grocery-list');
    container.innerHTML = '';

    if (!list || list.length === 0) return;

    list.forEach(groc => {
        const div = document.createElement('div');
        div.className = 'grocery-item';
        div.innerHTML = `
            <div class="groc-name">${groc.item}</div>
            <div class="groc-amount">${groc.amount}</div>
        `;
        container.appendChild(div);
    });
}

// UI Utilities
function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

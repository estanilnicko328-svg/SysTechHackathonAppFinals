// ConcernTrack Core Logic
// Data Models
const CONCERNS_KEY = 'concerntrack_concerns';
const AUDIT_KEY = 'concerntrack_audit';
const USERS_KEY = 'concerntrack_users';
const SESSION_KEY = 'concerntrack_session';

let concerns = JSON.parse(localStorage.getItem(CONCERNS_KEY)) || [];
let auditLog = JSON.parse(localStorage.getItem(AUDIT_KEY)) || [];
let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

// Session-based current user (replaces hardcoded user)
let currentUser = loadSession() || { role: 'guest', id: null, name: null };
window.currentUser = currentUser;

// Load session from localStorage
function loadSession() {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
        try {
            return JSON.parse(session);
        } catch (e) {
            localStorage.removeItem(SESSION_KEY);
        }
    }
    return null;
}

// Save session to localStorage
function saveSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    currentUser = user;
    window.currentUser = currentUser;
}

// Clear session (logout)
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    currentUser = { role: 'guest', id: null, name: null };
    window.currentUser = currentUser;
}

// Student Registration
function registerUser(name, studentId, password) {
    if (!name || !studentId || !password) {
        return { success: false, message: 'All fields are required.' };
    }
    if (users.find(u => u.studentId === studentId)) {
        return { success: false, message: 'Student ID already registered.' };
    }
    const newUser = {
        name: name.trim(),
        studentId: studentId.trim(),
        password: password, // In production, hash this!
        role: 'student',
        registeredAt: Date.now()
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { success: true, message: 'Account created! Please log in.' };
}

// Student Login
function loginUser(studentId, password) {
    if (!studentId || !password) {
        return { success: false, message: 'Student ID and password are required.' };
    }
    const user = users.find(u => u.studentId === studentId.trim() && u.password === password);
    if (!user) {
        return { success: false, message: 'Invalid Student ID or password.' };
    }
    const sessionUser = {
        role: user.role,
        id: user.studentId,
        name: user.name
    };
    saveSession(sessionUser);
    return { success: true, message: `Welcome, ${user.name}!` };
}

// Student Logout
function logoutUser() {
    clearSession();
    return { success: true, message: 'Logged out successfully.' };
}

// Check if student is authenticated
function isStudentAuthenticated() {
    return currentUser && currentUser.role === 'student' && currentUser.id;
}

// Admin Registration
function registerAdmin(name, username, password) {
    if (!name || !username || !password) {
        return { success: false, message: 'All fields are required.' };
    }
    if (users.find(u => u.username === username && u.role === 'admin')) {
        return { success: false, message: 'Admin username already taken.' };
    }
    const newAdmin = {
        name: name.trim(),
        username: username.trim(),
        password: password,
        role: 'admin',
        registeredAt: Date.now()
    };
    users.push(newAdmin);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { success: true, message: 'Admin account created! Please log in.' };
}

// Admin Login
function loginAdmin(username, password) {
    if (!username || !password) {
        return { success: false, message: 'Username and password are required.' };
    }
    const user = users.find(u => u.username === username.trim() && u.password === password && u.role === 'admin');
    if (!user) {
        return { success: false, message: 'Invalid username or password.' };
    }
    const sessionUser = {
        role: user.role,
        id: user.username,
        name: user.name
    };
    saveSession(sessionUser);
    return { success: true, message: `Welcome, ${user.name}!` };
}

// Check if admin is authenticated
function isAdminAuthenticated() {
    return currentUser && currentUser.role === 'admin' && currentUser.id;
}

// Status workflow
const STATUS_FLOW = {
    Submitted: ['Routed'],
    Routed: ['Read'],
    Read: ['Screened'],
    Screened: ['Resolved', 'Escalated'],
    Resolved: [],
    Escalated: []
};

// Enhanced routing with program mapping
const ROUTING_MAP = {
    Academic: {
        general: 'Academic Dept',
        CS: 'Academic-CS Dept',
        BSIT: 'Academic-IT Dept',
        BSBA: 'Academic-Business Dept',
        BSA: 'Academic-Accountancy Dept',
        BEED: 'Academic-Education Dept',
        BSED: 'Academic-Education Dept',
        BSN: 'Academic-Nursing Dept'
    },
    Financial: 'Finance Dept',
    Welfare: 'Student Welfare Dept'
};

// Program options for each category (used to dynamically populate the Program dropdown)
const PROGRAM_OPTIONS = {
    Academic: ['CCS', 'COA', 'COE', 'CBAE', 'Other'],
    Financial: ['Cashier', 'Registrar'],
    Welfare: ['Clinic', 'OSA', 'Guidance']
};

function populateProgramOptions(category) {
    const programSelect = document.getElementById('program');
    if (!programSelect) return;

    const options = PROGRAM_OPTIONS[category] || [];

    // Only show program choices for Academic; hide for others (Financial/Welfare)
    if (category === 'Academic') {
        programSelect.style.display = '';
        programSelect.innerHTML = '<option value="">Select Program</option>' +
            options.map(p => `<option value="${p}">${p}</option>`).join('');
    } else {
        programSelect.style.display = 'none';
        programSelect.innerHTML = '<option value="">(Not required)</option>';
    }

    // Keep the previously selected value if still valid
    const existingValue = programSelect.value;
    if (existingValue && options.includes(existingValue)) {
        programSelect.value = existingValue;
    }
}

function getDepartment(category, program) {
    const map = ROUTING_MAP[category];
    if (typeof map === 'object') {
        return map[program] || map.general || 'Academic Dept';
    }
    return map;
}

// Init app
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    loadData();
    setupSLATimer();

    const hasStudentView = !!document.getElementById('concernForm');
    const hasAdminView = !!document.getElementById('adminConcerns');

    if (hasStudentView) {
        setupEventListeners();
        populateProgramOptions(document.getElementById('category')?.value);
        checkStudentAuth();
    }

    if (hasAdminView) {
        renderAdminView();
        if (typeof updateMetrics === 'function') updateMetrics();
    }
}

// Student Auth UI Controller
function hideFixedUI() {
    const notifications = document.getElementById('notifications');
    const chatToggle = document.getElementById('chatToggle');
    const chatContainer = document.getElementById('chatContainer');
    if (notifications) notifications.style.display = 'none';
    if (chatToggle) chatToggle.style.display = 'none';
    if (chatContainer) chatContainer.style.display = 'none';
}

function showFixedUI() {
    const notifications = document.getElementById('notifications');
    const chatToggle = document.getElementById('chatToggle');
    const chatContainer = document.getElementById('chatContainer');
    if (notifications) notifications.style.display = 'block';
    if (chatToggle) chatToggle.style.display = 'block';
    if (chatContainer) chatContainer.style.display = 'none'; // Keep logic-based display
}

function checkStudentAuth() {
    const overlay = document.getElementById('studentAuth');
    const content = document.getElementById('studentContent');
    const userBadge = document.getElementById('userBadge');

    if (!overlay || !content) return;

    if (isStudentAuthenticated()) {
        overlay.style.display = 'none';
        showFixedUI();
        content.style.display = 'block';
        if (userBadge) {
            userBadge.textContent = `👤 ${currentUser.name}`;
            userBadge.style.display = 'inline-block';
        }
        renderStudentView();
    } else {
        overlay.style.display = 'flex';
        hideFixedUI();
        content.style.display = 'none';
        if (userBadge) userBadge.style.display = 'none';
        showAuthForm('login');
    }
}

function showAuthForm(mode) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authTitle = document.getElementById('authTitle');
    const authToggle = document.getElementById('authToggle');
    const authError = document.getElementById('studentAuthError');

    if (authError) authError.style.display = 'none';

    if (mode === 'login') {
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        if (authTitle) authTitle.textContent = 'Student Login';
        if (authToggle) authToggle.innerHTML = 'No account? <a href="#" onclick="showAuthForm(\'register\'); return false;">Register</a>';
    } else {
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        if (authTitle) authTitle.textContent = 'Student Registration';
        if (authToggle) authToggle.innerHTML = 'Have an account? <a href="#" onclick="showAuthForm(\'login\'); return false;">Login</a>';
    }
}

function handleStudentLogin(e) {
    if (e) e.preventDefault();
    const studentId = document.getElementById('loginStudentId').value;
    const password = document.getElementById('loginPassword').value;
    const error = document.getElementById('studentAuthError');

    const result = loginUser(studentId, password);
    if (result.success) {
        if (error) error.style.display = 'none';
        showNotification(result.message);
        checkStudentAuth();
    } else {
        if (error) {
            error.textContent = result.message;
            error.style.display = 'block';
        }
    }
}

function handleStudentRegister(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('regName').value;
    const studentId = document.getElementById('regStudentId').value;
    const password = document.getElementById('regPassword').value;
    const error = document.getElementById('studentAuthError');

    const result = registerUser(name, studentId, password);
    if (result.success) {
        if (error) error.style.display = 'none';
        showNotification(result.message);
        showAuthForm('login');
        // Pre-fill login form
        document.getElementById('loginStudentId').value = studentId;
    } else {
        if (error) {
            error.textContent = result.message;
            error.style.display = 'block';
        }
    }
}

function handleStudentLogout() {
    const result = logoutUser();
    showNotification(result.message);
    checkStudentAuth();
}

// Event Listeners
function setupEventListeners() {
    const concernForm = document.getElementById('concernForm');
    if (concernForm) {
        concernForm.addEventListener('submit', handleSubmit);
    }

    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            populateProgramOptions(e.target.value);
        });
    }
}

function handleSubmit(e) {
    e.preventDefault();
    
    const formData = {
        id: Date.now().toString(),
        category: document.getElementById('category').value,
        program: document.getElementById('program').value,
        description: document.getElementById('description').value,
        attachment: document.getElementById('attachment').files[0]?.name || null,
        anonymous: document.getElementById('anonymous').checked,
        studentName: document.getElementById('anonymous').checked ? null : currentUser.name,
        status: 'Submitted',
        department: getDepartment(document.getElementById('category').value, document.getElementById('program').value),
        timestamps: { submitted: Date.now() },
        studentId: currentUser.id,
        history: []
    };
    
    concerns.unshift(formData);
    saveData();
    
    logAudit('concern_submitted', formData.id, currentUser);
    showNotification('Concern submitted successfully!');
    
    // Auto-route
    setTimeout(() => {
        updateStatus(formData.id, 'Routed');
        logAudit('concern_routed', formData.id, { role: 'system' });
        showNotification('Concern routed to ' + formData.department);
    }, 2000);
    
    e.target.reset();
    if (document.getElementById('studentConcerns')) renderStudentView();
}

function updateStatus(concernId, newStatus, actor = currentUser) {
    const concern = concerns.find(c => c.id === concernId);
    if (!concern || !STATUS_FLOW[concern.status].includes(newStatus)) return;
    
    concern.status = newStatus;
    concern.timestamps[newStatus.toLowerCase()] = Date.now();
    concern.history.push({ status: newStatus, timestamp: Date.now(), actor });
    
    saveData();
    logAudit(`concern_${newStatus.toLowerCase()}`, concernId, actor);
    
    // Notification
    showNotification(`Concern #${concernId.slice(-4)}: ${newStatus}`);
    
    if (document.getElementById('studentConcerns')) renderStudentView();
    if (document.getElementById('adminConcerns')) {
        renderAdminView();
        if (typeof updateMetrics === 'function') updateMetrics();
    }
}

function renderStudentView() {
    const container = document.getElementById('studentConcerns');
    if (!container) return;

    const userConcerns = concerns.filter(c => c.studentId === currentUser.id);
    container.innerHTML = userConcerns.map(c => `
        <div class="concern-card">
            <div class="concern-header">
                <strong>#${c.id.slice(-4)} - ${c.category}</strong>
                <span class="status ${c.status}">${c.status}</span>
            </div>
            <p>${c.description.substring(0, 150)}...</p>
            ${c.attachment ? `<small>📎 ${c.attachment}</small>` : ''}
            <small>${c.anonymous ? '👤 Anonymous' : `👤 ${window.currentUser?.name || 'Student ' + c.studentId}`}</small>
            <div class="concern-timestamps">
                Submitted: ${formatDate(c.timestamps.submitted)}
                ${c.history.map(h => `<br><small>${h.status} by ${h.actor.role || 'system'} - ${formatDate(h.timestamp)}</small>`).join('')}
            </div>
        </div>
    `).join('');
}

function renderAdminView(filterText = '') {
    const container = document.getElementById('adminConcerns');
    
    let displayConcerns = concerns;
    if (filterText.trim()) {
        const lowerFilter = filterText.toLowerCase();
        displayConcerns = concerns.filter(c => {
            const nameMatch = c.studentName && c.studentName.toLowerCase().includes(lowerFilter);
            const idMatch = c.studentId && c.studentId.toLowerCase().includes(lowerFilter);
            return nameMatch || idMatch;
        });
    }
    
    container.innerHTML = displayConcerns.map(c => {
        const nextStatuses = STATUS_FLOW[c.status];
        return `
            <div class="concern-card">
                <div class="concern-header">
                <strong>#${c.id.slice(-4)} ${c.category} → ${c.department}</strong>
                <span class="status ${c.status}">${c.status}</span>
            </div>
            <div class="student-info">
                <strong>From:</strong> ${c.anonymous ? '👤 Anonymous' : (c.studentName || 'Student ' + c.studentId)}
            </div>
            <p>${c.description}</p>
            ${c.attachment && `<small>📎 ${c.attachment}</small>`}
                <div class="status-buttons">
                    ${nextStatuses.map(s => 
                        `<button class="status-btn enabled" onclick="updateStatus('${c.id}', '${s}')">${s}</button>`
                    ).join('')}
                    <button class="delete-btn" onclick="deleteConcern('${c.id}')">Delete</button>
                </div>
                <small>${formatDate(c.timestamps.submitted)}</small>
            </div>
        `;
    }).join('');
}

function filterConcerns() {
    const searchValue = document.getElementById('searchStudent').value;
    renderAdminView(searchValue);
}

function clearFilter() {
    document.getElementById('searchStudent').value = '';
    renderAdminView();
}

function deleteConcern(concernId) {
    const index = concerns.findIndex(c => c.id === concernId);
    if (index === -1) return;

    concerns.splice(index, 1);
    saveData();
    showNotification(`Concern #${concernId.slice(-4)} deleted.`);

    if (document.getElementById('adminConcerns')) {
        renderAdminView();
        if (typeof updateMetrics === 'function') updateMetrics();
    }
}


function logAudit(action, resourceId, actor) {
    const log = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        action,
        resourceId,
        actor: actor.role || actor
    };
    auditLog.unshift(log);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLog.slice(0, 1000))); // Limit size
}

function saveData() {
    localStorage.setItem(CONCERNS_KEY, JSON.stringify(concerns.slice(0, 1000)));
    window.concerns = concerns;
    window.currentUser = currentUser;
}

function loadData() {
    // Load 50+ demo data using data.js
    if (concerns.length === 0) {
        if (typeof generateDemoData === 'function') {
            concerns = generateDemoData();
        } else {
            // Fallback demo
            concerns = [
                { id: '123', category: 'Academic', program: 'CS', description: 'Need course extension', status: 'Resolved', department: getDepartment('Academic', 'CS'), timestamps: { submitted: Date.now() - 1000000, resolved: Date.now() }, studentId: 'stu1', anonymous: false, history: [{status: 'Resolved', timestamp: Date.now(), actor: {role: 'admin'}}] },
                { id: '456', category: 'Financial', program: 'BSIT', description: 'Scholarship delay', status: 'Escalated', department: getDepartment('Financial', 'BSIT'), timestamps: { submitted: Date.now() - 500000000 }, studentId: 'stu2', anonymous: true, history: [] }
            ];
        }
        saveData();
    }
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString();
}

function showNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    document.getElementById('notifications').appendChild(notif);
    
    setTimeout(() => notif.remove(), 5000);
}

// SLA Enforcement
function setupSLATimer() {
    checkSLA();
    setInterval(checkSLA, 60000); // Check every minute
}

function checkSLA() {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    
    concerns.forEach(c => {
        // SLA 1: Routed >2 days without Read → Escalate
        if (c.status === 'Routed' && c.timestamps.routed && (now - c.timestamps.routed) > 2 * DAY_MS && !c.timestamps.read) {
            updateStatus(c.id, 'Escalated', { role: 'SLA System' });
            showNotification(`SLA Breach: #${c.id.slice(-4)} escalated (no read after 2 days)`);
        }
        
        // SLA 2: Read >5 days without Screened → Escalate
        if (c.status === 'Read' && c.timestamps.read && (now - c.timestamps.read) > 5 * DAY_MS && !c.timestamps.screened) {
            updateStatus(c.id, 'Escalated', { role: 'SLA System' });
            showNotification(`SLA Breach: #${c.id.slice(-4)} escalated (no screening after 5 days)`);
        }
        
        // SLA 3: Screened >3 days without Resolve/Escalate → Auto-escalate
        if (c.status === 'Screened' && c.timestamps.screened && (now - c.timestamps.screened) > 3 * DAY_MS && !c.timestamps.resolved && !['Resolved', 'Escalated'].includes(c.status)) {
            updateStatus(c.id, 'Escalated', { role: 'SLA System' });
            showNotification(`SLA Breach: #${c.id.slice(-4)} auto-escalated (no resolution after 3 days)`);
        }
    });
}



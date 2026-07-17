// ========== FIREBASE CONFIG ==========
const firebaseConfig = {
    apiKey: "AIzaSyByoVGSmDnWVYAY3CFFpHYOC2siWAH0ajE",
    authDomain: "apps-studio-1f1c0.firebaseapp.com",
    projectId: "apps-studio-1f1c0",
    storageBucket: "apps-studio-1f1c0.firebasestorage.app",
    messagingSenderId: "106546673585",
    appId: "1:106546673585:web:48f13f073d92d9cb58af90"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Offline persistence — BFCache + back navigation দুটোতেই কাজ করে
db.enablePersistence({ synchronizeTabs: true })
    .catch(function(err) {
        if (err.code === 'failed-precondition') {
            // Multiple tabs open — persistence only works in one tab at a time
            // Non-critical, app still works
        } else if (err.code === 'unimplemented') {
            // Browser doesn't support persistence
            // Fall back to sessionStorage cache only
        }
    });

// ========== CACHE SYSTEM (sessionStorage) ==========
function cacheSet(key, data) {
    try { sessionStorage.setItem(key, JSON.stringify({ d: data, t: Date.now() })); } catch(e) {}
}
function cacheGet(key, maxAgeMs) {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // TTL check — default 10 minutes
        if (maxAgeMs === undefined) maxAgeMs = 10 * 60 * 1000;
        if (maxAgeMs > 0 && Date.now() - parsed.t > maxAgeMs) {
            sessionStorage.removeItem(key);
            return null;
        }
        return parsed.d;
    } catch(e) { return null; }
}
function cacheClear(key) {
    try { sessionStorage.removeItem(key); } catch(e) {}
}

// ========== UTILITIES ==========
function processAppName(app) {
    const p = { ...app };
    p.displayName = p.name || '';
    return p;
}
function getDisplayName(app) { return app.displayName || app.name || ''; }

function getErrorImg(name) {
    return `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%231a73e8%22 width=%22100%22 height=%22100%22 rx=%2220%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%2240%22>${encodeURIComponent((name||'A').charAt(0))}</text></svg>`;
}

function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}
function showComingSoon()  { document.getElementById('comingSoonModal').classList.add('active'); }
function closeComingSoon() { document.getElementById('comingSoonModal').classList.remove('active'); }

// ========== SCROLL HIDE/SHOW ==========
(function(){
    var _lastY = 0, _ticking = false;
    function onScroll() {
        var currentY = window.scrollY;
        var diff = currentY - _lastY;
        if (Math.abs(diff) < 6) { _ticking = false; _lastY = currentY; return; }
        var goingDown = diff > 0 && currentY > 80;
        var header = document.getElementById('mainHeader');
        var nav    = document.querySelector('.bottom-nav');
        var bar    = document.querySelector('.bottom-bar');
        if (header) { header.style.transform = goingDown ? 'translateY(-100%)' : 'translateY(0)'; header.style.transition = 'transform 0.3s ease'; }
        if (nav)    { nav.style.transform    = goingDown ? 'translateY(100%)'  : 'translateY(0)'; nav.style.transition    = 'transform 0.3s ease'; }
        if (bar)    { bar.style.transform    = goingDown ? 'translateY(100%)'  : 'translateY(0)'; bar.style.transition    = 'transform 0.3s ease'; }
        _lastY = currentY; _ticking = false;
    }
    window.addEventListener('scroll', function(){ if (!_ticking) { requestAnimationFrame(onScroll); _ticking = true; } }, {passive:true});
})();

// ========== SHARED HEADER ==========
function renderHeader() {
    var isHome = /(^|\/)index\.html$|\/$/.test(location.pathname) || location.pathname === '/';
    var backBtn = isHome ? '' :
        '<button onclick="if(window.history.length>1){history.back();}else{location.href=\'index.html\';}" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;margin-right:4px;"><i class="fas fa-arrow-left"></i></button>';
    return `
    <div class="header" id="mainHeader">
        <div class="logo-area">
            ${backBtn}
            <div style="width:36px;height:36px;background:white;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                <i class="fas fa-play" style="color:#1a73e8;font-size:18px;margin-left:2px;"></i>
            </div>
            <div><h1>Apps Studio</h1><span>Free Apps & Games</span></div>
            <div style="margin-left:auto;display:flex;gap:12px;align-items:center;">
                <a href="search.html" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;"><i class="fas fa-search"></i></a>
                <a href="request.html" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;"><i class="fas fa-paper-plane"></i></a>
                <button onclick="showComingSoon()" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;"><i class="fas fa-user-circle"></i></button>
            </div>
        </div>
    </div>`;
}

// ========== SHARED BOTTOM NAV ==========
function renderBottomNav(activePage) {
    const pages = [
        { key:'home',    href:'index.html',  icon:'fa-home',        label:'Home'     },
        { key:'toplist', href:'toplist.html', icon:'fa-fire',        label:'Top List' },
        { key:'request', href:'request.html', icon:'fa-paper-plane', label:'Request'  },
        { key:'profile', href:'#',           icon:'fa-user',        label:'Profile'  },
    ];
    let html = '<div class="bottom-nav">';
    pages.forEach(p => {
        const isActive = p.key === activePage ? 'active' : '';
        const onclick  = p.key === 'profile' ? 'onclick="showComingSoon();return false;"' : '';
        html += `<a href="${p.href}" class="nav-item ${isActive}" ${onclick}><i class="fas ${p.icon}"></i><span>${p.label}</span></a>`;
    });
    html += '</div>';
    return html;
}

// ========== SHARED FOOTER ==========
function renderFooter() {
    const year = new Date().getFullYear();
    return `
    <div class="site-footer">
        <div class="footer-brand"><p class="footer-title">Apps Studio</p><p class="footer-tagline">Your one-stop app destination</p></div>
        <div class="footer-cats">
            <a href="categories.html?cat=social">Social</a>
            <a href="categories.html?cat=games">Games</a>
            <a href="categories.html?cat=tools">Tools</a>
            <a href="categories.html?cat=entertainment">Entertainment</a>
            <a href="categories.html?cat=education">Education</a>
            <a href="categories.html?cat=productivity">Productivity</a>
        </div>
        <div class="social-links">
            <a href="https://wa.me/message/L3EUGB2Q7GHXN1" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i></a>
            <a href="https://www.facebook.com/Fahim50111" target="_blank" rel="noopener"><i class="fab fa-facebook-f"></i></a>
        </div>
        <div class="footer-links">
            <a href="about.html">About Us</a><span class="footer-dot">•</span><a href="privacy.html">Privacy Policy</a>
        </div>
        <p class="footer-copy">© ${year} Apps Studio. All rights reserved.</p>
    </div>`;
}

// ========== SHARED MODALS ==========
function renderSharedModals() {
    return `
    <div class="coming-soon-modal" id="comingSoonModal">
        <div class="coming-soon-box">
            <i class="fas fa-rocket"></i><h2>Coming Soon!</h2>
            <p>Login / Sign Up feature is under development. Stay tuned!</p>
            <button onclick="closeComingSoon()">Got it!</button>
        </div>
    </div>
    <div class="ad-overlay" id="adOverlay">
        <button class="ad-close-btn" onclick="typeof closeAd==='function'&&closeAd()">✕</button>
        <iframe id="adFrame" src=""></iframe>
    </div>
    <div class="toast" id="toast"></div>
    <div class="bottom-bar" id="bottomAdBar">
        <div id="bannerAdContainer">
            <script>atOptions={'key':'71971cef439f7e47d3f26f03c0ce1844','format':'iframe','height':50,'width':320,'params':{}};<\/script>
            <script src="https://www.highperformanceformat.com/71971cef439f7e47d3f26f03c0ce1844/invoke.js"><\/script>
        </div>
    </div>`;
}

// ========== VISITOR TRACKER (Firestore) ==========
function trackVisitor() {
    try {
        var today = new Date().toISOString().split('T')[0];
        var key   = 'visitor_' + today;
        if (localStorage.getItem(key)) return;
        localStorage.setItem(key, '1');
        db.collection('visitors').doc(today).set(
            { count: firebase.firestore.FieldValue.increment(1), date: today },
            { merge: true }
        );
        Object.keys(localStorage).forEach(function(k){
            if (k.startsWith('visitor_') && k < key) localStorage.removeItem(k);
        });
    } catch(e) {}
}
window.addEventListener('load', function(){ setTimeout(trackVisitor, 1000); });

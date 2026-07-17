// ============================================================
// Apps Studio — script.js (Homepage - Firestore version)
// ============================================================

function navTo(url) {
    var count = parseInt(sessionStorage.getItem('navCount') || '0') + 1;
    sessionStorage.setItem('navCount', count);
    if (count % 3 === 0) {
        window.open('https://www.effectivegatecpm.com/d77va7wf7p?key=049c15845baf15b276951f6b97ff272b', '_blank');
    }
    setTimeout(function() { location.href = url; }, 100);
}

function sortByDate(arr) {
    return arr.slice().sort(function(a, b) {
        var ta = a.updatedAt || a.timestamp || 0;
        var tb = b.updatedAt || b.timestamp || 0;
        return (Number(tb) || 0) - (Number(ta) || 0);
    });
}
function sortByDl(arr) {
    return arr.slice().sort(function(a, b) { return (b.downloads || 0) - (a.downloads || 0); });
}

var ICONS = {
    social:        '<i class="fas fa-users" style="color:#1565c0;"></i>',
    games:         '<i class="fas fa-gamepad" style="color:#c62828;"></i>',
    tools:         '<i class="fas fa-wrench" style="color:#2e7d32;"></i>',
    entertainment: '<i class="fas fa-film" style="color:#e65100;"></i>',
    education:     '<i class="fas fa-graduation-cap" style="color:#6a1b9a;"></i>',
    productivity:  '<i class="fas fa-briefcase" style="color:#00695c;"></i>'
};
var CATS = ['social','games','tools','entertainment','education','productivity'];

var _swiper = null, allBanners = [];

function renderBanners() {
    var wrapper = document.getElementById('swiperWrapper');
    if (!wrapper) return;
    if (!allBanners.length) {
        var sec = document.getElementById('bannerSection');
        if (sec) sec.innerHTML = '<div class="no-banner"><i class="fas fa-images"></i><p style="font-weight:600;margin:4px 0;">Apps Studio</p><p style="font-size:11px;color:#aaa;">Download your favourite apps</p></div>';
        return;
    }
    var html = '';
    allBanners.forEach(function(b) {
        var click = b.link ? "window.open('" + b.link + "','_blank')" : '';
        html += '<div class="swiper-slide" onclick="' + click + '" style="cursor:' + (b.link ? 'pointer' : 'default') + ';">';
        html += '<img src="' + b.image + '" alt="' + (b.title||'Banner') + '" loading="lazy" onerror="this.parentElement.style.background=\'#e8f0fe\'">';
        if (b.title) html += '<div class="banner-overlay"><h3>' + b.title + '</h3>' + (b.desc ? '<p>' + b.desc + '</p>' : '') + '</div>';
        html += '</div>';
    });
    wrapper.innerHTML = html;
    if (_swiper) { try { _swiper.destroy(true, true); } catch(e) {} _swiper = null; }
    _swiper = new Swiper('.bannerSwiper', {
        loop: allBanners.length > 1,
        autoplay: allBanners.length > 1 ? { delay: 4000, disableOnInteraction: false } : false,
        pagination: { el: '.swiper-pagination', clickable: true },
        speed: 500
    });
}

function card(app) {
    var n = app.displayName || app.name;
    var c = app.category ? app.category.charAt(0).toUpperCase() + app.category.slice(1) : 'App';
    return '<div class="ps-app-card" onclick="navTo(\'app.html?id=' + app.id + '\')">' +
        '<img src="' + app.logo + '" alt="' + n + '" loading="lazy" onerror="this.src=\'' + getErrorImg(n) + '\'">' +
        '<div class="ps-app-name">' + n + '</div>' +
        '<div class="ps-app-cat">' + c + '</div></div>';
}

function seeMoreCard(cat) {
    var url = cat === 'toplist' ? 'toplist.html' : 'categories.html?cat=' + cat;
    return '<div class="ps-app-card" onclick="location.href=\'' + url + '\'" ' +
        'style="flex-shrink:0;width:88px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100px;background:#e8f0fe;border-radius:16px;cursor:pointer;">' +
        '<i class="fas fa-plus-circle" style="font-size:24px;color:#1a73e8;margin-bottom:6px;"></i>' +
        '<div style="font-size:11px;font-weight:700;color:#1a73e8;">See more</div></div>';
}

function listItem(app, rank) {
    var n = app.displayName || app.name;
    var c = app.category ? app.category.charAt(0).toUpperCase() + app.category.slice(1) : 'App';
    var clr = ['#f7c948','#b0bec5','#cd7f32','#888','#888'];
    return '<div class="ps-list-item" onclick="navTo(\'app.html?id=' + app.id + '\')">' +
        '<div class="ps-rank" style="color:' + (clr[rank]||'#888') + '">' + (rank+1) + '</div>' +
        '<img src="' + app.logo + '" alt="' + n + '" loading="lazy" onerror="this.src=\'' + getErrorImg(n) + '\'">' +
        '<div class="ps-list-info"><div class="ps-list-name">' + n + '</div>' +
        '<div class="ps-list-sub">' + c + ' &bull; ' + (app.downloads||0) + ' downloads</div></div>' +
        '<button class="ps-install-btn" onclick="event.stopPropagation();navTo(\'app.html?id=' + app.id + '\')">Install</button></div>';
}

function skeleton(n) {
    var h = '<div class="ps-section"><div class="ps-section-header"><div class="skeleton-box" style="width:140px;height:18px;"></div></div><div class="ps-scroll-row">';
    for (var i = 0; i < n; i++)
        h += '<div style="flex-shrink:0;width:88px;text-align:center;">' +
             '<div class="skeleton-box" style="width:72px;height:72px;border-radius:16px;margin:0 auto 8px;"></div>' +
             '<div class="skeleton-box" style="width:60px;height:10px;margin:0 auto 4px;"></div>' +
             '<div class="skeleton-box" style="width:40px;height:9px;margin:0 auto;"></div></div>';
    return h + '</div></div>';
}

var allApps = [];

function buildSections() {
    var main = document.getElementById('mainContent');
    if (!main) return;
    var CARD_LIMIT = 6, LIST_LIMIT = 5;
    var html = '';

    var newest = sortByDate(allApps).slice(0, CARD_LIMIT);
    if (newest.length) {
        html += '<div class="ps-section animate__animated animate__fadeInUp" style="animation-duration:.35s;">' +
            '<div class="ps-section-header"><span class="ps-section-title"><i class="fas fa-star" style="color:#f57c00;margin-right:5px;"></i>New &amp; Updated</span></div>' +
            '<div class="ps-scroll-row">';
        newest.forEach(function(a) { html += card(a); });
        html += seeMoreCard('toplist') + '</div></div>';
    }

    var topDl = sortByDl(allApps).slice(0, LIST_LIMIT);
    if (topDl.some(function(a) { return (a.downloads||0) > 0; })) {
        html += '<div class="ps-section animate__animated animate__fadeInUp" style="animation-duration:.35s;animation-delay:.05s;">' +
            '<div class="ps-section-header"><span class="ps-section-title"><i class="fas fa-fire" style="color:#e53935;margin-right:5px;"></i>Top Downloads</span>' +
            '<div style="display:flex;gap:8px;align-items:center;">' +
            '<a href="news.html" style="background:#ff6b35;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:12px;text-decoration:none;"><i class="fas fa-newspaper" style="margin-right:3px;"></i>News</a>' +
            '<a href="toplist.html" class="ps-see-more">See more</a></div></div>';
        topDl.forEach(function(a, i) { html += listItem(a, i); });
        html += '</div>';
    }

    CATS.forEach(function(cat, ci) {
        var catApps = sortByDl(allApps.filter(function(a) { return a.category === cat; })).slice(0, CARD_LIMIT);
        if (!catApps.length) return;
        var label = cat.charAt(0).toUpperCase() + cat.slice(1);
        var delay = (ci * 0.04).toFixed(2);
        html += '<div class="ps-section animate__animated animate__fadeInUp" style="animation-duration:.35s;animation-delay:' + delay + 's;">' +
            '<div class="ps-section-header">' +
            '<span class="ps-section-title">' + (ICONS[cat]||'') + ' ' + label + '</span>' +
            '<a href="categories.html?cat=' + cat + '" class="ps-see-more">See more</a>' +
            '</div><div class="ps-scroll-row">';
        catApps.forEach(function(a) { html += card(a); });
        html += seeMoreCard(cat) + '</div></div>';
    });

    main.innerHTML = html;
}

function fsDocsToArray(snap) {
    return snap.docs.map(function(d) { return processAppName(Object.assign({ id: d.id }, d.data())); });
}

function loadAllData() {
    var main = document.getElementById('mainContent');
    var cached = cacheGet('apps');
    var cachedBanners = cacheGet('banners');

    if (cachedBanners) {
        allBanners = Object.values(cachedBanners);
        renderBanners();
    }
    if (cached) {
        allApps = Object.keys(cached).map(function(k) {
            return processAppName(Object.assign({ id: k }, cached[k]));
        });
        buildSections();
    } else {
        if (main) main.innerHTML = skeleton(6) + skeleton(3);
    }

    Promise.all([
        db.collection('apps').get(),
        db.collection('banners').get()
    ]).then(function(results) {
        var appsSnap    = results[0];
        var bannersSnap = results[1];

        var freshApps = fsDocsToArray(appsSnap);
        var cacheObj  = {};
        freshApps.forEach(function(a) { cacheObj[a.id] = a; });
        cacheSet('apps', cacheObj);

        if (freshApps.length !== allApps.length) {
            allApps = freshApps;
            buildSections();
        }

        if (bannersSnap.docs.length) {
            var freshBanners = bannersSnap.docs.map(function(d) { return Object.assign({ id: d.id }, d.data()); });
            var bCache = {};
            freshBanners.forEach(function(b) { bCache[b.id] = b; });
            cacheSet('banners', bCache);
            if (freshBanners.length !== allBanners.length) {
                allBanners = freshBanners;
                renderBanners();
            }
        }
    }).catch(function(e) { console.error('Firestore load error:', e); });
}

(function initPTR() {
    var startY = 0, pulling = false, triggered = false;
    var indicator = document.createElement('div');
    indicator.id = 'ptrIndicator';
    indicator.style.cssText = 'position:fixed;top:0;left:50%;transform:translateX(-50%);background:#1a73e8;color:white;padding:6px 18px;border-radius:0 0 20px 20px;font-size:12px;font-weight:700;z-index:200;display:none;';
    indicator.innerHTML = '<i class="fas fa-arrow-down" style="margin-right:4px;"></i>Pull to refresh';
    document.body.appendChild(indicator);

    document.addEventListener('touchstart', function(e) {
        if (window.scrollY === 0) { startY = e.touches[0].clientY; pulling = true; triggered = false; }
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        if (!pulling) return;
        var dy = e.touches[0].clientY - startY;
        if (dy > 20) {
            indicator.style.display = 'block';
            indicator.innerHTML = dy > 60
                ? '<i class="fas fa-arrow-up" style="margin-right:4px;"></i>Release to refresh'
                : '<i class="fas fa-arrow-down" style="margin-right:4px;"></i>Pull to refresh';
        }
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        if (!pulling) return;
        pulling = false;
        if (e.changedTouches[0].clientY - startY > 60 && !triggered) {
            triggered = true;
            indicator.innerHTML = '<i class="fas fa-sync-alt fa-spin" style="margin-right:4px;"></i>Refreshing...';
            cacheClear('apps'); cacheClear('banners');
            loadAllData();
            setTimeout(function() { indicator.style.display = 'none'; }, 2000);
        } else {
            indicator.style.display = 'none';
        }
    }, { passive: true });
})();

(function() {
    var btn = document.createElement('button');
    btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    btn.style.cssText = 'position:fixed;bottom:140px;right:16px;width:40px;height:40px;border-radius:50%;background:#1a73e8;color:white;border:none;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.2);display:none;z-index:150;align-items:center;justify-content:center;font-size:16px;';
    btn.onclick = function() { window.scrollTo({ top: 0, behavior: 'smooth' }); };
    document.body.appendChild(btn);
    window.addEventListener('scroll', function() {
        btn.style.display = window.scrollY > window.innerHeight ? 'flex' : 'none';
    }, { passive: true });
})();

(function init() {
    loadAllData();

    window.addEventListener('pagehide', function() {
        if (_swiper) { try { _swiper.autoplay.stop(); } catch(e) {} }
    });
    window.addEventListener('pageshow', function(e) {
        if (e.persisted) {
            if (_swiper) { try { _swiper.autoplay.start(); } catch(e) {} }
        }
    });
})();

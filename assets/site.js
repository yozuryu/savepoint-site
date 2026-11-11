// Savepoint site: scroll reveals, the pointer light on cards, copy buttons, the hero feed and the live demo.
(function () {
    const root = document.documentElement;
    root.classList.add('js');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Nav gets a line once the page scrolls
    const nav = document.querySelector('.nav');
    const onScroll = () => nav && nav.classList.toggle('scrolled', scrollY > 8);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Reveal: each block fades up the first time it enters the screen
    const reveals = document.querySelectorAll('.reveal');
    if (reduced || !('IntersectionObserver' in window)) reveals.forEach(el => el.classList.add('in'));
    else {
        const io = new IntersectionObserver(entries => entries.forEach(e => {
            if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        }), { rootMargin: '0px 0px -8% 0px' });
        reveals.forEach(el => io.observe(el));
    }

    // Cards: a soft light follows the pointer
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - r.left}px`);
            card.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
    });

    // Copy buttons: every .codebox gets one; copies its <pre> text
    window.addCopyButtons = (scope = document) => scope.querySelectorAll('.codebox').forEach(box => {
        if (box.querySelector('.copy')) return;
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'copy'; b.textContent = 'Copy';
        b.addEventListener('click', async () => {
            const text = box.querySelector('pre').innerText.trim();
            try { await navigator.clipboard.writeText(text); }
            catch { const t = document.createElement('textarea'); t.value = text; document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
            b.textContent = 'Copied'; b.classList.add('done');
            setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('done'); }, 1600);
        });
        box.append(b);
    });
    addCopyButtons();

    // ── Hero feed: the hub taking an hourly update. Plays the newest real unlocks from the live hub
    // (two per game at most, so it shows a mix), one arriving every few seconds while the hero is on screen ──
    const feed = document.getElementById("feed");
    if (feed) {
        const list = document.getElementById("feed-list"), status = document.getElementById("feed-st");
        const DATA = "https://yozuryu.github.io/gaming-hub/data/";
        const FALLBACK = [{"p":"ra","n":"Corrupted Companion Freed","g":"Final Fantasy Crystal Chronicles: Ring of Fates","i":"https://media.retroachievements.org/Badge/614934.png","v":5},{"p":"ra","n":"Who Keeps Precious Objects in Barrels?","g":"Final Fantasy Crystal Chronicles: Ring of Fates","i":"https://media.retroachievements.org/Badge/614954.png","v":5},{"p":"steam","n":"The Artist Within","g":"SpongeBob SquarePants™: The Patrick Star Game","i":"https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/2322380/b245962141c9669bb20a21ba27555345f47a561b.jpg","v":38.9},{"p":"steam","n":"Sunday, Sunday, Sunday","g":"SpongeBob SquarePants™: The Patrick Star Game","i":"https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/2322380/a639220b40c5915d50085b5aa33e491a15b37333.jpg","v":26.9},{"p":"steam","n":"Partners?","g":"Eiyuden Chronicle: Rising","i":"https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/1658290/f11f05dd5563baa760d0451753feeb410a70dd9d.jpg","v":60.8},{"p":"steam","n":"The Road to Recovery","g":"Eiyuden Chronicle: Rising","i":"https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/1658290/698113d14201052b0919e671e6e7a7b5f48cb717.jpg","v":61.3},{"p":"steam","n":"To the Depths!","g":"Little Noah: Scion of Paradise","i":"https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/1883260/27ac78d5cf95a012efaabcdc8db00df3fe35900c.jpg","v":56.6},{"p":"steam","n":"Master Locksmith","g":"Little Noah: Scion of Paradise","i":"https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/1883260/b8c5fe5786916dcfeb6b9b23a831665764a7700d.jpg","v":50.1},{"p":"steam","n":"Cryptographer","g":"FEZ","i":"https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/224760/6fe291fa8d05d79cc83528c0d20917059960a2b6.jpg","v":25.7}];
        const pick = all => {
            const per = {}, out = [];
            for (const x of all.sort((a, b) => (a.t < b.t ? 1 : -1))) {
                if ((per[x.g] = (per[x.g] || 0) + 1) > 2) continue;
                out.push(x);
                if (out.length === 9) break;
            }
            return out;
        };
        const fetchLive = async () => {
            const [ra, st] = await Promise.all(["ra", "steam"].map(p => fetch(DATA + p + "/achievements/1.json").then(r => r.json())));
            return pick([
                ...ra.recentAchievements.map(a => ({ p: "ra", t: a.date.replace(" ", "T") + "Z", n: a.title, g: a.gameTitle, i: "https://media.retroachievements.org" + a.badgeUrl, v: a.points })),
                ...st.recentAchievements.map(a => ({ p: "steam", t: a.unlockedAt, n: a.displayName, g: a.gameName, i: a.iconUrl, v: a.globalPct })),
            ]);
        };
        const row = x => {
            const li = document.createElement("li");
            const icon = document.createElement("img");
            icon.src = x.i; icon.alt = ""; icon.loading = "lazy";
            if (x.p === "steam") icon.className = "st-icon";
            const txt = document.createElement("div");
            const b = document.createElement("b"); b.textContent = x.n;
            const s = document.createElement("span"); s.textContent = x.g;
            txt.append(b, s);
            const em = document.createElement("em");
            const pi = document.createElement("img"); pi.alt = ""; pi.src = "assets/icon-" + x.p + ".png";
            em.append(pi, x.p === "ra" ? "+" + x.v : x.v + "%");
            if (x.p === "ra") em.className = "pts";
            li.append(icon, txt, em);
            return li;
        };
        const SHOWN = 3;
        let items = FALLBACK, next = 0, timer = 0, onScreen = false;
        const start = () => {
            // Oldest of the newest go in first, so the real newest unlock is the last to arrive
            items = items.slice().reverse();
            // Reduced motion: no arrivals, just the real newest three
            list.replaceChildren(...(reduced ? items.slice(-SHOWN) : items.slice(0, SHOWN)).reverse().map(row));
            next = SHOWN % items.length;
        };
        const tick = () => {
            feed.classList.add("busy"); status.textContent = "Syncing…";
            timer = setTimeout(() => {
                const li = row(items[next]); li.classList.add("new");
                list.prepend(li);
                const old = list.children[SHOWN];
                if (old) { old.classList.add("out"); setTimeout(() => old.remove(), 500); }
                next = (next + 1) % items.length;
                feed.classList.remove("busy"); status.textContent = "Synced · just now";
                timer = setTimeout(tick, 3600);
            }, 1300);
        };
        const run = () => { clearTimeout(timer); if (onScreen && !document.hidden && !reduced) timer = setTimeout(tick, 1600); };
        start();
        fetchLive().then(live => { if (live.length >= SHOWN) { items = live; start(); } }).catch(() => {});
        new IntersectionObserver(e => { onScreen = e[0].isIntersecting; run(); }).observe(feed);
        document.addEventListener("visibilitychange", run);
    }

    // ── Live demo: the author's real hub in a phone or a scaled desktop window ──
    const stage = document.getElementById('demo-stage');
    if (!stage) return;
    const LIVE = 'https://yozuryu.github.io/gaming-hub/';
    const DESK_W = 1360, DESK_H = 860;
    const phone = document.getElementById('demo-phone'), desk = document.getElementById('demo-desk');
    const framePhone = document.getElementById('demo-frame-phone'), frameDesk = document.getElementById('demo-frame-desk');
    const deskScreen = document.getElementById('demo-desk-screen');
    const urlLabel = document.getElementById('demo-url'), openLink = document.getElementById('demo-open');
    let page = '', device = 'phone', started = false;

    const fit = () => {
        const s = deskScreen.clientWidth / DESK_W;
        frameDesk.style.transform = `scale(${s})`;
        deskScreen.style.height = `${Math.round(DESK_H * s)}px`;
    };
    const load = () => {
        const frame = device === 'phone' ? framePhone : frameDesk;
        const url = LIVE + page;
        const loading = frame.parentElement.querySelector('.loading');
        loading.classList.remove('gone');
        frame.onload = () => loading.classList.add('gone');
        frame.src = url;
        urlLabel.textContent = url.replace(/^https:\/\//, '').replace(/\/$/, '');
        openLink.href = url;
    };
    const show = () => {
        phone.hidden = device !== 'phone';
        desk.hidden = device !== 'desktop';
        if (device === 'desktop') fit();
        if (started) load();
    };
    document.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => {
        document.querySelectorAll('[data-page]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        page = b.dataset.page;
        load();
    }));
    document.querySelectorAll('[data-device]').forEach(b => b.addEventListener('click', () => {
        document.querySelectorAll('[data-device]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        device = b.dataset.device;
        show();
    }));
    addEventListener('resize', () => device === 'desktop' && fit());
    // The hub loads only when the demo comes near the screen
    new IntersectionObserver((entries, io) => {
        if (entries.some(e => e.isIntersecting)) { started = true; load(); io.disconnect(); }
    }, { rootMargin: '400px 0px' }).observe(stage);
})();

// Savepoint site: scroll reveals, the pointer light on cards, copy buttons, and the live demo.
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

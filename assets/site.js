// Savepoint site: scroll reveals, the pointer light on cards, copy buttons, the hero feed, the heatmap, the scroll-linked steps and the live demo.
(function () {
    const root = document.documentElement;
    root.classList.add('js');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Recurring loops of the feature tabs ({ el, every, start?, step }), run by the tabs block below:
    // only the open tab's, only while on screen and the page is visible, never with reduced motion
    const loops = {};
    // Restart a CSS animation on an element (fade-in of swapped content)
    const swapIn = el => { el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); };

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

    // Pill switches: one highlight slides to the pressed option
    document.querySelectorAll(".tabs, .seg").forEach(group => {
        const ind = document.createElement("span");
        ind.className = "tab-ind";
        group.prepend(ind);
        group.classList.add("has-ind");
        const move = instant => {
            const b = group.querySelector('[aria-pressed="true"]');
            if (!b || !b.offsetWidth) return;
            if (instant) ind.style.transition = "none";
            ind.style.width = b.offsetWidth + "px";
            ind.style.height = b.offsetHeight + "px";
            ind.style.transform = "translate(" + b.offsetLeft + "px," + b.offsetTop + "px)";
            if (instant) { void ind.offsetWidth; ind.style.transition = ""; }
        };
        new MutationObserver(() => move(false)).observe(group, { subtree: true, attributes: true, attributeFilter: ["aria-pressed"] });
        // A size change (layout switch, fonts loading, a hidden tab row appearing) moves it without sliding
        new ResizeObserver(() => move(true)).observe(group);
        move(true);
    });

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

    // The live hub's newest unlocks (91 days per platform), shared by the hero feed and the heatmap
    const DATA = "https://yozuryu.github.io/my-savepoint/data/";
    const chunks = (document.getElementById("feed") || document.getElementById("heat"))
        ? Promise.all(["ra", "steam"].map(p => fetch(DATA + p + "/achievements/1.json").then(r => { if (!r.ok) throw r.status; return r.json(); })))
            .then(([ra, st]) => [
                ...ra.recentAchievements.map(a => ({ p: "ra", t: a.date.replace(" ", "T") + "Z", n: a.title, g: a.gameTitle, i: "https://media.retroachievements.org" + a.badgeUrl, v: a.points })),
                ...st.recentAchievements.map(a => ({ p: "steam", t: a.unlockedAt, n: a.displayName, g: a.gameName, i: a.iconUrl, v: a.globalPct })),
            ])
        : null;

    // ── Hero feed: the hub taking an hourly update. Plays the newest real unlocks from the live hub
    // (two per game at most, so it shows a mix), one arriving every few seconds while the hero is on screen ──
    const feed = document.getElementById("feed");
    if (feed) {
        const list = document.getElementById("feed-list"), status = document.getElementById("feed-st");
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
        chunks.then(all => { const live = pick(all); if (live.length >= SHOWN) { items = live; start(); } }).catch(() => {});
        new IntersectionObserver(e => { onScreen = e[0].isIntersecting; run(); }).observe(feed);
        document.addEventListener("visibilitychange", run);
    }

    // ── Hourly box: the last 13 weeks of real unlocks as a heatmap, filling in once when it comes into view ──
    const heat = document.getElementById("heat");
    if (heat) {
        // Counts per day for the 91 days to 2026-11-12, used if the live data can't be read
        const FALLBACK = [0,0,0,0,0,0,3,0,0,0,0,2,0,0,0,5,2,1,0,6,0,0,2,0,5,0,0,0,0,6,2,1,0,0,1,1,3,19,0,2,1,0,0,2,4,0,4,0,0,1,3,5,0,0,0,3,1,34,2,0,0,4,3,14,2,5,1,0,0,0,0,0,0,0,1,0,7,0,4,2,0,0,0,0,3,4,9,0,0,0,0];
        const key = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
        const level = n => (n === 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : n <= 9 ? 3 : 4);
        const draw = counts => {
            heat.replaceChildren(...counts.map((n, i) => {
                const c = document.createElement("i");
                c.dataset.l = level(n);
                c.style.setProperty("--c", Math.floor(i / 7));
                c.style.setProperty("--r", i % 7);
                c.title = n + (n === 1 ? " unlock" : " unlocks");
                return c;
            }));
            const total = counts.reduce((a, b) => a + b, 0), days = counts.filter(Boolean).length;
            document.getElementById("heat-n").innerHTML = "<b>" + total.toLocaleString("en") + "</b> unlocks · <b>" + days + "</b> active days";
        };
        draw(FALLBACK);
        chunks.then(all => {
            // Days in the viewer's own timezone, today last
            const per = {};
            for (const x of all) { const k = key(new Date(x.t)); per[k] = (per[k] || 0) + 1; }
            const today = new Date(), counts = [];
            for (let i = 90; i >= 0; i--) counts.push(per[key(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i))] || 0);
            draw(counts);
        }).catch(() => {});
        if (reduced || !("IntersectionObserver" in window)) heat.classList.add("on");
        else new IntersectionObserver((e, io) => { if (e[0].isIntersecting) { heat.classList.add("on"); io.disconnect(); } }, { rootMargin: "0px 0px -15% 0px" }).observe(heat);
    }

    // ── Analytics: the best of the hub's Analytics page for the last 3 months, read live. Same rules as
    // that page (idle games and achievement farms left out, days and hours in the viewer's timezone):
    // the daily rhythm clock, the top game, the rarest unlock and one game story (a comeback, else a binge) ──
    const ana = document.getElementById("ana");
    if (ana) {
        const HUB = "https://yozuryu.github.io/my-savepoint/";
        const RA_MEDIA = "https://media.retroachievements.org";
        const DAY = 864e5, WINDOW = 90;
        const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const RARITY = [[5, "Ultra rare", "#e5b143"], [10, "Very rare", "#c8901a"], [25, "Rare", "#66c0f4"], [50, "Uncommon", "#8f98a0"], [Infinity, "Common", "#546270"]];
        const HEAT = ["#101214", "#0d2a3d", "#1a5275", "#2a7bba", "#66c0f4"];
        const json = u => fetch(HUB + u).then(r => (r.ok ? r.json() : null)).catch(() => null);
        const hh = h => String(((h % 24) + 24) % 24).padStart(2, "0");
        const localKey = ms => { const d = new Date(ms); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
        const xboxImg = (url, w) => (!url ? url : url.includes("store-images.s-microsoft.com") ? url + (url.includes("?") ? "&" : "?") + "w=" + w : url.includes("images-eds") ? url + "&w=" + w : url);
        const raTitle = t => (t || "").replace(/~[^~]+~\s*/g, "").replace(/\s*\[Subset[^\]]*\]/i, "");

        const compute = async () => {
            const now = new Date();
            const day0 = (n) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - n).getTime();
            const startMs = day0(WINDOW - 1), prevMs = day0(2 * WINDOW - 1), endMs = day0(-1);
            const inWin = ms => ms >= startMs && ms < endMs, inPrev = ms => ms >= prevMs && ms < startMs;

            // Play sessions (RA + Steam) for the window and the one before
            const years = [];
            for (let y = new Date(prevMs).getFullYear(); y <= now.getFullYear(); y++) years.push(y);
            const play = await Promise.all(["ra", "steam"].flatMap(p => years.map(y => json("data/" + p + "/playtime/" + y + ".json").then(f => ({ p, f })))));
            if (!play.some(x => x.f)) throw new Error("no playtime");
            const names = { ra: {}, steam: {}, xbox: {} };
            for (const { p, f } of play) for (const [id, g] of Object.entries((f && f.games) || {})) names[p][id] = g;
            const sessions = play.flatMap(({ p, f }) => ((f && f.sessions) || []).map(s => ({ p, g: String(s.gameId), minutes: s.minutes, startMs: Date.parse(s.start), endMs: Date.parse(s.end) })));
            // Every unlock, all time (comebacks need the whole history; rarity is in it)
            const unlocks = (await Promise.all(["ra", "steam", "xbox"].map(async p => {
                const idx = await json("data/" + p + "/history/index.json");
                const files = await Promise.all(Object.keys((idx && idx.years) || {}).map(y => json("data/" + p + "/history/" + y + ".json")));
                return files.flatMap(f => ((f && f.unlocks) || []).map(u => ({ p, g: String(u.g), a: String(u.a), n: u.n, r: u.r, ms: Date.parse(u.t) })));
            }))).flat();

            // Farms (Steam, 10+ unlocks at over 15 an hour, plus the admin's marks) and idle games are left out
            const marks = (await json("data/hub/farm-games.json")) || {};
            const notFarm = new Set(marks.notFarms || []);
            const steamIds = [...new Set([...sessions, ...unlocks.map(u => ({ ...u, endMs: u.ms }))].filter(x => x.p === "steam" && x.endMs >= prevMs).map(x => x.g))];
            const farms = new Set([...(await Promise.all(steamIds.map(async id => {
                if (notFarm.has("steam:" + id)) return null;
                const g = await json("data/steam/games/" + id + ".json");
                return g && g.unlocked >= 10 && g.unlocked / Math.max((g.playtimeForever || 0) / 60, 0.1) > 15 ? "steam:" + id : null;
            }))).filter(Boolean), ...(marks.farms || [])]);
            const idle = new Set(((await json("data/hub/idle-games.json")) || {}).games || []);
            const keep = x => !farms.has(x.p + ":" + x.g) && !idle.has(x.p + ":" + x.g);
            const S = sessions.filter(keep), U = unlocks.filter(keep);

            const spread = (s, next) => {
                const span = s.endMs - s.startMs;
                if (!(span > 0)) return [{ t: s.endMs, minutes: s.minutes }];
                const out = [];
                for (let t = s.startMs; t < s.endMs;) { const n = Math.min(next(new Date(t)), s.endMs); out.push({ t, minutes: s.minutes * ((n - t) / span) }); t = n; }
                return out;
            };
            const nextDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
            const nextHour = d => new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1).getTime();

            // Recap and per game, by local day
            let minutes = 0, prevMinutes = 0;
            const days = new Set(), prevDays = new Set(), perGame = {}, playDays = {};
            for (const s of S) for (const d of spread(s, nextDay)) {
                const k = s.p + ":" + s.g;
                if (inPrev(d.t)) { prevMinutes += d.minutes; if (d.minutes >= 1) prevDays.add(localKey(d.t)); }
                if (!inWin(d.t)) continue;
                minutes += d.minutes;
                perGame[k] = (perGame[k] || 0) + d.minutes;
                if (d.minutes >= 1) { days.add(localKey(d.t)); (playDays[k] = playDays[k] || new Set()).add(localKey(d.t)); }
            }
            const winU = U.filter(u => inWin(u.ms)), prevU = U.filter(u => inPrev(u.ms));
            winU.forEach(u => days.add(localKey(u.ms)));
            prevU.forEach(u => prevDays.add(localKey(u.ms)));

            // Rhythm: sessions that ended in the window, spread over weekday × hour (Monday first)
            const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
            const winS = S.filter(s => inWin(s.endMs));
            for (const s of winS) for (const x of spread(s, nextHour)) { const d = new Date(x.t); grid[(d.getDay() + 6) % 7][d.getHours()] += x.minutes; }
            const flat = grid.flat(), total = flat.reduce((a, v) => a + v, 0) || 1;
            const byHour = Array.from({ length: 24 }, (_, h) => grid.reduce((a, r) => a + r[h], 0));
            let peakAt = 0;
            for (let i = 1; i < 168; i++) if (flat[i] + flat[(i + 1) % 168] > flat[peakAt] + flat[(peakAt + 1) % 168]) peakAt = i;
            const dayMinutes = grid.map(r => r.reduce((a, v) => a + v, 0));
            const fav = dayMinutes.indexOf(Math.max(...dayMinutes));
            // Typical start: median start time on a clock that starts at 05:00, so after-midnight play counts as late
            const starts = winS.map(s => { const d = new Date(s.startMs); return (d.getHours() * 60 + d.getMinutes() - 300 + 1440) % 1440; }).sort((a, b) => a - b);
            const med = starts.length ? (starts.length % 2 ? starts[(starts.length - 1) / 2] : (starts[starts.length / 2 - 1] + starts[starts.length / 2]) / 2) : null;

            // Game details (name, icon, art, achievements) from its own file
            const gameFile = (p, id) => json("data/" + p + "/games/" + id + ".json");
            const artPicks = (await json("data/ra/art.json")) || {};
            const info = async (p, id) => {
                const f = await gameFile(p, id), pt = names[p][id] || {};
                if (p === "ra") {
                    const pick = (artPicks.games || {})[id] || {};
                    const icon = f && f.imageIcon ? RA_MEDIA + f.imageIcon : pt.icon ? RA_MEDIA + pt.icon : "";
                    return { f, name: raTitle((f && f.title) || pt.name), icon, px: true, art: (pick.hero && pick.hero.url) || (f && f.imageIngame ? RA_MEDIA + f.imageIngame : "") };
                }
                if (p === "steam") return { f, name: (f && f.gameName) || pt.name, icon: (f && f.iconUrl) || pt.icon || "", art: "https://cdn.akamai.steamstatic.com/steam/apps/" + id + "/library_hero.jpg", art2: (f && f.headerUrl) || "https://cdn.akamai.steamstatic.com/steam/apps/" + id + "/header.jpg" };
                return { f, name: f && f.gameName, icon: xboxImg(f && f.iconUrl, 128), art: xboxImg(f && f.heroUrl, 1080) };
            };

            const topE = Object.entries(perGame).reduce((m, e) => (!m || e[1] > m[1] ? e : m), null);
            let top = null;
            if (topE) {
                const [p, id] = topE[0].split(":"), g = await info(p, id);
                top = { p, name: g.name, icon: g.icon, px: g.px, art: g.art, art2: g.art2, minutes: Math.round(topE[1]), share: Math.round((topE[1] / Math.max(minutes, 1)) * 100) };
            }

            // Rarest unlock of the window (RA rarity = share of its players)
            const rares = [];
            for (const rareU of winU.filter(u => u.r != null).sort((a, b) => a.r - b.r).slice(0, 3)) {
                const g = await info(rareU.p, rareU.g), ach = g.f && g.f.achievements;
                let icon = "";
                if (rareU.p === "ra") { const a = ach && (Array.isArray(ach) ? ach.find(x => String(x.id) === rareU.a) : ach[rareU.a]); if (a) icon = RA_MEDIA + "/Badge/" + a.badgeName + ".png"; }
                else {
                    const a = (ach || []).find(x => String(x.apiName) === rareU.a);
                    // Steam game files keep only the icon file name
                    if (a) icon = rareU.p === "xbox" ? xboxImg(a.iconUrl, 128) : /^https?:/.test(a.iconUrl) ? a.iconUrl : "https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/" + rareU.g + "/" + a.iconUrl;
                }
                rares.push({ p: rareU.p, name: rareU.n, game: g.name, icon: icon || g.icon, px: rareU.p === "ra", r: rareU.r });
            }

            // Story: the biggest comeback (60+ days away, 30+ minutes or 3+ unlocks since), else the biggest binge;
            // never the top game, which already has its card
            const acts = {};
            for (const s of S) (acts[s.p + ":" + s.g] = acts[s.p + ":" + s.g] || []).push(s.startMs);
            for (const u of U) (acts[u.p + ":" + u.g] = acts[u.p + ":" + u.g] || []).push(u.ms);
            const comebacks = [];
            for (const [k, list] of Object.entries(acts)) {
                if (topE && k === topE[0]) continue;
                list.sort((a, b) => a - b);
                const i = list.findIndex((ms, n) => n > 0 && inWin(ms) && ms - list[n - 1] >= 60 * DAY);
                if (i < 0) continue;
                const back = list[i], [p, g] = k.split(":");
                const mins = S.filter(s => s.p === p && s.g === g && s.startMs >= back && inWin(s.endMs)).reduce((a, s) => a + s.minutes, 0);
                const unl = winU.filter(u => u.p === p && u.g === g && u.ms >= back).length;
                if (mins < 30 && unl < 3) continue;
                comebacks.push({ k, gap: Math.round((back - list[i - 1]) / DAY), minutes: Math.round(mins), unlocks: unl });
            }
            comebacks.sort((a, b) => b.minutes - a.minutes || b.unlocks - a.unlocks);
            // Up to three stories, each about a different game: the biggest comeback, the biggest binge, the most days played
            const stories = [], used = new Set(topE ? [topE[0]] : []);
            const c = comebacks.find(x => !used.has(x.k));
            if (c) {
                used.add(c.k);
                const [p, id] = c.k.split(":"), g = await info(p, id);
                stories.push({ kind: "comeback", p, name: g.name, icon: g.icon, px: g.px, gap: c.gap, minutes: c.minutes, unlocks: c.unlocks });
            }
            const b = Object.entries(playDays).filter(([k, d]) => !used.has(k) && d.size >= 2 && perGame[k] >= 120).map(([k, d]) => [k, perGame[k] / d.size, d.size]).sort((x, y) => y[1] - x[1])[0];
            if (b) {
                used.add(b[0]);
                const [p, id] = b[0].split(":"), g = await info(p, id);
                stories.push({ kind: "binge", p, name: g.name, icon: g.icon, px: g.px, perDay: Math.round(b[1]), days: b[2] });
            }
            const md = Object.entries(playDays).filter(([k, d]) => !used.has(k) && d.size >= 3).sort((x, y) => y[1].size - x[1].size || perGame[y[0]] - perGame[x[0]])[0];
            if (md) {
                const [p, id] = md[0].split(":"), g = await info(p, id);
                stories.push({ kind: "days", p, name: g.name, icon: g.icon, px: g.px, days: md[1].size, minutes: Math.round(perGame[md[0]]) });
            }

            return {
                recap: { minutes: Math.round(minutes), prevMinutes: Math.round(prevMinutes), unlocks: winU.length, prevUnlocks: prevU.length, days: days.size, prevDays: prevDays.size },
                byHour: byHour.map(Math.round), start: med == null ? null : Math.round(med + 300) % 1440,
                peak: flat[peakAt] + flat[(peakAt + 1) % 168] ? { day: Math.floor(peakAt / 24), hour: peakAt % 24, share: Math.round(((flat[peakAt] + flat[(peakAt + 1) % 168]) / total) * 100) } : null,
                fav: { day: fav, share: Math.round((dayMinutes[fav] / total) * 100) },
                weekend: Math.round(((dayMinutes[5] + dayMinutes[6]) / total) * 100),
                late: Math.round((byHour.slice(0, 5).reduce((a, v) => a + v, 0) / total) * 100),
                top, rares, stories,
            };
        };

        const fmtH = m => (m >= 60 ? Math.round(m / 60).toLocaleString("en") + "h" : m + "m");
        const fmtHm = m => { const h = Math.floor(m / 60), r = m % 60; return h ? (r ? h + "h " + r + "m" : h + "h") : r + "m"; };
        const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
        const delta = (cur, prev) => {
            if (!(prev > 0)) return "";
            const v = Math.round(((cur - prev) / prev) * 100);
            return '<i class="d ' + (v > 0 ? "up" : v < 0 ? "down" : "") + '">' + (v > 0 ? "▲ " : v < 0 ? "▼ " : "= ") + Math.abs(v) + "%</i>";
        };
        const img = (src, px, cls) => '<img alt="" loading="lazy" src="' + esc(src) + '"' + (px || cls ? ' class="' + [px ? "px" : "", cls || ""].join(" ").trim() + '"' : "") + ">";
        const away = d => (d >= 365 ? (d / 365).toFixed(1) + " years" : Math.round(d / 30) + " months");

        const clock = (byHour, start) => {
            const max = Math.max(...byHour) || 1;
            const shade = v => { if (!v) return HEAT[0]; const r = Math.sqrt(v / max); return r >= .75 ? HEAT[4] : r >= .5 ? HEAT[3] : r >= .25 ? HEAT[2] : HEAT[1]; };
            const C = 60, R1 = 38, R2 = 56;
            const pt = (r, h) => { const a = (h / 24) * 2 * Math.PI - Math.PI / 2; return (C + r * Math.cos(a)).toFixed(2) + "," + (C + r * Math.sin(a)).toFixed(2); };
            let s = byHour.map((v, h) => '<path style="--h:' + h + '" fill="' + shade(v) + '" d="M' + pt(R2, h + .05) + " A" + R2 + "," + R2 + " 0 0 1 " + pt(R2, h + .95) + " L" + pt(R1, h + .95) + " A" + R1 + "," + R1 + " 0 0 0 " + pt(R1, h + .05) + ' Z"><title>' + hh(h) + ":00–" + hh(h + 1) + ":00 · " + fmtHm(Math.round(v)) + "</title></path>").join("");
            s += [0, 6, 12, 18].map(h => { const [x, y] = pt(R1 - 7, h).split(","); return '<text x="' + x + '" y="' + y + '" font-size="6" fill="#546270" text-anchor="middle" dominant-baseline="middle">' + hh(h) + "</text>"; }).join("");
            if (start != null) {
                const t = start / 60, [x1, y1] = pt(R1 - 2, t).split(","), [x2, y2] = pt(R2 + 3, t).split(",");
                s += '<line class="tick" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#e5b143" stroke-width="1.6" stroke-linecap="round"/>';
                s += '<g class="mid"><text x="60" y="59" font-size="13" font-weight="600" fill="#fff" text-anchor="middle">' + hh(Math.floor(start / 60)) + ":" + String(start % 60).padStart(2, "0") + '</text><text x="60" y="70" font-size="6" fill="#8f98a0" text-anchor="middle">typical start</text></g>';
            }
            return s;
        };

        const draw = a => {
            const r = a.recap;
            document.getElementById("ana-recap").innerHTML =
                "<span><b>" + fmtH(r.minutes) + "</b>played " + delta(r.minutes, r.prevMinutes) + "</span>" +
                "<span><b>" + r.unlocks.toLocaleString("en") + "</b>unlocks " + delta(r.unlocks, r.prevUnlocks) + "</span>" +
                "<span><b>" + r.days + "</b>active days " + delta(r.days, r.prevDays) + "</span>" +
                '<span class="key"><span><i class="d up">▲</i><i class="d down">▼</i></span>vs the 3 months before</span>';
            document.getElementById("ana-clock").innerHTML = clock(a.byHour, a.start);
            const facts = [];
            if (a.peak) facts.push(["Peak time", WEEKDAYS[a.peak.day].slice(0, 3) + " " + hh(a.peak.hour) + "–" + hh(a.peak.hour + 2), a.peak.share + "%"]);
            facts.push(["Favourite day", WEEKDAYS[a.fav.day], a.fav.share + "%"]);
            facts.push(["Weekends", a.weekend + "%", "of play"]);
            if (a.late >= 5) facts.push(["After midnight", a.late + "%", "00–05"]);
            document.getElementById("ana-facts").innerHTML = facts.map(([k, v, s]) => "<div><dt>" + k + "</dt><dd>" + esc(v) + "<span>" + esc(s) + "</span></dd></div>").join("");

            const top = document.getElementById("ana-top");
            if (a.top) {
                top.innerHTML = (a.top.art ? img(a.top.art, false, "art") : "") +
                    '<span class="tagline">Top game</span><div class="who">' + img(a.top.icon, a.top.px) + "<div><b>" + esc(a.top.name) + "</b><span><b>" + fmtHm(a.top.minutes) + "</b> · " + a.top.share + "% of all play</span></div></div>" +
                    '<div class="share"><i style="width:' + Math.max(a.top.share, 2) + '%"></i></div>';
                // Art that doesn't load: the Steam banner, then the shared library mosaic
                const art = top.querySelector(".art");
                if (art) art.onerror = () => { if (a.top.art2 && art.src !== a.top.art2) art.src = a.top.art2; else { art.onerror = null; art.src = "assets/art-fallback.webp"; art.classList.add("mosaic"); } };
            }
            rares = a.rares || (a.rare ? [a.rare] : []);
            stories = a.stories || (a.story ? [a.story] : []);
            ri = si = 0;
            drawRare(); drawStory();
        };
        let rares = [], stories = [], ri = 0, si = 0, turn = 0;
        const rareEl = document.getElementById("ana-rare"), storyEl = document.getElementById("ana-story");
        const drawRare = () => {
            const r = rares[ri];
            if (!r) { rareEl.innerHTML = ""; return; }
            const t = RARITY.find(x => r.r < x[0]);
            rareEl.innerHTML = '<span class="tagline">Rarest unlock' + (rares.length > 1 ? ' <i class="n">' + (ri + 1) + " of " + rares.length + "</i>" : "") + '</span><div class="row">' + img(r.icon, r.px).replace("<img", '<img style="border-color:' + t[2] + '"') +
                "<div><b>" + esc(r.name) + "</b><span>" + esc(r.game) + '</span></div></div><span class="big" style="color:' + t[2] + '">' + r.r + "%</span><span>of players have it · " + t[1] + "</span>";
        };
        const STORY = {
            comeback: s => ["Comeback", "Back after " + away(s.gap), [s.minutes ? fmtHm(s.minutes) + " played" : "", s.unlocks ? s.unlocks + " unlocks" : ""].filter(Boolean).join(" · ") + " since"],
            binge: s => ["Binged", fmtHm(s.perDay) + " a day", "over " + s.days + " days of play"],
            days: s => ["Most days", "Played on " + s.days + " days", fmtHm(s.minutes) + " in total"],
        };
        const drawStory = () => {
            const s = stories[si];
            if (!s) { storyEl.innerHTML = ""; return; }
            const [tag, head, sub] = STORY[s.kind](s);
            storyEl.innerHTML = '<span class="tagline">' + tag + '</span><div class="row">' + img(s.icon, s.px) + "<div><b>" + esc(s.name) + "</b></div></div>" +
                '<span class="big">' + head + "</span><span>" + esc(sub) + "</span>";
        };
        // Loop: the two cards take turns moving to their next item (the clock and numbers stay still)
        loops.analytics = { el: ana, every: 3200, step() {
            turn = 1 - turn;
            if (turn && rares.length > 1) { ri = (ri + 1) % rares.length; drawRare(); swapIn(rareEl); }
            if (!turn && stories.length > 1) { si = (si + 1) % stories.length; drawStory(); swapIn(storyEl); }
        } };
        // The author's numbers on 2026-11-12, used if the live data can't be read
        const FALLBACK = {"recap":{"minutes":5028,"prevMinutes":2354,"unlocks":119,"prevUnlocks":187,"days":51,"prevDays":52},"byHour":[6,0,0,0,0,0,10,14,48,23,125,233,236,91,175,489,430,531,312,345,642,592,551,175],"start":1106,"peak":{"day":4,"hour":19,"share":9},"fav":{"day":5,"share":34},"weekend":64,"late":0,"top":{"p":"steam","name":"LEGO® City Undercover","icon":"https://media.steampowered.com/steamcommunity/public/images/apps/578330/48536e84b21951f851ec4ecf8349370a867e2c37.jpg","art":"https://cdn.akamai.steamstatic.com/steam/apps/578330/library_hero.jpg","art2":"https://cdn.akamai.steamstatic.com/steam/apps/578330/header.jpg","minutes":1908,"share":38},"rare":{"p":"steam","name":"Training","game":"OCTOPATH TRAVELER","icon":"https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/921570/dd8064abe5bdc0f20da8052248be32ade82b391d.jpg","px":false,"r":5.9},"story":{"kind":"comeback","p":"ra","name":"Tomba! 2: The Evil Swine Return","icon":"https://media.retroachievements.org/Images/124477.png","px":true,"gap":123,"minutes":454,"unlocks":25}};
        draw(FALLBACK);
        // The live data (the unlock history is a few hundred KB) loads only when the section gets near the screen
        const load = () => compute().then(draw).catch(e => console.warn("analytics", e));
        if (reduced || !("IntersectionObserver" in window)) { ana.classList.add("on"); load(); }
        else {
            new IntersectionObserver((e, io) => { if (e[0].isIntersecting) { load(); io.disconnect(); } }, { rootMargin: "800px 0px" }).observe(ana);
            new IntersectionObserver((e, io) => { if (e[0].isIntersecting) { ana.classList.add("on"); io.disconnect(); } }, { rootMargin: "0px 0px -20% 0px" }).observe(ana);
        }
    }

    // ── Feature tabs: Overview (the grid) plus one live showcase per major feature. A tab can be linked
    // (#features/analytics; #analytics still works); opening one replays its small animation ──
    const ftabs = [...document.querySelectorAll("[data-ftab]")];
    if (ftabs.length) {
        const HUB = "https://yozuryu.github.io/my-savepoint/";
        const RA_MEDIA = "https://media.retroachievements.org";
        const get = u => fetch(HUB + u).then(r => (r.ok ? r.json() : null)).catch(() => null);
        const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
        const fmtHm = m => { const h = Math.floor(m / 60), r = Math.round(m % 60); return h ? (r ? h + "h " + r + "m" : h + "h") : r + "m"; };
        const raTitle = t => (t || "").replace(/~[^~]+~\s*/g, "").replace(/\s*\[Subset[^\]]*\]/i, "");
        const xboxImg = (url, w) => (!url ? url : url.includes("store-images.s-microsoft.com") ? url + (url.includes("?") ? "&" : "?") + "w=" + w : url.includes("images-eds") ? url + "&w=" + w : url);
        const steamHeader = (id, url) => url || "https://cdn.akamai.steamstatic.com/steam/apps/" + id + "/header.jpg";
        const monthDay = ms => new Date(ms).toLocaleDateString("en", { month: "short", day: "numeric" });

        // Animated parts (.play) get .on when they come into view, and again each time their tab opens
        const playIO = "IntersectionObserver" in window && !reduced
            ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !e.target.classList.contains("on")) { e.target.classList.add("on"); e.target.dispatchEvent(new Event("play")); } }), { rootMargin: "0px 0px -15% 0px" })
            : null;
        document.querySelectorAll(".play").forEach(el => (playIO ? playIO.observe(el) : el.classList.add("on")));
        const replay = panel => panel.querySelectorAll(".play").forEach(el => {
            el.classList.remove("on");
            void el.offsetWidth;
            if (!playIO) { el.classList.add("on"); return; }
            const r = el.getBoundingClientRect();
            if (r.top < innerHeight && r.bottom > 0) requestAnimationFrame(() => { el.classList.add("on"); el.dispatchEvent(new Event("play")); });
        });

        let activeTab = "overview";
        const onScreen = new Set();
        const runLoops = () => Object.entries(loops).forEach(([id, L]) => {
            const go = !reduced && id === activeTab && onScreen.has(L.el) && !document.hidden;
            if (go && !L.timer) {
                if (L.start) L.start();
                const tick = () => { L.step(); L.timer = setTimeout(tick, L.every); };
                L.timer = setTimeout(tick, L.every);
            } else if (!go && L.timer) { clearTimeout(L.timer); L.timer = 0; }
        });
        const loopIO = "IntersectionObserver" in window
            ? new IntersectionObserver(es => { es.forEach(e => (e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target))); runLoops(); }, { threshold: .3 })
            : null;
        document.addEventListener("visibilitychange", runLoops);

        const loaders = {}, loaded = new Set();
        const select = (id, scroll) => {
            if (!document.getElementById("ft-" + id)) id = "overview";
            activeTab = id;
            ftabs.forEach(b => { const on = b.dataset.ftab === id; b.setAttribute("aria-pressed", String(on)); b.setAttribute("aria-selected", String(on)); });
            // On a phone the row scrolls sideways: bring the picked tab to its middle
            const btn = ftabs.find(b => b.dataset.ftab === id), row = btn.parentElement;
            row.scrollTo({ left: btn.offsetLeft - (row.clientWidth - btn.offsetWidth) / 2, behavior: reduced ? "auto" : "smooth" });
            document.querySelectorAll(".fpanel").forEach(p => (p.hidden = p.id !== "ft-" + id));
            const panel = document.getElementById("ft-" + id);
            if (loaders[id] && !loaded.has(id)) { loaded.add(id); loaders[id](); }
            replay(panel);
            runLoops();
            if (scroll) document.getElementById("features").scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
        };
        const tabRow = ftabs[0].parentElement;
        ftabs.forEach(b => b.addEventListener("click", () => {
            // Pinned and scrolled into a panel: start the new one at its top, under the bar
            const row = tabRow.getBoundingClientRect(), pinned = row.top <= parseFloat(getComputedStyle(tabRow).top) + 6 && document.getElementById("features").getBoundingClientRect().top < 0;
            select(b.dataset.ftab);
            if (pinned) scrollTo({ top: document.getElementById("ft-" + b.dataset.ftab).getBoundingClientRect().top + scrollY - row.bottom - 16, behavior: "auto" });
            history.replaceState(null, "", b.dataset.ftab === "overview" ? "#features" : "#features/" + b.dataset.ftab);
        }));
        const fromHash = () => {
            const m = location.hash.match(/^#(?:features\/([a-z]+)|(analytics))$/);
            if (m) select(m[1] || m[2], true);
        };
        addEventListener("hashchange", fromHash);
        // "Open … in the live demo" switches the demo to that page on the way down
        document.querySelectorAll("[data-demo]").forEach(a => a.addEventListener("click", () => {
            const b = document.querySelector('[data-page="' + a.dataset.demo + '"]');
            if (b) b.click();
        }));

        // Activity: the five latest play sessions (RA + Steam, idle games left out)
        const actList = document.getElementById("act-list");
        // list is newest first; the loop replays the latest few arriving, oldest of them first
        const SHOWN = 4, actStatus = document.getElementById("act-st"), actCard = document.getElementById("act-card");
        let actOld = [], actNext = 0, actMax = 1;
        const when = ms => {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            {
                const d = new Date(ms), day0 = new Date(d); day0.setHours(0, 0, 0, 0);
                const n = Math.round((today - day0) / 864e5);
                const day = n === 0 ? "Today" : n === 1 ? "Yesterday" : n < 7 ? d.toLocaleDateString("en", { weekday: "long" }) : monthDay(ms);
                return day + " · " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
            }
        };
        const sessRow = (s, i) => '<li style="--i:' + i + '" data-p="' + s.p + '"><img alt="" src="' + esc(s.icon) + '"' + (s.p === "ra" ? ' class="px"' : "") + "><b>" + esc(s.name) + "</b><em>" + fmtHm(s.minutes) + '</em><span class="when">' + when(s.start) + '</span><span class="bar"><i style="width:' + Math.max(4, (s.minutes / actMax) * 100) + '%"></i></span></li>';
        const actArrivals = () => Math.min(4, actOld.length - SHOWN);
        // Shows the SHOWN sessions before the ones that will arrive (or the latest, when there's nothing to replay)
        const actReset = final => {
            const upto = final ? actOld.length : actOld.length - Math.max(0, actArrivals());
            actList.innerHTML = actOld.slice(Math.max(0, upto - SHOWN), upto).reverse().map(sessRow).join("");
            actNext = upto;
        };
        const drawSessions = list => {
            actOld = list.slice().reverse();
            actMax = Math.max(...list.map(s => s.minutes), 1);
            actReset(true);
        };
        loops.activity = { el: actCard, every: 4600, start: () => actReset(false), step() {
            if (actNext >= actOld.length) { actReset(false); swapIn(actList); return; }
            actCard.classList.add("busy"); actStatus.textContent = "Syncing…";
            setTimeout(() => {
                const t = document.createElement("template");
                t.innerHTML = sessRow(actOld[actNext++], 0);
                const li = t.content.firstChild; li.classList.add("new");
                actList.prepend(li);
                const old = actList.children[SHOWN];
                if (old) { old.classList.add("out"); setTimeout(() => old.remove(), 500); }
                actCard.classList.remove("busy"); actStatus.textContent = "Synced · just now";
            }, 1200);
        } };
        // The author's data on 2026-11-12, shown until the live data arrives (or if it can't be read)
        const ACT_FALLBACK = [{"p":"ra","name":"Final Fantasy Crystal Chronicles: Ring of Fates","icon":"https://media.retroachievements.org/Images/116299.png","minutes":13,"start":1794325727000},{"p":"ra","name":"7th Dragon","icon":"https://media.retroachievements.org/Images/113079.png","minutes":15,"start":1794309566000},{"p":"ra","name":"7th Dragon","icon":"https://media.retroachievements.org/Images/113079.png","minutes":21,"start":1794227215000},{"p":"ra","name":"Final Fantasy Crystal Chronicles: Ring of Fates","icon":"https://media.retroachievements.org/Images/116299.png","minutes":69,"start":1794149437000},{"p":"ra","name":"Final Fantasy Crystal Chronicles: Ring of Fates","icon":"https://media.retroachievements.org/Images/116299.png","minutes":35,"start":1794135481000}];
        drawSessions(ACT_FALLBACK);
        loaders.activity = async () => {
            const y = new Date().getFullYear();
            const [idleFile, ...files] = await Promise.all([get("data/hub/idle-games.json"), ...["ra", "steam"].flatMap(p => [y - 1, y].map(yr => get("data/" + p + "/playtime/" + yr + ".json").then(f => ({ p, f }))))]);
            const idle = new Set((idleFile && idleFile.games) || []);
            const list = files.flatMap(({ p, f }) => ((f && f.sessions) || []).map(s => {
                const g = (f.games || {})[s.gameId] || {};
                return { p, id: String(s.gameId), name: p === "ra" ? raTitle(g.name) : g.name, icon: g.icon ? (p === "ra" ? RA_MEDIA + g.icon : g.icon) : "", minutes: s.minutes, start: Date.parse(s.start), end: Date.parse(s.end) };
            })).filter(s => !idle.has(s.p + ":" + s.id)).sort((a, b) => b.end - a.end).slice(0, 10);
            if (list.length) { drawSessions(list); if (loops.activity.timer) actReset(false); replay(document.getElementById("ft-activity")); }
        };

        // Completions: the newest finished game lands as a card in its tier colour, the count goes up by one
        const cmpCard = document.getElementById("cmp-card");
        // items newest first; cmpOld is oldest first, cmpK the one shown as the big card
        let cmpTotal = 0, cmpOld = [], cmpK = 0;
        const beaten = x => (x.tier === "Beaten" ? " beaten" : "");
        const cmpStart = () => Math.max(0, cmpOld.length - 4);
        const renderCmp = (k, arriving) => {
            const first = cmpOld[k], rest = [cmpOld[k - 1], cmpOld[k - 2], cmpOld[k - 3]].filter(Boolean);
            // The count as it was then: the total minus the gold-tier games that came later
            const count = cmpTotal - cmpOld.slice(k + 1).filter(x => x.tier !== "Beaten").length;
            cmpCard.innerHTML = '<div class="feed-head">Completions<span class="st count"><b id="cmp-n"' + (arriving && first.tier !== "Beaten" ? ' class="bump"' : "") + ">" + count + "</b>completed</span></div>" +
                (first ? '<div class="cmp-new' + beaten(first) + (arriving ? " arrive" : "") + '"><img alt="" src="' + esc(first.art) + '"' + (first.px ? ' class="px"' : "") + '><div class="cap"><span class="tier' + beaten(first) + '">' + first.tier + "</span><b>" + esc(first.name) + "</b><span>" + monthDay(first.ms) + "</span></div></div>" : "") +
                '<ul class="cmp-rest">' + rest.map((x, i) => '<li class="' + beaten(x).trim() + (arriving && i === 0 ? " new" : "") + '"><img alt="" src="' + esc(x.icon) + '"' + (x.px ? ' class="px"' : "") + "><b>" + esc(x.name) + "</b><span>" + x.tier + " · " + monthDay(x.ms) + "</span></li>").join("") + "</ul>";
        };
        const drawCompletions = c => {
            cmpTotal = c.count; cmpOld = c.items.slice().reverse(); cmpK = cmpOld.length - 1;
            renderCmp(cmpK, false);
        };
        loops.completions = { el: cmpCard, every: 4200, start() { cmpK = cmpStart(); renderCmp(cmpK, false); }, step() {
            if (cmpK >= cmpOld.length - 1) { cmpK = cmpStart(); renderCmp(cmpK, false); swapIn(cmpCard); return; }
            renderCmp(++cmpK, true);
        } };
        // The author's data on 2026-11-12, shown until the live data arrives (or if it can't be read)
        const CMP_FALLBACK = {"count":19,"items":[{"tier":"Beaten","name":"Tomba! 2: The Evil Swine Return","ms":1790405454000,"icon":"https://media.retroachievements.org/Images/124477.png","art":"https://cdn2.steamgriddb.com/hero/75b0b63015303bd206170908b6f62b30.png","px":false},{"tier":"Mastered","name":"2048","ms":1779278586000,"icon":"https://media.retroachievements.org/Images/068075.png","art":"https://media.retroachievements.org/Images/065188.png","px":true},{"tier":"Beaten","name":"2048","ms":1779100406000,"icon":"https://media.retroachievements.org/Images/066649.png","art":"https://media.retroachievements.org/Images/153544.png","px":true},{"tier":"Beaten","name":"Inventory Full","ms":1778754151000,"icon":"https://media.retroachievements.org/Images/106550.png","art":"https://cdn2.steamgriddb.com/hero/6c41d7ee57f0d9067cc933cc8f6cdae6.png","px":false}]};
        drawCompletions(CMP_FALLBACK);
        loaders.completions = async () => {
            const [ra, st, xb, art] = await Promise.all([get("data/ra/profile.json"), get("data/steam/profile.json"), get("data/xbox/profile.json"), get("data/ra/art.json")]);
            if (!ra && !st) return;
            const picks = (art && art.games) || {};
            const best = {};
            for (const a of (ra && ra.pageAwards && ra.pageAwards.visibleUserAwards) || []) {
                if (a.awardType !== "Mastery/Completion" && a.awardType !== "Game Beaten") continue;
                const top = a.awardType === "Mastery/Completion", id = String(a.awardData);
                const x = { tier: top ? (a.awardDataExtra === 1 ? "Mastered" : "Completed") : "Beaten", rank: top ? 2 : 1, name: raTitle(a.title), ms: Date.parse(a.awardedAt), icon: RA_MEDIA + a.imageIcon,
                    art: (picks[id] && picks[id].hero && picks[id].hero.url) || RA_MEDIA + (a.imageIngame || a.imageIcon), px: !(picks[id] && picks[id].hero) };
                if (!best["ra:" + id] || best["ra:" + id].rank < x.rank) best["ra:" + id] = x;
            }
            for (const g of (st && st.perfectGames) || []) best["steam:" + g.appId] = { tier: "Perfect", rank: 2, name: g.gameName, ms: Date.parse(g.completedAt), icon: g.iconUrl, art: steamHeader(g.appId, g.headerUrl) };
            for (const g of (xb && xb.perfectGames) || []) best["xbox:" + g.titleId] = { tier: "Completed", rank: 2, name: g.gameName, ms: Date.parse(g.completedAt || g.lastUnlockedAt), icon: xboxImg(g.iconUrl, 128), art: xboxImg(g.heroUrl || g.posterUrl, 1080) };
            const all = Object.values(best).filter(x => x.ms).sort((a, b) => b.ms - a.ms);
            drawCompletions({ count: all.filter(x => x.rank === 2).length, items: all.slice(0, 7) });
            if (loops.completions.timer) loops.completions.start();
            replay(document.getElementById("ft-completions"));
        };

        // Series: the series with the most finished, beaten and started games (up to 24 games), one segment each
        const serCard = document.getElementById("ser-card");
        const drawSeries = s => {
            const col = { done: "var(--gold)", beaten: "#b8c4ce", started: "var(--blue)", none: "transparent" };
            const n = k => s.games.filter(g => g.st === k).length;
            serCard.innerHTML = '<div class="ser-art">' + (s.art ? '<img alt="" src="' + esc(s.art) + '">' : "") + "<b>" + esc(s.name) + "</b></div>" +
                '<div class="ser-body"><div class="segs">' + s.games.map((g, i) => '<i style="--i:' + i + ";--c:" + col[g.st] + ";--w:" + (g.st === "started" ? Math.max(15, g.pct) : g.st === "none" ? 0 : 100) + '%"></i>').join("") + "</div>" +
                '<div class="ser-icons">' + s.games.slice(0, 12).map(g => '<img alt="" title="' + esc(g.title) + '" src="' + esc(g.icon) + '"' + (g.p === "ra" ? ' class="px"' : "") + ' style="border-color:' + (g.st === "none" ? "var(--line)" : col[g.st]) + '">').join("") + "</div>" +
                '<div class="ser-stats">' + [["done", "finished"], ["beaten", "beaten"], ["started", "started"]].filter(([k]) => n(k)).map(([k, w]) => '<span><i style="background:' + col[k] + '"></i><b>' + n(k) + "</b> " + w + "</span>").join("") + "<span>of " + s.games.length + " games</span></div></div>";
        };
        // The author's data on 2026-11-12, shown until the live data arrives (or if it can't be read)
        const SER_FALLBACK = {"name":"Star Ocean","art":"https://cdn.akamai.steamstatic.com/steam/apps/2238900/library_hero.jpg","games":[{"title":"STAR OCEAN THE SECOND STORY R","icon":"https://cdn.akamai.steamstatic.com/steam/apps/2238900/header.jpg","p":"steam","pct":100,"st":"done"},{"title":"STAR OCEAN THE DIVINE FORCE","icon":"https://store-images.s-microsoft.com/image/apps.57948.13763536664538375.b3ded97b-cb88-4507-8ff5-7109a24aafd9.435b39cc-73de-42a5-b08f-2e08274c1aaf?w=128","p":"xbox","pct":41,"st":"beaten"},{"title":"STAR OCEAN™ - THE LAST HOPE™ - 4K & Full HD Remaster","icon":"https://cdn.akamai.steamstatic.com/steam/apps/609150/header.jpg","p":"steam","pct":30,"st":"beaten"},{"title":"Star Ocean: The Second Story","icon":"https://media.retroachievements.org/Images/094986.png","p":"ra","pct":7,"st":"started"},{"title":"Star Ocean: Till the End of Time","icon":"https://media.retroachievements.org/Images/074616.png","p":"ra","pct":3,"st":"started"},{"title":"Star Ocean","icon":"https://media.retroachievements.org/Images/064813.png","p":"ra","pct":1,"st":"started"},{"title":"Star Ocean: Second Evolution","icon":"https://media.retroachievements.org/Images/080070.png","p":"ra","pct":1,"st":"started"},{"title":"Star Ocean: Blue Sphere","icon":"https://media.retroachievements.org/Images/069501.png","p":"ra","pct":0,"st":"none"},{"title":"Star Ocean: First Departure","icon":"https://media.retroachievements.org/Images/103361.png","p":"ra","pct":0,"st":"none"},{"title":"STAR OCEAN THE DIVINE FORCE","icon":"https://cdn.akamai.steamstatic.com/steam/apps/1776380/header.jpg","p":"steam","pct":0,"st":"none"},{"title":"Star Ocean: The Last Hope","icon":"https://store-images.s-microsoft.com/image/apps.14634.66697454497760198.6879d487-5524-4cd2-8dc0-a91ea294cfc7.8e03bc00-e64f-44a2-bbc6-11caabea2e66?w=128","p":"xbox","pct":0,"st":"none"}]};
        drawSeries(SER_FALLBACK);
        let serList = [SER_FALLBACK], serI = 0;
        loops.series = { el: serCard, every: 5200, step() {
            if (serList.length < 2) return;
            serI = (serI + 1) % serList.length;
            drawSeries(serList[serI]);
            swapIn(serCard);
            serCard.classList.remove("on"); void serCard.offsetWidth; serCard.classList.add("on");
        } };
        loaders.series = async () => {
            const f = await get("data/hub/series-games.json");
            const list = ((f && f.series) || []).filter(s => s.games.length >= 3 && s.games.length <= 24).map(s => {
                const games = s.games.map(g => {
                    const done = g.total > 0 && g.unlocked >= g.total;
                    return { title: g.title, icon: g.p === "xbox" ? xboxImg(g.icon, 128) : g.icon, p: g.p, pct: g.total ? Math.round((g.unlocked / g.total) * 100) : 0, st: done ? "done" : g.beaten ? "beaten" : g.unlocked > 0 ? "started" : "none", last: g.lastMs || 0 };
                });
                const order = { done: 0, beaten: 1, started: 2, none: 3 };
                games.sort((a, b) => order[a.st] - order[b.st] || b.pct - a.pct);
                const score = games.reduce((a, g) => a + ({ done: 3, beaten: 2, started: 1, none: 0 })[g.st], 0);
                const cover = s.games.find(g => g.key === s.cover) || s.games.find(g => g.art);
                return { name: s.name, art: cover && (cover.artFull || cover.art), games, score, last: Math.max(...games.map(g => g.last)) };
            }).sort((a, b) => b.score - a.score || b.last - a.last);
            if (list[0]) { serList = list.slice(0, 5); serI = 0; drawSeries(serList[0]); replay(document.getElementById("ft-series")); }
        };

        // Watch every loop now that all are defined
        if (loopIO) Object.values(loops).forEach(L => loopIO.observe(L.el));
        fromHash();
    }

    // ── How it works and Setup follow the scroll: the line fills as you read down and each step lights
    // up when the fill reaches it; setup steps tick off as they pass the middle of the screen ──
    const flow = document.getElementById("flow"), setupList = document.getElementById("setup-list");
    if (flow || setupList) {
        const steps = flow ? [...flow.querySelectorAll(".step")] : [];
        const fill = flow && flow.querySelector(".flow-fill");
        const items = setupList ? [...setupList.children] : [];
        let queued = false;
        const update = () => {
            queued = false;
            const vh = innerHeight;
            if (flow) {
                const r = flow.getBoundingClientRect();
                // Phone (vertical line): fills while the steps pass the upper two thirds of the screen.
                // Wide (one row): starts when the row is 85% down the screen, full at 40%
                const vertical = r.height > r.width;
                const p = vertical
                    ? Math.min(1, Math.max(0, (vh * .7 - r.top) / r.height))
                    : Math.min(1, Math.max(0, (vh * .85 - r.top) / (vh * .45)));
                flow.style.setProperty("--p", p.toFixed(3));
                const f = fill.getBoundingClientRect();
                steps.forEach(s => {
                    const d = s.querySelector(".dot").getBoundingClientRect();
                    const reached = vertical ? f.bottom >= d.top + d.height / 2 - 1 : f.right >= d.left + d.width / 2 - 1;
                    s.classList.toggle("lit", p > 0 && reached);
                });
            }
            items.forEach(li => li.classList.toggle("done", li.getBoundingClientRect().top + li.offsetHeight / 2 < vh * .55));
        };
        if (reduced) {
            if (flow) flow.style.setProperty("--p", 1);
            steps.forEach(s => s.classList.add("lit"));
        } else {
            const req = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
            addEventListener("scroll", req, { passive: true });
            addEventListener("resize", req);
            update();
        }
    }

    // ── Final: a save point. The author's totals count up once (read live, the hub header's rules: hours RA + Steam,
    // unlocks and completed all three platforms), the crystal flashes, then rings pulse while it's on screen ──
    const fin = document.getElementById("final");
    if (fin) {
        const nums = [...fin.querySelectorAll("[data-n]")];
        const fmt = b => Number(b.dataset.n).toLocaleString("en");
        let counted = false;
        const live = fetch("https://yozuryu.github.io/my-savepoint/data/ra/profile.json").then(r => r.json()).then(async ra => {
            const [st, xb] = await Promise.all(["steam", "xbox"].map(p => fetch("https://yozuryu.github.io/my-savepoint/data/" + p + "/profile.json").then(r => (r.ok ? r.json() : null)).catch(() => null)));
            const res = (ra.gameAwardsAndProgress && ra.gameAwardsAndProgress.results) || [], s = (st && st.stats) || {}, x = (xb && xb.stats) || {};
            const minutes = res.reduce((a, g) => a + (g.playtime || 0), 0) + (s.totalPlaytimeMin || 0);
            const unlocks = res.reduce((a, g) => a + (g.numAwarded || 0), 0) + (s.unlockedAchievements || 0) + (x.unlockedAchievements || 0);
            const done = res.filter(g => g.highestAwardKind === "mastered").length + (s.perfectCount || 0) + (x.perfectCount || 0);
            [Math.round(minutes / 60), unlocks, done].forEach((v, i) => { if (v > 0) nums[i].dataset.n = v; });
            if (counted) nums.forEach(b => (b.textContent = fmt(b)));
        }).catch(() => {});
        const count = () => {
            counted = true;
            fin.classList.add("saving");
            const t0 = performance.now(), D = 1400;
            const step = t => {
                const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
                nums.forEach(b => (b.textContent = Math.round(Number(b.dataset.n) * e).toLocaleString("en")));
                if (k < 1) requestAnimationFrame(step); else fin.classList.add("done");
            };
            requestAnimationFrame(step);
        };
        if (reduced || !("IntersectionObserver" in window)) fin.classList.add("done");
        else {
            nums.forEach(b => (b.textContent = "0"));
            let seen = false;
            const pulse = () => fin.classList.toggle("live", seen && !document.hidden);
            new IntersectionObserver(e => {
                seen = e[0].isIntersecting;
                if (seen && !counted) { counted = true; Promise.race([live, new Promise(r => setTimeout(r, 700))]).then(count); }
                pulse();
            }, { threshold: .35 }).observe(fin);
            document.addEventListener("visibilitychange", pulse);
        }
    }

    // ── Live demo: the author's real hub in a phone or a scaled desktop window ──
    const stage = document.getElementById('demo-stage');
    if (!stage) return;
    const LIVE = 'https://yozuryu.github.io/my-savepoint/';
    // Both frames render the hub at a real size and are scaled down to fit, so its layout is never squeezed
    const DESK_W = 1360, DESK_H = 860, PHONE_W = 400;
    const phone = document.getElementById('demo-phone'), desk = document.getElementById('demo-desk');
    const framePhone = document.getElementById('demo-frame-phone'), frameDesk = document.getElementById('demo-frame-desk');
    const deskScreen = document.getElementById('demo-desk-screen');
    const urlLabel = document.getElementById('demo-url'), openLink = document.getElementById('demo-open');
    let page = '', device = 'phone', started = false;

    const phoneScreen = framePhone.parentElement;
    const fit = () => {
        framePhone.style.transform = `scale(${phoneScreen.clientWidth / PHONE_W})`;
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
        document.getElementById('demo-body').classList.toggle('is-phone', device === 'phone');
        phone.hidden = device !== 'phone';
        desk.hidden = device !== 'desktop';
        fit();
        if (started) load();
    };
    document.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => {
        document.querySelectorAll('[data-page]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        page = b.dataset.page;
        load();
    }));
    // Switching device: fade out, swap, then grow or shrink to the new height, keeping the demo where it was on screen
    const demoBody = document.getElementById('demo-body');
    let switching = 0;
    document.querySelectorAll('[data-device]').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.device === device) return;
        document.querySelectorAll('[data-device]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        if (reduced) { device = b.dataset.device; show(); return; }
        clearTimeout(switching);
        // The browser would scroll to keep content below in place while the demo resizes; hold the demo still instead
        document.documentElement.style.overflowAnchor = 'none';
        const top0 = demoBody.getBoundingClientRect().top, h0 = demoBody.offsetHeight;
        demoBody.classList.add('out');
        switching = setTimeout(() => {
            device = b.dataset.device;
            show();
            const h1 = demoBody.offsetHeight;
            Object.assign(demoBody.style, { height: h0 + 'px', overflow: 'hidden', transition: 'none' });
            scrollBy(0, demoBody.getBoundingClientRect().top - top0);
            void demoBody.offsetHeight;
            Object.assign(demoBody.style, { transition: 'height .45s cubic-bezier(.2, .7, .2, 1), opacity .35s .12s, transform .35s .12s', height: h1 + 'px' });
            demoBody.classList.remove('out');
            switching = setTimeout(() => { Object.assign(demoBody.style, { height: '', overflow: '', transition: '' }); document.documentElement.style.overflowAnchor = ''; }, 520);
        }, 180);
    }));
    addEventListener('resize', fit);
    fit();
    // The hub loads only when the demo comes near the screen
    new IntersectionObserver((entries, io) => {
        if (entries.some(e => e.isIntersecting)) { started = true; load(); io.disconnect(); }
    }, { rootMargin: '400px 0px' }).observe(stage);
})();

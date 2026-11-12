// The last screen: a save point. The author's totals count up once (read live, the hub header's rules:
// hours RA + Steam, unlocks and completed on all three platforms), the crystal flashes, then rings pulse
// while it's on screen. The heading and buttons are static HTML passed in.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { asset, hubJson } from '../lib/hub';
import { TOTALS } from '../lib/fallbacks';
import { useOnScreen, useReduced } from '../lib/hooks';

const LABELS = ['hours played', 'unlocks', 'completed'];

async function live() {
    const ra = await hubJson('data/ra/profile.json');
    if (!ra) return null;
    const [st, xb] = await Promise.all([hubJson('data/steam/profile.json'), hubJson('data/xbox/profile.json')]);
    const res = (ra.gameAwardsAndProgress && ra.gameAwardsAndProgress.results) || [], s = (st && st.stats) || {}, x = (xb && xb.stats) || {};
    const minutes = res.reduce((a: number, g: any) => a + (g.playtime || 0), 0) + (s.totalPlaytimeMin || 0);
    const unlocks = res.reduce((a: number, g: any) => a + (g.numAwarded || 0), 0) + (s.unlockedAchievements || 0) + (x.unlockedAchievements || 0);
    const done = res.filter((g: any) => g.highestAwardKind === 'mastered').length + (s.perfectCount || 0) + (x.perfectCount || 0);
    return [Math.round(minutes / 60), unlocks, done].map((v, i) => (v > 0 ? v : TOTALS[i]));
}

export default function SavePoint({ children, after }: { children?: ReactNode; after?: ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const reduced = useReduced();
    const visible = useOnScreen(ref, { threshold: .35 });
    const target = useRef(TOTALS);
    const fetched = useRef<Promise<unknown> | null>(null);
    // Server render (and no script): the real numbers. With script they start at 0 until the save runs
    const [shown, setShown] = useState(TOTALS);
    const [phase, setPhase] = useState<'idle' | 'saving' | 'done'>('idle');
    const phaseRef = useRef(phase);
    phaseRef.current = phase;

    useEffect(() => {
        fetched.current = live().then(v => { if (v) { target.current = v; if (phaseRef.current === 'done') setShown(v); } }).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => { if (reduced) setPhase('done'); else setShown([0, 0, 0]); }, [reduced]);

    // Runs once; leaving the screen mid-count doesn't stop it
    const started = useRef(false);
    useEffect(() => {
        if (!visible || started.current || reduced) return;
        started.current = true;
        Promise.race([fetched.current, new Promise(r => setTimeout(r, 700))]).then(() => {
            setPhase('saving');
            const t0 = performance.now(), D = 1400;
            const step = (t: number) => {
                const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3);
                setShown(target.current.map(n => Math.round(n * e)));
                if (k < 1) requestAnimationFrame(step); else setPhase('done');
            };
            requestAnimationFrame(step);
        });
    }, [visible, reduced]);

    const cls = 'final' + (phase !== 'idle' ? ' saving' : '') + (phase === 'done' ? ' done' : '') + (visible && phase !== 'idle' ? ' live' : '');
    return (
        <div className={cls} id="final" ref={ref}>
            <div className="savept" aria-hidden="true"><i className="ring" /><i className="ring" /><img className="crystal" src={asset('favicon.svg')} alt="" /></div>
            {children}
            <div className="savefile" aria-label="The author's totals">
                {shown.map((n, i) => <div key={i}><b className={i === 2 ? 'gold' : undefined}>{n.toLocaleString('en')}</b><span>{LABELS[i]}</span></div>)}
            </div>
            <p className="saved"><i />The author's save, kept every hour</p>
            {after}
        </div>
    );
}

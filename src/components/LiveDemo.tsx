// Live demo: the author's real hub in a phone or a scaled desktop window. Both frames render the hub at a
// real size and are scaled down to fit, so its layout is never squeezed. The hub loads only when the demo
// comes near the screen.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import Pills from './Pills';
import { asset, HUB } from '../lib/hub';
import { demoPage } from '../lib/stores';
import { useReduced, useSeen } from '../lib/hooks';

const DESK_W = 1360, DESK_H = 860, PHONE_W = 400;
type Device = 'phone' | 'desktop';

const PAGES = [
    { id: '', label: 'Hub' },
    { id: 'profile/ra/', label: <><img src={asset('icon-ra.png')} alt="" />RetroAchievements</> },
    { id: 'profile/steam/', label: <><img src={asset('icon-steam.png')} alt="" />Steam</> },
    { id: 'profile/xbox/', label: <><img src={asset('icon-xbox.png')} alt="" />Xbox</> },
    { id: 'activity/', label: 'Activity' },
    { id: 'analytics/', label: 'Analytics' },
    { id: 'completions/', label: 'Completions' },
    { id: 'series/', label: 'Series' },
];
const DEVICES = [
    { id: 'phone' as const, label: <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></svg>Phone</> },
    { id: 'desktop' as const, label: <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>Desktop</> },
];

function Frame({ url, title, className, style }: { url: string; title: string; className?: string; style?: React.CSSProperties }) {
    const [loaded, setLoaded] = useState(false);
    useEffect(() => setLoaded(false), [url]);
    return <>
        <div className={'loading' + (loaded ? ' gone' : '')} aria-hidden="true" />
        <iframe title={title} src={url || undefined} className={className} style={style} onLoad={() => url && setLoaded(true)} />
    </>;
}

export default function LiveDemo() {
    const body = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null);
    const phoneScreen = useRef<HTMLDivElement>(null), deskScreen = useRef<HTMLDivElement>(null);
    const reduced = useReduced();
    const started = useSeen(stage, '400px 0px');
    const [page, setPage] = useState('');
    const [device, setDevice] = useState<Device>('phone');
    const [scale, setScale] = useState({ phone: 1, desk: 1 });
    const [out, setOut] = useState(false);
    const asked = useStore(demoPage);
    useEffect(() => { if (asked != null) { setPage(asked); demoPage.set(null); } }, [asked]);

    const fit = () => setScale({
        phone: (phoneScreen.current?.clientWidth || PHONE_W) / PHONE_W,
        desk: (deskScreen.current?.clientWidth || DESK_W) / DESK_W,
    });
    useLayoutEffect(() => {
        fit();
        addEventListener('resize', fit);
        return () => removeEventListener('resize', fit);
    }, []);
    useLayoutEffect(fit, [device]);

    // Switching device: fade out, swap, then grow or shrink to the new height, keeping the demo where it was on screen
    const timer = useRef(0), from = useRef<{ top: number; h: number } | null>(null);
    const switchTo = (d: Device) => {
        if (d === device) return;
        if (reduced) { setDevice(d); return; }
        clearTimeout(timer.current);
        // The browser would scroll to keep content below in place while the demo resizes; hold the demo still instead
        document.documentElement.style.overflowAnchor = 'none';
        const el = body.current!;
        from.current = { top: el.getBoundingClientRect().top, h: el.offsetHeight };
        setOut(true);
        timer.current = window.setTimeout(() => setDevice(d), 180);
    };
    useLayoutEffect(() => {
        const el = body.current, f = from.current;
        if (!el || !f) return;
        from.current = null;
        const h1 = el.offsetHeight;
        Object.assign(el.style, { height: f.h + 'px', overflow: 'hidden', transition: 'none' });
        scrollBy(0, el.getBoundingClientRect().top - f.top);
        void el.offsetHeight;
        Object.assign(el.style, { transition: 'height .45s cubic-bezier(.2, .7, .2, 1), opacity .35s .12s, transform .35s .12s', height: h1 + 'px' });
        setOut(false);
        timer.current = window.setTimeout(() => { Object.assign(el.style, { height: '', overflow: '', transition: '' }); document.documentElement.style.overflowAnchor = ''; }, 520);
    }, [device]);

    const url = HUB + page;
    const label = url.replace(/^https:\/\//, '').replace(/\/$/, '');
    return (
        <div className={'demo-body' + (device === 'phone' ? ' is-phone' : '') + (out ? ' out' : '')} ref={body}>
            <div className="demo-bar">
                <Pills label="Page" items={PAGES} value={page} onChange={setPage} />
                <Pills label="Device" className="seg" items={DEVICES} value={device} onChange={switchTo} />
            </div>
            <div className="demo-stage" ref={stage}>
                <div className="halo" />
                <div className="phone demo-phone" hidden={device !== 'phone'}>
                    <div className="screen" ref={phoneScreen}>
                        <Frame url={started && device === 'phone' ? url : ''} title="Live Savepoint hub, phone view" style={{ transform: `scale(${scale.phone})` }} />
                    </div>
                </div>
                <div className="browser demo-desk" hidden={device !== 'desktop'}>
                    <div className="bar"><i /><i /><i /><span>{label}</span></div>
                    <div className="screen" ref={deskScreen} style={{ aspectRatio: `${DESK_W} / ${DESK_H}` }}>
                        <Frame url={started && device === 'desktop' ? url : ''} title="Live Savepoint hub, desktop view" style={{ transform: `scale(${scale.desk})` }} />
                    </div>
                </div>
            </div>
            <div className="demo-note">
                <a className="demo-open" href={url} target="_blank" rel="noopener">Open it in its own tab
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg></a>
            </div>
        </div>
    );
}

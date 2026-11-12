// Analytics showcase: recap, the daily rhythm clock, the top game, and two cards that take turns
// moving to their next item (the rarest unlocks, the game stories).
import { useEffect, useRef, useState } from 'react';
import { ANALYTICS_FALLBACK, computeAnalytics, type Analytics, type Rare, type Story } from '../lib/analytics';
import { asset, fmtH, fmtHm, hh } from '../lib/hub';
import { useLoop, useSeen, useShowcase } from '../lib/hooks';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const RARITY: [number, string, string][] = [[5, 'Ultra rare', '#e5b143'], [10, 'Very rare', '#c8901a'], [25, 'Rare', '#66c0f4'], [50, 'Uncommon', '#8f98a0'], [Infinity, 'Common', '#546270']];
const HEAT = ['#101214', '#0d2a3d', '#1a5275', '#2a7bba', '#66c0f4'];
const away = (d: number) => (d >= 365 ? (d / 365).toFixed(1) + ' years' : Math.round(d / 30) + ' months');

const Delta = ({ cur, prev }: { cur: number; prev: number }) => {
    if (!(prev > 0)) return null;
    const v = Math.round(((cur - prev) / prev) * 100);
    return <i className={'d ' + (v > 0 ? 'up' : v < 0 ? 'down' : '')}>{(v > 0 ? '▲ ' : v < 0 ? '▼ ' : '= ') + Math.abs(v)}%</i>;
};

function Clock({ byHour, start }: { byHour: number[]; start: number | null }) {
    const max = Math.max(...byHour) || 1;
    const shade = (v: number) => { if (!v) return HEAT[0]; const r = Math.sqrt(v / max); return r >= .75 ? HEAT[4] : r >= .5 ? HEAT[3] : r >= .25 ? HEAT[2] : HEAT[1]; };
    const C = 60, R1 = 38, R2 = 56;
    const pt = (r: number, h: number) => { const a = (h / 24) * 2 * Math.PI - Math.PI / 2; return [C + r * Math.cos(a), C + r * Math.sin(a)].map(n => n.toFixed(2)); };
    const p = (r: number, h: number) => pt(r, h).join(',');
    return (
        <svg className="ana-clock" viewBox="0 0 120 120" role="img" aria-label="Play by hour of the day">
            {byHour.map((v, h) => (
                <path key={h} style={{ '--h': h } as React.CSSProperties} fill={shade(v)}
                    d={`M${p(R2, h + .05)} A${R2},${R2} 0 0 1 ${p(R2, h + .95)} L${p(R1, h + .95)} A${R1},${R1} 0 0 0 ${p(R1, h + .05)} Z`}>
                    <title>{hh(h) + ':00–' + hh(h + 1) + ':00 · ' + fmtHm(Math.round(v))}</title>
                </path>
            ))}
            {[0, 6, 12, 18].map(h => { const [x, y] = pt(R1 - 7, h); return <text key={h} x={x} y={y} fontSize="6" fill="#546270" textAnchor="middle" dominantBaseline="middle">{hh(h)}</text>; })}
            {start != null && (() => {
                const t = start / 60, [x1, y1] = pt(R1 - 2, t), [x2, y2] = pt(R2 + 3, t);
                return <>
                    <line className="tick" x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e5b143" strokeWidth="1.6" strokeLinecap="round" />
                    <g className="mid"><text x="60" y="59" fontSize="13" fontWeight="600" fill="#fff" textAnchor="middle">{hh(Math.floor(start / 60)) + ':' + String(start % 60).padStart(2, '0')}</text><text x="60" y="70" fontSize="6" fill="#8f98a0" textAnchor="middle">typical start</text></g>
                </>;
            })()}
        </svg>
    );
}

const Img = ({ src, px, style }: { src: string; px?: boolean; style?: React.CSSProperties }) => <img alt="" loading="lazy" src={src} className={px ? 'px' : undefined} style={style} />;

function RareCard({ r, i, n, swap }: { r?: Rare; i: number; n: number; swap: number }) {
    if (!r) return <div className="ana-card" id="ana-rare" />;
    const t = RARITY.find(x => r.r < x[0])!;
    return (
        <div className={'ana-card' + (swap ? ' swap' : '')} id="ana-rare" key={swap}>
            <span className="tagline">Rarest unlock{n > 1 && <i className="n">{i + 1} of {n}</i>}</span>
            <div className="row"><Img src={r.icon} px={r.px} style={{ borderColor: t[2] }} /><div><b>{r.name}</b><span>{r.game}</span></div></div>
            <span className="big" style={{ color: t[2] }}>{r.r}%</span><span>of players have it · {t[1]}</span>
        </div>
    );
}

const STORY = {
    comeback: (s: Extract<Story, { kind: 'comeback' }>) => ['Comeback', 'Back after ' + away(s.gap), [s.minutes ? fmtHm(s.minutes) + ' played' : '', s.unlocks ? s.unlocks + ' unlocks' : ''].filter(Boolean).join(' · ') + ' since'],
    binge: (s: Extract<Story, { kind: 'binge' }>) => ['Binged', fmtHm(s.perDay) + ' a day', 'over ' + s.days + ' days of play'],
    days: (s: Extract<Story, { kind: 'days' }>) => ['Most days', 'Played on ' + s.days + ' days', fmtHm(s.minutes) + ' in total'],
};

function StoryCard({ s, swap }: { s?: Story; swap: number }) {
    if (!s) return <div className="ana-card" id="ana-story" />;
    const [tag, head, sub] = (STORY[s.kind] as (x: Story) => string[])(s);
    return (
        <div className={'ana-card' + (swap ? ' swap' : '')} id="ana-story" key={swap}>
            <span className="tagline">{tag}</span>
            <div className="row"><Img src={s.icon} px={s.px} /><div><b>{s.name}</b></div></div>
            <span className="big">{head}</span><span>{sub}</span>
        </div>
    );
}

function TopArt({ top }: { top: NonNullable<Analytics['top']> }) {
    // Art that doesn't load: the Steam banner, then the shared library mosaic
    const [src, setSrc] = useState(top.art);
    const [mosaic, setMosaic] = useState(false);
    useEffect(() => { setSrc(top.art); setMosaic(false); }, [top.art]);
    if (!src) return null;
    return <img alt="" loading="lazy" className={'art' + (mosaic ? ' mosaic' : '')} src={src}
        onError={() => { if (top.art2 && src !== top.art2) setSrc(top.art2); else if (!mosaic) { setMosaic(true); setSrc(asset('art-fallback.webp')); } }} />;
}

export default function AnalyticsShow() {
    const ref = useRef<HTMLDivElement>(null);
    const { playing, looping } = useShowcase('analytics', ref);
    const [a, setA] = useState<Analytics>(ANALYTICS_FALLBACK);
    const [ri, setRi] = useState(0), [si, setSi] = useState(0);
    const [rSwap, setRSwap] = useState(0), [sSwap, setSSwap] = useState(0);
    const turn = useRef(0);
    // The live data (the unlock history is a few hundred KB) loads only when the section gets near the screen
    const near = useSeen(ref, '800px 0px');
    useEffect(() => {
        if (!near) return;
        computeAnalytics().then(x => { setA(x); setRi(0); setSi(0); }).catch(e => console.warn('analytics', e));
    }, [near]);
    useLoop(looping, 3200, () => {
        turn.current = 1 - turn.current;
        if (turn.current && a.rares.length > 1) { setRi(i => (i + 1) % a.rares.length); setRSwap(n => n + 1); }
        if (!turn.current && a.stories.length > 1) { setSi(i => (i + 1) % a.stories.length); setSSwap(n => n + 1); }
    });

    const r = a.recap, facts: [string, string, string][] = [];
    if (a.peak) facts.push(['Peak time', WEEKDAYS[a.peak.day].slice(0, 3) + ' ' + hh(a.peak.hour) + '–' + hh(a.peak.hour + 2), a.peak.share + '%']);
    facts.push(['Favourite day', WEEKDAYS[a.fav.day], a.fav.share + '%']);
    facts.push(['Weekends', a.weekend + '%', 'of play']);
    if (a.late >= 5) facts.push(['After midnight', a.late + '%', '00–05']);

    return (
        <div className={'ana play' + (playing ? ' on' : '')} ref={ref}>
            <div className="ana-recap">
                <span><b>{fmtH(r.minutes)}</b>played <Delta cur={r.minutes} prev={r.prevMinutes} /></span>
                <span><b>{r.unlocks.toLocaleString('en')}</b>unlocks <Delta cur={r.unlocks} prev={r.prevUnlocks} /></span>
                <span><b>{r.days}</b>active days <Delta cur={r.days} prev={r.prevDays} /></span>
                <span className="key"><span><i className="d up">▲</i><i className="d down">▼</i></span>vs the 3 months before</span>
            </div>
            <div className="ana-rhythm">
                <Clock byHour={a.byHour} start={a.start} />
                <dl className="ana-facts">{facts.map(([k, v, s]) => <div key={k}><dt>{k}</dt><dd>{v}<span>{s}</span></dd></div>)}</dl>
            </div>
            <div className="ana-top">
                {a.top && <>
                    <TopArt top={a.top} />
                    <span className="tagline">Top game</span>
                    <div className="who"><Img src={a.top.icon} px={a.top.px} /><div><b>{a.top.name}</b><span><b>{fmtHm(a.top.minutes)}</b> · {a.top.share}% of all play</span></div></div>
                    <div className="share"><i style={{ width: Math.max(a.top.share, 2) + '%' }} /></div>
                </>}
            </div>
            <RareCard r={a.rares[ri]} i={ri} n={a.rares.length} swap={rSwap} />
            <StoryCard s={a.stories[si]} swap={sSwap} />
        </div>
    );
}

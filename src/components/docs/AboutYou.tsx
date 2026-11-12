// "About you": the reader's GitHub name, repository and platforms, filled into every link and command.
import { useDocs } from './useDocs';
import { siteUrl, updateDocs, type Platforms } from '../../lib/stores';
import { asset } from '../../lib/hub';

export const PLATFORMS: { id: keyof Platforms; name: string; icon: string }[] = [
    { id: 'ra', name: 'RetroAchievements', icon: 'icon-ra.png' },
    { id: 'steam', name: 'Steam', icon: 'icon-steam.png' },
    { id: 'xbox', name: 'Xbox', icon: 'icon-xbox.png' },
];
const clean = (v: string) => v.replace(/[^\w.-]/g, '');

export default function AboutYou() {
    const s = useDocs();
    const toggle = (id: keyof Platforms) => {
        // keep at least one
        if (s.plats[id] && Object.values(s.plats).filter(Boolean).length === 1) return;
        updateDocs({ plats: { ...s.plats, [id]: !s.plats[id] } });
    };
    return (
        <div className="you edge">
            <h3>About you</h3>
            <div className="fields">
                <label className="f">GitHub username<input type="text" id="in-owner" placeholder="your-name" autoComplete="off" spellCheck={false} value={s.owner} onChange={e => updateDocs({ owner: clean(e.target.value) })} /></label>
                <label className="f">Repository name<input type="text" id="in-repo" autoComplete="off" spellCheck={false} value={s.repo} onChange={e => updateDocs({ repo: clean(e.target.value) })} /></label>
            </div>
            <div className="fields" style={{ gridTemplateColumns: '1fr' }}>
                <span className="f" style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>Platforms you play on</span>
                <div className="toggles" role="group" aria-label="Platforms">
                    {PLATFORMS.map(p => (
                        <button key={p.id} type="button" className="tg" aria-pressed={!!s.plats[p.id]} onClick={() => toggle(p.id)}><img src={asset(p.icon)} alt="" />{p.name}</button>
                    ))}
                </div>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>Your site will be at <a href={s.owner.trim() ? siteUrl(s) : '#'}><b>{siteUrl(s)}</b></a></p>
        </div>
    );
}

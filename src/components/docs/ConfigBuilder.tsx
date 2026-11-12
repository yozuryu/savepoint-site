// Builds data/hub/config.json from a small form, with a rough preview of the hub header.
import { useState } from 'react';
import { useDocs } from './useDocs';
import { PLATFORMS } from './AboutYou';
import { asset } from '../../lib/hub';

const tags = (v: string) => v.split(',').map(s => s.trim()).filter(Boolean);
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export default function ConfigBuilder() {
    const s = useDocs();
    const [f, setF] = useState({ name: 'Player One', motto: 'Every save point tells a story', avatar: '', genre: 'RPG, Platformer', style: 'Pixel Art, Story Driven' });
    const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
    const cfg = {
        username: f.name.trim() || 'Player One',
        motto: f.motto.trim(),
        avatar: f.avatar.trim(),
        tags: { genre: tags(f.genre), style: tags(f.style) },
        platforms: { retroachievements: { visible: !!s.plats.ra }, steam: { visible: !!s.plats.steam }, xbox: { visible: !!s.plats.xbox } },
        siteUrl: '',
        playing: { visible: true }, series: { visible: true }, activity: { visible: true }, completions: { visible: true }, analytics: { visible: true },
    };
    const json = esc(JSON.stringify(cfg, null, 2))
        .replace(/(&quot;[^&]*?&quot;)(:)/g, '<span class="k">$1</span>$2')
        .replace(/: (&quot;.*?&quot;)/g, ': <span class="s">$1</span>')
        .replace(/: (true|false)/g, ': <span class="n">$1</span>');
    const av = cfg.avatar && /^https?:\/\//.test(cfg.avatar) ? cfg.avatar.replace(/"/g, '') : asset('icon-192.png');
    return <>
        <div className="builder">
            <div className="form">
                <label className="f">Name<input type="text" id="c-name" value={f.name} onChange={set('name')} /></label>
                <label className="f">Motto<input type="text" id="c-motto" value={f.motto} onChange={set('motto')} /></label>
                <label className="f">Picture URL (optional)<input type="url" id="c-avatar" placeholder="https://avatars.githubusercontent.com/you" value={f.avatar} onChange={set('avatar')} /></label>
                <label className="f">Genre tags, comma separated<input type="text" id="c-genre" value={f.genre} onChange={set('genre')} /></label>
                <label className="f">Style tags, comma separated<input type="text" id="c-style" value={f.style} onChange={set('style')} /></label>
            </div>
            <div className="preview" aria-label="Preview of the hub header">
                <div className="top"><img src={asset('favicon.svg')} alt="" />Savepoint <span>› <i style={{ fontStyle: 'normal' }}>{cfg.username.toUpperCase()}</i></span></div>
                <div className="head">
                    <div className="who"><div className="av" style={{ backgroundImage: `url("${av}")` }} /><div className="nm">{cfg.username}</div></div>
                    {cfg.motto && <div className="mt">"{cfg.motto}"</div>}
                    <div className="tags">{cfg.tags.genre.map((t, i) => <span key={'g' + i}>{t}</span>)}{cfg.tags.style.map((t, i) => <span key={'s' + i} className="g">{t}</span>)}</div>
                </div>
                <div className="plats">{PLATFORMS.filter(p => s.plats[p.id]).map(p => <span key={p.id}><img src={asset(p.icon)} alt="" />{p.name}</span>)}</div>
            </div>
        </div>
        <div className="codebox"><pre dangerouslySetInnerHTML={{ __html: json }} /><CopyButton text={JSON.stringify(cfg, null, 2)} /></div>
    </>;
}

/** Copy button for a code box that React renders (the page script only adds them to static boxes). */
export function CopyButton({ text }: { text: string }) {
    const [done, setDone] = useState(false);
    return <button type="button" className={'copy' + (done ? ' done' : '')} data-own onClick={async () => {
        try { await navigator.clipboard.writeText(text); } catch { /* the page can't write the clipboard */ }
        setDone(true); setTimeout(() => setDone(false), 1600);
    }}>{done ? 'Copied' : 'Copy'}</button>;
}

// The author's live hub: the demo frames it and the showcases read its public data files.
export const HUB = 'https://yozuryu.github.io/my-savepoint/';
export const DATA = HUB + 'data/';
export const RA_MEDIA = 'https://media.retroachievements.org';
export const TEMPLATE = 'https://github.com/yozuryu/savepoint';

/** Files the site serves itself (icons, the art mosaic), under the base path. */
export const asset = (f: string) => import.meta.env.BASE_URL.replace(/\/?$/, '/') + 'assets/' + f;

/** A JSON file from the live hub, or null when it can't be read. */
export const hubJson = <T = any>(path: string): Promise<T | null> =>
    fetch(HUB + path).then(r => (r.ok ? r.json() : null)).catch(() => null);

export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Xbox store images come full size: ask for a small one, like the hub does. */
export const xboxImg = (url: string | undefined, w: number) =>
    !url ? url ?? '' : url.includes('store-images.s-microsoft.com') ? url + (url.includes('?') ? '&' : '?') + 'w=' + w : url.includes('images-eds') ? url + '&w=' + w : url;

/** RA titles without ~Tag~ prefixes and [Subset] suffixes. */
export const raTitle = (t?: string) => (t || '').replace(/~[^~]+~\s*/g, '').replace(/\s*\[Subset[^\]]*\]/i, '');

export const fmtHm = (m: number) => { const h = Math.floor(m / 60), r = Math.round(m % 60); return h ? (r ? h + 'h ' + r + 'm' : h + 'h') : r + 'm'; };
export const fmtH = (m: number) => (m >= 60 ? Math.round(m / 60).toLocaleString('en') + 'h' : m + 'm');
export const monthDay = (ms: number) => new Date(ms).toLocaleDateString('en', { month: 'short', day: 'numeric' });
export const hh = (h: number) => String(((h % 24) + 24) % 24).padStart(2, '0');
export const localKey = (ms: number | Date) => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
export const steamHeader = (id: string | number, url?: string) => url || 'https://cdn.akamai.steamstatic.com/steam/apps/' + id + '/header.jpg';

export type Plat = 'ra' | 'steam' | 'xbox';

/** The newest unlocks (91 days per platform) from RA and Steam, shared by the hero feed and the heatmap. */
export interface Unlock { p: Plat; t: string; n: string; g: string; i: string; v: number }
let chunks: Promise<Unlock[]> | null = null;
export const recentUnlocks = () => (chunks ??= Promise.all(['ra', 'steam'].map(p => fetch(DATA + p + '/achievements/1.json').then(r => { if (!r.ok) throw r.status; return r.json(); })))
    .then(([ra, st]) => [
        ...ra.recentAchievements.map((a: any) => ({ p: 'ra', t: a.date.replace(' ', 'T') + 'Z', n: a.title, g: a.gameTitle, i: RA_MEDIA + a.badgeUrl, v: a.points })),
        ...st.recentAchievements.map((a: any) => ({ p: 'steam', t: a.unlockedAt, n: a.displayName, g: a.gameName, i: a.iconUrl, v: a.globalPct })),
    ] as Unlock[]));

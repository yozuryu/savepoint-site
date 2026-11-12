// State shared between islands: which feature tab is open, which page the live demo should show,
// and the docs reader's own names, platforms and checklist (kept in this browser only).
import { atom } from 'nanostores';

export type FeatureTab = 'overview' | 'analytics' | 'activity' | 'completions' | 'series';
export const FEATURE_TABS: { id: FeatureTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'activity', label: 'Activity' },
    { id: 'completions', label: 'Completions' },
    { id: 'series', label: 'Series' },
];
export const activeTab = atom<FeatureTab>('overview');

/** Set by "Open … in the live demo" links; the demo switches to that page. */
export const demoPage = atom<string | null>(null);

export type Platforms = { ra: boolean; steam: boolean; xbox: boolean };
export interface DocsState { owner: string; repo: string; plats: Platforms; done: Record<string, boolean> }
const KEY = 'savepoint-docs';
export const DOCS_DEFAULT: DocsState = { owner: '', repo: 'savepoint', plats: { ra: true, steam: true, xbox: true }, done: {} };

// The server render (and the first client render, so hydration matches) uses the defaults;
// loadDocs() then brings in what this browser saved
export const docs = atom<DocsState>(DOCS_DEFAULT);
let loaded = false;
export function loadDocs() {
    if (loaded || typeof localStorage === 'undefined') return;
    loaded = true;
    try { docs.set({ ...DOCS_DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }); } catch { /* private mode: defaults */ }
    docs.listen(v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* not saved */ } });
}
export const updateDocs = (patch: Partial<DocsState>) => docs.set({ ...docs.get(), ...patch });

export const owner = (s: DocsState) => s.owner.trim() || 'your-name';
export const repo = (s: DocsState) => s.repo.trim() || 'savepoint';
export const siteUrl = (s: DocsState) =>
    repo(s).toLowerCase() === `${owner(s).toLowerCase()}.github.io` ? `https://${repo(s)}/` : `https://${owner(s).toLowerCase()}.github.io/${repo(s)}/`;
export const SETUP_STEPS = ['repo', 'pages', 'keys', 'secrets', 'config', 'first-run', 'phone'] as const;

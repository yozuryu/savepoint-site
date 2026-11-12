// A link into the reader's own repository on GitHub (GitHub's home until they give their name).
import type { ReactNode } from 'react';
import { useDocs } from './useDocs';
import { owner, repo, siteUrl } from '../../lib/stores';

export default function GitLink({ path, site, children }: { path?: string; site?: boolean; children: ReactNode }) {
    const s = useDocs();
    const known = !!s.owner.trim();
    const href = site ? (known ? siteUrl(s) : '#') : known ? `https://github.com/${owner(s)}/${repo(s)}/${path}` : 'https://github.com/';
    return <a href={href} target={site ? undefined : '_blank'} rel={site ? undefined : 'noopener'}>{children}</a>;
}

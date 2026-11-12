// The reader's own repository, site or clone URL, filled into the text.
import { useDocs } from './useDocs';
import { owner, repo, siteUrl } from '../../lib/stores';

export default function Fill({ k, bold }: { k: 'repo' | 'site' | 'clone'; bold?: boolean }) {
    const s = useDocs();
    const v = k === 'repo' ? repo(s) : k === 'site' ? siteUrl(s) : `https://github.com/${owner(s)}/${repo(s)}.git`;
    return bold ? <b>{v}</b> : <>{v}</>;
}

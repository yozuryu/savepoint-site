import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { DOCS_DEFAULT, docs, loadDocs } from '../../lib/stores';
import { useHydrated } from '../../lib/hooks';

/**
 * The docs reader's saved names, platforms and checklist. Each island renders the defaults until it has
 * hydrated (that's what the server rendered), even when an island that hydrated earlier already loaded
 * this browser's copy; otherwise React finds the server text and its first render disagree.
 */
export function useDocs() {
    useEffect(loadDocs, []);
    const s = useStore(docs);
    return useHydrated() ? s : DOCS_DEFAULT;
}

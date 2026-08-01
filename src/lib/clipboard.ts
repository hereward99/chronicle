import { notify } from '@/lib/notify';
import { stripMentions } from '@/lib/mentions';

/**
 * Copy text to the clipboard with mention syntax normalized to plain "@Name".
 * Single entry point so every copy path renders mentions the same way.
 */
export async function copyText(text: string, label = 'Content') {
  try {
    await navigator.clipboard.writeText(stripMentions(text));
    notify.success('Copied', `${label} copied to clipboard.`);
  } catch {
    notify.error('Copy failed', 'Your browser blocked clipboard access.');
  }
}

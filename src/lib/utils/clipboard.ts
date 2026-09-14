import { toast } from '../state/toast.svelte';
import { settings } from '../state/settings.svelte';

export async function copyToClipboard(text: string, customToastMsg?: string): Promise<boolean> {
  if (!text || typeof navigator === 'undefined') return false;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older webviews
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }

    settings.vibrate(45);
    toast.show(customToastMsg ?? '✓ Zkopírováno do schránky', { type: 'success' });
    return true;
  } catch (err) {
    toast.show('Chyba při kopírování do schránky', { type: 'danger' });
    return false;
  }
}

export async function pasteFromClipboard(): Promise<string | null> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
    toast.show('Vložení ze schránky není v tomto prohlížeči podporováno', { type: 'info' });
    return null;
  }

  try {
    const text = await navigator.clipboard.readText();
    settings.vibrate(25);
    return text;
  } catch {
    toast.show('Nelze načíst schránku (povolte oprávnění)', { type: 'danger' });
    return null;
  }
}

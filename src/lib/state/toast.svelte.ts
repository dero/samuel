export interface ToastMessage {
  id: string;
  text: string;
  type?: 'success' | 'danger' | 'warning' | 'info';
  undoAction?: () => void;
  undoLabel?: string;
}

class ToastState {
  toasts = $state<ToastMessage[]>([]);
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  show(
    text: string,
    options?:
      | 'success'
      | 'danger'
      | 'warning'
      | 'info'
      | {
          type?: 'success' | 'danger' | 'warning' | 'info';
          duration?: number;
          undoAction?: () => void;
          undoLabel?: string;
        }
  ) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    const opts = typeof options === 'string' ? { type: options } : options;
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    const duration = opts?.duration ?? 2600;

    const toast: ToastMessage = {
      id,
      text,
      type: opts?.type ?? 'success',
      undoAction: opts?.undoAction,
      undoLabel: opts?.undoLabel ?? 'Vrátit zpět'
    };

    // Exactly one toast on screen at a time
    this.toasts = [toast];

    this.timeoutId = setTimeout(() => {
      this.remove(id);
      this.timeoutId = null;
    }, duration);
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
}

export const toast = new ToastState();

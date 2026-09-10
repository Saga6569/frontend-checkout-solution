import { ApiError } from '../api/client.js';

export function ErrorBanner({ error, onDismiss }: { error: ApiError; onDismiss?: () => void }) {
  return (
    <div className="error-banner" role="alert">
      <span>{error.message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Закрыть">
          ×
        </button>
      )}
    </div>
  );
}

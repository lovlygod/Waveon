export function formatTime(totalSec: number): string {
  if (!Number.isFinite(totalSec) || totalSec < 0) return '0:00';

  const normalized = Math.max(0, Math.round(totalSec));
  const minutes = Math.floor(normalized / 60);
  const seconds = normalized % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

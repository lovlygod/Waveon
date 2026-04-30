import { type PointerEvent, type ReactElement, useMemo, useRef } from 'react';

interface DragSliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  onCommit?: (value: number) => void;
  fillClassName: string;
  showThumb?: boolean;
}

export function DragSlider({ value, max, onChange, onCommit, fillClassName, showThumb = true }: DragSliderProps): ReactElement {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const percent = useMemo(() => {
    if (!max || max <= 0) return 0;
    return Math.min(100, Math.max(0, (value / max) * 100));
  }, [max, value]);

  function getValue(clientX: number): number {
    const root = rootRef.current;
    if (!root || max <= 0) return 0;

    const rect = root.getBoundingClientRect();
    if (rect.width <= 0) return 0;

    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * max;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>): void {
    event.preventDefault();
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange(getValue(event.clientX));
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (pointerIdRef.current !== event.pointerId) return;
    onChange(getValue(event.clientX));
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>): void {
    if (pointerIdRef.current !== event.pointerId) return;
    const nextValue = getValue(event.clientX);
    pointerIdRef.current = null;
    onChange(nextValue);
    onCommit?.(nextValue);
  }

  return (
    <div
      ref={rootRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative z-10 h-5 w-full cursor-pointer touch-none"
    >
      <div className="absolute left-0 top-1/2 h-2.5 w-full -translate-y-1/2 rounded-full bg-white/10 ring-1 ring-white/10" />
      <div className={`absolute left-0 top-1/2 h-2.5 -translate-y-1/2 rounded-full ${fillClassName}`} style={{ width: `${percent}%` }} />
      {showThumb && (
        <div
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-white/30 bg-white shadow-[0_0_10px_rgba(255,255,255,0.45)]"
          style={{ left: `calc(${percent}% - 8px)` }}
        />
      )}
    </div>
  );
}

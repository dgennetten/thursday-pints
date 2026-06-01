import type { MouseEvent } from 'react';

/** Clear map hover only when the pointer leaves the list, not when moving between rows. */
export function handleBreweryListMouseLeave(
  e: MouseEvent<HTMLElement>,
  mapHoverEnabled: boolean,
  onClear: () => void,
) {
  if (!mapHoverEnabled) return;
  const related = e.relatedTarget as Node | null;
  if (related && e.currentTarget.contains(related)) return;
  onClear();
}

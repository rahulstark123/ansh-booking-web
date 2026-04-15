/**
 * Shared overlay for right-hand drawers / side panels.
 * Blurs page content behind the panel for focus (falls back gracefully without backdrop-filter).
 */
export const DRAWER_BACKDROP_CLASS =
  "fixed inset-0 z-40 bg-zinc-900/25 backdrop-blur-sm supports-[backdrop-filter]:bg-zinc-900/15";

type DrawerBackdropProps = {
  onClick?: () => void;
  "aria-label"?: string;
  dismissOnClick?: boolean;
};

export function DrawerBackdrop({ onClick, "aria-label": ariaLabel, dismissOnClick = false }: DrawerBackdropProps) {
  if (dismissOnClick) {
    return (
      <button type="button" onClick={onClick} className={DRAWER_BACKDROP_CLASS} aria-label={ariaLabel} />
    );
  }
  return <div className={DRAWER_BACKDROP_CLASS} aria-hidden="true" />;
}

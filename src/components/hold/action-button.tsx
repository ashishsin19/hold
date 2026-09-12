type Props = {
  onDown: () => void;
  onUp: () => void;
};

export function ActionButton({ onDown, onUp }: Props) {
  return (
    <button
      type="button"
      className="hw-action"
      aria-label="Action Button"
      data-action-button="true"
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    />
  );
}

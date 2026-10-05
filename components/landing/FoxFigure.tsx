export function FoxFigure({ className }: { className?: string }) {
  return (
    <div className={className}>
      <img
        src="/brand/zorro-r.webp"
        alt="Zorro de nueve colas de Kitsunova, tu acompañante"
        width={1024}
        height={1024}
        loading="eager"
        decoding="async"
      />
    </div>
  );
}
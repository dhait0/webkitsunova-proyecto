import { fieldCompanion } from '@/content/siteContent';

export function FieldTails() {
  const tails = Array.from({ length: fieldCompanion.tailsTotal }, (_, index) => index < fieldCompanion.tailsCut);

  return (
    <section id="acompanante" className="kb-shell" aria-labelledby="acompanante-titulo">
      <div className="kb-card">
        <div className="kb-card__head">
          <div>
            <span className="kb-label">El acompañante</span>
            <h2 className="kb-heading" id="acompanante-titulo">
              {fieldCompanion.title}
            </h2>
          </div>
          <p className="kb-body">{fieldCompanion.lede}</p>
        </div>

        <ul className="kb-tails" aria-label={`${fieldCompanion.tailsCut} de ${fieldCompanion.tailsTotal} colas cortadas`}>
          {tails.map((cut, index) => (
            <li key={index} data-cut={cut} />
          ))}
        </ul>

        <p className="kb-body">
          Un kitsune de nueve colas es un zorro que envejece con criterio: cada cola aparece cuando
          aprende algo que no se olvida. Premiar rachas o días seguidos sería premiar la constancia
          vacía. Aquí una cola depende de una revisión cerrada, no de un temporizador.
        </p>

        <span className="kb-stamp">
          {fieldCompanion.tailsCut} / {fieldCompanion.tailsTotal}
        </span>
      </div>
    </section>
  );
}
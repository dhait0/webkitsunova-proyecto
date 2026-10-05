import { fieldStages } from '@/content/siteContent';

export function FieldStages() {
  return (
    <section className="kb-shell" id="recorrido" aria-labelledby="etapas-titulo">
      <div className="kb-card">
        <div className="kb-card__head">
          <div>
            <span className="kb-label">El recorrido</span>
            <h2 className="kb-heading" id="etapas-titulo">
              Tres etapas, y solo una de ellas es automática
            </h2>
          </div>
          <p className="kb-body">
            El orden importa: primero se anota, después se devuelve lo que se ve, y únicamente al
            final aparece una persona.
          </p>
        </div>

        <div className="kb-columns">
          {fieldStages.map((stage) => (
            <div className="kb-col" key={stage.title}>
              <h3 className="kb-subhead">{stage.title}</h3>
              <p>{stage.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
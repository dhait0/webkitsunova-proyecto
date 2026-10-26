export default function PsychologistProfileLoading() {
  return (
    <section className="user-page" role="status" aria-label="Cargando perfil del psicólogo...">
      <div className="user-page-head">
        <div className="user-page-head-copy">
          <span className="user-eyebrow">Perfil del psicólogo</span>
          <h2 className="user-headline">Cargando perfil...</h2>
        </div>
      </div>
      <div className="user-card user-raise" aria-busy="true">
        <p aria-hidden="true">Se está cargando la información del profesional.</p>
      </div>
    </section>
  );
}

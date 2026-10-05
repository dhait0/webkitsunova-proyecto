import PublicFooter from '@/components/PublicFooter';
import PublicHeader from '@/components/PublicHeader';
import { FieldApp, FieldIndex } from '@/components/landing/FieldIndex';
import { FieldRegister } from '@/components/landing/FieldRegister';
import { FieldRecord } from '@/components/landing/FieldRecord';
import { FieldStages } from '@/components/landing/FieldStages';
import { FieldTails } from '@/components/landing/FieldTails';
import { FoxFigure } from '@/components/landing/FoxFigure';
import { fieldCover } from '@/content/siteContent';

function HomePage() {
  return (
    <div className="kb-root">
      <a className="kb-skip" href="#registro">
        Ir al registro
      </a>

      <PublicHeader />

      <main>
        <section className="kb-shell kb-cover" aria-labelledby="portada-titulo">
          <div className="kb-cover__form">
            <FieldRegister />
          </div>

          <div className="kb-cover__stage">
            <div className="kb-cover__type">
              <h1 className="kb-display" id="portada-titulo">
                {fieldCover.title}
              </h1>
              <p className="kb-body kb-cover__copy">{fieldCover.lede}</p>
              <div className="kb-cover__actions">
                <a className="kb-btn kb-btn--quiet" href="#proceso">
                  {fieldCover.secondaryAction}
                </a>
              </div>
            </div>

            <FoxFigure className="kb-foxfigure" />
          </div>
        </section>

        <FieldRecord />
        <FieldStages />
        <FieldTails />
        <FieldIndex />
        <FieldApp />
      </main>

      <PublicFooter />
    </div>
  );
}

export default HomePage;
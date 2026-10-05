'use client';

import { useRouter } from 'next/navigation';
import { FieldRegister } from '@/components/landing/FieldRegister';
import { FoxFigure } from '@/components/landing/FoxFigure';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { loginPage } from '@/content/siteContent';
import { homeForRole, roleFromSupabaseUser } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/browser';
import type { AuthSuccessHandler } from '@/hooks/useAuthForm';

export default function LoginForm() {
  const router = useRouter();

  const handleAuthSuccess: AuthSuccessHandler = async (_mode, session) => {
    const home = homeForRole(roleFromSupabaseUser(session.user));
    const supabase = createClient();
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    const currentLevel = aalData?.currentLevel ?? 'aal1';
    const nextLevel = aalData?.nextLevel ?? null;

    // `refresh()` lets the server re-read the cookies the sign-in just wrote.
    router.refresh();

    if (currentLevel === 'aal1' && nextLevel === 'aal2') {
      router.push(`/mfa/verify?from=${encodeURIComponent(home)}`);
    } else {
      router.push(home);
    }
  };

  return (
    <div className="kb-root">
      <a className="kb-skip" href="#registro">
        {loginPage.backLabel}
      </a>

      <PublicHeader showSections={false} />

      <main>
        <section className="kb-shell kb-cover" aria-labelledby="login-titulo">
          <div className="kb-cover__form">
            <FieldRegister initialMode="login" onSuccess={handleAuthSuccess} />
          </div>

          <div className="kb-cover__stage">
            <div className="kb-cover__type">
              <h1 className="kb-display" id="login-titulo">
                {loginPage.heroTitle} <span>{loginPage.heroSpan}</span>
              </h1>
              <p className="kb-body kb-cover__copy">{loginPage.heroCopy}</p>
            </div>

            <FoxFigure className="kb-foxfigure" />
          </div>
        </section>

        <section className="kb-shell" aria-label="Qué obtienes en Kitsunova">
          <div className="kb-card">
            <div className="kb-card__head">
              <h2 className="kb-heading" id="login-acceso-titulo">
                {loginPage.headline}
              </h2>
              <p className="kb-body">{loginPage.lede}</p>
            </div>

            <div className="kb-columns">
              {loginPage.highlights.map((highlight) => (
                <div className="kb-col" key={highlight.strong}>
                  <h3 className="kb-subhead">{highlight.strong}</h3>
                  <p>{highlight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter showSectionLinks={false} />
    </div>
  );
}

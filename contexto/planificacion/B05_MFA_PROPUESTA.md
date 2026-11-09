# B05.3 — MFA y guards: auditoría y propuesta

Estado: **propuesta, sin implementar**. No se ha activado MFA obligatorio ni se ha cambiado ninguna política remota.

## Hallazgos (verificados)

1. **El segundo factor solo se exige en el cliente.** `features/auth/LoginForm.tsx` consulta `getAuthenticatorAssuranceLevel()` tras el login y redirige a `/mfa/verify` si `currentLevel === 'aal1'` y `nextLevel === 'aal2'`. Ni `proxy.ts` ni `lib/auth/guard.ts` leen el nivel de aseguramiento.
2. **Evidencia (entorno local aislado, TOTP verificado):** tras iniciar sesión con contraseña la persona llega a `/mfa/verify`, pero al navegar directamente a `/dashboard`, `/dashboard/habitos` o `/dashboard/configuracion` ve el contenido privado sin completar el segundo factor. Las Server Actions pasan por el mismo guard, por lo que tampoco lo exigen.
3. **Consecuencia:** quien roba solo la contraseña de una cuenta con MFA activo obtiene acceso completo. Es una evasión de MFA, no una limitación cosmética.
4. **`/mfa/verify`** solo exige sesión (`getSessionUser`); es correcto, porque se alcanza a mitad del login.
5. **Gestión de factores:** `MfaEnrollPage` y `MfaSettingsPage` llaman a Supabase desde el navegador (`mfa.enroll`, `mfa.challengeAndVerify`, `mfa.unenroll`). Supabase exige `aal2` para dar de baja un factor verificado, así que esa parte la protege la plataforma.
6. **Columnas heredadas:** `User.twoFactorEnabled` y `User.twoFactorSecret` (Prisma) no se usan en ningún código. Un secreto TOTP no debería vivir ahí; conviene retirarlas en una migración aparte.
7. **Estado remoto sin comprobar:** no se ha verificado si el TOTP está habilitado en el proyecto de Supabase remoto (en el entorno local aislado venía desactivado por defecto).

## Propuesta técnica (compatible con Supabase Auth)

### Etapa 1 — Exigir `aal2` a quien **ya** tiene un factor verificado
No convierte el MFA en obligatorio: solo cierra la evasión para quienes ya lo activaron.

- En `lib/auth/guard.ts`, `resolveSession()` obtiene el nivel con `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` (se calcula a partir del JWT de la sesión) y devuelve un estado nuevo `mfa_required` cuando `nextLevel === 'aal2' && currentLevel !== 'aal2'`.
- `requireActiveSession()` redirige ese estado a `/mfa/verify?from=<ruta>`.
- `authorize()` devuelve `null` en ese estado, de modo que **todas** las Server Actions quedan protegidas sin tocarlas una a una.
- `getSessionUser()` mantiene su contrato (las páginas de login y verificación lo usan).
- `proxy.ts` puede leer el claim `aal` del JWT como optimización, pero la comprobación real queda en el guard (el proxy sigue siendo solo una barrera optimista).

### Etapa 2 — Política para administradores (requiere decisión)
- Exigir que `ADMIN` tenga un factor verificado para entrar en `/admin` y para ejecutar acciones administrativas, redirigiendo a `/mfa/enroll` si no lo tiene.
- Acciones que deberían pedir `aal2` aunque la persona no sea administradora: cambio de contraseña (`changePasswordAction`), cambio de correo, baja de factor y eliminación de cuenta.

### Etapa 3 — Higiene
- Migración (revisada, no aplicada a producción) para eliminar `twoFactorEnabled` y `twoFactorSecret`.
- Confirmar en el panel de Supabase remoto que el TOTP está habilitado antes de exigir MFA a nadie.
- Códigos de recuperación: Supabase no ofrece códigos de respaldo para TOTP. `MfaVerifyForm` enlaza a `?mode=recovery`; hay que definir qué significa realmente ese modo (por ejemplo, restablecimiento asistido por un administrador) antes de exigir MFA.

## Pruebas necesarias
- Guard: sesión `aal1` con factor verificado → redirige a `/mfa/verify`; `aal2` → entra; sin factor → entra; `authorize()` devuelve `null` en `aal1` con factor verificado.
- Navegador: reproducir el escenario de esta auditoría y comprobar que `/dashboard` redirige a `/mfa/verify` hasta introducir el código, que el bucle de redirección no aparece y que la ruta de origen se respeta.
- Administradores: sin factor no acceden a `/admin`; con factor y `aal2` sí.

## Decisiones que necesito del propietario
1. ¿Implemento la **Etapa 1** (exigir `aal2` solo a quien ya tiene MFA)? Es el cambio de menor riesgo y cierra la evasión verificada.
2. ¿MFA **obligatorio para administradores** (Etapa 2)? Implica que los dos administradores actuales deberán enrolar un factor antes de volver a entrar en `/admin`.
3. ¿Qué debe hacer el modo `recovery` si se pierde el dispositivo?
4. ¿Autorizas comprobar la configuración de MFA del proyecto Supabase remoto (solo lectura)?

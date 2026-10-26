# Pruebas proporcionales y rápidas

- Documentación: revisar enlaces, alcance, diff y ausencia de datos privados.
- UI puramente visual: focus, responsive en tamaños de `DESIGN.md`, teclado, reduced motion, capturas cuando corresponda, typecheck.
- Servicios/acciones: test de éxito + rechazo por usuario ajeno/rol incorrecto + input inválido + estados; typecheck y tests relevantes.
- Citas: doble reserva/concurrencia, transiciones no permitidas, aislamiento entre pacientes.
- Chat: membresía, bloqueado, IDOR, notificaciones.
- Admin: privilegio de cada action, sanitización de entrada, efectos de Supabase Admin.
- Migración: prueba en entorno aislado y revisión hacia atrás; no lanzar contra producción.
- Antes de publicar: CI, regresión crítica y verificación explícita del usuario.

Si falla `lint` por configuración en el checkout, registrar el error real, no ocultarlo ni afirmar que pasó. No sustituir validación técnica por reloj.

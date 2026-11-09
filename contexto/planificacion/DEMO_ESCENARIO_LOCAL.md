# Escenario de demostración local

Script reproducible e idempotente para validar y presentar el Sprint 1. **Solo local**: `seed-demo-scenario.ts` se niega a ejecutarse si la API de Supabase o la base de datos no resuelven a `127.0.0.1`/`localhost`, o si `NODE_ENV=production`. `reset-local-db.sh` solo acepta contenedores `supabase_db_*kitsunova*`.

## Uso
```
# 1. Reconstruir la base local (borra usuarios de Auth, recrea `public` y reaplica supabase/migrations)
LOCAL_DB_CONTAINER=supabase_db_<proyecto-kitsunova> npm run demo:reset-local

# 2. Sembrar (variables de la pila local: NEXT_PUBLIC_SUPABASE_URL, clave de servicio, DATABASE_URL)
DEMO_PASSWORD='<contraseña de demostración>' npm run demo:seed
```
Sin `DEMO_PASSWORD` se genera una contraseña aleatoria y se muestra una sola vez. Ninguna contraseña se guarda en el repositorio. Volver a ejecutar el paso 2 actualiza en su lugar (ids deterministas) y desplaza las fechas respecto a hoy.

## Cuentas (misma contraseña)
| Rol | Correo |
|---|---|
| ADMIN | `admin.demo@kitsunova.local` |
| PSYCHOLOGIST | `psy.laura@`, `psy.carlos@`, `psy.maria@` `kitsunova.local` |
| USER | `user.ana@`, `user.diego@`, `user.sofia@` `kitsunova.local` |

## Datos que crea
| Entidad | Cantidad |
|---|---|
| Usuarios Auth = Usuarios Prisma = Perfiles | 7 |
| Perfiles de psicólogo (aprobados, verificados) | 3 |
| Franjas de disponibilidad (lun–vie, zona America/Bogota) | 15 |
| Citas (4 COMPLETED, 3 CONFIRMED, 3 PENDING, 1 CANCELLED, 1 NO_SHOW) | 12 (+1 de hoy si aún es posible) |
| Vínculos paciente–psicólogo (1 ACTIVE por usuario, 1 ENDED) | 4 |
| Conversaciones / mensajes bidireccionales | 3 / 9 |
| Hábitos | 9 |
| Talleres (2 APPROVED, 1 PENDING) / inscripciones | 3 / 5 |
| Recursos (2 APPROVED, 1 PENDING) | 3 |
| Reseñas / reportes de paciente | 3 / 4 |
| Derivaciones / notificaciones | 1 / 7 |

Reglas respetadas: cada cita cabe en la disponibilidad del psicólogo y no se solapa con otra viva (el script lo comprueba antes de escribir); un usuario nunca tiene dos vínculos ACTIVE; los contadores `rating`, `reviewsCount` y `patientsCount` se recalculan a partir de las filas.

## Limitaciones del modelo
- **No existe una tabla de registros de cumplimiento de hábitos**: `Habit` solo guarda `progress` y `status`. Por eso no se siembran registros diarios.
- Los scripts anteriores (`seed-demo-accounts.ts`, `seed-demo-data.ts`, `seed-supabase-auth.ts`) siguen en el repositorio con contraseñas de demostración fijas y no son idempotentes con citas y conversaciones; este escenario no depende de ellos.

## Para replicarlo en otro entorno
Necesita una pila Supabase local con el esquema de `supabase/migrations`, la clave de servicio local y `DATABASE_URL` local. En remoto no se ejecuta: el guardia lo impide a propósito.

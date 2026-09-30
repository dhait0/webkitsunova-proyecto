# Documentación del Proyecto WebKitsunova

## 1. Qué es el proyecto

WebKitsunova es la nueva base técnica de Kitsunova, una plataforma orientada al bienestar, los hábitos saludables y la conexión entre usuarios y psicólogos.

La versión nueva se está reconstruyendo como una aplicación web moderna con:

- Frontend en React + TypeScript
- Backend en Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- Docker para desarrollo local
- Jenkins para CI/CD

La intención de esta reconstrucción es reemplazar la base anterior en PHP/HTML/JS por una arquitectura más mantenible, escalable y preparada para despliegue moderno.

## 2. Objetivo general

Construir una plataforma web modular que permita:

- registrar y autenticar usuarios
- separar accesos por rol
- administrar perfiles y contenido
- gestionar módulos de bienestar, hábitos y comunidad
- preparar el sistema para crecer sin acoplamiento entre frontend y backend

## 3. Alcance funcional

La plataforma contempla inicialmente estos módulos:

- autenticación y sesiones
- registro de usuarios y psicólogos
- perfiles de usuario
- panel de usuario
- panel de psicólogo
- panel administrativo
- gestión de hábitos
- mensajería
- foro
- talleres
- recursos
- notificaciones
- configuración de cuenta
- 2FA

## 4. Actores del sistema

- Usuario final: usa la plataforma para registrar hábitos, consultar recursos y comunicarse.
- Psicólogo: gestiona su perfil profesional, citas, mensajes y talleres.
- Administrador: supervisa usuarios, psicólogos, reportes y contenido de la plataforma.

## 5. Requerimientos funcionales

### 5.1 Autenticación y acceso

- El sistema debe permitir registro de usuario.
- El sistema debe permitir inicio de sesión con correo y contraseña.
- El sistema debe soportar autenticación de dos pasos.
- El sistema debe cerrar sesión de forma segura.
- El sistema debe redirigir al usuario según su rol.
- El sistema debe bloquear el acceso a rutas privadas si no existe sesión válida.

### 5.2 Gestión de perfiles

- El sistema debe permitir crear y editar perfil personal.
- El sistema debe permitir guardar nombre, apellido, username, foto, bio y datos de contacto.
- El sistema debe permitir diferenciar perfil de usuario y perfil profesional.

### 5.3 Módulo de usuario

- El sistema debe permitir registrar hábitos.
- El sistema debe permitir eliminar hábitos.
- El sistema debe permitir registrar estados de ánimo.
- El sistema debe mostrar métricas del progreso del usuario.
- El sistema debe mostrar información de mascota/compañero virtual.
- El sistema debe permitir notificaciones dentro de la cuenta.

### 5.4 Módulo de psicólogo

- El sistema debe permitir que el psicólogo gestione su perfil profesional.
- El sistema debe permitir ver pacientes, mensajes y citas.
- El sistema debe permitir administrar disponibilidad y tarifas.
- El sistema debe permitir participar en actividades del sistema definidas para ese rol.

### 5.5 Módulo administrativo

- El sistema debe permitir listar usuarios y psicólogos.
- El sistema debe permitir aprobar o suspender cuentas según reglas del negocio.
- El sistema debe permitir gestionar reportes.
- El sistema debe permitir administrar contenidos y publicaciones.
- El sistema debe permitir consultar estadísticas del sistema.

#### Estado de implementación

Rutas disponibles bajo `/admin` (protegidas por `AdminRoute`, rol `ADMIN`):

| Ruta | Estado | Endpoint |
| --- | --- | --- |
| `/admin` | Operativa | `GET /api/admin/stats/*` |
| `/admin/users` | Operativa | `GET /api/admin/users`, `PATCH /api/admin/users/:id/status`, `DELETE /api/admin/users/:id` |
| `/admin/psychologists` | Operativa | `GET /api/admin/psychologists`, `PATCH /api/admin/psychologists/:id/approve` |
| `/admin/forum`, `/admin/messages`, `/admin/workshops`, `/admin/resources`, `/admin/reports`, `/admin/settings` | Pendiente | Sin modelo en Prisma |

Los módulos pendientes se muestran en el menú lateral como deshabilitados y marcados
"Pronto"; no son navegables. Cualquier ruta desconocida dentro de `/admin` muestra la
página 404 del panel.

La interfaz reutiliza un kit de componentes en `frontend/src/components/admin/`
(cabecera, tarjeta de estadística, badge de estado, barra de filtros, tabla,
paginación, estados de carga/vacío/error, modal, diálogo de confirmación y toasts)
y dos hooks en `frontend/src/hooks/` (`useDebouncedValue` para la búsqueda y
`useAdminList` para el ciclo de carga de listados paginados).

### 5.6 Comunidad y contenido

- El sistema debe permitir foros o publicaciones de comunidad.
- El sistema debe permitir mensajería entre actores autorizados.
- El sistema debe permitir talleres y recursos.
- El sistema debe permitir interacciones como reportar, comentar, guardar o valorar, según módulo.

## 6. Requerimientos no funcionales

### 6.1 Seguridad

- Las contraseñas deben almacenarse con hash seguro.
- Las sesiones deben mantenerse en cookies `httpOnly`.
- Las entradas del usuario deben validarse en backend.
- La base de datos no debe exponerse directamente al frontend.
- Los permisos deben depender del rol autenticado.

### 6.2 Rendimiento

- El frontend debe cargar rápido en navegación principal.
- Las consultas de backend deben ser eficientes y paginables cuando aplique.
- El sistema debe evitar duplicación de estado entre cliente y servidor.

### 6.3 Mantenibilidad

- El código debe estar separado por capas y responsabilidades.
- Los modelos de datos deben vivir en Prisma.
- La API debe ser predecible y estable.
- La documentación debe actualizarse cuando cambie el contrato funcional.

### 6.4 Escalabilidad

- La estructura debe soportar crecimiento por módulos.
- El frontend debe permitir agregar nuevas rutas sin reescribir toda la app.
- El backend debe permitir agregar nuevos recursos sin romper los existentes.

### 6.5 Portabilidad

- El sistema debe poder levantarse en desarrollo con Docker.
- El sistema debe permitir despliegue automatizado.
- El proyecto debe ser reproducible desde variables de entorno.

### 6.6 Usabilidad

- La interfaz debe ser clara para usuarios no técnicos.
- El acceso por rol debe ser transparente.
- Los formularios deben mostrar errores comprensibles.
- La navegación debe ser consistente entre secciones.

## 7. Arquitectura técnica

### Frontend

- React
- TypeScript
- Vite
- React Router

### Backend

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL

### Infraestructura

- Docker
- Docker Compose
- Jenkins

## 8. Criterio de evolución

La migración debe hacerse por etapas:

1. base técnica
2. autenticación
3. modelo de datos
4. panel de usuario
5. panel de psicólogo
6. panel administrativo
7. módulos de comunidad y soporte

## 9. Nota de implementación

La carpeta actual del proyecto está nombrada como `webkitsunova_proyecto/`.

# AUTH.md — Autenticación y autorización

## Propósito

Este documento describe las decisiones de autenticación y autorización de WebKitsunova.

La fuente principal de autenticación es Supabase Auth.

---

# 1. Proveedor

Proveedor de autenticación:

```text
Supabase Auth
```

La aplicación debe evitar construir un sistema de autenticación propio salvo que exista una razón técnica clara.

---

# 2. Roles funcionales

Roles conocidos de la aplicación:

```text
USER
PSYCHOLOGIST
ADMIN
```

Estos roles representan permisos funcionales de Kitsunova.

No confundirlos con los roles internos de Supabase Auth, como:

```text
authenticated
anon
```

---

# 3. Fuente del rol

Cuando se utilice metadata de Supabase para almacenar el rol funcional, preferir:

```ts
user.app_metadata.role
```

No usar:

```ts
user.role
```

para representar el rol funcional de Kitsunova.

---

# 4. Sesión

La sesión se gestiona con Supabase Auth.

No cambiar el mecanismo de sesión sin una razón técnica y sin revisar el impacto en:

- SSR
- Server Components
- middleware
- Route Handlers
- protección de rutas
- renovación de sesión
- despliegue en Vercel

Si la aplicación migra completamente a Next.js, revisar la estrategia recomendada por Supabase para SSR y cookies.

---

# 5. Autorización

La autorización debe existir también en servidor.

Nunca confiar únicamente en:

- ocultar botones
- proteger componentes visualmente
- rutas del cliente
- validaciones del frontend

Toda operación sensible debe validar permisos del lado servidor.

---

# 6. Áreas protegidas

Áreas conocidas:

```text
/user
/psychologist
/admin
```

Cada área debe verificar:

1. existencia de sesión válida
2. rol correspondiente
3. permisos adicionales cuando sea necesario

---

# 7. Cambios sensibles

Tratar con especial cuidado cualquier cambio relacionado con:

- login
- logout
- registro
- sesiones
- refresh token
- JWT
- roles
- permisos
- MFA
- recuperación de contraseña
- cambio de contraseña
- metadata de usuario

Para estas tareas ampliar el análisis antes de modificar código.

---

# 8. Administración

Las operaciones administrativas deben ejecutarse únicamente en contexto de servidor.

Nunca exponer en frontend:

- service role key
- secretos de Supabase
- claves administrativas
- credenciales privadas

---

# 9. Supabase Admin

Cuando se necesiten operaciones administrativas de Supabase:

- ejecutarlas desde servidor
- utilizar variables de entorno privadas
- evitar importar clientes administrativos en código cliente
- verificar explícitamente permisos antes de ejecutar acciones sensibles

---

# 10. Validación de usuario

Cuando un endpoint, action o Route Handler requiera autenticación:

1. obtener la sesión de manera segura
2. validar el usuario
3. obtener el rol funcional
4. validar permisos
5. ejecutar la operación

Evitar realizar consultas redundantes cuando la identidad ya fue validada de forma confiable dentro del mismo flujo.

---

# 11. MFA

Si se implementa MFA:

- seguir capacidades soportadas por Supabase Auth
- separar enrollment, challenge y verify
- contemplar recuperación
- agregar pruebas de autorización
- documentar impacto en sesiones existentes

No habilitar MFA parcialmente en producción sin un flujo completo.

---

# 12. Seguridad

Nunca registrar en logs:

- access tokens completos
- refresh tokens
- contraseñas
- secretos
- service role keys

Evitar exponer información sensible en mensajes de error.

---

# 13. Entornos

Mantener separados:

- desarrollo
- preview
- producción

No utilizar credenciales privilegiadas de producción durante pruebas locales salvo necesidad explícita.

---

# 14. Testing

Priorizar pruebas para:

- usuario no autenticado
- usuario autenticado
- rol incorrecto
- rol correcto
- sesión expirada
- recurso inexistente
- intento de acceso no autorizado

---

# 15. Notas heredadas

Si durante la migración existen todavía middlewares anteriores como:

```text
requireAuth
requireRole
```

documentar aquí su comportamiento actual antes de reemplazarlos.

No expandir una arquitectura legacy de autenticación si el proyecto ya está migrando a una solución full-stack moderna.

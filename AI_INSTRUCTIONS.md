# 🚗 PROMPT CONSTRUCCIÓN PLATAFORMA TRANSPORTES MEDELLÍN TRAVEL

**Documentación Estratégica para Desarrollador IA**

---

## 📌 ANTES DE COMENZAR: LEE ESTO COMPLETAMENTE

Este documento te explica QUÉ debe hacer cada sección, no CÓMO hacerlo. Tu objetivo es entender la experiencia del usuario, los flujos, y lo que necesita cada página. Luego construirlo

Este es un documento de requerimientos técnicos (PRD) excepcionalmente detallado y bien estructurado. Lo entiendo perfectamente. No es solo una página web, es un Sistema de Gestión de Recursos Empresariales (ERP) ligero enfocado en transporte turístico, con una pasarela de pagos integrada y lógica de negocio compleja (precios dinámicos, roles de aliados, estados de reserva).

**Orden de construcción**: Sigue las FASES en orden. No saltees. Cada fase depende de la anterior.

Cada seccion se debe probar en su totalidad antes de pasar a la siguiente

CUALQUIER COSA QUE NO ENTIENDAS LA IDEA O TE GENERE DUDAS PARA IMPLEMENTARLO PREGUNTAME PRIMERO ANTES DE IMPLEMENTARLO

---

## 🎨 SECCIÓN 0: GUÍA GLOBAL DE DISEÑO Y ESTILOS

### 0.1 Visión de Diseño

Esta plataforma debe ser:
- **Simple y limpia**: No confundir al usuario con demasiada información
- **Moderna pero profesional**: Que se vea cara pero accesible
- **Intuitiva**: El usuario debe saber qué hacer sin pensar
- **Responsive primero**: La mayoría de usuarios usan móvil (370px+)
- **Rápida**: Sin animaciones pesadas que ralenticen
- **Accesible**: Contraste bueno, botones grandes, texto legible

**Referencia de estilos**: 
- Airbnb (simplicidad, espacios en blanco)
- Uber (claridad en CTA, progreso visual)
- Booking.com (tablas organizadas, calendarios intuitivos)

### 0.2 Tipografía

**Fuente Principal**: Ciabatta (ya existe en el proyecto)
- **Weights**: Light (300), Medium (500), Bold (700)
- **H1 (Títulos grandes)**: Ciabatta Bold 48px (desktop) / 32px (móvil)
- **H2 (Títulos secciones)**: Ciabatta Bold 36px (desktop) / 24px (móvil)
- **H3 (Subtítulos)**: Ciabatta Medium 24px (desktop) / 18px (móvil)
- **Body text**: Ciabatta Light 16px (desktop) / 14px (móvil)
- **Small text (helpers, labels)**: Ciabatta Light 12px
- **Line height**: 1.6 para body, 1.2 para títulos

**Implementación**: Importar en globals.css, aplicar con clases reutilizables

### 0.3 Paleta de Colores

**Colores Primarios**:
```
- Negro Principal: #0A0A0A (fondo oscuro, text headers)
- Blanco: #FFFFFF (fondos claros, text)
- Gris Neutral: #F5F5F5 (fondos secundarios)
- Gris Oscuro: #333333 (texto secundario)
```

**Colores de Marca (Acento)**:
```
- Amarillo Oro Principal: #D6A75D (botones, highlights)
- Amarillo Claro: #F2C94C (hover, accents suaves)
```

**Colores de Estados (Reservas)**:
```
- Pendiente por Cotización: #EF4444 (Rojo)
- Confirmada - Pendiente Pago: #9CA3AF (Gris)
- Pagada - Pendiente Asignación: #3B82F6 (Azul)
- Asignada - Pendiente Completar: #166534 (Verde Oscuro)
- Completada: #86EFAC (Verde Claro)
- Cancelada: #EF4444 (Rojo)
```

**Guía de uso**:
- Botones principales: Amarillo oro (#D6A75D)
- Botones secundarios: Gris claro con borde
- Backgrounds: Blanco o gris neutral
- Texto: Negro principal o gris oscuro
- Accents/Highlights: Amarillo claro (#F2C94C)

### 0.4 Espaciado y Layout

**Espaciado Base** (múltiplos de 4px):
```
- 4px: Muy pequeño (gaps micro)
- 8px: Pequeño (gaps buttons)
- 12px: Pequeño-medio (padding inputs)
- 16px: Base (padding cards)
- 24px: Medio (margen secciones móvil)
- 32px: Grande (margen secciones desktop)
- 48px: Muy grande (padding hero)
```

**Layout Responsive**:
```
- Móvil (< 768px): 1 columna, padding 16px
- Tablet (768-1024px): 2 columnas, padding 24px
- Desktop (> 1024px): 3-4 columnas, padding 32px, max-width 1280px
```

**Bordes y Radios**:
```
- Botones: border-radius 8px
- Cards: border-radius 12px
- Inputs: border-radius 6px
- Modales/Dialogs: border-radius 16px
```

### 0.5 Componentes Reutilizables

**Botones**:
- **Principal** (CTA): Fondo amarillo oro, texto negro, 12px padding vertical, 24px horizontal
- **Secundario**: Borde amarillo, texto amarillo, fondo transparente
- **Pequeño**: Menos padding (8px v, 16px h)
- **Hover**: Oscurecer 10% o mover -2px arriba
- **Disabled**: 50% opacity

**Inputs y Formularios**:
- **Height**: 44px (móvil friendly, clickeable)
- **Border**: 1px solid #E5E7EB (gris claro)
- **Focus**: Borde amarillo oro 2px
- **Placeholder**: Gris oscuro, 12px
- **Label**: Arriba, Ciabatta Medium 14px, gris oscuro

**Cards**:
- **Background**: Blanco
- **Border**: Opcional, 1px gris claro
- **Shadow**: 0 1px 3px rgba(0,0,0,0.1)
- **Hover**: Shadow más fuerte 0 4px 12px rgba(0,0,0,0.15)
- **Padding**: 16px-24px según contexto

**Badges/Pills** (estados):
- **Height**: 32px
- **Padding**: 8px 12px
- **Border-radius**: 20px
- **Font**: Ciabatta Medium 12px
- **Color**: Según estado (rojo, gris, azul, etc)

**Loading/Spinner**:
- Icono giratorio amarillo oro (24px)
- Puede con o sin texto

**Modales**:
- **Backdrop**: Negro con 50% opacity
- **Dialog**: Blanco, border-radius 16px, shadow fuerte
- **Padding**: 32px
- **Header**: Ciabatta Bold 24px
- **Close button**: X arriba derecha, 16px tamaño

### 0.6 Animaciones (Sutiles)

**Principios**:
- Rápidas (200-300ms)
- Easing: ease-in-out
- Solo en hover/cambios importantes
- NO parallax pesados que ralenticen móvil

**Tipos**:
- **Fade in**: 0 → 1 opacity, 300ms (secciones al entrar)
- **Slide in**: 20px arriba → 0, 300ms (cards)
- **Scale hover**: 1 → 1.02, 200ms (buttons, cards)
- **Color change**: 200ms (hover effects)

### 0.7 Iconografía

**Usar**: Feather Icons o Lucide React (ligeros, simples)
**Tamaños**:
- Pequeños (labels): 16px
- Medianos (botones): 20px
- Grandes (secciones): 32px-48px

**Colores**:
- Iconos principales: Negro (#0A0A0A)
- Iconos acento: Amarillo oro (#D6A75D)
- Iconos estados: Según el estado (rojo, verde, etc)

### 0.8 Principios de UX

**Claridad sobre adornos**: Si no sirve, no lo pongas
**Confirmación visual**: El usuario siempre sabe qué pasó
**Microinteracciones**: Feedback en cada acción
**Accesibilidad**: Contraste mínimo 4.5:1, botones 44px mín
**Flujos lineales**: Menos opciones, caminos claros

---

## 🏗️ FASES DE CONSTRUCCIÓN (ORDEN CRÍTICO)

### ⚠️ NOTA IMPORTANTE

Cada fase DEBE funcionar antes de pasar a la siguiente. No dejes "para después".

---

## FASE 1: SETUP Y CONFIGURACIÓN

### Qué debes hacer:

1. **Crear proyecto Next.js 14+** con TypeScript
2. **Instalar dependencias** necesarias (Prisma, NextAuth, emails, etc)
3. **Conectar a BD PostgreSQL Neon** (tabla bd_antigua ya existe)
4. **Leer carpeta "imagenes"** del usuario y organizarlas
5. **Leer archivo .env existente** para extraer credenciales Bold
6. **Crear archivo .env.local** con todas las variables
7. **Crear estructura de carpetas** exactamente como se especifica

### Qué espero:

- Proyecto funcionando localmente (`npm run dev`)
- BD conectada y lista (`npx prisma migrate dev`)
- No hay variables hardcodeadas
- Todas las imágenes organizadas en `/public`

### Antes de pasar a FASE 2:

- ✅ npm run build (sin errores)
- ✅ npm run dev (funciona sin problemas)
- ✅ BD conectada
- ✅ Imágenes en carpetas correctas

---

## FASE 2: SCHEMA BASE DE DATOS

### Qué debes hacer:

Crear un schema Prisma que defina EXACTAMENTE:
- **Usuarios** (admin password)
- **Aliados** (Hoteles y Airbnbs con códigos únicos)
- **Servicios** (Tours, transportes, con precios dinámicos)
- **Vehículos** (Sedan, SUV, Van con capacidades)
- **Conductores** (Con disponibilidad y WhatsApp)
- **Reservas** (EL modelo más importante - toda la info)
- **Asistentes** (Personas en cada reserva)
- **Adicionales** (Servicios opcionales: guía, almuerzo, etc)
- **Tarifas por Aliado** (Precios especiales por hotel/airbnb)
- **Calificaciones** (Sistema 1-5 estrellas)
- **BdAntigua** (Tabla histórica existente - SOLO LECTURA)

### Qué espero:

- Cada modelo tiene sus campos correctos
- Relaciones entre modelos están bien (foreign keys, cascades)
- Índices en campos que se buscan (código, estado, fecha)
- Timestamps (createdAt, updatedAt) en todo
- Sin datos hardcodeados

### Antes de pasar a FASE 3:

- ✅ `npx prisma generate` sin errores
- ✅ `npx prisma migrate dev` crea tabla sin problemas
- ✅ Puedes conectar a la BD y ver tablas
- ✅ Tabla bd_antigua se ve en la BD

---

## FASE 3: AUTENTICACIÓN ADMIN

### Qué debes hacer:

Implementar login seguro para administradores:

**Página de login** (`/admin/login`):
- Input para contraseña (SOLO contraseña, no usuario)
- Contraseña hardcodeada por seguridad: "medellin2025"
- Si es correcta: crear sesión
- Si es incorrecta: mostrar error rojo "Contraseña incorrecta"
- Botón submit está deshabilitado si input vacío

**Protección de rutas**:
- Rutas `/admin/**` requieren login
- Si no logged in: redirige a login
- Si logged in: permite acceso
- Botón "Salir" en dashboard cierra sesión

**Session visible**:
- Header de admin muestra "Conectado" o nombre usuario
- LocalStorage guarda token de sesión (NextAuth)

### Qué espero:

- No puedes entrar a `/admin/dashboard` sin login
- Login funciona con contraseña "medellin2025"
- Sesión persiste después de refrescar
- Cierre de sesión funciona

### Antes de pasar a FASE 4:

- ✅ Login funciona
- ✅ Protección de rutas funciona
- ✅ Puedes entrar a dashboard después de login
- ✅ Botón salir funciona

---

## FASE 4: SISTEMA DE EMAILS

### Qué debes hacer:

Implementar envío automático de emails en 6 triggers diferentes:

**Trigger 1 - Reserva Confirmada**:
- Se envía cuando cliente crea reserva
- Contiene: Código reserva, detalles, link tracking, botón pago (si no es hotel)
- Idioma: El que eligió el cliente (ES/EN)

**Trigger 2 - Cambio de Estado**:
- Se envía cuando admin cambia estado de reserva
- Ejemplo: "Tu reserva pasó de 'Confirmada' a 'Pagada'"
- Contiene: Nuevo estado, detalles, link tracking

**Trigger 3 - Pago Aprobado**:
- Se envía cuando pago entra en Bold
- Contiene: Recibo, confirmación, nuevo estado, link tracking

**Trigger 4 - Conductor Asignado**:
- Se envía cuando admin asigna conductor a reserva
- Contiene: Nombre conductor, WhatsApp, vehículo, detalles viaje

**Trigger 5 - Servicio Completado**:
- Se envía cuando reserva pasa a "Completada"
- Contiene: Link para calificar (1-5 estrellas + comentario)
- Asunto alegre: "¡Gracias por elegirnos! Califica tu experiencia"

**Trigger 6 - Cotización Lista**:
- Se envía cuando cliente selecciona municipio "Otro" (cotización manual)
- Contiene: Mensaje "Estamos preparando tu cotización, pronto te la enviaremos"
- NO tiene botón pagar (espera cotización manual)

### Qué espero:

- Emails llegan en < 3 segundos después de trigger
- Emails HTML bien formateados y profesionales
- Logo empresa en cada email
- Idiomas funcionan: ES/EN correctamente
- Todos los datos dinámicos (nombre, precio, código, etc)
- NO hay info hardcodeada en templates

### Antes de pasar a FASE 5:

- ✅ Prueba cada trigger (crea una reserva, observa email)
- ✅ Emails recibidos en inbox o spam
- ✅ Idiomas funcionan
- ✅ Todos los datos son dinámicos

---

## FASE 5: SISTEMA DE PAGOS (BOLD.CO)

### Qué debes hacer:

Integrar plataforma de pagos Bold.co para aceptar tarjetas:

**Generación de Hash**:
- Cuando reserva se confirma: generar hash seguridad
- Hash valida que el pago es legítimo

**Botón de Pago**:
- Aparece en página tracking si estado = "Confirmada - Pendiente por Pago"
- Al hacer click: redirige a formulario pagos Bold
- Usuario entra tarjeta y completa pago

**Después del Pago**:
- Bold redirige a página `/payment/result`
- Página muestra estado: "Aprobado", "Rechazado" o "Pendiente"
- Si aprobado: reserva cambia automáticamente a "Pagada"
- Si rechazado: opción de reintentar
- Si pendiente: espera 3-5 minutos

**Webhook Bold**:
- Bold notifica cuando pago se procesa
- Automáticamente actualiza BD sin que usuario haga nada

### Qué espero:

- Botón pago solo aparece cuando corresponde
- Al pagar: BD actualiza automáticamente
- Email de confirmación llega después de pago
- Reserva es impagable si ya pagó
- Manejo de errores: usuario siempre sabe qué pasó

### Antes de pasar a FASE 6:

- ✅ Botón pago aparece/desaparece correctamente
- ✅ Pago test en Bold funciona
- ✅ BD actualiza después de pago
- ✅ Email de confirmación llega
- ✅ Webhook Bold funciona

---

## FASE 6: API REST - CRUD BÁSICO

### Qué debes hacer:

Crear endpoints API para que frontend pueda leer/escribir datos:

**Endpoints Reservas**:
- `POST /api/reservas` - Crear nueva reserva
- `GET /api/reservas` - Listar todas (con filtros por estado)
- `GET /api/reservas/[id]` - Ver una reserva
- `PUT /api/reservas/[id]` - Actualizar reserva
- `DELETE /api/reservas/[id]` - Cancelar/eliminar

**Endpoints Servicios**:
- `GET /api/servicios` - Listar servicios activos
- `POST /api/servicios` - Admin: crear servicio
- `PUT /api/servicios/[id]` - Admin: editar
- `DELETE /api/servicios/[id]` - Admin: eliminar

**Endpoints Aliados**:
- `GET /api/aliados` - Listar aliados
- `POST /api/aliados` - Admin: crear aliado (genera código 6 dígitos)
- `PUT /api/aliados/[id]` - Admin: editar
- `DELETE /api/aliados/[id]` - Admin: eliminar

**Endpoints Conductores**:
- `GET /api/conductores` - Listar conductores
- `POST /api/conductores` - Admin: crear
- `PUT /api/conductores/[id]` - Admin: editar
- `DELETE /api/conductores/[id]` - Admin: eliminar

**Endpoints Vehículos**:
- `GET /api/vehiculos` - Listar vehículos
- `POST /api/vehiculos` - Admin: crear
- `PUT /api/vehiculos/[id]` - Admin: editar
- `DELETE /api/vehiculos/[id]` - Admin: eliminar

### Qué espero:

- Cada endpoint devuelve JSON estructurado
- Si hay error: respuesta 400/500 con mensaje claro
- Validaciones en servidor (no confiar en cliente)
- Los datos nunca se pierden: cascades en BD
- Filtros funcionan: por estado, fecha, servicio, etc

### Antes de pasar a FASE 7:

- ✅ Prueba crear una reserva: POST `/api/reservas`
- ✅ Prueba listar: GET `/api/reservas`
- ✅ Prueba actualizar: PUT `/api/reservas/[id]`
- ✅ Todos devuelven JSON válido
- ✅ No hay errores en consola

---

## FASE 7: LANDING PAGE

### Qué debes hacer:

Crear página de inicio que venda los servicios. Tiene 8 secciones que bajan en scroll:

**Sección 1: HERO**
- Imagen grande (full width, full height mínimo 400px)
- Título grande "Explora Medellín" o similar
- Subtítulo "Transporte seguro y tours increíbles"
- Botón grande "Ver Servicios" que baja a sección 3
- Fondo oscuro (negro)
- Efecto parallax suave (imagen se mueve menos que scroll)

**Sección 2: QUIÉNES SOMOS**
- Párrafo corto explicando qué es la empresa (3-4 líneas)
- 3 iconos con beneficios:
  - 🔒 Seguridad Garantizada
  - ⏰ Puntualidad
  - 👑 Calidad Premium
- Cada icono: grande (48px), amarillo oro, con texto debajo
- Fondo blanco

**Sección 3: NUESTROS SERVICIOS**
- Título "Nuestros Servicios"
- Grid de 6 cards (móvil: 1 col, tablet: 2, desktop: 3)
- Cada card:
  - Imagen del tour (300x200)
  - Nombre servicio (bold)
  - Descripción corta (2-3 líneas)
  - Botón "Reservar Ahora" (amarillo)
- Al hover: card levemente arriba, shadow más fuerte
- Los servicios vienen del API (no hardcoded)

**Sección 4: POR QUÉ ELEGIRNOS**
- 6 características (en columnas):
  - 👨‍✈️ Conductores Profesionales
  - 🚗 Vehículos Modernos
  - 🤝 Atención Personalizada
  - 💰 Precios Competitivos
  - 📞 Soporte 24/7
  - 🗺️ Experiencia Local
- Cada uno: ícono (32px) + título + descripción corta
- Fondo gris claro
- Grid 2-3 columnas

**Sección 5: CÓMO FUNCIONA**
- Título "Cómo Funciona"
- Timeline vertical de 4 pasos:
  1. Elige tu Servicio
  2. Personaliza tu Viaje
  3. Confirma y Paga
  4. Disfruta el Viaje
- Cada paso: número (círculo amarillo), título, descripción
- Línea vertical conecta los pasos
- Fondo blanco

**Sección 6: TESTIMONIOS**
- Título "Lo Que Dicen Nuestros Clientes"
- Carrusel de testimonios (swipe en móvil)
- Cada testimonio muestra:
  - ⭐⭐⭐⭐⭐ (estrellas)
  - Comentario del cliente (itálica)
  - Nombre cliente
  - Descripción (ej: "Tour Guatapé")
- SOLO muestra testimonios donde esPublica = true
- Si no hay testimonios públicos: no aparece nada
- Fondo gris claro

**Sección 7: CALL TO ACTION FINAL**
- Fondo amarillo oro
- Título: "¿Listo para la aventura?"
- Botón grande "Reserva Ahora" que va a /reservas
- Párrafo pequeño: "Descubre lo mejor de Medellín"
- Centrado

**Sección 8: FOOTER**
- Fondo negro
- 3 columnas:
  1. Logo + "Transportes Medellín Travel"
  2. Enlaces: Home | Reservas | Términos | Privacidad
  3. Contacto: 
     - WhatsApp: +57 317 5177409 (link clickeable)
     - Instagram: @transportesmedellintravel (link a instagram)
     - Email: medellintraveltransportes@gmail.com
- Texto blanco, pequeño
- Copyright: "© 2024 Transportes Medellín Travel"

**Header (aparece en toda la página)**:
- Logo empresa (nav.png) + nombre
- Navegación: Servicios | Cómo Funciona | Testimonios
- Botón toggle idioma: ES/EN
- Botón "Soy Aliado" (llama a modal de login)
- Botón "Reservar" (amarillo, grande)
- En móvil: menú hamburguesa
- Efecto: fondo transparente al principio, se vuelve negro sólido al scrollear

**Modal Acceso Aliado**:
- Aparece cuando hace click "Soy Aliado"
- Input para código de 6 dígitos
- Valida que código exista en BD
- Si válido: guarda en localStorage, va a /reservas
- Si inválido: muestra error "Código no válido"
- Puede cerrar presionando ESC

### Qué espero:

- Landing responsive: se ve bien en 375px, 768px, 1024px
- Todos los datos vienen del API (servicios, testimonios)
- Idiomas funcionan: ES/EN en toda la landing
- Cambio de idioma persiste (localStorage)
- Link "Soy Aliado" funciona y valida código
- Scroll suave entre secciones
- Animaciones sutiles (fade in, slide, scale)
- Mobile primero: botones grandes (44px mín)

### Antes de pasar a FASE 8:

- ✅ Landing se ve bien en móvil (375px)
- ✅ Servicios cargan desde API
- ✅ Testimonios solo públicos aparecen
- ✅ Idioma ES/EN funciona
- ✅ Modal acceso aliado funciona
- ✅ Header responsive y sticky
- ✅ Todos los links funcionan

---

## FASE 8: SISTEMA DE RESERVAS (CATÁLOGO + WIZARD)

### Qué debes hacer:

Crear página `/reservas` donde clientes eligen servicio y reservan. Tiene 2 secciones:

**SECCIÓN A: CATÁLOGO DE SERVICIOS**

Página se abre con catálogo mostrando todos los servicios:
- Grid de cards (igual a landing) mostrando servicios activos
- Al hacer click en una card: abre WIZARD modal
- Si viene con código de aliado (localStorage): solo muestra servicios para ese aliado

**SECCIÓN B: ACCESO PARA HOTELES**

Apartado especial para hoteles:
- Texto: "¿Eres gestor de hotel? Ingresa tu código"
- Input para código de 6 dígitos (OCULTO si ya tiene código)
- Botón "Acceder"
- Valida código en BD
- Si válido:
  - Guarda código en localStorage
  - Muestra nombre del hotel en badge (arriba)
  - Recarga catálogo mostrando solo servicios para ese hotel
  - Muestra botón "Ver Mis Reservas"

**SECCIÓN C: MIS RESERVAS (solo para aliados)**

Tabla que muestra SOLO las reservas del hotel/airbnb:
- Columnas: Código | Cliente | Servicio | Fecha | Estado | Acciones
- Filtros: Rango de fechas, servicio, estado
- Click en fila: abre modal con detalles
- Si es HOTEL (no Airbnb): botón "Cancelar" (solo si faltan >24h)
- Si es Airbnb: sin botón cancelar

---

### MODAL WIZARD DE RESERVA (5 PASOS)

Cuando cliente hace click en servicio: abre modal con 5 pasos para completar reserva.

**PASO 0: INFORMACIÓN DEL SERVICIO**
- Muestra:
  - Imagen servicio
  - Nombre (bold)
  - Descripción completa
  - "Incluye:" lista de qué está incluido
  - "Servicios adicionales:" lista de add-ons disponibles
- Botón: "Continuar" (amarillo, grande)
- Botón: "Volver" (gris, pequeño)

**PASO 1: DETALLES DEL VIAJE**

Campos comunes (TODOS los servicios):

1. **Idioma más hablado**: Dropdown ES/EN
   - Importante porque algunos tours disponibles en idioma específico

2. **Fecha y Hora**: Date/time picker
   - Mínimo: hoy
   - Máximo: 3 meses adelante
   - Al seleccionar: valida si aplica recargo nocturno
   - Si aplica: muestra badge "⚠️ +$X recargo nocturno"

3. **Municipio**: Dropdown con 6 opciones
   - Medellín ($0)
   - Sabaneta ($15,000)
   - Bello ($18,000)
   - Itagüí ($12,000)
   - Envigado ($10,000)
   - Otro (requiere cotización manual)
   
   ⚠️ **Si selecciona "Otro"**:
   - Cotizador oculto (no muestra total)
   - Estado de reserva: "Pendiente por cotización"
   - Email al cliente: "Estamos preparando tu cotización"
   - Admin debe cotizar manualmente

4. **Número de Pasajeros**: Input numérico (1-15)
   - Mostrará ilustración dinámica del vehículo
   - Sistema automático: según cantidad de pasajeros selecciona vehículo
   - Muestra imagen PNG del vehículo seleccionado

5. **Botón Asistencia**: Link gris/pequeño
   - Texto: "¿Necesitas este servicio con múltiples recogidas o petición personalizada?"
   - Al hacer click: abre WhatsApp prerellenado con mensaje al número de la empresa
   - Cierra el modal

**CAMPOS ESPECÍFICOS POR SERVICIO** (según tipo):

Si es **TRANSPORTE AEROPUERTO**:
- ¿Desde o hacia aeropuerto?: Radio buttons
- ¿Cuál aeropuerto?: Dropdown (José María Córdova o Olaya Herrera)
- Número de vuelo: Input text

Si es **TOURS**:
- Lugar de recogida: Input text (ej: "Hotel XYZ")
- ¿Guía certificado?: Checkbox (agrega $X al precio)

Si es **TOUR GUATAPÉ**:
- ¿Vuelta en bote?: Checkbox
- Cantidad almuerzos: Dropdown (0, 1, 2)
- (Cada opción agrega/resta precio)

Si es **TOUR ATV**:
- Cantidad de motos: Selector 1-12 (con botones +/-)
- (Cada moto suma $X)

Si es **TOUR PARAPENTE**:
- Cantidad de participantes: 1-6

**COTIZADOR DINÁMICO** (lado derecho o abajo en móvil):
- Recuadro amarillo con:
  - "Cotización: $XXX,XXX" (grande, bold)
  - Actualiza en tiempo real cuando:
    - Cambia municipio
    - Cambia fecha/hora (recargo nocturno)
    - Agrega adicionales
    - Cambia cantidad pasajeros

Si municipio = "Otro":
- Muestra: "Requiere cotización manual"
- No muestra precio

---

**PASO 2: INFORMACIÓN DE CONTACTO**

Cliente ingresa datos para contactarlo:

1. **Nombre Completo**: Input text
   - Obligatorio
   - Mínimo 3 caracteres

2. **WhatsApp**: Input teléfono
   - Obligatorio
   - Valida formato +57 o 10 dígitos
   - Este es el número que se usa para coordinar

3. **Email**: Input email
   - Obligatorio
   - Valida formato correcto
   - Aquí llegan los emails de confirmación

4. **Lista de Asistentes**: Sección especial
   - Tabla con columnas: Nombre | Tipo Doc | Número Doc | Acciones
   - Inicialmente: 1 fila en blanco
   - Botón "+ Agregar Asistente": agrega otra fila
   - Cada fila tiene botón 🗑️ para borrar
   - Mínimo 1 asistente
   - Campos:
     - Nombre: input text
     - Tipo documento: dropdown (CC, PASAPORTE, TI, CE)
     - Número documento: input text
   - Nota: "Los asistentes aparecerán en el recibo"

---

**PASO 3: NOTAS Y RECOMENDACIONES**

Cliente puede agregar peticiones especiales:

- **Campo de texto** grande (textarea, 5 líneas)
- Label: "¿Algo especial que debamos saber?"
- Placeholder: "Ej: Viajo con adultos mayores | Viajo con mascotas | Necesito silla de bebé | Viajo con persona de movilidad reducida"
- Opcional (no obligatorio)
- Máximo 500 caracteres
- Contador: "X/500"

---

**PASO 4: RESUMEN (FACTURA)**

Muestra TODO lo que va a pagar:

**Encabezado**:
- Título: "Resumen de tu Reserva"
- Código temporal (se genera cuando llega a este paso)

**Detalles del Servicio** (readonly):
- Servicio: "Tour Guatapé"
- Fecha: "15 de Enero 2025, 8:00 AM"
- Municipio: "Medellín"
- Pasajeros: "4 personas"
- Vehículo: "Van"

**Desglose de Precios**:
```
Precio Base (servicio + vehículo)    $150,000
Vuelta en bote                        $30,000
Almuerzos (2)                         $60,000
                                      --------
Subtotal                              $240,000

Recargo nocturno (si aplica)          $20,000
Tarifa Municipio                      $0
Descuento Aliado (si aplica)          -$10,000
                                      --------
TOTAL A PAGAR                        $250,000
```

**Información Cliente** (pequeño, referencia):
- Nombre: Juan Pérez
- WhatsApp: +573157177409
- Email: juan@email.com

**Botones**:
- "Editar" (gris, pequeño) - vuelve a pasos anteriores
- "Confirmar Reserva" (amarillo, grande, bold)

---

**PASO 5: CONFIRMACIÓN**

Después de confirmar, muestra:

**Si es CLIENTE INDEPENDIENTE**:
- ✅ Ícono grande verde
- Mensaje: "¡Reserva Confirmada!"
- Texto: "Te hemos enviado un email con los detalles. Ahora debes realizar el pago."
- Datos mostrados:
  - Código reserva (ej: "RES8X3K2")
  - Monto a pagar
  - Email de confirmación
- Botones:
  - "Ver Mi Reserva" (amarillo) → va a `/tracking/RES8X3K2`
  - "Volver al Catálogo" (gris)
- El link tracking tiene botón de pago Bold

**Si es HOTEL** (pagará en efectivo):
- ✅ Ícono grande azul
- Mensaje: "¡Reserva Registrada!"
- Texto: "El cliente deberá pagar $XXX en el momento del viaje"
- Código reserva
- Link especial para dar al cliente: `/tracking/RES8X3K2?hotel=true` (sin botón pago)
- Botones:
  - "Ver Mis Reservas" (amarillo)
  - "Nueva Reserva" (gris)

**Email enviado automáticamente**:
- Asunto: "Reserva Confirmada - RES8X3K2"
- Contiene: Todos los detalles + link tracking
- Idioma: el que eligió (ES/EN)

---

### Qué espero de FASE 8:

- Catálogo carga servicios del API
- Wizard modal funciona en los 5 pasos
- Cotizador dinámico actualiza en tiempo real
- Validaciones en cliente (nombre, email, etc)
- Si municipio = "Otro": no muestra precio, estado "Pendiente cotización"
- Asistentes: puedo agregar/eliminar
- Resumen muestra desglose correcto
- Confirmar reserva crea registro en BD
- Email llega
- Redirección a tracking funciona
- Acceso aliados: código valida, muestra solo sus servicios
- Tabla mis reservas: filtros funcionan

### Antes de pasar a FASE 9:

- ✅ Puedo completar una reserva (cliente)
- ✅ Email de confirmación llega
- ✅ Puedo acceder con código de hotel
- ✅ Como hotel, veo solo mis servicios
- ✅ Puedo ver mis reservas en tabla
- ✅ Cotizador actualiza correctamente
- ✅ Si municipio "Otro": estado correcto

---

## FASE 9: PÁGINA DE TRACKING

### Qué debes hacer:

Crear página `/tracking/[codigo]` que muestre estado actual de la reserva.

**Acceso**:
- URL: `/tracking/RES8X3K2`
- Código puede venir de email o compartir link
- NO requiere login

**Encabezado**:
- Código de reserva (bold, grande)
- Estado actual con:
  - Ícono
  - Color según estado (rojo, gris, azul, verde)
  - Texto estado (ej: "Pagada - Pendiente por Asignación")
  - Descripción: "Tu conductor será asignado en breve"

**Secciones** (de arriba a abajo):

1. **Detalles del Servicio**:
   - Servicio: "Tour Guatapé"
   - Fecha: "15 de Enero 2025, 8:00 AM"
   - Duración: "8 horas"
   - Pasajeros: "4 personas"
   - Ubicación: "Medellín" o dirección específica

2. **Información del Cliente**:
   - Nombre: "Juan Pérez"
   - WhatsApp: "+573157177409" (clickeable para llamar/mensaje)
   - Email: "juan@email.com"

3. **Asistentes**:
   - Tabla pequeña con:
     - Nombre | Tipo Doc | Número Doc
     - Juan Pérez | CC | 1234567890
     - María Pérez | CC | 0987654321
     - (más filas según agregar)

4. **Asignación** (si aplica):
   - Solo muestra si estado ≥ "Asignada"
   - Conductor:
     - Nombre: "Carlos González"
     - WhatsApp: "+573125551234" (clickeable)
     - "Disponible para coordinar"
   - Vehículo:
     - Modelo: "Van 7 pasajeros"
     - Placa: "XYZ1234"
     - Color: "Blanco"

5. **Servicios Adicionales** (si tiene):
   - Lista:
     - ✓ Vuelta en bote - $30,000
     - ✓ Almuerzos (2) - $60,000
     - ✓ Guía certificado - $50,000

6. **Resumen de Precio**:
   - Precio base: $150,000
   - Adicionales: $140,000
   - Recargo: $20,000
   - **TOTAL: $310,000**

7. **Acciones** (según estado):

   **Si estado = "Confirmada - Pendiente por Pago"**:
   - Botón grande amarillo: "Realizar Pago" (para cliente independiente)
   - NO aparece si es hotel (paga en efectivo)
   - Al hacer click: abre proceso de pago Bold

   **Si estado = "Completada" y NO hay calificación**:
   - Sección: "¿Cómo fue tu experiencia?"
   - Selector de estrellas (1-5)
   - Textarea: "Cuéntanos más (opcional)"
   - Botón: "Enviar Calificación"
   - Después de enviar: desaparece, muestra "✓ Gracias por tu calificación"

   **En cualquier estado (si faltan >24 horas)**:
   - Botón pequeño gris: "Cancelar Reserva"
   - Al hacer click: pide confirmación
   - Si confirma: cancela, actualiza estado, envía email

**Timeline Visual** (lado izquierdo en desktop, arriba en móvil):
```
✓ Confirmada
↓
✓ Pagada
↓
○ Asignada (gris si no llegó aún)
↓
○ Completada (gris si no llegó aún)
```
- Colores según color estado
- Muestra transición visual del viaje

**Responsive**:
- Móvil: una columna, timeline arriba
- Desktop: timeline lado izquierdo, info lado derecho

### Qué espero:

- Tracking carga datos correctos de BD
- Estado muestra color correcto
- Botón pago solo aparece cuando corresponde
- WhatsApps son clickeables (+57 números)
- Si faltan >24h: puede cancelar
- Calificación funciona si estado = Completada
- Móvil se ve bien: sin overflow
- Si reserva no existe: muestra "Reserva no encontrada"

### Antes de pasar a FASE 10:

- ✅ Puedo abrir /tracking/[codigo] y ver reserva
- ✅ Estado muestra correcto
- ✅ Botón pago aparece cuando corresponde
- ✅ Cancelar funciona
- ✅ Calificación funciona
- ✅ Se ve bien en móvil

---

## FASE 10: PANEL ADMIN - DASHBOARD PRINCIPAL

### Qué debes hacer:

Crear `/admin/dashboard` donde admin ve y gestiona TODAS las reservas.

**Tabla Principal**:
- Muestra todas las reservas del sistema
- Columnas: Código | Cliente | Servicio | Fecha | Estado | Acciones
- Cada fila es clickeable → abre modal detalle
- 50 reservas por página (paginación)
- Ordenable por columnas

**Filtros** (toolbar arriba de la tabla):

1. **Por Estado** (6 botones con contadores):
   - "Pendiente Cotización" (en rojo)
   - "Confirmada - Pendiente Pago" (en gris)
   - "Pagada - Pendiente Asignación" (en azul)
   - "Asignada - Pendiente Completar" (en verde oscuro)
   - "Completada" (en verde claro)
   - "Cancelada" (en rojo)
   - Cada botón muestra cantidad de reservas en ese estado
   - Click = filtra solo ese estado

2. **Por Servicio** (dropdown):
   - Opciones: Todos | Transporte Aeropuerto | Tour Guatapé | City Tour | etc
   - Filtra reservas de ese servicio

3. **Búsqueda Global** (input):
   - Busca por:
     - Código de reserva (exacto)
     - Nombre del cliente (parcial)
     - Nombre del servicio

---

**Modal Detalle de Reserva**:

Cuando hace click en una reserva: muestra todo los datos en modal:

**Sección 1: Información del Cliente**:
- Nombre, WhatsApp, Email
- Asistentes (tabla)

**Sección 2: Detalles del Viaje**:
- Servicio, Fecha, Municipio, Pasajeros
- Detalles específicos (vuelo, lugar recogida, etc)

**Sección 3: Precio**:
- Desglose completo
- Si es hotel: muestra "Comisión del aliado: $X"

**Sección 4: Estado Actual**:
- Dropdown para cambiar estado
- Al cambiar: guarda en BD, envía email al cliente
- Estados disponibles solo si transición lógica (no puede ir de Completada a Confirmada)

**Sección 5: Asignación** (si estado ≥ "Pagada"):
- Dropdown: seleccionar conductor (lista de conductores)
- Dropdown: seleccionar vehículo
- Al asignar: estado cambia automáticamente a "Asignada"
- Botón: "Enviar WhatsApp al Conductor"
  - Abre WhatsApp prerellenado con: "Se te asignó reserva RES8X3K2. Cliente: Juan Pérez. Viaje: Tour Guatapé, 15 Enero 8:00 AM"

**Sección 6: Cotización Manual** (solo si estado = "Pendiente Cotización"):
- Input: "Ingresa precio final"
- Botón: "Cotizar"
- Al cotizar:
  - Precio se guarda en BD
  - Estado cambia a "Confirmada - Pendiente Pago"
  - Email al cliente: "Tu cotización está lista: $XXX. Link para pagar: [tracking]"

**Sección 7: Notas**:
- Textarea: notas internas (admin ver/editar)
- No se envía al cliente

---

**Botones de Acción** (en toolbar):
- "Cerrar Modal"
- "Guardar Cambios" (si editó algo)
- "Cancelar Reserva" (con confirmación)

### Qué espero:

- Tabla carga y muestra todas las reservas
- Filtros funcionan (estado, servicio, búsqueda)
- Contadores en botones estado muestran números correctos
- Modal abre con todos los datos
- Cambiar estado funciona y envía email
- Asignar conductor/vehículo funciona
- Cotización manual funciona
- Enviar WhatsApp funciona (abre WhatsApp)
- Búsqueda es rápida
- Paginación funciona

### Antes de pasar a FASE 11:

- ✅ Tabla carga reservas
- ✅ Puedo filtrar por estado
- ✅ Modal abre con detalles
- ✅ Puedo cambiar estado
- ✅ Puedo asignar conductor
- ✅ Cotización manual funciona
- ✅ Email se envía al cambiar estado

---

## FASE 11: PANEL ADMIN - GESTIÓN DE RECURSOS

### Qué debes hacer:

Crear 5 secciones en admin para gestionar servicios, aliados, conductores, vehículos:

---

### SECCIÓN A: SERVICIOS (`/admin/dashboard/servicios`)

**Tabla de Servicios**:
- Columnas: Nombre | Tipo | Precio | Vehículos | Activo | Acciones
- Botón "➕ Nuevo Servicio"

**Formulario Crear/Editar Servicio**:

1. **Información Básica**:
   - Nombre: input
   - Tipo: dropdown (TRANSPORTE_AEROPUERTO, TOUR_GUATAPE, etc)
   - Descripción: textarea
   - Imagen: file upload (guarda en /public/servicios)
   - Activo: toggle (sí/no)

2. **Configuración de Precios**:
   - Precio base: $input
   - Tabla: selecciona qué vehículos aplican y precio para cada uno
     - Sedan: $100,000
     - SUV: $120,000
     - Van: $150,000

3. **Servicios Adicionales**:
   - Tabla con: Nombre | Precio | Tipo | Acciones
   - Botón: "➕ Agregar Adicional"
   - Ejemplo:
     - Guía certificado | $50,000 | Por persona
     - Almuerzo | $20,000 | Fijo
     - Paseo en bote | $30,000 | Fijo

4. **Tarifa Nocturna**:
   - Toggle: ¿Aplica recargo nocturno?
   - Si sí:
     - De: HH:mm (input hora)
     - A: HH:mm (input hora)
     - Monto: $input

5. **Campos del Formulario de Reserva**:
   - Checkboxes para cada campo que quiera mostrar:
     - Lugar recogida (toggle)
     - Guía certificado (toggle)
     - Número vuelo (toggle)
     - etc

6. **Botones**:
   - "Guardar" (amarillo)
   - "Cancelar" (gris)

**Acciones por Fila**:
- Icono edit → abre formulario
- Icono trash → elimina (con confirmación)

---

### SECCIÓN B: ALIADOS (`/admin/dashboard/aliados`)

**Tabla de Aliados**:
- Columnas: Nombre | Tipo | Código | Reservas | Acciones
- Botón "➕ Nuevo Aliado"

**Formulario Crear/Editar Aliado**:

1. **Información Básica**:
   - Nombre: input
   - Tipo: radio buttons (HOTEL | AIRBNB)
   - Email: input
   - Contacto: input (teléfono)
   - Código: auto-generado (6 dígitos, read-only si existe)
   - Activo: toggle

2. **Configuración de Tarifas**:
   - Tabla grande:
     - Servicio | Precio | Comisión (%) | Descuento Especial
     - Para CADA servicio activo: permite set precio específico
     - Comisión: porcentaje que cobra el aliado
     - Descuento: solo para Airbnb

3. **Botones**:
   - "Guardar"
   - "Cancelar"
   - "Ver Reservas" (abre tabla sus reservas)

---

### SECCIÓN C: CONDUCTORES (`/admin/dashboard/conductores`)

**Tabla de Conductores**:
- Columnas: Nombre | WhatsApp | Disponible | Vehículos | Activo | Acciones
- Botón "➕ Nuevo Conductor"

**Formulario Crear/Editar Conductor**:

1. **Información Básica**:
   - Nombre: input
   - WhatsApp: input
   - Disponible: toggle (sí/no)
   - Activo: toggle
   - Fotos vehículo: múltiples file uploads (guardan URLs)

2. **Botones**:
   - "Guardar"
   - "Cancelar"

---

### SECCIÓN D: VEHÍCULOS (`/admin/dashboard/vehiculos`)

**Tabla de Vehículos**:
- Columnas: Nombre | Capacidad | Imagen | Activo | Acciones
- Botón "➕ Nuevo Vehículo"

**Formulario Crear/Editar Vehículo**:

1. **Información Básica**:
   - Nombre/Modelo: input (ej: "Van 7 pasajeros")
   - Capacidad mínima: number input
   - Capacidad máxima: number input
   - Imagen: file upload PNG (guarda en /public/vehiculos)
   - Activo: toggle

2. **Botones**:
   - "Guardar"
   - "Cancelar"

---

### Qué espero:

- Puedo crear, editar, eliminar servicios
- Puedo crear, editar, eliminar aliados
- Al crear aliado: se genera código 6 dígitos
- Puedo crear, editar, eliminar conductores
- Puedo crear, editar, eliminar vehículos
- Todos los cambios se guardan en BD
- Imágenes se guardan en /public
- Validaciones básicas (nombre obligatorio, etc)
- Confirmaciones antes de eliminar

### Antes de pasar a FASE 12:

- ✅ CRUD Servicios funciona
- ✅ CRUD Aliados funciona
- ✅ CRUD Conductores funciona
- ✅ CRUD Vehículos funciona
- ✅ Imágenes se guardan
- ✅ Cambios aparecen en catálogo/reservas

---

## FASE 12: PANEL ADMIN - VISTAS ADICIONALES

### SECCIÓN A: CALENDARIO (`/admin/dashboard/calendario`)

**Vista de Calendario**:
- Tres opciones: Día | Semana | Mes
- Por defecto: Mes actual
- Navegación: ◄ mes anterior | Hoy | mes siguiente ►

**Visualización**:
- Cada reserva aparece como pequeño card:
  - Nombre cliente (bold)
  - Hora
  - Color según estado
- Click en reserva: abre modal detalle
- Hover: muestra tooltip con detalles rápidos

**Funcionalidad**:
- Vista día: hora por hora con bandas
- Vista semana: 7 días lado a lado
- Vista mes: grid estándar de calendario

---

### SECCIÓN B: ESTADÍSTICAS (`/admin/dashboard/estadisticas`)

**KPIs del Mes Actual**:
- Total Reservas: "145"
- Reservas Directas: "89"
- Reservas Aliados: "56"
- Completadas: "123"
- Ingresos Netos: "$4,520,000" (sin comisión Bold)

**Gráficos** (usando Recharts):

1. **Reservas por Servicio** (gráfico barras):
   - Eje X: Tour Guatapé | City Tour | Transporte | etc
   - Eje Y: cantidad reservas
   - Barras amarillo oro

2. **Cotizaciones Pendientes** (gráfico barras):
   - Eje X: mismos servicios
   - Eje Y: dinero pendiente de cotizar

3. **Reservas por Aliado** (gráfico barras):
   - Si hay hoteles: muestra ingresos por cada uno
   - Barras diferente color por aliado

**Navegación Temporal**:
- Dropdown: cambiar a otro mes
- Muestra: "Enero 2025" o rango de fechas
- Todos los datos se recalculan

---

### SECCIÓN C: BASE DE DATOS (`/admin/dashboard/base-datos`)

**Vista 1: Base de Datos Nueva** (por defecto)

**Tabla Avanzada de Reservas**:
- Columnas: Código | Cliente | Servicio | Fecha | Monto | Comisión | Estado | Acciones
- 100 reservas por página
- Busca global en todas las columnas
- Filtros múltiples:
  - Rango de fechas (date picker)
  - Servicio (dropdown)
  - Estado (checkboxes múltiples)
  - Conductor (si asignado)
  - Vehículo (si asignado)
  - Aliado (si aplica)
- Ordenamiento: click en header para ASC/DESC
- Botón: "📥 Exportar a PDF"
  - Descarga PDF con datos filtrados
  - Nombre archivo: "reservas_01-01-2025_31-01-2025.pdf"

---

**Vista 2: Base de Datos Antigua** (toggle button)

- Muestra tabla bd_antigua (histórico)
- Solo lectura
- Mismos filtros y búsqueda
- Mismas columnas que nueva (si existen)
- Para referencia histórica

---

### Qué espero:

- Calendario muestra reservas correctas
- Vista día/semana/mes funciona
- Estadísticas muestran KPIs correctos
- Gráficos se actualizan con datos
- Cambio de mes actualiza todo
- Base de datos tiene búsqueda rápida
- Exportar PDF funciona
- BD antigua visible pero sin edición

### Antes de pasar a FASE 13:

- ✅ Calendario funciona en 3 vistas
- ✅ Estadísticas muestran datos correctos
- ✅ Gráficos se dibujan
- ✅ Base datos busca y filtra
- ✅ Exportar PDF funciona

---

## FASE 13: PANEL ADMIN - CALIFICACIONES

### Qué debes hacer:

Crear `/admin/dashboard/calificaciones` para gestionar reviews de clientes.

**Tabla de Calificaciones**:
- Columnas: Estrellas | Cliente | Servicio | Fecha | Público | Acciones
- Ordenadas por fecha descendente (más recientes primero)
- 50 por página

**Por Cada Calificación**:
- Muestra: ⭐⭐⭐⭐ (estrellas)
- Comentario del cliente (si la escribió)
- Nombre servicio
- Fecha calificación
- Toggle: "Hacer Público"

**Toggle Público/Privado**:
- Si Privado (🔒): no aparece en Landing
- Si Público (🌐): aparece en carrusel Testimonios de Landing
- Al cambiar: actualiza BD inmediatamente
- Se ve cambio en vivo

**Acciones**:
- Icono 👁️: ver completo (modal)
- Icono trash: eliminar

**Trigger de Calificación**:
- Se solicita cuando: reserva pasa a estado "Completada"
- Email al cliente con link especial `/rate/[reservaId]`
- Link permite: poner estrellas (1-5) + escribir comentario (opcional)
- Después: redirige a página "Gracias por tu calificación"

### Qué espero:

- Tabla muestra calificaciones
- Toggle hace público/privado
- Calificaciones públicas aparecen en Landing
- Click en comentario muestra todo
- Email de solicitud se envía cuando completa

### Antes de pasar a FASE 14:

- ✅ Tabla calificaciones funciona
- ✅ Toggle public/private funciona
- ✅ Públicas aparecen en Landing
- ✅ Email solicitud funciona

---

## FASE 14: INTERNACIONALIZACIÓN (ES/EN)

### Qué debes hacer:

Implementar soporte completo para dos idiomas: Español e Inglés.

**Alcance**:
- Landing Page: 100% traducida
- Sistema Reservas: 100% traducida
- Panel Admin: 100% traducida (al menos español)
- Emails: 100% traducidos
- Errores/mensajes: todos traducidos

**Implementación**:
- Toggle ES/EN en header (visible en toda la app)
- Guardar selección en localStorage
- Cambio de idioma es instantáneo (sin recargar página)
- Strings dinámicos: NO hardcodear (usar archivos JSON)

**Archivos de Traducción**:
- `/lib/i18n/es.json` - todas las strings en español
- `/lib/i18n/en.json` - todas las strings en inglés

**Estructura JSON**:
```json
{
  "header": {
    "logo": "Transportes Medellín",
    "servicios": "Servicios",
    "comotrabaja": "Cómo Funciona"
  },
  "landing": {
    "hero_titulo": "Explora Medellín",
    "hero_subtitulo": "Transporte seguro..."
  },
  "reservas": {
    "paso1": "Detalles del Viaje",
    "municipio": "Municipio",
    "pasajeros": "Número de Pasajeros"
  },
  "estados": {
    "PENDIENTE_COTIZACION": "Pendiente por cotización"
  }
}
```

**Componentes**:
- Hook `useLanguage()` que devuelve `{ language, setLanguage }`
- Función `t(key)` que busca en archivo JSON

**Emails**:
- Detectar idioma de la reserva
- Usar template español o inglés según corresponda

### Qué espero:

- Toggle idioma está visible y funciona
- Cambiar ES ↔ EN cambia toda la página
- Idioma se mantiene después de refrescar
- Todos los textos traducidos
- Emails en español e inglés
- No hay strings hardcodeados en componentes

### Antes de pasar a FASE 15:

- ✅ Toggle ES/EN funciona
- ✅ Landing en ambos idiomas
- ✅ Reservas en ambos idiomas
- ✅ Admin en español (mínimo)
- ✅ Emails en ambos idiomas
- ✅ Cambio de idioma persiste

---

## FASE 15: TESTING Y FIXES

### Qué debes hacer:

Probar TODOS los flujos principales sin dejar nada al azar.

**Flujo 1: Reserva Cliente Independiente → Pago**
1. Ir a `/reservas`
2. Hacer click en servicio
3. Completar 5 pasos del wizard
4. Confirmar reserva
5. Recibir email
6. Ir a tracking
7. Pagar con tarjeta (test Bold)
8. Ver estado actualizado
9. Recibir email confirmación pago

**Flujo 2: Reserva Hotel**
1. Ir a `/reservas`
2. Ingresar código de hotel
3. Hacer click en servicio (solo los del hotel)
4. Completar reserva
5. Recibir email
6. En mi reservas (hotel): ver reserva
7. NO aparece botón pago (efectivo)

**Flujo 3: Admin Gestiona Reserva**
1. Entrar a `/admin/login`
2. Ingresar "medellin2025"
3. Ir a dashboard
4. Ver tabla reservas
5. Filtrar por estado
6. Click en reserva → modal detalle
7. Cambiar estado → email al cliente
8. Asignar conductor y vehículo
9. Enviar WhatsApp al conductor
10. Cotizar manual (si pendiente)
11. Verificar cambios en tracking

**Flujo 4: Cotización Manual (Otro Municipio)**
1. Ir a `/reservas`
2. Servicio, seleccionar municipio "Otro"
3. No muestra precio
4. Completar y confirmar
5. Estado: "Pendiente por cotización"
6. Email: "Estamos preparando tu cotización"
7. En admin: cambiar estado a "Confirmada"
8. Ingresar precio ($XXX)
9. Email al cliente: "Tu cotización está lista"
10. Cliente va a tracking
11. Botón pago funciona
12. Paga y listo

**Flujo 5: Crear Servicio (Admin)**
1. Ir a `/admin/dashboard/servicios`
2. Click "Nuevo Servicio"
3. Rellenar todos los campos
4. Guardar
5. Ir a `/reservas`
6. Nuevo servicio aparece en catálogo
7. Puedo reservar el nuevo servicio

**Flujo 6: Crear Aliado y Configurar (Admin)**
1. Ir a `/admin/dashboard/aliados`
2. Click "Nuevo Aliado"
3. Tipo: HOTEL
4. Llenar datos
5. Generar código (automático)
6. Copiar código
7. Abrir incógnito
8. Ir a `/reservas`
9. Ingresar código
10. Ver solo servicios del aliado
11. Hacer reserva
12. En tabla "Mis Reservas": aparece
13. Botón pago NO aparece (es hotel)

**Flujo 7: Calificación y Reviews**
1. Completa una reserva
2. Estado → "Completada"
3. Recibes email: "Califica tu experiencia"
4. Click en link
5. Pones 5 estrellas + comentario
6. Guardas
7. En admin: ves calificación
8. Toggle "Hacer Público"
9. En landing: testimonio aparece en carrusel

**Flujo 8: Cambio de Idioma**
1. Landing está en ES
2. Click toggle EN
3. Toda la página cambia a inglés
4. Recarga página
5. Sigue en inglés (localStorage)
6. Ir a `/reservas`
7. Wizard está en inglés
8. Cambiar a ES
9. Vuelve al español

**Flujos de Error**:
- Código aliado inválido → error claro
- Pago rechazado → muestra error, botón reintentar
- Email inválido → valida y muestra error
- Fecha pasada → no permite seleccionar
- Formulario incompleto → desactiva botón siguiente

### Qué espero:

- Los 8 flujos se completan sin errores
- BD se actualiza correctamente
- Emails llegan en tiempo
- No hay errores en consola
- Mensajes de error son claros
- Transiciones entre estados funcionan
- Cambios en admin se ven en cliente inmediatamente
- Responsive en móvil (375px)
- Sin warnings ni deprecated code

### Antes de publicar:

- ✅ Todos los 8 flujos funcionan
- ✅ Sin errores en consola
- ✅ Sin warnings críticos
- ✅ BD sincronizada
- ✅ Emails funcionan
- ✅ Responsive móvil
- ✅ Estilos consistentes
- ✅ Botones accesibles (44px mín)

---

## 📋 CHECKLIST FINAL DE CONSTRUCCIÓN

Antes de decir "está listo", verifica TODO esto:

### Base de Datos
- [ ] Todas las tablas creadas
- [ ] Relaciones correctas
- [ ] Índices en campos importantes
- [ ] Tabla bd_antigua visible (solo lectura)

### Landing Page
- [ ] 8 secciones visibles y con scroll
- [ ] Servicios cargan del API
- [ ] Testimonios públicos aparecen
- [ ] Header sticky y responsive
- [ ] Modal acceso aliado funciona
- [ ] SE y EN funcionan
- [ ] Se ve bien en móvil

### Sistema de Reservas
- [ ] Catálogo carga servicios
- [ ] Wizard 5 pasos funciona completo
- [ ] Cotizador actualiza en tiempo real
- [ ] Validaciones funcionan
- [ ] Confirmación crea reserva en BD
- [ ] Email se envía
- [ ] Acceso hotel valida código
- [ ] Mi reservas (tabla) funciona

### Tracking
- [ ] Puedo abrir /tracking/[codigo]
- [ ] Muestra todos los datos
- [ ] Botón pago aparece cuando corresponde
- [ ] Cancelar funciona
- [ ] Calificación funciona
- [ ] Responsive móvil

### Admin
- [ ] Login funciona
- [ ] Dashboard carga reservas
- [ ] Filtros por estado funcionan
- [ ] Modal detalle funciona
- [ ] Cambiar estado funciona + email
- [ ] Asignar conductor funciona
- [ ] Cotización manual funciona
- [ ] CRUD Servicios completo
- [ ] CRUD Aliados completo
- [ ] CRUD Conductores completo
- [ ] CRUD Vehículos completo
- [ ] Calendario funciona
- [ ] Estadísticas muestran datos
- [ ] Base datos busca y filtra
- [ ] Exportar PDF funciona
- [ ] Calificaciones funciona

### Pagos
- [ ] Botón pago solo aparece cuando debe
- [ ] Hash Bold genera correctamente
- [ ] Pago en Bold funciona (test)
- [ ] Webhook Bold actualiza automáticamente
- [ ] Email confirmación llega después de pagar

### Emails
- [ ] Reserva confirmada → llega
- [ ] Cambio estado → llega
- [ ] Pago aprobado → llega
- [ ] Conductor asignado → llega
- [ ] Servicio completado → llega
- [ ] Cotización lista → llega
- [ ] Español e inglés funcionan
- [ ] Todos tienen datos dinámicos
- [ ] No hay typos

### Internacionalización
- [ ] Toggle ES/EN visible
- [ ] Landing traducida completa
- [ ] Reservas traducidas completa
- [ ] Admin traducida (mínimo español)
- [ ] Emails en ambos idiomas
- [ ] Idioma persiste en localStorage
- [ ] Sin strings hardcodeados

### Estilos y UX
- [ ] Colores consistentes (negro, blanco, amarillo)
- [ ] Tipografía Ciabatta correcta
- [ ] Espaciado (8px, 16px, 24px) consistente
- [ ] Botones 44px mínimo en móvil
- [ ] Input fields 44px height
- [ ] Animaciones suaves (200-300ms)
- [ ] Sin lag o ralentizaciones
- [ ] Iconografía consistente
- [ ] Responsive en 375px, 768px, 1024px

### Seguridad
- [ ] Admin protegido con contraseña
- [ ] Validaciones servidor en APIs
- [ ] Códigos aliados validados
- [ ] Hash Bold verificado
- [ ] Sin SQL injection (Prisma)
- [ ] Emails sanitizados
- [ ] No hay keys hardcodeadas

### Performance
- [ ] npm run build sin errores
- [ ] npm run dev sin warnings críticos
- [ ] Carga páginas < 3 segundos
- [ ] No hay memory leaks
- [ ] Imágenes optimizadas

---

## 🎯 ORDEN FINAL DE EJECUCIÓN

**LA IA DEBE HACER EN ESTE ORDEN, PUNTO POR PUNTO**:

1. **FASE 1**: Setup completo
   - ✓ Proyecto creado
   - ✓ Dependencias instaladas
   - ✓ BD conectada
   - ✓ Imágenes organizadas
   - ✓ .env.local listo

2. **FASE 2**: Schema Prisma
   - ✓ Todos los modelos creados
   - ✓ Migraciones pasadas
   - ✓ BD lista

3. **FASE 3**: Autenticación Admin
   - ✓ Login funciona
   - ✓ Protección rutas funciona
   - ✓ Sesión persiste

4. **FASE 4**: Sistema Emails
   - ✓ Todos los 6 triggers configurados
   - ✓ Templates HTML
   - ✓ Pruebas de envío

5. **FASE 5**: Sistema Pagos Bold
   - ✓ Hash genera
   - ✓ Webhook funciona
   - ✓ Prueba con tarjeta test

6. **FASE 6**: APIs REST
   - ✓ Todos los endpoints funcionan
   - ✓ Validaciones servidor

7. **FASE 7**: Landing Page
   - ✓ 8 secciones completas
   - ✓ Datos del API
   - ✓ Responsive

8. **FASE 8**: Sistema Reservas
   - ✓ Catálogo + Wizard 5 pasos
   - ✓ Cotizador dinámico
   - ✓ Acceso hoteles

9. **FASE 9**: Tracking
   - ✓ Página tracking completa
   - ✓ Botón pago
   - ✓ Calificación

10. **FASE 10**: Admin Dashboard
    - ✓ Tabla reservas
    - ✓ Filtros
    - ✓ Modal detalle

11. **FASE 11**: Gestión Recursos
    - ✓ CRUD Servicios
    - ✓ CRUD Aliados
    - ✓ CRUD Conductores
    - ✓ CRUD Vehículos

12. **FASE 12**: Vistas Adicionales
    - ✓ Calendario
    - ✓ Estadísticas
    - ✓ Base datos

13. **FASE 13**: Calificaciones
    - ✓ Tabla calificaciones
    - ✓ Toggle público/privado
    - ✓ Email solicitud

14. **FASE 14**: Internacionalización
    - ✓ Toggle ES/EN
    - ✓ Todas las strings traducidas
    - ✓ Emails en ambos idiomas

15. **FASE 15**: Testing
    - ✓ Todos los 8 flujos completos
    - ✓ Sin errores
    - ✓ Checklists pasados

---

## ⚠️ INSTRUCCIONES FINALES PARA LA IA

**ANTES DE EMPEZAR, DEBES RESPONDER EXPLÍCITAMENTE**:

> "He entendido completamente la construcción de Transportes Medellín Travel.
> 
> **Confirmo que construiré:**
> - ✅ Plataforma Next.js 14+ TypeScript sin `any`
> - ✅ BD PostgreSQL Neon con schema completo
> - ✅ Landing con 8 secciones (datos del API)
> - ✅ Sistema de reservas: catálogo + wizard 5 pasos
> - ✅ Tracking con botón pago, cancelación, calificación
> - ✅ Admin: dashboard + gestión recursos + calendario + estadísticas
> - ✅ Pagos con Bold.co (hash + webhook)
> - ✅ Emails: 6 triggers en ES/EN
> - ✅ Internacionalización ES/EN
> - ✅ Estilos: colores (negro/blanco/amarillo), tipografía Ciabatta, responsive
> 
> **Seguiré estrictamente:**
> - ✅ Orden FASES 1-15
> - ✅ Cada fase funciona antes de siguiente
> - ✅ NO hardcodeo, TODO del API
> - ✅ Móvil-first (375px base)
> - ✅ Validaciones servidor
> - ✅ Estilos consistentes
> - ✅ Sin errores de compilación
> 
> **Comenzaré con FASE 1 (Setup) y terminaré con FASE 15 (Testing).**
> 
> ¿CONFIRMADO?"

**Una vez confirme, debes:**
1. Leer carpeta "imagenes" del usuario
2. Leer .env existente para credenciales Bold
3. Crear todo SIGUIENDO LAS FASES SIN SALTEAR
4. Antes de cada nueva fase: verifica que la anterior compile sin errores
5. Si hay error: DETENTE y reporta, no continúes

---

## 📞 INFORMACIÓN DE CONTACTO (Para usar en app)

- **WhatsApp**: +57 317 5177409
- **Email**: medellintraveltransportes@gmail.com
- **Instagram**: @transportesmedellintravel
- **Contraseña Admin**: medellin2025

---

## 🎨 RESUMEN DE ESTILOS

**Colores**:
- Principal: Negro #0A0A0A
- Acento: Amarillo #D6A75D
- Secundario: Blanco #FFFFFF

**Tipografía**: Ciabatta (Light 300, Medium 500, Bold 700)

**Espaciado Base**: 8px, 16px, 24px, 32px, 48px

**Componentes**: Botones 44px, Cards con shadow suave, Inputs 44px

**Responsive**: Mobile 375px | Tablet 768px | Desktop 1024px+

**Animaciones**: Fade, Slide, Scale (200-300ms ease-in-out)

---

## ✅ LISTO PARA CONSTRUIR

Este documento contiene TODO lo que necesitas para construir la plataforma.

**NO falta nada. NO necesitas asumir. Si algo NO está explícitamente dicho: PREGUNTA.**

La construcción es FASE POR FASE. Cada una depende de la anterior.

**¿Estás listo? Confirma y comenzamos con FASE 1.**
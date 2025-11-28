# Documentación Técnica - Transportes Medellin Travel

## 📋 Tabla de Contenidos
1. [Descripción General](#descripción-general)
2. [Landing Page](#landing-page)
3. [Sistema de Reservas](#sistema-de-reservas)
4. [Panel de Administración](#panel-de-administración)
5. [Sistema de Aliados (Hoteles/Airbnb)](#sistema-de-aliados)
6. [Sistema de Pagos](#sistema-de-pagos)
7. [Sistema de Tracking](#sistema-de-tracking)
8. [Catálogo de Servicios](#catálogo-de-servicios)
9. [Gestión de Recursos](#gestión-de-recursos)
10. [Sistema de Precios](#sistema-de-precios)
11. [Configuración y Seguridad](#configuración-y-seguridad)

---

## 📖 Descripción General

Plataforma web Next.js para gestión integral de reservas de una agencia de viajes en Medellín. Permite a clientes independientes y aliados (hoteles/Airbnb) reservar servicios de tours y transporte, con gestión administrativa completa.

### Stack Tecnológico
- **Framework**: Next.js
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Pagos**: Bold.co
- **Emails**: Sistema de notificaciones automáticas
- **Idiomas**: Español/Inglés (Landing + Reservas + Correos)

### Información de Contacto
- **Instagram**: [@transportesmedellintravel](https://www.instagram.com/transportesmedellintravel/)
- **WhatsApp**: +57 317 5177409
- **Email**: medellintraveltransportes@gmail.com

---

## 🏠 Landing Page

### Estructura de Secciones

#### 1. Hero Section
- Imagen de fondo con efecto parallax
- Título principal
- Descripción breve
- Botón CTA "Ver Servicios"

#### 2. Quiénes Somos
- Información de la empresa
- 3 iconos destacados:
  - Seguridad Garantizada
  - Puntualidad
  - Calidad Premium

#### 3. Nuestros Servicios
- Grid responsive con 6 servicios principales
- Card por servicio con:
  - Imagen
  - Título
  - Descripción breve
  - Botón "Reservar Ahora"

#### 4. Por Qué Elegirnos
- 6 características destacadas con iconos:
  - Conductores Profesionales
  - Vehículos Modernos
  - Atención Personalizada
  - Precios Competitivos
  - Soporte 24/7
  - Experiencia Local

#### 5. Cómo Funciona
- Timeline visual con 4 pasos:
  1. Elige tu Servicio
  2. Personaliza tu Viaje
  3. Confirma y Paga
  4. Disfruta el Viaje

#### 6. Testimonios
- Carrusel de testimonios públicos
- Muestra comentarios aprobados desde panel admin
- Incluye estrellas y texto del cliente

#### 7. Call to Action Final
- Sección invitando a reservar

#### 8. Footer
- Información de contacto
- Enlaces a redes sociales (Instagram, WhatsApp)
- Enlaces de navegación rápida

### Funcionalidades

- **Cambio de Idioma**: Toggle ES/EN en header
- **Navegación Suave**: Scroll automático a secciones
- **Header Dinámico**: Cambia de transparente a sólido al hacer scroll
- **Responsive**: Diseño adaptativo móvil/tablet/desktop
- **Botón "Soy Aliado"**: Acceso a portal de hoteles (sutil pero visible)

---

## 📅 Sistema de Reservas

### Tipos de Usuario

1. **Clientes Independientes**: Encuentran la página, reservan y pagan online
2. **Hoteles**: Recepción reserva por clientes, pago en efectivo
3. **Airbnb**: Link personalizado con precios especiales, pago online

### Página de Servicios (`/reservas`)

#### Hero Section
- Banner con imagen de fondo
- Botón scroll a servicios

#### Catálogo de Servicios
- Grid responsive mostrando servicios activos
- **Filtrado por Hotel**: Si viene con código de hotel, muestra solo servicios activos para ese hotel

#### Acceso para Hoteles
- Apartado "Ingresar como Hotel"
- Input para código único de 6 dígitos
- Al ingresar:
  - Ve solo servicios activos para su hotel
  - Puede reservar (queda bajo ese aliado)
  - Accede a tabla de sus reservas
  - Filtros por rango de fechas y servicio

### Modal de Reserva (Wizard de 5 Pasos)

#### Paso 0: Información del Servicio
- Muestra descripción completa del servicio
- Botón "Continuar"

#### Paso 1: Detalles del Viaje

**Botón de Asistencia**:
- Texto: "Necesito este servicio con múltiples recogidas o petición personalizada"
- Redirige a WhatsApp con mensaje pre-llenado

**Campos Comunes (Todos los Servicios)**:
- **Idioma más hablado**: Español/Inglés
- **Fecha y hora**: Date/time picker
  - Verifica si aplica recargo nocturno
- **Municipio**: Dropdown con opciones:
  - Medellín
  - Sabaneta
  - Bello
  - Itagüí
  - Envigado
  - Otro (input manual)
  - ⚠️ Si selecciona "Otro": No muestra total, estado "Pendiente por cotización"
- **Número de pasajeros**:
  - Input numérico
  - Ilustración dinámica del vehículo según cantidad
  - Selección automática de vehículo por capacidad
  - Muestra imagen PNG del vehículo seleccionado

**Campos Específicos por Servicio**:

**Transporte Aeropuerto**:
- Selección: "Desde el aeropuerto" / "Hacia el aeropuerto"
- Aeropuerto: José María Córdova (JMC) / Olaya Herrera
- Auto-completado de origen/destino según selección
- Número de vuelo

**Tours**:
- Lugar de recogida
- Municipio
- Idioma del tour (Español/Inglés)
- Opción de guía certificado

**Tour Guatapé**:
- Opciones adicionales:
  - Paseo en bote (✓/✗)
  - Cantidad de almuerzos
  - Paradas específicas

**Tour ATV**:
- Cantidad de motos ATV (1-12)

**Tour Parapente**:
- Cantidad de participantes

**Cotizador Dinámico**:
- Letrero tipo carrito mostrando "Cotización: $XXX"
- Se actualiza en tiempo real según:
  - Servicio base
  - Vehículo seleccionado
  - Servicios adicionales
  - Recargo nocturno
  - Tarifa por municipio

#### Paso 2: Información de Contacto

- **Nombre completo**: Input text
- **WhatsApp**: Input tel
- **Email**: Input email (se enviará confirmación y actualizaciones)
- **Lista de asistentes**:
  - Nombre
  - Tipo de identificación
  - Número de identificación
  - Botón "+" para agregar más personas

#### Paso 3: Notas y Recomendaciones

- Campo de texto largo para peticiones especiales
- Ejemplos de placeholder:
  - "Viajo con adultos mayores"
  - "Viajo con mascotas"
  - "Necesito silla de bebé"
  - etc.

#### Paso 4: Resumen

**Vista estilo factura** con:

- Detalles completos del servicio
- Desglose de precios:
  - Precio base (servicio + vehículo)
  - Servicios adicionales (si aplica)
  - Recargo nocturno (si aplica)
  - Tarifa por municipio
  - **Subtotal**
  - Comisión del hotel (si aplica)
  - Descuento afiliado (si viene por link de Airbnb)
  - **PRECIO FINAL**

- Botón "Confirmar Reserva"
  - Crea reserva con estado "Confirmada - Pendiente por Pago"

#### Paso 5: Confirmación

**Para Usuarios Normales**:
- Mensaje de éxito
- Se envía correo con:
  - Detalle de la reserva
  - Estado actual
  - Link a página de tracking
- Redirección automática a tracking con:
  - Todos los datos de la orden
  - Estado actual
  - **Botón de pago Bold** (si no ha pagado)

**Para Hoteles**:
- Mensaje de confirmación
- Monto a recibir en efectivo
- Link para dar al cliente (tracking sin botón de pago)
- NO muestra botón de pago Bold

**Después del Pago**:
- Correo automático con:
  - Confirmación de pago exitoso
  - Nuevo estado: "Pagada - Pendiente por Asignación"
  - Recibo de la orden
- Tracking actualizado sin botón de pago

---

## 🎛️ Panel de Administración

### Acceso
- **URL**: `/admin/login`
- **Credenciales Demo**: `medellin2025`
- Sistema de autenticación con NextAuth

### 3.1 Dashboard Principal

#### Vista de Tabla de Reservas
- Lista todas las reservas del sistema
- Click en reserva → Modal con detalle completo

#### Filtros

**Por Estado** (6 botones con contadores):
1. Pendiente por cotización
2. Confirmada - Pendiente por Pago
3. Pagada - Pendiente por Asignación
4. Asignada - Pendiente por Completar
5. Completada
6. Cancelada

**Por Servicio**:
- Dropdown con todos los servicios

**Búsqueda Global**:
- Por código de reserva
- Por nombre de cliente
- Por tipo de servicio

#### Vista de Detalle de Reserva

**Información Completa**:
- Todos los datos de la reserva
- Cliente y contacto
- Servicios contratados
- Desglose de precios

**Acciones Disponibles**:

1. **Editar Estado**
   - Cada vez que cambia → Guarda en BD + Envía correo al cliente

2. **Asignación de Conductor y Vehículo**
   - Seleccionar conductor de la lista
   - Seleccionar vehículo
   - Al asignar → Estado cambia automáticamente a "Asignada - Pendiente por Completar"
   - Botón para enviar WhatsApp al conductor:
     - Mensaje: "Se te asignó la reserva X" + detalles

3. **Cotización Manual** (si estado es "Pendiente por cotización")
   - Añadir valor a la reserva
   - Al guardar → Estado cambia a "Confirmada - Pendiente por Pago"
   - Envía correo con:
     - Actualización de estado
     - Valor de la reserva
     - Link a tracking con botón de pago

### 3.2 Sección Calendario

- **Vistas**: Día / Semana / Mes
- **Visualización de Reservas**:
  - Color según estado
  - Muestra nombre y hora
- **Navegación**:
  - Mes anterior / siguiente
  - Botón "Volver al mes actual"

### 3.3 Sección Estadísticas

#### KPIs del Mes
- Reservas directas
- Reservas a través de aliados
- Reservas totales
- Reservas completadas
- Suma de cotizaciones netas (sin comisión Bold)

#### Gráficos
- Reservas por servicio (barras)
- Cotizaciones por servicio (barras)
- Reservas por aliado (barras)

#### Navegación Temporal
- Cambiar entre meses (anterior/siguiente/actual)
- Muestra rango de fechas del mes seleccionado

### 3.4 Sección Base de Datos

#### Base de Datos Nueva
- Vista principal en tabla
- Todas las reservas históricas
- Búsqueda global avanzada
- Filtros múltiples:
  - Rango de fechas
  - Servicios
  - Estados
  - Conductores
  - Vehículos
  - Aliados
- **Exportación a PDF**:
  - Genera PDF con resultados filtrados
  - Nombre: `fecha_inicio-fecha_fin.pdf`
- Paginación
- Ordenamiento por columnas

#### Base de Datos Antigua (`bd_antigua`)
- Botón sutil para cambiar vista
- Tabla PostgreSQL con campos:
  - id (SERIAL PRIMARY KEY)
  - hora_reserva (TIMESTAMP)
  - canal (TEXT)
  - nombre (TEXT)
  - idioma (TEXT)
  - fecha (DATE)
  - hora (TIME)
  - servicio (TEXT)
  - vehiculo (TEXT)
  - numero_vuelo (TEXT)
  - numero_contacto (TEXT)
  - cotizacion (TEXT)
  - comision (TEXT)
  - informacion_adicional (TEXT)
  - estado_servicio (TEXT)
  - estado_pago (TEXT)
  - conductor (TEXT)
  - created_at (TIMESTAMP)
- Similar sistema de filtros y búsqueda

### 3.5 Sección Aliados

#### Lista de Aliados
**Aliados Existentes**:
1. MEDELLIN TRAVEL
2. LLERAS PREMIUM
3. TORRE POBLADO
4. PROVENZA BOUTIQUE
5. REFUGIO DEL JAGUAR
6. VOY COLOMBIA
7. TAX INDIVIDUAL
8. D ENVISION
9. FLORENCIA PLAZA
10. MEDELLIN FLORECE
11. AMOBLADOS VELASQUEZ
12. ELEMENT HOTEL
13. HOTEL BELI

#### Gestión de Aliados

**Añadir Aliado**:
- Flag: "Es HOTEL" / "Es AIRBNB"
- Nombre del aliado
- Código de acceso (6 dígitos aleatorios)
- Contacto

**Configuración de Tarifas por Aliado**:

- Quiero poder seleccionar entre los servicios que hay cuales voy a habilitar para ese aliado
- Esos que seleccione les podre poner las tarifas que yo quiera para los campos de tarifas que tenga ese aliado, ponerles un precio a cada campo

  Ejemplo ( Transporte aeropuerto - Auto capacidad 1 - 3 ) : 100.000$ 
  Comision: 20.000 

  Transporte aeropuerto - Camioneta : 130.000$ 
  Comision: 30.000 

  etc 

  y asi con todos los servicios y carros que yo quiera y los que no pues se sabe que no estan disponibles para este aliado

  Tambien quiero poder poner estos valores

  Valor adicional Poblado: 10.000
  Valor adicional Envigado: 10.000
  Valor adicional Sabaneta: 10.000
  Valor adicional Laureles: 10.000
  Valor adicional Itagui: 10.000
  Valor adicional Bello: 10.000
  Valor adicional Medellin: 10.000

  Esto debe estar a la hora de ingresar un aliado y se debe almacenar, se debe poder editar cuando yo quiera los valores 
  
  IMPORTANTE: estos valores son los que van a salir si el aliado es hotel y entra a su portal para reservar (LE SALDRAN ESTOS VALORES)
  Y si es un airbnb cuando la persona entre por el link que generaras para ese airbnb, la persona al entrar a un servicio llenar el formulario los precios que le saldran seran los que yo configure para este airbnb 



  Por ejemplo el aliado Hotel A - Servicios activos: Guatape, aeropuerto y perzonalizado

  - Guatape: 
    - Precio por persona
    - Precio por vehículo
    - Precio por capacidad
    - Tarifa nocturna
    - Precio por municipio
    - Tarifas de cancelación
    - Comisión del aliado (%)

**Diferencias Hotel vs Airbnb**:

**HOTEL**:
- Código de acceso para portal
- Pago en efectivo
- NO botón de pago online
- Puede cancelar reservas (antes de 24h)

**AIRBNB**:
- Link único compartible
- Huéspedes reservan directamente
- Pago online con Bold
- Precios y comisiones personalizadas
- Comisión para Airbnb visible en admin

**Ver Reservas del Aliado**:
- Tabla con todas sus reservas
- Filtros por fecha y servicio

### 3.6 Sección Conductores

#### Gestión CRUD
- **Listar**: Todos los conductores registrados
- **Añadir**: Nuevo conductor
- **Editar**: Datos de conductor existente
- **Eliminar**: Remover conductor

#### Información por Conductor
- Nombre completo
- WhatsApp
- Fotos del vehículo(s)
- Disponibilidad

### 3.7 Sección Vehículos

#### Gestión CRUD
- **Listar**: Todos los vehículos disponibles
- **Añadir**: Nuevo vehículo
- **Editar**: Datos de vehículo existente
- **Eliminar**: Remover vehículo

#### Información por Vehículo
- Nombre/Modelo
- Capacidad mínima
- Capacidad máxima
- Imagen del vehículo (PNG)

### 3.8 Sección Servicios

#### Gestión CRUD
- **Listar**: Todos los servicios
- **Añadir**: Nuevo servicio
- **Editar**: Servicio existente
- **Eliminar**: Remover servicio
- **Activar/Desactivar**: Toggle de disponibilidad

#### Configuración por Servicio

**Información Básica**:
- Tipo de servicio
- Nombre
- Descripción
- Imágenes

**Configuración de Precios**:
- Precio base por vehículo:
  - Seleccionar vehículos aplicables
  - Asignar precio a cada vehículo
- Servicios adicionales:
  - Nombre del adicional
  - Precio
  - Unidad (por persona, fijo, etc.)

**Tarifa Nocturna**:
- Activar/Desactivar
- Rango de horas (De: HH:mm A: HH:mm)
- Monto de recargo

**Campos del Formulario**:
- Configurar qué campos específicos se muestran en paso 1 de reserva
- Activar/desactivar opcionales

**Al Crear/Editar**:
- Se refleja automáticamente en catálogo de reservas
- Usuarios pueden reservar inmediatamente

### 3.9 Sección Calificaciones

#### Vista de Calificaciones
- Lista de todas las calificaciones recibidas
- Ordenadas por fecha

#### Información por Calificación
- Estrellas (1-5)
- Comentario del usuario (opcional)
- Servicio calificado
- Fecha
- Cliente

#### Acciones
- **Hacer Público**: Toggle
  - Al activar → Aparece en carrusel de Landing Page
  - Al desactivar → Se oculta de Landing

#### Trigger
- Se solicita calificación automáticamente cuando:
  - Reserva cambia a estado "Completada"
  - Se envía correo al cliente con link para calificar

---

## 🏨 Sistema de Aliados (Hoteles/Airbnb)

### Autenticación de Aliados

#### Acceso
- Botón "Soy Aliado" en header principal (sutil pero visible)
- Modal para ingresar código

#### Validación
- Código de 6 dígitos
- Verificación en base de datos
- Si válido → Acceso al portal

#### Persistencia
- Código guardado en localStorage
- Badge en header mostrando nombre del aliado

### Portal de Aliado

#### Vista Personalizada
- Solo muestra servicios activos para ese hotel/Airbnb
- Precios específicos del aliado
- Vehículos disponibles para el aliado

#### Página de Servicios
- Grid con servicios activos
- Botón "Ver mis reservas"

#### Mis Reservas
- Tabla completa de reservas del aliado
- Filtros:
  - Rango de fechas
  - Servicio
  - Estado
- Ver detalles completos con estado
- **Cancelar** (solo HOTELES, no Airbnb):
  - Permitido solo antes de 24h del servicio
  - Si aplica, cobra tarifa de cancelación

### Flujo de Pago

**Para HOTELES**:
- Pago en efectivo
- NO muestra botón de pago Bold
- Mensaje informativo de pago en efectivo
- Comisión NO se muestra al usuario
- Comisión visible solo en panel admin

**Para AIRBNB**:
- Link único compartible con huéspedes
- Huéspedes reservan como independientes
- Pago online con Bold
- Precios personalizados del Airbnb
- Comisión NO se muestra al usuario
- Comisión visible solo en panel admin

### Comisiones

**Visibilidad**:
- Usuario final: NO ve comisión
- Panel admin → Sección Base de Datos:
  - Columna "Valor Total"
  - Columna "Comisión del Aliado"
  - Para cálculos y pagos posteriores

---

## 💳 Sistema de Pagos

### Integración con Bold

#### Configuración
- **Plataforma**: Bold.co
- **Moneda**: COP (Pesos Colombianos)
- **Métodos**: Tarjetas crédito/débito
- **Documentación**: [Bold - Integración Manual](https://developers.bold.co/pagos-en-linea/boton-de-pagos/integracion-manual/integracion-manual)

### Flujo de Pago (Usuarios Normales)

1. **Generación de Hash**
   - Al crear reserva con cotización
   - Hash de seguridad Bold

2. **Botón de Pago**
   - Aparece en tracking si estado = "Confirmada - Pendiente por Pago"

3. **Proceso de Pago**
   - Usuario hace click
   - Redirige a Bold
   - Completa pago

4. **Redirección**
   - Bold redirige a `/payment/result`

5. **Actualización Automática**
   - Estado → "Pagada - Pendiente por Asignación"
   - Guarda en BD

6. **Email de Confirmación**
   - Asunto: "Pago Confirmado - Reserva [CÓDIGO]"
   - Contenido:
     - Confirmación de pago exitoso
     - Nuevo estado
     - Recibo
     - Link a tracking

### Página de Resultado de Pago

#### Estados Posibles
- **`approved`**: Pago aprobado
  - Mensaje de confirmación
  - Resumen de reserva
  - Estado: "Pagada - Pendiente por Asignación"
- **`rejected`**: Pago rechazado
  - Mensaje de error
  - Botón para reintentar
- **`pending`**: Pago pendiente
  - Mensaje de estado pendiente
  - Instrucciones de seguimiento

### Webhook de Bold

#### Endpoint
- **URL**: `/api/bold/webhook`

#### Funcionalidad
- Recibe notificaciones de Bold
- Actualiza estados de reservas automáticamente
- Maneja cambios en pagos

### Emails de Pago

**Email de Confirmación**:
- Se envía cuando pago es aprobado
- Idioma: El seleccionado en reserva (ES/EN)
- Contenido:
  - Detalles de la reserva
  - Información del pago
  - Recibo
  - Enlace de tracking

---

## 📍 Sistema de Tracking

### Página de Tracking  (`/tracking/[codigo]`)

#### Acceso
- URL: `/tracking/[codigo-reserva]`
- Código único alfanumérico por reserva

#### Información Mostrada

**Encabezado**:
- Estado actual con icono y color
- Código de reserva
- Descripción del estado

**Detalles del Servicio**:
- Tipo de servicio
- Fecha y hora
- Número de pasajeros
- Origen y destino / Lugar de recogida

**Información del Cliente**:
- Nombre de contacto
- WhatsApp
- Email

**Lista de Asistentes**:
- Nombre
- Tipo de documento
- Número de documento

**Asignación** (si aplica):
- Conductor asignado (nombre + WhatsApp)
- Vehículo asignado (modelo + placa)

**Servicios Adicionales** (si aplica):
- Lista de adicionales contratados

**Resumen de Precio**:
- Precio  base
- Adicionales
- Recargos
- **Precio final**

**Acciones Disponibles**:
- **Botón de Pago** (si estado = "Confirmada - Pendiente por Pago")
- **Cancelar** (si faltan más de 24h para el servicio)

### Estados Visuales

| Estado | Color | Descripción |
|--------|-------|-------------|
| Pendiente por cotización | Rojo | Municipio "Otro" seleccionado |
| Confirmada - Pendiente por Pago | Gris | Reserva confirmada sin pago |
| Pagada - Pendiente por Asignación | Azul | Pagada, esperando conductor |
| Asignada - Pendiente por Completar | Verde Oscuro | Conductor asignado |
| Completada | Verde Claro | Servicio completado |
| Cancelada | Rojo | Reserva cancelada |

---

## 🚗 Catálogo de Servicios

### 0. Transporte Aeropuerto

**Características**:
- Traslados desde/hacia aeropuerto
- Aeropuertos: JMC / Olaya Herrera

**Incluye**:
- Transporte privado
- Seguimiento de vuelo
- Ayuda con equipaje
- Tarjeta de asistencia médica

**Campos Específicos**:
- Dirección desde/hacia
- Aeropuerto
- Número de vuelo

### 1. Transporte Personalizado por Horas

**Características**:
- Renta de vehículo por horas

**Campos Específicos**:
- Tipo de vehículo deseado
- Número de horas

### 2. Tour Guatapé

**Incluye**:
- Transporte privado
- Primera parada: Alto del Chocho
- Visita réplica del Viejo Peñol
- Visita Casa al Revés (sin ingreso)
- Vista paisajes Piedra de Guatapé (sin ingreso)
- Visita plaza principal
- Paseo calle de las Sombrillas
- Paseo calle de los Zócalos
- Malecón
- Tarjeta de asistencia médica
- Acompañamiento conductor y vehículo

**Servicios Adicionales**:
- ✅ Vuelta en bote
- ✅ Almuerzo a la carta
- ✅ Guía acompañante certificado (ES/EN)

### 3. City Tour

**Incluye**:
- Transporte privado
- Visita Plaza Botero
- Panorámica zona centro
- Visita Parques del Río
- Visita Parque Explora (sin ingreso)
- Visita Pueblito Paisa
- Panorámica Carrera 70
- Hidratación
- Tarjeta de asistencia médica
- Acompañamiento conductor y vehículo

**Servicios Adicionales**:
- ✅ Guía acompañante certificado (ES/EN)

### 4. Tour Comuna 13 / Graffiti

**Incluye**:
- Transporte privado
- Paseo en Metro Cable
- Helado típico de la Comuna 13
- Ruta escaleras eléctricas
- Visita Cristo Gigante
- Visita Gorila Gigante
- Show de Trovas
- Show de Freestyle
- Show de Raperos
- Visita Casa de Grafiteros
- Visita Casa Neón
- Tiempo libre para souvenirs
- Tarjeta de asistencia médica
- Acompañamiento conductor y vehículo

**Servicios Adicionales**:
- ✅ Guía acompañante certificado (ES/EN)

### 5. Tour Hacienda Nápoles

**Incluye**:
- Transporte ida y regreso desde Medellín
- Ingreso al parque (NO incluido)
- Acceso a zonas acuáticas y temáticas
- Recorrido por zoológico y reserva natural
- Visita museo memorial de la hacienda
- Tiempo libre para disfrutar parque
- Seguro de viaje incluido

**Servicios Adicionales**:
- Ninguno (solo transporte)

### 6. Tour Occidente

*Pendiente de especificación*

### 7. Tour Parapente

**Incluye**:
- Transporte privado
- Equipo de seguridad y protección
- Lección preparatoria
- Vuelo en parapente con instructor certificado
- Vista panorámica de Medellín
- Fotos y videos del vuelo
- Seguro de vuelo
- Tarjeta de asistencia médica

**Servicios Adicionales**:
- ✅ Cantidad de ingresos

### 8. Tour ATV

**Incluye**:
- Transporte privado para llegar a actividad
- Ruta por las montañas
- ATV en ruta por 1:45 minutos
- Hidratación
- Tarjeta de asistencia médica

**Servicios Adicionales**:
- ✅ Cantidad de motos (1-12)

### 9. Tour Jardín

*Pendiente de especificación*

### 10. Tour Finca Cafetera

**Incluye**:
- Transporte privado
- Historia de bienvenida con taza de café
- Uso de atuendos de cafeteros colombianos
- Recorrido por campos de café
- Actividad de colecta de café
- Proceso de despulpe
- Proceso de secado
- Proceso de trillado
- Proceso de tostión
- Cata de barismo
- Souvenirs
- Tarjeta de asistencia médica

**Servicios Adicionales**:
- ✅ Guía acompañante en la actividad

---

## ⚙️ Gestión de Recursos

### Gestión de Conductores

#### Operaciones CRUD
- **Create**: Añadir nuevo conductor
- **Read**: Ver lista y detalles
- **Update**: Editar información
- **Delete**: Eliminar conductor

#### Campos
- Nombre completo
- Número de WhatsApp
- Fotos del vehículo
- Estado activo/inactivo

### Gestión de Vehículos

#### Operaciones CRUD
- **Create**: Añadir nuevo vehículo
- **Read**: Ver lista y detalles
- **Update**: Editar información
- **Delete**: Eliminar vehículo

#### Campos
- Nombre/Modelo
- Capacidad mínima
- Capacidad máxima
- Imagen PNG
- Estado activo/inactivo

### Gestión de Servicios

#### Operaciones CRUD
- **Create**: Añadir nuevo servicio
- **Read**: Ver lista y detalles
- **Update**: Editar información
- **Delete**: Eliminar servicio
- **Toggle**: Activar/Desactivar

#### Configuración Avanzada
- Nombre y descripción
- Imágenes
- Precio por tipo de vehículo
- Servicios adicionales con precios
- Tarifa nocturna (activar + rango horario)
- Campos del formulario de reserva
- Vehículos aplicables

---

## 💰 Sistema de Precios

### Componentes del Precio

#### Precio Base
- **Servicio seleccionado**: Según tipo
- **Vehículo**: Según capacidad de pasajeros

#### Adicionales
- Guías certificados
- Almuerzos
- Actividades específicas (bote, motos, etc.)
- Ingresos a lugares

#### Recargos
- **Tarifa Nocturna**: Si hora está en rango configurado
- **Tarifa por Municipio**:
  - Medellín: $X
  - Sabaneta: $Y
  - Bello: $Z
  - Itagüí: $W
  - Envigado: $V
  - Otro: Requiere cotización manual

#### Descuentos (si aplica)
- Link de Airbnb con descuento configurado

#### Comisiones (no visibles al usuario)
- **Hotel**: % configurado por hotel
- **Airbnb**: % configurado por Airbnb
- **Bold**: Comisión de procesamiento de pago

### Cálculo Automático

**Fórmula**:
```
PRECIO_FINAL = 
  PRECIO_BASE (servicio + vehículo)
  + SERVICIOS_ADICIONALES
  + RECARGO_NOCTURNO (si aplica)
  + TARIFA_MUNICIPIO
  - DESCUENTO_AFILIADO (si aplica)
  - COMISION_ALIADO (no se muestra, solo en admin)
```

**Mostrado al Usuario**:
- Subtotal antes de comisiones
- Total a pagar (sin mostrar comisión)

**Visible en Panel Admin**:
- Total pagado
- Comisión del aliado
- Comisión de Bold
- Neto para la empresa

---

## 🔧 Configuración y Seguridad

### Variables de Entorno (`.env`)

**Base de Datos**:
```
DATABASE_URL=
```

**Bold (Pagos)**:
```
BOLD_PUBLIC_KEY=
BOLD_SECRET_KEY=
```

**Email**:
```
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

**NextAuth**:
```
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

**App**:
```
NEXT_PUBLIC_APP_URL=
```

### Sistema de Correos

#### Triggers de Correos

1. **Reserva Confirmada**:
   - Asunto: "Reserva Confirmada - [CÓDIGO]"
   - Contenido: Detalles + Link tracking + Botón pagar

2. **Cambio de Estado**:
   - Asunto: "Actualización de Reserva - [CÓDIGO]"
   - Contenido: Nuevo estado + Detalles

3. **Pago Aprobado**:
   - Asunto: "Pago Confirmado - [CÓDIGO]"
   - Contenido: Recibo + Nuevo estado + Link tracking

4. **Conductor Asignado**:
   - Asunto: "Conductor Asignado - [CÓDIGO]"
   - Contenido: Datos conductor + Vehículo

5. **Servicio Completado**:
   - Asunto: "¡Gracias por elegirnos! Califica tu experiencia"
   - Contenido: Link para calificar (estrellas + comentario opcional)

6. **Cotización Lista** (municipio "Otro"):
   - Asunto: "Tu Cotización está Lista - [CÓDIGO]"
   - Contenido: Precio cotizado + Link tracking + Botón pagar

#### Idioma de Correos
- **Determina por**: Idioma seleccionado en formulario de reserva
- Español o Inglés

### Sistema Multidioma

#### Alcance
- Landing Page (completa)
- Sistema de Reservas (wizard completo)
- Correos electrónicos
- Mensajes de estado

#### Implementación
- Toggle ES/EN en header
- Contexto global de idioma
- Archivos de traducción

### Seguridad

#### Autenticación
- NextAuth para admin
- Códigos únicos para aliados (6 dígitos)
- Persistencia en localStorage (aliados)

#### Validaciones
- Server-side en todas las APIs
- Client-side en formularios
- Validación de pagos con hash Bold

#### Protección de Datos
- Sanitización de inputs
- Protección contra SQL injection (Prisma ORM)
- Validación de emails
- Verificación de estados de reserva

---

## 🎨 Diseño y UX

### Principios de Diseño
- **Intuitivo**: Fácil de usar para usuarios
- **Clean**: Diseño limpio y moderno
- **Moderno**: UI contemporánea
- **Diferenciable**: Única en el mercado
- **Experiencia de Usuario**: Foco en usabilidad

### Paleta de Colores

**Colores Principales**:
- **Primario**: Negro (#0A0A0A)
- **Secundario**: Blanco (#FFFFFF)
- **Acento**: Amarillo (#D6A75D / #F2C94C)

**Estados de Reserva**:
- Pendiente por cotización: Rojo
- Confirmada - Pendiente por Pago: Gris
- Pagada - Pendiente por Asignación: Azul
- Asignada - Pendiente por Completar: Verde Oscuro
- Completada: Verde Claro
- Cancelada: Rojo

### Tipografía

**Fuente Principal**: Ciabatta
- **Light**: 300
- **Medium**: 500
- Archivos en carpeta `/Fonts`

### Responsive Design

**Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Prioridad**: 
- **MUY IMPORTANTE** para panel de reservas
- Mayoría de usuarios usan celular

### Animaciones

**Biblioteca**: Framer Motion

**Efectos**:
- Parallax en hero section
- Transiciones suaves entre secciones
- Animaciones de entrada/salida
- Efectos hover en botones y cards
- Loading states animados
- Scroll smooth

---

## ✅ Requerimientos Técnicos

### Organización del Código
- Código dinámico (no hardcoded)
- Bien estructurado y optimizado
- Seguir best practices de Next.js
- Modularización de componentes

### Base de Datos
- PostgreSQL
- Prisma ORM
- Bien organizada y normalizada
- Migraciones versionadas

### APIs
- RESTful
- Validaciones server-side
- Manejo de errores robusto
- Respuestas consistentes

### Flujos Completos
- Sin errores
- Todos los casos contemplados
- Sistema de pagos seguro
- Usuario nunca en estado dudoso

### Calidad
- Sin errores de compilación
- Sin warnings críticos
- Testing de flujos principales
- Validación en producción lista

---

## 📝 Notas Importantes

1. **Plataforma de Producción**: Será usada por importante agencia en Medellín
2. **Uso Móvil**: Mayoría de clientes usarán celular
3. **Cero Tolerancia a Errores**: Debe funcionar perfectamente
4. **Experiencia de Usuario**: Prioridad absoluta
5. **Sistema Dinámico**: Todo configurable desde admin
6. **Seguridad**: Pagos, datos de clientes, integraciones
7. **Escalabilidad**: Preparada para crecer

---

## 🔗 Referencias

- **Landing Page**: Secciones 1-2
- **Reservas**: Secciones 2-3
- **Admin**: Sección 3
- **Aliados**: Sección 4
- **Pagos**: Sección 5
- **Tracking**: Sección 6
- **Servicios**: Sección 7
- **Recursos**: Secciones 8-10
- **Precios**: Sección 11
- **Configuración**: Secciones 12-13

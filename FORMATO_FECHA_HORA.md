# 📅 Formato de Fecha y Hora - Guía Visual

## 🕐 Campos de Hora (TimeInput)

### En Computador (Desktop)

Cuando uses la aplicación desde un computador, verás campos de hora que te permiten **escribir directamente**:

```
┌─────────────────────────────────────┐
│ Hora *                              │
├─────────────────────────────────────┤
│ Ej: 16:50          ⌕               │
├─────────────────────────────────────┤
│ Formato 24 horas (00:00 - 23:59)   │
│ Ejemplo: 09:30, 16:50, 22:15       │
└─────────────────────────────────────┘
```

**¿Cómo escribir la hora?**

✅ **Formato correcto (24 horas):**
- `09:30` - Las 9:30 de la mañana
- `14:00` - Las 2:00 de la tarde
- `16:50` - Las 4:50 de la tarde
- `22:15` - Las 10:15 de la noche
- `23:59` - Las 11:59 de la noche

❌ **Formato incorrecto:**
- `4:50 PM` ❌ (no uses AM/PM)
- `25:00` ❌ (las horas van de 0 a 23)
- `16:60` ❌ (los minutos van de 0 a 59)

**Tip:** Solo escribe los números, el sistema agrega automáticamente los dos puntos (:)
- Escribes: `1650` → Se convierte en: `16:50` ✨

### En Móvil

En dispositivos móviles, verás el selector nativo de hora de tu teléfono:

```
┌─────────────────────────────────────┐
│ Hora *                              │
├─────────────────────────────────────┤
│      🕐 [Selector nativo]          │
│                                     │
└─────────────────────────────────────┘
```

---

## 📆 Campos de Fecha (DateInput)

### En Computador (Desktop)

Los campos de fecha también permiten escritura manual:

```
┌─────────────────────────────────────┐
│ Fecha *                             │
├─────────────────────────────────────┤
│ Ej: 25/12/2024     📅              │
└─────────────────────────────────────┘
```

**¿Cómo escribir la fecha?**

✅ **Formato correcto (dd/mm/yyyy):**
- `25/12/2024` - 25 de diciembre de 2024
- `01/01/2025` - 1 de enero de 2025
- `15/08/2024` - 15 de agosto de 2024

❌ **Formato incorrecto:**
- `12/25/2024` ❌ (no uses formato americano mes/día/año)
- `2024/12/25` ❌ (no uses formato año/mes/día)

**Tip:** Solo escribe los números, el sistema agrega automáticamente las barras (/)
- Escribes: `25122024` → Se convierte en: `25/12/2024` ✨

### En Móvil

En dispositivos móviles, verás el selector nativo de fecha de tu teléfono:

```
┌─────────────────────────────────────┐
│ Fecha *                             │
├─────────────────────────────────────┤
│      📅 [Selector nativo]          │
│                                     │
└─────────────────────────────────────┘
```

---

## 💡 Ejemplos Prácticos

### Escenario 1: Reserva para las 4:50 PM del 25 de diciembre

**Fecha:** `25/12/2024`
**Hora:** `16:50` (recuerda: 4:50 PM = 16:50 en formato 24 horas)

### Escenario 2: Reserva para las 9:30 AM del 1 de enero

**Fecha:** `01/01/2025`
**Hora:** `09:30`

### Escenario 3: Reserva para las 11:15 PM del 15 de agosto

**Fecha:** `15/08/2024`
**Hora:** `23:15` (recuerda: 11:15 PM = 23:15 en formato 24 horas)

---

## 🔄 Conversión Rápida 12h ↔ 24h

| 12 horas | 24 horas | | 12 horas | 24 horas |
|----------|----------|---|----------|----------|
| 12:00 AM | `00:00` | | 12:00 PM | `12:00` |
| 1:00 AM  | `01:00` | | 1:00 PM  | `13:00` |
| 2:00 AM  | `02:00` | | 2:00 PM  | `14:00` |
| 3:00 AM  | `03:00` | | 3:00 PM  | `15:00` |
| 4:00 AM  | `04:00` | | 4:00 PM  | `16:00` |
| 5:00 AM  | `05:00` | | 5:00 PM  | `17:00` |
| 6:00 AM  | `06:00` | | 6:00 PM  | `18:00` |
| 7:00 AM  | `07:00` | | 7:00 PM  | `19:00` |
| 8:00 AM  | `08:00` | | 8:00 PM  | `20:00` |
| 9:00 AM  | `09:00` | | 9:00 PM  | `21:00` |
| 10:00 AM | `10:00` | | 10:00 PM | `22:00` |
| 11:00 AM | `11:00` | | 11:00 PM | `23:00` |

**Regla fácil:** 
- **AM (mañana):** Usa el número tal cual (con 0 adelante si es menor a 10)
- **PM (tarde/noche):** Suma 12 al número
  - 1:00 PM = 1 + 12 = `13:00`
  - 4:50 PM = 4 + 12 = `16:50`
  - 11:15 PM = 11 + 12 = `23:15`

---

## ✨ Características

- ✅ Auto-formato mientras escribes
- ✅ Validación automática
- ✅ Funciona en móvil y computador
- ✅ No más errores de formato
- ✅ Fácil y rápido de usar

---

## 🆘 ¿Necesitas Ayuda?

Si tienes dudas sobre cómo ingresar la fecha o hora, recuerda:
1. **Hora:** Formato 24 horas (00:00 a 23:59)
2. **Fecha:** Formato día/mes/año (dd/mm/yyyy)
3. El texto de ayuda debajo del campo te guiará
4. El sistema valida automáticamente tu entrada

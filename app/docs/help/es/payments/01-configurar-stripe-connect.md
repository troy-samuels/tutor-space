---
title: "Configurando Stripe Connect"
slug: "configurar-stripe-connect"
description: "Acepta pagos con tarjeta directamente y recibe depósitos en tu cuenta bancaria con Stripe Connect."
category: "payments"
categoryLabel: "Pagos"
order: 1
updatedAt: "2025-01-15"
alternateLocale:
  locale: "en"
  slug: "stripe-connect-setup"
---

## ¿Por Qué Stripe Connect?

Stripe Connect te permite:

- **Aceptar pagos con tarjeta** - Los estudiantes pagan con tarjetas de crédito/débito
- **Recibir depósitos directos** - Los fondos van directamente a tu cuenta bancaria
- **Cero comisiones de plataforma** - TutorLingua cobra 0% de comisión
- **Experiencia profesional** - Checkout seguro y con tu marca

## Configurando Stripe Connect

### Paso 1: Iniciar la Conexión

1. Ve a **Configuración > Pagos**
2. Haz clic en **"Conectar con Stripe"**
3. Serás redirigido a la incorporación de Stripe

### Paso 2: Completar la Incorporación de Stripe

Stripe te pedirá:

**Información del Negocio**
- Tipo de negocio (individual o empresa)
- Tu nombre legal
- Dirección del negocio

**Verificación de Identidad**
- Identificación gubernamental
- Puede requerirse verificación adicional

**Cuenta Bancaria**
- Detalles de cuenta bancaria para depósitos
- Números de cuenta y ruta

> **Nota:** Esta información va directamente a Stripe. TutorLingua nunca ve tus datos bancarios.

### Paso 3: Verificar Tu Cuenta

Stripe puede tomar 1-2 días hábiles para verificar tu información. Recibirás un correo cuando esté completo.

### Paso 4: Comenzar a Aceptar Pagos

Una vez verificado, el estado de **Stripe Connect** en tu configuración mostrará "Conectado". ¡Los estudiantes ahora pueden pagar con tarjeta!

## Cómo Funcionan los Pagos

### Cuando un Estudiante Reserva

1. El estudiante selecciona un servicio y horario
2. En el checkout, ingresa los datos de su tarjeta
3. El pago es procesado por Stripe
4. La reserva se confirma automáticamente

### Depósitos a Tu Banco

Stripe envía depósitos de forma continua:
- **Cuentas de EE.UU.:** 2 días hábiles
- **Internacional:** Varía según el país

Puedes rastrear los depósitos en tu Panel de Stripe.

## Comisiones de Stripe

Stripe cobra comisiones estándar de procesamiento:
- **2.9% + $0.30** por transacción (EE.UU.)
- Las tarifas varían según el país

TutorLingua agrega **cero comisiones adicionales** sobre las tarifas de Stripe.

### Ejemplo

Para una lección de $50:
- Comisión de Stripe: ~$1.75
- Comisión de TutorLingua: $0
- **Recibes:** ~$48.25

## Administrando Tu Cuenta de Stripe

### Accediendo al Panel de Stripe

Desde **Configuración > Pagos**, haz clic en **"Ver Panel de Stripe"** para:
- Ver todas las transacciones
- Rastrear depósitos
- Descargar reportes
- Actualizar información bancaria

### Actualizando Datos Bancarios

Para cambiar tu cuenta bancaria de depósitos:
1. Haz clic en "Ver Panel de Stripe"
2. Ve a Configuración > Depósitos
3. Actualiza tu información bancaria

## Reembolsos

Cuando necesites reembolsar a un estudiante:

1. Abre la reserva en TutorLingua
2. Haz clic en **"Reembolsar"**
3. Elige reembolso completo o parcial
4. Confirma el reembolso

Los reembolsos se procesan a través de Stripe y típicamente toman 5-10 días hábiles en aparecer en el estado de cuenta del estudiante.

## Solución de Problemas

### "Cuenta de Stripe no verificada"

Si tu cuenta aparece como no verificada:
1. Revisa tu correo para mensajes de Stripe
2. Inicia sesión en el Panel de Stripe
3. Completa cualquier paso de verificación pendiente

### "Depósitos en espera"

Stripe puede retener depósitos si:
- La verificación está incompleta
- Se detectó actividad inusual
- La cuenta necesita revisión

Contacta al soporte de Stripe directamente para problemas de depósitos.

### Los estudiantes no pueden pagar

Asegúrate de:
- Tu cuenta de Stripe está completamente conectada
- Los servicios tienen precios establecidos
- Los pagos con tarjeta están habilitados en configuración

## Próximos Pasos

- Prueba una reserva con tu propia tarjeta
- [Configura opciones de pago manual](/es/help/pagos-manuales) como respaldo
- Comparte tu enlace de reservas con estudiantes

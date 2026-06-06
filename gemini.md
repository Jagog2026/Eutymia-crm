# 📑 Contexto de Desarrollo y Control de Cambios: Eutymia CRM

Este documento sirve como la fuente de verdad y especificación técnica para la ejecución de la bolsa de cambios actual sobre el proyecto **Eutymia CRM** (Sistema de Gestión de Terapeutas y Pacientes). Está estructurado para ser interpretado por agentes de IA de desarrollo (CLI) o para guiar el flujo de desarrollo manual, priorizando la arquitectura limpia, el rendimiento en base de datos y la consistencia en el estado de la aplicación.

---

## 📊 Estado Actual de la Bolsa de Horas
* **Horas Compradas:** 8.00 hs
* **Horas Consumidas:** 0.00 hs
* **Saldo Disponible:** 8.00 hs
* **Carga de Trabajo Estimada:** 6.60 hs *(Margen de holgura: 1.40 hs)*

---

## 🛠️ Objetivos Técnicos y Arquitectónicos Globales
1. **Backend First (Supabase):** Antes de modificar cualquier interfaz en Vue.js, validar el esquema relacional, triggers, funciones RPC y políticas RLS implicadas.
2. **Modularidad y DRY:** Consolidar componentes en lugar de duplicar lógica (especialmente en la administración de perfiles y usuarios).
3. **Consistencia de Estado:** Garantizar que los filtros de las vistas reactivas y el estado del calendario no muten o se destruyan de forma inesperada ante eventos secundarios (como pasarelas de pago o modales).

---

## 📋 Desglose de Tickets y Directrices de Implementación

### 📑 Módulo 1: Administración de Usuarios y Datos Relacionales

#### Ticket #1: 🛠️ Error - Causa Técnica en Eliminación de Terapeutas
* **Fecha:** 30/05/2026
* **Prioridad:** ⚡ Alta
* **Tiempo Estimado:** 1.00 hs
* **Descripción:** Investigar la causa técnica que impide la eliminación de terapeutas desde el módulo de administración.
* **Directriz de Resolución:** * *Lógica subyacente:* El error suele deberse a una restricción de integridad referencial (`Foreign Key Violation`) en la base de datos de Supabase. Los terapeutas probablemente tienen llaves foráneas activas en tablas como `citas`, `historias_clinicas` o `disponibilidad_horaria`.
    * *Acción:* Evaluar si es viable aplicar un borrado lógico (columna `is_active` o `deleted_at`) en lugar de un borrado físico, o en su defecto, configurar la restricción en Supabase con `ON DELETE CASCADE` o `ON DELETE SET NULL` según las reglas de negocio de Eutymia para no romper la persistencia de datos históricos de los pacientes.

#### Ticket #2: ✨ Mejora - Unificación de Módulos de Terapeutas
* **Fecha:** 30/05/2026
* **Prioridad:** 🟢 Media
* **Tiempo Estimado:** 1.00 hs
* **Descripción:** Consolidar la gestión de terapeutas dentro de la sección de administración para eliminar la redundancia en la plataforma.
* **Directriz de Resolución:**
    * *Lógica subyacente:* Evitar la duplicidad de vistas y componentes CRUD.
    * *Acción:* Centralizar las funciones de creación, edición y visualización de perfiles de terapeutas bajo un único componente maestro en el panel de administración. Reutilizar subcomponentes mediante props e inyección de dependencias/composición en Vue 3 (Composition API).

---

### 📑 Módulo 2: Flujo de Pagos y Reactividad de Filtros

#### Ticket #3: 🛠️ Error - Persistencia de Filtros Post-Pago
* **Fecha:** 30/05/2026
* **Prioridad:** ⚡ Alta
* **Tiempo Estimado:** 0.30 hs
* **Descripción:** Corregir el error que reinicia los filtros seleccionados al procesar un pago.
* **Directriz de Resolución:**
    * *Lógica subyacente:* El procesamiento del pago provoca un ciclo de vida de desmontaje/remontaje del componente o una redirección/actualización de la ruta que limpia el estado reactivo local.
    * *Acción:* Almacenar temporalmente los filtros activos utilizando la URL (queries de `vue-router`), el estado global (Pinia/Vuex), o en su defecto `sessionStorage`, para restaurar los filtros inmediatamente después de que el webhook o la promesa de confirmación del pago se resuelva de forma exitosa.

---

### 📑 Módulo 3: Optimización del Calendario e Interfaz (UI/UX)

#### Ticket #4: 🎨 Ajuste - Dimensiones y Consistencia Semanal del Calendario
* **Fecha:** 30/05/2026
* **Prioridad:** ⚡ Alta
* **Tiempo Estimado:** 1.00 hs
* **Descripción:** Modificar las dimensiones de las tarjetas y el tamaño del despliegue en la vista semanal. Incorporar la información faltante para que coincida con el formato diario.
* **Directriz de Resolución:**
    * *Lógica subyacente:* Romper la consistencia de los esquemas de datos expuestos entre la vista diaria y semanal genera fricción cognitiva en los terapeutas.
    * *Acción:* Homogeneizar los objetos de datos pasados a las tarjetas del calendario. Asegurar que campos como el "Nombre del paciente", "Tipo de consulta/terapia" y "Estado del pago" se rendericen también en los bloques de la vista semanal utilizando layouts basados en CSS estructurado estándar (evitando que colapsen layouts al cambiar de tamaño).

#### Ticket #5: 🎨 Ajuste - Reseteo de Formulario de Citas
* **Fecha:** 30/05/2026
* **Prioridad:** ⚡ Alta
* **Tiempo Estimado:** 1.00 hs
* **Descripción:** Configurar la limpieza automática de campos en el formulario al iniciar una cita nueva.
* **Directriz de Resolución:**
    * *Lógica subyacente:* Falta de limpieza del estado local al ejecutar el evento de apertura del modal.
    * *Acción:* Implementar una función purificadora (`resetForm()`) que devuelva el objeto reactivo del formulario (`ref` o `reactive`) a su estado inicial vacío antes de renderizar la vista del formulario de creación.

#### Ticket #6: 🎨 Ajuste - Sistema de Colores por Estatus de Cita
* **Fecha:** 30/05/2026
* **Prioridad:** ⚡ Alta
* **Tiempo Estimado:** 0.30 hs
* **Descripción:** Actualizar el sistema de colores asignando azul para citas reservadas por defecto y morado para eventos cancelados.
* **Directriz de Resolución:**
    * *Lógica subyacente:* Identificación visual intuitiva y rápida de estados de agenda.
    * *Acción:* Actualizar el diccionario o la función mapeadora de clases CSS/estilos dinámicos vinculados al estado (`status`) de la cita:
        * `status === 'reservada' -> #2563EB` (Azul corporativo / Slate Blue)
        * `status === 'cancelada' -> #7C3AED` (Morado / Violet)

---

### 📑 Módulo 4: Integración de Base de Datos e Informes Financieros

#### Ticket #7: 🛠️ Error - Reparación de Integridad en Reportes Financieros
* **Fecha:** 30/05/2026
* **Prioridad:** 🟢 Media
* **Tiempo Estimado:** 2.00 hs
* **Descripción:** Revisar las tablas de la base de datos para asegurar la correcta integración de los ingresos y sesiones en el panel de control.
* **Directriz de Resolución:**
    * *Lógica subyacente:* Desalineación entre las filas transaccionales y los agregados numéricos calculados para el Dashboard, posiblemente por registros huérfanos o desfase en los tipos de datos (ej. mezclar strings con floats/numeric en SQL).
    * *Acción:* Analizar los queries de agregación (`SUM`, `COUNT`, `GROUP BY`) que alimentan el backend de reportes. Verificar que todas las sesiones completadas tengan asignado un registro correspondiente en la tabla de cobros/ingresos y auditar las uniones (`JOINs`) para prevenir la exclusión accidental de datos legítimos en el Panel.

---

## 🚀 Guía de Validación y Criterios de Aceptación
Para dar por cerrado cada cambio, el agente o desarrollador debe verificar:
- [ ] **Cero regresiones:** Las mutaciones en tablas de Supabase no deben alterar el funcionamiento de las consultas existentes de pacientes.
- [ ] **Manejo de Errores Silenciosos:** En llamadas asíncronas (como el procesamiento del pago o la carga de reportes), asegurar el uso de bloques `try/catch` mostrando estados de carga (`loading states`) limpios al usuario.
- [ ] **Consistencia de UI:** Los nuevos colores del calendario deben cumplir con un buen contraste visual para accesibilidad.

# Documentación técnica del dashboard TechStore360

## Objetivo del dashboard

El dashboard TechStore360 es una aplicación web para consultar indicadores comerciales, ventas, stock, reclamos, alertas y procesos ETL. La interfaz está organizada como un panel ejecutivo con filtros globales, visualizaciones gráficas, widgets operativos y tablas de detalle.

La aplicación consume datos desde una API backend protegida con autenticación Bearer Token.

## Librerías principales usadas

- **React**: construcción de la interfaz por componentes.
- **Vite**: servidor de desarrollo y empaquetado de la aplicación.
- **Axios**: consumo de endpoints del backend.
- **Recharts**: librería principal para gráficos.
- **Lucide React**: iconos del dashboard, navbar, filtros, KPIs y acciones.
- **Framer Motion**: animaciones en la pantalla de login.
- **CSS propio**: diseño visual oscuro/neón, layouts, cards, tablas, estados hover, popups y responsividad.

## Estructura general del proyecto

```txt
src/
  App.tsx
  main.tsx
  App.css
  index.css

  features/auth/
    LoginPage.tsx

  components/dashboard/
    ExecutiveDashboard.jsx

  components/charts/
    ClaimsMonthlyChart.jsx
    PaymentMethodChart.jsx
    SalesBranchChart.jsx
    SalesCategoryChart.jsx
    SalesMonthlyChart.jsx
    SalesSellerChart.jsx

  components/common/
    AsyncComboBox.tsx

  hooks/
    useDashboardData.js
    useApi.ts
    useFilters.ts

  services/
    techstoreDashboardApi.js
    api.ts

  utils/
    buildQueryParams.ts
    dashboardFormatters.js
    dashboardMappers.js
```

## Punto de entrada

El archivo `src/main.tsx` monta la aplicación principal.

`src/App.tsx` controla:

- Estado de autenticación.
- Lectura y validación del token guardado.
- Login contra el backend.
- Logout.
- Bloqueo del dashboard si no existe un token válido.
- Retorno automático al login si el backend responde `401`.

## Autenticación

El login se realiza con:

```http
POST /api/auth/login
```

Body esperado:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Respuesta esperada:

```json
{
  "access_token": "token.jwt",
  "token_type": "bearer"
}
```

El token se guarda en:

```txt
localStorage.techstore.token
```

Después del login, todas las llamadas protegidas envían:

```http
Authorization: Bearer <token>
```

Si no hay token, el dashboard no se renderiza. Si el token está vencido, mal formado o el backend devuelve `401`, se limpia la sesión y se regresa al login.

## Configuración de API

La app usa `.env` para definir la conexión:

```env
VITE_API_URL=/api
VITE_TECHSTORE_API_URL=http://localhost:8000
```

En desarrollo, Vite usa proxy para que las llamadas a `/api` se redirijan al backend.

## Servicios de datos

Hay dos clientes principales:

### `src/services/techstoreDashboardApi.js`

Cliente principal del dashboard ejecutivo. Maneja:

- Base URL.
- Resolución de rutas `/api`.
- Header Bearer Token.
- Manejo de errores HTTP.
- Limpieza de sesión en `401`.

Endpoints usados:

- `/api/dashboard/overview`
- `/api/dashboard/ventas-metodo-pago`
- `/api/ventas`
- `/api/stock`
- `/api/stock/bajo`
- `/api/reclamos/por-cliente`
- `/api/reclamos/por-mes`
- `/api/alertas`
- `/api/logs`
- `/api/errores`
- `/api/filtros`
- `/api/clientes`
- `/api/productos`
- `/api/sucursales`
- `/api/categorias`
- `/api/vendedores`

### `src/services/api.ts`

Cliente auxiliar usado por componentes de gráficos separados. También envía Bearer Token y limpia sesión si recibe `401`.

## Hook principal de datos

`src/hooks/useDashboardData.js` centraliza la carga del dashboard.

Este hook:

- Recibe filtros globales.
- Limpia filtros vacíos.
- Lanza varias solicitudes en paralelo.
- Maneja errores por sección sin romper todo el dashboard.
- Normaliza datos para gráficos y widgets.
- Expone:
  - `data`
  - `model`
  - `errors`
  - `loading`
  - `refreshing`
  - `refetch`

El `model` es la capa que transforma datos crudos en datos listos para UI.

## Normalización y formateo

Los archivos utilitarios principales son:

### `src/utils/dashboardMappers.js`

Se encarga de:

- Extraer secciones del payload.
- Agrupar filas.
- Normalizar datos mensuales.
- Construir KPIs.
- Convertir respuestas variables del backend a estructuras consistentes.

### `src/utils/dashboardFormatters.js`

Se encarga de mostrar:

- Moneda.
- Números.
- Porcentajes.
- Fechas.
- Fechas con hora.

## Vistas principales

El dashboard está centralizado en:

```txt
src/components/dashboard/ExecutiveDashboard.jsx
```

Contiene tres rutas internas:

### Overview

Ruta principal:

```txt
/
```

Incluye:

- KPIs comerciales.
- Filtros globales.
- Gráficos ejecutivos.
- Widgets operativos:
  - Clientes VIP.
  - Stock crítico.
  - Alertas operativas.

### Ventas

Ruta:

```txt
/ventas
```

Incluye:

- KPIs rápidos.
- Tabla paginada de ventas.
- Panel lateral de detalle de venta.

### ETL

Ruta:

```txt
/etl
```

Incluye:

- Procesos registrados.
- Errores detectados.
- Última carga.
- Última incidencia.
- Ranking de tipos de errores.
- Tabla de logs ETL.
- Tabla de errores ETL.

## Filtros globales

Los filtros se aplican automáticamente al cambiar.

Filtros disponibles:

- Año.
- Mes.
- Sucursal.
- Producto.
- Cliente.
- Vendedor.
- Método de pago.
- Categoría.

Los filtros usan:

- Select nativo para año y mes.
- Combobox asíncrono para búsquedas remotas.
- Chips compactos para mostrar filtros activos.

Los nombres técnicos se convierten a etiquetas de presentación. Por ejemplo:

- `anio` se muestra como `Año`.
- `id_sucursal` se muestra como `Sucursal`.
- `id_producto` se muestra como `Producto`.

## Gráficos usados

La librería de gráficos usada es:

```txt
Recharts
```

### Ventas por mes

Componente principal:

```txt
SalesTrendChart
```

Tipo de gráfico:

- `AreaChart`
- `Area`
- `XAxis`
- `YAxis`
- `Tooltip`

Uso:

- Mostrar tendencia temporal de ingresos.
- Permite ver picos y variación mensual.

### Ventas por categoría

Tipo de gráfico:

- `BarChart` horizontal.
- `Bar`.
- `YAxis` categórico.

Uso:

- Comparar categorías según valor vendido.
- Muestra participación porcentual.

### Top productos

Tipo de gráfico:

- `BarChart` horizontal compacto.

Uso:

- Mostrar productos más relevantes por unidades o ingresos.

### Ventas por sucursal

Tipo de gráfico:

- `BarChart` horizontal.

Uso:

- Comparar sucursales por desempeño comercial.

### Métodos de pago

Tipo de gráfico:

- `PieChart`
- `Pie`
- `Cell`

Uso:

- Mostrar distribución por método de pago.
- Mantiene gráfico tipo pastel/donut.
- Incluye leyenda compacta con porcentaje.

### Reclamos

Componente:

```txt
ClaimsMonthlyChart.jsx
```

Tipos de visualización:

- Tira mensual con cantidad de reclamos.
- Barras horizontales por categoría/producto.
- Tooltip con cliente, producto y fecha.

Uso:

- Mostrar de qué meses vienen los reclamos.
- Mantener contexto de categoría/producto sin perder detalle.

## Widgets operativos

Además de gráficos, el dashboard usa widgets de análisis rápido:

### Clientes VIP

Muestra:

- Ranking de clientes.
- Monto comprado.
- Número de reclamos.

### Stock crítico

Muestra:

- Productos con stock bajo o crítico.
- Categoría.
- Indicador visual de nivel de stock.

### Alertas operativas

Muestra:

- Tipo de alerta.
- Descripción.
- Fecha.
- Señal visual de prioridad.

## Tablas y detalles

Las tablas se usan para:

- Ventas.
- Logs ETL.
- Errores ETL.
- Datos operativos.

Al hacer clic en una fila se abre un modal de detalle.

El modal no muestra nombres técnicos crudos. Convierte claves como:

- `stock_actual` → `Stock actual`
- `dias_estimados_stock` → `Días estimados de stock`
- `unidades_vendidas_30d` → `Unidades vendidas en 30 días`
- `id_metodo_pago` → `Método de pago`

Esto es solo presentación; los datos originales no se modifican.

## Diseño visual

El diseño usa una estética oscura con acentos neón.

Elementos principales:

- Fondo oscuro.
- Cards con bordes luminosos.
- Colores por tipo de métrica.
- Hover suave.
- Tooltips oscuros.
- Popups oscuros.
- Filtros compactos.
- Estados visuales para alertas, stock, ETL y KPIs.

Los estilos están principalmente en:

```txt
src/App.css
src/index.css
```

## Flujo general de funcionamiento

1. El usuario entra a la aplicación.
2. `App.tsx` revisa si existe token válido.
3. Si no hay token, se muestra login.
4. Login envía credenciales a `/api/auth/login`.
5. Si el backend responde con Bearer Token, se guarda en `localStorage`.
6. Se renderiza `ExecutiveDashboard`.
7. `useDashboardData` carga datos desde varios endpoints.
8. Los datos se normalizan con `dashboardMappers`.
9. Los gráficos reciben datos ya preparados.
10. Los filtros actualizan automáticamente las consultas.
11. Si el backend responde `401`, se cierra sesión.

## Archivos más importantes

| Archivo | Responsabilidad |
|---|---|
| `src/App.tsx` | Login, sesión, validación de token y logout |
| `src/features/auth/LoginPage.tsx` | Pantalla de login |
| `src/components/dashboard/ExecutiveDashboard.jsx` | Dashboard principal, rutas internas, cards, widgets y modal |
| `src/hooks/useDashboardData.js` | Carga y normalización central de datos |
| `src/services/techstoreDashboardApi.js` | Cliente API principal del dashboard |
| `src/services/api.ts` | Cliente API auxiliar para gráficos |
| `src/utils/dashboardMappers.js` | Agrupación y normalización de datos |
| `src/utils/dashboardFormatters.js` | Formatos de moneda, fecha, número y porcentaje |
| `src/components/charts/ClaimsMonthlyChart.jsx` | Gráfico y resumen de reclamos |
| `src/App.css` | Estilos principales del dashboard |
| `src/index.css` | Estilos base y estilos globales |

## Consideraciones de mantenimiento

- Si cambia el backend, actualizar primero `techstoreDashboardApi.js`.
- Si cambia el formato de datos, ajustar `dashboardMappers.js`.
- Si se agrega un gráfico nuevo, preferir Recharts para mantener consistencia.
- Si se agregan filtros, incluirlos en `compactFilters` dentro de `useDashboardData.js`.
- Si llega una clave técnica nueva en detalles, agregar su etiqueta en `detailLabels` dentro de `ExecutiveDashboard.jsx`.
- Mantener los nombres técnicos para comunicación con el backend, pero usar etiquetas humanas en la interfaz.

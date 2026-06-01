export const API_BASE_URL = import.meta.env.DEV
  ? ''
  : import.meta.env.VITE_TECHSTORE_API_URL ?? 'http://localhost:8000'

export type Endpoint = {
  method: 'GET' | 'POST'
  path: string
  purpose: string
  params: string[]
}

export type EndpointGroup = {
  name: string
  description: string
  badge: string
  endpoints: Endpoint[]
}

export type ImplementationPhase = {
  title: string
  summary: string
  endpoints: string[]
  tasks: string[]
}

const dashboardParams = ['fecha_inicio', 'fecha_fin', 'mes', 'anio', 'id_sucursal', 'id_producto', 'id_cliente', 'categoria']
const comboboxParams = ['search', 'limit']

export const endpointGroups: EndpointGroup[] = [
  {
    name: 'Auth',
    description: 'Token bearer para habilitar el resto del dashboard.',
    badge: 'foundation',
    endpoints: [
      {
        method: 'POST',
        path: '/api/auth/login',
        purpose: 'Intercambia credenciales por bearer token.',
        params: ['username', 'password'],
      },
    ],
  },
  {
    name: 'Dashboard',
    description: 'Resumen y overview filtrable para cargar el cockpit completo.',
    badge: 'overview',
    endpoints: [
      {
        method: 'GET',
        path: '/api/dashboard/resumen',
        purpose: 'KPIs principales con filtros globales.',
        params: dashboardParams,
      },
      {
        method: 'GET',
        path: '/api/dashboard/overview',
        purpose: 'Payload agregado para dashboard: KPIs, series, rankings e insights.',
        params: dashboardParams,
      },
    ],
  },
  {
    name: 'Ventas',
    description: 'Base de actividad comercial y tendencia mensual.',
    badge: 'core',
    endpoints: [
      {
        method: 'GET',
        path: '/api/ventas',
        purpose: 'Listado de ventas recientes filtradas.',
        params: dashboardParams,
      },
      {
        method: 'GET',
        path: '/api/ventas/todas',
        purpose: 'Historico completo de ventas filtradas.',
        params: dashboardParams,
      },
      {
        method: 'GET',
        path: '/api/ventas/por-mes',
        purpose: 'Concentrado por mes para la curva principal.',
        params: dashboardParams,
      },
    ],
  },
  {
    name: 'Productos',
    description: 'Inventario, top sellers y alertas de stock.',
    badge: 'catalog',
    endpoints: [
      {
        method: 'GET',
        path: '/api/productos',
        purpose: 'Combobox de productos con búsqueda.',
        params: comboboxParams,
      },
      {
        method: 'GET',
        path: '/api/productos/top',
        purpose: 'Ranking de productos top.',
        params: dashboardParams,
      },
      {
        method: 'GET',
        path: '/api/productos/stock-critico',
        purpose: 'Lista de inventario en riesgo.',
        params: dashboardParams,
      },
    ],
  },
  {
    name: 'Clientes y Sucursales',
    description: 'Segmentacion comercial y contexto operativo.',
    badge: 'ops',
    endpoints: [
      {
        method: 'GET',
        path: '/api/clientes',
        purpose: 'Combobox de clientes con búsqueda.',
        params: comboboxParams,
      },
      {
        method: 'GET',
        path: '/api/clientes/vip',
        purpose: 'Top clientes VIP.',
        params: dashboardParams,
      },
      {
        method: 'GET',
        path: '/api/sucursales',
        purpose: 'Combobox de sucursales con búsqueda.',
        params: comboboxParams,
      },
      {
        method: 'GET',
        path: '/api/categorias',
        purpose: 'Combobox de categorías con búsqueda.',
        params: comboboxParams,
      },
    ],
  },
  {
    name: 'BI',
    description: 'Capa analitica para el cockpit principal.',
    badge: 'analytics',
    endpoints: [
      {
        method: 'GET',
        path: '/api/analitica/ventas-por-sucursal',
        purpose: 'Ingresos, transacciones y ticket promedio por sucursal.',
        params: dashboardParams,
      },
    ],
  },
  {
    name: 'IA',
    description: 'Recomendaciones y prediccion estacional.',
    badge: 'ai',
    endpoints: [
      {
        method: 'GET',
        path: '/api/patrones/recomendaciones',
        purpose: 'Complementos cruzados por co-ocurrencia.',
        params: [],
      },
      {
        method: 'GET',
        path: '/api/predicciones',
        purpose: 'Proyeccion estacional del backend.',
        params: [],
      },
    ],
  },
]

export const implementationPhases: ImplementationPhase[] = [
  {
    title: '1. Autenticacion y contrato',
    summary: 'Conectar login, bearer token y capa base de fetch.',
    endpoints: ['/api/auth/login'],
    tasks: ['Guardar token', 'Proteger llamadas', 'Manejar errores 401'],
  },
  {
    title: '2. Cockpit BI',
    summary: 'Armar KPIs, tendencia mensual y cortes principales.',
    endpoints: [
      '/api/dashboard/overview',
      '/api/dashboard/resumen',
      '/api/ventas',
      '/api/ventas/por-mes',
      '/api/analitica/ventas-por-sucursal',
    ],
    tasks: ['Dashboard principal', 'Filtros globales', 'Graficas responsivas'],
  },
  {
    title: '3. Inventario y clientes',
    summary: 'Listas operativas y filtros de busqueda.',
    endpoints: [
      '/api/productos',
      '/api/productos/top',
      '/api/productos/stock-critico',
      '/api/clientes',
      '/api/clientes/vip',
      '/api/sucursales',
    ],
    tasks: ['Tablas con busqueda', 'Alertas de stock', 'Segmentos VIP'],
  },
  {
    title: '4. IA aplicada',
    summary: 'Recomendaciones y proyeccion accionable.',
    endpoints: ['/api/patrones/recomendaciones', '/api/predicciones'],
    tasks: ['Lookup por producto', 'Proyeccion mensual', 'Bloque de insights'],
  },
  {
    title: '5. Pulido y entrega',
    summary: 'Estados vacios, skeletons, export y detalle visual.',
    endpoints: ['todos'],
    tasks: ['Animaciones', 'Persistencia local', 'Responsive final'],
  },
]

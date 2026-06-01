export type MetricCard = {
  label: string
  value: string
  delta: string
  tone: 'cyan' | 'lime' | 'amber' | 'violet'
}

export type ChartPoint = {
  name: string
  value: number
}

export type ListItem = {
  title: string
  detail: string
  accent: string
}

export type ForecastItem = {
  period: string
  revenue: string
  growth: string
}

export const demoKpis: MetricCard[] = [
  { label: 'Ingresos del mes', value: '$3.84M', delta: '+18.4%', tone: 'cyan' },
  { label: 'Margen operativo', value: '31.8%', delta: '+2.6 pp', tone: 'lime' },
  { label: 'Tickets promedio', value: '842', delta: '+9.1%', tone: 'amber' },
  { label: 'Unidades vendidas', value: '18.4k', delta: '+12.9%', tone: 'violet' },
]

export const monthlyTrend: ChartPoint[] = [
  { name: 'Ene', value: 2.1 },
  { name: 'Feb', value: 2.4 },
  { name: 'Mar', value: 2.8 },
  { name: 'Abr', value: 3.1 },
  { name: 'May', value: 3.5 },
  { name: 'Jun', value: 3.84 },
  { name: 'Jul', value: 4.1 },
]

export const categoryBreakdown: ChartPoint[] = [
  { name: 'Audio', value: 34 },
  { name: 'Movilidad', value: 26 },
  { name: 'Perifericos', value: 18 },
  { name: 'Gaming', value: 14 },
  { name: 'Hogar', value: 8 },
]

export const branchPerformance: ChartPoint[] = [
  { name: 'Norte', value: 58 },
  { name: 'Centro', value: 47 },
  { name: 'Occidente', value: 43 },
  { name: 'Sur', value: 36 },
]

export const topProducts: ListItem[] = [
  { title: 'Auriculares Pro X', detail: 'Margen alto y compra cruzada fuerte', accent: '$420k' },
  { title: 'Silla Ergo Motion', detail: 'Rotacion estable y demanda B2B', accent: '$368k' },
  { title: 'Monitor Neo 32', detail: 'Top de ticket premium', accent: '$305k' },
]

export const stockAlerts: ListItem[] = [
  { title: 'Teclado Halo T1', detail: '12 unidades restantes', accent: 'riesgo alto' },
  { title: 'Hub USB-C 9 en 1', detail: '18 unidades restantes', accent: 'reponer' },
  { title: 'Mouse Aero Lite', detail: '22 unidades restantes', accent: 'vigilar' },
]

export const vipClients: ListItem[] = [
  { title: 'Andes Retail', detail: 'Compra acumulada en 90 dias', accent: '$1.42M' },
  { title: 'Naranja Studio', detail: 'Ticket promedio premium', accent: '$920k' },
  { title: 'Delta Labs', detail: 'Frecuencia alta', accent: '$812k' },
]

export const recommendations: ListItem[] = [
  { title: 'Combo audio + soporte', detail: 'Cross-sell sugerido por co-ocurrencia', accent: '96% match' },
  { title: 'Laptop + dock', detail: 'Buen ajuste para cuentas enterprise', accent: '91% match' },
  { title: 'Smart home + hubs', detail: 'Buen arrastre de ticket', accent: '88% match' },
]

export const predictions: ForecastItem[] = [
  { period: 'Junio 2026', revenue: '$4.12M', growth: '+14.2%' },
  { period: 'Julio 2026', revenue: '$4.28M', growth: '+18.1%' },
  { period: 'Agosto 2026', revenue: '$4.04M', growth: '+11.5%' },
]
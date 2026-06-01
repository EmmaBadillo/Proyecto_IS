export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-white">
      <div>
        <h1 className="text-xl font-semibold">Dashboard Analítico TechStore360</h1>
        <p className="text-sm text-gray-500">Análisis de ventas, stock, reclamos y alertas</p>
      </div>
      <div className="text-sm text-gray-600">v1.0</div>
    </header>
  )
}

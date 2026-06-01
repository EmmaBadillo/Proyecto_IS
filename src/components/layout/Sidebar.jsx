import { FiHome, FiBarChart2 } from 'react-icons/fi'

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4">
      <div className="mb-6">
        <div className="text-lg font-bold">TechStore360</div>
        <div className="text-sm text-gray-500">Analítico</div>
      </div>
      <nav className="flex flex-col gap-2">
        <a className="flex items-center gap-2 p-2 rounded hover:bg-gray-50" href="#"><FiHome /> Overview</a>
        <a className="flex items-center gap-2 p-2 rounded hover:bg-gray-50" href="#"><FiBarChart2 /> Ventas</a>
      </nav>
    </aside>
  )
}

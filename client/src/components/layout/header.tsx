import { Search, Bell } from "lucide-react"

interface HeaderProps {
  userInitials: string
}

export function Header({ userInitials }: HeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-800">
      <h1 className="text-xl font-bold">
        Resume<span className="text-blue-500">Scan</span>
      </h1>

      <div className="relative w-1/2">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search candidates or jobs..."
          className="w-full bg-gray-800 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 bg-blue-500 rounded-full w-2 h-2"></span>
        </button>
        <button className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center">{userInitials}</button>
      </div>
    </header>
  )
}


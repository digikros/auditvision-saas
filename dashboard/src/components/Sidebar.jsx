import React from 'react';
import { 
  FileUp, 
  LayoutDashboard, 
  Table2, 
  LogOut, 
  FileText,
  User
} from 'lucide-react';

const Sidebar = ({ activeView, setActiveView, onLogout, userEmail }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Ler factura', icon: FileUp },
    { id: 'spreadsheet', label: 'Planilha', icon: Table2 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 shrink-0 hidden md:flex">
      {/* Brand */}
      <div className="p-6 border-b border-gray-50 flex items-center gap-3">
        <div className="bg-gray-900 text-white p-2 rounded-lg">
          <FileText size={20} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Audit<span className="text-gray-500 font-medium">Vision</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive 
                  ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-gray-50 space-y-2">
        <div className="px-4 py-3 bg-gray-50 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
            <User size={16} />
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-gray-900 truncate">{userEmail}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Standard Account</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <LogOut size={18} />
          Sair da Conta
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

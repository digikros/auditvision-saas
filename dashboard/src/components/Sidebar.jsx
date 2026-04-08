import React from 'react';
import { 
  FileUp, 
  LayoutDashboard, 
  Table2, 
  LogOut, 
  FileText,
  User,
  X
} from 'lucide-react';

const Sidebar = ({ activeView, setActiveView, onLogout, userEmail, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Ler factura', icon: FileUp },
    { id: 'spreadsheet', label: 'Planilha', icon: Table2 },
  ];

  return (
    <>
      {/* Backdrop for mobile - with better transition feel */}
      <div 
        className={`fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 md:hidden transition-all duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-100 flex flex-col h-screen z-50 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        md:relative md:translate-x-0 md:w-64
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'}
      `}>
        {/* Brand Container */}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-gray-900 text-white p-2.5 rounded-xl shadow-inner group-hover:rotate-3 transition-transform">
              <FileText size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Audit<span className="text-gray-500 font-medium">Vision</span>
            </h1>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all md:hidden"
            aria-label="Fechar menu"
          >
             <X size={20} />
          </button>
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
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
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
    </>
  );
};

export default Sidebar;

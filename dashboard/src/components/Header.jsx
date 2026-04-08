import React from 'react';
import { Search, FileText } from 'lucide-react';

const Header = ({ count, searchTerm, setSearchTerm }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Logo and Count */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <div className="bg-gray-900 text-white p-2 rounded-lg">
              <FileText size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Audit<span className="text-gray-500 font-medium">Vision</span> Dashboard
            </h1>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {count} processadas
          </span>
        </div>

        {/* Search Bar */}
        <div className="w-full sm:w-96 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 sm:text-sm transition-all"
            placeholder="Buscar por fornecedor, NIF ou número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

      </div>
    </header>
  );
};

export default Header;

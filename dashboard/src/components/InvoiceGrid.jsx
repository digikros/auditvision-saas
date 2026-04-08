import React from 'react';
import InvoiceCard from './InvoiceCard';
import { SearchX, Inbox } from 'lucide-react';

const InvoiceGrid = ({ invoices, loading, onCardClick, isSearchActive }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border text-transparent border-gray-200 rounded-xl p-5 h-36 animate-pulse flex flex-col justify-between">
             <div className="flex gap-3">
                <div className="w-9 h-9 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2 py-1">
                   <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                   <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
             </div>
             <div className="flex justify-between border-t border-gray-100 pt-4">
                 <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                 <div className="h-3 bg-gray-200 rounded w-1/4"></div>
             </div>
          </div>
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          {isSearchActive ? <SearchX className="w-10 h-10 text-gray-400" /> : <Inbox className="w-10 h-10 text-gray-400" />}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          {isSearchActive ? "Nenhum resultado encontrado" : "Nenhuma factura processada ainda"}
        </h3>
        <p className="text-gray-500 max-w-sm">
          {isSearchActive 
            ? "Tente procurar com termos diferentes ou verifique a formatação do NIF." 
            : "As facturas analisadas pelo sistema aparecerão aqui de forma estruturada."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {invoices.map((invoice) => (
        <InvoiceCard 
          key={invoice.id} 
          invoice={invoice} 
          onClick={onCardClick} 
        />
      ))}
    </div>
  );
};

export default InvoiceGrid;

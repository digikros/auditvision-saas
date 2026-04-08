import React from 'react';
import { FileText, Calendar, Wallet } from 'lucide-react';

const InvoiceCard = ({ invoice, onClick }) => {
  return (
    <div 
      onClick={() => onClick(invoice)}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
            <FileText className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">
              {invoice.fornecedor}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">NIF: {invoice.nif}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Valor Total</span>
          <div className="flex items-center gap-1 font-bold text-gray-900">
            <Wallet className="w-3 h-3 text-gray-400" />
            <span>{invoice.valor} KZ</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Emissão</span>
          <div className="flex items-center gap-1 text-sm font-medium text-gray-600">
            <Calendar className="w-3 h-3 text-gray-400" />
            <span>{invoice.data}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCard;

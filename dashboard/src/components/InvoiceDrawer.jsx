import React from 'react';
import { X, Building2, Fingerprint, ReceiptText, Calendar, Wallet } from 'lucide-react';

const InvoiceDrawer = ({ isOpen, onClose, invoice }) => {
  if (!isOpen && !invoice) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 z-40 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-xl pt-0 flex flex-col transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/80">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-gray-500" />
            Detalhes da Factura
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        {invoice && (
          <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
            <div className="p-6 flex flex-col gap-8">
              
              {/* Highlight Value Section */}
              <div className="bg-gray-900 rounded-2xl p-6 text-white shadow-inner flex flex-col justify-center items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Wallet size={80} />
                </div>
                <span className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1 z-10">Valor Total</span>
                <span className="text-4xl font-bold z-10">{invoice.valor} <span className="text-xl font-medium text-gray-400">KZ</span></span>
              </div>

              {/* Data Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                  Dados do Emissor
                </h3>
                <div className="grid grid-cols-1 gap-5">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-semibold text-gray-500 mb-1">Nome / Entidade</span>
                      <strong className="text-sm text-gray-900">{invoice.fornecedor}</strong>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Fingerprint className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-xs font-semibold text-gray-500 mb-1">Cód. NIF</span>
                      <span className="text-sm font-medium text-gray-900">{invoice.nif}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Specs */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">
                  Especificações
                </h3>
                <div className="grid grid-cols-2 gap-5 mb-6">
                  <div className="flex flex-col gap-1">
                     <span className="block text-xs font-semibold text-gray-500">Documento Nº</span>
                     <span className="text-sm font-bold text-gray-900 border border-gray-200 bg-gray-50 px-2 py-1 rounded w-fit">{invoice.numero_factura}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                     <span className="block text-xs font-semibold text-gray-500">Data de Emissão</span>
                     <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {invoice.data}
                     </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                     <span className="block text-xs font-semibold text-gray-500">Descrição / Serviços Solicitados</span>
                     <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                       {invoice.descricao}
                     </div>
                </div>
              </div>
              
              <div className="mt-4 flex flex-col gap-2">
                 <span className="block text-xs font-semibold text-gray-500">Ficheiro Analisado</span>
                 <span className="text-xs font-medium px-3 py-2 bg-gray-100 text-gray-600 rounded-lg truncate" title={invoice.arquivo}>
                   {invoice.arquivo}
                 </span>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InvoiceDrawer;

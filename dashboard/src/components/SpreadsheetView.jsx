import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Download, FileDown, Search, Filter, Calendar } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { pt } from 'date-fns/locale/pt';
import "react-datepicker/dist/react-datepicker.css";

registerLocale('pt', pt);

const SpreadsheetView = ({ invoices }) => {
  const [spreadsheetSearch, setSpreadsheetSearch] = useState('');
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // Helper to parse DD/MM/AAAA to Date object for comparison
  const parseDate = (dateStr) => {
    if (!dateStr || dateStr === 'Não identificado') return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  };

  // Filtering logic for the spreadsheet
  const filteredData = useMemo(() => {
    return invoices.filter(inv => {
      // 1. Unified Search (Provider, Invoice No, Description, NIF)
      const term = spreadsheetSearch.toLowerCase().trim();
      const matchesSearch = !term || 
        (inv.fornecedor && inv.fornecedor.toLowerCase().includes(term)) ||
        (inv.numero_factura && inv.numero_factura.toLowerCase().includes(term)) ||
        (inv.descricao && inv.descricao.toLowerCase().includes(term)) ||
        (inv.nif && inv.nif.includes(term));

      // 2. Date Range filter
      const invDate = parseDate(inv.data);
      let matchesRange = true;
      if (startDate || endDate) {
        if (!invDate) {
          matchesRange = false;
        } else {
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (invDate < start) matchesRange = false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (invDate > end) matchesRange = false;
          }
        }
      }

      return matchesSearch && matchesRange;
    });
  }, [invoices, spreadsheetSearch, startDate, endDate]);

  // Excel Export Logic
  const exportToExcel = () => {
    const dataToExport = filteredData.map(inv => ({
      'Data de Emissão': inv.data,
      'Fornecedor': inv.fornecedor,
      'NIF': inv.nif,
      'Nº Factura': inv.numero_factura,
      'Valor (KZ)': inv.valor,
      'Descrição': inv.descricao,
      'Ficheiro': inv.arquivo,
      'Data de Registo': new Date(inv.created_at).toLocaleString('pt-PT')
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Facturas");
    
    // Auto-size columns
    const wscols = [{wch: 15}, {wch: 30}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 40}, {wch: 25}, {wch: 20}];
    worksheet['!cols'] = wscols;

    const datePrefix = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `auditvision_export_${datePrefix}.xlsx`);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col h-[calc(100vh-140px)]">
      {/* Spreadsheet Toolbar */}
      <div className="p-4 border-b border-gray-50 flex flex-col gap-4 bg-gray-50/30 rounded-t-2xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto flex-1">
            {/* Unified Search */}
            <div className="relative flex-1 md:max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Fornecedor, Factura, NIF..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none transition-all shadow-sm"
                value={spreadsheetSearch}
                onChange={(e) => setSpreadsheetSearch(e.target.value)}
              />
            </div>

            {/* Range Date Picker */}
            <div className="relative w-full md:w-64">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
              <DatePicker
                selectsRange={true}
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => setDateRange(update)}
                isClearable={true}
                placeholderText="Filtrar por período..."
                locale="pt"
                dateFormat="dd/MM/yyyy"
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 outline-none transition-all shadow-sm cursor-pointer"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
             <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">
               {filteredData.length} registros
             </span>
             <button 
               onClick={exportToExcel}
               className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-md shadow-gray-200"
             >
               <Download size={16} />
               Exportar Excel
             </button>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white z-10 shadow-sm">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Data</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Fornecedor</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">NIF</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Nº Factura</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Valor (KZ)</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Acções</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredData.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4 text-sm font-medium text-gray-600">{inv.data}</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">{inv.fornecedor}</td>
                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{inv.nif}</td>
                <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                  <span className="bg-gray-100 px-2 py-1 rounded-md">{inv.numero_factura}</span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">{inv.valor}</td>
                <td className="px-6 py-4 text-right">
                   <button className="text-gray-400 hover:text-gray-900 transition-colors p-1">
                      <FileDown size={18} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredData.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-gray-400 text-sm italic font-medium">Nenhum dado corresponde aos filtros selecionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpreadsheetView;

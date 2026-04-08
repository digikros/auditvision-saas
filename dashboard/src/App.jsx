import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import InvoiceGrid from './components/InvoiceGrid';
import InvoiceDrawer from './components/InvoiceDrawer';
import SpreadsheetView from './components/SpreadsheetView';
import Auth from './components/Auth';
import UploadForm from './components/UploadForm';
import { supabase } from './lib/supabaseClient';
import { Search, Menu, X } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth State Listener ...
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch data only if authenticated
  const fetchInvoices = async () => {
    if (!session?.user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Erro ao buscar facturas:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchInvoices();
      const channel = supabase
        .channel('realtime-invoices')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'invoices',
          filter: `user_id=eq.${session.user.id}`
        }, payload => {
          setInvoices(current => [payload.new, ...current]);
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    } else {
      setInvoices([]);
      setIsLoading(false);
    }
  }, [session]);

  const handleLogout = () => supabase.auth.signOut();

  // Filtrar baseando-se na pesquisa (para o Dashboard)
  const filteredInvoices = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return invoices;
    return invoices.filter(inv => 
      (inv.fornecedor && inv.fornecedor.toLowerCase().includes(term)) ||
      (inv.nif && inv.nif.includes(term)) ||
      (inv.numero_factura && inv.numero_factura.toLowerCase().includes(term))
    );
  }, [invoices, searchTerm]);

  useEffect(() => {
    if (selectedInvoice) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [selectedInvoice]);

  if (!session) return <Auth />;

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        setActiveView={(view) => {
          setActiveView(view);
          setIsSidebarOpen(false); // Fechar ao selecionar no mobile
        }} 
        onLogout={handleLogout}
        userEmail={session.user.email}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Barra - Glassmorphism for premium feel */}
        <header className="px-5 md:px-8 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between shrink-0 gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-400 hover:text-gray-900 md:hidden bg-gray-50 rounded-lg transition-colors border border-gray-100 active:scale-95"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight capitalize">
              {activeView === 'upload' ? 'Ler Factura' : activeView}
            </h2>
          </div>
          
          {activeView === 'dashboard' && (
            <div className="relative w-64 md:w-80 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Procurar facturas..."
                className="w-full pl-9 pr-4 py-2 border border-gray-100 bg-gray-50/50 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </header>

        {/* View Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeView === 'upload' && (
            <div className="max-w-4xl mx-auto">
               <UploadForm 
                 userId={session.user.id} 
                 onUploadSuccess={() => {
                   fetchInvoices();
                   setActiveView('dashboard');
                 }} 
               />
            </div>
          )}

          {activeView === 'dashboard' && (
            <InvoiceGrid 
              invoices={filteredInvoices} 
              loading={isLoading} 
              onCardClick={setSelectedInvoice}
              isSearchActive={searchTerm.length > 0}
            />
          )}

          {activeView === 'spreadsheet' && (
            <SpreadsheetView invoices={invoices} />
          )}
        </div>
      </main>

      <InvoiceDrawer 
        isOpen={!!selectedInvoice} 
        invoice={selectedInvoice} 
        onClose={() => setSelectedInvoice(null)} 
      />
    </div>
  );
}

export default App;

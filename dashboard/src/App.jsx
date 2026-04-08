import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import InvoiceGrid from './components/InvoiceGrid';
import InvoiceDrawer from './components/InvoiceDrawer';
import SpreadsheetView from './components/SpreadsheetView';
import Auth from './components/Auth';
import UploadForm from './components/UploadForm';
import { supabase } from './lib/supabaseClient';
import { Search } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

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
        setActiveView={setActiveView} 
        onLogout={handleLogout}
        userEmail={session.user.email}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Barra */}
        <header className="px-8 py-5 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-gray-900 capitalize leading-none">
            {activeView === 'upload' ? 'Ler Factura' : activeView}
          </h2>
          
          {activeView === 'dashboard' && (
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Procurar facturas..."
                className="w-full pl-9 pr-4 py-1.5 border border-gray-100 bg-gray-50 rounded-lg text-sm focus:ring-1 focus:ring-gray-900 outline-none transition-all"
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

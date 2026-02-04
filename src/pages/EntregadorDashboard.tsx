import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EntregadorStatusToggle } from '@/components/entregador/StatusToggle';
import { GanhosSection } from '@/components/entregador/GanhosSection';
import { HistoricoViagens } from '@/components/entregador/HistoricoViagens';
import { RotasAtivas } from '@/components/entregador/RotasAtivas';
import { PedidosDisponiveis } from '@/components/entregador/PedidosDisponiveis';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';

const EntregadorDashboard = () => {
  const [activeTab, setActiveTab] = useState('inicio');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-foreground">Dashboard do Entregador</h1>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="inicio">Início</TabsTrigger>
              <TabsTrigger value="disponiveis" className="relative">
                Disponíveis
              </TabsTrigger>
              <TabsTrigger value="rotas">Rotas Ativas</TabsTrigger>
              <TabsTrigger value="ganhos">Ganhos</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>
            
            <TabsContent value="inicio" className="space-y-6">
              <EntregadorStatusToggle />
            </TabsContent>
            
            <TabsContent value="disponiveis">
              <PedidosDisponiveis />
            </TabsContent>
            
            <TabsContent value="rotas">
              <RotasAtivas />
            </TabsContent>
            
            <TabsContent value="ganhos">
              <GanhosSection />
            </TabsContent>
            
            <TabsContent value="historico">
              <HistoricoViagens />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EntregadorDashboard;

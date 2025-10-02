import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppointmentCard } from "./AppointmentCard";
import { Appointment } from "@/types/appointment";
import { getAppointments } from "@/utils/localStorage";
import { Search, Calendar, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface DashboardProps {
  refreshTrigger: number;
  onAppointmentUpdated?: () => void;
}

// Componente para renderizar a lista de agendamentos
const AppointmentsList = ({ 
  appointments, 
  searchQuery, 
  onReload 
}: { 
  appointments: Appointment[]; 
  searchQuery: string; 
  onReload: () => void; 
}) => {
  // Agrupa os agendamentos por data
  const groupedAppointments = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    
    appointments.forEach(apt => {
      if (!apt.date) return;
      
      try {
        // Ajusta a data para o fuso horário local
        const date = new Date(apt.date);
        // Adiciona o deslocamento de fuso horário para garantir a data correta
        const adjustedDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
        
        const dateKey = adjustedDate.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC' // Força o uso de UTC para evitar problemas de fuso horário
        });
        
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        
        groups[dateKey].push(apt);
      } catch (error) {
        console.error("Erro ao processar data do agendamento:", apt, error);
      }
    });
    
    return groups;
  }, [appointments]);

  // Ordena as datas
  const sortedDates = useMemo(() => {
    return Object.keys(groupedAppointments).sort((a, b) => {
      try {
        return new Date(a).getTime() - new Date(b).getTime();
      } catch (error) {
        return 0;
      }
    });
  }, [groupedAppointments]);

  // Se não houver agendamentos
  if (appointments.length === 0) {
    return (
      <div className="text-center py-20">
        <motion.div
          key="no-appointments"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">
            {searchQuery 
              ? "Nenhum agendamento encontrado" 
              : "Nenhum agendamento cadastrado"}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchQuery 
              ? "Tente buscar por outro termo" 
              : "Os agendamentos aparecerão aqui automaticamente quando criados"}
          </p>
        </motion.div>
        <div className="flex items-center justify-center mt-8">
          <img 
            src="/images/logo.png" 
            alt="Carla Chaves - Estética Automotiva" 
            className="h-16 w-auto object-contain opacity-75"
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {sortedDates.map((date) => {
        const dateAppointments = groupedAppointments[date] || [];
        
        return (
          <motion.div 
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="border-b border-border pb-2">
              <h3 className="text-xl font-semibold text-foreground">
                {date.charAt(0).toUpperCase() + date.slice(1)}
              </h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {dateAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onUpdate={onReload}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const Dashboard = ({ refreshTrigger, onAppointmentUpdated }: DashboardProps) => {
  // Estados
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Carrega os agendamentos
  const loadAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = getAppointments();
      
      // Filtra agendamentos válidos
      const validAppointments = data.filter(apt => {
        if (!apt.date || !apt.time) return false;
        
        try {
          const date = new Date(apt.date);
          if (isNaN(date.getTime())) return false;
          
          // Verifica formato da hora (HH:MM)
          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
          return timeRegex.test(apt.time);
        } catch {
          return false;
        }
      });
      
      // Ordena por data e hora
      validAppointments.sort((a, b) => {
        try {
          const dateA = new Date(a.date + "T" + a.time);
          const dateB = new Date(b.date + "T" + b.time);
          return dateA.getTime() - dateB.getTime();
        } catch {
          return 0;
        }
      });
      
      setAppointments(validAppointments);
      setLastUpdated(new Date());
      
      if (onAppointmentUpdated) {
        onAppointmentUpdated();
      }
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      toast.error("Erro ao carregar os agendamentos");
    } finally {
      setIsLoading(false);
    }
  }, [onAppointmentUpdated]);
  
  // Filtra os agendamentos com base na busca
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments;
    
    const query = searchQuery.toLowerCase().trim();
    return appointments.filter(apt => {
      return (
        apt.clientName?.toLowerCase().includes(query) ||
        apt.phone?.includes(query) ||
        apt.carModel?.toLowerCase().includes(query) ||
        apt.plate?.toLowerCase().includes(query) ||
        apt.status?.toLowerCase().includes(query) ||
        (apt.date && new Date(apt.date).toLocaleDateString('pt-BR').toLowerCase().includes(query))
      );
    });
  }, [appointments, searchQuery]);
  
  // Conta agendamentos pendentes
  const pendingCount = useMemo(() => {
    return appointments.filter(apt => apt.status === "pendente").length;
  }, [appointments]);
  
  // Carrega os agendamentos quando o componente monta ou quando refreshTrigger muda
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments, refreshTrigger]);
  
  // Atualiza a cada minuto para manter os dados atualizados
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com logo */}
      <div className="flex flex-col items-center mb-6">
        <img 
          src="/images/LOGO-2.png.webp" 
          alt="Carla Chaves - Estética Automotiva" 
          className="h-32 w-auto object-contain mb-4"
        />
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gradient">Painel de Controle</h2>
          <p className="text-muted-foreground mt-1">
            Atualizado em {lastUpdated.toLocaleTimeString('pt-BR')}
          </p>
        </div>
      </div>
      
      {/* Barra de busca e ações */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome, telefone, placa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {pendingCount > 0 && (
            <Badge className="bg-warning text-warning-foreground px-4 py-2 text-base">
              {pendingCount} Pendente{pendingCount > 1 ? 's' : ''}
            </Badge>
          )}
          
          <Button 
            variant="outline" 
            onClick={loadAppointments}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>
      
      {/* Lista de agendamentos */}
      <AppointmentsList 
        appointments={filteredAppointments} 
        searchQuery={searchQuery}
        onReload={loadAppointments}
      />
    </div>
  );
};

export default Dashboard;

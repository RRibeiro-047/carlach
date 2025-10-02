import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Appointment, AppointmentStatus, SERVICE_OPTIONS, WAX_PRICES } from "@/types/appointment";
import { updateAppointment, deleteAppointment } from "@/utils/localStorage";
import { sendConfirmationMessage, sendCompletionMessage } from "@/utils/whatsapp";
import { Calendar, Clock, Car, Phone, User, FileText, CreditCard, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

interface AppointmentCardProps {
  appointment: Appointment;
  onUpdate: () => void;
}

export const AppointmentCard = ({ appointment, onUpdate }: AppointmentCardProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const statusColors: Record<AppointmentStatus, string> = {
    pendente: "bg-warning text-warning-foreground",
    confirmado: "bg-secondary text-secondary-foreground",
    finalizado: "bg-success text-success-foreground",
  };

  const statusLabels: Record<AppointmentStatus, string> = {
    pendente: "Pendente",
    confirmado: "Confirmado",
    finalizado: "Finalizado",
  };

  const handleStatusChange = (newStatus: AppointmentStatus) => {
    const oldStatus = appointment.status;
    updateAppointment(appointment.id, { status: newStatus });

    // Enviar mensagem no WhatsApp ao mudar status
    if (newStatus === "confirmado" && oldStatus !== "confirmado") {
      sendConfirmationMessage({
        ...appointment,
        totalPrice: appointment.totalPrice || (SERVICE_OPTIONS[appointment.serviceType]?.price || 0) + (appointment.hasWax ? WAX_PRICES[appointment.carModel.toLowerCase().includes('suv') ? 'suv' : appointment.carModel.toLowerCase().includes('caminhonete') ? 'caminhonete' : 'seda'] || 0 : 0)
      });
    } else if (newStatus === "finalizado" && oldStatus !== "finalizado") {
      sendCompletionMessage({
        ...appointment,
        totalPrice: appointment.totalPrice || (SERVICE_OPTIONS[appointment.serviceType]?.price || 0) + (appointment.hasWax ? WAX_PRICES[appointment.carModel.toLowerCase().includes('suv') ? 'suv' : appointment.carModel.toLowerCase().includes('caminhonete') ? 'caminhonete' : 'seda'] || 0 : 0)
      });
    }

    onUpdate();
  };

  const handleDelete = () => {
    deleteAppointment(appointment.id);
    onUpdate();
  };

  const serviceInfo = SERVICE_OPTIONS[appointment.serviceType];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 shadow-card hover:shadow-glow">
        <div className="space-y-4">
          {/* Header com Status e Ações */}
          <div className="flex items-start justify-between gap-4">
            <Badge className={`${statusColors[appointment.status]} px-3 py-1`}>
              {statusLabels[appointment.status]}
            </Badge>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o agendamento de {appointment.clientName}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Informações do Cliente */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-semibold text-lg">{appointment.clientName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{appointment.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Veículo</p>
                <p className="font-medium">{appointment.carModel}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Placa</p>
                <p className="font-medium">{appointment.plate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Data e Hora</p>
                <p className="font-medium">
                  {new Date(appointment.date + "T12:00:00Z").toLocaleDateString("pt-BR", { timeZone: 'UTC' })} às {appointment.time}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground mb-1">Serviço</p>
              <p className="font-semibold text-primary text-lg">{serviceInfo.label}</p>
              
              <div className="mt-2 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Valor do serviço: <span className="font-medium text-foreground">R$ {serviceInfo.price.toFixed(2)}</span>
                </p>
                
                {appointment.hasWax && (
                  <p className="text-sm text-muted-foreground">
                    Cera: <span className="font-medium text-foreground">+ R$ {WAX_PRICES[appointment.carModel.toLowerCase().includes('suv') ? 'suv' : appointment.carModel.toLowerCase().includes('caminhonete') ? 'caminhonete' : 'seda'].toFixed(2)}</span>
                  </p>
                )}
                
                <p className="text-xl font-bold text-primary mt-2">
                  Total: R$ {appointment.totalPrice?.toFixed(2) || serviceInfo.price.toFixed(2)}
                </p>
              </div>
            </div>

            {appointment.observations && (
              <div className="flex items-start gap-3 pt-3 border-t border-border">
                <FileText className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-sm mt-1">{appointment.observations}</p>
                </div>
              </div>
            )}
          </div>

          {/* Seletor de Status */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Alterar Status</p>
            <Select value={appointment.status} onValueChange={(value) => handleStatusChange(value as AppointmentStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Appointment, SERVICE_OPTIONS, ServiceType, WAX_PRICES } from "@/types/appointment";
import { saveAppointment, isTimeSlotAvailable } from "@/utils/localStorage";
import { Calendar, Clock, Car, Phone, User, FileText, CreditCard } from "lucide-react";

interface AppointmentFormProps {
  onAppointmentCreated: () => void;
}

export const AppointmentForm = ({ onAppointmentCreated }: AppointmentFormProps) => {
  // Horários base para agendamento
  const baseAvailableTimes = [
    '08:00', '09:00', '10:00', '11:00', // Manhã
    '13:00', '14:00', '15:00', '16:00', '17:00'  // Tarde (após almoço)
  ];

  // Estado para controlar os horários disponíveis
  const [availableTimes, setAvailableTimes] = useState<string[]>(baseAvailableTimes);
  const [carSize, setCarSize] = useState<"" | "seda" | "suv" | "caminhonete">("");
  const [formData, setFormData] = useState({
    clientName: "",
    phone: "",
    carModel: "",
    plate: "",
    serviceType: "" as ServiceType,
    date: "",
    time: "",
    observations: "",
    hasWax: false,
    totalPrice: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Verifica se um horário está disponível
  const isTimeAvailable = (time: string) => {
    if (!formData.date) return true; // Se não há data selecionada, mostra todos os horários
    return availableTimes.includes(time);
  };

  // Atualiza os horários disponíveis quando a data muda
  useEffect(() => {
    const updateAvailableTimes = async () => {
      if (!formData.date) {
        setAvailableTimes(baseAvailableTimes);
        return;
      }
      
      const updatedTimes = [];
      for (const time of baseAvailableTimes) {
        const isAvailable = await isTimeSlotAvailable(formData.date, time);
        if (isAvailable) {
          updatedTimes.push(time);
        }
      }
      setAvailableTimes(updatedTimes);
    };

    updateAvailableTimes();
  }, [formData.date, baseAvailableTimes, isTimeSlotAvailable]);

  // Função para verificar se uma data é dia útil (segunda a sábado)
  const isWeekday = (date: Date) => {
    const day = date.getUTCDay(); // Usando UTC para evitar problemas de fuso horário
    return day >= 1 && day <= 6; // 1 (segunda) a 6 (sábado) são dias úteis
  };

  // Função para formatar a data no formato YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Função para obter a data mínima (amanhã ou próxima segunda se hoje for sábado ou domingo)
  const getMinDate = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    
    // Se for domingo, pular para segunda
    if (tomorrow.getUTCDay() === 0) {
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    }
    // Se for sábado, pular para segunda
    else if (tomorrow.getUTCDay() === 6) {
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 2);
    }
    
    return formatDate(tomorrow);
  };

  // Função para obter a data máxima (30 dias a partir de amanhã)
  const getMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(today);
    maxDate.setUTCDate(maxDate.getUTCDate() + 30);
    return formatDate(maxDate);
  };

  const validateForm = (showToast = true): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) newErrors.clientName = "Nome é obrigatório";
    if (!formData.phone.trim()) newErrors.phone = "Telefone é obrigatório";
    if (!/^\d{10,11}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Telefone inválido (DDD + número)";
    }
    if (!formData.carModel.trim()) newErrors.carModel = "Modelo do carro é obrigatório";
    if (!formData.plate.trim()) newErrors.plate = "Placa é obrigatória";
    if (!carSize) newErrors.carSize = "Selecione o tamanho do veículo";
    if (!formData.serviceType) newErrors.serviceType = "Selecione um serviço";
    
    // Validação de data
    if (!formData.date) {
      newErrors.date = "Data é obrigatória";
    } else {
      // Criando a data no formato UTC para evitar problemas de fuso horário
      const [year, month, day] = formData.date.split('-').map(Number);
      const selectedDate = new Date(Date.UTC(year, month - 1, day));
      
      if (!isWeekday(selectedDate)) {
        newErrors.date = "Selecione um dia de semana (segunda a sábado)";
      }
    }
    
    // Validação de horário
    if (!formData.time) {
      newErrors.time = "Horário é obrigatório";
    } else if (!availableTimes.includes(formData.time)) {
      newErrors.time = "Selecione um horário válido";
    } else if (!isTimeSlotAvailable(formData.date, formData.time)) {
      newErrors.time = "Este horário já está reservado. Por favor, selecione outro.";
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0 && showToast) {
      // Rola até o primeiro erro
      const firstError = Object.keys(newErrors)[0];
      const element = document.getElementById(firstError);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus({ preventScroll: true });
      }
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(true)) {
      toast.error("Por favor, preencha todos os campos obrigatórios corretamente");
      return;
    }
    
    // Validação adicional para garantir que o preço total está correto
    let finalTotalPrice = formData.totalPrice;
    if (formData.serviceType && carSize) {
      const servicePrice = SERVICE_OPTIONS[formData.serviceType]?.price || 0;
      const waxPrice = formData.hasWax ? WAX_PRICES[carSize as keyof typeof WAX_PRICES] : 0;
      finalTotalPrice = servicePrice + waxPrice;
    }

    try {
      const appointment: Omit<Appointment, 'id' | 'createdAt' | 'status'> = {
        clientName: formData.clientName,
        phone: formData.phone,
        carModel: formData.carModel,
        plate: formData.plate,
        serviceType: formData.serviceType,
        date: formData.date,
        time: formData.time,
        observations: formData.observations,
        hasWax: formData.hasWax,
        totalPrice: finalTotalPrice
      };

      await saveAppointment(appointment);
      
      toast.success("Agendamento criado com sucesso!", {
        description: `${formData.clientName} - ${formData.date} às ${formData.time}`,
      });

      // Reset form
      setCarSize("");
      setFormData({
        clientName: "",
        phone: "",
        carModel: "",
        plate: "",
        serviceType: "" as ServiceType,
        date: "",
        time: "",
        observations: "",
        hasWax: false,
        totalPrice: 0
      });

      onAppointmentCreated();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast.error("Erro ao criar agendamento. Por favor, tente novamente.");
    }
  };

  // Filtra os serviços com base no tamanho do carro selecionado e calcula o preço total
  const filteredServices = useMemo(() => {
    if (!carSize) return [];
    
    return Object.entries(SERVICE_OPTIONS)
      .filter(([key]) => key.endsWith(`-${carSize}`))
      .map(([key, value]) => ({ 
        key, 
        ...value,
        totalPrice: formData.hasWax ? value.price + WAX_PRICES[carSize as keyof typeof WAX_PRICES] : value.price
      }));
  }, [carSize, formData.hasWax]);

  // Atualiza o preço total quando o serviço, a cera ou o tamanho do veículo mudam
  useEffect(() => {
    if (formData.serviceType && carSize) {
      const servicePrice = SERVICE_OPTIONS[formData.serviceType]?.price || 0;
      const waxPrice = formData.hasWax ? WAX_PRICES[carSize as keyof typeof WAX_PRICES] : 0;
      const newTotalPrice = servicePrice + waxPrice;
      
      setFormData(prev => ({
        ...prev,
        totalPrice: newTotalPrice
      }));
    }
  }, [formData.serviceType, formData.hasWax, carSize]);
  
  // Valida o formulário quando os erros mudam
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      validateForm();
    }
  }, [formData, carSize]);

  const selectedService = formData.serviceType ? {
    ...SERVICE_OPTIONS[formData.serviceType],
    totalPrice: formData.totalPrice || 0
  } : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 md:p-8 bg-card border-border shadow-card">
        <div className="flex justify-center mb-6">
          <img 
            src="/images/LOGO-2.png.webp" 
            alt="Carla Chaves - Estética Automotiva" 
            className="h-32 w-auto object-contain"
          />
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome do Cliente */}
            <div className="space-y-2">
              <Label htmlFor="clientName" className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Nome do Cliente
              </Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="João Silva"
                className={errors.clientName ? "border-destructive" : ""}
              />
              {errors.clientName && <p className="text-sm text-destructive">{errors.clientName}</p>}
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                Telefone (WhatsApp)
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(47) 99999-9999"
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            {/* Modelo do Carro */}
            <div className="space-y-2">
              <Label htmlFor="carModel" className="flex items-center gap-2">
                <Car className="w-4 h-4 text-primary" />
                Modelo do Carro
              </Label>
              <Input
                id="carModel"
                value={formData.carModel}
                onChange={(e) => setFormData({ ...formData, carModel: e.target.value })}
                placeholder="Honda Civic 2020"
                className={errors.carModel ? "border-destructive" : ""}
              />
              {errors.carModel && <p className="text-sm text-destructive">{errors.carModel}</p>}
            </div>

            {/* Placa */}
            <div className="space-y-2">
              <Label htmlFor="plate" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Placa
              </Label>
              <Input
                id="plate"
                value={formData.plate}
                onChange={(e) => {
                  // Formata a placa automaticamente (AAA-0000 ou AAA-0A00)
                  let value = e.target.value.toUpperCase();
                  // Remove caracteres inválidos
                  value = value.replace(/[^A-Z0-9-]/g, '');
                  // Adiciona o hífen automaticamente
                  if (value.length > 3 && !value.includes('-')) {
                    value = value.slice(0, 3) + '-' + value.slice(3, 7);
                  }
                  setFormData({ ...formData, plate: value });
                }}
                placeholder="ABC-1234"
                maxLength={8}
                className={errors.plate ? "border-destructive" : ""}
              />
              {errors.plate && <p className="text-sm text-destructive">{errors.plate}</p>}
            </div>

            {/* Tamanho do Veículo */}
            <div className="space-y-2">
              <Label htmlFor="carSize">Tamanho do Veículo</Label>
              <Select
                value={carSize}
                onValueChange={(value) => {
                  setCarSize(value as "seda" | "suv" | "caminhonete");
                  // Limpa o tipo de serviço quando o tamanho do veículo é alterado
                  setFormData({ ...formData, serviceType: "" as ServiceType });
                }}
              >
                <SelectTrigger className={errors.carSize ? "border-destructive" : ""}>
                  <SelectValue placeholder="Selecione o tamanho" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="seda">Sedã</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="caminhonete">Caminhonete</SelectItem>
                </SelectContent>
              </Select>
              {errors.carSize && <p className="text-sm text-destructive">{errors.carSize}</p>}
            </div>

            {/* Tipo de Serviço */}
            <div className="space-y-2">
              <Label htmlFor="serviceType">Tipo de Serviço</Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) => setFormData({ ...formData, serviceType: value as ServiceType })}
                disabled={!carSize}
              >
                <SelectTrigger className={errors.serviceType ? "border-destructive" : ""}>
                  <SelectValue placeholder={carSize ? "Selecione o serviço" : "Selecione o tamanho primeiro"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {filteredServices.map(({ key, label, price }) => (
                    <SelectItem key={key} value={key}>
                      {label.replace(`- ${carSize.charAt(0).toUpperCase() + carSize.slice(1)}`, "")} - R$ {price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.serviceType && <p className="text-sm text-destructive">{errors.serviceType}</p>}
              <div className="space-y-2">
                {selectedService && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-1"
                  >
                    <p className="text-sm text-muted-foreground">
                      Serviço: <span className="font-semibold text-foreground">R$ {selectedService.price.toFixed(2)}</span>
                    </p>
                    {formData.hasWax && carSize && (
                      <p className="text-sm text-muted-foreground">
                        Cera: <span className="font-semibold text-foreground">+ R$ {WAX_PRICES[carSize as keyof typeof WAX_PRICES].toFixed(2)}</span>
                      </p>
                    )}
                    <p className="text-sm text-primary font-semibold">
                      Total: R$ {selectedService.totalPrice?.toFixed(2) || selectedService.price.toFixed(2)}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Aplicação de Cera */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.hasWax}
                  onChange={(e) => {
                    const hasWax = e.target.checked;
                    setFormData(prev => ({
                      ...prev,
                      hasWax,
                      totalPrice: selectedService 
                        ? selectedService.price + (hasWax ? WAX_PRICES[carSize as keyof typeof WAX_PRICES] || 0 : 0)
                        : 0
                    }));
                  }}
                  className="h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                />
                <span>Aplicação de Cera</span>
                {carSize && (
                  <span className="text-sm text-muted-foreground">
                    (R$ {WAX_PRICES[carSize as keyof typeof WAX_PRICES]})
                  </span>
                )}
              </Label>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Data (segunda a sábado)
              </Label>
              <Input
                id="date"
                type="date"
                min={getMinDate()}
                max={getMaxDate()}
                // Desabilita fins de semana
                onFocus={(e) => e.target.showPicker()}
                onClick={(e) => e.preventDefault()}
                onChange={(e) => {
                  const selectedDate = new Date(e.target.value);
                  // Se for domingo, pular para segunda
                  if (selectedDate.getDay() === 0) {
                    selectedDate.setDate(selectedDate.getDate() + 1);
                    e.target.value = formatDate(selectedDate);
                  }
                  setFormData({ ...formData, date: e.target.value, time: '' });
                }}
                value={formData.date}
                className={errors.date ? "border-destructive" : ""}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
            </div>

            {/* Hora */}
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Horário (08:00 - 12:00 | 13:00 - 17:00)
              </Label>
              <Select
                value={formData.time}
                onValueChange={(value) => setFormData({ ...formData, time: value })}
                disabled={!formData.date}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um horário" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimes.map((time) => {
                    const available = isTimeAvailable(time);
                    const isLastTime = time === '17:00';
                    return (
                      <SelectItem 
                        key={time} 
                        value={time}
                        disabled={!available}
                        className={!available ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span>{time} {isLastTime ? '(último horário do dia)' : ''}</span>
                          {!available && <span className="text-xs text-muted-foreground ml-2">Indisponível</span>}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.time && <p className="text-sm text-destructive">{errors.time}</p>}
            </div>

            {/* Observações */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="observations" className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Observações
              </Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Informações adicionais sobre o serviço..."
                rows={3}
              />
            </div>
          </div>

          <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold text-lg h-12 shadow-glow">
            Criar Agendamento
          </Button>
        </form>
      </Card>
    </motion.div>
  );
};

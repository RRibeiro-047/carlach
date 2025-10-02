import { Appointment, SERVICE_OPTIONS, WAX_PRICES } from "@/types/appointment";

export const sendWhatsAppMessage = (phone: string, message: string): void => {
  // Remove caracteres não numéricos do telefone
  const cleanPhone = phone.replace(/\D/g, "");
  
  // Adiciona código do país (Brasil) se não tiver
  const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  
  // Codifica a mensagem
  const encodedMessage = encodeURIComponent(message);
  
  // Abre o WhatsApp em nova aba
  window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, "_blank");
};

export const sendConfirmationMessage = (appointment: Appointment): void => {
  const serviceInfo = SERVICE_OPTIONS[appointment.serviceType];
  const carSize = appointment.carModel.toLowerCase().includes('suv') ? 'suv' : 
                 appointment.carModel.toLowerCase().includes('caminhonete') ? 'caminhonete' : 'seda';
  const waxPrice = appointment.hasWax ? WAX_PRICES[carSize as keyof typeof WAX_PRICES] : 0;
  const totalPrice = appointment.totalPrice || (serviceInfo.price + waxPrice);
  
  let message = `Olá ${appointment.clientName}! Seu agendamento está *Confirmado* para *${appointment.date}* às *${appointment.time}*.\n\n`;
  message += `*Serviço:* ${serviceInfo.label.replace(`- ${carSize.charAt(0).toUpperCase() + carSize.slice(1)}`, '')}\n`;
  message += `*Veículo:* ${appointment.carModel}\n`;
  message += `*Placa:* ${appointment.plate}\n\n`;
  
  // Detalhes do orçamento
  message += `*Resumo do Orçamento*\n`;
  message += `- Serviço: R$ ${serviceInfo.price.toFixed(2)}\n`;
  if (appointment.hasWax) {
    message += `- Cera (${carSize.charAt(0).toUpperCase() + carSize.slice(1)}): R$ ${waxPrice.toFixed(2)}\n`;
  }
  message += `*Total: R$ ${totalPrice.toFixed(2)}*\n\n`;
  
  message += `Nos vemos em breve!\n*Carlach Detailing* 🚗✨`;
  
  sendWhatsAppMessage(appointment.phone, message);
};

export const sendCompletionMessage = (appointment: Appointment): void => {
  const serviceInfo = SERVICE_OPTIONS[appointment.serviceType];
  const carSize = appointment.carModel.toLowerCase().includes('suv') ? 'suv' : 
                 appointment.carModel.toLowerCase().includes('caminhonete') ? 'caminhonete' : 'seda';
  const waxPrice = appointment.hasWax ? WAX_PRICES[carSize as keyof typeof WAX_PRICES] : 0;
  const totalPrice = appointment.totalPrice || (serviceInfo.price + waxPrice);
  
  let message = `Olá ${appointment.clientName}! Seu veículo *${appointment.carModel}* está pronto para retirada! ✅\n\n`;
  
  // Detalhes do serviço realizado
  message += `*Serviço Realizado*\n`;
  message += `- ${serviceInfo.label.replace(`- ${carSize.charAt(0).toUpperCase() + carSize.slice(1)}`, '')}`;
  if (appointment.hasWax) {
    message += `\n- Aplicação de cera`;
  }
  
  // Resumo do pagamento
  message += `\n\n*Resumo do Pagamento*\n`;
  message += `- Serviço: R$ ${serviceInfo.price.toFixed(2)}\n`;
  if (appointment.hasWax) {
    message += `- Cera: R$ ${waxPrice.toFixed(2)}\n`;
  }
  message += `*Total Pago: R$ ${totalPrice.toFixed(2)}*\n\n`;
  
  message += `Obrigado por confiar na *Carlach Detailing*! Esperamos ver você novamente em breve. 🚗💫`;
  
  sendWhatsAppMessage(appointment.phone, message);
};

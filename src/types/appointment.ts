export type ServiceType = 
  | "lavacao-basica-seda"
  | "lavacao-basica-suv"
  | "lavacao-basica-caminhonete"
  | "lavacao-premium-seda"
  | "lavacao-premium-suv"
  | "lavacao-premium-caminhonete"
  | "lavacao-detalhada-seda"
  | "lavacao-detalhada-suv"
  | "lavacao-detalhada-caminhonete";

export const SERVICE_OPTIONS: Record<ServiceType, { label: string; price: number }> = {
  "lavacao-basica-seda": { label: "Lavação Básica - Sedã", price: 60 },
  "lavacao-basica-suv": { label: "Lavação Básica - SUV", price: 70 },
  "lavacao-basica-caminhonete": { label: "Lavação Básica - Caminhonete", price: 80 },
  "lavacao-premium-seda": { label: "Lavação Premium - Sedã", price: 90 },
  "lavacao-premium-suv": { label: "Lavação Premium - SUV", price: 110 },
  "lavacao-premium-caminhonete": { label: "Lavação Premium - Caminhonete", price: 140 },
  "lavacao-detalhada-seda": { label: "Lavação Detalhada - Sedã", price: 250 },
  "lavacao-detalhada-suv": { label: "Lavação Detalhada - SUV", price: 300 },
  "lavacao-detalhada-caminhonete": { label: "Lavação Detalhada - Caminhonete", price: 350 },
};

// Preços da cera por tipo de veículo
export const WAX_PRICES = {
  'seda': 40,
  'suv': 50,
  'caminhonete': 60
};

export type AppointmentStatus = "pendente" | "confirmado" | "finalizado";

export interface Appointment {
  id: string;
  clientName: string;
  phone: string;
  carModel: string;
  plate: string;
  serviceType: ServiceType;
  date: string;
  time: string;
  observations: string;
  status: AppointmentStatus;
  createdAt: string;
  hasWax?: boolean;
  totalPrice?: number;
}

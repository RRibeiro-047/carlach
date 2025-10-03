// src/utils/localStorage.ts
import { Appointment, AppointmentStatus, ServiceType } from "@/types/appointment";

type StoredAppointment = Omit<Appointment, 'serviceType'> & {
  serviceType: string;
  status: AppointmentStatus;
};

const API_URL = import.meta.env.MODE === 'production' 
  ? 'https://your-vercel-app-url.vercel.app/api/appointments' 
  : 'http://localhost:3001/api/appointments';

// Função auxiliar para fazer requisições à API
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.statusText}`);
  }

  return response.json();
}

export const saveAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'status'>): Promise<Appointment> => {
  try {
    const appointment: Omit<Appointment, 'id' | 'createdAt'> = {
      ...appointmentData,
      status: 'pendente',
      totalPrice: appointmentData.totalPrice || 0,
      hasWax: appointmentData.hasWax || false,
      observations: appointmentData.observations || ''
    };

    // Se estiver em desenvolvimento, salva no localStorage
    if (import.meta.env.DEV) {
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const newAppointment = {
        ...appointment,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      appointments.push(newAppointment);
      localStorage.setItem('appointments', JSON.stringify(appointments));
      return newAppointment;
    }

    // Em produção, faz a chamada para a API
    return await fetchApi<Appointment>('', {
      method: 'POST',
      body: JSON.stringify(appointment)
    });
  } catch (error) {
    console.error('Erro ao salvar agendamento:', error);
    throw error;
  }
};

export const getAppointments = async (): Promise<Appointment[]> => {
  // Se estiver em desenvolvimento, busca do localStorage
  if (import.meta.env.DEV) {
    return JSON.parse(localStorage.getItem('appointments') || '[]');
  }
  try {
    const data = await fetchApi<{ appointments: Appointment[] }>('');
    return data.appointments || [];
  } catch (error) {
    console.error('Erro ao carregar agendamentos:', error);
    return [];
  }
};

// Atualiza o status de um agendamento
export const updateAppointmentStatus = async (id: string, status: AppointmentStatus): Promise<Appointment | null> => {
  try {
    // Em desenvolvimento, atualiza no localStorage
    if (import.meta.env.DEV) {
      const appointments = await getAppointments();
      const appointmentIndex = appointments.findIndex(a => a.id === id);
      
      if (appointmentIndex === -1) return null;
      
      const updatedAppointment = { 
        ...appointments[appointmentIndex], 
        status 
      };
      
      appointments[appointmentIndex] = updatedAppointment;
      localStorage.setItem('appointments', JSON.stringify(appointments));
      return updatedAppointment;
    }
    
    // Em produção, faz a chamada para a API
    return await fetchApi<Appointment>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  } catch (error) {
    console.error('Erro ao atualizar status do agendamento:', error);
    return null;
  }
};

// Atualiza um agendamento existente
export const updateAppointment = async (id: string, updates: Partial<Appointment>): Promise<Appointment | null> => {
  try {
    // Em desenvolvimento, atualiza no localStorage
    if (import.meta.env.DEV) {
      const appointments = await getAppointments();
      const appointmentIndex = appointments.findIndex(a => a.id === id);
      
      if (appointmentIndex === -1) return null;
      
      const updatedAppointment = { 
        ...appointments[appointmentIndex], 
        ...updates,
        // Garante que o ID não seja alterado
        id: appointments[appointmentIndex].id,
        // Mantém a data de criação original
        createdAt: appointments[appointmentIndex].createdAt
      };
      
      appointments[appointmentIndex] = updatedAppointment;
      localStorage.setItem('appointments', JSON.stringify(appointments));
      return updatedAppointment;
    }
    
    // Em produção, faz a chamada para a API
    return await fetchApi<Appointment>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    throw error;
  }
};

// Remove um agendamento
export const deleteAppointment = async (id: string): Promise<boolean> => {
  try {
    // Em desenvolvimento, remove do localStorage
    if (import.meta.env.DEV) {
      const appointments = await getAppointments();
      const updatedAppointments = appointments.filter(apt => apt.id !== id);
      
      if (appointments.length === updatedAppointments.length) {
        return false; // Nenhum item foi removido
      }
      
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
      return true;
    }
    
    // Em produção, faz a chamada para a API
    await fetchApi(`/${id}`, {
      method: 'DELETE'
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao remover agendamento:', error);
    throw error;
  }
};

// Verifica se um horário está disponível
export const isTimeSlotAvailable = async (date: string, time: string, excludeId?: string): Promise<boolean> => {
  // Em desenvolvimento, verifica no localStorage
  if (import.meta.env.DEV) {
    const appointments = await getAppointments();
    return !appointments.some(apt => {
      if (excludeId && apt.id === excludeId) return false;
      return apt.date === date && apt.time === time;
    });
  }
  try {
    const appointments = await getAppointments();
    return !appointments.some(apt => {
      // Pula o agendamento que está sendo verificado (para atualizações)
      if (excludeId && apt.id === excludeId) return false;
      // Verifica se a data e hora coincidem
      return apt.date === date && apt.time === time;
    });
  } catch (error) {
    console.error('Erro ao verificar disponibilidade do horário:', error);
    return false;
  }
};

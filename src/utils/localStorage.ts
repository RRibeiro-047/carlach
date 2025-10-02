import { Appointment } from "@/types/appointment";

const STORAGE_KEY = "carlach_appointments";

export const getAppointments = (): Appointment[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading appointments:", error);
    return [];
  }
};

export const saveAppointment = (appointment: Appointment): void => {
  try {
    const appointments = getAppointments();
    appointments.push(appointment);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  } catch (error) {
    console.error("Error saving appointment:", error);
  }
};

export const updateAppointment = (id: string, updates: Partial<Appointment>): void => {
  try {
    const appointments = getAppointments();
    const index = appointments.findIndex((apt) => apt.id === id);
    if (index !== -1) {
      appointments[index] = { ...appointments[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
    }
  } catch (error) {
    console.error("Error updating appointment:", error);
  }
};

export const deleteAppointment = (id: string): void => {
  try {
    const appointments = getAppointments();
    const filtered = appointments.filter((apt) => apt.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting appointment:", error);
  }
};

export const isTimeSlotAvailable = (date: string, time: string, excludeId?: string): boolean => {
  try {
    const appointments = getAppointments();
    return !appointments.some(apt => {
      // Skip the appointment we're checking against (for updates)
      if (excludeId && apt.id === excludeId) return false;
      // Check if date and time match
      return apt.date === date && apt.time === time;
    });
  } catch (error) {
    console.error("Error checking time slot availability:", error);
    return false;
  }
};

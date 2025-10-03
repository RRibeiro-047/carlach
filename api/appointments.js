// api/appointments.js
const { v4: uuidv4 } = require('uuid');

// Simulando um banco de dados em memória
let appointments = [];

export default function handler(req, res) {
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Lidar com requisições OPTIONS (pré-voo)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Obter todos os agendamentos
  if (req.method === 'GET') {
    return res.status(200).json({ appointments });
  }

  // Criar um novo agendamento
  if (req.method === 'POST') {
    try {
      const newAppointment = {
        id: uuidv4(),
        ...req.body,
        createdAt: new Date().toISOString()
      };
      
      appointments.push(newAppointment);
      return res.status(201).json(newAppointment);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar agendamento' });
    }
  }

  // Método não suportado
  return res.status(405).json({ error: 'Método não permitido' });
}

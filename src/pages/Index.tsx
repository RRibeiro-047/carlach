import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AppointmentForm } from "@/components/AppointmentForm";
import { Calendar, Shield } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  const handleAppointmentCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
    toast.success("Agendamento enviado!", {
      description: "Entraremos em contato em breve para confirmar.",
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 justify-center md:justify-start"
          >
            <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gradient">CARLACH DETAILING</h1>
              <p className="text-sm text-muted-foreground">Agende seu serviço</p>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-3">
                Faça seu Agendamento
              </h2>
              <p className="text-muted-foreground text-lg">
                Preencha o formulário abaixo e entraremos em contato para confirmar
              </p>
            </div>
            <AppointmentForm onAppointmentCreated={handleAppointmentCreated} />
          </div>
        </motion.div>
      </main>

      {/* Admin Access Button */}
      <footer className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/login")}
            className="text-muted-foreground hover:text-primary opacity-30 hover:opacity-100 transition-opacity"
          >
            <Shield className="w-3 h-3 mr-2" />
            Acesso Administrativo
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default Index;

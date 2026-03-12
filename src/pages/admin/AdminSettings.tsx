import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminSettings = () => {
  const [maxFileSize, setMaxFileSize] = useState("500");
  const [defaultCredits, setDefaultCredits] = useState("100");
  const [maxDuration, setMaxDuration] = useState("120");

  const handleSave = () => {
    toast.success("Configurações salvas (em breve persistidas no banco)");
  };

  const settings = [
    { label: "Tamanho máximo de upload (MB)", value: maxFileSize, setter: setMaxFileSize },
    { label: "Créditos padrão para novos usuários", value: defaultCredits, setter: setDefaultCredits },
    { label: "Duração máxima de vídeo (min)", value: maxDuration, setter: setMaxDuration },
  ];

  return (
    <DashboardLayout>
      <AdminLayout>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="venus-card p-6 max-w-xl">
          <div className="flex items-center gap-2 mb-5">
            <Settings size={16} />
            <h2 className="font-bold text-sm uppercase tracking-wider">Configurações da Plataforma</h2>
          </div>

          <div className="space-y-4">
            {settings.map((s) => (
              <div key={s.label}>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</label>
                <Input value={s.value} onChange={(e) => s.setter(e.target.value)} className="mt-1 h-8 text-sm" type="number" />
              </div>
            ))}
          </div>

          <Button size="sm" className="mt-5" onClick={handleSave}>
            <Save size={12} className="mr-1.5" /> Salvar configurações
          </Button>
        </motion.div>
      </AdminLayout>
    </DashboardLayout>
  );
};

export default AdminSettings;

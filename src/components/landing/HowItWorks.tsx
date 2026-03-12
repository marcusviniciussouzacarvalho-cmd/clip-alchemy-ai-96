import { motion } from "framer-motion";
import { Upload, Cpu, Scissors, Download } from "lucide-react";

const steps = [
  { icon: Upload, title: "Upload", desc: "Envie seu vídeo longo para a plataforma" },
  { icon: Cpu, title: "AI Processa", desc: "Nossa IA analisa, transcreve e detecta os melhores momentos" },
  { icon: Scissors, title: "Clips Gerados", desc: "Receba múltiplos clips otimizados com legendas" },
  { icon: Download, title: "Exporte", desc: "Baixe seus clips prontos para publicar" },
];

const HowItWorks = () => (
  <section id="como-funciona" className="py-24 bg-surface">
    <div className="container max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-4">Como funciona</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          De vídeo longo a clips virais em 4 passos simples
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-4">
              <s.icon size={24} className="text-foreground" />
            </div>
            <div className="text-xs text-muted-foreground font-display font-semibold mb-2 tracking-widest">PASSO {i + 1}</div>
            <h3 className="font-bold text-lg mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;

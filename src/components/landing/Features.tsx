import { motion } from "framer-motion";
import { Wand2, Subtitles, BarChart3, PenTool, Zap, Globe } from "lucide-react";

const features = [
  { icon: Wand2, title: "AI Clipping", desc: "Detecta automaticamente os melhores momentos do vídeo" },
  { icon: Subtitles, title: "Legendas Automáticas", desc: "Gera legendas personalizáveis com múltiplos estilos" },
  { icon: BarChart3, title: "Score de Viralidade", desc: "Análise de cada clip com potencial de engajamento" },
  { icon: PenTool, title: "Editor de Clips", desc: "Ajuste duração, legendas e templates visualmente" },
  { icon: Zap, title: "Processamento Rápido", desc: "Pipeline otimizada para resultados em minutos" },
  { icon: Globe, title: "Multi-idioma", desc: "Transcrição e legendas em diversos idiomas" },
];

const Features = () => (
  <section id="recursos" className="py-24">
    <div className="container max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Recursos poderosos</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Tudo que você precisa para criar clips de alta performance
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="p-6 rounded-xl venus-border bg-background hover:bg-surface transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center mb-4 group-hover:bg-foreground group-hover:text-background transition-colors">
              <f.icon size={20} />
            </div>
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;

import { motion } from "framer-motion";
import { Clock, TrendingUp, DollarSign, Sparkles } from "lucide-react";

const benefits = [
  { icon: Clock, title: "Economize horas", desc: "Reduza de horas para minutos o processo de criação de clips" },
  { icon: TrendingUp, title: "Aumente engajamento", desc: "Clips otimizados por IA para máximo alcance nas redes" },
  { icon: DollarSign, title: "Reduza custos", desc: "Sem necessidade de editores profissionais ou ferramentas caras" },
  { icon: Sparkles, title: "Qualidade profissional", desc: "Legendas, cortes e timing perfeitos em cada clip" },
];

const Benefits = () => (
  <section className="py-24 bg-surface">
    <div className="container max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que VenusClip?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Benefícios reais para criadores de conteúdo
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {benefits.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-4 p-6 rounded-xl bg-background venus-border"
          >
            <div className="w-12 h-12 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0">
              <b.icon size={22} className="text-foreground" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Benefits;

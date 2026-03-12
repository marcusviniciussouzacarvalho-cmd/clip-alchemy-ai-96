import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    desc: "Para experimentar",
    features: ["30 min processados", "5 clips/mês", "Legendas básicas", "720p export"],
    cta: "Começar grátis",
    highlighted: false,
  },
  {
    name: "Creator",
    price: "R$ 49",
    period: "/mês",
    desc: "Para criadores individuais",
    features: ["120 min processados", "30 clips/mês", "Todos os estilos de legenda", "1080p export", "Editor de clips"],
    cta: "Assinar Creator",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "R$ 99",
    period: "/mês",
    desc: "Para profissionais",
    features: ["500 min processados", "Clips ilimitados", "Score de viralidade", "4K export", "Suporte prioritário"],
    cta: "Assinar Pro",
    highlighted: false,
  },
  {
    name: "Business",
    price: "R$ 249",
    period: "/mês",
    desc: "Para equipes e agências",
    features: ["2000 min processados", "Clips ilimitados", "API access", "Admin panel", "Multi-usuários", "SLA"],
    cta: "Falar com vendas",
    highlighted: false,
  },
];

const Pricing = () => (
  <section id="planos" className="py-24 bg-surface">
    <div className="container max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-4">Planos e preços</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Escolha o plano ideal para seu fluxo de trabalho
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className={`p-6 rounded-xl flex flex-col ${
              p.highlighted
                ? "bg-foreground text-background border-2 border-foreground venus-glow"
                : "venus-card"
            }`}
          >
            <div className="text-xs font-display font-bold uppercase tracking-widest mb-3 opacity-60">
              {p.name}
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-extrabold font-display">{p.price}</span>
              <span className="text-sm opacity-60">{p.period}</span>
            </div>
            <p className="text-sm opacity-60 mb-6">{p.desc}</p>

            <ul className="space-y-3 mb-8 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check size={14} className="shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              variant={p.highlighted ? "secondary" : "default"}
              className={p.highlighted ? "bg-background text-foreground hover:bg-background/90" : ""}
              asChild
            >
              <Link to="/signup">{p.cta}</Link>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Pricing;

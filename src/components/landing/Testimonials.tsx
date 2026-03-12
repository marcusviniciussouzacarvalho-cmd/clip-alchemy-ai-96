import { motion } from "framer-motion";

const testimonials = [
  { name: "Lucas M.", role: "YouTuber", text: "Economizo 5 horas por semana usando o VenusClip. Os clips ficam perfeitos." },
  { name: "Ana R.", role: "Social Media Manager", text: "A análise de viralidade é surreal. Meus clientes amaram os resultados." },
  { name: "Pedro S.", role: "Podcaster", text: "Transformo episódios de 2h em 10 clips em minutos. Inacreditável." },
];

const Testimonials = () => (
  <section className="py-24">
    <div className="container max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-4">O que dizem nossos usuários</h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-xl venus-card"
          >
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">"{t.text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent border border-border flex items-center justify-center text-xs font-bold">
                {t.name[0]}
              </div>
              <div>
                <div className="text-sm font-bold">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Testimonials;

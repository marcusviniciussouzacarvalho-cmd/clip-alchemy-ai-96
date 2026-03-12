import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Quais formatos de vídeo são suportados?", a: "MP4, MOV, AVI, MKV e WebM. Recomendamos MP4 para melhor compatibilidade." },
  { q: "Quanto tempo leva o processamento?", a: "Depende da duração do vídeo. Em média, um vídeo de 30 minutos é processado em 3-5 minutos." },
  { q: "Posso editar os clips depois de gerados?", a: "Sim! Nosso editor permite ajustar duração, legendas, templates e mais." },
  { q: "O VenusClip publica nas redes sociais?", a: "Não. O VenusClip gera os clips e permite download. A publicação fica por sua conta." },
  { q: "Posso cancelar minha assinatura?", a: "Sim, a qualquer momento. Sem taxas de cancelamento." },
  { q: "Há limite de tamanho de arquivo?", a: "O plano Free suporta até 500MB. Planos pagos suportam até 5GB por vídeo." },
];

const FAQ = () => (
  <section id="faq" className="py-24">
    <div className="container max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Perguntas frequentes</h2>
      </motion.div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="venus-border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-medium hover:no-underline">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default FAQ;

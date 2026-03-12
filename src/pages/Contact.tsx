import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Contact = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-32 pb-24">
      <div className="container max-w-lg">
        <h1 className="text-3xl font-bold mb-2 text-center">Contato</h1>
        <p className="text-muted-foreground text-center mb-8">Fale com a equipe VenusClip</p>
        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input placeholder="Seu nome" className="mt-1" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" placeholder="seu@email.com" className="mt-1" />
          </div>
          <div>
            <Label>Mensagem</Label>
            <Textarea placeholder="Como podemos ajudar?" className="mt-1" rows={5} />
          </div>
          <Button className="w-full">Enviar mensagem</Button>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default Contact;

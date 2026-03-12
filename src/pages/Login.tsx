import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft size={16} /> Voltar
          </Link>

          <h1 className="text-2xl font-bold mb-2">Entrar</h1>
          <p className="text-sm text-muted-foreground mb-8">Acesse sua conta VenusClip</p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
            </div>
            <Button className="w-full" variant="default">Entrar</Button>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/signup" className="text-foreground font-medium hover:underline">Criar conta</Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-foreground items-center justify-center">
        <div className="text-background text-center px-12">
          <div className="font-display text-3xl font-bold mb-4">VENUSCLIP</div>
          <p className="text-background/60">Transforme vídeos longos em clips virais com IA</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

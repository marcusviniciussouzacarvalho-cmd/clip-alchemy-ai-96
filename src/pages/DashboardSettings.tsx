import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useProfile, useUpdateProfile, useUploadAvatar, useChangePassword,
  useNotificationPreferences, useUpdateNotificationPreferences,
} from "@/hooks/use-realtime";
import { User, Bell, Shield, Palette, Camera, Loader2, Save, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const DashboardSettings = () => {
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const { data: prefs, isLoading: prefsLoading } = useNotificationPreferences();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const changePassword = useChangePassword();
  const updatePrefs = useUpdateNotificationPreferences();

  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notifPrefs, setNotifPrefs] = useState({
    processing_updates: true,
    processing_errors: true,
    clip_ready: true,
    billing_updates: true,
    system_updates: true,
    product_news: true,
  });

  useEffect(() => {
    if (profileData?.profile?.display_name) setDisplayName(profileData.profile.display_name);
  }, [profileData]);

  useEffect(() => {
    if (prefs) {
      setNotifPrefs({
        processing_updates: prefs.processing_updates ?? true,
        processing_errors: prefs.processing_errors ?? true,
        clip_ready: prefs.clip_ready ?? true,
        billing_updates: prefs.billing_updates ?? true,
        system_updates: prefs.system_updates ?? true,
        product_news: prefs.product_news ?? true,
      });
    }
  }, [prefs]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 5MB)");
      return;
    }
    uploadAvatar.mutate(file);
  };

  const handleSaveProfile = () => {
    updateProfile.mutate({ displayName });
  };

  const handleRemoveAvatar = () => {
    updateProfile.mutate({ avatarUrl: "" });
  };

  const handleChangePassword = () => {
    if (newPassword.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Senhas não conferem");
      return;
    }
    changePassword.mutate(newPassword, {
      onSuccess: () => { setNewPassword(""); setConfirmPassword(""); },
      onError: (err: any) => toast.error(err.message),
    });
  };

  const handleSavePrefs = () => {
    updatePrefs.mutate(notifPrefs);
  };

  const togglePref = (key: string) => {
    setNotifPrefs((p) => ({ ...p, [key]: !p[key as keyof typeof p] }));
  };

  const notifOptions = [
    { key: "processing_updates", label: "Atualizações de processamento", desc: "Quando um vídeo muda de status" },
    { key: "processing_errors", label: "Erros de processamento", desc: "Quando ocorre um erro no pipeline" },
    { key: "clip_ready", label: "Clips prontos", desc: "Quando novos clips são gerados" },
    { key: "billing_updates", label: "Cobrança", desc: "Alertas sobre créditos e pagamentos" },
    { key: "system_updates", label: "Atualizações do sistema", desc: "Manutenções e mudanças na plataforma" },
    { key: "product_news", label: "Novidades", desc: "Novos recursos e funcionalidades" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua conta e preferências</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Section 1: Profile */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="venus-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User size={16} />
            <h2 className="text-sm font-bold uppercase tracking-wider">Perfil</h2>
          </div>

          {profileLoading ? (
            <div className="space-y-3">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center overflow-hidden border-2 border-border">
                    {profileData?.profile?.avatar_url ? (
                      <img src={profileData.profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-muted-foreground" />
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-foreground/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {uploadAvatar.isPending ? (
                      <Loader2 size={16} className="text-background animate-spin" />
                    ) : (
                      <Camera size={16} className="text-background" />
                    )}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">{profileData?.profile?.display_name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground">{profileData?.email}</p>
                  {profileData?.profile?.avatar_url && (
                    <button onClick={handleRemoveAvatar} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <Trash2 size={10} /> Remover foto
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 h-8 text-sm" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email</label>
                <Input value={profileData?.email || ""} disabled className="mt-1 h-8 text-sm opacity-60" />
              </div>

              <Button size="sm" onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                {updateProfile.isPending ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <Save size={12} className="mr-1.5" />}
                Salvar perfil
              </Button>
            </>
          )}
        </motion.div>

        {/* Section 2: Notification Preferences */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="venus-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Bell size={16} />
            <h2 className="text-sm font-bold uppercase tracking-wider">Notificações</h2>
          </div>

          {prefsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <>
              <div className="space-y-1">
                {notifOptions.map((opt) => (
                  <div key={opt.key} className="flex items-center justify-between py-2.5 px-1">
                    <div>
                      <p className="text-sm font-medium">{opt.label}</p>
                      <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                    </div>
                    <Switch
                      checked={notifPrefs[opt.key as keyof typeof notifPrefs]}
                      onCheckedChange={() => togglePref(opt.key)}
                    />
                  </div>
                ))}
              </div>
              <Button size="sm" onClick={handleSavePrefs} disabled={updatePrefs.isPending}>
                {updatePrefs.isPending ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <Save size={12} className="mr-1.5" />}
                Salvar preferências
              </Button>
            </>
          )}
        </motion.div>

        {/* Section 3: Security */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="venus-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} />
            <h2 className="text-sm font-bold uppercase tracking-wider">Segurança</h2>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nova senha</label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="mt-1 h-8 text-sm" />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Confirmar senha</label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" className="mt-1 h-8 text-sm" />
          </div>
          <Button size="sm" onClick={handleChangePassword} disabled={changePassword.isPending || !newPassword}>
            {changePassword.isPending ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <Shield size={12} className="mr-1.5" />}
            Alterar senha
          </Button>
        </motion.div>

        {/* Section 4: Appearance (prepared for future) */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="venus-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Palette size={16} />
            <h2 className="text-sm font-bold uppercase tracking-wider">Aparência</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 px-1">
              <div>
                <p className="text-sm font-medium">Idioma</p>
                <p className="text-[11px] text-muted-foreground">Português (Brasil)</p>
              </div>
              <span className="text-[10px] bg-accent px-2 py-0.5 rounded-full text-muted-foreground">Em breve</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-1">
              <div>
                <p className="text-sm font-medium">Formato de data</p>
                <p className="text-[11px] text-muted-foreground">DD/MM/AAAA</p>
              </div>
              <span className="text-[10px] bg-accent px-2 py-0.5 rounded-full text-muted-foreground">Em breve</span>
            </div>
            <div className="flex items-center justify-between py-2.5 px-1">
              <div>
                <p className="text-sm font-medium">Formato de exportação padrão</p>
                <p className="text-[11px] text-muted-foreground">9:16 Vertical</p>
              </div>
              <span className="text-[10px] bg-accent px-2 py-0.5 rounded-full text-muted-foreground">Em breve</span>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardSettings;

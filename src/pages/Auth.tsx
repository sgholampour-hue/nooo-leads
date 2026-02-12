import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Ingelogd!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Check je e-mail om je account te bevestigen.");
      }
    } catch (err: any) {
      toast.error(err.message || "Er ging iets mis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-foreground tracking-tight">
            {isLogin ? "Inloggen" : "Account aanmaken"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLogin ? "Log in om toegang te krijgen." : "Maak een account aan."}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="E-mailadres"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Laden..." : isLogin ? "Inloggen" : "Registreren"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Nog geen account?" : "Al een account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-foreground underline font-medium"
          >
            {isLogin ? "Registreren" : "Inloggen"}
          </button>
        </p>
      </div>
    </div>
  );
}

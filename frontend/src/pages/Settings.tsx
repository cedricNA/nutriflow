import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import { updateUserProfile } from "@/services/api";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const formSchema = z.object({
  sexe: z.enum(["male", "female"], {
    required_error: "Le sexe est requis",
  }),
  age: z.coerce.number().min(1, "L'âge est requis"),
  taille_cm: z.coerce.number().min(1, "La taille est requise"),
  poids_kg: z.coerce.number().min(1, "Le poids est requis"),
  goal: z.enum(["perte", "maintien", "prise"], {
    required_error: "L'objectif est requis",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const Settings = () => {
  const { toast } = useToast();
  const { data: profile } = useUserProfile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        sexe: profile.sexe,
        age: profile.age,
        taille_cm: profile.taille_cm,
        poids_kg: profile.poids_kg,
        goal: profile.goal,
      });
    }
  }, [profile, form]);

  async function onSubmit(values: FormValues) {
    try {
      await updateUserProfile(values);
      toast({ description: "Profil mis à jour avec succès" });
    } catch (err) {
      console.error(err);
      toast({
        description: "Erreur lors de la mise à jour du profil",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center gap-4 px-6">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Paramètres
            </h1>
          </div>
        </header>
        <main className="flex-1 space-y-6 p-6 pb-24 md:pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
              <FormField
                control={form.control}
                name="sexe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexe</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir le sexe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Homme</SelectItem>
                        <SelectItem value="female">Femme</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Âge</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taille_cm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taille (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="poids_kg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poids (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objectif</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un objectif" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="perte">Perte de poids</SelectItem>
                        <SelectItem value="maintien">Maintien</SelectItem>
                        <SelectItem value="prise">Prise de masse</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Enregistrer</Button>
            </form>
          </Form>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default Settings;


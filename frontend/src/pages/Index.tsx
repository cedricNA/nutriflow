import { useState, useEffect } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { BottomNav } from '@/components/BottomNav';
import heroImage from '@/assets/nutriflow-hero.jpg';
import { Info as InfoIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { useDashboardData } from '@/hooks/use-dashboard-data';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(max-width: 640px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

const goalLabels: Record<string, string> = {
  perte: 'Perte de poids',
  maintien: 'Maintien',
  prise: 'Prise de masse',
};

const Index = () => {
  const { data } = useDashboardData();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const profile = data?.profile;
  const summary = data?.summary;
  const remaining = Math.round(data?.remainingCalories ?? 0);
  const tdeeTarget = Math.round(data?.targetCalories ?? 0);
  const goalLabel = profile ? goalLabels[profile.goal ?? ''] ?? profile.goal ?? 'Indéfini' : 'Indéfini';

  const macroLine = summary && (summary.target_proteins_g || summary.target_carbs_g || summary.target_fats_g)
    ? `Protéines : ${summary.target_proteins_g ?? 0} g • Glucides : ${summary.target_carbs_g ?? 0} g • Lipides : ${summary.target_fats_g ?? 0} g`
    : undefined;

  const dialogContent = (
    <div id="day-ref-content" className="space-y-2">
      {profile?.tdee_base !== undefined && (
        <p>BMR (Mifflin-St Jeor) : {Math.round(profile.tdee_base)} kcal/j</p>
      )}
      {profile?.tdee !== undefined && (
        <p>TDEE de base : {Math.round(profile.tdee)} kcal/j</p>
      )}
      <p>TDEE cible du jour : {tdeeTarget} kcal</p>
      {macroLine && <p>{macroLine}</p>}
      <ul className="list-disc list-inside text-sm">
        <li>Le solde = Apports − TDEE</li>
        <li>Objectif en cours : {goalLabel}</li>
      </ul>
      <p className="text-xs text-muted-foreground">Formule BMR Mifflin-St Jeor. Adaptation TDEE selon objectif.</p>
    </div>
  );

  const InfoTrigger = (
    <button
      type="button"
      aria-label="Voir les explications (BMR/TDEE/Macros)"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls="day-ref-popover"
      className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-400 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <InfoIcon className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div className="min-h-screen flex w-full bg-background text-gray-900">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center gap-4 px-6">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">Dashboard NutriFlow</h1>
          </div>
        </header>
        <main className="flex-1 space-y-6 p-6 pb-24 md:pb-6">
          <div className="relative overflow-hidden rounded-xl shadow-strong">
            <img src={heroImage} alt="NutriFlow Dashboard" className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40 flex items-center">
              <div className="p-6 text-primary-foreground">
                <h2 className="text-3xl font-bold mb-2">Bienvenue dans NutriFlow</h2>
                <p className="text-lg opacity-90">Suivez votre alimentation et vos activités en toute simplicité</p>
              </div>
            </div>
          </div>

          {data && (
            <section className="space-y-4">
              <div className="rounded-md bg-white p-4 shadow">
                <p className="text-lg font-semibold">Objectif : {goalLabel}</p>
                <p className="text-sm text-gray-600">TDEE cible du jour : {tdeeTarget} kcal</p>
              </div>

              <div className="flex items-center bg-gray-50 border border-gray-300 p-3 rounded-md text-base text-gray-900">
                <span>
                  {remaining >= 0
                    ? `Il vous reste ${remaining} kcal`
                    : `Vous avez dépassé l'objectif de ${Math.abs(remaining)} kcal`}
                </span>
                {isMobile ? (
                  <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>{InfoTrigger}</SheetTrigger>
                    <SheetContent
                      side="bottom"
                      className="pb-10"
                      id="day-ref-popover"
                      aria-labelledby="day-ref-title"
                      aria-describedby="day-ref-content"
                    >
                      <h3 id="day-ref-title" className="text-lg font-semibold mb-2">
                        Références du jour
                      </h3>
                      {dialogContent}
                    </SheetContent>
                  </Sheet>
                ) : (
                  <Popover open={open} onOpenChange={setOpen} modal>
                    <PopoverTrigger asChild>{InfoTrigger}</PopoverTrigger>
                    <PopoverContent
                      id="day-ref-popover"
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="day-ref-title"
                      aria-describedby="day-ref-content"
                      className="w-80 p-4"
                    >
                      <h3 id="day-ref-title" className="text-lg font-semibold mb-2">
                        Références du jour
                      </h3>
                      {dialogContent}
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default Index;

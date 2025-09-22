# INITIAL - Navigation Temporelle Simple pour Historique (MVP)

## Contexte et Objectifs

### Vue d'ensemble
Amélioration simple de l'expérience utilisateur pour la navigation par dates dans la page Historique de NutriFlow. Remplacement du calendrier popup actuel par une navigation plus intuitive avec boutons précédent/suivant.

### Objectifs fonctionnels (MVP)
- **Navigation intuitive** : Boutons ←/→ plus accessibles que calendrier popup
- **Navigation rapide** : Bouton "Aujourd'hui" pour retour immédiat
- **Simplicité** : Aucune complexité technique, juste amélioration UX
- **Intégration harmonieuse** : Compatible avec DailyInsightCard existant

### Problème résolu
- Navigation fastidieuse avec calendrier popup pour changer de date jour par jour

## Architecture Technique (MVP)

### Composants existants (réutilisés)
- `Historique.tsx` : Page principale avec date state `useState<Date>(new Date())`
- `DailyInsightCard.tsx` : Affichage résumé quotidien (inchangé)
- `useDailySummary(dateStr)` : Hook pour données quotidiennes (inchangé)
- `fetchMeals(dateStr)` et `fetchActivities(dateStr)` : API calls (inchangés)

### Nouveau composant simple

#### `TemporalNavigator` (composant unique)
```tsx
interface TemporalNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}
```

**Fonctionnalités simples** :
- Affichage date courante avec format français
- Bouton ← (jour précédent)
- Bouton → (jour suivant)
- Bouton "Aujourd'hui"

### Intégration dans l'architecture existante

#### Modification `Historique.tsx`
```tsx
// AVANT (actuel) - lignes 59-77
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      <CalendarIcon className="mr-2 h-4 w-4" />
      {format(date, "PPP")}
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Calendar mode="single" selected={date} onSelect={setDate} />
  </PopoverContent>
</Popover>

// APRÈS (avec TemporalNavigator)
<TemporalNavigator
  selectedDate={date}
  onDateChange={setDate}
/>
```

**Changement minimal** : Remplacement direct du bloc Popover+Calendar par le nouveau composant.

## Spécifications UI/UX (MVP)

### Design System (Shadcn/UI)
- **Composants** : Button, Badge uniquement
- **Icônes Lucide** : ChevronLeft, ChevronRight, Home
- **Style** : Cohérent avec l'interface existante

### Layout simple
```tsx
// Layout unique (responsive automatique)
<div className="flex items-center justify-center gap-4">
  <Button variant="outline" size="sm">
    <ChevronLeft className="h-4 w-4" />
  </Button>

  <Badge variant="outline" className="px-4 py-2">
    {format(selectedDate, "PPP", { locale: fr })}
  </Badge>

  <Button variant="outline" size="sm">
    <ChevronRight className="h-4 w-4" />
  </Button>

  <Button variant="secondary" size="sm">
    Aujourd'hui
  </Button>
</div>
```

### Interactions simples
- **Click ←** : Date - 1 jour
- **Click →** : Date + 1 jour
- **Click "Aujourd'hui"** : Reset à new Date()
- **Aucune animation** : Changements instantanés

## Plan de Développement MVP

### Tâche unique : Composant TemporalNavigator
**Durée totale** : 10-15 minutes maximum

- [ ] **Créer composant** `frontend/src/components/TemporalNavigator.tsx`
  - *Durée* : 5 minutes
  - *Contenu* : Interface simple avec 3 boutons (←, →, Aujourd'hui) + affichage date

- [ ] **Intégrer dans Historique.tsx**
  - *Durée* : 3 minutes
  - *Modification* : Remplacer le bloc Popover+Calendar (lignes 59-77)

- [ ] **Test rapide fonctionnel**
  - *Durée* : 2 minutes
  - *Vérification* : Navigation fonctionne + DailyInsightCard se met à jour

## Validation MVP

### Critères d'acceptation simples
✅ **Navigation fonctionnelle** :
- [ ] Boutons ←/→ changent la date correctement
- [ ] Bouton "Aujourd'hui" remet à new Date()
- [ ] DailyInsightCard se met à jour avec la nouvelle date

✅ **Intégration** :
- [ ] Aucun breaking change
- [ ] Interface plus intuitive que calendrier popup
- [ ] Cohérent avec design système existant

## Implémentation

### Code du composant
```tsx
// frontend/src/components/TemporalNavigator.tsx
import { format, addDays, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";

interface TemporalNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function TemporalNavigator({ selectedDate, onDateChange }: TemporalNavigatorProps) {
  const goToPreviousDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const goToNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={goToPreviousDay}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Badge variant="outline" className="px-4 py-2">
        {format(selectedDate, "PPP", { locale: fr })}
      </Badge>

      <Button
        variant="outline"
        size="sm"
        onClick={goToNextDay}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={goToToday}
      >
        <Home className="mr-1 h-4 w-4" />
        Aujourd'hui
      </Button>
    </div>
  );
}
```

---

## IMPORTANT - Approche MVP

### Simplicité avant tout
- **Pas de backend** : Utilise seulement les APIs existantes
- **Pas de cache** : Les hooks existants gèrent déjà le cache
- **Pas de complexité** : Simple remplacement du calendrier popup
- **Temps réaliste** : 10-15 minutes d'implémentation

### Objectif
Améliorer l'UX de navigation entre les dates avec une solution simple, rapide à implémenter et immédiatement fonctionnelle.

*Cette spécification MVP peut être implémentée en quelques minutes par Claude Code et apporte une amélioration UX immédiate.*
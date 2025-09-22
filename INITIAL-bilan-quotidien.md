# INITIAL.md - Bilan Quotidien Enrichi Historique

**IMPORTANT**: Ce fichier définit une nouvelle feature/amélioration pour NutriFlow. Complétez toutes les sections avant de générer le PRP avec `claude generate-prp`.

---

## 📋 Informations Générales

### Nom de la Feature
**Feature Name**: Bilan Quotidien Enrichi pour la Page Historique

### Type de Changement
- [ ] 🆕 Nouvelle feature
- [x] 🔧 Amélioration existante
- [ ] 🐛 Bug fix critique
- [ ] ♻️ Refactoring/Optimisation
- [ ] 📚 Documentation
- [ ] 🧪 Tests/Qualité

### Priorité
- [ ] 🔥 Critique (bugs bloquants, sécurité)
- [x] ⚡ Haute (features importantes, optimisations majeures)
- [ ] 📊 Normale (améliorations UX, nouvelles features)
- [ ] 🔮 Basse (nice-to-have, futures optimisations)

---

## 🎯 Contexte et Objectifs

### Problème à Résoudre
**Description du problème**:
La page Historique de NutriFlow affiche actuellement un "Résumé de la journée" basique avec seulement les calories consommées, les calories brûlées par le sport, et une simple balance calculée localement. Les utilisateurs ne bénéficient pas des données riches disponibles dans daily_summary (BMR, TDEE, goal_feedback, pourcentages d'écart, statut global).

**Impact actuel**:
- Résumé quotidien trop simpliste ne reflétant pas la richesse des données disponibles
- Absence du goal_feedback système pour guider l'utilisateur ("Léger déficit, surveillez...")
- Pas de contexte métabolique (BMR/TDEE) pour aider à comprendre les besoins réels
- Aucune visualisation du statut global du jour avec codes couleur
- Balance calorique (-1873 kcal) affichée sans contexte d'interpretation

### Objectifs Mesurables
1. **Objectif principal**: Remplacer le résumé quotidien actuel par un bilan enrichi utilisant toutes les données daily_summary
2. **Objectifs secondaires**:
   - Mettre en évidence la balance calorique principale avec visualisation claire
   - Afficher le goal_feedback du système de façon prominente
   - Montrer les écarts par rapport aux objectifs en pourcentage
   - Implémenter un statut global avec codes couleur (déficit/surplus/équilibré)
   - Contextualiser avec les métriques BMR/TDEE

### Critères de Succès
- [ ] Balance calorique principale mise en évidence (-1873 kcal) avec visualisation claire
- [ ] Goal_feedback système affiché de façon prominente ("Léger déficit, surveillez...")
- [ ] Écarts par rapport aux objectifs affichés en pourcentage
- [ ] Statut global du jour avec code couleur (vert/orange/rouge)
- [ ] Métriques BMR/TDEE affichées pour contexte métabolique
- [ ] Interface plus riche et actionnable sans redondance avec future page statistiques

---

## 🏗️ Spécifications Techniques

### Composants Impactés

#### Backend (FastAPI)
- [ ] `main.py` - Configuration/CORS
- [ ] `nutriflow/api/router.py` - Nouveaux endpoints
- [ ] `nutriflow/services.py` - Logique métier
- [ ] `nutriflow/db/supabase.py` - Accès données
- [ ] `backend/services/` - Services spécialisés
- [ ] Tests backend
- [ ] **Autres**: Aucun (utilise daily_summary existant)

#### Frontend (React/TypeScript)
- [ ] `frontend/src/pages/` - Nouvelles pages
- [x] `frontend/src/components/` - Nouveau composant DailyInsightCard
- [ ] `frontend/src/hooks/` - Custom hooks
- [ ] `frontend/src/api/nutriflow.ts` - Client API
- [ ] `frontend/src/integrations/supabase/` - Types DB
- [ ] Tests frontend
- [x] **Autres**: Modification de src/pages/Historique.tsx pour remplacer le résumé actuel

#### Database (Supabase)
- [ ] Nouvelles tables
- [ ] Modifications de schéma
- [ ] Nouvelles vues/fonctions
- [ ] Migrations SQL
- [x] **Autres**: Utilise daily_summary existant avec toutes ses colonnes

### APIs Externes
- [ ] Nutritionix API
- [ ] OpenFoodFacts API
- [ ] Google Translate API
- [ ] **Nouvelle API**: Aucune

---

## 🎨 Spécifications UX/UI

### Interface Utilisateur
**Pages/Composants à créer/modifier**:
- Nouveau composant: `DailyInsightCard.tsx` (remplace le résumé simple)
- Modification: `src/pages/Historique.tsx` (remplacement de la Card "Résumé de la journée")
- Styles: Utilisation de Shadcn/UI Cards, Badges, Progress et Alert components

**Wireframes/Mockups**:
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Bilan Quotidien - 13 septembre 2025                 │
├─────────────────────────────────────────────────────────┤
│ 🔥 Balance Calorique: -1873 kcal                       │
│ ████████████████████████████████████████████████░░░░   │
│ 📊 Déficit significatif                                │
│                                                         │
│ 💡 Goal Feedback:                                      │
│ "Léger déficit, surveillez votre énergie et hydratation│
│  pour maintenir performances optimales"                 │
│                                                         │
│ 📈 Écarts Objectifs:                                   │
│ • Calories: -87% de l'objectif  🔴                     │
│ • Protéines: +12% de l'objectif 🟢                     │
│ • Glucides: -45% de l'objectif  🟠                     │
│ • Lipides: -32% de l'objectif   🟠                     │
│                                                         │
│ ⚡ Contexte Métabolique:                               │
│ • BMR: 1650 kcal/jour                                  │
│ • TDEE: 2039 kcal/jour                                 │
│ • Besoin net: 2039 kcal                                │
└─────────────────────────────────────────────────────────┘
```

### Expérience Utilisateur
**User Journey**:
1. Utilisateur accède à la page Historique et sélectionne une date
2. Visualise immédiatement le bilan enrichi avec contexte actionnable
3. Comprend sa situation nutritionnelle via le goal_feedback système
4. Voit les écarts spécifiques par macronutriment avec codes couleur
5. Comprend son contexte métabolique grâce aux métriques BMR/TDEE

**States/Interactions**:
- Loading states: Skeleton loader pendant fetch des données
- Error handling: Affichage message d'erreur si données daily_summary indisponibles
- Empty state: Message informatif si aucune donnée pour la date sélectionnée
- Success feedback: Mise à jour fluide lors de changement de date

---
#### Spécifications Design Professionnel

**Objectif** : Interface moderne et engageante digne d'une application nutrition premium

**Améliorations visuelles** :
- Gradient subtil pour la barre de progression
- Cards avec ombres douces et bordures arrondies
- Système de couleurs sophistiqué avec opacité
- Typographie hiérarchisée avec contrastes
- Espacement cohérent et aération
- Icônes Lucide pour enrichissement visuel
- Animation subtile au hover

**Référence design** : Applications comme MyFitnessPal ou Cronometer

## 📊 Spécifications Données

### Modèles de Données

#### Nouveaux Types TypeScript
```typescript
interface DailyInsightData {
  calorieBalance: number;
  balanceStatus: 'deficit' | 'surplus' | 'balanced';
  goalFeedback?: string;
  macroDeviations: {
    calories: { value: number; percentage: number; status: 'good' | 'warning' | 'danger' };
    proteins: { value: number; percentage: number; status: 'good' | 'warning' | 'danger' };
    carbs: { value: number; percentage: number; status: 'good' | 'warning' | 'danger' };
    fats: { value: number; percentage: number; status: 'good' | 'warning' | 'danger' };
  };
  metabolicContext: {
    bmr?: number;
    tdee?: number;
    netNeed?: number;
  };
}

interface DailyInsightCardProps {
  dailySummary: DailySummary;
  date: string;
  className?: string;
}
```
#### Formules de Calcul Scientifiques

**IMPORTANT - Rigueur nutritionnelle** : L'application doit différencier deux métriques distinctes pour la crédibilité scientifique :

**1. Solde énergétique quotidien (balance primaire)**
Formule : Calories consommées - Calories brûlées par activités
Exemple : 230 - 367.5 = -137.5 kcal
Signification : "Déficit/surplus net des activités du jour"
Affichage : "Solde énergétique : -137.5 kcal"

**2. Écart par rapport aux besoins physiologiques**
Formule : Solde énergétique - Besoins métaboliques restants
Exemple : -137.5 - (2038 - 367.5) = -1808 kcal
Signification : "Ce qui manque pour couvrir les besoins totaux"
Affichage : "Écart vs besoins : -1808 kcal (alimentation supplémentaire nécessaire)"

**Interface recommandée** : Afficher les deux métriques avec libellés clairs pour éviter confusion et maintenir crédibilité nutritionnelle.

**Validation scientifique** : Ces calculs respectent les principes établis de balance énergétique en nutrition clinique.

#### Tables Supabase Utilisées
Utilise la table daily_summary existante avec toutes les colonnes:
- `calories_consumed`, `target_calories` pour balance calorique
- `goal_feedback` pour conseils système
- `proteins_consumed`, `target_proteins_g` pour écarts protéines
- `carbs_consumed`, `target_carbs_g` pour écarts glucides
- `fats_consumed`, `target_fats_g` pour écarts lipides
- `bmr`, `tdee` pour contexte métabolique
- `calorie_balance` pour la balance calculée

#### Modifications Schéma Existant
Aucune modification nécessaire - daily_summary contient déjà toutes les données requises.

---

## 🔗 Intégrations et Dépendances

### Dépendances Techniques
**Nouvelles librairies requises**:

Backend:
- [ ] Aucune

Frontend:
- [x] Shadcn/UI Progress component (pour visualisation balance)
- [x] Shadcn/UI Alert component (pour goal_feedback)
- [x] Shadcn/UI Badge component (pour statuts macro)
- [x] Lucide icons pour indicateurs visuels
- [x] Tailwind CSS pour responsive design

### Dépendances Fonctionnelles
**Features existantes impactées**:
- Page Historique - Remplacement de la section "Résumé de la journée"
- API daily-summary - Utilisation complète des données enrichies
- Hook useDailySummary - Utilisation des données étendues

### APIs et Services
**Nouveaux endpoints requis**:
Aucun - utilise `GET /api/daily-summary` existant avec toutes ses données

---

## 🧪 Stratégie de Test

### Tests Unitaires
**Backend (Pytest)**:
- [ ] Tests services métier
- [ ] Tests endpoints API
- [ ] Tests intégrations DB
- [ ] **Couverture cible**: N/A (pas de changements backend)

**Frontend (Vitest)**:
- [ ] Tests composant DailyInsightCard
- [ ] Tests calculs des écarts et pourcentages
- [ ] Tests détermination des statuts (good/warning/danger)
- [ ] Tests rendu conditionnel selon données disponibles
- [ ] Tests affichage goal_feedback
- [ ] **Couverture cible**: 90%+

### Tests d'Intégration
- [ ] Tests responsive design (mobile/desktop)
- [ ] Tests intégration dans page Historique
- [ ] Tests changement de date
- [ ] Tests performance avec données complètes
- [ ] Tests accessibilité

### Scenarios de Test
1. **Happy Path**: Données complètes daily_summary (-1873 kcal balance, goal_feedback présent)
2. **Edge Cases**:
   - Données partielles (BMR/TDEE manquants)
   - Balance équilibrée (0 kcal)
   - Surplus important (+500 kcal)
   - Goal_feedback absent
3. **Error Handling**:
   - daily_summary undefined/null
   - Targets à 0 (division par zéro)
   - Données négatives incorrectes

---

## ⚡ Performance et Sécurité

### Considérations Performance
**Impacts attendus**:
- [x] Temps de réponse API: Aucun impact (utilise données existantes)
- [x] Taille bundle frontend: +5KB max (composant plus riche)
- [x] Utilisation mémoire: Négligeable (calculs simples)
- [x] Requêtes DB: Aucune nouvelle requête

**Optimisations prévues**:
- Utilisation de React.memo pour éviter re-renders inutiles
- Calculs de pourcentages et statuts mis en cache avec useMemo
- Rendu conditionnel pour éviter calculs inutiles avec données manquantes

### Sécurité
**Données sensibles**:
- [x] Authentification requise (inherit de la page Historique)
- [x] Autorisation/permissions (utilisateur authentifié)
- [x] Validation input utilisateur (données read-only)
- [ ] Chiffrement données sensibles

**Audit de sécurité**:
- [x] Review code sécurité (composant display-only)
- [ ] Tests injection SQL (N/A)
- [x] Tests XSS/CSRF (pas d'inputs utilisateur)
- [x] Validation OWASP (composant display simple)

---

## 📅 Planning et Estimations

### Décomposition Estimée
**Phase 1: Préparation** (~2 heures)
- [ ] Analyse des données daily_summary complètes disponibles
- [ ] Design de l'interface riche avec mockups
- [ ] Validation de l'intégration dans Historique.tsx
- [ ] Planning des composants UI (Progress, Alert, Badge)

**Phase 2: Développement** (~6 heures)
- [ ] Frontend: Composant DailyInsightCard complet
- [ ] Logique de calculs écarts et statuts
- [ ] Intégration dans page Historique (remplacement)
- [ ] Styles responsive et codes couleur
- [ ] Tests unitaires composant

**Phase 3: Validation** (~2 heures)
- [ ] Tests d'intégration page Historique
- [ ] Validation gates frontend
- [ ] Tests responsive mobile/desktop
- [ ] Tests avec données variées (edge cases)
- [ ] Documentation

### Jalons Critiques
- [ ] **Milestone 1**: Composant DailyInsightCard fonctionnel avec données basic
- [ ] **Milestone 2**: Logique complète calculs + codes couleur
- [ ] **Milestone 3**: Intégration Historique + tests complets

### Contraintes Temporelles
**Deadline souhaitée**: 1-2 jours (feature prioritaire UX)
**Dépendances bloquantes**: Aucune (données daily_summary disponibles)

---

## 🚨 Risques et Mitigation

### Risques Techniques
1. **Risque**: Complexité des calculs de pourcentages avec données manquantes
   - **Probabilité**: Moyenne
   - **Impact**: Moyen
   - **Mitigation**: Validation defensive et fallbacks pour chaque calcul

2. **Risque**: Performance sur mobile avec affichage riche
   - **Probabilité**: Faible
   - **Impact**: Faible
   - **Mitigation**: Utilisation de useMemo et React.memo, tests performance

3. **Risque**: Conflits visuels avec le reste de la page Historique
   - **Probabilité**: Faible
   - **Impact**: Moyen
   - **Mitigation**: Utiliser les mêmes composants Shadcn/UI et patterns existants

### Risques Fonctionnels
- **Adoption utilisateur**: Risque faible, amélioration UX évidente
- **Redondance avec future page statistiques**: Mitigation via focus sur actionnable quotidien
- **Surcharge d'information**: Mitigation via hiérarchisation visuelle claire

### Plan de Rollback
**En cas d'échec critique**:
1. Restaurer le composant "Résumé de la journée" original
2. Revert des modifications Historique.tsx
3. Masquer le nouveau composant via feature flag

---

## 📚 Documentation et Communication

### Documentation Requise
- [ ] Update `CLAUDE.md` (ajout nouveau pattern bilan quotidien)
- [ ] Component documentation DailyInsightCard (props, usage)
- [ ] User Guide (N/A - amélioration transparente)
- [ ] Technical README (JSDoc dans composant)

### Communication
**Stakeholders à informer**:
- [ ] Équipe développement (via PRP)
- [ ] Product Owner (amélioration UX significative)
- [ ] Utilisateurs finaux (amélioration transparente mais visible)

---

## ✅ Validation Gates Obligatoires

### Backend Validation
- [x] `uv run pytest` - N/A (pas de changements backend)
- [x] `uv run ruff check` - N/A
- [x] Type checking sans erreurs - N/A
- [x] Pas de secrets exposés - N/A

### Frontend Validation
- [ ] `npm test` - Tests passants à 100%
- [ ] `npm run lint` - ESLint sans erreurs
- [ ] `npm run build` - Build succès
- [ ] Tests responsive

### Integration Validation
- [ ] Component tests passants
- [ ] Performance non dégradée
- [ ] Sécurité validée (display-only)
- [ ] Documentation à jour

---

## 🏁 Critères d'Acceptance Finale

### Fonctionnel
- [ ] Balance calorique principale mise en évidence avec visualisation claire
- [ ] Goal_feedback système affiché de façon prominente
- [ ] Écarts par rapport aux objectifs en pourcentage avec codes couleur
- [ ] Statut global du jour clair (déficit/surplus/équilibré)
- [ ] Métriques BMR/TDEE pour contexte métabolique
- [ ] Remplacement complet du résumé quotidien basique

### Technique
- [ ] Code review auto-approuvé (patterns standards NutriFlow)
- [ ] Tests complets et passants
- [ ] Performance validée (composant optimisé)
- [ ] Sécurité auditée (read-only component)
- [ ] Intégration harmonieuse page Historique

### Utilisateur
- [ ] UX intuitive (hiérarchisation information claire)
- [ ] Accessibilité respectée (contraste, ARIA, lecteurs écran)
- [ ] Compatibilité mobile/desktop
- [ ] Interface actionnable (goal_feedback guidant comportement)
- [ ] Pas de redondance avec future page statistiques

---

## 📝 Notes Additionnelles

### Contexte Supplémentaire
Cette feature transforme radicalement l'expérience de la page Historique en passant d'un résumé basique à un véritable bilan actionnable. Elle exploite pleinement la richesse des données daily_summary standardisées et du goal_feedback généré par le système. L'objectif est de fournir un contexte suffisant pour que l'utilisateur comprenne sa situation nutritionnelle sans attendre une future page statistiques.

### Références
- Shadcn/UI Components: Progress, Alert, Badge, Card
- Daily Summary API: `/api/daily-summary` avec toutes les colonnes
- Page Historique actuelle: `frontend/src/pages/Historique.tsx` lignes 101-133

### Questions Ouvertes
1. Granularité des codes couleur pour les écarts ? → Vert <±10%, Orange ±10-25%, Rouge >25%
2. Affichage des métriques BMR/TDEE en tooltip ou visible ? → Visible pour éducation utilisateur
3. Animation lors de changement de statut ? → Non, simplicité prioritaire pour MVP
4. Lien vers détails nutritionnels ? → Non, page Historique reste focus vue d'ensemble

---

**IMPORTANT**: Une fois ce fichier complété, utilisez `claude generate-prp` pour créer le Plan de Réalisation de Projet structuré, puis `claude execute-prp` pour l'exécution automatisée.

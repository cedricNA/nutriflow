# INITIAL.md - Composant Progression Calories Quotidiennes

**IMPORTANT**: Ce fichier définit une nouvelle feature/amélioration pour NutriFlow. Complétez toutes les sections avant de générer le PRP avec `claude generate-prp`.

---

## 📋 Informations Générales

### Nom de la Feature
**Feature Name**: Composant Progression Calories Quotidiennes

### Type de Changement
- [x] 🆕 Nouvelle feature
- [ ] 🔧 Amélioration existante  
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
Le dashboard NutriFlow affiche actuellement les données de calories sous forme de métriques brutes (80, 45, 20, +125%) sans contexte visuel clair pour l'utilisateur. Les utilisateurs ne peuvent pas rapidement évaluer leur progression vers leurs objectifs quotidiens de calories.

**Impact actuel**:
- Manque de feedback visuel immédiat sur la progression des objectifs
- Difficulté d'interprétation des données nutritionnelles actuelles
- Absence d'indicateurs visuels pour guider les comportements alimentaires

### Objectifs Mesurables
1. **Objectif principal**: Créer un composant de progression calories avec affichage visuel clair (barre de progression + couleurs)
2. **Objectifs secondaires**: 
   - Intégrer harmonieusement dans la section métriques du dashboard
   - Assurer la responsivité mobile et desktop
   - Implémenter un système de couleurs intuitif (vert/orange/rouge)

### Critères de Succès
- [x] Affichage "XXX / YYYY cal" avec données réelles (369 / 2039 cal)
- [x] Barre de progression visuelle avec pourcentage
- [x] Système de couleurs: Vert < 100%, Orange 100-110%, Rouge > 110%
- [x] Intégration responsive dans le dashboard existant

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
- [x] `frontend/src/components/` - Nouveau composant CaloriesProgress
- [ ] `frontend/src/hooks/` - Custom hooks
- [ ] `frontend/src/api/nutriflow.ts` - Client API
- [ ] `frontend/src/integrations/supabase/` - Types DB
- [x] Tests frontend
- [x] **Autres**: Modification de src/pages/Index.tsx pour intégration

#### Database (Supabase)
- [ ] Nouvelles tables
- [ ] Modifications de schéma
- [ ] Nouvelles vues/fonctions
- [ ] Migrations SQL
- [ ] **Autres**: Utilise daily_summary existant

### APIs Externes
- [ ] Nutritionix API
- [ ] OpenFoodFacts API
- [ ] Google Translate API
- [ ] **Nouvelle API**: Aucune

---

## 🎨 Spécifications UX/UI

### Interface Utilisateur
**Pages/Composants à créer/modifier**:
- Nouveau composant: `CaloriesProgress.tsx`
- Modification: `src/pages/Index.tsx` (intégration dans section métriques)
- Styles: Utilisation de Shadcn/UI Progress et Card components

**Wireframes/Mockups**:
```
┌─────────────────────────────────┐
│ 📊 Calories Aujourd'hui         │
├─────────────────────────────────┤
│ 369 / 2039 cal                  │
│ ████████░░░░░░░░░░░░░░ 18%      │
│                                 │
│ Couleur: Vert (< 100%)          │
└─────────────────────────────────┘
```

### Expérience Utilisateur
**User Journey**:
1. Utilisateur accède au dashboard
2. Visualise immédiatement sa progression calories du jour
3. Comprend visuellement son statut (vert = bon, orange = attention, rouge = dépassement)

**States/Interactions**:
- Loading states: Skeleton loader pendant fetch des données
- Error handling: Affichage message d'erreur si données indisponibles
- Success feedback: Animation subtile lors de mise à jour des données

---

## 📊 Spécifications Données

### Modèles de Données

#### Nouveaux Types TypeScript
```typescript
interface CaloriesProgressData {
  consumed: number;
  target: number;
  percentage: number;
  status: 'good' | 'warning' | 'danger';
}

interface CaloriesProgressProps {
  dailySummary: DailySummary;
  className?: string;
}
```

#### Nouvelles Tables Supabase
Aucune - utilise la table daily_summary existante avec les colonnes:
- `calories_consumed` 
- `target_calories`

#### Modifications Schéma Existant
Aucune modification nécessaire - daily_summary contient déjà toutes les données requises.

---

## 🔗 Intégrations et Dépendances

### Dépendances Techniques
**Nouvelles librairies requises**:

Backend:
- [ ] Aucune

Frontend:
- [x] Shadcn/UI Progress component (déjà disponible)
- [x] Lucide icons pour icône calories
- [x] Tailwind CSS pour responsive design

### Dépendances Fonctionnelles
**Features existantes impactées**:
- Dashboard principal - Intégration dans section métriques existante
- API daily-summary - Utilisation des données existantes

### APIs et Services
**Nouveaux endpoints requis**:
Aucun - utilise `GET /api/daily-summary` existant

---

## 🧪 Stratégie de Test

### Tests Unitaires
**Backend (Pytest)**:
- [ ] Tests services métier
- [ ] Tests endpoints API
- [ ] Tests intégrations DB
- [ ] **Couverture cible**: N/A (pas de changements backend)

**Frontend (Vitest)**:
- [x] Tests composant CaloriesProgress
- [x] Tests calculs de pourcentage et status
- [x] Tests rendu conditionnel des couleurs
- [x] **Couverture cible**: 90%+

### Tests d'Intégration
- [x] Tests responsive design (mobile/desktop)
- [x] Tests intégration dans dashboard
- [ ] Tests performance
- [x] Tests accessibilité

### Scenarios de Test
1. **Happy Path**: Données normales (369/2039 cal = 18% vert)
2. **Edge Cases**: 
   - 0 calories consommées
   - Dépassement de 200%+ des objectifs
   - Données manquantes/nulles
3. **Error Handling**: 
   - dailySummary undefined
   - target_calories = 0
   - calories_consumed négatives

---

## ⚡ Performance et Sécurité

### Considérations Performance
**Impacts attendus**:
- [x] Temps de réponse API: Aucun impact (utilise données existantes)
- [x] Taille bundle frontend: +2KB max (composant simple)
- [x] Utilisation mémoire: Négligeable
- [x] Requêtes DB: Aucune nouvelle requête

**Optimisations prévues**:
- Utilisation de React.memo pour éviter re-renders inutiles
- Calculs de pourcentage mis en cache

### Sécurité
**Données sensibles**:
- [x] Authentification requise (inherit du dashboard)
- [x] Autorisation/permissions (utilisateur TEST_USER_ID)
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
**Phase 1: Préparation** (~1 heure)
- [x] Analyse du composant Progress existant Shadcn/UI
- [x] Review des données DailySummary disponibles
- [x] Design des couleurs et responsive
- [x] Validation intégration dashboard

**Phase 2: Développement** (~3 heures)  
- [x] Frontend: Composant CaloriesProgress
- [x] Intégration dans dashboard (Index.tsx)
- [x] Styles responsive et couleurs
- [x] Tests unitaires composant

**Phase 3: Validation** (~1 heure)
- [x] Tests d'intégration
- [x] Validation gates frontend
- [x] Tests responsive
- [x] Documentation

### Jalons Critiques
- [x] **Milestone 1**: Composant fonctionnel avec données
- [x] **Milestone 2**: Intégration dashboard + responsive  
- [x] **Milestone 3**: Tests complets + validation

### Contraintes Temporelles
**Deadline souhaitée**: Immédiate (feature simple, 5h max)
**Dépendances bloquantes**: Aucune

---

## 🚨 Risques et Mitigation

### Risques Techniques
1. **Risque**: Conflits de style avec métriques existantes
   - **Probabilité**: Faible
   - **Impact**: Faible  
   - **Mitigation**: Utiliser les mêmes composants Shadcn/UI que le dashboard

2. **Risque**: Performance sur mobile avec animations
   - **Probabilité**: Faible
   - **Impact**: Faible
   - **Mitigation**: Animations CSS simples, tests sur devices

### Risques Fonctionnels
- **Adoption utilisateur**: Risque faible, amélioration UX claire
- **Performance**: Risque minimal, composant léger
- **Compatibilité**: Utilise les patterns existants NutriFlow

### Plan de Rollback
**En cas d'échec critique**:
1. Masquer le composant via feature flag CSS
2. Revert des modifications Index.tsx
3. Supprimer le composant CaloriesProgress

---

## 📚 Documentation et Communication

### Documentation Requise
- [ ] Update `CLAUDE.md` (ajout composant dans patterns UI)
- [ ] Component documentation (props, usage)
- [ ] User Guide (N/A - feature transparente)
- [x] Technical README (JSDoc dans composant)

### Communication
**Stakeholders à informer**:
- [x] Équipe développement (via PRP)
- [ ] Product Owner
- [ ] Utilisateurs finaux (amélioration transparente)

---

## ✅ Validation Gates Obligatoires

### Backend Validation
- [x] `uv run pytest` - N/A (pas de changements backend)
- [x] `uv run ruff check` - N/A
- [x] Type checking sans erreurs - N/A
- [x] Pas de secrets exposés - N/A

### Frontend Validation  
- [x] `npm test` - Tests passants à 100%
- [x] `npm run lint` - ESLint sans erreurs
- [x] `npm run build` - Build succès
- [x] Tests responsive

### Integration Validation
- [x] Component tests passants
- [x] Performance non dégradée
- [x] Sécurité validée (display-only)
- [x] Documentation à jour

---

## 🏁 Critères d'Acceptance Finale

### Fonctionnel
- [x] Affichage "369 / 2039 cal" avec données réelles
- [x] Barre de progression visuelle fonctionnelle
- [x] Système de couleurs correct (vert/orange/rouge)
- [x] Intégration harmonieuse dans dashboard

### Technique  
- [x] Code review auto-approuvé (patterns standards)
- [x] Tests complets et passants
- [x] Performance validée (composant léger)
- [x] Sécurité auditée (read-only component)

### Utilisateur
- [x] UX intuitive (progression visuelle claire)
- [x] Accessibilité respectée (contraste, ARIA)
- [x] Compatibilité mobile/desktop
- [x] Documentation composant complète

---

## 📝 Notes Additionnelles

### Contexte Supplémentaire
Cette feature s'appuie sur le travail de standardisation daily_summary réalisé précédemment. Elle utilise les données déjà validées (calories_consumed: 369, target_calories: 2039) et les patterns UI existants de NutriFlow.

### Références
- Shadcn/UI Progress: https://ui.shadcn.com/docs/components/progress
- Daily Summary API: `/api/daily-summary`
- Design System: Composants existants Dashboard Index.tsx

### Questions Ouvertes
1. Animation lors de changement de données ? → Non, simplicité prioritaire
2. Tooltip avec détails calories ? → Non, MVP simple
3. Click pour accéder aux détails ? → Non, display-only pour l'instant

---

**IMPORTANT**: Une fois ce fichier complété, utilisez `claude generate-prp` pour créer le Plan de Réalisation de Projet structuré, puis `claude execute-prp` pour l'exécution automatisée.
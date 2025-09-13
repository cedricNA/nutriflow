# Execute PRP Command

**Description**: Exécute un Plan de Réalisation de Projet (PRP) de manière séquentielle avec validation automatique

## Usage

```bash
# Exécuter le PRP le plus récent
claude execute-prp

# Exécuter un PRP spécifique
claude execute-prp --file "PRPs/PRP-20240817-nutrition-dashboard.md"

# Exécuter avec mode interactif (confirmation à chaque étape)
claude execute-prp --interactive

# Reprendre l'exécution à partir d'une phase spécifique
claude execute-prp --resume-from "Phase 2"

# Exécution en mode dry-run (simulation)
claude execute-prp --dry-run
```

## Fonctionnement

### 1. **Parsing PRP**
- Lecture et validation du fichier PRP
- Extraction des phases et tâches
- Identification des dépendances
- Vérification des prérequis

### 2. **Initialisation Todo List**
- Création automatique de la todo list Claude Code
- Mapping tâches PRP → todos
- Configuration des statuts et dépendances

### 3. **Exécution Séquentielle**
```
Phase 1: Préparation
├─ Tâche 1.1 → [in_progress] → [completed]
├─ Tâche 1.2 → [in_progress] → [completed]
└─ Validation Phase 1 ✓

Phase 2: Développement  
├─ Tâche 2.1 → [in_progress] → [completed]
├─ Tâche 2.2 → [in_progress] → [completed]
└─ Validation Phase 2 ✓

Phase 3: Validation
├─ Tests → [in_progress] → [completed]
├─ Linting → [in_progress] → [completed]
└─ Validation Gates ✓
```

### 4. **Validation Automatique**
- Execution des validation gates NutriFlow
- Vérification des critères d'acceptance
- Tests automatisés (backend + frontend)
- Contrôles qualité (linting, types)

## Modes d'Exécution

### 🚀 Mode Standard
```bash
claude execute-prp
```
- Exécution automatique sans interruption
- Validation gates à chaque phase
- Arrêt en cas d'échec critique

### 🎯 Mode Interactif  
```bash
claude execute-prp --interactive
```
- Confirmation manuelle à chaque tâche
- Possibilité de skip/modifier
- Debug et troubleshooting facilités

### 🔍 Mode Dry-Run
```bash
claude execute-prp --dry-run
```
- Simulation complète sans modifications
- Validation de la faisabilité
- Estimation du temps d'exécution

### 🔄 Mode Resume
```bash
claude execute-prp --resume-from "Phase 2"
```
- Reprise après interruption
- Récupération état todo list
- Skip des tâches déjà complétées

## Structure d'Exécution

### Phase 1: Préparation
```markdown
- [ ] Analyse des dépendances existantes
- [ ] Vérification de l'environnement
- [ ] Setup des outils nécessaires
- [ ] Validation des prérequis techniques
```

### Phase 2: Développement
```markdown
- [ ] Implémentation des composants core
- [ ] Tests unitaires parallèles
- [ ] Intégration avec APIs existantes
- [ ] Documentation code inline
```

### Phase 3: Validation & Déploiement
```markdown
- [ ] Tests d'intégration complets
- [ ] Validation gates (obligatoire)
- [ ] Review et optimisations
- [ ] Mise à jour documentation
```

## Validation Gates Intégrées

### ✅ Gates Backend (Python)
```bash
# Automatiquement exécutées
uv run pytest                    # Tests passants à 100%
uv run ruff check               # Linting sans erreurs  
uv run mypy nutriflow/          # Type checking
```

### ✅ Gates Frontend (TypeScript)
```bash
# Automatiquement exécutées
cd frontend && npm test         # Tests passants à 100%
cd frontend && npm run lint     # ESLint sans erreurs
cd frontend && npm run build    # Build succès
```

### ✅ Gates Qualité
- Documentation mise à jour (CLAUDE.md si nécessaire)
- Conformité architecture NutriFlow
- Sécurité (pas de secrets exposés)
- Performance (pas de régression)

## Gestion d'Erreurs

### 🚨 Échec de Tâche
```
[ERROR] Tâche 2.3 échouée: "Tests unitaires API nutrition"
[ACTION] Options disponibles:
  1. Retry (tentative automatique)
  2. Skip (marquer comme completed avec warning)  
  3. Debug (mode interactif pour investigation)
  4. Abort (arrêt complet de l'exécution)
```

### ⚠️ Échec de Validation Gate
```
[CRITICAL] Validation Gate échouée: "Frontend tests"
[BLOCKING] Impossible de continuer sans résolution
[ACTION] Résolution automatique tentée...
[MANUAL] Intervention manuelle requise
```

### 🔄 Gestion des Conflits
- Détection automatique des conflits Git
- Résolution assistée pour les conflits simples
- Escalation manuelle pour les conflits complexes

## Reporting et Métriques

### 📊 Dashboard en Temps Réel
```
PRP: nutrition-dashboard (Phase 2/3)
Progress: ████████░░ 80%

Phase 1: ✅ Completed (12min)
Phase 2: 🟡 In Progress (3/5 tasks)
  ├─ ✅ API Integration (8min)
  ├─ ✅ UI Components (15min)  
  ├─ 🔄 State Management (in progress)
  ├─ ⏳ Testing Setup
  └─ ⏳ Documentation

Phase 3: ⏳ Pending

Estimated Time Remaining: 25min
```

### 📈 Métriques d'Exécution
- Temps par tâche/phase
- Taux de succès validation gates
- Détection des goulots d'étranglement
- Recommandations d'optimisation

## Configuration

### Variables d'Environnement
```bash
PRP_EXECUTION_MODE="standard"     # standard|interactive|dry-run
PRP_AUTO_GATES=true              # Validation gates automatiques
PRP_BACKUP_FREQUENCY=300         # Backup todo list (secondes)
PRP_MAX_RETRIES=3                # Tentatives max par tâche
```

### Hooks d'Exécution
```bash
# .claude/hooks/prp-pre-execution.sh
#!/bin/bash
echo "Préparation environnement PRP..."
git stash # Sauvegarde modifications en cours

# .claude/hooks/prp-post-execution.sh  
#!/bin/bash
echo "Nettoyage post-exécution..."
git status # Vérification état final
```

## Exemples d'Usage

### Exemple 1: Feature UI complète
```bash
claude execute-prp --file "PRPs/PRP-20240817-nutrition-dashboard.md"
# Exécution: Préparation → Développement → Tests → Validation
# Durée estimée: 45min
# Validation gates: ✅ Backend + ✅ Frontend + ✅ Intégration
```

### Exemple 2: Refactoring critique
```bash
claude execute-prp --file "PRPs/PRP-20240817-refactor-services.md" --interactive
# Mode interactif pour refactoring sensible
# Validation manuelle à chaque étape
# Rollback automatique en cas d'échec
```

### Exemple 3: Bug fix urgent
```bash
claude execute-prp --file "PRPs/PRP-20240817-fix-daily-summary.md" --resume-from "Phase 2"
# Reprise après interruption
# Focus sur la résolution sans re-analyse
```

## Intégration Git

### 🌿 Gestion des Branches
- Création automatique de branch feature
- Commits atomiques par tâche complétée
- PR automatique en fin d'exécution

### 📝 Messages de Commit
```
feat(nutrition): implement dashboard components

- Add nutrition overview card component
- Implement calorie tracking visualization  
- Add responsive layout for mobile

🤖 Generated with PRP execution
Closes: PRP-20240817-nutrition-dashboard.md [Phase 2]
```

## Surveillance et Observabilité

### 📊 Logs Structurés
```json
{
  "timestamp": "2024-08-17T10:30:00Z",
  "prp_id": "PRP-20240817-nutrition-dashboard",
  "phase": "2",
  "task": "State Management Implementation", 
  "status": "in_progress",
  "duration_ms": 45000,
  "validation_gates_passed": ["backend_tests", "linting"]
}
```

### 🔔 Notifications
- Slack/Discord pour échecs critiques
- Email pour completion de PRP
- GitHub Issues pour bugs détectés

---

**Note**: Cette commande transforme les PRPs en exécution automatisée avec validation continue, garantissant la qualité et la conformité aux standards NutriFlow définis dans CLAUDE.md.
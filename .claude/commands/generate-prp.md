# Generate PRP Command

**Description**: Génère un Plan de Réalisation de Projet (PRP) structuré à partir d'un fichier INITIAL.md

## Usage

```bash
# Générer un PRP à partir d'INITIAL.md
claude generate-prp

# Générer un PRP avec un nom spécifique
claude generate-prp --name "feature-dark-mode"

# Générer un PRP à partir d'un fichier INITIAL spécifique
claude generate-prp --input "./custom-initial.md"
```

## Fonctionnement

1. **Lecture**: Analyse le fichier `INITIAL.md` à la racine du projet
2. **Génération**: Crée un PRP structuré avec :
   - Analyse du contexte et des exigences
   - Décomposition en tâches atomiques
   - Séquencement et dépendances
   - Critères d'acceptance et tests
   - Validation gates et checkpoints
3. **Sauvegarde**: Enregistre le PRP dans `PRPs/PRP-{timestamp}-{name}.md`

## Structure du PRP généré

```markdown
# PRP - {Feature Name}

## 1. Contexte et Objectifs
- Analyse des besoins INITIAL.md
- Objectifs mesurables

## 2. Architecture & Design
- Décisions architecturales
- Diagrammes et schémas

## 3. Plan d'Exécution
### Phase 1: Préparation
- [ ] Tâche 1.1
- [ ] Tâche 1.2

### Phase 2: Développement
- [ ] Tâche 2.1
- [ ] Tâche 2.2

### Phase 3: Validation
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Validation gates

## 4. Critères d'Acceptance
- Conditions de succès
- Métriques de validation

## 5. Risques et Mitigation
- Risques identifiés
- Plans de mitigation
```

## Règles de Génération

### ✅ Validation INITIAL.md
- Présence des sections obligatoires
- Cohérence des exigences
- Faisabilité technique

### 🔧 Optimisations
- Décomposition en tâches < 4h
- Identification des dépendances critiques
- Respect des standards NutriFlow (CLAUDE.md)

### 📋 Intégration TodoWrite
- Génération automatique de la todo list
- Mapping tâches PRP → todos Claude Code
- Statuts et dépendances

## Exemples d'Usage

### Exemple 1: Feature complète
```bash
# INITIAL.md contient une nouvelle feature UI
claude generate-prp --name "nutrition-dashboard"
# → PRPs/PRP-20240817-nutrition-dashboard.md
```

### Exemple 2: Refactoring
```bash
# INITIAL.md décrit un refactoring services.py  
claude generate-prp --name "refactor-services"
# → PRPs/PRP-20240817-refactor-services.md
```

### Exemple 3: Bug fix complexe
```bash
# INITIAL.md analyse un bug critique
claude generate-prp --name "fix-daily-summary-calc"
# → PRPs/PRP-20240817-fix-daily-summary-calc.md
```

## Configuration

### Variables d'environnement
```bash
PRP_OUTPUT_DIR="PRPs"              # Dossier de sortie
PRP_TEMPLATE_PATH=".claude/templates/prp-template.md"  # Template custom
PRP_AUTO_TODO=true                 # Génération auto todo list
```

### Intégration CLAUDE.md
- Respect des validation gates obligatoires
- Standards de code (Ruff, ESLint, types)
- Architecture NutriFlow (FastAPI + React)
- Patterns recommandés

## Post-génération

Après génération du PRP :

1. **Review**: Valider la cohérence du plan
2. **Refinement**: Ajuster les tâches si nécessaire  
3. **Execution**: Utiliser `claude execute-prp` pour démarrer
4. **Tracking**: Suivre l'avancement via todo list Claude Code

## Intégration CI/CD

```yaml
# .github/workflows/prp-validation.yml
name: PRP Validation
on:
  push:
    paths: ['PRPs/**']
jobs:
  validate-prp:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate PRP Structure
        run: claude validate-prp --file ${{ github.event.head_commit.modified }}
```

---

**Note**: Cette commande s'intègre parfaitement avec le workflow de développement NutriFlow. Elle respecte les standards définis dans CLAUDE.md et génère des plans exécutables avec Claude Code.
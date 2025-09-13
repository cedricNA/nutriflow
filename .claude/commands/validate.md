# Command: validate

Lance tous les tests et validations pour s'assurer que le code est prêt pour production.

## Étapes de validation

### Backend
1. Lance `uv run pytest` pour tous les tests Python
2. Vérifie le linting avec `uv run ruff check`
3. Vérifie le formatage avec `uv run ruff format --check`

### Frontend  
1. Va dans le dossier frontend : `cd frontend`
2. Lance `npm run lint` pour ESLint
3. Lance `npm run type-check` si disponible
4. Lance `npm test` pour les tests
5. Teste le build avec `npm run build`

## Résultat
Affiche un résumé ✅/❌ pour chaque validation et indique si le projet est prêt.
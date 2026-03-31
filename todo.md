# Les Bâtisseurs Engagés - Application v3 - TODO

## Phase 1 - Schéma de Base de Données
- [x] Configurer le schéma Drizzle complet (utilisateurs, membres, projets, finances, documents, CRM)
- [x] Générer et appliquer les migrations SQL
- [x] Créer les helpers de base de données

## Phase 2 - Authentification Locale
- [x] Implémenter l'authentification par email/mot de passe
- [x] Créer les tables users_local et user_sessions
- [x] Implémenter les routers tRPC (register, login, logout, getCurrentUser)
- [x] Créer les pages Login et Register
- [x] Ajouter les tests vitest pour l'authentification

## Phase 3 - Système de Design et Layout
- [x] Configurer la palette de couleurs OKLCH
- [x] Créer le DashboardLayout avec sidebar
- [x] Implémenter la navigation principale
- [ ] Ajouter les loading skeletons
- [ ] Tester la responsivité mobile

## Phase 4 - Tableau de Bord
- [x] Créer la page Home avec statistiques dynamiques
- [x] Ajouter les graphiques (membres, finances, projets)
- [x] Implémenter les cartes KPI
- [x] Ajouter les raccourcis rapides

## Phase 5 - Gestion des Membres
- [ ] Implémenter le router tRPC pour les membres
- [ ] Créer la page Members avec liste et filtres
- [ ] Ajouter la recherche avec debounce
- [ ] Implémenter les mises à jour optimistes
- [ ] Ajouter les formulaires d'ajout/édition

## Phase 6 - Gestion des Projets
- [ ] Implémenter le router tRPC pour les projets et tâches
- [ ] Créer la page Projects avec liste
- [ ] Ajouter la page ProjectDetail avec tâches
- [ ] Implémenter le tableau kanban des tâches
- [ ] Ajouter les formulaires de création/édition

## Phase 7 - Module Financier
- [ ] Implémenter les routers tRPC (budgets, factures, comptabilité)
- [ ] Créer la page Finance avec vue d'ensemble
- [ ] Ajouter la gestion des budgets
- [ ] Ajouter la gestion des factures
- [ ] Implémenter les exports comptables

## Phase 8 - Gestion des Documents
- [ ] Implémenter le router tRPC pour les documents
- [ ] Créer la page Documents avec liste
- [ ] Ajouter l'upload de fichiers vers S3
- [ ] Implémenter les filtres et pagination
- [ ] Ajouter les permissions d'accès

## Phase 9 - CRM
- [ ] Implémenter le router tRPC pour les contacts et activités
- [ ] Créer la page CRM Dashboard
- [ ] Ajouter la gestion des contacts
- [ ] Ajouter la gestion des activités
- [ ] Implémenter les rapports

## Phase 10 - Paramètres d'Association
- [ ] Implémenter le router tRPC pour les paramètres
- [ ] Créer la page Settings
- [ ] Ajouter l'upload du logo
- [ ] Implémenter la personnalisation des couleurs
- [ ] Ajouter les paramètres de contact

## Phase 11 - Mode Hors Ligne
- [ ] Créer le Service Worker
- [ ] Implémenter la synchronisation des données
- [ ] Ajouter l'indicateur de statut en ligne/hors ligne
- [ ] Tester la synchronisation lors du retour en ligne

## Phase 12 - Système de Notifications
- [ ] Implémenter le router tRPC pour les notifications
- [ ] Créer le composant NotificationBell
- [ ] Ajouter le centre de notifications
- [ ] Implémenter les préférences de notifications

## Phase 13 - Tests et Optimisations
- [ ] Écrire les tests vitest pour tous les routers
- [ ] Tester la responsivité mobile
- [ ] Valider les états de chargement et erreurs
- [ ] Optimiser les performances
- [ ] Vérifier la sécurité et les permissions

## Phase 14 - Livraison
- [ ] Créer un checkpoint final
- [ ] Préparer la documentation
- [ ] Tester l'application complète

# HomeLink - WireGuard VPN Dashboard TODO

## Phase 1: Backend & Database Schema
- [x] Schéma de base de données complet (networks, devices, connections, audit_logs)
- [x] Modèles Drizzle pour WireGuard et gestion réseau
- [x] Migration SQL pour initialiser les tables
- [x] Helpers de requête DB pour networks, devices, connections

## Phase 2: Backend API - WireGuard & Networking
- [x] Génération de clés WireGuard (public/private)
- [x] Génération de fichiers .conf pour clients
- [x] Gestion des configurations WireGuard (activation/désactivation)
- [x] Support DDNS (stockage hostname, résolution IP, timestamp)
- [x] API tRPC pour networks (create, update, delete, list)
- [x] API tRPC pour devices (create, update, delete, list, get_config)
- [x] API tRPC pour connections (list, filter, get_history)
- [x] API tRPC pour security (audit_log, session_management)

## Phase 3: Frontend - Authentication & Layout
- [x] Intégration Manus OAuth complète
- [x] DashboardLayout avec sidebar responsive
- [x] Navigation principale (Dashboard, Networks, Devices, History, Settings)
- [x] Thème cyberpunk sombre (navy + cyan + green neon)
- [x] Système de couleurs CSS variables pour le thème

## Phase 4: Frontend - Dashboard & Pages
- [x] Page Dashboard : indicateurs de santé réseau, appareils actifs, bande passante, uptime
- [x] Page Network Configuration : ajout/édition IP publique ou DDNS
- [x] Page Device Management : liste des appareils, ajout nouveau device, révocation accès
- [x] Page Connection History : tableau des connexions avec filtrage
- [x] Page Security Settings : gestion des credentials, timeout sessions, audit log
- [x] Composants réutilisables : cartes de statut, indicateurs, graphiques

## Phase 5: Frontend - Features Avancées
- [x] Génération et téléchargement de fichiers .conf
- [x] Statut online/offline en temps réel pour les appareils
- [x] Notifications et toasts pour les actions
- [x] Responsive design mobile
- [x] Composants réutilisables StatusIndicator, MetricCard, ConnectionStatus

## Phase 6: Tests & Déploiement
- [x] Tests vitest pour les procédures tRPC
- [x] Tests d'intégration frontend (composants StatusIndicator, MetricCard, ConnectionStatus)
- [x] Vérification de la sécurité et de l'authentification
- [x] Déploiement et publication du site


## Phase 7: QR Code & Configuration Export
- [x] Installation de la dépendance qrcode.react
- [x] Création du composant QRCodeViewer avec QR code SVG
- [x] Intégration du composant ConfigExport dans DevicesList
- [x] Bouton QR code pour afficher la configuration
- [x] Téléchargement du QR code en PNG
- [x] Copie de la configuration dans le presse-papiers
- [x] Téléchargement du fichier .conf
- [x] Instructions d'installation dans le modal


## Phase 8: Système de Notifications Visuelles
- [x] Table notifications en DB avec types d'événements
- [x] API tRPC pour notifications (getUnread, getAll, getCount, markAsRead, markAllAsRead)
- [x] Composant NotificationBell avec popover et badge de compteur
- [x] Composant NotificationPanel pour afficher toutes les notifications
- [x] Intégration du NotificationBell dans le DashboardLayout (mobile et desktop)
- [x] Hook useNotificationPoller pour le polling des notifications en temps réel
- [x] Toasts automatiques lors de nouvelles notifications
- [x] Gestion des types de notifications (device_connected, device_disconnected, etc.)
- [x] Icônes et couleurs pour chaque type de notification


## Phase 9: Graphiques de Bande Passante en Temps Réel
- [x] Helpers DB pour générer les données de bande passante (timeSeries, byDevice, statistiques)
- [x] API tRPC bandwidth.getStats pour récupérer les statistiques
- [x] Composant BandwidthChart avec graphiques Recharts (Area, Pie)
- [x] Intégration dans le Dashboard avec polling automatique (5 secondes)
- [x] Affichage des statistiques (moyenne, pic, distribution par appareil)
- [x] Responsive design pour les graphiques


## Phase 10: Système de Groupes d'Appareils
- [x] Schéma DB pour deviceGroups et deviceGroupMembers avec relations
- [x] Helpers DB pour créer, lister, mettre à jour et supprimer les groupes
- [x] API tRPC complète pour la gestion des groupes (list, create, update, delete, addDevice, removeDevice, getDevices, getStats)
- [x] Page DeviceGroups avec interface de gestion des groupes
- [x] Intégration dans le sidebar avec lien vers /groups
- [x] Intégration des groupes dans la page DevicesList (assigner appareils aux groupes)
- [x] Affichage des statistiques par groupe sur le Dashboard


## Phase 11: Solution Complète WireGuard sur Raspberry Pi
- [x] Guide d'installation du serveur WireGuard sur Raspberry Pi (WIREGUARD_SETUP_GUIDE.md)
- [x] Guide de configuration de la redirection de port sur Tenda F3 (TENDA_F3_PORT_FORWARDING.md)
- [x] Page Client VPN intégrée dans l'app HomeLink (/vpn-client)
- [x] Générateur de configuration client dans HomeLink
- [x] Téléchargement et copie de configuration .conf
- [x] Simulation de connexion VPN
- [x] Instructions de test et vérification (TESTING_GUIDE.md)
- [x] Dépannage complet et checklist
- [x] Intégration dans le sidebar avec icône Globe


## Phase 12: Outil de Test de Vitesse Réseau
- [x] Table speedTests en DB avec colonnes ping, download, upload, jitter, packetLoss, quality
- [x] Helpers DB pour créer, lister et analyser les tests de vitesse
- [x] API tRPC pour speedtest (create, getHistory, getLatest, getStats)
- [x] Page NetworkSpeedTest avec simulation de test et historique
- [x] Graphiques Recharts pour tendances ping et bande passante
- [x] Intégration au menu sidebar avec lien "/speed-test"
- [x] Indicateurs de qualité (excellent, good, fair, poor)
- [x] Statistiques agrégées (moyenne, max, min)


## Phase 13: Tutoriel d'Onboarding Interactif
- [x] Créer le composant OnboardingModal avec 5 étapes
- [x] Ajouter le système de progression avec barres visuelles
- [x] Implémenter le stockage localStorage pour l'état d'onboarding
- [x] Intégrer la modale au Dashboard pour les nouveaux utilisateurs
- [x] Ajouter les animations fluides entre les étapes
- [x] Créer les boutons d'action pour chaque étape
- [x] Tester et déployer le tutoriel d'onboarding


## Phase 14: Correction du Flux de Logout et Landing Page
- [x] Corriger la redirection après logout (vers landing page au lieu de /notifications)
- [x] Créer une page d'accueil publique avec bouton "Commencer" (login)
- [x] Protéger les routes du dashboard (redirection si pas authentifié)
- [x] Tester le flux complet de login/logout


## Phase 15: Notifications Toast de Connexion/Déconnexion
- [x] Ajouter toast de succès lors de la connexion (avec nom d'utilisateur)
- [x] Ajouter toast de succès lors de la déconnexion (avec message "À bientôt!")
- [x] Ajouter toast d'erreur en cas d'erreur lors de la déconnexion
- [x] Implémenter sessionStorage pour afficher le toast de connexion une seule fois par session
- [x] Ajouter délai avant redirection pour que le toast soit visible
- [x] Tests vitest pour les notifications toast


## Phase 16: Interface Admin Différenciée et Notifications en Temps Réel
- [x] Créer une interface Admin Dashboard avec tableau de bord des utilisateurs
- [x] Ajouter les procédures tRPC admin (getAllUsers, getRecentConnections, getGlobalStats, getGlobalLogs)
- [x] Créer la page AdminDashboard avec onglets (Utilisateurs, Connexions, Logs)
- [x] Ajouter le lien Admin Panel au menu du DashboardLayout
- [x] Implémenter les notifications de connexion/déconnexion pour l'admin
- [x] Ajouter les notifications lors du login/logout OAuth
- [x] Tester les notifications avec 2 comptes (admin et client)
- [x] Implémenter la gestion automatique WireGuard

## Phase 17: Gestion Automatique WireGuard
- [x] Créer la page WireGuardServerConfig pour l'admin
- [x] Générer les configurations serveur WireGuard
- [x] Ajouter les boutons Copier et Télécharger
- [x] Créer le guide complet d'installation
- [x] Créer la page VPNClientConfig pour les utilisateurs
- [x] Générer les configurations client WireGuard
- [x] Ajouter les guides d'installation pour téléphone et ordinateur
- [x] Ajouter les liens aux menus respectifs


## Phase 18: Génération Réelle des Clés WireGuard
- [x] Créer le module de génération de clés (server/wireguard-keys.ts)
- [x] Ajouter le stockage des clés dans la base de données (server/wireguard-db.ts)
- [x] Implémenter les procédures tRPC (server/wireguard-router.ts)
- [x] Mettre à jour WireGuardServerConfig pour utiliser les vraies clés
- [x] Ajouter les tests vitest pour la génération de clés
- [x] Ajouter le wireguardRouter au appRouter


## Phase 19: Indicateur Visuel de Statut WireGuard
- [x] Créer la procédure tRPC getNetworkStatus pour vérifier le statut du serveur
- [x] Ajouter l'indicateur visuel de statut (vert/jaune/rouge) sur WireGuardServerConfig
- [x] Implémenter le polling en temps réel (5 secondes) pour mettre à jour le statut
- [x] Afficher le nombre d'appareils connectés
- [x] Ajouter les icônes animées pour les différents états

## Phase 20: Contrôle du Serveur WireGuard
- [x] Créer les procédures tRPC (toggleServer, restartServer) pour contrôler le serveur
- [x] Ajouter les boutons Activer/Désactiver et Redémarrer
- [x] Implémenter les dialogues de confirmation pour les actions sensibles
- [x] Ajouter les notifications toast pour les résultats
- [x] Gérer les états de chargement des boutons

## Phase 21: Système ACL (Access Control List) - COMPLETÉ
- [x] Créer les tables devicePermissions et groupPermissions dans le schéma
- [x] Générer et appliquer la migration SQL pour les nouvelles tables
- [x] Créer les helpers DB pour gérer les permissions (permissions-db.ts)
- [x] Créer les procédures tRPC pour l'admin ACL (permissions-router.ts)
- [x] Créer la page admin AdminACLManagement pour configurer les ACL
- [x] Intégrer la vérification des permissions au flux WireGuard (getDeviceConfig)
- [x] Ajouter le lien ACL Management au menu admin du sidebar
- [x] Ajouter les tests vitest pour les permissions ACL (permissions.test.ts)

## Phase 22: Correction Critique des Configurations WireGuard
- [x] Corriger la génération de l'IP serveur (10.191.143.1 au lieu de 10.191.143.0.1)
- [x] Refactoriser VPNClientConfig pour créer de vrais devices
- [x] Utiliser le backend pour générer les configurations réelles
- [x] Afficher les appareils créés avec leurs IP VPN
- [x] Tester le flux complet de création/téléchargement

## Phase 23: Monitoring Complet - COMPLETÉ
- [x] Créer les helpers DB pour les logs d'activité et d'alertes de sécurité (monitoring-db.ts)
- [x] Ajouter les procédures tRPC pour récupérer les logs et stats (monitoring-router.ts)
- [x] Créer une page admin pour afficher les logs avec filtrage (AdminMonitoring.tsx)
- [x] Afficher les statistiques d'activité et de sécurité en temps réel
- [x] Implémenter le filtrage par action, sévérité, et date
- [x] Ajouter la fonctionnalité de résolution des événements de sécurité

## Phase 24: Gestion Avancée des Clés
- [ ] Ajouter l'expiration des clés WireGuard (configurable par admin)
- [ ] Implémenter la rotation automatique des clés
- [ ] Créer les procédures tRPC pour gérer l'expiration
- [ ] Ajouter les notifications avant expiration (7 jours, 1 jour)
- [ ] Implémenter la révocation manuelle des clés

## Phase 25: Authentification Sécurisée (MFA)
- [ ] Ajouter TOTP (Time-based One-Time Password) avec speakeasy
- [ ] Créer une page pour configurer MFA (activation/désactivation)
- [ ] Implémenter la vérification TOTP lors du login
- [ ] Ajouter les codes de secours (10 codes)
- [ ] Tester MFA avec Google Authenticator et Authy

## Phase 26: Fonctionnalités Avancées
- [ ] Implémenter les Subnet Routers (étendre le réseau)
- [ ] Implémenter les Exit Nodes (trafic internet via VPN)
- [ ] Ajouter la gestion des routes statiques
- [ ] Implémenter les webhooks pour intégrations externes
- [ ] Ajouter le support des tags pour les appareils

## Phase 27: Tests et Optimisations Finales
- [ ] Tests complets de sécurité (ACL, permissions, MFA)
- [ ] Tests de performance avec 10 utilisateurs
- [ ] Optimisation des requêtes tRPC
- [ ] Vérification des logs et monitoring
- [ ] Documentation complète pour déploiement sur Tenda F3
- [ ] Checkpoint final et préparation pour production

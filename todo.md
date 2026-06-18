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

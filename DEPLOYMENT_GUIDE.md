# Guide de Déploiement HomeLink - Configuration Hybride

Ce guide explique comment déployer HomeLink avec :
- **Frontend** : Vercel
- **Backend** : Render
- **Base de données** : MySQL sur Render

## Prérequis

1. Compte GitHub avec le repository `ainabruno/homelink-app`
2. Compte Vercel (https://vercel.com)
3. Compte Render (https://render.com)

## Étape 1 : Créer la Base de Données MySQL sur Render

### 1.1 Accéder à Render
- Allez sur https://dashboard.render.com
- Connectez-vous avec votre compte

### 1.2 Créer une nouvelle base de données MySQL
1. Cliquez sur **"New +"** → **"MySQL"**
2. Remplissez les informations :
   - **Name** : `homelink-db`
   - **Database Name** : `homelink`
   - **Username** : `homelink`
   - **Region** : Choisissez la région la plus proche
   - **Plan** : Free (gratuit)
3. Cliquez sur **"Create Database"**

### 1.3 Récupérer la chaîne de connexion
- Une fois créée, cliquez sur la base de données
- Copiez la **"External Database URL"** (format : `mysql://user:password@host:port/database`)
- Gardez-la pour l'étape suivante

## Étape 2 : Déployer le Backend sur Render

### 2.1 Créer un nouveau service Web
1. Allez sur https://dashboard.render.com
2. Cliquez sur **"New +"** → **"Web Service"**
3. Connectez votre repository GitHub `ainabruno/homelink-app`
4. Remplissez les informations :
   - **Name** : `homelink-backend`
   - **Environment** : `Node`
   - **Build Command** : `npm run build`
   - **Start Command** : `npm start`
   - **Plan** : Free

### 2.2 Configurer les variables d'environnement
Cliquez sur **"Environment"** et ajoutez les variables suivantes :

```
DATABASE_URL=<votre-url-mysql-de-l-etape-1.3>
NODE_ENV=production
PORT=3000

# Manus OAuth (garder les valeurs par défaut)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# À compléter avec vos valeurs Manus
VITE_APP_ID=<votre-app-id-manus>
OWNER_NAME=<votre-nom>
OWNER_OPEN_ID=<votre-open-id>
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=<votre-clé-api>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=<votre-clé-api-frontend>
JWT_SECRET=<générer-une-clé-secrète>

# À compléter après déploiement du frontend
VITE_FRONTEND_URL=https://<votre-domaine-vercel>.vercel.app
```

### 2.3 Déployer
- Cliquez sur **"Create Web Service"**
- Attendez le déploiement (5-10 minutes)
- Récupérez l'URL du service (ex: `https://homelink-backend.onrender.com`)

## Étape 3 : Configurer le Frontend pour Vercel

### 3.1 Préparer le repository
1. Clonez le repository localement (si ce n'est pas déjà fait)
2. Créez un fichier `vercel.json` à la racine du projet :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "env": {
    "VITE_FRONTEND_URL": "@vite_frontend_url"
  }
}
```

3. Poussez les modifications vers GitHub :
```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

### 3.2 Déployer sur Vercel
1. Allez sur https://vercel.com/new
2. Importez votre repository GitHub `ainabruno/homelink-app`
3. Configurez le projet :
   - **Framework Preset** : Vite
   - **Root Directory** : `./`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist/public`
   - **Install Command** : `npm install`

### 3.3 Ajouter les variables d'environnement Vercel
Dans les paramètres du projet Vercel, allez à **"Settings"** → **"Environment Variables"** et ajoutez :

```
VITE_FRONTEND_URL=https://<votre-domaine-vercel>.vercel.app
VITE_API_URL=https://homelink-backend.onrender.com
```

4. Cliquez sur **"Deploy"**

## Étape 4 : Mettre à jour le Backend avec l'URL du Frontend

1. Retournez sur Render
2. Allez sur votre service `homelink-backend`
3. Cliquez sur **"Environment"**
4. Modifiez la variable `VITE_FRONTEND_URL` avec votre URL Vercel
5. Cliquez sur **"Save Changes"** (le service redémarrera automatiquement)

## Étape 5 : Tester le Déploiement

1. Accédez à votre URL Vercel : `https://<votre-domaine>.vercel.app`
2. Testez les fonctionnalités :
   - ✅ Connexion OAuth
   - ✅ Création de réseaux
   - ✅ Gestion des appareils
   - ✅ Déconnexion

## Dépannage

### Erreur : "Cannot connect to database"
- Vérifiez que la `DATABASE_URL` est correcte sur Render
- Assurez-vous que la base de données est en état "Available"

### Erreur : "CORS error"
- Vérifiez que `VITE_FRONTEND_URL` est correctement défini sur le backend
- Vérifiez que l'URL du backend est accessible depuis le frontend

### Erreur : "OAuth redirect failed"
- Mettez à jour `VITE_FRONTEND_URL` sur le backend avec votre URL Vercel
- Attendez 5 minutes pour que les changements prennent effet

## Variables d'Environnement Requises

### Backend (Render)
- `DATABASE_URL` : URL de connexion MySQL
- `NODE_ENV` : `production`
- `JWT_SECRET` : Clé secrète pour les sessions
- `VITE_APP_ID` : ID de l'application Manus
- `OAUTH_SERVER_URL` : `https://api.manus.im`
- `VITE_OAUTH_PORTAL_URL` : `https://oauth.manus.im`
- `OWNER_NAME` : Votre nom
- `OWNER_OPEN_ID` : Votre Open ID Manus
- `BUILT_IN_FORGE_API_URL` : `https://api.manus.im`
- `BUILT_IN_FORGE_API_KEY` : Votre clé API Manus
- `VITE_FRONTEND_FORGE_API_URL` : `https://api.manus.im`
- `VITE_FRONTEND_FORGE_API_KEY` : Votre clé API frontend
- `VITE_FRONTEND_URL` : URL de votre frontend Vercel

### Frontend (Vercel)
- `VITE_FRONTEND_URL` : URL de votre frontend Vercel
- `VITE_API_URL` : URL de votre backend Render

## Coûts Estimés

- **Vercel** : Gratuit (plan Hobby)
- **Render** : Gratuit (plan Free avec limitations)
  - Redémarrage après 15 min d'inactivité
  - 0.5 GB de RAM
  - 1 GB de stockage SSD

**Total** : Gratuit (avec limitations)

## Prochaines Étapes

1. Configurez un domaine personnalisé (optionnel)
2. Configurez les sauvegardes de base de données
3. Configurez les logs et monitoring
4. Configurez les webhooks Orange Money (si utilisé)

## Support

Pour plus d'informations :
- Render : https://render.com/docs
- Vercel : https://vercel.com/docs
- HomeLink : Consultez le README.md du projet

# 🔧 Guide: Configuration Tenda F3 pour WireGuard

## 📍 Accéder à l'interface du Tenda F3

### Étape 1: Ouvrir l'interface d'administration

1. **Ouvrez votre navigateur** (Chrome, Firefox, Safari, Edge)
2. **Allez à l'une de ces adresses:**
   - `http://192.168.0.1`
   - `http://tendawifi.com`
   - `http://tendaiwifi.com`

3. **Vous verrez la page de connexion Tenda**

### Étape 2: Se connecter

- **Identifiant par défaut:** `admin`
- **Mot de passe par défaut:** `admin`

> **Note:** Si vous avez changé le mot de passe, utilisez vos identifiants personnalisés.

---

## 🔌 Configurer la redirection de port

### Étape 3: Accéder aux paramètres de redirection de port

**Chemin dans le menu:**
```
Advanced Settings → NAT → Port Forwarding
```

Ou:
```
Advanced Settings → Port Forwarding
```

> **Si vous ne trouvez pas:** Cherchez "Port Mapping" ou "Virtual Server"

### Étape 4: Créer une nouvelle règle

Cliquez sur **"Add New"** ou **"+"** pour ajouter une nouvelle règle.

Remplissez les champs suivants:

| Champ | Valeur | Explication |
|-------|--------|-------------|
| **Service Name** | WireGuard VPN | Nom de la règle (pour vous) |
| **External Port** | 51820 | Port public (celui de l'Internet) |
| **Internal Port** | 51820 | Port interne (Raspberry Pi) |
| **Internal IP** | 192.168.0.100* | IP du Raspberry Pi sur le réseau local |
| **Protocol** | UDP | Important! WireGuard utilise UDP |
| **Enable** | ✓ Oui | Activer la règle |

> **\* Trouver l'IP du Raspberry Pi:**
> ```bash
> # Sur le Raspberry Pi
> hostname -I
> # Affiche: 192.168.0.100 (exemple)
> ```

### Étape 5: Sauvegarder

1. Cliquez sur **"Save"** ou **"Apply"**
2. **Attendez 10-15 secondes** pour que les changements s'appliquent
3. Vous verrez un message de confirmation

---

## ✅ Vérifier la configuration

### Test 1: Vérifier depuis le routeur

1. Retournez à la page d'accueil du Tenda F3
2. Allez à **Status** ou **Dashboard**
3. Vous devriez voir votre Raspberry Pi dans la liste des appareils connectés

### Test 2: Vérifier le port depuis votre ordinateur

**Depuis le réseau local (WiFi):**
```bash
# Remplacez 192.168.0.1 par l'IP de votre routeur
nc -zv 192.168.0.1 51820

# Résultat attendu: "succeeded" ou "Connection successful"
```

**Depuis Internet (4G/WiFi public):**
```bash
# Remplacez YOUR_PUBLIC_IP par votre IP publique
curl -v udp://YOUR_PUBLIC_IP:51820

# Ou utilisez un outil en ligne:
# https://www.canyouseeme.org/
# Entrez le port: 51820
```

### Test 3: Vérifier le port sur le Raspberry Pi

```bash
# Sur le Raspberry Pi
sudo ss -ulnp | grep 51820

# Résultat attendu:
# UNCONN  0  0  0.0.0.0:51820  0.0.0.0:*  users:(("wg-crypt-wg0",pid=1234,fd=5))
```

---

## 🌐 Trouver votre IP publique

Vous avez besoin de votre IP publique pour vous connecter de l'extérieur.

### Depuis le Tenda F3

1. Allez à **Status** ou **Dashboard**
2. Cherchez **"WAN IP"** ou **"Public IP"**
3. Notez cette adresse (ex: `203.0.113.45`)

### Depuis votre ordinateur

```bash
# Linux/Mac
curl ifconfig.me

# Windows (PowerShell)
(Invoke-WebRequest -Uri "https://ifconfig.me").Content
```

---

## 🔐 Sécurité supplémentaire (optionnel)

### Changer le port WireGuard

Si vous voulez utiliser un port différent de 51820:

1. **Sur le Tenda F3:** Changez le port externe à un autre (ex: 12345)
2. **Sur le Raspberry Pi:** Modifiez `/etc/wireguard/wg0.conf`
   ```ini
   ListenPort = 12345
   ```
3. **Redémarrez WireGuard:**
   ```bash
   sudo systemctl restart wg-quick@wg0
   ```

### Activer le pare-feu du Tenda F3

1. Allez à **Security → Firewall**
2. Activez le **"SPI Firewall"**
3. Activez le **"DoS Protection"**

---

## 🆘 Dépannage

### Problème: "Port Forwarding not working"

**Solution 1:** Vérifiez l'IP du Raspberry Pi
```bash
# Sur le Raspberry Pi
hostname -I

# Vérifiez que cette IP correspond à celle dans le Tenda F3
```

**Solution 2:** Redémarrez le routeur
```bash
# Dans l'interface Tenda F3
System Tools → Reboot
```

**Solution 3:** Vérifiez le pare-feu du Raspberry Pi
```bash
# Vérifiez que le port écoute
sudo ufw status
sudo ufw allow 51820/udp
```

### Problème: "Connection refused"

- Vérifiez que WireGuard est en cours d'exécution sur le Raspberry Pi
  ```bash
  sudo systemctl status wg-quick@wg0
  ```
- Vérifiez que le port 51820 écoute
  ```bash
  sudo ss -ulnp | grep 51820
  ```

### Problème: "Timeout"

- Vérifiez votre IP publique
- Vérifiez que le port est correctement redirigé
- Attendez 5 minutes après la configuration (le temps de propagation)

---

## 📋 Checklist

- [ ] Connecté à l'interface Tenda F3 (192.168.0.1)
- [ ] Trouvé le menu "Port Forwarding"
- [ ] Créé une règle pour le port 51820 UDP
- [ ] IP du Raspberry Pi correcte (192.168.0.100 ou autre)
- [ ] Règle sauvegardée et appliquée
- [ ] Port 51820 accessible de l'extérieur
- [ ] IP publique notée (ex: 203.0.113.45)

---

**Vous êtes prêt!** 🎉 Votre Tenda F3 est maintenant configuré pour rediriger le trafic WireGuard vers votre Raspberry Pi.

**Prochaine étape:** Configurez vos clients WireGuard pour vous connecter à votre IP publique + port 51820.

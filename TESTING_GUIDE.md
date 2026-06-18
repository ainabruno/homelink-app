# 🧪 Guide Complet: Test et Vérification de la Solution WireGuard

## 📋 Avant de commencer

Assurez-vous d'avoir:
- ✅ Installé WireGuard sur le Raspberry Pi
- ✅ Configuré la redirection de port sur Tenda F3
- ✅ Généré les clés du serveur et des clients
- ✅ Accès à l'application HomeLink

---

## **Phase 1: Vérification du Serveur WireGuard**

### 1.1 Vérifier que WireGuard est en cours d'exécution

```bash
# Sur le Raspberry Pi
sudo systemctl status wg-quick@wg0

# Résultat attendu:
# ● wg-quick@wg0.service - WireGuard via wg-quick(8) for wg0
#    Loaded: loaded (/lib/systemd/system-generators/wg-quick-generator.service; static)
#    Active: active (exited) since ...
```

### 1.2 Vérifier que le port 51820 écoute

```bash
# Sur le Raspberry Pi
sudo ss -ulnp | grep 51820

# Résultat attendu:
# UNCONN  0  0  0.0.0.0:51820  0.0.0.0:*  users:(("wg-crypt-wg0",pid=1234,fd=5))
```

### 1.3 Vérifier les clients connectés

```bash
# Sur le Raspberry Pi
sudo wg show

# Résultat attendu:
# interface: wg0
#   public key: SERVER_PUBLIC_KEY
#   private key: (hidden)
#   listening port: 51820
#
# peer: CLIENT_PUBLIC_KEY
#   endpoint: 192.168.0.50:12345
#   allowed ips: 10.0.0.2/32
#   latest handshake: 5 seconds ago
#   transfer: 1.23 MiB received, 4.56 MiB sent
```

---

## **Phase 2: Vérification de la Redirection de Port**

### 2.1 Vérifier depuis le réseau local

```bash
# Sur votre ordinateur (connecté au WiFi Tenda F3)
nc -zv 192.168.0.1 51820

# Résultat attendu:
# Connection to 192.168.0.1 51820 port [udp/*] succeeded!
```

### 2.2 Vérifier depuis Internet (4G/WiFi public)

```bash
# Depuis un autre réseau
curl -v udp://YOUR_PUBLIC_IP:51820

# Ou utilisez un outil en ligne:
# https://www.canyouseeme.org/
# Entrez le port: 51820
```

### 2.3 Vérifier votre IP publique

```bash
# Sur le Tenda F3
# Allez à Status → WAN IP

# Ou depuis votre ordinateur
curl ifconfig.me
# Résultat: 203.0.113.45 (exemple)
```

---

## **Phase 3: Test de Connexion Client**

### 3.1 Générer une configuration client

**Utilisez l'application HomeLink:**
1. Allez à **Client VPN** dans le menu
2. Entrez votre IP publique (ex: 203.0.113.45)
3. Entrez votre clé privée client
4. Cliquez sur **"Générer Configuration"**
5. Téléchargez le fichier .conf

### 3.2 Installer WireGuard sur votre ordinateur

**Windows/Mac/Linux:**
1. Téléchargez depuis https://www.wireguard.com/install/
2. Installez l'application
3. Importez le fichier .conf téléchargé
4. Cliquez sur **"Activer"**

**iOS/Android:**
1. Téléchargez l'app WireGuard depuis l'App Store/Google Play
2. Créez une configuration ou scannez un QR code
3. Activez la connexion

### 3.3 Vérifier la connexion

```bash
# Votre IP devrait changer
curl ifconfig.me

# Vous devriez voir une IP différente (celle du serveur VPN)
```

### 3.4 Vérifier la connectivité VPN

```bash
# Pingez le serveur VPN
ping 10.0.0.1

# Résultat attendu:
# PING 10.0.0.1 (10.0.0.1): 56 data bytes
# 64 bytes from 10.0.0.1: icmp_seq=0 ttl=64 time=25.123 ms
```

---

## **Phase 4: Test de Bande Passante**

### 4.1 Tester la vitesse via VPN

**Depuis votre ordinateur connecté au VPN:**

```bash
# Téléchargez un fichier de test
curl -O https://speed.cloudflare.com/__down?bytes=10000000

# Ou utilisez speedtest
pip install speedtest-cli
speedtest
```

### 4.2 Comparer avec/sans VPN

| Métrique | Sans VPN | Avec VPN | Notes |
|----------|----------|----------|-------|
| Ping | ~10ms | ~25-50ms | Normal (latence réseau) |
| Download | 100 Mbps | 50-80 Mbps | Dépend de votre routeur |
| Upload | 50 Mbps | 30-50 Mbps | Dépend de votre routeur |

---

## **Phase 5: Test d'Accès à Internet**

### 5.1 Vérifier que vous accédez via votre routeur

```bash
# Votre IP publique devrait être celle de votre routeur
curl ifconfig.me

# Vérifiez que c'est bien votre IP publique
# (celle affichée dans le Tenda F3)
```

### 5.2 Tester l'accès à des services locaux

```bash
# Si vous avez un serveur local (ex: Plex, Nextcloud)
curl http://192.168.0.100:8080

# Vous devriez pouvoir y accéder via VPN
```

### 5.3 Vérifier la géolocalisation

```bash
# Votre localisation devrait être celle de votre routeur
curl https://ipinfo.io

# Résultat attendu:
# {
#   "ip": "203.0.113.45",
#   "city": "Paris",
#   "country": "FR",
#   ...
# }
```

---

## **Phase 6: Test de Stabilité**

### 6.1 Connexion longue durée

1. Connectez-vous au VPN
2. Laissez la connexion active pendant 1 heure
3. Vérifiez que vous êtes toujours connecté
4. Testez la bande passante à nouveau

### 6.2 Reconnexion automatique

1. Arrêtez WireGuard sur le Raspberry Pi
   ```bash
   sudo systemctl stop wg-quick@wg0
   ```
2. Attendez 30 secondes
3. Redémarrez WireGuard
   ```bash
   sudo systemctl start wg-quick@wg0
   ```
4. Vérifiez que le client se reconnecte automatiquement

### 6.3 Changement de réseau

1. Connectez-vous au VPN sur WiFi
2. Passez à la 4G (ou inversement)
3. La connexion devrait se rétablir automatiquement

---

## **Phase 7: Dépannage**

### Problème: "Connection refused"

```bash
# Vérifiez que le serveur écoute
sudo ss -ulnp | grep 51820

# Vérifiez le pare-feu
sudo ufw status
sudo ufw allow 51820/udp

# Redémarrez WireGuard
sudo systemctl restart wg-quick@wg0
```

### Problème: "Timeout"

```bash
# Vérifiez la redirection de port sur Tenda F3
# Attendez 5 minutes après la configuration

# Testez depuis le réseau local d'abord
nc -zv 192.168.0.1 51820

# Puis depuis Internet
curl -v udp://YOUR_PUBLIC_IP:51820
```

### Problème: "No Internet via VPN"

```bash
# Vérifiez le forwarding IP sur le Raspberry Pi
cat /proc/sys/net/ipv4/ip_forward
# Doit afficher: 1

# Vérifiez les règles iptables
sudo iptables -L -n -v

# Vérifiez les logs
sudo journalctl -u wg-quick@wg0 -n 50
```

### Problème: "Lent via VPN"

```bash
# Vérifiez la charge du Raspberry Pi
top

# Vérifiez la bande passante utilisée
sudo iftop -i wg0

# Vérifiez la latence
ping 10.0.0.1
```

---

## **Phase 8: Monitoring depuis HomeLink**

### 8.1 Accéder au Dashboard

1. Ouvrez l'application HomeLink
2. Allez à **Dashboard**
3. Vous devriez voir:
   - État du réseau
   - Appareils connectés
   - Bande passante utilisée
   - Graphiques en temps réel

### 8.2 Vérifier les notifications

1. Allez à **Notifications**
2. Vous devriez voir les événements:
   - Appareil connecté
   - Appareil déconnecté
   - Erreurs réseau

### 8.3 Consulter l'historique des connexions

1. Allez à **Historique des Connexions**
2. Vous devriez voir:
   - Tous les appareils connectés
   - Durée de la session
   - Données transférées

---

## ✅ Checklist finale

- [ ] WireGuard en cours d'exécution sur Raspberry Pi
- [ ] Port 51820 accessible depuis Internet
- [ ] Redirection de port configurée sur Tenda F3
- [ ] Configuration client générée via HomeLink
- [ ] Client VPN connecté avec succès
- [ ] IP publique correcte (celle du routeur)
- [ ] Internet fonctionne via VPN
- [ ] Bande passante acceptable (>50% de votre vitesse normale)
- [ ] Connexion stable pendant 1 heure
- [ ] Reconnexion automatique après interruption
- [ ] Notifications affichées dans HomeLink
- [ ] Dashboard affiche les données correctes

---

## 🎉 Vous avez réussi!

Votre solution WireGuard est maintenant **complètement fonctionnelle**. Vous pouvez:

✅ Accéder à votre WiFi de n'importe où
✅ Utiliser votre connexion Internet personnelle
✅ Gérer vos appareils via HomeLink
✅ Monitorer votre réseau en temps réel

---

## 📞 Support

Si vous rencontrez des problèmes:

1. **Consultez les logs:**
   ```bash
   sudo journalctl -u wg-quick@wg0 -f
   ```

2. **Vérifiez la configuration:**
   ```bash
   sudo cat /etc/wireguard/wg0.conf
   ```

3. **Testez la connectivité:**
   ```bash
   ping 10.0.0.1
   curl ifconfig.me
   ```

4. **Redémarrez les services:**
   ```bash
   sudo systemctl restart wg-quick@wg0
   ```

Bonne chance! 🚀

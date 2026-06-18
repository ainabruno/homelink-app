# 🚀 Guide Complet: Installation WireGuard sur Raspberry Pi

## 📋 Prérequis

- **Raspberry Pi 3B+, 4, ou 5** (avec Raspberry Pi OS installé)
- **Accès SSH** au Raspberry Pi
- **Routeur Tenda F3** accessible
- **Connexion Internet stable**

---

## **Phase 1: Préparation du Raspberry Pi**

### 1.1 Mettre à jour le système

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git nano
```

### 1.2 Vérifier la version de Raspberry Pi OS

```bash
cat /etc/os-release
```

---

## **Phase 2: Installation de WireGuard**

### 2.1 Installer WireGuard et les outils

```bash
sudo apt install -y wireguard wireguard-tools wireguard-dkms
sudo apt install -y linux-headers-$(uname -r)
```

### 2.2 Générer les clés du serveur

```bash
cd /etc/wireguard
sudo umask 077
sudo wg genkey | sudo tee privatekey | wg pubkey | sudo tee publickey

# Afficher les clés (vous en aurez besoin)
sudo cat privatekey
sudo cat publickey
```

### 2.3 Créer la configuration du serveur WireGuard

```bash
sudo nano /etc/wireguard/wg0.conf
```

**Collez le contenu suivant** (remplacez `PRIVATE_KEY` par votre clé privée):

```ini
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = PRIVATE_KEY
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -A FORWARD -o wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -D FORWARD -o wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Client 1 (exemple)
[Peer]
PublicKey = CLIENT_PUBLIC_KEY_1
AllowedIPs = 10.0.0.2/32
```

### 2.4 Activer le forwarding IP

```bash
sudo nano /etc/sysctl.conf
```

Décommentez ou ajoutez:
```
net.ipv4.ip_forward=1
```

Appliquez les changements:
```bash
sudo sysctl -p
```

### 2.5 Démarrer WireGuard

```bash
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

# Vérifier le statut
sudo wg show
```

---

## **Phase 3: Configuration du Tenda F3**

### 3.1 Accéder à l'interface du Tenda F3

1. Ouvrez votre navigateur
2. Allez à `http://192.168.0.1` (ou `http://tendawifi.com`)
3. Connectez-vous (par défaut: admin/admin)

### 3.2 Configurer la redirection de port

1. Allez à **Advanced → Port Forwarding** (ou **NAT**)
2. Créez une nouvelle règle:
   - **External Port**: 51820
   - **Internal Port**: 51820
   - **Internal IP**: IP du Raspberry Pi (ex: 192.168.0.100)
   - **Protocol**: UDP
   - **Enable**: Oui

3. Cliquez sur **Save/Apply**

### 3.3 Vérifier votre IP publique

```bash
curl ifconfig.me
```

Notez cette IP - c'est celle que vous utiliserez pour vous connecter de l'extérieur.

---

## **Phase 4: Ajouter des clients WireGuard**

### 4.1 Générer les clés d'un client

```bash
# Sur votre ordinateur (pas le Raspberry Pi)
wg genkey | tee client_privatekey | wg pubkey > client_publickey

cat client_privatekey
cat client_publickey
```

### 4.2 Ajouter le client au serveur

```bash
# Sur le Raspberry Pi
sudo nano /etc/wireguard/wg0.conf
```

Ajoutez à la fin:
```ini
[Peer]
PublicKey = CLIENT_PUBLIC_KEY
AllowedIPs = 10.0.0.2/32
```

Redémarrez WireGuard:
```bash
sudo systemctl restart wg-quick@wg0
```

### 4.3 Créer le fichier de configuration du client

Créez un fichier `client.conf` sur votre ordinateur:

```ini
[Interface]
PrivateKey = CLIENT_PRIVATE_KEY
Address = 10.0.0.2/24
DNS = 8.8.8.8

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = YOUR_PUBLIC_IP:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

---

## **Phase 5: Tester la connexion**

### 5.1 Sur un client (Windows/Mac/Linux)

1. **Téléchargez WireGuard**: https://www.wireguard.com/install/
2. **Installez l'application**
3. **Importez le fichier `client.conf`**
4. **Activez la connexion**

### 5.2 Vérifier la connexion

```bash
# Votre IP devrait être différente
curl ifconfig.me

# Vérifier la connexion VPN
ping 10.0.0.1
```

### 5.3 Vérifier depuis le serveur

```bash
# Sur le Raspberry Pi
sudo wg show

# Vous devriez voir le client connecté avec une IP 10.0.0.x
```

---

## **Phase 6: Configuration avancée**

### 6.1 Logs WireGuard

```bash
sudo journalctl -u wg-quick@wg0 -f
```

### 6.2 Redémarrer WireGuard

```bash
sudo systemctl restart wg-quick@wg0
```

### 6.3 Arrêter WireGuard

```bash
sudo systemctl stop wg-quick@wg0
```

---

## **Dépannage**

### Problème: "Cannot find device wg0"

```bash
sudo modprobe wireguard
sudo systemctl restart wg-quick@wg0
```

### Problème: Pas de connexion Internet via VPN

Vérifiez le forwarding IP:
```bash
cat /proc/sys/net/ipv4/ip_forward
# Doit afficher: 1
```

### Problème: Port 51820 non accessible

```bash
# Vérifier si le port écoute
sudo ss -ulnp | grep 51820

# Vérifier le pare-feu
sudo ufw status
sudo ufw allow 51820/udp
```

---

## 📊 Commandes utiles

```bash
# Voir tous les clients connectés
sudo wg show

# Voir les statistiques
sudo wg show all dump

# Voir les logs
sudo journalctl -u wg-quick@wg0 -n 50

# Ajouter un client dynamiquement
sudo wg set wg0 peer <PUBLIC_KEY> allowed-ips 10.0.0.3/32

# Supprimer un client
sudo wg set wg0 peer <PUBLIC_KEY> remove
```

---

## ✅ Checklist finale

- [ ] WireGuard installé sur Raspberry Pi
- [ ] Interface wg0 active et écoute sur le port 51820
- [ ] Forwarding IP activé
- [ ] Redirection de port configurée sur Tenda F3
- [ ] Au moins 1 client ajouté
- [ ] Connexion VPN testée depuis l'extérieur
- [ ] Internet fonctionne via le VPN

---

**Vous êtes prêt!** 🎉 Votre Raspberry Pi est maintenant un serveur VPN WireGuard fonctionnel.

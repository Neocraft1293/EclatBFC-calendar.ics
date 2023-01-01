Utilisation

    Assurez-vous d'avoir installé les dépendances nécessaires en exécutant npm install.
    Démarrez le serveur en exécutant node index.js.
    Ouvrez votre navigateur et accédez à http://localhost/login pour accéder à la page de connexion.
    Saisissez votre nom d'utilisateur et votre mot de passe, puis cliquez sur "Se connecter". Si la connexion réussit, vous recevrez un message avec un lien vers votre calendrier ICS.
    Cliquez sur ce lien ou copiez-le dans votre navigateur pour accéder à votre calendrier au format ICS. Vous pouvez ajouter ce calendrier à un client de calendrier compatible, comme Google Calendar ou Microsoft Outlook.

Configuration

Le serveur écoute par défaut sur le port 80. Si vous souhaitez utiliser un port différent, modifiez la ligne suivante dans le fichier index.js:

app.listen(80, () => {
  console.log("Server listening on port 80");
});

Par exemple, pour écouter sur le port 8080, utilisez:

app.listen(8080, () => {
  console.log("Server listening on port 8080");
});

L'adresse IP du serveur est définie par la variable ip dans le fichier index.js. Si vous souhaitez utiliser une adresse IP différente, modifiez cette variable.
Dépendances

Ce serveur utilise les modules suivants:

    Express.js - framework de serveur pour Node.js
    moment.js - bibliothèque de traitement de dates et d'heures
    body-parser - middleware de gestion de corps de formulaire pour Express.js
    node-fetch@2.6.1 - A light-weight module that brings window.fetch to Node.js

Assurez-vous d'avoir installé ces dépendances avant de démarrer le serveur.
const express = require("express");
const moment = require("moment");
const bodyParser = require("body-parser");
const { eclatClient } = require("./api.js");
const ip = "neocraft1293.fr" 
const app = express();

const optionsValides = require('./options.json').optionsValides;
// Configure le middleware de gestion de corps de formulaire
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/login", (req, res) => {
  res.send(`
    <form method="post" action="/login">
      <label for="username">Nom d'utilisateur:</label><br>
      <input type="text" id="username" name="username"><br>
      <label for="password">Mot de passe:</label><br>
      <input type="password" id="password" name="password"><br><br>
      <input type="submit" value="Se connecter">
    </form> 
  `);
});

app.post("/login", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Check if username and password are provided
  if (!username || !password) {
    return res.send("Veuillez fournir un nom d'utilisateur et un mot de passe.");
  }

  const eclat = new eclatClient();
  const loginSuccess = await eclat.loginByCredentials(username, password);

  if (loginSuccess) {
    const token = eclat.getToken();
    res.send(`
      <p>Votre token est ${token}.</p>
      <form method="post" action="/generate-calendar">
        <p>Veuillez sélectionner les options que vous souhaitez utiliser pour générer votre agenda :</p>
        ${optionsValides.map(opt =>`
          <input type="checkbox" id="${opt.value}" name="options" value="${opt.value}">
          <label for="${opt.value}">${opt.description}</label><br>
        `).join('')}
        <input type="hidden" name="token" value="${token}">
        <input type="submit" value="Générer l'agenda">
      </form>
    `);
  } else {
    res.send("Nom d'utilisateur ou mot de passe incorrect.");
    }
  });

  

app.get("/calendar.ics", async (req, res) => {
  const token = req.query.token; // Récupère le token depuis l'URL
  const options = req.query.options; // Récupère les options depuis l'URL
  //console.log(options)
  const eclat = new eclatClient();
  const login = await eclat.loginByToken(token); // Connexion avec le token

  if (!login) return res.send("Impossible de se connecter à Eclat.");

  const calendar = await eclat.getCalendar();

  const userInfo = await eclat.getInfo();
  const lastName = userInfo.nom;
  console.log(`${lastName} a généré son agenda.`);
  


  // Vérifie que calendar est défini et que calendar.listeJourCdt est un tableau
  if (!calendar || !Array.isArray(calendar.listeJourCdt)) {
    return res.send("Erreur lors de la récupération du calendrier.");
  }

  let icsCalendar = "BEGIN:VCALENDAR\n";
  icsCalendar += "PRODID:-//hacksw/handcal//NONSGML v1.0//EN\n";
  icsCalendar += "VERSION:2.0\n";
  icsCalendar += "CALSCALE:GREGORIAN\n";

  for (let i = 0; i < calendar.listeJourCdt.length; i++) {
    let day = calendar.listeJourCdt[i];

    for (let seance of day.listeSeances) {
      if (seance.flagActif) {
        icsCalendar += "BEGIN:VEVENT\n";
        icsCalendar += `DTSTART:${moment.utc(seance.hdeb).format("YYYYMMDDTHHmmss")}Z\n`;
        icsCalendar += `DTEND:${moment.utc(seance.hfin).format("YYYYMMDDTHHmmss")}Z\n`;
            // Check if aRendre array exists and is not empty
          if (seance.aRendre && seance.aRendre.length > 0) { 

        if (options && options.includes("addSymbol")) {
          icsCalendar += `SUMMARY:${seance.matiere} 💼\n`;
        } else {
        icsCalendar += `SUMMARY:${seance.matiere}\n`;
        }
        } else {
          icsCalendar += `SUMMARY:${seance.matiere}\n`; 
        }
        //icsCalendar += `SUMMARY:${seance.matiere}\n`;
    
        // Check if aRendre array exists and is not empty
        let descriptiontxt = "";

        if (options && options.includes("addWork")) {
          if (seance.aRendre && seance.aRendre.length > 0) {
            descriptiontxt += `travaile a faire:${seance.aRendre[0]['titre']}\\n`;
          } else {
            descriptiontxt += `Vous n'avez pas de travail à faire pour ce cours.\\n`;
          }
        }
        if (options && options.includes("name")) {
          const userInfo = await eclat.getInfo();
          const lastName = userInfo.nom;
          descriptiontxt += `importer depuis le compte de :${lastName}\\n`;
        }
        if (options && options.includes("date")) {
          const currentDate = new Date();
          const dateString = currentDate.toLocaleString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
          });
          descriptiontxt += `Agenda généré le ${dateString}.\\n`;
        }
        
        icsCalendar += `DESCRIPTION:${descriptiontxt}\n`;
        //console.log(descriptiontxt)




        if (options && options.includes("removeAfter")) {
          // Si l'option "removeAfter" est présente, supprime tout ce qui se trouve après le "-"
          icsCalendar += `LOCATION:${seance.salle.split("-")[0]}\n`; // Supprime tout ce qui se trouve après le "-"
        } else {
          icsCalendar += `LOCATION:${seance.salle}\n`; 
        }
        icsCalendar += "END:VEVENT\n";
      }
    }     
  }

  icsCalendar += "END:VCALENDAR\n";

  res.set("Content-Type", "text/calendar");
  res.send(icsCalendar);
});

app.get("/", (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Mon script Eclat</h1>
        <p>Ce script utilise l'API Eclat pour fournir un calendrier ics à l'utilisateur.</p>
        <p>Pour se connecter et obtenir votre calendrier et votre token, <a href="/login">cliquez ici</a>.</p>
        <p>Pour accéder à la documentation du script, <a href="/docs">cliquez ici</a>.</p>
        <p>Pour accéder au dépôt GitHub de ce script, <a href="https://github.com/Neocraft1293/EclatBFC-calendar.ics">cliquez ici</a>.</p>
      </body>
    </html>
  `);
});


app.post("/generate-calendar", (req, res) => {
  // Get the token and options from the request body
  const token = req.body.token;
  const options = req.body.options;

  let queryString = `token=${token}`;
  if (options) {
    queryString += `&options=${options}`;
  }

  // Create the calendar URL
  const calendarUrl = `http://${ip}/calendar.ics?${queryString}`;

  // Render the response page with the calendar URL and token
  res.send(`
    <p>Voici votre lien d'agenda : <a id="calendar-url" href="${calendarUrl}">${calendarUrl}</a></p>
    <button id="copy-button" data-calendar-url="${calendarUrl}">Copier le lien</button>
    <script>
      const copyButton = document.getElementById("copy-button");
      const calendarUrl = copyButton.getAttribute("data-calendar-url");
      copyButton.addEventListener("click", () => {
        navigator.clipboard.writeText(calendarUrl);
      });
    </script>
  `);
});


app.get("/docs", (req, res) => {
  res.set("Content-Type", "text/html");
  res.sendFile(__dirname + "/docs.html");
});

app.get("/test-token", (req, res) => {
  res.send(`
    <form method="post" action="/test-token">
      <label for="token">Token:</label><br>
      <input type="text" id="token" name="token"><br><br>
      <input type="submit" value="Envoyer">
    </form> 
  `);
});


app.post("/test-token", async (req, res) => {
  const token = req.body.token;
  
  // Check if token is provided
  if (!token) {
    return res.send("Veuillez fournir un token.");
  }
  
  const eclat = new eclatClient();
  const loginSuccess = await eclat.loginByToken(token);
  if (loginSuccess) {
    const userInfo = await eclat.getInfo();
    const name = userInfo.nom;
    let response = `<p>Bonjour ${name}! Votre token est valide.</p>`;
    response += `
    <form method="post" action="/generate-calendar">
      <p>Veuillez sélectionner les options que vous souhaitez utiliser pour générer votre agenda :</p>
    `;
    optionsValides.map(opt => response += `
      <input type="checkbox" id="${opt.value}" name="options" value="${opt.value}">
      <label for="${opt.value}">${opt.description}</label><br>
    `);
    response += `<input type="hidden" name="token" value="${token}"> <input type="submit" value="Générer l'agenda"> </form>`;
    res.send(response);
  } else {
    res.send("Token invalide. Veuillez vous connecter à nouveau pour obtenir un nouveau token." + `<a href="/login">Se connecter</a>`);
  }
});




app.listen(process.env.PORT || 80, () => console.log("Le serveur écoute sur le port " + (process.env.PORT || 80)));



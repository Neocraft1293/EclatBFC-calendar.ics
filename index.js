const express = require("express");
const moment = require("moment");
const bodyParser = require("body-parser");
const { eclatClient } = require("./api.js");
const ip = "neocraft1293.fr" 
const app = express();

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
      res.send(`Votre token est ${token} vous pouvez avoir votre agenda sur ce lien : ${ip}/calendar.ics?token=${token}`);
    } else {
      res.send("Nom d'utilisateur ou mot de passe incorrect.");
    }
  });
  

app.get("/calendar.ics", async (req, res) => {
  const token = req.query.token; // Récupère le token depuis l'URL

  const eclat = new eclatClient();
  const login = await eclat.loginByToken(token); // Connexion avec le token

  if (!login) return res.send("Impossible de se connecter à Eclat.");

  const calendar = await eclat.getCalendar();

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
            icsCalendar += `SUMMARY:${seance.matiere} 💼\n`;
            } else {
            icsCalendar += `SUMMARY:${seance.matiere}\n`;
            }
          //icsCalendar += `SUMMARY:${seance.matiere}\n`;
      
          // Check if aRendre array exists and is not empty
          if (seance.aRendre && seance.aRendre.length > 0) {
            icsCalendar += `DESCRIPTION:${seance.aRendre[0]['titre']}\n`;
          } else {
            icsCalendar += `DESCRIPTION:Vous n'avez pas de travail à faire pour ce cours.\n`;
          }
      
          icsCalendar += `LOCATION:${seance.salle.split(" -")[0]}\n`; // Supprime tout ce qui se trouve après le "-"
          icsCalendar += "END:VEVENT\n";
        }
      }     
  }

  icsCalendar += "END:VCALENDAR\n";

  res.set("Content-Type", "text/calendar");
  res.send(icsCalendar);
});

app.listen(process.env.PORT || 80, () => console.log("Le serveur écoute sur le port " + (process.env.PORT || 80)));



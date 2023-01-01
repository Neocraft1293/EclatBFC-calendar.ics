const express = require("express");
const moment = require("moment");
const { eclatClient } = require("./api.js");

const app = express();

app.get("/calendar.ics", async (req, res) => {
    const token = req.query.token; // Récupère le token depuis l'URL

    const eclat = new eclatClient();
    const login = await eclat.loginByToken(token); // Connexion avec le token

    if (!login) return res.send("Impossible de se connecter à Eclat.");

    const calendar = await eclat.getCalendar();

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
                icsCalendar += `SUMMARY:${seance.matiere}\n`;
                icsCalendar += `DESCRIPTION:${seance.id}\n`;
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

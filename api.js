const fetch = require("node-fetch");

let token = "";

exports.eclatClient = class eclatClient {
    async loginByCredentials(username, password) {
        const connexion = await sendRequest(`activation/${username}/${password}`);

        if (!connexion.success) return false;
        token = connexion.authtoken;
        return true;
    }
    async loginByToken(givenToken) {
        token = givenToken;;
        try {
            await sendRequest("infoutilisateur");
            return true;
        } catch {
            return false;
        }
    }
    getToken() {
        return token;
    }
    async getNews() {
        return await sendRequest("actualites/idetablissement/10101");
    }
    async getInfo() {
        return await sendRequest("infoutilisateur");
    }
    async getWork() {
        return await sendRequest("travailAFaire/idetablissement/10101");
    }
    async getCalendar() {
        return await sendRequest("calendrier/idetablissement/10101");
    }
    async getMessage() {
        return await sendRequest("messagerie/boiteReception");
    }
    async getUnreadMessage() {
        const request = await sendRequest("messagerie/info");
        return request.nbMessagesNonLus;
    }
    async getLack() {
        return await sendRequest("consulterAbsences/idetablissement/10101");
    }
    async getGrade() {
        return await sendRequest("consulterNotes/idetablissement/10101");
    }
    async getTranscript() {
        return await sendRequest("consulterReleves/idetablissement/10101");
    }
    async logout() {
        const logout = await sendRequest("desactivation");
        return logout.success;
    }
};

async function sendRequest(path) {
    return await fetch(`https://mobilite.eclat-bfc.fr/mobilite/${path}/?_=${Date.now()}`, {
        headers: {
            Accept: "application/json, text/javascript, */*; q=0.01",
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
            "Accept-Language": "fr-fr",
            "X-Kdecole-Auth": token,
            "X-Kdecole-Vers": "3.7.10",
            cookie: "SERVERID=bfc-prod-web14"
        }
    })
    .then(res => res.json());
};
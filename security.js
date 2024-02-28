import { database } from "./DB.js";
import { sha256 } from 'js-sha256';

export function generateID(takenIds, length = 16) {
    let id = '';
    let chars = [...'qwertyuiopasdfghjklzxcvbnm1234567890QWERTYUIOPASDFGHJKLZXCVBNM'];

    while ((takenIds.includes(id)) || (id === '')) { //On the very low chance that it generates an ID that already exists, it will generate another one
        id = '';
        for (let i = 0; i < length; i++) {
            id += chars[Math.floor(Math.random() * chars.length)]
        }
    }

    return id
}



export function authenticate(user, sessID, app) { // Also self-explanitory
    if (database.users[user]) {
        if ((database.apps[app].sessions[user] === sessID)) {
            console.log(`Successful authentication attempt to '${user}'`);
            return true;
        }
    }

    console.log(`Failed authentication attempt to '${user}'`);
    return false;
}




export function makeSession(user, pass, app) { // Takes login information and returns a random 16 char-long session ID.
    if (app in database.apps) {
        if (user in database.users) {
            if ((database.users[user].key === sha256(pass))) {
                let id = generateID(Object.values(database.apps[app].sessions));

                database.apps[app].sessions[user] = id;

                console.log(`Successful session creation attempt for @${user}`);
                return id
            }

            console.log(database.users[user].key, sha256(pass), app, user)
        }
    } else {
        return 'NO_APP'
    }

    console.log(`Failed session creation attempt for @${user}`);
    return 'BADAUTH'
}


export function checkChars(string) { // Checks if a given string contains anything except for letters and numbers.
    let allowed = [...'qwertyuiopasdfghjklzxcvbnm1234567890_-'];

    let passes = true;

    for (let i of string) {
        if (!allowed.includes(i.toLowerCase())) {
            passes = false
        }
    }

    return passes;
}
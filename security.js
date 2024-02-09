import { database } from "./DB";

export function generateID(ids, length=16) {
    let id = '';
    let takenIds = Object.values(database.apps[app].sessions);
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
    if (app in database.apps[app]) {
        if (user in database.users) {
            if ((database.users[user].key === sha256(pass))) {

                database.apps[app].sessions[user] = generateID(Object.values(database.apps[app].sessions));
    
                console.log(`Successful session creation attempt for @${user}`);
                return id
            }
        }
    } else {
        return 'NO_APP'
    }

    console.log(`Failed session creation attempt for @${user}`);
    return 'BADAUTH'
}
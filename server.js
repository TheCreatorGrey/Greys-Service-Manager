import express from 'express';
import sha256 from 'crypto-js/sha256.js';
import cryptoJs from 'crypto-js';
import { database } from './DB.js';
import { authenticate, makeSession } from './security.js'

const app = express();
app.use(express.static('public'));

database.users.guest = { key: sha256('password'), roles: [], joinDate: getMDY(true), lastOnline: getMDY(true) }, // this is temporary lol

function getMDY(includetime = true) { // This poorly-named funtion gets the current UTC month, day, year and optionally the time.
    let d = new Date();
    let result = { day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear() };

    if (includetime) {
        result.hour = d.getUTCHours();
        result.minute = d.getUTCMinutes();
    }

    return result;
}

function checkChars(string) { // Checks if a given string contains anything except for letters and numbers.
    let allowed = [...'qwertyuiopasdfghjklzxcvbnm1234567890_-'];

    let passes = true;

    for (i of string) {
      if (!allowed.includes(i.toLowerCase())) {
        passes = false
      }
    }

    return passes;
}


// This takes a request JSON and processes it. It authenticates the
// user then returns or performs the action that was requested.
function processRequest(raw, r_origin) {
    let OriginObj = new URL(r_origin);
    let originPath = OriginObj.pathname.split('/');

    let appID = originPath[2];
    console.log(originPath, OriginObj.pathname);

    if ((OriginObj.hostname === 'services.thecreatorgrey.site')) { // Prevents API from being used outside of the official website.
        let r = JSON.parse(raw);

        //if (!(r_origin in database.apps)) {
        //    database.apps[r_origin] = { data: { childCategories: {}, items: {} }, sessions: {} };
        //}
    
        console.info(`Request from origin "${r_origin}": ${raw}`);
    
        // These individual if statements determine what the request 'wants' based on it's 'type' property.
    
        if (r.type === 'getUserInfo') {
            return getUserInfo(r.name)
        }

        if (r.type === 'getAppAlias') {
            if (r.id in database.apps) {
                return database.apps[r.id].alias
            } else {
                return 'NO_APP'
            }
        }
        
        if (originPath[0] === 'login') { // Makes it so that sessions and accounts can only be made from the official login page.
            if (r.type === 'newSession') {
                return makeSession(r.user, r.pass, r.sessionTarget)
            }
    
            if (r.type === 'register') {
                if (database.users[r.username]) {
                    return 'USERTAKEN'
                } else {
                    if (r.username.length < 15) {
                        if (r.username.length > 2) {
                            if (checkChars(r.username)) {
                                if (r.key.length > 9) {
                                    database.users[r.username] = { key: sha256(r.key), roles: [], joinDate: getMDY(true), lastOnline: getMDY(true) };
                                    return true
                                } else {
                                    return 'SHORTKEY'
                                }
                            } else {
                                return 'BADCHARS'
                            }
                        } else {
                            return 'TOOFEWCHARS'
                        }
                    } else {
                        return 'TOOMANYCHARS'
                    }
                }
            }
        } else {
            return 'NO_REGISTRATION_PERMISSION'
        }
    
        if (r.sessionID) { // Everything under this statement can only be performed by authenticated users. Mostly database operations.
            if (authenticate(r.user, r.sessionID, r_origin)) {
                database.users[r.user].lastOnline = getMDY(true);
        
                if (r.type === 'get') {
                    return getItemFromPath(database.apps[r_origin].data, r.path, r.user, r.prs, r.valOnly)
                }
        
                if (r.type === 'set') {
                    return setItemFromPath(database.apps[r_origin].data, r.path, r.mode, r.value, r.user, r.perms)
                }
        
                if (r.type === 'listCh') {
                    return listChildren(database.apps[r_origin].data, r.path)
                }
        
                if (r.type === 'batchOp') {
                    return batchOperation(r.ops)
                }
            } else {
                return 'BADAUTH'
            }
        } else {
            return 'NOSESSION'
        }
    } else {
        return 'BAD_ORIGIN'
    }
}

app.get('/app/:appID/:pageID', (req, res) => {
    let appID = req.params.appID;
    let pageID = req.params.pageID;

    if ((appID in database.apps)) {
        if (!pageID) {
            pageID = 'main'
        }

        let content = database.apps[appID].pages[pageID];
        console.log(pageID, content)


        content += `
        
        <!-- HTML injected by Grey's Service Manager -->

        <script src="https://services.thecreatorgrey.site/frontend/GreysServiceManager.js"></script>

        <!-- ======================================= -->

        `

        res.status(200).send(content);
    } else {
        res.status(404).send('The page you are looking for could not be found.');
    }
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'services.thecreatorgrey.site');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.post('/api', (req, res) => { // This eyesore chunk of code manages the requests.
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        res.status(200).send({ res: processRequest(body, req.get('origin')) });
    });
});

app.listen(80, "", () => {
    console.log(`Server running`);
});
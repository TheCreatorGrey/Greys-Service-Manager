import express from 'express';
import sha256 from 'crypto-js/sha256.js';
import cryptoJs from 'crypto-js';
import { database, getMDY } from './DB.js';
import { authenticate, makeSession } from './security.js'

const app = express();
app.use(express.static('public'));

database.users.guest = { key: sha256('password'), roles: [], joinDate: getMDY(true), lastOnline: getMDY(true) }, // this is temporary lol

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
    let originPath = OriginObj.pathname.split("/");

    console.log(originPath, OriginObj, r_origin);

    let r = JSON.parse(raw);

    let appID = r.appID;
    //if ()

    //if (!(r_origin in database.apps)) {
    //    database.apps[r_origin] = { data: { childCategories: {}, items: {} }, sessions: {} };
    //}

    console.info(`Request from origin "${r_origin}": ${raw}`);

    // These individual if statements determine what the request 'wants' based on it's 'type' property.

    if (r.type === 'getUserInfo') {
        return getUserInfo(r.name)
    }

    console.log(originPath)
    
    if (originPath[1] === 'login') { // Makes it so that sessions and accounts can only be made from the official login page.
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
}

app.get('/:appID/:pageID?', (req, res) => {
    let appID = req.params.appID;
    let pageID = req.params.pageID;

    if ((appID in database.apps)) {
        if (!pageID) {
            pageID = 'main'
        }

        let content = database.apps[appID].pages[pageID];
        console.log(pageID, content)


        content = `
        
        <!-- HTML injected by Grey's Service Manager -->

        <link rel="stylesheet" type="text/css" href="https://services.thecreatorgrey.site/${appID}/asset/stylesheet">
        <script src="https://services.thecreatorgrey.site/frontend/GreysServiceManager.js"></script>

        <!-- ======================================= -->

        ` + content;

        res.status(200).send(content);
    } else {
        res.status(404).send('The page you are looking for could not be found.');
    }
});

app.get('/:appID/asset/stylesheet', (req, res) => {
    let appID = req.params.appID;
    let content;

    if (appID) {
        content = database.apps[appID].stylesheet;
    } else {
        content = '404 not found'
    }

    res.setHeader('Content-Type', 'text/css');

    res.send(content);
});

app.get('/:appID/asset/script/:scriptID', (req, res) => {
    let appID = req.params.appID;
    let scriptID = req.params.scriptID;
    let content;

    if (appID) {
        content = database.apps[appID].scripts[scriptID];
    } else {
        content = '404 not found'
    }

    res.status(200).send(content);
});

//app.use((req, res, next) => {
//    res.header('Access-Control-Allow-Origin', 'services.thecreatorgrey.site');
//    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//    next();
//});

app.post('/api', (req, res) => { // This eyesore chunk of code manages the requests.
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        res.status(200).send({ res: processRequest(body, req.get('referer'))});
    });
});

app.listen(80, "", () => {
    console.log(`Server running`);
});
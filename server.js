const express = require('express');
var sha256 = require('js-sha256');
var perms = require('./permissions.js');
var CryptoJS = require('crypto-js');

const app = express();
app.use(express.static('public'));

var database = {
    data: {},
    users: {
        guest: { key: sha256('password'), roles: [], joinDate: getMDY(true), lastOnline: getMDY(true) }, // this is temporary lol
    },
    sessions: {}
};

function getMDY(includetime = true) {
    let d = new Date();
    let result = { day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear() };

    if (includetime) {
        result.hour = d.getUTCHours();
        result.minute = d.getUTCMinutes();
    }

    return result;
}

function getUserInfo(user) {
    let fullInfo = database.users[user];

    if (fullInfo) {
        return { // Obviously, we don't want to return everything.
            name: user,
            roles: fullInfo.roles,
            joinDate: fullInfo.joinDate,
            lastOnline: fullInfo.lastOnline
        }
    }
}

function listChildren(obj, path, user) {
    let pathList = path.split("/");
    let userInfo = getUserInfo(user);
    let current = obj;

    for (p in pathList) {
        let catName = pathList[p];

        let newCurr = current.childCategories[catName];
        if (newCurr) {
            current = newCurr;
        } else {
            return 'NOITEM'
        }
    }

    let accessibleItems = {}
    for (let i in current.items) {
        let item = current.items[i];
        if (perms.checkPermission(item, userInfo, 'read')) {
            accessibleItems[i] = item
        }
    }

    return {categories:Object.keys(current.childCategories), items:accessibleItems}
}

function getItemFromPath(obj, path, user, processes = [], intent = 'read', valOnly=true) { // The intent argument tells the function which permission to check for when determining whether the user has access or not. The only case in which write is used instead of read is in the set function.
    let pathList = path.split("/");
    let current = obj;
    console.log(obj)

    for (p in pathList) {
        let catName = pathList[p];

        let newCurr = current.childCategories[catName];
        if (newCurr) {
            current = newCurr;
            console.log(current + 'amogus')
        } else {
            return 'NOITEM'
        }
    }

    let item = current.items[pathList[pathList.length - 1]];
    if (item) {
        if (perms.checkPermission(item, getUserInfo(user), intent)) { // Checks if the user has access to the item
            try {
                let itemClone = JSON.parse(JSON.stringify({ item: item })).item; // If there was a less idiotic way to clone things in JS, I would do it

                for (o of processes) {
                    if (o.type === 'slice') {
                        itemClone = itemClone.slice(o.start, o.end)
                    }
                    if (o.type === 'sliceAfterItem') {
                        itemClone = itemClone.slice(itemClone.indexOf(o.item) + 1)
                    }
                    if (o.type === 'toLength') {
                        itemClone = itemClone.length
                    }
                    //if (o.type === 'toChild') {
                    //    itemClone = itemClone[o.childName]
                    //}
                }

                if (valOnly) {
                    return itemClone.value
                } else {
                    return itemClone
                }
            } catch {
                return 'FAILEDPRS'
            }
        } else {
            return 'NOACCESS'
        }
    } else {
        return 'NOITEM'
    }
}

function setItemFromPath(obj, path, mode, value, user, permissions) {
    if (getItemFromPath(obj, path, user, [], 'write') === 'NOACCESS') {
        return 'NOACCESS'
    } else {
        let pathList = path.split("/");
        let current = obj;

        for (p in pathList) {
            let catName = pathList[p];

            if (!current.childCategories[catName]) {
                current.childCategories[catName] = { items: {}, childCategories: {} };
            }

            if ((p > (pathList.length - 2))) {
                let item = current.childCategories[catName].items[pathList[pathList.length - 1]];

                if (mode === 'set') {
                    item = { value: value, owner: user, p:perms.makePermCode(permissions), cd: getMDY(true), lm: getMDY(true), id:current.childCategories[catName].items.length  }
                } else if (mode === 'append') {
                    item.value.push(value);
                    item.lm = getMDY();
                } else {
                    return 'INVALIDMODE'
                }
            }

            current = current.childCategories[catName];
        }
    }
}

function batchOperation(ops, obj, user) {
    if (ops.length < 21) {
        let responses = [];

        for (o of ops) {
            if (o.type === 'get') {
                responses += getItemFromPath(obj, o.path, user, o.processes, o.valOnly)
            } else if (o.type === 'mod') {
                responses += setItemFromPath(obj, o.path, o.mode, o.value, user, o.perms)
            }
        }

        return responses
    } else {
        return 'OPLIMIT'
    }
}

function authenticate(user, sessID) {
    if (user in database.users) {
        if ((database.sessions[user] === sessID)) {
            console.log(`Successful authentication attempt to '${user}'`);
            return true;
        }
    }

    console.log(`Failed authentication attempt to '${user}'`);
    return false;
}

function makeSession(user, pass) {
    if (user in database.users) {
        if ((database.users[user].key === sha256(pass))) {
            let id = '';
            let takenIds = Object.values(database.sessions);
            let chars = [...'qwertyuiopasdfghjklzxcvbnm1234567890QWERTYUIOPASDFGHJKLZXCVBNM'];

            while ((takenIds.includes(id)) || (id === '')) {
                id = '';
                for (let i = 0; i < 16; i++) {
                    id += chars[Math.floor(Math.random() * chars.length)]
                }
            }

            database.sessions[user] = id;

            console.log(`Successful session creation attempt from @${user}`);
            return id
        }
    }

    console.log(`Failed session creation attempt from @${user}`);
    return 'BADAUTH'
}

function processRequest(raw) {
    let r = JSON.parse(raw);

    //console.log(r, database.data)

    if (r.type === 'newSession') {
        return makeSession(r.user, r.pass)
    }

    if (r.type === 'register') {
        if (database.users[r.username]) {
            return 'USERTAKEN'
        } else {
            database.users[r.username] = { key: sha256(r.key), roles: [], joinDate: getMDY(true), lastOnline: getMDY(true) };
            return true
        }
    }

    if (r.type === 'getUserInfo') {
        return getUserInfo(r.name)
    }

    if (authenticate(r.user, r.sessionID)) {
        database.users[r.user].lastOnline = getMDY(true);
        
        if (['get', 'set'].includes(r.type)) {
            if (!(r.appID in database.data)) {
                database.data[r.appID] = { childCategories: {}, items: {} }
            }
        }

        if (r.type === 'get') {
            return getItemFromPath(database.data[r.appID], r.path, r.user, r.prs, r.valOnly)
        }

        if (r.type === 'set') {
            return setItemFromPath(database.data[r.appID], r.path, r.mode, r.value, r.user, r.perms)
        }

        if (r.type === 'listCh') {
            return listChildren(database.data[r.appID], r.path)
        }

        if (r.type === 'batchOp') {
            return batchOperation(r.ops)
        }
    } else {
        return 'BADAUTH'
    }
}

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.post('/services', (req, res) => {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        res.status(200).send({ res: processRequest(body) });
    });
});

app.listen(80, "", () => {
    console.log(`Server running`);
});
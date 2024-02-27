import {makePermCode, checkPermission} from './permissions.js';

export var database = { // I prefer not to use libraries where I can, so the database is basically just stored in this JSON.
    apps:{
        'greyschat':{
            data:{ childCategories: {}, items: {} },

            sessions:{},

            pages:{
                'main':`
                <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta http-equiv="X-UA-Compatible" content="ie=edge">
                        <title>Grey's Chatroom</title>
                        <link rel="stylesheet" href="style.css">
                    </head>
                    <body>
                        <span class="head">
                        <img src="./assets/icon.png" alt="icon" style="height: 50px;">
                        <h1 class="head-text">Grey's Chatroom</h1>
                        <h1 class="head-text" style="font-family: sans-serif; font-size: 20px; color: darkgray;">With PeerJS</h1>
                        </span>
                    
                        <div class="msgBoard">
                            <div id="msgContainer">
                            </div>
                    
                            <span style="width: 100%;">
                                <textarea name="input" id="msgEntry"></textarea>
                                <button id="sendBtn">Send</button>
                            </span>
                        </div>
                    <script src="https://unpkg.com/peerjs@1.5.1/dist/peerjs.min.js"></script>
                    <script src="encryptor.js"></script>
                    <script src="index.js"></script>
                  </body>
                </html>
                `
            },

            scripts:{
                'index':`
                console.log("amogus")
                `
            },

            stylesheet:`
                @font-face {
                    font-family: 'Header';
                    src: url('./assets/PixelifySans-Regular.ttf');
                }
                
                @font-face {
                    font-family: 'Montserrat';
                    src: url('./assets/Montserrat-Medium.ttf');
                }
                
                body {
                    background-color: rgb(32, 32, 32);
                }
                
                .msgBoard {
                    width: 100%;;
                    height: calc(100% - 60px);
                    position: absolute;
                    bottom: 0;
                    left: 0;
                }
                
                .head {
                    position: absolute; 
                }
                
                .head-text {
                    font-size: 50px; 
                    line-height:50px; 
                    vertical-align: top; 
                    display: inline; 
                    color: white; 
                    font-family: Header;
                }
                
                #msgContainer {
                    background-color: rgb(20, 20, 20);
                    width:100%;
                    height: calc(100% - 60px);
                    overflow-y: auto;
                    color: white;
                    font-size: .5cm;
                    font-family: Montserrat;
                }
                
                #msgEntry {
                    width: calc(100% - 65px);
                    height: 55px;
                    border: 0;
                    padding: 0;
                    margin: 0;
                    resize: none;
                    background-color: rgb(40, 40, 40);
                    color: white;
                    font-family: Montserrat;
                    font-size: .5cm;
                }
                
                #sendBtn {
                    border:0;
                    width: 60px;
                    height: 55px;
                    vertical-align: top;
                    background-color: rgb(40, 100, 40);
                    color: white;
                    font-family: Montserrat;
                }
            `,

            owner:'thecreatorgrey'
        }
    },

    users: {}
};


export function getMDY(includetime = true) { // This poorly-named funtion gets the current UTC month, day, year and optionally the time.
    let d = new Date();
    let result = { day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear() };

    if (includetime) {
        result.hour = d.getUTCHours();
        result.minute = d.getUTCMinutes();
    }

    return result;
}


export function getUserInfo(user) { // Self-explanitory.
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




export function getItemFromPath(obj, path, user, processes = [], intent = 'read', valOnly=true) { // The intent argument tells the function which permission to check for when determining whether the user has access or not. The only case in which write is used instead of read is in the set function.
    let pathList = path.split("/");
    let current = obj;
    console.log(JSON.stringify(obj))

    for (p in pathList) {
        let catName = pathList[p];

        let newCurr = current.childCategories[catName];
        if (newCurr) {
            current = newCurr;
            console.log(JSON.stringify('current') + 'amogus')
        } else {
            return 'NOITEM'
        }
    }

    let item = current.items[pathList[pathList.length - 1]];
    if (item) {
        if (checkPermission(item, getUserInfo(user), intent)) { // Checks if the user has access to the item
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

export function setItemFromPath(obj, path, mode, value, user, permissions) { // Takes a database directory and sets the specified item to the specified value. Also checks user's permission.
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

            console.log(catName, pathList[pathList.length-1]);
            if (catName === pathList[pathList.length-1]) {
                let item = current.childCategories[catName].items[pathList[pathList.length - 1]];

                if (mode === 'set') {
                    item = { value: value, owner: user, p:makePermCode(permissions), cd: getMDY(true), lm: getMDY(true), id:current.childCategories[catName].items.length  }
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



export function listChildren(obj, path, user) { // This takes a database directory and returns a list of it's contents.
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
        if (checkPermission(item, userInfo, 'read')) {
            accessibleItems[i] = item
        }
    }

    return {categories:Object.keys(current.childCategories), items:accessibleItems}
}



export function batchOperation(ops, obj, user) { // Performs multiple operations in one go.
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
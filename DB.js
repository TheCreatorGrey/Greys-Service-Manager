import { makePermCode, checkPermission } from './permissions.js';

export var database = { // I prefer not to use libraries where I can, so the database is basically just stored in this JSON.
    apps: {
        'dashboard': {
            data: { childCategories: {}, items: {} },

            sessions: {},

            pages: {
                'main': `
                <!doctype html>

                <html lang="en" class="homepage">
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=0">
                
                        <title>GSM Dashboard</title>
                    </head>
                
                    <body>
                        <div id="appSidebar">
                        </div>
                
                        <div id="main">
                            <h1 id="appLabel"></h1>
                
                            <hr>
                
                            <h3>HTML</h3>
                            <textarea name="HTMLEntry" class="codeArea" id="HTMLEntry"></textarea>
                
                            <h3>Style Sheet</h3>
                            <textarea name="styleSheetEntry" class="codeArea" id="styleSheetEntry"></textarea>
                
                            <h3>Main Script</h3>
                            <textarea name="mainScriptEntry" class="codeArea" id="mainScriptEntry"></textarea>
                
                            <br>
                            <button id="upd">update</button>
                        </div>
                    </body>
                </html>
                `
            },

            scripts: {
                'index': `
                let sb = document.getElementById("appSidebar");
                let connection = new ServiceConnection("dashboard");
                let currentApp;
    
                function switchApp(id) {
                    document.getElementById("appLabel").innerText = "https://services.thecreatorgrey.site/" + id;
                    currentApp = id;
                }
    
                switchApp("dashboard");
    
                (async () => {
                    let apps = await connection.request({"type":"listApps"});
    
                    for (a of apps) {
                        sb.insertAdjacentHTML("beforeend", "<button id='sidebarButton' onclick='switchApp(" + a + ")'>" + a + "</button>")
                }
                })();
    
    
                document.getElementById("updateBtn").onclick = async function() {
                    let htmlVal = document.getElementById("styleSheetEntry").value;
                    let styleSheet = document.getElementById("styleSheetEntry").value;
                    let mainScript = document.getElementById("mainScriptEntry").value;
    
                    await sc.request({"type":"updateApp", "obj":{pages:{main:htmlVal}, stylesheet:styleSheet, scripts:{index:mainScript}}, "id":currentApp})
                }
                `
            },

            stylesheet: `
                body {
                    margin: 0;
                    background-color: rgb(32, 32, 32);
                    font-family: Arial;
                    color: white;
                }

                #appSidebar {
                    height: 100%; 
                    width: 100px; 
                    background-color: rgb(100, 100, 100); 
                    position: absolute; 
                    top: 0; 
                    left: 0;
                }

                #main {
                    height: 100%;
                    width: calc(100% - 100px);
                    position: absolute;
                    top: 0;
                    right: 0;
                    overflow-y: scroll;
                }

                #sidebarButton {
                    width: 100%; 
                    height: 20px; 
                    border: 0; 
                    background-color: rgb(150, 150, 150); 
                }

                #sidebarButton:hover {
                    background-color: rgb(165, 165, 165);
                    border: 1px solid black;
                }

                .codeArea {
                    resize: none;
                    width: 500px;
                    height: 600px;
                    overflow-y: scroll;
                    background-color: rgb(25, 27, 25);
                    color: rgb(189, 255, 194);
                    border: 0;
                }
            `,

            owner: 'thecreatorgrey'
        },

        'amogus': {
            data: { childCategories: {}, items: {} },

            sessions: {},

            pages: {
                'main': `
                <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Amogus</title>
                    </head>
                    <body>
                        <script src="https://services.thecreatorgrey.site/amogus/asset/script/index"></script>
                    </body>
                </html>
                `
            },

            scripts: {
                'index': `
                console.log("amogus");
                `
            },

            stylesheet: `
                body {
                    background-color: rgb(32, 32, 32);
                }
            `,

            owner: 'thecreatorgrey'
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




export function getItemFromPath(obj, path, user, processes = [], intent = 'read', valOnly = true) { // The intent argument tells the function which permission to check for when determining whether the user has access or not. The only case in which write is used instead of read is in the set function.
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

            console.log(catName, pathList[pathList.length - 1]);
            if (catName === pathList[pathList.length - 1]) {
                let item = current.childCategories[catName].items[pathList[pathList.length - 1]];

                if (mode === 'set') {
                    item = { value: value, owner: user, p: makePermCode(permissions), cd: getMDY(true), lm: getMDY(true), id: current.childCategories[catName].items.length }
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

    return { categories: Object.keys(current.childCategories), items: accessibleItems }
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



export function updateApp(id, object, user) {
    let app = database.apps[id];

    console.log(id, app, database.apps)

    if (app.owner === user) {
        if (object.pages) {
            app.pages = object.pages
        }

        if (object.stylesheet) {
            app.stylesheet = object.stylesheet
        }

        if (object.scripts) {
            app.scripts = object.scripts
        }
    } else {
        return "BADAUTH"
    }
}
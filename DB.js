import {makePermCode, checkPermission} from './permissions.js';
import sha256 from 'crypto-js/sha256.js';

export var database = { // I prefer not to use libraries where I can, so the database is basically just stored in this JSON.
    apps:{
        'portfolio':{
            data:{ childCategories: {}, items: {} },

            sessions:{},

            pages:{
                'main':'<span>why hello there</span>',
                'amogus':'<span>amogus (sus)</span><img src="https://th.bing.com/th/id/R.40d78af31f09a9807fbd038912cc9ddd?rik=dPjtwSXhiDF4qw&pid=ImgRaw&r=0">'
            },

            owner:'thecreatorgrey',

            alias:null
        }
    },

    users: {
        guest: { key: sha256('password'), roles: [], joinDate: getMDY(true), lastOnline: getMDY(true) }, // this is temporary lol
    }
};


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
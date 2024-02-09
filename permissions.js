let permissions = [
    'read',
    'write',
    'remove',
    'modify'
]

let roles = [
    'admin',
    'moderator',
    'developer'
]

let permObj = {
    'read': ['*'],
    'modify': ['guest'],
    'write': ['*admin', 'guest'],
}

export function extractPermCode(code) {
    let newObj = {};

    for (let sect of code.split('/')) {
        let subsect = sect.split(':');

        if (subsect.length > 1) {
            let perm = permissions[
                parseInt(subsect[0])
            ];
            newObj[perm] = [];

            for (let w of subsect[1].split(',')) {
                if (w[0] === 'u') {
                    newObj[perm].push(
                        atob(w.substring(1))
                    )
                } else if (w[0] === '*') {
                    if (w === '*') {
                        newObj[perm].push('*')
                    } else {
                        let roleID = parseInt(w.substring(1));
    
                        newObj[perm].push(
                            '*' + roles[roleID]
                        )
                    }
                }
            }
        }
    }

    return newObj
}

export function makePermCode(permObj) {
    let code = '';

    // This creates a compact code from a readable permission object.
    //
    // In the code this creates, every permission is separated by
    // forward slashes (/), Each of these sections are separated
    // by a colon (:). The first part is the permission ID or index,
    // the second part is a whitelist of roles and users that are
    // allowed to change, read or write the item depending on
    // which permission it is under. The whitelist is separated
    // by commas (,), each part begins with either an asterisk (*)
    // or an uppercase U, depending on whether the item is whitelisting
    // a user or a role respectively. The part after the first 
    // identifying character is either an ID or index of a role,
    // or a base64 string of a username.
    

    console.log(permObj)

    for (let p in permObj) {
        code += permissions.indexOf(p) + ":";

        for (let w of permObj[p]) {
            if (w[0] === '*') {
                if (w === '*') {
                    code += "*"
                } else {
                    let rName = w.substring(1);
                    code += `*${roles.indexOf(rName)}`
                }
            } else {
                code += `u${btoa(w)}`
            }
            code += ","
        }
        code = code.slice(0, -1); //remove the last redundant splitter (,)

        code += "/"
    }

    code = code.slice(0, -1); //remove the last redundant splitter (/)

    return code
}

export function checkPermission(item, userInfo, intent) {
    let pObj = extractPermCode(item.p);
    let whiteList = pObj[intent];

    if (userInfo.roles.includes('admin') || (item.owner === userInfo.name)) { // So that admins and the original creators of the item have full access
        return true
    }

    if (whiteList) {
        if (whiteList.includes("*") || whiteList.includes(username)) {
            return true
        }

        for (r of userInfo.roles) {
            if (whiteList.includes("*" + r)) {
                return true
            }
        }
    }

    return false
}
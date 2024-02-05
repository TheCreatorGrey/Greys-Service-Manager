document.documentElement.innerHTML = `
<link rel="stylesheet" href="https://services.thecreatorgrey.site/style.css">

<div id="GSMprompt">
    <div>
        <span>
            This service uses <a href="https://services.thecreatorgrey.site">Grey's Service Manager</a>.
            Please continue with an account.
        </span>

        <br><button id="GSMPromptButton">Continue</button>
    </div>
</div>

<script>
    document.getElementById('GSMPromptButton').onclick = function() {
        window.location.href = 'https://services.thecreatorgrey.site/login/?redir=' + '${window.location.href}';
    }
</script>
`;

/**
* An object through which you can communicate to the server.
*/
class ServiceConnection {
    constructor(apiUrl = 'https://services.thecreatorgrey.site/api') {
        this.apiUrl = apiUrl;
    }

    /**
    * An internal function which is not intended for use by the user.
    */
    interperetErrCode(code) {
        let errCodes = {
            'BADAUTH':{
                type:'error',
                meaning:'Authentication failed.'
            },

            'NOITEM':{
                type:'error',
                meaning:'Item or path could not be found.'
            },

            'NOACCESS':{
                type:'error',
                meaning:'You do not have access to the item you requested.'
            },

            'INVALIDMODE':{
                type:'error',
                meaning:'The modification mode you supplied is invalid.'
            },

            'FAILEDPRS':{
                type:'error',
                meaning:'The processes you supplied failed. Please make sure you supplied valid process IDs and the value of the item you requested is compatible with your operation.'
            }
        }

        let EC = errCodes[code];

        if (EC) {
            console[EC.type](`[${EC.type}] Operation failed: ${EC.meaning}`)
        }
    }

    /**
    * Returns a session ID which can be loaded with loadSession().
    */
    async requestSession(username, password) {
        let newSess = await this.request({ type: 'newSession', user: username, pass: password });

        if (newSess === 'BADAUTH') {
            console.error('Session creation failed. Please make sure login is correct.');
            return false;
        } else {
            console.info('Session creation successful.');
            return newSess;
        }
    }

    /**
    * Loads a pre-existing session with an ID and username.
    */
    async loadSession(username, sessID) {
        this.user = username;
        this.sessionID = sessID;
    }

    /**
    * An internal function which is not intended for use by the user.
    */
    async register(newUser, newPass) {
        return await this.request({
            type: 'register',
            username: newUser, key: newPass
        });
    }

    /**
    * An internal function which is not intended for use by the user.
    */
    async request(data) {
        if (!this.user) {
            if (['get', 'set', 'set'].includes(data.type)) {
                console.error('Operation failed: Modification and retrieval requests are disabled when not logged in.');
                return
            }
        }

        var f = fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then(response => response.json())
            .then(data => {
                return data;
            })
            .catch(error => {
                console.error('Error:', error);
            });

        return f.then((r) => {
            this.interperetErrCode(r.res);

            return r.res;
        });
    }

    /**
    * Gets an item from the database.
    */
    async getItem(path, processes=[], valOnly=true) {
        let res = await this.request({
            type: 'get',
            prs:processes,
            path: path,
            sessionID: this.sessionID,
            user: this.user,
            valOnly:valOnly
        });

        return res
    }

    /**
    * Modifies an item from the database.
    */
    async setItem(path, value, mode='set', permissions={}) {
        let res = await this.request({
            type: 'set',
            mode: mode,
            path: path,
            value: value,
            perms: permissions,
            sessionID: this.sessionID,
            user: this.user
        });

        return res;
    }

    /**
    * Gets public info of a user (join date, last online, roles, etc).
    */
    async getUserInfo(name) {
        let res = await this.request({
            type: 'getUserInfo',
            name: name
        });

        return res;
    }

    /**
    * Returns a list of the names of the subcategories in a given path. Does not include items.
    */
    async listChildren(path) {
        let res = await this.request({
            type: 'listCh',
            path: path,
            sessionID: this.sessionID,
            user: this.user,
        });

        return res;
    }

    /**
    * Performs multiple operations at once to conserve bandwidth and avoid rate-limiting.
    */
    async batchOperation(ops) {
        let res = await this.request({
            type: 'batchOp',
            ops: ops,
            sessionID: this.sessionID,
            user: this.user
        });

        return res;
    }
}
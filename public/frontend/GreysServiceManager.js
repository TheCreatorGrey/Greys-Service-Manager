/**
* An object through which you can communicate to the server.
*/
class ServiceConnection {
    constructor(guest=false) {
        this.params = new URLSearchParams(window.location.search);

        this.apiUrl = 'https://services.thecreatorgrey.site/api';

        if (guest) {
            console.info('You have initialized your ServiceConnection in guest mode. You will only be able to perform operations available to guests.')
        } else { // If the connection is initialized in guest mode, do not open a login prompt or check for session ID/user
            this.sessionID = this.params.get('sessID');
            this.user = this.params.get('user');

            if ((! this.sessionID) || (! this.user)) {
                console.info('Session ID and/or username were not found. Prompting login...');

                document.body.insertAdjacentHTML('beforebegin', `
                <link rel="stylesheet" href="https://services.thecreatorgrey.site/style.css">

                <div id="GSMprompt">
                    <span>
                        This service uses <a href="https://services.thecreatorgrey.site">Grey's Service Manager</a>.
                        Please continue with an account.
                    </span>

                    <br><button id="GSMPromptButton" onclick="window.location.href = 'https://services.thecreatorgrey.site/login/?id=${(new URL(window.location.href)).pathname.split('/')[1]}'">Continue</button>
                </div>
                `)
            }
        }
    }

    /**
    * An internal function which is not intended for use by the user.
    * 
    * Takes an error code from the server and logs it's meaning.
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
            },

            'NOSESSION':{
                type:'error',
                meaning:'Your session ID is missing.'
            },

            'NO_REGISTRATION_PERMISSION':{
                type:'error',
                meaning:'Client sites do not have permission make registrations or sessions.'
            },

            'NO_APP':{
                type:'error',
                meaning:'Your app ID is not registered or does not exist.'
            },

            'BAD_ORIGIN':{
                type:'error',
                meaning:'This API can only be used by apps under services.thecreatorgrey.site'
            }
        }

        let EC = errCodes[code];

        if (EC) {
            console[EC.type](`[${EC.type}] Operation failed: ${EC.meaning}`)
        }
    }

    /**
    * An internal function which is not intended for use by the user.
    * 
    * Requests and returns a session ID which can be used later. Can only be performed from the official Grey's Service Manager website.
    */
    async requestSession(username, password, app) {
        let newSess = await this.request({ type: 'newSession', user: username, pass: password, sessionTarget: app});

        if (newSess === 'BADAUTH') {
            console.error('Session creation failed. Please make sure login is correct.');
            return false;
        } else {
            console.info('Session creation successful.');
            return newSess;
        }
    }

    /**
    * An internal function which is not intended for use by the user.
    * 
    * Makes an account creation request. Can only be performed from the official Grey's Service Manager website.
    */
    async register(newUser, newPass) {
        return await this.request({
            type: 'register',
            username: newUser, 
            key: newPass
        });
    }

    /**
    * An internal function which is not intended for use by the user.
    * 
    * Makes a request to the server.
    */
    async request(data) {
        data.sessionID = this.sessionID;

        if (! (data.type === 'newSession')) {
            data.user = this.user;
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
            valOnly:valOnly
        });

        return res
    }

    /**
    * Modifies or sets an item from the database.
    */
    async setItem(path, value, mode='set', permissions={}) {
        let res = await this.request({
            type: 'set',
            mode: mode,
            path: path,
            value: value,
            perms: permissions,
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
        });

        return res;
    }
}
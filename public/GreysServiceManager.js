/**
* An object through which you can communicate to the server.
*/
class ServiceConnection {
    constructor(appID, guest = false) {
        this.params = new URLSearchParams(window.location.search);

        this.apiUrl = 'https://services.thecreatorgrey.site/api';
        this.appID = appID;

        if (guest) {
            console.info('You have initialized your ServiceConnection in guest mode. You will only be able to perform operations available to guests.')
        } else { // If the connection is initialized in guest mode, do not open a login prompt or check for session ID/user
            this.sessionID = this.params.get('sessID');
            this.user = this.params.get('user');

            if ((!this.sessionID) || (!this.user)) {
                console.info('Session ID and/or username were not found. Prompting login...');

                document.body.insertAdjacentHTML('beforebegin', `
                <link rel="stylesheet" href="https://services.thecreatorgrey.site/style.css">

                <div id="GSMprompt">
                    <span>
                        This service uses <a href="https://services.thecreatorgrey.site">Grey's Service Manager</a>.
                        Please continue with an account.
                    </span>

                    <br><button id="GSMPromptButton" onclick="window.location.href = 'https://services.thecreatorgrey.site/login/?r=${window.location.href}&id=${this.appID}'">Continue</button>
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
            'BAD_AUTH': {
                type: 'error',
                meaning: 'Authentication failed'
            },

            'INVALID_PATH': {
                type: 'error',
                meaning: 'Item or path could not be found'
            },

            'NO_APP': {
                type: 'error',
                meaning: 'App ID is not registered or does not exist'
            },

            'NO_PERMISSION': {
                type: 'error',
                meaning: 'Insufficient permission to read or modify item'
            },

            'INSUFFICIENT_ARGUMENTS': {
                type: 'error',
                meaning: 'Missing or invalid arguments'
            },

            'BAD_AUTH': {
                type: 'error',
                meaning: 'Authentication failed'
            },

            'USERNAME_TAKEN': {
                type: 'error',
                meaning: 'Username taken'
            },

            'NO_USER': {
                type: 'error',
                meaning: 'User not found'
            },
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
    async requestSession(username, password) {
        let newSess = await this.request({ type: 'requestSession', username: username, key: password });

        if (newSess === 'BAD_AUTH') {
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
    * Makes a request to the server.
    */
    async request(data) {
        data.sessionID = this.sessionID;
        data.appID = this.appID;

        if (!(data.type === 'newSession')) {
            data.user = this.user;
        }
        
        var response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        response = await response.json()
        console.log(response)
        this.interperetErrCode(response.response);
        return response.response;
    }

    /**
    * Gets an item from the database.
    */
    async getItem(path, mode="plain", mArgs={}) {
        let res = await this.request({
            type: 'read',
            path: path,
            mode:mode,
            mArgs:mArgs
        });

        return res
    }

    /**
    * Modifies or sets an item from the database.
    */
    async modifyItem(path, value, intent="write", permissions = {}) {
        let res = await this.request({
            type: intent,
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
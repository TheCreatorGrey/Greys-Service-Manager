from flask import Flask, request, send_from_directory, json
from flask_cors import CORS
from waitress import serve
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from db import DataBase, itemProcess
from security import makeSession, createAccount, sessionAuth
import os, logging

with open("test.txt", "w") as f:
    f.write("test")

server = Flask(__name__)
limiter = Limiter(
    get_remote_address,
    app=server,
    default_limits=["30 per minute"],
    storage_uri="memory://",
)
CORS(server)

def servLog(item):
    logging.info(str(item))

@server.route('/')
@server.route('/<path:filename>')
def index(filename=''):
    if not filename \
        or filename.endswith('/') \
        or os.path.isdir(os.path.join("public", filename)):
        
        filename = os.path.join(filename, 'index.html')
    return send_from_directory("public", filename)

def processRequest(raw):
    data = json.loads(raw)

    # I had to make a function for this because it raises an error when you try 
    # to get an item from a dict that doesnt exist instead of returning null like JS does
    def arg(id):
        if id in data:
            return data[id]
        else:
            return None
    
    intent = arg("type")

    if intent == "check":
        return True
    if intent == "createUser":
        return createAccount(arg("username_new"), arg("key"))
    if intent == "requestSession":
        return makeSession(arg("username"), arg("key"))

    user = arg("user")
    appID = arg("appID")
    sessID = arg("sessID")

    if not (sessionAuth(user, sessID)): # Everything below this line can only be performed if a valid session ID is supplied
        return "BAD_AUTH"

    if intent == "read":
        return itemProcess(user, appID, arg("path"), "read", mode=arg("mode"), mArgs=arg("mArgs"))
    if intent == "write":
        return itemProcess(user, appID, arg("path"), "write", value=arg("value"), permissions=arg("perms"))
    if intent == "append":
        return itemProcess(user, appID, arg("path"), "append", value=arg("value"))

    servLog(data)


@server.route('/api', methods=['POST'])
@limiter.limit('60 per minute', override_defaults=True)
def api():
    return {"response":processRequest(request.data)}

if __name__ == '__main__':
    serve(server, host="0.0.0.0", port=80)
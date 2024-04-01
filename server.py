from flask import Flask, request, send_from_directory, json
from flask_cors import CORS
from waitress import serve
from db import DataBase, itemProcess
import sys

server = Flask(__name__)
CORS(server)

def servLog(item):
    sys.stdout.write(str(item))

@server.route('/<path:filename>')
def serve_file(filename):
    servLog(filename)
    # Serve files from the "public" directory based on the URL path
    return send_from_directory('public', filename)

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
    user = arg("user")
    appID = arg("appID")

    if intent == "read":
        return itemProcess(user, appID, arg("path"), "read", mode=arg("mode"), mArgs=arg("mArgs"))
    if intent == "write":
        return itemProcess(user, appID, arg("path"), "write", value=arg("value"), permissions=arg("perms"))
    if intent == "append":
        return itemProcess(user, appID, arg("path"), "append", value=arg("value"))

    servLog(data)

@server.route('/api', methods=['POST'])
def api():
    return {"response":processRequest(request.data)}

if __name__ == '__main__':
    serve(server, host="0.0.0.0", port=80)
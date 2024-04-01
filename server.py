from flask import Flask, request, send_from_directory, json
from flask_cors import CORS
from waitress import serve
import sys

app = Flask(__name__)
CORS(app)

def servLog(item):
    sys.stdout.write(str(item))

@app.route('/<path:filename>')
def serve_file(filename):
    servLog(filename)
    # Serve files from the "public" directory based on the URL path
    return send_from_directory('public', filename)

@app.route('/api', methods=['POST'])
def api():
    data = json.loads(request. data)
    servLog(data)
    return data

if __name__ == '__main__':
    serve(app, host="0.0.0.0", port=80)
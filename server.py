from flask import Flask, request, send_from_directory, json
from flask_cors import CORS
from waitress import serve
import logging

app = Flask(__name__)
CORS(app)

@app.route('/<path:filename>')
def serve_file(filename):
    app.logger.info(filename)
    # Serve files from the "public" directory based on the URL path
    return send_from_directory('public', filename)

@app.route('/api', methods=['POST'])
def api():
    data = json.loads(request. data)
    app.logger.info(data, flush=True)
    return data

if __name__ == '__main__':
    serve(app, host="0.0.0.0", port=80)
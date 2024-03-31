from flask import Flask, request, send_from_directory, json
from flask_cors import CORS
from waitress import serve

app = Flask(__name__)
CORS(app)

@app.route('/<path:filename>')
def serve_file(filename):
    print(filename)
    # Serve files from the "public" directory based on the URL path
    return send_from_directory('public', filename)

@app.route('/api', methods=['POST'])
def api():
    data = json.loads(request.data)
    print(data)
    return data

if __name__ == '__main__':
    serve(app, host="0.0.0.0", port=80)
from flask import Flask, render_template, request, jsonify, send_from_directory

app = Flask(__name__)

@app.route('/<path:filename>')
def serve_file(filename):
    # Serve files from the "public" directory based on the URL path
    return send_from_directory('public', filename)

@app.route('/api', methods=['POST'])
def api():
    data = request.json
    print('Received data:', data)
    return jsonify({'message': 'Data received successfully'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80, debug=True)
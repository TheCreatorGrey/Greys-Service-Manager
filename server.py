import socket

# Create a socket object
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)


server_socket.bind(("", 80))
server_socket.listen()

print("Server running")

while True:
    client_socket, client_address = server_socket.accept()
    print("Connection from {}:{}".format(*client_address))

    data = client_socket.recv(1024)
    print("Request:", data.decode())

    response = "Hello"
    client_socket.sendall(response.encode())

    client_socket.close()

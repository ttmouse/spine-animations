import http.server
import socketserver
import json
import os
import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class SpineFileHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        logging.info(f"Received GET request for path: {self.path}")
        
        if self.path == '/list-bg-images':
            self.handle_list_bg_images()
        elif self.path == '/list-spine-files':
            self.handle_list_spine_files()
        else:
            logging.warning(f"Unhandled path: {self.path}")
            super().do_GET()

    def send_json_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def handle_list_spine_files(self):
        spine_files = [f for f in os.listdir('.') if f.endswith('.json')]
        logging.info(f"Spine files found: {spine_files}")
        self.send_json_response(spine_files)

    def handle_list_bg_images(self):
        bg_images = [f for f in os.listdir('.') if 'bg' in f.lower() and f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))]
        logging.info(f"Background images found: {bg_images}")
        self.send_json_response(bg_images)

def run_server(port=8000):
    with socketserver.TCPServer(("", port), SpineFileHandler) as httpd:
        logging.info(f"Server started at http://localhost:{port}")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
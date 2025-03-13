import http.server
import socketserver
import json
import os
import logging
import signal
import sys
import socket

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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
        try:
            spine_files = [f for f in os.listdir('.') if f.endswith('.json')]
            logging.info(f"Spine files found: {spine_files}")
            self.send_json_response(spine_files)
        except Exception as e:
            logging.error(f"Error in handle_list_spine_files: {e}")
            self.send_error(500, f"Internal server error: {str(e)}")

    def handle_list_bg_images(self):
        try:
            bg_images = [f for f in os.listdir('.') if 'bg' in f.lower() and f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))]
            logging.info(f"Background images found: {bg_images}")
            self.send_json_response(bg_images)
        except Exception as e:
            logging.error(f"Error in handle_list_bg_images: {e}")
            self.send_error(500, f"Internal server error: {str(e)}")

def signal_handler(signum, frame):
    """处理退出信号"""
    logger.info("接收到退出信号，正在关闭服务器...")
    sys.exit(0)

def find_available_port(start_port, max_attempts=10):
    """查找可用端口"""
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue
    raise RuntimeError(f"无法找到可用端口 (尝试范围: {start_port}-{start_port + max_attempts - 1})")

def run_server(start_port=8001):
    try:
        # 设置信号处理
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # 查找可用端口
        port = find_available_port(start_port)
        server_address = ('', port)
        
        # 创建服务器实例
        httpd = socketserver.TCPServer(server_address, SpineFileHandler)
        httpd.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        
        logger.info(f"Server started at http://localhost:{port}")
        logger.info("Press Ctrl+C to stop the server")
        
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("\nShutting down server...")
        httpd.shutdown()
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)
    finally:
        logger.info("Server stopped")

if __name__ == "__main__":
    run_server()
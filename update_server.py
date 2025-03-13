import re; new_run_server = """def run_server(start_port=8001):
    for port in range(start_port, start_port + 10):
        try:
            with socketserver.TCPServer(("", port), SpineFileHandler) as httpd:
                logging.info(f"服务器启动成功！")
                logging.info(f"请访问: http://localhost:{port}")
                logging.info(f"请确保前端代码中的端口配置与服务器端口 {port} 一致")
                httpd.serve_forever()
                break
        except OSError:
            logging.warning(f"端口 {port} 已被占用，尝试下一个端口")
    else:
        logging.error("没有找到可用的端口")
        raise OSError("没有找到可用的端口")
"""; content = open("server.py").read(); new_content = re.sub(r"def run_server.*?serve_forever\(\)
", new_run_server, content, flags=re.DOTALL); open("server.py", "w").write(new_content)

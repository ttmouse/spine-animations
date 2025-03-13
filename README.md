# Spine 动画文件服务器

这是一个简单的 HTTP 服务器，专门用于处理和提供 Spine 动画文件及相关资源。该服务器提供了 API 接口来列出 Spine JSON 文件和背景图片。

## 功能特性

- 提供 Spine 动画文件（.json）的列表
- 提供背景图片文件的列表
- 支持跨域请求（CORS）
- 详细的日志记录

## 技术要求

- Python 3.x
- 标准库依赖：
  - http.server
  - socketserver
  - json
  - os
  - logging

## 安装说明

1. 确保您的系统已安装 Python 3.x
2. 克隆或下载本项目到本地

## 使用方法

1. 启动服务器：

```bash
python server.py
```

服务器将在 http://localhost:8001 启动

2. 可用的 API 端点：

- 获取 Spine 文件列表：
  ```
  GET http://localhost:8001/list-spine-files
  ```

- 获取背景图片列表：
  ```
  GET http://localhost:8001/list-bg-images
  ```

## API 响应格式

所有 API 响应都以 JSON 格式返回：

- `/list-spine-files` - 返回所有 .json 文件的列表
- `/list-bg-images` - 返回所有图片文件列表（支持 .png, .jpg, .jpeg, .gif）

## 日志记录

服务器包含详细的日志记录功能，记录所有请求和操作，便于调试和监控。

## 注意事项

- 服务器默认运行在 8001 端口
- 确保 Spine 文件和背景图片放在服务器运行的目录中
- 所有 API 响应都启用了 CORS，支持跨域访问

## 贡献

欢迎提交问题和改进建议！

## 许可证

[MIT License](LICENSE) 
# 国内用户自动更新服务器配置指南

由于国内用户无法直接访问 GitHub，需要配置国内更新源以支持自动更新功能。

---

## 🌐 **方案对比**

| 方案 | 成本 | 难度 | 速度 | 稳定性 | 推荐度 |
|------|------|------|------|--------|--------|
| **方案1: GitHub 加速镜像** | 免费 | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **方案2: 阿里云 OSS** | ¥5-20/月 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **方案3: 腾讯云 COS** | ¥5-20/月 | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **方案4: 自建服务器** | ¥50+/月 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

---

## 📋 **方案 1: GitHub 加速镜像（免费，快速部署）**

### **优点**
- ✅ 完全免费
- ✅ 无需配置服务器
- ✅ 5 分钟即可完成

### **缺点**
- ⚠️ 依赖第三方服务
- ⚠️ 速度可能不稳定

### **配置步骤**

**1. 应用已自动检测中文用户**

应用会自动检测系统语言，中文用户（`zh-CN`、`zh-TW`）会自动使用 GitHub 加速镜像。

**2. 验证配置**

启动应用后，查看日志：
```
使用 GitHub 加速镜像: https://mirror.ghproxy.com/...
```

**3. 手动强制启用（可选）**

如果需要在非中文系统上使用代理：

```bash
# macOS/Linux
export USE_UPDATE_PROXY=true

# Windows (PowerShell)
$env:USE_UPDATE_PROXY="true"

# 然后启动应用
```

---

## 📋 **方案 2: 阿里云 OSS（推荐，最佳体验）**

### **优点**
- ✅ 国内访问速度极快
- ✅ 高度稳定可靠
- ✅ 支持 CDN 加速
- ✅ 成本低廉（约 ¥5-10/月）

### **配置步骤**

#### **1. 创建 OSS 存储桶**

1. 登录[阿里云控制台](https://oss.console.aliyun.com/)
2. 创建 Bucket：
   - 名称：`videotool-updates`（自定义）
   - 区域：选择离用户最近的区域
   - 读写权限：**公共读**
3. 开启 CDN 加速（可选）

#### **2. 配置 GitHub Actions 自动同步**

创建 `.github/workflows/sync-oss.yml`：

```yaml
name: Sync to Aliyun OSS

on:
  release:
    types: [published]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Download Release Assets
        uses: actions/download-artifact@v4
        with:
          path: ./release-assets

      - name: Setup OSS Util
        run: |
          wget http://gosspublic.alicdn.com/ossutil/1.7.15/ossutil64
          chmod +x ossutil64
          ./ossutil64 config -e ${{ secrets.OSS_ENDPOINT }} \
                              -i ${{ secrets.OSS_ACCESS_KEY_ID }} \
                              -k ${{ secrets.OSS_ACCESS_KEY_SECRET }}

      - name: Upload to OSS
        run: |
          ./ossutil64 cp -r ./release-assets oss://videotool-updates/releases/${{ github.ref_name }}/ -f
```

#### **3. 配置应用使用 OSS**

修改 `package.json`：

```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "binbin1213",
        "repo": "VideoTool"
      },
      {
        "provider": "generic",
        "url": "https://videotool-updates.oss-cn-shanghai.aliyuncs.com/releases"
      }
    ]
  }
}
```

或通过环境变量：

```bash
# macOS/Linux
export CUSTOM_UPDATE_URL="https://videotool-updates.oss-cn-shanghai.aliyuncs.com/releases"

# Windows
set CUSTOM_UPDATE_URL=https://videotool-updates.oss-cn-shanghai.aliyuncs.com/releases
```

#### **4. 上传文件结构**

OSS 中的文件结构应为：

```
oss://videotool-updates/
└── releases/
    ├── latest-mac.yml
    ├── latest.yml
    ├── VideoTool-1.0.3-arm64.dmg
    ├── VideoTool-1.0.3-x64.dmg
    ├── VideoTool-1.0.3-universal.dmg
    ├── VideoTool Setup 1.0.3.exe
    └── VideoTool 1.0.3.exe
```

---

## 📋 **方案 3: 腾讯云 COS（与 OSS 类似）**

### **配置步骤**

1. 登录[腾讯云控制台](https://console.cloud.tencent.com/cos)
2. 创建存储桶，权限设为**公有读私有写**
3. 配置 GitHub Actions 使用 COSCMD
4. 修改 `CUSTOM_UPDATE_URL` 为 COS 地址

---

## 📋 **方案 4: 自建服务器（高级）**

### **适用场景**
- 已有服务器
- 需要完全控制

### **配置步骤**

1. 在服务器上部署 Nginx
2. 配置静态文件服务
3. 设置 CORS 头（electron-updater 需要）
4. 使用 GitHub Actions 自动部署

**Nginx 配置示例**：

```nginx
server {
    listen 80;
    server_name updates.yourdomain.com;
    
    location /releases/ {
        root /var/www/videotool;
        autoindex on;
        
        # CORS 配置
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS';
    }
}
```

---

## 🔍 **验证更新源是否生效**

### **1. 查看应用日志**

应用启动时会输出：
```
使用自定义更新源: https://your-cdn-url
```

### **2. 手动测试**

访问以下 URL：
```
https://your-cdn-url/latest-mac.yml
https://your-cdn-url/latest.yml
```

应该能看到更新信息文件。

### **3. 在应用中测试**

1. 进入"关于"页面
2. 点击"检查更新"
3. 查看是否能成功检测到更新

---

## 💡 **推荐配置（最佳实践）**

### **个人开发者**
- 使用**方案 1**（GitHub 加速镜像）
- 零成本，快速部署

### **小团队/公司**
- 使用**方案 2**（阿里云 OSS）
- 每月成本 ¥5-20
- 最佳用户体验

### **大型项目**
- 使用**方案 2 + 方案 1** 双源策略
- OSS 为主，GitHub 镜像为备用
- 最高可用性

---

## 🚀 **快速开始（推荐方案 1）**

当前应用已默认配置方案 1，**无需任何操作**即可支持国内用户！

中文用户自动使用 GitHub 加速镜像：
- ✅ 自动检测系统语言
- ✅ 自动切换到加速源
- ✅ 零配置，开箱即用

---

## 📞 **需要帮助？**

如果在配置过程中遇到问题，请：
- 查看应用日志文件
- 提交 Issue 到 GitHub
- 联系开发者：piaozhitian@gmail.com


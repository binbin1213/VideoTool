# 阿里云 OSS 配置教程（5 分钟完成）

**适用于：** 完全不懂 CDN 的开发者  
**成本：** 约 ¥5-10/月（流量很少的话可能不到 ¥5）  
**效果：** 国内用户秒速下载更新

---

## 📋 **第一步：注册阿里云（已有账号跳过）**

1. 访问：https://www.aliyun.com/
2. 点击「免费注册」
3. 实名认证（必须，否则无法使用 OSS）

---

## 📋 **第二步：开通 OSS 服务**

1. 访问：https://oss.console.aliyun.com/
2. 首次进入会提示「开通 OSS 服务」，点击开通
3. 按量付费即可（不用担心，流量很少）

---

## 📋 **第三步：创建存储桶（Bucket）**

1. 在 OSS 控制台，点击「创建 Bucket」
2. 填写信息：
   - **Bucket 名称**：`videotool-updates`（或任意名称）
   - **地域**：选择离你最近的（如：华东1-杭州）
   - **读写权限**：选择「公共读」⚠️ 重要！
   - **存储类型**：标准存储
   - 其他默认即可
3. 点击「确定」

---

## 📋 **第四步：创建 GitHub Secrets**

1. 访问：https://github.com/binbin1213/VideoTool/settings/secrets/actions
2. 点击「New repository secret」，创建 3 个密钥：

### **密钥 1: OSS_ENDPOINT**
- Name: `OSS_ENDPOINT`
- Value: `oss-cn-hangzhou.aliyuncs.com` 
  - （如果你选的是其他地域，改成对应的，如上海是 `oss-cn-shanghai.aliyuncs.com`）

### **密钥 2: OSS_ACCESS_KEY_ID**
1. 访问：https://ram.console.aliyun.com/manage/ak
2. 点击「创建 AccessKey」
3. 复制 **AccessKey ID**，粘贴到 GitHub Secret

### **密钥 3: OSS_ACCESS_KEY_SECRET**
- 复制刚才的 **AccessKey Secret**，粘贴到 GitHub Secret

---

## 📋 **第五步：修改 GitHub Actions 配置**

创建文件 `.github/workflows/upload-oss.yml`：

```yaml
name: Upload to OSS

on:
  release:
    types: [published]

jobs:
  upload:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download Release Assets
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          TAG_NAME="${{ github.event.release.tag_name }}"
          echo "下载 Release: $TAG_NAME"
          
          # 获取所有资产
          gh release download "$TAG_NAME" --dir ./release-assets

      - name: Setup OSS Util
        run: |
          wget http://gosspublic.alicdn.com/ossutil/1.7.18/ossutil64
          chmod +x ossutil64
          ./ossutil64 config -e ${{ secrets.OSS_ENDPOINT }} \
                              -i ${{ secrets.OSS_ACCESS_KEY_ID }} \
                              -k ${{ secrets.OSS_ACCESS_KEY_SECRET }}

      - name: Upload to OSS
        run: |
          # 上传所有文件到 OSS
          ./ossutil64 cp -r ./release-assets oss://videotool-updates/releases/ -f -u
          
          echo "✅ 上传完成！"
          echo "访问地址: https://videotool-updates.oss-cn-hangzhou.aliyuncs.com/releases/"
```

**注意：** 把 `videotool-updates` 改成你第三步创建的 Bucket 名称！

---

## 📋 **第六步：告诉应用使用 OSS**

修改 `package.json`，在 `build` 配置中添加：

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
        "url": "https://videotool-updates.oss-cn-hangzhou.aliyuncs.com/releases"
      }
    ]
  }
}
```

---

## ✅ **完成！测试一下**

1. 提交代码：`git add -A && git commit -m "feat: 添加 OSS 自动上传"`
2. 发布新版本：`npm version patch && git push --follow-tags`
3. 等待 GitHub Actions 完成
4. 打开应用，点击「检查更新」
5. 国内用户应该可以秒速下载了！

---

## 💰 **费用参考**

- **存储费用**：约 ¥0.12/GB/月（100MB 才 ¥0.012）
- **流量费用**：约 ¥0.50/GB（1000 次下载 100MB = 100GB = ¥50）
- **请求费用**：几乎可以忽略

**实际成本**：如果每月 100 次下载（每个 100MB），总费用约 **¥5-8/月**

---

## ❓ **常见问题**

### Q1: 我不想花钱怎么办？
**A:** 可以不配置，国内用户需要自己想办法访问 GitHub。

### Q2: 能不能更便宜？
**A:** 可以！阿里云新用户有优惠券，首月可能只要 ¥1-2。

### Q3: 我配置错了怎么办？
**A:** 删除 Bucket 重新创建即可，不会扣费。

### Q4: 如何查看费用？
**A:** 阿里云控制台 → 费用 → 消费明细

---

## 🎯 **总结**

只需 5 步：
1. ✅ 注册阿里云
2. ✅ 开通 OSS
3. ✅ 创建 Bucket
4. ✅ 配置 GitHub Secrets
5. ✅ 添加自动上传脚本

**搞定！** 🎉

有问题随时问我！


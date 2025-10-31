#!/usr/bin/env python3
import re

# 读取文件
with open('src/renderer/components/Features/TranscodeTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 替换所有 legend 标签的 style，改为 display: none
# 匹配模式：<legend style={{ ... }}>
content = re.sub(
    r'<legend style=\{\{[^}]+\}\}>',
    '<legend style={{ display: \'none\' }}>',
    content
)

# 写回文件
with open('src/renderer/components/Features/TranscodeTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 已隐藏所有 legend 标题")

# 同样处理 SubtitleConvertTab
with open('src/renderer/components/Features/SubtitleConvertTab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'<legend style=\{\{[^}]+\}\}>',
    '<legend style={{ display: \'none\' }}>',
    content
)

with open('src/renderer/components/Features/SubtitleConvertTab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 已隐藏 SubtitleConvertTab 的所有 legend 标题")


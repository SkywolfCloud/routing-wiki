import os
import re

def remove_code_blocks(text):
    """移除 Markdown 中的代码块（```...```）"""
    return re.sub(r"```[\s\S]*?```", "", text)

def remove_blockquotes(text):
    """移除 Markdown 中的引用块（> 开头的行）"""
    return "\n".join(line for line in text.splitlines() if not line.strip().startswith(">"))

def count_characters(text, only_chinese=False):
    """统计字符数。若 only_chinese=True，则只统计中文字符"""
    if only_chinese:
        chars = re.findall(r'[\u4e00-\u9fa5]', text)
        return len(chars)
    else:
        return len(text.replace('\n', '').replace(' ', ''))

total_chars = 0
root_dir = "."

for dirpath, _, filenames in os.walk(root_dir):
    for filename in filenames:
        if filename.endswith(".md") or filename.endswith(".mdx"):
            filepath = os.path.join(dirpath, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    content = remove_code_blocks(content)
                    content = remove_blockquotes(content)
                    count = count_characters(content)  # 改为 only_chinese=True 可只算中文
                    total_chars += count
                    print(f"{filepath}: {count} 字符")
            except Exception as e:
                print(f"无法读取 {filepath}: {e}")

print(f"\n✅ 总字数（去掉代码块和引用）: {total_chars}")

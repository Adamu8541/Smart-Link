import os
import re

# Approved Palette:
# #0F2D5C, #17407E, #F5F7FA, #4B5563, #111827, #E5E7EB, #FFFFFF, #6B7280, #9CA3AF

# Regex to catch banned colors
# Includes Tailwind utilities and box-shadow utilities referencing banned colors
banned_color_pattern = re.compile(r'\b(bg|text|border|ring|fill|stroke|divide|shadow)-(blue|slate|emerald|red|green|purple|indigo|amber|rose|cyan|teal|yellow|pink|gray|black)-[0-9]{1,3}(/[0-9]+)?\b')
hex_color_pattern = re.compile(r'#(?!0F2D5C|17407E|F5F7FA|4B5563|111827|E5E7EB|FFFFFF|6B7280|9CA3AF)[0-9a-fA-F]{6}\b')

def replace_banned_color(match):
    prop = match.group(1)
    
    # If it's a shadow, remove it or replace with generic shadow
    if prop == 'shadow':
        return "shadow-none"
        
    return f"{prop}-transparent"

count = 0
for root, _, files in os.walk('src/components'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = banned_color_pattern.sub(replace_banned_color, content)
            new_content = hex_color_pattern.sub('#0F2D5C', new_content)

            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Normalized: {filepath}")
                count += 1

print(f"Normalization complete! Total files updated: {count}")

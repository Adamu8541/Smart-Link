import os
import re

# Approved Palette:
# #0F2D5C, #17407E, #F5F7FA, #4B5563, #111827, #E5E7EB, #FFFFFF, #6B7280, #9CA3AF

# Regex to catch banned colors
# Matches slate-XXX, blue-XXX, green-XXX, etc., and unapproved hex codes
# This is a broad regex designed to be used with extreme caution.
banned_color_pattern = re.compile(r'\b(bg|text|border|ring|fill|stroke|divide)-(blue|slate|emerald|red|green|purple|indigo|amber|rose|cyan|teal|yellow|pink|gray|black)-[0-9]{1,3}(/[0-9]+)?\b')
hex_color_pattern = re.compile(r'#(?!0F2D5C|17407E|F5F7FA|4B5563|111827|E5E7EB|FFFFFF|6B7280|9CA3AF)[0-9a-fA-F]{6}\b')

# Mapping for common replacements
color_replacements = {
    'slate': '#6B7280',
    'blue': '#0F2D5C',
    'emerald': '#0F2D5C',
    'red': '#0F2D5C',
    'green': '#0F2D5C',
    'purple': '#0F2D5C',
    'indigo': '#0F2D5C',
    'amber': '#0F2D5C',
    'rose': '#0F2D5C',
    'cyan': '#0F2D5C',
    'teal': '#0F2D5C',
    'yellow': '#0F2D5C',
    'pink': '#0F2D5C',
    'gray': '#6B7280',
    'black': '#111827',
}

def replace_banned_color(match):
    # This is a simplistic replacement. 
    # Real world requires better context awareness, but this is a forced cleanup.
    prop = match.group(1)
    color = match.group(2)
    # Map to approved color based on utility
    new_hex = color_replacements.get(color, '#6B7280')
    return f"{prop}-[ {new_hex} ]".replace(" ", "")

count = 0
for root, _, files in os.walk('src/components'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = banned_color_pattern.sub(replace_banned_color, content)
            # Simplistic hex replacement: 
            # Force replace with primary if it's an unrecognized hex
            new_content = hex_color_pattern.sub('#0F2D5C', new_content)

            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Normalized: {filepath}")
                count += 1

print(f"Normalization complete! Total files updated: {count}")

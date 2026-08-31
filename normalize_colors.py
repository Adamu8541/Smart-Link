import os
import re

# Approved Palette:
# #0F2D5C, #17407E, #F5F7FA, #4B5563, #111827, #E5E7EB, #FFFFFF, #6B7280, #9CA3AF

# Define a strict mapping for banned colors
# We map them to the closest approved neutral or primary color.

replacements = [
    # 1. Neutral/Slate/Gray mappings
    (r'\b(bg|text|border|ring|from|to|via)-(slate|gray|neutral|stone|zinc|gray)-(50|100)\b', r'\1-[#F5F7FA]'),
    (r'\b(bg|text|border|ring|from|to|via)-(slate|gray|neutral|stone|zinc|gray)-(200|300)\b', r'\1-[#E5E7EB]'),
    (r'\b(bg|text|border|ring|from|to|via)-(slate|gray|neutral|stone|zinc|gray)-400\b', r'\1-[#9CA3AF]'),
    (r'\b(bg|text|border|ring|from|to|via)-(slate|gray|neutral|stone|zinc|gray)-500\b', r'\1-[#6B7280]'),
    (r'\b(bg|text|border|ring|from|to|via)-(slate|gray|neutral|stone|zinc|gray)-(600|700)\b', r'\1-[#4B5563]'),
    (r'\b(bg|text|border|ring|from|to|via)-(slate|gray|neutral|stone|zinc|gray)-(800|900|950)\b', r'\1-[#111827]'),

    # 2. Functional Color mappings (Blue/Indigo/Purple/Pink/Emerald/Rose/Cyan/Teal/Yellow)
    # Map to primary #0F2D5C, #17407E, or neutral as appropriate.
    (r'\b(bg|text|border|ring|from|to|via)-(blue|indigo|purple|pink|emerald|rose|cyan|teal|yellow|amber|green|red)-(50|100)\b', r'\1-[#F5F7FA]'),
    (r'\b(bg|text|border|ring|from|to|via)-(blue|indigo|purple|pink|emerald|rose|cyan|teal|yellow|amber|green|red)-(200|300)\b', r'\1-[#E5E7EB]'),
    (r'\b(bg|text|border|ring|from|to|via)-(blue|indigo|purple|pink|emerald|rose|cyan|teal|yellow|amber|green|red)-(400|500)\b', r'\1-[#6B7280]'),
    (r'\b(bg|text|border|ring|from|to|via)-(blue|indigo|purple|pink|emerald|rose|cyan|teal|yellow|amber|green|red)-(600|700|800|900|950)\b', r'\1-[#0F2D5C]'),
    
    # 3. Direct dark-mode replacements:
    (r'dark:bg-slate-900', 'dark:bg-[#111827]'),
    (r'dark:bg-slate-950', 'dark:bg-[#111827]'),
    (r'dark:bg-slate-800', 'dark:bg-[#111827]'),
    (r'dark:border-slate-800', 'dark:border-[#E5E7EB]'),
    (r'dark:border-slate-700', 'dark:border-[#E5E7EB]'),
    (r'dark:text-slate-200', 'dark:text-[#E5E7EB]'),
    (r'dark:text-slate-300', 'dark:text-[#E5E7EB]'),
    (r'dark:text-slate-400', 'dark:text-[#6B7280]'),
]

directories = ['src', 'index.html']

compiled_replacements = [(re.compile(pat), rep) for pat, rep in replacements]

count = 0
for directory in directories:
    if os.path.isfile(directory):
        files = [directory]
        root = '.'
    else:
        files = []
        for r, _, f in os.walk(directory):
            for file in f:
                files.append(os.path.join(r, file))

    for filepath in files:
        if filepath.endswith(('.tsx', '.ts', '.css', '.html')):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            new_content = content
            for pattern, rep in compiled_replacements:
                new_content = pattern.sub(rep, new_content)

            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Normalized: {filepath}")
                count += 1

print(f"Normalization complete! Total files updated: {count}")

import os
import re

# Approved Palette:
# #0F2D5C, #17407E, #F5F7FA, #4B5563, #111827, #E5E7EB, #FFFFFF, #6B7280, #9CA3AF

replacements = [
    # 1. Slate/gray/neutral/stone/zinc
    (r'\b(bg|text|border|ring|from|to|via)-(slate|gray|neutral|stone|zinc)-50\b', r'\1-[#F5F7FA]'),
    (r'\b(bg|text|border|ring|from|to|via)-(slate|gray|neutral|stone|zinc)-(100|200|300)\b', r'\1-[#E5E7EB]'),
    (r'\b(bg|text|border|ring|from|to|via)-(slate|gray|neutral|stone|zinc)-400\b', r'\1-[#9CA3AF]'),
    (r'\b(bg|text|border|ring|from|to|via)-(slate|gray|neutral|stone|zinc)-500\b', r'\1-[#6B7280]'),
    (r'\b(bg|text|border|ring|from|to|via)-(slate|gray|neutral|stone|zinc)-(600|700)\b', r'\1-[#4B5563]'),
    (r'\b(bg|text|border|ring|from|to|via)-(slate|gray|neutral|stone|zinc)-(800|900|950)\b', r'\1-[#111827]'),

    # 2. Blue, sky, teal, indigo, purple, emerald, green (mapped to primary #0F2D5C, #17407E, or neutral)
    (r'\bbg-(blue|indigo|purple|cyan|teal|sky|emerald|green|rose|red|amber|yellow|orange)-50\b', r'bg-[#F5F7FA]'),
    (r'\bbg-(blue|indigo|purple|cyan|teal|sky|emerald|green|rose|red|amber|yellow|orange)-(100|200|300)\b', r'bg-[#E5E7EB]'),
    (r'\bbg-(blue|indigo|purple|cyan|teal|sky|emerald|green|rose|red|amber|yellow|orange)-(400|500|600|700|800|900|950)\b', r'bg-[#0F2D5C]'),
    
    (r'\btext-(blue|indigo|purple|cyan|teal|sky|emerald|green|rose|red|amber|yellow|orange)-(50|100|200|300|400)\b', r'text-[#9CA3AF]'),
    (r'\btext-(blue|indigo|purple|cyan|teal|sky|emerald|green|rose|red|amber|yellow|orange)-(500|600|700|800|900|950)\b', r'text-[#0F2D5C]'),
    
    (r'\bborder-(blue|indigo|purple|cyan|teal|sky|emerald|green|rose|red|amber|yellow|orange)-(50|100|200|300|400)\b', r'border-[#E5E7EB]'),
    (r'\bborder-(blue|indigo|purple|cyan|teal|sky|emerald|green|rose|red|amber|yellow|orange)-(500|600|700|800|900|950)\b', r'border-[#0F2D5C]'),

    (r'\bring-(blue|indigo|purple|cyan|teal|sky|emerald|green|rose|red|amber|yellow|orange)-(500|600|700|800|900|950)\b', r'ring-[#0F2D5C]'),
    (r'\b(from|to|via)-(blue|indigo|purple|cyan|teal|sky|emerald|green|rose|red|amber|yellow|orange)-(400|500|600|700|800|900|950)\b', r'\1-[#0F2D5C]'),

    # 3. Direct dark-mode dark/slate replacements:
    (r'dark:bg-slate-900', 'dark:bg-[#111827]'),
    (r'dark:bg-slate-950', 'dark:bg-[#111827]'),
    (r'dark:bg-slate-800', 'dark:bg-[#111827]'),
    (r'dark:bg-slate-950/60', 'dark:bg-[#111827]/60'),
    (r'dark:bg-rose-950/60', 'dark:bg-[#111827]/60'),
    (r'dark:bg-emerald-950/60', 'dark:bg-[#111827]/60'),
    (r'dark:border-slate-800', 'dark:border-[#E5E7EB]'),
    (r'dark:border-slate-700', 'dark:border-[#E5E7EB]'),
    (r'dark:text-slate-200', 'dark:text-[#E5E7EB]'),
    (r'dark:text-slate-300', 'dark:text-[#E5E7EB]'),
    (r'dark:text-slate-400', 'dark:text-[#6B7280]'),
    (r'dark:text-white', 'dark:text-white'),

    # 4. Standard Hover states
    (r'\bhover:bg-slate-50\b', r'hover:bg-[#F5F7FA]'),
    (r'\bhover:bg-slate-100\b', r'hover:bg-[#E5E7EB]'),
    (r'\bhover:bg-slate-200\b', r'hover:bg-[#E5E7EB]'),
    (r'\bhover:bg-slate-800\b', r'hover:bg-[#111827]'),
    (r'\bhover:bg-blue-50\b', r'hover:bg-[#F5F7FA]'),
    (r'\bhover:bg-blue-600\b', r'hover:bg-[#17407E]'),
    (r'\bhover:bg-blue-700\b', r'hover:bg-[#0F2D5C]'),
    (r'\bhover:bg-emerald-600\b', r'hover:bg-[#17407E]'),
    (r'\bhover:bg-rose-600\b', r'hover:bg-[#17407E]'),
    (r'\bhover:text-blue-600\b', r'hover:text-[#0F2D5C]'),
    (r'\bhover:text-blue-700\b', r'hover:text-[#17407E]'),
]

directories = [
    'src/components/admin',
    'src/components/wallet',
    'src/components/verification'
]

compiled_replacements = [(re.compile(pat), rep) for pat, rep in replacements]

count = 0
for directory in directories:
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                filepath = os.path.join(root, file)
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

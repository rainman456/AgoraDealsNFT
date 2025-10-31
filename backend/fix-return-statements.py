#!/usr/bin/env python3
import re
import os
import glob

def fix_return_res_statements(content):
    """Fix 'return res.status()' to 'res.status(); return;'"""
    # Pattern to match return res.status(...).json(...)
    pattern = r'(\s+)return (res\.status\(\d+\)\.json\([^)]+\));'
    
    def replace_func(match):
        indent = match.group(1)
        res_statement = match.group(2)
        return f'{indent}{res_statement};\n{indent}return;'
    
    return re.sub(pattern, replace_func, content)

def fix_unused_variables(content):
    """Prefix unused variables with underscore"""
    # This is complex, we'll handle specific cases
    replacements = [
        ('const walletAddress = req.body.walletAddress || req.user?.walletAddress;\n\n      if (!promotionId || !recipientAddress) {',
         'const _walletAddress = req.body.walletAddress || req.user?.walletAddress;\n\n      if (!promotionId || !recipientAddress) {'),
        ('const { website, email, phone } = req.body;',
         'const { website: _website, email: _email, phone: _phone } = req.body;'),
        ('const { originalPrice, images, terms } = req.body;',
         'const { originalPrice: _originalPrice, images: _images, terms: _terms } = req.body;'),
        ('import { PublicKey } from \'@solana/web3.js\';\nimport { solanaService }',
         'import { solanaService }'),
    ]
    
    for old, new in replacements:
        content = content.replace(old, new)
    
    return content

def process_file(filepath):
    """Process a single TypeScript file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Fix return statements
    content = fix_return_res_statements(content)
    
    # Fix unused variables
    content = fix_unused_variables(content)
    
    # Only write if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed: {filepath}')
        return True
    return False

def main():
    # Process all controller files
    controller_files = glob.glob('src/controllers/*.ts')
    
    fixed_count = 0
    for filepath in controller_files:
        if process_file(filepath):
            fixed_count += 1
    
    # Also process specific other files
    other_files = [
        'src/routes/auth.ts',
        'src/middleware/validation.ts',
    ]
    
    for filepath in other_files:
        if os.path.exists(filepath) and process_file(filepath):
            fixed_count += 1
    
    print(f'\nTotal files fixed: {fixed_count}')

if __name__ == '__main__':
    main()

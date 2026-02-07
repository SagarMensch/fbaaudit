import os
import shutil
import re

# 1. Move missed files
moves = {
    "SettlementFinance.tsx": "pages/worklists",
    "SpotMarket.tsx": "pages/transactions"
}

base_dir = "pages"

for file, target_subdir in moves.items():
    src = os.path.join(base_dir, file)
    dst_dir = target_subdir # already relative to cwd
    dst = os.path.join(dst_dir, file)
    
    if os.path.exists(src):
        if not os.path.exists(dst_dir):
            os.makedirs(dst_dir)
        shutil.move(src, dst)
        print(f"Moved {file} to {dst_dir}")
    else:
        print(f"File {file} not found in {base_dir}, checking if already in destination...")
        if os.path.exists(dst):
             print(f"File already in {dst}")
        else:
             print(f"Warning: {file} not found anywhere!")

# 2. Fix Imports
# Directories to scan
subdirs = ["transactions", "worklists", "master-data", "analytics"]

# Regex for imports
# Capture group 1: quote, group 2: path
import_pattern = re.compile(r'(import .* from [\'"])(.+)([\'"]);?')

def fix_path(path):
    if path.startswith('../'):
        return '../' + path # ../components -> ../../components
    if path.startswith('./'):
        # This is tricky. ./Sidebar -> ../Sidebar (if Sidebar is in pages/Sidebar.tsx)
        # But usually components are in ../components.
        # If it's a sibling file in the SAME new directory, it stays ./
        # If it was a sibling in OLD pages/ directory, it is now ../
        # We need to know where the target is.
        # Heuristic: if it points to a file that was moved to the SAME subdir, keep ./. 
        # If it points to a file in pages/ root (which are largely gone), or another subdir, needs update.
        # Most imports are likely ../components, ../services, ../types.
        # Let's handle explicitly known paths.
        if path.startswith('./components'): return '../' + path # ./components which was valid in pages/ triggers error? No, pages/ didn't have components.
        # Common relative imports from pages/:
        # ../components -> ../../components
        # ./InvoiceDetail -> ./InvoiceDetail (if both moved to transactions)
        # ../services -> ../../services
        # ../types -> ../../types
        # ../utils -> ../../utils
        # ../constants -> ../../constants
        return '../' + path # Default assumption: it was a sibling in pages/, now it's in ../ (other module or missed file)
        
    return path

# Better logic:
# ../xxx -> ../../xxx
# ./xxx -> ../xxx (unless xxx is in same dir)

def process_file(filepath, subdir_name):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_lines = []
    lines = content.split('\n')
    modified = False
    
    for line in lines:
        match = import_pattern.search(line)
        if match:
            prefix = match.group(1)
            path = match.group(2)
            suffix = match.group(3)
            
            new_path = path
            if path.startswith('../'):
                new_path = '../' + path
            elif path.startswith('./'):
                 # Check if the file exists in the current subdir
                 # path is ./SomeFile
                 filename = path[2:] 
                 if filename.endswith('.tsx') or filename.endswith('.ts'):
                     check_path = os.path.join("pages", subdir_name, filename)
                 else:
                     check_path = os.path.join("pages", subdir_name, filename + ".tsx")
                
                 if os.path.exists(check_path):
                     new_path = path # It's a sibling, keep it
                 else:
                     new_path = '../' + path # It was a sibling in pages/, now in parent or other folder
            
            if new_path != path:
                new_line = line.replace(path, new_path)
                new_lines.append(new_line)
                modified = True
                # print(f"Fixed {path} -> {new_path} in {filepath}")
            else:
                new_lines.append(line)
        else:
            new_lines.append(line)
            
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        print(f"Updated {filepath}")

for subdir in subdirs:
    dirpath = os.path.join("pages", subdir)
    if not os.path.exists(dirpath): continue
    
    for filename in os.listdir(dirpath):
        if filename.endswith(".tsx") or filename.endswith(".ts"):
            process_file(os.path.join(dirpath, filename), subdir)

print("Import Fix Complete.")

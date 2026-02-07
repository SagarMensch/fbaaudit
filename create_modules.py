import os

modules = ['ingestion', 'contracts', 'audit', 'disputes', 'finance']
base_path = 'backend/modules'

if not os.path.exists(base_path):
    os.makedirs(base_path)
    print(f"Created {base_path}")

open(os.path.join(base_path, '__init__.py'), 'a').close()

for module in modules:
    module_path = os.path.join(base_path, module)
    if not os.path.exists(module_path):
        os.makedirs(module_path)
        print(f"Created {module_path}")
    
    init_file = os.path.join(module_path, '__init__.py')
    if not os.path.exists(init_file):
        open(init_file, 'a').close()
        print(f"Created {init_file}")

print("Module structure created successfully.")

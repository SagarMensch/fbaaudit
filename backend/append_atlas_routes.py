"""
Quick script to append Atlas routes to app.py
"""

# Read the atlas routes file
with open('atlas_api_routes.py', 'r', encoding='utf-8') as f:
    atlas_routes = f.read()

# Extract only the route definitions (skip the imports and comments at the top)
lines = atlas_routes.split('\n')
start_idx = 0
for i, line in enumerate(lines):
    if '# ATLAS MASTER DATA API ENDPOINTS' in line:
        start_idx = i - 1  # Include the separator line
        break

route_code = '\n'.join(lines[start_idx:])

# Append to app.py
with open('app.py', 'a', encoding='utf-8') as f:
    f.write('\n\n')
    f.write(route_code)

print("[Atlas] Successfully appended routes to app.py")
print(f"[Atlas] Added {len(route_code.split('@app.route'))} endpoints")

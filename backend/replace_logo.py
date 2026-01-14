
import os

file_path = r"c:\Users\sagar\Downloads\newown - Copy\pages\LandingPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Define the start and end of the block to replace
start_marker = '{/* Custom Geometric Wordmark - Replaces Text Font */}'
end_marker = '<div className="h-px w-32'

if start_marker in content and end_marker in content:
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    
    # We want to replace everything from start_marker to before end_marker
    # with the component
    
    new_block = """{/* Custom Geometric Wordmark - Replaces Text Font */}
               <AetherWordmark />
               """
    
    new_content = content[:start_idx] + new_block + content[end_idx:]
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully replaced SVG block.")
else:
    print("Could not find markers.")
    print(f"Start found: {start_marker in content}")
    print(f"End found: {end_marker in content}")

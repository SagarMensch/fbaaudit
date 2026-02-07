from PIL import Image
import os

def remove_white_bg(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        datas = img.getdata()
        
        new_data = []
        for item in datas:
            # Check if pixel is white-ish (tolerance)
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                new_data.append((255, 255, 255, 0)) # Fully transparent
            else:
                new_data.append(item) # Keep original
        
        img.putdata(new_data)
        img.save(output_path, "PNG")
        print(f"Saved transparent image to {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")

# Paths
base_dir = r"c:\Users\sagar\Downloads\newown - Copy\public"
input_file = os.path.join(base_dir, "atlas_logo.png")
output_file = os.path.join(base_dir, "atlas_logo_transparent.png")

remove_white_bg(input_file, output_file)

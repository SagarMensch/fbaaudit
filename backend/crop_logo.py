from PIL import Image
import os

def crop_transparent_image(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        # Get bounding box of non-zero alpha pixels
        bbox = img.getbbox()
        
        if bbox:
            print(f"Original Size: {img.size}")
            print(f"Cropping to BBox: {bbox}")
            cropped_img = img.crop(bbox)
            cropped_img.save(output_path, "PNG")
            print(f"Saved cropped image to {output_path} (Size: {cropped_img.size})")
        else:
            print("Image is fully transparent. Nothing to crop.")
            
    except Exception as e:
        print(f"Error: {e}")

# Paths
base_dir = r"c:\Users\sagar\Downloads\newown - Copy\public"
input_file = os.path.join(base_dir, "atlas_logo_transparent.png")
# Overwrite or create new? Let's overwrite safely.
output_file = os.path.join(base_dir, "atlas_logo_cropped.png")

crop_transparent_image(input_file, output_file)

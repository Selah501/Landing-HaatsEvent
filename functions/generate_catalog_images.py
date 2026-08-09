import fitz
import psycopg2
import os
import json

def process_catalog(pdf_path, db_conn, public_dir):
    os.makedirs(public_dir, exist_ok=True)
    
    cur = db_conn.cursor()
    cur.execute("SELECT id, model FROM products WHERE model IS NOT NULL AND model != '-'")
    products = cur.fetchall()
    # Create a mapping of model -> product_id to ensure we update correctly, and to avoid multiple DB calls.
    # Note: Some models might appear multiple times or have different IDs. We will update all products with that model.
    model_to_ids = {}
    for p_id, model in products:
        if model not in model_to_ids:
            model_to_ids[model] = []
        model_to_ids[model].append(p_id)
        
    models = list(model_to_ids.keys())
    
    doc = fitz.open(pdf_path)
    print(f"Processing {os.path.basename(pdf_path)}, Total pages: {len(doc)}")
    
    mat = fitz.Matrix(2, 2)  # 2x scale for better resolution (roughly 144 DPI)
    
    for i in range(19, len(doc)):
        page = doc[i]
        page_height = page.rect.height
        page_width = page.rect.width
        
        found = []
        for m in models:
            rects = page.search_for(m)
            if rects:
                found.append({'model': m, 'y': rects[0].y0})
                
        if not found:
            continue
            
        # Sort by y-coordinate
        found.sort(key=lambda x: x['y'])
        
        # Cluster by y-coordinate (gap > 150 points means a new section)
        clusters = []
        current_cluster = [found[0]]
        
        for item in found[1:]:
            if item['y'] - current_cluster[-1]['y'] > 150:
                clusters.append(current_cluster)
                current_cluster = [item]
            else:
                current_cluster.append(item)
        clusters.append(current_cluster)
        
        # Determine slice boundaries
        slice_boundaries = []
        for j in range(len(clusters)):
            top = 0 if j == 0 else (clusters[j-1][-1]['y'] + clusters[j][0]['y']) / 2
            bottom = page_height if j == len(clusters) - 1 else (clusters[j][-1]['y'] + clusters[j+1][0]['y']) / 2
            slice_boundaries.append((top, bottom))
            
        # Crop and save images, then update DB
        for j, cluster in enumerate(clusters):
            top, bottom = slice_boundaries[j]
            clip = fitz.Rect(0, top, page_width, bottom)
            pix = page.get_pixmap(matrix=mat, clip=clip)
            
            # Save an image for each model in the cluster
            for item in cluster:
                model = item['model']
                safe_model = model.replace('/', '_').replace(' ', '')
                filename = f"{safe_model}.png"
                filepath = os.path.join(public_dir, filename)
                
                # Save only if it doesn't exist, or just overwrite it
                pix.save(filepath)
                
                # Update DB
                image_url = f"/catalog_images/{filename}"
                
                # We need to update details->level1->images
                # In PostgreSQL, we can use jsonb_set. If level1 doesn't exist, we need to create it.
                for p_id in model_to_ids[model]:
                    # Check existing details
                    cur.execute("SELECT details FROM products WHERE id = %s", (p_id,))
                    details = cur.fetchone()[0] or {}
                    
                    if 'level1' not in details:
                        details['level1'] = {}
                    
                    details['level1']['images'] = [image_url]
                    
                    cur.execute("UPDATE products SET details = %s WHERE id = %s", (json.dumps(details), p_id))
        
        db_conn.commit()
        print(f"Page {i+1}: Processed {len(clusters)} slices containing {[c['model'] for cl in clusters for c in cl]}")

def main():
    pdf_haatz = r"C:\Users\user\.gemini\antigravity-ide\brain\d1a64dd4-4ea3-464d-b20b-1b118e6e30fd\.tempmediaStorage\media_d1a64dd4-4ea3-464d-b20b-1b118e6e30fd_1785810344587.pdf"
    pdf_himpel = r"C:\Users\user\.gemini\antigravity-ide\brain\d1a64dd4-4ea3-464d-b20b-1b118e6e30fd\.tempmediaStorage\media_d1a64dd4-4ea3-464d-b20b-1b118e6e30fd_1785810409646.pdf"
    public_dir = r"c:\dev\전단지이벤트\landing\public\catalog_images"
    
    conn = psycopg2.connect("postgresql://postgres.belchthacupzpgxevecx:lSUR7jziVlaqSAEz@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres")
    
    print("--- Processing Haatz Catalog ---")
    process_catalog(pdf_haatz, conn, public_dir)
    
    print("--- Processing Himpel Catalog ---")
    process_catalog(pdf_himpel, conn, public_dir)
    
    conn.close()
    print("Done!")

if __name__ == "__main__":
    main()

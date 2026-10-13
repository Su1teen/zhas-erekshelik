import email, email.policy, glob, os, re, html, json, sys, shutil
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding='utf-8')

src_dir = r'c:\moms\Psihologiya\Psihologiya\Psihologiya'
out_dir = r'c:\moms\book1-zhas-erekshelik'
assets_dir = os.path.join(out_dir, 'public', 'assets', 'images')
os.makedirs(assets_dir, exist_ok=True)
data_dir = os.path.join(out_dir, 'src', 'data')
os.makedirs(data_dir, exist_ok=True)

# Copy original static images
for img_name in ['1.jpg', '1.png']:
    src_img = os.path.join(src_dir, 'img', img_name)
    if os.path.exists(src_img):
        dst_img = os.path.join(assets_dir, img_name)
        open(dst_img, 'wb').write(open(src_img, 'rb').read())
        print(f"Copied static image: {img_name}")

def clean_html_content(raw_html, file_id):
    # Remove XML comments and mso junk
    raw_html = re.sub(r'<!--\[if.*?<!\[endif\]-->', '', raw_html, flags=re.S)
    raw_html = re.sub(r'<!--.*?-->', '', raw_html, flags=re.S)
    
    soup = BeautifulSoup(raw_html, 'html.parser')
    
    # Remove style, script, head, meta, link tags
    for tag in soup(['style', 'script', 'meta', 'link', 'xml', 'o:p', 'w:data']):
        tag.decompose()
        
    body = soup.find('body')
    if not body:
        body = soup
        
    # Process images: look for img tags
    img_counter = 0
    for img in body.find_all('img'):
        src = img.get('src', '')
        if src.startswith('cid:') or src.startswith('file:') or not src.startswith('http'):
            img_counter += 1
            # Image was extracted separately by filename or cid
            # We'll map it to assets/images/
            img_basename = os.path.basename(src).split('?')[0]
            if img_basename:
                img['src'] = f'./assets/images/{img_basename}'
            else:
                img['src'] = f'./assets/images/{file_id}_img{img_counter}.png'
        img['class'] = 'book-illustration'
        img['loading'] = 'lazy'

    # Clean attributes on elements: remove inline font-family, mso styles
    for el in body.find_all(True):
        # Keep id, src, href, colspan, rowspan
        attrs_to_keep = {}
        for attr in ['id', 'src', 'href', 'colspan', 'rowspan', 'alt', 'title']:
            if el.has_attr(attr):
                attrs_to_keep[attr] = el[attr]
        # Preserve text alignment if present
        style = el.get('style', '')
        align = el.get('align', '')
        cls = []
        if 'center' in style or align == 'center':
            cls.append('text-center')
        elif 'right' in style or align == 'right':
            cls.append('text-right')
        elif 'justify' in style or align == 'justify':
            cls.append('text-justify')
        if cls:
            attrs_to_keep['class'] = ' '.join(cls)
            
        el.attrs = attrs_to_keep

    # Remove empty paragraphs
    for p in body.find_all(['p', 'span', 'div']):
        if p.find_all(['img', 'table']):
            continue
        empty = (not p.text) if p.name == 'span' else (not p.text.strip())
        if empty:
            p.decompose()

    # Extract first heading/title
    first_title = ""
    for elem in body.find_all(['h1', 'h2', 'h3', 'p', 'b', 'strong']):
        txt = elem.get_text().strip()
        if len(txt) > 3 and not first_title:
            first_title = txt
            break
            
    content_html = "".join(str(c) for c in body.children if str(c).strip())
    return first_title, content_html

def parse_mht(file_path, file_id):
    msg = email.message_from_binary_file(open(file_path, 'rb'), policy=email.policy.default)
    html_raw = ""
    img_idx = 0
    for part in msg.walk():
        ct = part.get_content_type()
        if ct.startswith('image/'):
            img_idx += 1
            ext = ct.split('/')[1]
            if ext == 'jpeg': ext = 'jpg'
            loc = part.get('Content-Location', '') or part.get_filename() or f'{file_id}_img{img_idx}.{ext}'
            img_filename = os.path.basename(loc)
            if not img_filename or img_filename.endswith('.htm') or img_filename.endswith('.mht'):
                img_filename = f'{file_id}_img{img_idx}.{ext}'
            payload = part.get_payload(decode=True)
            if payload:
                open(os.path.join(assets_dir, img_filename), 'wb').write(payload)
                print(f"Extracted image: {img_filename} ({len(payload)} bytes)")
        elif ct == 'text/html' and not html_raw:
            charset = part.get_content_charset() or 'utf-8'
            try:
                html_raw = part.get_payload(decode=True).decode(charset, 'replace')
            except Exception:
                html_raw = part.get_payload(decode=True).decode('cp1251', 'replace')
                
    title, clean_html = clean_html_content(html_raw, file_id)
    return title, clean_html

# Sections definitions
sections = [
    {
        "id": "intro",
        "title": "Кіріспе",
        "shortTitle": "Кіріспе",
        "folder": "5",
        "file": "Kirispe.mht",
        "category": "intro"
    }
]

# Lectures 1 to 14
for i in range(1, 15):
    sections.append({
        "id": f"lecture-{i}",
        "shortTitle": f"{i}-дәріс",
        "folder": "1",
        "file": f"{i}.mht",
        "category": "lecture",
        "num": i
    })

# Practicals 1 to 15
for i in range(1, 16):
    sections.append({
        "id": f"practice-{i}",
        "shortTitle": f"{i}-практика",
        "folder": "2",
        "file": f"{i}.mht",
        "category": "practice",
        "num": i
    })

# Self-study tasks 1 to 10
for i in range(1, 11):
    sections.append({
        "id": f"selfwork-{i}",
        "shortTitle": f"{i}-СӨЖ",
        "folder": "3",
        "file": f"{i}.mht",
        "category": "selfwork",
        "num": i
    })

parsed_sections = []
toc = []

for sec in sections:
    fpath = os.path.join(src_dir, sec["folder"], sec["file"])
    if not os.path.exists(fpath):
        print(f"File not found: {fpath}")
        continue
    file_id = f'{sec["category"]}_{sec.get("num", 0)}'
    extracted_title, html_body = parse_mht(fpath, file_id)
    
    # Title = full text of the first paragraph; topic = title without the numbering prefix
    first_p = BeautifulSoup(html_body, 'html.parser').find('p')
    full = re.sub(r'\s+', ' ', first_p.get_text(' ') if first_p else extracted_title).strip()
    full = re.sub(r'\s+([.,:;])', r'\1', full)
    full = re.sub(r'([.:])\s*$', '', full).strip()
    topic = re.sub(r'^(§\s*\d+|№\s*\d+\s*(Практикалық\s*сабақтың\s*тақырыбы|Тақырыбы)?)[\s.:]*', '', full).strip()
    if sec["category"] == "intro":
        full, topic = "Кіріспе", "Кіріспе"
    if not topic:
        topic = full
    clean_title = full

    # Copy the untouched original file so it can be opened / downloaded in the web book
    orig_rel = f'originals/{sec["category"]}/{sec["file"]}'
    orig_dst = os.path.join(out_dir, 'public', orig_rel)
    os.makedirs(os.path.dirname(orig_dst), exist_ok=True)
    shutil.copy2(fpath, orig_dst)

    sec_data = {
        "id": sec["id"],
        "category": sec["category"],
        "categoryName": {
            "intro": "Кіріспе",
            "lecture": "Дәрістер кешені",
            "practice": "Практикалық сабақтар",
            "selfwork": "Өздік жұмыстар (СӨЖ)"
        }[sec["category"]],
        "shortTitle": sec["shortTitle"],
        "title": clean_title,
        "topic": topic,
        "original": "./" + orig_rel,
        "content": html_body
    }
    parsed_sections.append(sec_data)
    toc.append({
        "id": sec["id"],
        "category": sec["category"],
        "shortTitle": sec["shortTitle"],
        "title": clean_title,
        "topic": topic
    })
    print(f"Processed: [{sec['category']}] {clean_title[:70]}")

# Save book1_data.json
open(os.path.join(data_dir, 'book_content.json'), 'w', encoding='utf-8').write(
    json.dumps(parsed_sections, ensure_ascii=False, indent=2)
)
open(os.path.join(data_dir, 'toc.json'), 'w', encoding='utf-8').write(
    json.dumps(toc, ensure_ascii=False, indent=2)
)

# Also copy questions.json into data_dir
q_src = r'c:\moms\web\books\book1-zhas-erekshelik\content\test\questions.json'
if os.path.exists(q_src):
    q_data = json.load(open(q_src, encoding='utf-8'))
    open(os.path.join(data_dir, 'questions.json'), 'w', encoding='utf-8').write(
        json.dumps(q_data, ensure_ascii=False, indent=2)
    )
    print(f"Copied {len(q_data)} questions to data_dir")

print("All Book 1 content successfully converted!")

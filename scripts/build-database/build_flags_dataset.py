#!/usr/bin/env python3
"""
Fetch, parse, classify and curate world flags dataset into data/world_flags.json.

Sources:
1. lipis/flag-icons (GitHub archive for SVGs and country mappings)
2. mledoze/countries (GitHub countries.json for Czech names, capitals, ISO codes)
3. Wikipedia (List of national flags by design & List of flags by color combination)
"""

import os
import sys
import io
import re
import json
import tarfile
import urllib.request
import unicodedata
from xml.etree import ElementTree as ET

def remove_diacritics(s: str) -> str:
    s = s.replace('ß', 'ss')
    return ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))

# 10 vexillological standard color categories
# Each category has RGB centroids / ranges for color matching
COLOR_CATEGORIES = {
    'red': 'Červená',
    'blue': 'Modrá',
    'white': 'Bílá',
    'green': 'Zelená',
    'yellow': 'Žlutá',
    'black': 'Černá',
    'orange': 'Oranžová',
    'cyan': 'Světle modrá',
    'brown': 'Hnědá',
    'purple': 'Fialová'
}

# Standard feature categories
FEATURE_CATEGORIES = {
    'horizontal_stripes': 'Horizontální pruhy',
    'vertical_stripes': 'Vertikální pruhy',
    'diagonal_stripes': 'Diagonální pruhy',
    'cross': 'Kříž',
    'stars': 'Hvězda / Hvězdy',
    'triangle': 'Klín / Trojúhelník',
    'emblem': 'Emblém / Znak',
    'crescent': 'Půlměsíc',
    'sun_circle': 'Slunce / Kruh',
    'canton': 'Kanton'
}

# Known continent mapping
CONTINENT_MAP = {
    'Europe': 'europe',
    'Asia': 'asia',
    'Africa': 'africa',
    'Americas': 'americas',
    'North America': 'americas',
    'South America': 'americas',
    'Oceania': 'oceania',
    'Antarctic': 'antarctic'
}

def hex_to_rgb(hex_str: str):
    hex_str = hex_str.strip().lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join([c*2 for c in hex_str])
    if len(hex_str) != 6:
        return None
    try:
        r = int(hex_str[0:2], 16)
        g = int(hex_str[2:4], 16)
        b = int(hex_str[4:6], 16)
        return (r, g, b)
    except ValueError:
        return None

def classify_rgb(r: int, g: int, b: int) -> str:
    """Classifies an RGB color into one of 10 standard vexillological categories."""
    max_c = max(r, g, b)
    min_c = min(r, g, b)
    diff = max_c - min_c
    brightness = (r * 299 + g * 587 + b * 114) / 1000

    # Black / White / Neutral
    if max_c < 50:
        return 'black'
    if min_c > 210 and diff < 30:
        return 'white'
    if diff < 25:
        return 'white' if brightness > 150 else 'black'

    # Saturated hues
    # Red / Orange / Yellow / Brown
    if r > g and r > b:
        if g > 180 and b < 100:
            return 'yellow'
        if g > 110 and b < 90:
            if brightness < 90:
                return 'brown'
            return 'orange'
        if b > 100 and b > g:
            return 'purple'
        if brightness < 60:
            return 'brown'
        return 'red'

    # Green
    if g > r and g > b:
        if b > 140:
            return 'cyan'
        return 'green'

    # Blue / Cyan / Purple
    if b > r and b > g:
        if r > 120 and r > g:
            return 'purple'
        if g > 150:
            return 'cyan'
        if brightness > 160:
            return 'cyan'
        return 'blue'

    # Yellow
    if r > 180 and g > 180 and b < 120:
        return 'yellow'

    return 'blue' if b > r else 'red'

def extract_colors_from_svg(svg_text: str) -> set:
    """Extracts prominent color categories from SVG fill and stroke attributes."""
    colors = set()
    # Find all hex colors #123456 or #123
    hexes = re.findall(r'#(?:[0-9a-fA-F]{3}){1,2}\b', svg_text)
    # Find named colors
    named = {
        'red': 'red', 'blue': 'blue', 'green': 'green', 'white': 'white',
        'black': 'black', 'yellow': 'yellow', 'gold': 'yellow', 'orange': 'orange',
        'navy': 'blue', 'maroon': 'red', 'purple': 'purple', 'brown': 'brown'
    }
    for match in re.findall(r'(?:fill|stroke|stop-color)="([a-zA-Z]+)"', svg_text):
        if match.lower() in named:
            colors.add(named[match.lower()])

    for h in hexes:
        rgb = hex_to_rgb(h)
        if rgb:
            cat = classify_rgb(*rgb)
            colors.add(cat)
    return colors

def fetch_data():
    print("[1/5] Fetching lipis/flag-icons archive...")
    flag_url = 'https://github.com/lipis/flag-icons/archive/refs/heads/main.tar.gz'
    req = urllib.request.Request(flag_url, headers={'User-Agent': 'SamuelApp/1.0'})
    with urllib.request.urlopen(req) as resp:
        tar_bytes = resp.read()

    svg_4x3_map = {}
    svg_1x1_map = {}
    lipis_countries = []

    with tarfile.open(fileobj=io.BytesIO(tar_bytes), mode='r:gz') as tar:
        for member in tar.getmembers():
            if member.name.endswith('country.json'):
                f = tar.extractfile(member)
                if f:
                    lipis_countries = json.loads(f.read().decode('utf-8'))
            elif '/flags/4x3/' in member.name and member.name.endswith('.svg'):
                code = os.path.basename(member.name).replace('.svg', '').lower()
                f = tar.extractfile(member)
                if f:
                    svg_4x3_map[code] = f.read().decode('utf-8')
            elif '/flags/1x1/' in member.name and member.name.endswith('.svg'):
                code = os.path.basename(member.name).replace('.svg', '').lower()
                f = tar.extractfile(member)
                if f:
                    svg_1x1_map[code] = f.read().decode('utf-8')

    print(f"Loaded {len(svg_4x3_map)} 4x3 SVGs, {len(svg_1x1_map)} 1x1 SVGs, {len(lipis_countries)} lipis country entries")

    print("[2/5] Fetching mledoze/countries database...")
    c_url = 'https://raw.githubusercontent.com/mledoze/countries/master/countries.json'
    req = urllib.request.Request(c_url, headers={'User-Agent': 'SamuelApp/1.0'})
    with urllib.request.urlopen(req) as resp:
        mledoze_data = json.loads(resp.read().decode('utf-8'))
    print(f"Loaded {len(mledoze_data)} countries from mledoze/countries")

    print("[3/5] Fetching Wikipedia design & color classification...")
    wiki_features_by_country = {}
    try:
        w_url = 'https://en.wikipedia.org/w/api.php?action=parse&page=List_of_national_flags_by_design&prop=wikitext&format=json'
        req = urllib.request.Request(w_url, headers={'User-Agent': 'SamuelApp/1.0'})
        with urllib.request.urlopen(req) as resp:
            wiki_data = json.loads(resp.read().decode('utf-8'))
            wikitext = wiki_data['parse']['wikitext']['*']
            # Parse sections and flags mentioned
            sections = re.split(r'==+([^=]+)==+', wikitext)
            current_sec = ""
            for i in range(1, len(sections), 2):
                sec_title = sections[i].strip().lower()
                sec_content = sections[i+1]
                # Find all flag links, e.g. [[Flag of Czech Republic|Czech Republic]] or {{flag|Czechia}}
                flags_found = re.findall(r'\[\[Flag of ([^\]|]+)', sec_content) + re.findall(r'\{\{flag\|([^\}]+)\}\}', sec_content)
                for country_name in flags_found:
                    c_clean = country_name.strip()
                    if c_clean not in wiki_features_by_country:
                        wiki_features_by_country[c_clean] = set()

                    if 'horizontal' in sec_title and 'stripe' in sec_title:
                        wiki_features_by_country[c_clean].add('horizontal_stripes')
                    if 'vertical' in sec_title and 'stripe' in sec_title:
                        wiki_features_by_country[c_clean].add('vertical_stripes')
                    if 'diagonal' in sec_title or 'saltire' in sec_title:
                        wiki_features_by_country[c_clean].add('diagonal_stripes')
                    if 'cross' in sec_title:
                        wiki_features_by_country[c_clean].add('cross')
                    if 'star' in sec_title:
                        wiki_features_by_country[c_clean].add('stars')
                    if 'triangle' in sec_title or 'chevron' in sec_title or 'pall' in sec_title or 'pile' in sec_title:
                        wiki_features_by_country[c_clean].add('triangle')
                    if 'coat of arms' in sec_title or 'emblem' in sec_title or 'seal' in sec_title or 'badge' in sec_title:
                        wiki_features_by_country[c_clean].add('emblem')
                    if 'crescent' in sec_title or 'moon' in sec_title:
                        wiki_features_by_country[c_clean].add('crescent')
                    if 'sun' in sec_title or 'circle' in sec_title:
                        wiki_features_by_country[c_clean].add('sun_circle')
                    if 'canton' in sec_title:
                        wiki_features_by_country[c_clean].add('canton')
    except Exception as e:
        print(f"Warning: could not fetch Wikipedia design: {e}")

    # Build mledoze map by cca2 (lowercase)
    mle_map = {}
    sovereign_codes = set()
    for c in mledoze_data:
        cca2 = c.get('cca2', '').lower()
        if cca2:
            mle_map[cca2] = c
            if c.get('unMember') or cca2 in ['va', 'ps', 'tw', 'xk']:
                sovereign_codes.add(cca2)

    # Curated Czech names dictionary for countries/territories missing or needing better naming
    CZECH_CUSTOM = {
        'cz': ('Česko', 'Praha'),
        'sk': ('Slovensko', 'Bratislava'),
        'pl': ('Polsko', 'Varšava'),
        'de': ('Německo', 'Berlín'),
        'at': ('Rakousko', 'Vídeň'),
        'hu': ('Maďarsko', 'Budapešť'),
        'gb': ('Velká Británie', 'Londýn'),
        'gb-eng': ('Anglie', 'Londýn'),
        'gb-sct': ('Skotsko', 'Edinburgh'),
        'gb-wls': ('Wales', 'Cardiff'),
        'gb-nir': ('Severní Irsko', 'Belfast'),
        'us': ('USA', 'Washington, D.C.'),
        'fr': ('Francie', 'Paříž'),
        'it': ('Itálie', 'Řím'),
        'es': ('Španělsko', 'Madrid'),
        'pt': ('Portugalsko', 'Lisabon'),
        'ch': ('Švýcarsko', 'Bern'),
        'nl': ('Nizozemsko', 'Amsterdam'),
        'be': ('Belgie', 'Brusel'),
        'se': ('Švédsko', 'Stockholm'),
        'no': ('Norsko', 'Oslo'),
        'fi': ('Finsko', 'Helsinky'),
        'dk': ('Dánsko', 'Kodaň'),
        'is': ('Island', 'Reykjavík'),
        'ie': ('Irsko', 'Dublin'),
        'gr': ('Řecko', 'Athény'),
        'tr': ('Turecko', 'Ankara'),
        'ru': ('Rusko', 'Moskva'),
        'ua': ('Ukrajina', 'Kyjev'),
        'by': ('Bělorusko', 'Minsk'),
        'ro': ('Rumunsko', 'Bukurešť'),
        'bg': ('Bulharsko', 'Sofie'),
        'rs': ('Srbsko', 'Bělehrad'),
        'hr': ('Chorvatsko', 'Záhřeb'),
        'si': ('Slovinsko', 'Lublaň'),
        'ba': ('Bosna a Hercegovina', 'Sarajevo'),
        'me': ('Černá Hora', 'Podgorica'),
        'mk': ('Severní Makedonie', 'Skopje'),
        'al': ('Albánie', 'Tirana'),
        'xk': ('Kosovo', 'Priština'),
        'cy': ('Kypr', 'Nikósie'),
        'mt': ('Malta', 'Valletta'),
        'lu': ('Lucembursko', 'Lucemburk'),
        'li': ('Lichtenštejnsko', 'Vaduz'),
        'ad': ('Andorra', 'Andorra la Vella'),
        'mc': ('Monako', 'Monaco'),
        'sm': ('San Marino', 'San Marino'),
        'va': ('Vatikán', 'Vatikán'),
        'jp': ('Japonsko', 'Tokio'),
        'cn': ('Čína', 'Peking'),
        'kr': ('Jižní Korea', 'Soul'),
        'kp': ('Severní Korea', 'Pchjongjang'),
        'in': ('Indie', 'Nové Dillí'),
        'ca': ('Kanada', 'Ottawa'),
        'mx': ('Mexiko', 'Ciudad de México'),
        'br': ('Brazílie', 'Brasília'),
        'ar': ('Argentina', 'Buenos Aires'),
        'cl': ('Chile', 'Santiago de Chile'),
        'au': ('Austrálie', 'Canberra'),
        'nz': ('Nový Zéland', 'Wellington'),
        'za': ('Jihoafrická republika', 'Pretoria'),
        'eg': ('Egypt', 'Káhira'),
        'il': ('Izrael', 'Jeruzalém'),
        'sa': ('Saúdská Arábie', 'Rijád'),
        'ae': ('Spojené arabské emiráty', 'Abú Dhabí'),
        'un': ('OSN', 'New York'),
        'eu': ('Evropská unie', 'Brusel')
    }

    # Curated features for major flags
    CURATED_FEATURES = {
        'cz': ['horizontal_stripes', 'triangle'],
        'sk': ['horizontal_stripes', 'emblem'],
        'pl': ['horizontal_stripes'],
        'de': ['horizontal_stripes'],
        'at': ['horizontal_stripes'],
        'hu': ['horizontal_stripes'],
        'fr': ['vertical_stripes'],
        'it': ['vertical_stripes'],
        'be': ['vertical_stripes'],
        'nl': ['horizontal_stripes'],
        'ro': ['vertical_stripes'],
        'bg': ['horizontal_stripes'],
        'ru': ['horizontal_stripes'],
        'ua': ['horizontal_stripes'],
        'se': ['cross'],
        'no': ['cross'],
        'fi': ['cross'],
        'dk': ['cross'],
        'is': ['cross'],
        'gb': ['cross', 'diagonal_stripes'],
        'gb-eng': ['cross'],
        'gb-sct': ['cross', 'diagonal_stripes'],
        'ch': ['cross'],
        'gr': ['cross', 'horizontal_stripes', 'canton'],
        'us': ['horizontal_stripes', 'stars', 'canton'],
        'ca': ['vertical_stripes', 'emblem'],
        'br': ['diagonal_stripes', 'stars', 'sun_circle'],
        'ar': ['horizontal_stripes', 'sun_circle'],
        'jp': ['sun_circle'],
        'cn': ['stars', 'canton'],
        'kr': ['sun_circle'],
        'in': ['horizontal_stripes', 'sun_circle', 'emblem'],
        'tr': ['crescent', 'stars'],
        'au': ['cross', 'stars', 'canton'],
        'nz': ['cross', 'stars', 'canton'],
        'za': ['horizontal_stripes', 'triangle', 'diagonal_stripes'],
        'il': ['horizontal_stripes', 'stars', 'emblem'],
        'cu': ['horizontal_stripes', 'triangle', 'stars'],
        'ph': ['horizontal_stripes', 'triangle', 'stars', 'sun_circle'],
        'jm': ['diagonal_stripes', 'cross'],
        'np': ['triangle', 'sun_circle', 'crescent', 'emblem'],
        'va': ['vertical_stripes', 'emblem'],
        'es': ['horizontal_stripes', 'emblem'],
        'pt': ['vertical_stripes', 'emblem'],
        'sa': ['emblem'],
        'ae': ['horizontal_stripes', 'vertical_stripes'],
        'eg': ['horizontal_stripes', 'emblem'],
        'dz': ['vertical_stripes', 'crescent', 'stars'],
        'tn': ['crescent', 'stars', 'sun_circle'],
        'pk': ['vertical_stripes', 'crescent', 'stars'],
        'eu': ['stars', 'sun_circle'],
        'un': ['emblem', 'sun_circle']
    }

    # Curated color overrides for precision
    CURATED_COLORS = {
        'cz': ['red', 'white', 'blue'],
        'sk': ['red', 'white', 'blue'],
        'pl': ['red', 'white'],
        'de': ['black', 'red', 'yellow'],
        'at': ['red', 'white'],
        'hu': ['red', 'white', 'green'],
        'fr': ['blue', 'white', 'red'],
        'it': ['green', 'white', 'red'],
        'be': ['black', 'yellow', 'red'],
        'nl': ['red', 'white', 'blue'],
        'lu': ['red', 'white', 'cyan'],
        'ro': ['blue', 'yellow', 'red'],
        'bg': ['white', 'green', 'red'],
        'ru': ['white', 'blue', 'red'],
        'ua': ['cyan', 'yellow'],
        'se': ['blue', 'yellow'],
        'no': ['red', 'white', 'blue'],
        'fi': ['white', 'blue'],
        'dk': ['red', 'white'],
        'is': ['blue', 'white', 'red'],
        'gb': ['red', 'white', 'blue'],
        'ch': ['red', 'white'],
        'gr': ['blue', 'white'],
        'us': ['red', 'white', 'blue'],
        'ca': ['red', 'white'],
        'br': ['green', 'yellow', 'blue', 'white'],
        'ar': ['cyan', 'white', 'yellow'],
        'jp': ['white', 'red'],
        'cn': ['red', 'yellow'],
        'kr': ['white', 'red', 'blue', 'black'],
        'in': ['orange', 'white', 'green', 'blue'],
        'tr': ['red', 'white'],
        'au': ['blue', 'white', 'red'],
        'nz': ['blue', 'white', 'red'],
        'za': ['red', 'blue', 'green', 'yellow', 'black', 'white'],
        'il': ['white', 'blue'],
        'ie': ['green', 'white', 'orange'],
        'es': ['red', 'yellow'],
        'pt': ['green', 'red', 'yellow'],
        'sa': ['green', 'white'],
        'ae': ['red', 'green', 'white', 'black'],
        'eg': ['red', 'white', 'black', 'yellow'],
        'dz': ['green', 'white', 'red'],
        'tn': ['red', 'white'],
        'pk': ['green', 'white'],
        'eu': ['blue', 'yellow'],
        'un': ['cyan', 'white'],
        'va': ['yellow', 'white'],
        'sm': ['white', 'cyan'],
        'mc': ['red', 'white'],
        'id': ['red', 'white'],
        'sg': ['red', 'white'],
        'th': ['red', 'white', 'blue'],
        'vn': ['red', 'yellow'],
        'ph': ['blue', 'red', 'white', 'yellow'],
        'my': ['red', 'white', 'blue', 'yellow'],
        'mx': ['green', 'white', 'red'],
        'co': ['yellow', 'blue', 'red'],
        'cl': ['blue', 'white', 'red'],
        'pe': ['red', 'white'],
        'uy': ['white', 'blue', 'yellow'],
        'cu': ['blue', 'white', 'red'],
        'jm': ['green', 'yellow', 'black']
    }

    print("[4/5] Merging and processing country flags...")
    result_flags = []

    for item in lipis_countries:
        code = item['code'].lower()
        if code not in sovereign_codes:
            continue
        if code not in svg_4x3_map and code not in svg_1x1_map:
            continue

        name_en = item['name']
        capital_en = item.get('capital', '')
        continent_raw = item.get('continent', 'Europe')
        continent = CONTINENT_MAP.get(continent_raw, 'europe')

        mle = mle_map.get(code, {})
        code3 = mle.get('cca3', code.upper()).lower()
        if not code3 or len(code3) != 3:
            code3 = code.upper()

        # Czech name
        name_cs = ""
        capital_cs = ""

        if code in CZECH_CUSTOM:
            name_cs, capital_cs = CZECH_CUSTOM[code]
        elif mle:
            ces_trans = mle.get('translations', {}).get('ces', {})
            name_cs = ces_trans.get('common') or ces_trans.get('official') or name_en
            capitals = mle.get('capital', [])
            capital_cs = capitals[0] if capitals else capital_en
        else:
            name_cs = name_en
            capital_cs = capital_en

        if not capital_cs:
            capital_cs = capital_en

        # Colors extraction & curation
        svg_text = svg_4x3_map.get(code) or svg_1x1_map.get(code, '')
        extracted_cols = extract_colors_from_svg(svg_text)
        
        if code in CURATED_COLORS:
            final_colors = CURATED_COLORS[code]
        else:
            # fallback to extracted colors
            final_colors = sorted(list(extracted_cols))
            if not final_colors:
                final_colors = ['red', 'white']

        # Features extraction & curation
        final_features = set()
        if code in CURATED_FEATURES:
            final_features.update(CURATED_FEATURES[code])
        
        # Check Wikipedia matches
        for cname, feats in wiki_features_by_country.items():
            if (cname.lower() in name_en.lower()) or (name_en.lower() in cname.lower()):
                final_features.update(feats)

        # Minify SVGs (remove xml declaration, doctype, comments, extra whitespace)
        def clean_svg(s: str) -> str:
            s = re.sub(r'<\?xml[^>]+\?>', '', s)
            s = re.sub(r'<!DOCTYPE[^>]+>', '', s)
            s = re.sub(r'<!--.*?-->', '', s, flags=re.DOTALL)
            s = re.sub(r'\s+', ' ', s)
            s = re.sub(r'>\s+<', '><', s)
            return s.strip()

        # Namespace IDs to prevent DOM-wide collisions when multiple SVGs are in the document
        def namespace_svg(svg: str, tag: str) -> str:
            if not svg:
                return ''
            defined_ids = sorted(list(set(re.findall(r'\bid=[\'"]([^\'"]+)[\'"]', svg))), key=len, reverse=True)
            for old_id in defined_ids:
                if old_id.startswith('flag-icons-'):
                    new_id = f"{old_id}-{tag}"
                else:
                    parts = old_id.split('-', 1)
                    if len(parts) == 2:
                        new_id = f"{parts[0]}-{tag}-{parts[1]}"
                    else:
                        new_id = f"{old_id}-{tag}"

                svg = re.sub(r'\bid=([\'"])' + re.escape(old_id) + r'\1', r'id=\1' + new_id + r'\1', svg)
                svg = re.sub(r'url\(([\'"]?)#' + re.escape(old_id) + r'([\'"]?)\)', r'url(\1#' + new_id + r'\2)', svg)
                svg = re.sub(r'((?:xlink:)?href=([\'"])#)' + re.escape(old_id) + r'\2', r'\1' + new_id + r'\2', svg)
            return svg

        svg_4x3_clean = namespace_svg(clean_svg(svg_4x3_map.get(code, '')), '4x3')
        svg_1x1_clean = namespace_svg(clean_svg(svg_1x1_map.get(code, '')), '1x1')

        flag_entry = {
            'code': code,
            'code3': code3,
            'name_cs': name_cs,
            'name_en': name_en,
            'capital_cs': capital_cs,
            'capital_en': capital_en,
            'continent': continent,
            'colors': final_colors,
            'features': sorted(list(final_features)),
            'svg_4x3': svg_4x3_clean,
            'svg_1x1': svg_1x1_clean
        }
        result_flags.append(flag_entry)

    # Sort flags by Czech name alphabetically
    result_flags.sort(key=lambda x: remove_diacritics(x['name_cs']).lower())

    out_file = 'data/world_flags.json'
    print(f"[5/5] Writing {len(result_flags)} flags to {out_file}...")
    os.makedirs('data', exist_ok=True)
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(result_flags, f, ensure_ascii=False, indent=2)

    file_size_kb = os.path.getsize(out_file) / 1024
    print(f"Successfully generated {out_file} ({file_size_kb:.1f} KB, {len(result_flags)} countries)")

if __name__ == '__main__':
    fetch_data()

#!/usr/bin/env python3
"""
Build high-quality Czech substantives dictionary (data/cs_substantives.csv)
using ÚFAL MorfFlex CZ 2.0 morphological dictionary + ČNK frequencies (data/cs_all.csv).

Uses temp/czech-morfflex-2.0.tsv.xz (auto-downloads if not present).
Streams the 235 MB xz archive in memory.

Extracts canonical substantive lemmas (including pluralia tantum like peníze, dveře, kalhoty)
and pairs them with real corpus frequencies.
"""

import os
import sys
import csv
import lzma
import re
import urllib.request
import unicodedata
from typing import Dict, Tuple

MORFFLEX_URL = "https://lindat.mff.cuni.cz/repository/server/api/core/bitstreams/aba9de6f-dfc8-4a83-9659-b11335bc2185/content"
DEFAULT_TEMP_DIR = "temp"
MORFFLEX_FILENAME = "czech-morfflex-2.0.tsv.xz"
OUTPUT_CSV = "data/cs_substantives.csv"
CS_ALL_CSV = "data/cs_all.csv"

def remove_diacritics(s: str) -> str:
    """Removes diacritics and normalizes special characters."""
    s = s.replace('ß', 'ss')
    return ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))

def get_base_lemma(lemma_field: str) -> str:
    """Strips MorfFlex sense numbers, comments and technical suffixes from lemma."""
    clean = re.sub(r'_[^ ]*', '', lemma_field)
    clean = re.sub(r'-[0-9]+', '', clean)
    clean = re.sub(r'`[0-9]+', '', clean)
    return clean.strip()

def download_file_with_progress(url: str, dest_path: str):
    """Downloads a file with a live terminal progress indicator."""
    print(f"Downloading MorfFlex CZ 2.0 from:\n  {url}\nDestination:\n  {dest_path}")
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    tmp_dest = dest_path + ".tmp"
    if os.path.exists(tmp_dest):
        os.remove(tmp_dest)

    def report(count, block_size, total_size):
        downloaded = count * block_size
        if total_size > 0:
            pct = min(100.0, downloaded * 100.0 / total_size)
            mb_down = downloaded / (1024 * 1024)
            mb_total = total_size / (1024 * 1024)
            sys.stdout.write(f"\r  [{pct:5.1f}%] {mb_down:6.1f} MB / {mb_total:6.1f} MB")
        else:
            mb_down = downloaded / (1024 * 1024)
            sys.stdout.write(f"\r  {mb_down:6.1f} MB downloaded")
        sys.stdout.flush()

    try:
        opener = urllib.request.build_opener()
        opener.addheaders = [('User-Agent', 'SamuelPWA-DictionaryBuilder/1.0')]
        urllib.request.install_opener(opener)
        urllib.request.urlretrieve(url, tmp_dest, reporthook=report)
        print()
        os.rename(tmp_dest, dest_path)
        print(f"Download complete: {os.path.getsize(dest_path) / (1024*1024):.2f} MB")
    except Exception as e:
        if os.path.exists(tmp_dest):
            os.remove(tmp_dest)
        raise RuntimeError(f"Download failed: {e}")

def load_cnk_frequencies(cs_all_path: str) -> Dict[str, int]:
    """Loads corpus frequency counts from data/cs_all.csv."""
    if not os.path.exists(cs_all_path):
        print(f"WARNING: {cs_all_path} not found. All words will default to freq=1.")
        return {}

    print(f"Loading corpus frequencies from {cs_all_path}...")
    freq_map: Dict[str, int] = {}
    with open(cs_all_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter=';')
        next(reader, None)
        for row in reader:
            if len(row) < 3:
                continue
            raw_word = row[1].strip().strip('"')
            clean = re.sub(r'[\-\–\—\‑]+', '', raw_word)
            if not clean or not all(c.isalpha() for c in clean):
                continue
            try:
                freq = int(row[2].strip().strip('"'))
            except ValueError:
                continue
            w_lower = clean.lower()
            freq_map[w_lower] = freq_map.get(w_lower, 0) + freq

    print(f"Loaded frequencies for {len(freq_map):,} unique words.")
    return freq_map

def main():
    force = '--force' in sys.argv
    temp_dir = DEFAULT_TEMP_DIR
    for i, arg in enumerate(sys.argv):
        if arg == '--temp-dir' and i + 1 < len(sys.argv):
            temp_dir = sys.argv[i + 1]

    os.makedirs(temp_dir, exist_ok=True)
    xz_path = os.path.join(temp_dir, MORFFLEX_FILENAME)

    if not os.path.exists(xz_path) or force:
        download_file_with_progress(MORFFLEX_URL, xz_path)
    else:
        print(f"Using existing MorfFlex archive: {xz_path} ({os.path.getsize(xz_path) / (1024*1024):.2f} MB)")

    freq_map = load_cnk_frequencies(CS_ALL_CSV)

    print("Streaming MorfFlex CZ 2.0 and extracting substantive lemmas...")
    # Map: word_lower -> dict of info
    # info: {'word': canonical, 'freq': int, 'has_common': bool, 'has_proper': bool}
    substantives: Dict[str, dict] = {}

    lines_processed = 0
    with lzma.open(xz_path, 'rt', encoding='utf-8') as f:
        for line in f:
            lines_processed += 1
            if lines_processed % 10_000_000 == 0:
                print(f"  Processed {lines_processed:,} triples | Candidates found: {len(substantives):,}")

            parts = line.strip().split('\t')
            if len(parts) < 3:
                continue

            lemma_field, tag, wordform = parts[0], parts[1], parts[2]

            # 1. Substantive check
            if not tag.startswith('NN'):
                continue
            # 2. Case 1 (Nominative) check
            if len(tag) < 5 or tag[4] != '1':
                continue
            # 3. Affirmative check
            if len(tag) >= 11 and tag[10] != 'A':
                continue

            clean_word = wordform.strip()
            if not clean_word or not all(c.isalpha() for c in clean_word):
                continue

            base_lemma = get_base_lemma(lemma_field)
            w_lower = clean_word.lower()

            # Lemma check: wordform must match the lemma to exclude inflected forms
            # (e.g. kočka == kočka, peníze == peníze, but psi != pes, auta != auto)
            if base_lemma.lower() != w_lower:
                continue

            is_proper = (
                '_;Y' in lemma_field or
                '_;S' in lemma_field or
                '_;G' in lemma_field or
                '_;E' in lemma_field or
                clean_word[0].isupper()
            )

            freq = freq_map.get(w_lower, 1)

            if w_lower not in substantives:
                substantives[w_lower] = {
                    'common_form': clean_word if not is_proper else None,
                    'proper_form': clean_word if is_proper else None,
                    'freq': freq,
                    'has_common': not is_proper,
                    'has_proper': is_proper
                }
            else:
                item = substantives[w_lower]
                if not is_proper:
                    item['has_common'] = True
                    item['common_form'] = clean_word.lower()
                else:
                    item['has_proper'] = True
                    if not item['proper_form']:
                        item['proper_form'] = clean_word
                item['freq'] = max(item['freq'], freq)

    print(f"\nProcessing extracted entries ({len(substantives):,} candidates)...")
    entries = []

    for w_lower, item in substantives.items():
        freq = item['freq']
        has_common = item['has_common']

        # Determine canonical word and whether it is a proper name
        if has_common:
            # If word exists as a common noun, it is ALWAYS a common noun (lowercase)
            canonical = item['common_form'] or w_lower
            is_name = 0
        else:
            # Exclusively a proper name
            # Filter out obscure foreign non-corpus names (e.g. Aaasen, Aaberg) with freq <= 1
            if freq <= 1:
                continue
            canonical = item['proper_form'] or clean_word.capitalize()
            is_name = 1

        w_nodiac = remove_diacritics(canonical)
        w_nodiac_clean = w_nodiac.lower()
        letters = ''.join(sorted(canonical.lower()))
        letters_nodiac = ''.join(sorted(w_nodiac_clean))
        is_unique_letters = 1 if len(set(canonical.lower())) == len(canonical) else 0
        is_unique_letters_nodiac = 1 if len(set(w_nodiac_clean)) == len(w_nodiac_clean) else 0

        entries.append((
            canonical,
            w_nodiac,
            freq,
            is_name,
            is_unique_letters,
            is_unique_letters_nodiac,
            letters,
            letters_nodiac
        ))

    # Sort primarily by frequency descending, secondarily alphabetically
    entries.sort(key=lambda x: (-x[2], x[0]))

    print(f"Writing {len(entries):,} clean substantives to {OUTPUT_CSV}...")
    with open(OUTPUT_CSV, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            'word',
            'word_nodiac',
            'freq',
            'is_name',
            'is_unique_letters',
            'is_unique_letters_nodiac',
            'letters',
            'letters_nodiac'
        ])
        for row in entries:
            writer.writerow(row)

    print(f"Successfully generated {OUTPUT_CSV} ({os.path.getsize(OUTPUT_CSV) / (1024*1024):.2f} MB)")

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Build SQLite database (public/words.db) for Samuel offline PWA.

Idempotently creates separate tables:
1. puzzle_words   <- data/puzzle_words.json (Core cipher keywords)
2. cs_substantives <- data/cs_substantives.csv (Czech nouns with anagram keys)
3. cs_all          <- data/cs_all.csv (All Czech words with frequencies)
4. ruian           <- data/RUIAN/*.csv (Czech territorial names categorized by type)

Generates public/words.db and ensures public/sql-wasm*.wasm files are present.
"""

import os
import sys
import csv
import re
import json
import glob
import shutil
import sqlite3
import unicodedata
import hashlib
import datetime
import time

def remove_diacritics(s: str) -> str:
    """Removes diacritics and normalizes special characters (including German/Slovak umlauts)."""
    s = s.replace('ß', 'ss')
    return ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))

def compute_sha256(file_path: str) -> str:
    """Computes full SHA-256 hex digest for a file."""
    h = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while chunk := f.read(1024 * 1024):
            h.update(chunk)
    return h.hexdigest()

def get_source_files() -> list:
    """Returns sorted list of all source data files used to build the database."""
    base_files = ['data/puzzle_words.json', 'data/cs_substantives.csv', 'data/cs_all.csv']
    ruian_files = sorted(glob.glob('data/RUIAN/*.csv'))
    return [f for f in sorted(base_files + ruian_files) if os.path.exists(f)]

def compute_sources_hash() -> str:
    """Computes a composite SHA-256 hash across all source data files."""
    h = hashlib.sha256()
    for f in get_source_files():
        h.update(f.encode('utf-8'))
        with open(f, 'rb') as fp:
            while chunk := fp.read(1024 * 1024):
                h.update(chunk)
    return h.hexdigest()[:16]

def ensure_wasm_files():
    """Ensures sql.js wasm files are copied to public/ if available in node_modules."""
    for wasm_name in ['sql-wasm.wasm', 'sql-wasm-browser.wasm']:
        wasm_src = os.path.join('node_modules/sql.js/dist', wasm_name)
        wasm_dst = os.path.join('public', wasm_name)
        if os.path.exists(wasm_src):
            if not os.path.exists(wasm_dst) or os.path.getsize(wasm_src) != os.path.getsize(wasm_dst):
                shutil.copyfile(wasm_src, wasm_dst)
                print(f"Copied {wasm_src} -> {wasm_dst}")

def main():
    force = '--force' in sys.argv
    rebuild_version = '--rebuild-version' in sys.argv

    db_path = 'public/words.db'
    db_tmp_path = 'public/words.db.tmp'
    version_file = 'public/version.json'

    # Ensure required wasm files are present
    ensure_wasm_files()

    sources_hash = compute_sources_hash()

    # Fast pre-check: if data sources are completely untouched, skip build immediately
    if not force and os.path.exists(db_path) and os.path.exists(version_file):
        try:
            with open(version_file, 'r', encoding='utf-8') as f:
                ver_info = json.load(f)
            if (
                ver_info.get('sourceHash') == sources_hash
                and os.path.getsize(db_path) == ver_info.get('dbSizeBytes')
            ):
                print(f"[DB BUILD] Data sources in data/ unchanged (sourceHash: {sources_hash}). Skipping DB build (no-op).")
                return
        except Exception:
            pass

    if os.path.exists(db_tmp_path):
        try:
            os.remove(db_tmp_path)
        except OSError:
            pass

    print(f"[DB BUILD] Building SQLite database into temporary file {db_tmp_path}...")
    conn = sqlite3.connect(db_tmp_path)
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode = OFF")
    cur.execute("PRAGMA synchronous = 0")

    # =========================================================================
    # 1. TABLE: puzzle_words (from data/puzzle_words.json)
    # =========================================================================
    puzzle_json = 'data/puzzle_words.json'
    print(f"\n--- Building table: puzzle_words ({puzzle_json}) ---")
    cur.execute('''
        CREATE TABLE puzzle_words (
            id INTEGER PRIMARY KEY,
            word TEXT NOT NULL,
            word_nodiac TEXT NOT NULL,
            len INTEGER NOT NULL
        )
    ''')

    if os.path.exists(puzzle_json):
        with open(puzzle_json, 'r', encoding='utf-8') as f:
            words = json.load(f)

        puzzle_entries = []
        for w in words:
            w_clean = str(w).strip()
            if not w_clean:
                continue
            w_nodiac = remove_diacritics(w_clean).lower()
            puzzle_entries.append((w_clean, w_nodiac, len(w_nodiac)))

        cur.executemany('''
            INSERT INTO puzzle_words (word, word_nodiac, len)
            VALUES (?, ?, ?)
        ''', puzzle_entries)
        print(f"Inserted {len(puzzle_entries)} rows into puzzle_words")
    else:
        print(f"WARNING: {puzzle_json} not found!")

    cur.execute('CREATE INDEX idx_puzzle_words_nodiac ON puzzle_words(word_nodiac COLLATE NOCASE)')

    # =========================================================================
    # 2. TABLE: cs_substantives (from data/cs_substantives.csv)
    # =========================================================================
    subst_csv = 'data/cs_substantives.csv'
    print(f"\n--- Building table: cs_substantives ({subst_csv}) ---")
    cur.execute('''
        CREATE TABLE cs_substantives (
            id INTEGER PRIMARY KEY,
            word TEXT NOT NULL,
            word_nodiac TEXT NOT NULL,
            freq INTEGER NOT NULL,
            is_name INTEGER NOT NULL,
            is_unique_letters INTEGER NOT NULL,
            is_unique_letters_nodiac INTEGER NOT NULL,
            letters TEXT NOT NULL,
            letters_nodiac TEXT NOT NULL,
            len INTEGER NOT NULL
        )
    ''')

    if os.path.exists(subst_csv):
        subst_entries = []
        with open(subst_csv, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader, None)
            for row in reader:
                if len(row) < 8:
                    continue
                w = row[0].strip()
                w_nodiac = row[1].strip()
                freq = int(row[2].strip().strip('"'))
                is_name = int(row[3].strip().strip('"'))
                is_uniq = int(row[4].strip().strip('"'))
                is_uniq_nod = int(row[5].strip().strip('"'))
                letters = row[6].strip()
                letters_nodiac = row[7].strip()
                length = len(w_nodiac)
                subst_entries.append((w, w_nodiac, freq, is_name, is_uniq, is_uniq_nod, letters, letters_nodiac, length))

        cur.executemany('''
            INSERT INTO cs_substantives (
                word, word_nodiac, freq, is_name, is_unique_letters, is_unique_letters_nodiac,
                letters, letters_nodiac, len
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', subst_entries)
        print(f"Inserted {len(subst_entries)} rows into cs_substantives")
    else:
        print(f"WARNING: {subst_csv} not found!")

    cur.execute('CREATE INDEX idx_subst_word_nodiac ON cs_substantives(word_nodiac COLLATE NOCASE)')
    cur.execute('CREATE INDEX idx_subst_letters_nodiac ON cs_substantives(letters_nodiac)')
    cur.execute('CREATE INDEX idx_subst_letters ON cs_substantives(letters)')
    cur.execute('CREATE INDEX idx_subst_len_freq ON cs_substantives(len, freq DESC)')

    # =========================================================================
    # 3. TABLE: cs_all (from data/cs_all.csv)
    # =========================================================================
    all_csv = 'data/cs_all.csv'
    print(f"\n--- Building table: cs_all ({all_csv}) ---")
    cur.execute('''
        CREATE TABLE cs_all (
            id INTEGER PRIMARY KEY,
            word TEXT NOT NULL,
            word_nodiac TEXT NOT NULL,
            freq INTEGER NOT NULL,
            len INTEGER NOT NULL
        )
    ''')

    if os.path.exists(all_csv):
        # Aggregate duplicates (e.g. if hyphen removal merges forms)
        all_words_map = {}
        with open(all_csv, 'r', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter=';')
            next(reader, None) # skip header
            for row in reader:
                if len(row) < 3:
                    continue
                raw_word = row[1].strip().strip('"')
                # Remove hyphens and dashes between words (e.g. Müller-Thurgau -> MüllerThurgau)
                clean_word = re.sub(r'[\-\–\—\‑]+', '', raw_word)
                if clean_word and all(c.isalpha() for c in clean_word):
                    try:
                        freq = int(row[2].strip().strip('"'))
                    except ValueError:
                        continue
                    all_words_map[clean_word] = all_words_map.get(clean_word, 0) + freq

        all_entries = []
        for w, freq in sorted(all_words_map.items()):
            w_nodiac = remove_diacritics(w).lower()
            all_entries.append((w, w_nodiac, freq, len(w_nodiac)))

        cur.executemany('''
            INSERT INTO cs_all (word, word_nodiac, freq, len)
            VALUES (?, ?, ?, ?)
        ''', all_entries)
        print(f"Inserted {len(all_entries)} rows into cs_all")
    else:
        print(f"WARNING: {all_csv} not found!")

    cur.execute('CREATE INDEX idx_all_word_nodiac ON cs_all(word_nodiac COLLATE NOCASE)')
    cur.execute('CREATE INDEX idx_all_len_freq ON cs_all(len, freq DESC)')

    # =========================================================================
    # 4. TABLE: ruian (from data/RUIAN/*.csv)
    # =========================================================================
    ruian_dir = 'data/RUIAN'
    print(f"\n--- Building table: ruian ({ruian_dir}) ---")
    cur.execute('''
        CREATE TABLE ruian (
            id INTEGER PRIMARY KEY,
            word TEXT NOT NULL,
            word_nodiac TEXT NOT NULL,
            type TEXT NOT NULL,
            len INTEGER NOT NULL
        )
    ''')

    TYPE_MAP = {
        'UI_CAST_OBCE': 'cast_obce',
        'UI_KATASTRALNI_UZEMI': 'katastralni_uzemi',
        'UI_MOMC': 'momc',
        'UI_MOP': 'mop',
        'UI_OBEC': 'obec',
        'UI_SPRAVNI_OBVOD': 'spravni_obvod',
        'UI_ULICE': 'ulice',
        'UI_ZSJ': 'zsj'
    }

    if os.path.isdir(ruian_dir):
        unique_ruian = set()
        for path in sorted(glob.glob(os.path.join(ruian_dir, '*.csv'))):
            base = os.path.splitext(os.path.basename(path))[0]
            t = TYPE_MAP.get(base, base.lower())
            for enc in ['utf-8', 'cp1250']:
                try:
                    with open(path, 'r', encoding=enc) as f:
                        reader = csv.reader(f, delimiter=';')
                        header = next(reader)
                        nazev_idx = header.index('NAZEV') if 'NAZEV' in header else 1
                        for row in reader:
                            if len(row) > nazev_idx:
                                name = row[nazev_idx].strip()
                                if name:
                                    unique_ruian.add((name, t))
                    break
                except UnicodeDecodeError:
                    continue

        ruian_entries = []
        for name, t in sorted(unique_ruian):
            w_nodiac = remove_diacritics(name).lower()
            ruian_entries.append((name, w_nodiac, t, len(w_nodiac)))

        cur.executemany('''
            INSERT INTO ruian (word, word_nodiac, type, len)
            VALUES (?, ?, ?, ?)
        ''', ruian_entries)
        print(f"Inserted {len(ruian_entries)} deduplicated rows into ruian")
    else:
        print(f"WARNING: {ruian_dir} directory not found!")

    cur.execute('CREATE INDEX idx_ruian_word_nodiac ON ruian(word_nodiac COLLATE NOCASE)')
    cur.execute('CREATE INDEX idx_ruian_type ON ruian(type)')
    cur.execute('CREATE INDEX idx_ruian_type_nodiac ON ruian(type, word_nodiac COLLATE NOCASE)')

    # Commit, VACUUM and finalize
    print("\nCommitting and optimizing SQLite DB...")
    conn.commit()
    cur.execute('VACUUM')
    conn.close()

    new_db_bytes = os.path.getsize(db_tmp_path)
    new_db_size_mb = new_db_bytes / 1024 / 1024
    new_db_hash = compute_sha256(db_tmp_path)[:16]
    print(f"Temporary DB build complete! Size: {new_db_size_mb:.2f} MB, Hash: {new_db_hash}")

    # Check against existing words.db
    if os.path.exists(db_path) and not rebuild_version:
        old_db_hash = compute_sha256(db_path)[:16]
        if new_db_hash == old_db_hash:
            os.remove(db_tmp_path)
            # Synchronize sourceHash into version.json if needed without bumping dbVersion
            if os.path.exists(version_file):
                try:
                    with open(version_file, 'r', encoding='utf-8') as f:
                        vdata = json.load(f)
                    if vdata.get('sourceHash') != sources_hash:
                        vdata['sourceHash'] = sources_hash
                        with open(version_file, 'w', encoding='utf-8') as f:
                            json.dump(vdata, f, indent=2)
                except Exception:
                    pass
            print(f"[DB BUILD] Database content is identical to existing {db_path} (hash: {new_db_hash}). No-op (no version bump).")
            return

    # Atomically replace old database with new version
    os.replace(db_tmp_path, db_path)

    # Update public/version.json
    version_data = {}
    if os.path.exists(version_file):
        try:
            with open(version_file, 'r', encoding='utf-8') as f:
                version_data = json.load(f)
        except Exception:
            version_data = {}

    now_iso = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    db_ver = datetime.datetime.now(datetime.timezone.utc).strftime('%Y.%m.%d-%H%M')

    if "appVersion" not in version_data:
        version_data["appVersion"] = "0.1.0"
    if "buildTime" not in version_data:
        version_data["buildTime"] = 0
    version_data["dbVersion"] = db_ver
    version_data["dbHash"] = new_db_hash
    version_data["dbSizeBytes"] = new_db_bytes
    version_data["dbUpdated"] = now_iso
    version_data["sourceHash"] = sources_hash

    with open(version_file, 'w', encoding='utf-8') as f:
        json.dump(version_data, f, indent=2)
    print(f"[DB BUILD] Database updated! Version: {db_ver}, Hash: {new_db_hash}, Size: {new_db_size_mb:.2f} MB")

if __name__ == '__main__':
    main()

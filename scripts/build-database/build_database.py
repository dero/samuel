#!/usr/bin/env python3
"""
Build SQLite database (public/words.db) for Samuel offline PWA.

Idempotently creates separate tables:
1. puzzle_words   <- data/puzzle_words.json (Core cipher keywords)
2. cs_substantives <- data/cs_substantives.csv (Czech nouns with anagram keys)
3. cs_all          <- data/cs_all.csv (All Czech words with frequencies)
4. ruian           <- data/RUIAN/*.csv (Czech territorial names categorized by type)

Generates public/words.db (loaded client-side via @sqlite.org/sqlite-wasm, OPFS sahpool VFS).
"""

import os
import sys
import csv
import re
import json
import glob
import sqlite3
import unicodedata
import hashlib
import datetime
import time

def remove_diacritics(s: str) -> str:
    """Removes diacritics and normalizes special characters (including German/Slovak umlauts)."""
    s = s.replace('ß', 'ss')
    return ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))

def compute_mask_nodiac(s_nodiac: str) -> int:
    """Computes a 26-bit integer mask indicating present letters (a=0, z=25)."""
    mask = 0
    for ch in s_nodiac.lower():
        o = ord(ch) - 97
        if 0 <= o <= 25:
            mask |= (1 << o)
    return mask

def compute_sha256(file_path: str) -> str:
    """Computes full SHA-256 hex digest for a file."""
    h = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while chunk := f.read(1024 * 1024):
            h.update(chunk)
    return h.hexdigest()

def get_source_files() -> list:
    """Returns sorted list of all source data files used to build the database."""
    base_files = ['data/puzzle_words.json', 'data/cs_substantives.csv', 'data/cs_all.csv', 'data/world_flags.json']
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

def main():
    force = '--force' in sys.argv
    rebuild_version = '--rebuild-version' in sys.argv

    db_path = 'public/words.db'
    db_tmp_path = 'public/words.db.tmp'
    version_file = 'public/version.json'

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
    # 1. TABLE: words (unified canonical dictionary with PoS & cipher metadata)
    # =========================================================================
    print(f"\n--- Building unified table: words ---")
    cur.execute('''
        CREATE TABLE words (
            id INTEGER PRIMARY KEY,
            word TEXT NOT NULL,
            word_nodiac TEXT NOT NULL,
            freq INTEGER NOT NULL,
            len INTEGER NOT NULL,
            mask_nodiac INTEGER NOT NULL,
            is_subst INTEGER NOT NULL DEFAULT 0,
            is_name INTEGER NOT NULL DEFAULT 0,
            is_puzzle INTEGER NOT NULL DEFAULT 0
        )
    ''')

    # Load puzzle keywords (exact lowercase word forms)
    puzzle_json = 'data/puzzle_words.json'
    puzzle_exact = set()
    if os.path.exists(puzzle_json):
        with open(puzzle_json, 'r', encoding='utf-8') as f:
            for w in json.load(f):
                w_str = str(w).strip()
                if w_str:
                    puzzle_exact.add(w_str.lower())

    # Load substantives from MorfFlex dataset (exact lowercase word forms)
    subst_csv = 'data/cs_substantives.csv'
    subst_exact = {}  # w_lower -> (raw_word, freq, is_name)
    if os.path.exists(subst_csv):
        with open(subst_csv, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader, None)
            for row in reader:
                if len(row) >= 4:
                    raw_w = row[0].strip()
                    w_low = raw_w.lower()
                    freq_val = int(row[2].strip().strip('"'))
                    is_n = int(row[3].strip().strip('"'))
                    subst_exact[w_low] = (raw_w, freq_val, is_n)

    # Load cs_all corpus words
    all_csv = 'data/cs_all.csv'
    all_words_map = {}
    if os.path.exists(all_csv):
        with open(all_csv, 'r', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter=';')
            next(reader, None)
            for row in reader:
                if len(row) < 3:
                    continue
                raw_word = row[1].strip().strip('"')
                clean_word = re.sub(r'[\-\–\—\‑]+', '', raw_word)
                if clean_word and all(c.isalpha() for c in clean_word):
                    try:
                        freq = int(row[2].strip().strip('"'))
                    except ValueError:
                        continue
                    all_words_map[clean_word] = all_words_map.get(clean_word, 0) + freq

    entries = []
    seen_exact = set()

    for w, freq in sorted(all_words_map.items()):
        w_low = w.lower()
        w_nodiac = remove_diacritics(w).lower()

        # Strict exact substantive check (prevents false matches like každá -> kazda)
        is_subst = 1 if w_low in subst_exact else 0
        is_name = subst_exact[w_low][2] if is_subst else (1 if w[0].isupper() else 0)
        is_puz = 1 if w_low in puzzle_exact else 0
        if is_puz:
            freq = max(freq, 100000)

        # Filter: preserve all substantives (even freq=1), all puzzle words, but require freq >= 2 for general non-nouns
        if is_subst == 0 and is_puz == 0 and freq < 2:
            continue

        seen_exact.add(w_low)
        mask = compute_mask_nodiac(w_nodiac)
        entries.append((w, w_nodiac, freq, len(w_nodiac), mask, is_subst, is_name, is_puz))

    # Include any puzzle words not present in cs_all
    for p_word in sorted(puzzle_exact):
        if p_word not in seen_exact:
            seen_exact.add(p_word)
            p_nod = remove_diacritics(p_word).lower()
            p_subst = 1 if p_word in subst_exact else 0
            p_name = subst_exact[p_word][2] if p_subst else 0
            entries.append((p_word, p_nod, 100000, len(p_nod), compute_mask_nodiac(p_nod), p_subst, p_name, 1))

    # Include any substantives from MorfFlex not present in cs_all
    for s_low, (s_raw, s_freq, s_name) in sorted(subst_exact.items()):
        if s_low not in seen_exact:
            seen_exact.add(s_low)
            s_nod = remove_diacritics(s_raw).lower()
            s_puz = 1 if s_low in puzzle_exact else 0
            s_freq_final = max(s_freq, 100000) if s_puz else s_freq
            entries.append((s_raw, s_nod, s_freq_final, len(s_nod), compute_mask_nodiac(s_nod), 1, s_name, s_puz))

    cur.executemany('''
        INSERT INTO words (word, word_nodiac, freq, len, mask_nodiac, is_subst, is_name, is_puzzle)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', entries)
    print(f"Inserted {len(entries)} rows into words")

    # NOTE: word_nodiac and word are always compared with GLOB (binary, case-sensitive)
    # against already-lowercased/nodiac-normalized query strings, never with LIKE/= under
    # NOCASE semantics. A COLLATE NOCASE index cannot be used by GLOB's prefix-search
    # optimization (SQLite requires the query and the index to share the same collation
    # for the range-scan rewrite of `col GLOB 'prefix*'`), so a default BINARY-collated
    # index is required here for `kr*`-style prefix masks to avoid a full `SCAN words`.
    cur.execute('CREATE INDEX idx_words_nodiac_glob ON words(word_nodiac)')
    cur.execute('CREATE INDEX idx_words_len_freq ON words(len, freq DESC)')
    cur.execute('CREATE INDEX idx_words_len_mask ON words(len, mask_nodiac, freq DESC)')

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
            len INTEGER NOT NULL,
            mask_nodiac INTEGER NOT NULL
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
            mask = compute_mask_nodiac(w_nodiac)
            ruian_entries.append((name, w_nodiac, t, len(w_nodiac), mask))

        cur.executemany('''
            INSERT INTO ruian (word, word_nodiac, type, len, mask_nodiac)
            VALUES (?, ?, ?, ?, ?)
        ''', ruian_entries)
        print(f"Inserted {len(ruian_entries)} deduplicated rows into ruian")
    else:
        print(f"WARNING: {ruian_dir} directory not found!")

    # See comment above idx_words_nodiac_glob: BINARY collation is required for GLOB
    # prefix-search to use the index (COLLATE NOCASE indexes are ignored by GLOB).
    cur.execute('CREATE INDEX idx_ruian_word_nodiac_glob ON ruian(word_nodiac)')
    cur.execute('CREATE INDEX idx_ruian_type_nodiac ON ruian(type, word_nodiac COLLATE NOCASE)')
    cur.execute('CREATE INDEX idx_ruian_len_mask ON ruian(len, mask_nodiac)')

    # =========================================================================
    # 5. TABLE: world_flags (from data/world_flags.json)
    # =========================================================================
    flags_json = 'data/world_flags.json'
    print(f"\n--- Building table: world_flags ({flags_json}) ---")
    cur.execute('''
        CREATE TABLE world_flags (
            id INTEGER PRIMARY KEY,
            code TEXT NOT NULL UNIQUE,
            code3 TEXT NOT NULL,
            name_cs TEXT NOT NULL,
            name_cs_nodiac TEXT NOT NULL,
            name_en TEXT NOT NULL,
            capital_cs TEXT NOT NULL,
            capital_cs_nodiac TEXT NOT NULL,
            capital_en TEXT NOT NULL,
            continent TEXT NOT NULL,
            colors TEXT NOT NULL,
            features TEXT NOT NULL,
            description_cs TEXT NOT NULL DEFAULT '',
            description_en TEXT NOT NULL DEFAULT '',
            svg_4x3 TEXT NOT NULL,
            svg_1x1 TEXT NOT NULL
        )
    ''')

    if os.path.exists(flags_json):
        with open(flags_json, 'r', encoding='utf-8') as f:
            flags_list = json.load(f)

        flag_entries = []
        for fl in flags_list:
            code = fl['code']
            code3 = fl.get('code3', code.upper())
            name_cs = fl['name_cs']
            name_cs_nodiac = remove_diacritics(name_cs).lower()
            name_en = fl['name_en']
            capital_cs = fl.get('capital_cs', '')
            capital_cs_nodiac = remove_diacritics(capital_cs).lower()
            capital_en = fl.get('capital_en', '')
            continent = fl.get('continent', 'europe')
            colors_json = json.dumps(fl.get('colors', []), ensure_ascii=False)
            features_json = json.dumps(fl.get('features', []), ensure_ascii=False)
            desc_cs = fl.get('description_cs', '')
            desc_en = fl.get('description_en', '')
            svg_4x3 = fl.get('svg_4x3', '')
            svg_1x1 = fl.get('svg_1x1', '')

            flag_entries.append((
                code, code3, name_cs, name_cs_nodiac, name_en,
                capital_cs, capital_cs_nodiac, capital_en, continent,
                colors_json, features_json, desc_cs, desc_en, svg_4x3, svg_1x1
            ))

        cur.executemany('''
            INSERT INTO world_flags (
                code, code3, name_cs, name_cs_nodiac, name_en,
                capital_cs, capital_cs_nodiac, capital_en, continent,
                colors, features, description_cs, description_en, svg_4x3, svg_1x1
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', flag_entries)
        print(f"Inserted {len(flag_entries)} rows into world_flags")
    else:
        print(f"WARNING: {flags_json} not found!")

    cur.execute('CREATE INDEX idx_flags_code ON world_flags(code)')
    cur.execute('CREATE INDEX idx_flags_code3 ON world_flags(code3)')
    cur.execute('CREATE INDEX idx_flags_name_nodiac ON world_flags(name_cs_nodiac COLLATE NOCASE)')
    cur.execute('CREATE INDEX idx_flags_continent ON world_flags(continent)')

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

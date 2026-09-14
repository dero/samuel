#!/usr/bin/env python3
"""
Generate compact Czech 4-gram, trigram, and bigram character language model
trained on Kontext word forms and RUIAN street names.

Outputs src/lib/data/ngramData.json (for lazy on-demand import outside main bundle).
"""

import os
import sys
import csv
import math
import json
import gzip
import re
from collections import defaultdict

CZECH_PATTERN = re.compile(r'^[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+$')
DIACRITICS_MAP = str.maketrans({
    'á': 'a', 'č': 'c', 'ď': 'd', 'é': 'e', 'ě': 'e',
    'í': 'i', 'ň': 'n', 'ó': 'o', 'ř': 'r', 'š': 's',
    'ť': 't', 'ú': 'u', 'ů': 'u', 'ý': 'y', 'ž': 'z',
    'Á': 'A', 'Č': 'C', 'Ď': 'D', 'É': 'E', 'Ě': 'E',
    'Í': 'I', 'Ň': 'N', 'Ó': 'O', 'Ř': 'R', 'Š': 'S',
    'Ť': 'T', 'Ú': 'U', 'Ů': 'U', 'Ý': 'Y', 'Ž': 'Z'
})

def remove_diacritics(text):
    return text.translate(DIACRITICS_MAP).upper()

def main():
    unigrams = defaultdict(int)
    bigrams = defaultdict(int)
    trigrams = defaultdict(int)
    fourgrams = defaultdict(int)

    corpus_csv = 'data/kontext-freq_download-2026-09-13.csv'
    print(f"Reading corpus from {corpus_csv}...")
    with open(corpus_csv, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter=';')
        next(reader, None)
        count = 0
        for row in reader:
            if len(row) < 3: continue
            raw_w = row[1].strip().strip('"')
            try:
                freq = int(row[2].strip().strip('"'))
            except ValueError:
                continue
            if freq < 2 or not CZECH_PATTERN.match(raw_w):
                continue

            count += 1
            nod = remove_diacritics(raw_w)
            w = f"^^{nod}$$"
            for i in range(len(w)):
                unigrams[w[i]] += freq
                if i + 2 <= len(w): bigrams[w[i:i+2]] += freq
                if i + 3 <= len(w): trigrams[w[i:i+3]] += freq
                if i + 4 <= len(w): fourgrams[w[i:i+4]] += freq
            if count >= 50000:
                break

    street_csv = 'data/UI_ULICE.csv'
    if os.path.exists(street_csv):
        print(f"Reading streets from {street_csv}...")
        with open(street_csv, 'r', encoding='utf-8') as f:
            reader = csv.reader(f, delimiter=';')
            next(reader, None)
            for row in reader:
                if len(row) < 2: continue
                tokens = re.split(r'[\s\.\,\-]+', row[1].strip())
                for tok in tokens:
                    if len(tok) >= 2 and CZECH_PATTERN.match(tok):
                        tok_nod = remove_diacritics(tok)
                        w = f"^^{tok_nod}$$"
                        freq = 25  # Prior weight for street tokens
                        for i in range(len(w)):
                            unigrams[w[i]] += freq
                            if i + 2 <= len(w): bigrams[w[i:i+2]] += freq
                            if i + 3 <= len(w): trigrams[w[i:i+3]] += freq
                            if i + 4 <= len(w): fourgrams[w[i:i+4]] += freq

    # Prune low frequency n-grams
    pruned_4 = {k: v for k, v in fourgrams.items() if v >= 100}
    pruned_3 = {k: v for k, v in trigrams.items() if v >= 30}
    pruned_2 = {k: v for k, v in bigrams.items() if v >= 5}

    print(f"Pruned 4-grams (freq >= 100): {len(pruned_4)}")
    print(f"Pruned 3-grams (freq >=  30): {len(pruned_3)}")
    print(f"Pruned 2-grams (freq >=   5): {len(pruned_2)}")

    # Conditional log probabilities: log P(c4 | c1 c2 c3)
    c3_totals = defaultdict(int)
    for k, v in pruned_4.items(): c3_totals[k[:3]] += v
    lp_4 = {k: round(math.log(v / c3_totals[k[:3]]), 1) for k, v in pruned_4.items()}

    c2_totals = defaultdict(int)
    for k, v in pruned_3.items(): c2_totals[k[:2]] += v
    lp_3 = {k: round(math.log(v / c2_totals[k[:2]]), 1) for k, v in pruned_3.items()}

    c1_totals = defaultdict(int)
    for k, v in pruned_2.items(): c1_totals[k[:1]] += v
    lp_2 = {k: round(math.log(v / c1_totals[k[:1]]), 1) for k, v in pruned_2.items()}

    os.makedirs('src/lib/data', exist_ok=True)
    out_json = 'src/lib/data/ngramData.json'
    print(f"Writing {out_json}...")
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump({'lp4': lp_4, 'lp3': lp_3, 'lp2': lp_2}, f, separators=(',', ':'))

    json_kb = os.path.getsize(out_json) / 1024
    with open(out_json, 'rb') as f:
        gz_kb = len(gzip.compress(f.read())) / 1024
    print(f"Exported ngramData.json: {json_kb:.1f} KB (gzipped: {gz_kb:.1f} KB)")
    print("N-gram model generation completed successfully!")

if __name__ == '__main__':
    main()

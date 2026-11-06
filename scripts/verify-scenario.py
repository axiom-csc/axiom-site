#!/usr/bin/env python3
"""Compare the complete rendered exhibit with the original benchmark source.
Usage: python3 scripts/verify-scenario.py /path/to/bench/data/scenarios.json [browser-rendered.json]
The optional JSON is an array of .pmap-text textContent values from the browser.
"""
import difflib
import json
from html.parser import HTMLParser
from pathlib import Path
import sys

class Exhibit(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.turns = []
        self.capture = False
    def handle_starttag(self, tag, attrs):
        if tag == 'p' and dict(attrs).get('class') == 'pmap-text':
            self.capture = True
            self.turns.append('')
    def handle_data(self, text):
        if self.capture:
            self.turns[-1] += text
    def handle_endtag(self, tag):
        if tag == 'p':
            self.capture = False

source = Path(sys.argv[1])
scenario = next(s for s in json.loads(source.read_text())['scenarios'] if s['id'] == 'ref-01-R1')
expected = [turn['text'] for turn in scenario['turns']]
parser = Exhibit()
parser.feed((Path(__file__).resolve().parents[1] / 'index.html').read_text())
actual = json.loads(Path(sys.argv[2]).read_text()) if len(sys.argv) > 2 else parser.turns
assert actual == parser.turns, 'Browser text differs from parsed HTML'
diff = ''.join(difflib.unified_diff([s+'\n' for s in expected], [s+'\n' for s in actual], fromfile=str(source)+'#ref-01-R1', tofile='rendered .pmap-text'))
print(diff or 'PASS: ref-01-R1 — all 7 turns match source exactly. Diff: empty.')
sys.exit(bool(diff))

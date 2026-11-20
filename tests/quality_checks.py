from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = ["index.html", "admin.html", "developer.html", "privacy.html", "terms.html"]

class AuditParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.local_refs = []
        self.inline_scripts = []
        self._in_script = False
        self._script_type = ""
        self._script_parts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        for key in ("src", "href"):
            value = attrs.get(key, "")
            if value and "${" not in value and not value.startswith(("#", "http://", "https://", "mailto:", "tel:", "data:", "javascript:")):
                self.local_refs.append(value.split("?", 1)[0].split("#", 1)[0])
        if tag == "script":
            self._in_script = True
            self._script_type = attrs.get("type", "")
            self._script_parts = []

    def handle_data(self, data):
        if self._in_script:
            self._script_parts.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self._in_script:
            if self._script_type != "application/ld+json" and "".join(self._script_parts).strip():
                self.inline_scripts.append("".join(self._script_parts))
            self._in_script = False

def fail(message):
    raise SystemExit("FAIL: " + message)

parsers = {}
for filename in HTML_FILES:
    path = ROOT / filename
    if not path.is_file():
        fail(f"Missing HTML file: {filename}")
    parser = AuditParser()
    parser.feed(path.read_text(encoding="utf-8"))
    parser.close()
    duplicates = sorted({x for x in parser.ids if parser.ids.count(x) > 1})
    if duplicates:
        fail(f"{filename} has duplicate IDs: {duplicates}")
    for ref in parser.local_refs:
        if ref and not (ROOT / ref).exists():
            fail(f"{filename} references missing local asset: {ref}")
    parsers[filename] = parser
    for number, script in enumerate(parser.inline_scripts, 1):
        with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8", delete=False) as tmp:
            tmp.write(script)
            temp_name = tmp.name
        result = subprocess.run(["node", "--check", temp_name], capture_output=True, text=True)
        Path(temp_name).unlink(missing_ok=True)
        if result.returncode:
            fail(f"{filename} inline script {number} syntax error: {result.stderr.strip()}")

for filename in ("admin.js", "supabase-config.js"):
    result = subprocess.run(["node", "--check", str(ROOT / filename)], capture_output=True, text=True)
    if result.returncode:
        fail(f"{filename} syntax error: {result.stderr.strip()}")

admin_ids = set(parsers["admin.html"].ids)
admin_js = (ROOT / "admin.js").read_text(encoding="utf-8")
referenced_ids = set(re.findall(r"\$\(['\"]([^'\"]+)['\"]\)", admin_js))
missing = sorted(referenced_ids - admin_ids)
if missing:
    fail(f"admin.js references missing admin.html IDs: {missing}")

admin_html = (ROOT / "admin.html").read_text(encoding="utf-8")
if 'id="categoryFilter"' not in admin_html:
    fail("Admin category filter control is missing")
if '<option value="अन्य">अन्य</option>' not in admin_html:
    fail("Admin 'अन्य' category option value does not match stored category")

sql = (ROOT / "database.sql").read_text(encoding="utf-8").lower()
for required in ("security definer", "public.is_admin()", "enable row level security", "with check", "revoke all on table public.admin_users"):
    if required not in sql:
        fail(f"database.sql missing security requirement: {required}")

css = (ROOT / "admin.css").read_text(encoding="utf-8")
if css.count("{") != css.count("}"):
    fail("admin.css has unbalanced braces")

print("PASS: HTML IDs are unique; local assets exist; inline and external JS syntax valid; admin selectors resolve; category filter and RLS safeguards present; admin CSS braces balanced.")

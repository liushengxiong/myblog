import subprocess, os, re, urllib.request
REPO = r"D:\00 刘盛雄知识库\00 myblog"
GIT = r"D:\Program Files\Git\cmd\git.exe"
os.chdir(REPO)

def run(args):
    r = subprocess.run([GIT]+args, capture_output=True, text=True)
    out = r.stdout.strip()
    if r.returncode != 0:
        out += "\n[ERR] " + r.stderr.strip()
    return out

print("=== branch ==="); print(run(["branch","--show-current"]))
print("\n=== local main log (last 15) ==="); print(run(["log","--oneline","-15"]))
print("\n=== origin/main rev ==="); print(run(["rev-parse","origin/main"]))
print("\n=== local HEAD rev ==="); print(run(["rev-parse","HEAD"]))
print("\n=== local ahead (origin/main..HEAD) ==="); print(run(["log","--oneline","origin/main..HEAD"]) or "(none)")
print("\n=== remote ahead (HEAD..origin/main) ==="); print(run(["log","--oneline","HEAD..origin/main"]) or "(none)")
print("\n=== git status --short ==="); print(run(["status","--short"]) or "(clean)")

for f in [".nvmrc",".node-version"]:
    print(f, "at HEAD =>", repr(run(["show","HEAD:"+f])))
pj = run(["show","HEAD:package.json"])
m = re.search(r'"node"\s*:\s*"([^"]+)"', pj)
print("package.json node engine =>", m.group(1) if m else "NOT FOUND")
print("resources files at HEAD =>", run(["ls-files","src/content/resources/"]))
print("sources page at HEAD =>", run(["ls-files","src/pages/zh/resources/sources/"]))

print("\n=== LIVE HOMEPAGE CHECK ===")
try:
    proxy = "http://127.0.0.1:7897"
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({"http":proxy,"https":proxy}))
    req = urllib.request.Request("https://liushengxiong.com/zh/", headers={"User-Agent":"Mozilla/5.0"})
    html = opener.open(req, timeout=30).read().decode("utf-8","ignore")
    for kw in ["信息源导航","个人成长书单","推荐资源","/zh/resources/sources/"]:
        print(f"  '{kw}' present: {kw in html}")
    for mm in re.finditer(r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>', html, re.S):
        t = re.sub(r'<[^>]+>','',mm.group(2)).strip()
        if any(k in t for k in ["信息源","书单","资源"]):
            print(f"  anchor: {t!r} -> {mm.group(1)}")
except Exception as e:
    print("  fetch error:", repr(e))

import os, json, urllib.request, subprocess
GIT = r"D:\Program Files\Git\cmd\git.exe"
REPO = r"D:\00 刘盛雄知识库\00 myblog"

# 1) commit date of HEAD
def git(args):
    r = subprocess.run([GIT]+args, cwd=REPO, capture_output=True, text=True)
    return r.stdout.strip()
head = git(["rev-parse","HEAD"])
date = git(["show","-s","--format=%ci",head])
print("HEAD:", head[:10], "date:", date)

# 2) GitHub deployments (latest 6) + their status
tok = os.environ.get("GITHUB_TOKEN","")
proxy = "http://127.0.0.1:7897"
opener = urllib.request.build_opener(urllib.request.ProxyHandler({"http":proxy,"https":proxy}))
hdr = {"User-Agent":"Mozilla/5.0","Accept":"application/vnd.github+json"}
if tok: hdr["Authorization"]="Bearer "+tok
url = "https://api.github.com/repos/liushengxiong/myblog/deployments?per_page=6"
print("\n=== GitHub deployments (latest) ===")
try:
    req = urllib.request.Request(url, headers=hdr)
    data = json.load(opener.open(req, timeout=30))
    for d in data:
        sha = d.get("sha","")[:10]
        created = d.get("created_at","")
        # fetch statuses
        st = "?"
        try:
            sreq = urllib.request.Request(d["statuses_url"], headers=hdr)
            sdata = json.load(opener.open(sreq, timeout=30))
            if sdata:
                st = sdata[0].get("state","?")
        except Exception as e:
            st = "status-err:"+str(e)[:40]
        print(f"  sha={sha} created={created} status={st} env={d.get('environment')}")
except Exception as e:
    print("  API error:", repr(e)[:200])

print("\nGITHUB_TOKEN present:", bool(tok))

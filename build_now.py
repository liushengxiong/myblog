import subprocess, os
NODE = r"C:\Users\sheng\AppData\Local\Temp\node24\node-v24.21.0-win-x64\node.exe"
REPO = r"D:\00 刘盛雄知识库\00 myblog"
ASTRO = os.path.join(REPO, "node_modules", "astro", "astro.js")
os.chdir(REPO)
assert os.path.exists(NODE), "node24 missing"
assert os.path.exists(ASTRO), "astro cli missing"
env = dict(os.environ)
env["PATH"] = os.path.dirname(NODE) + ";" + env.get("PATH","")

print(">>> astro check")
r1 = subprocess.run([NODE, ASTRO, "check"], capture_output=True, text=True, env=env, timeout=240)
print("CHECK rc=", r1.returncode)
print((r1.stdout + r1.stderr)[-1500:])

print("\n>>> astro build")
r2 = subprocess.run([NODE, ASTRO, "build"], capture_output=True, text=True, env=env, timeout=300)
print("BUILD rc=", r2.returncode)
print((r2.stdout + r2.stderr)[-2000:])

out = os.path.join(REPO, ".vercel", "output", "static", "zh", "index.html")
print("\n>>> output inspect:", out)
if os.path.exists(out):
    html = open(out, encoding="utf-8", errors="ignore").read()
    for kw in ["信息源导航", "个人成长书单", "/zh/resources/sources/", "AI 工具推荐"]:
        print(f"  {kw!r} present: {kw in html}")
else:
    print("  output html NOT found")

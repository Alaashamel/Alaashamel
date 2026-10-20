"""Generates real-data analytics SVGs for the profile README. Run daily by GitHub Actions."""
import os, json, urllib.request, collections, html, datetime
USER = "Alaashamel"; TOKEN = os.environ["GITHUB_TOKEN"]; E = html.escape
F = 'font-family="Segoe UI,Helvetica,Arial,sans-serif"'; M = 'font-family="Consolas,Menlo,monospace"'
GR = '<linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#00c2ff"/><stop offset=".55" stop-color="#7c5cff"/><stop offset="1" stop-color="#ff4fd8"/></linearGradient>'

def req(url, body=None):
    r = urllib.request.Request(url, data=json.dumps(body).encode() if body else None, method="POST" if body else "GET",
        headers={"Authorization": "Bearer " + TOKEN, "Accept": "application/vnd.github+json", "User-Agent": "stats"})
    with urllib.request.urlopen(r, timeout=60) as f: return json.loads(f.read())

user = req(f"https://api.github.com/users/{USER}")
repos, p = [], 1
while True:
    d = req(f"https://api.github.com/users/{USER}/repos?per_page=100&page={p}")
    if not d: break
    repos += d; p += 1
own = [r for r in repos if not r["fork"]]
stars = sum(r["stargazers_count"] for r in own)
lang = collections.Counter()
for r in own:
    for k, v in req(r["languages_url"]).items(): lang[k] += v
q = '{user(login:"%s"){contributionsCollection{totalCommitContributions totalPullRequestContributions totalIssueContributions totalPullRequestReviewContributions contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}' % USER
c = req("https://api.github.com/graphql", {"query": q})["data"]["user"]["contributionsCollection"]
cal = c["contributionCalendar"]; today = datetime.date.today().strftime("%d %b %Y")
def w(n, s): open(f"assets/{n}.svg", "w", encoding="utf-8").write(s)
fmt = lambda n: f"{n:,}"

# ---------- stats tiles ----------
S = [(fmt(user["public_repos"]), "Public repositories", "#00c2ff"), (fmt(user["followers"]), "Followers", "#7c5cff"),
     (fmt(stars), "Stars earned", "#ffb347"), (fmt(cal["totalContributions"]), "Contributions · last year", "#2ee59d")]
b = ""
for i, (n, l, col) in enumerate(S):
    x = 15 + i * 220
    b += (f'<g><rect x="{x}" y="10" width="200" height="110" rx="18" fill="#0b1020" stroke="{col}" stroke-opacity=".4"/>'
          f'<text x="{x+100}" y="68" text-anchor="middle" {F} font-size="36" font-weight="800" fill="{col}">{E(n)}</text>'
          f'<text x="{x+100}" y="98" text-anchor="middle" {M} font-size="11.5" fill="#8b94b3" letter-spacing="1">{E(l)}</text>'
          f'<animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="3.5s" begin="{i*.4}s" repeatCount="indefinite"/></g>')
w("stats", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 130" width="100%">{b}</svg>')

# ---------- contribution heatmap + breakdown ----------
days = [d for wk in cal["weeks"] for d in wk["contributionDays"]]
mx = max((d["contributionCount"] for d in days), default=1) or 1
nz = sorted(d["contributionCount"] for d in days if d["contributionCount"] > 0) or [1]
q1, q2, q3 = nz[len(nz)//4], nz[len(nz)//2], nz[(len(nz)*9)//10]
def lvl(n): return 0 if n == 0 else 1 if n <= q1 else 2 if n <= q2 else 3 if n <= q3 else 4
COL = ["#131a33", "#0d4f73", "#0489c4", "#00c2ff", "#9af3ff"]
cells = ""
for wi, wk in enumerate(cal["weeks"]):
    for d in wk["contributionDays"]:
        dow = datetime.date.fromisoformat(d["date"]).weekday(); dow = (dow + 1) % 7
        cells += f'<rect x="{30+wi*15.2:.1f}" y="{84+dow*15.2:.1f}" width="12" height="12" rx="3" fill="{COL[lvl(d["contributionCount"])]}"><title>{d["date"]}: {d["contributionCount"]}</title></rect>'
brk = [("Commits", c["totalCommitContributions"], "#00c2ff"), ("Issues", c["totalIssueContributions"], "#ff4fd8"),
       ("Pull requests", c["totalPullRequestContributions"], "#7c5cff"), ("Reviews", c["totalPullRequestReviewContributions"], "#2ee59d")]
tot = sum(v for _, v, _ in brk) or 1; bx = 30; bars = ""
for name, v, col in brk:
    ww = 840 * v / tot
    if ww > 0: bars += f'<rect x="{bx:.1f}" y="222" width="{max(ww-3,2):.1f}" height="12" rx="6" fill="{col}"/>'; bx += ww
leg = ""; lx = 30
for name, v, col in brk:
    leg += f'<circle cx="{lx+5}" cy="256" r="5" fill="{col}"/><text x="{lx+16}" y="260" {M} font-size="12.5" fill="#c9d3f5">{name} {fmt(v)} ({v*100/tot:.0f}%)</text>'; lx += 215
w("activity", f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 290" width="100%"><defs>{GR}<clipPath id="k"><rect width="900" height="290" rx="18"/></clipPath>
<linearGradient id="sw" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<g clip-path="url(#k)"><rect width="900" height="290" fill="#0b1020"/>
<text x="30" y="40" {F} font-size="20" font-weight="800" fill="url(#g)">{fmt(cal["totalContributions"])} contributions in the last year</text>
<text x="870" y="40" text-anchor="end" {M} font-size="11.5" fill="#6b7396">updated {today}</text>
<text x="30" y="68" {M} font-size="11.5" fill="#8b94b3">Peak day: {mx} contributions</text>{cells}{bars}{leg}
<rect x="-200" width="200" height="290" fill="url(#sw)" transform="skewX(-20)"><animate attributeName="x" values="-200;1100" dur="9s" repeatCount="indefinite"/></rect></g>
<rect x="1" y="1" width="898" height="288" rx="17" fill="none" stroke="#fff" stroke-opacity=".08"/></svg>''')

# ---------- languages by bytes ----------
LC = {"JavaScript": "#f1e05a", "HTML": "#e34c26", "TypeScript": "#3178c6", "Python": "#3572A5", "CSS": "#8b5fd1", "Dart": "#00B4AB", "Jupyter Notebook": "#DA5B0B", "C++": "#f34b7d", "Java": "#b07219", "Shell": "#89e051"}
top = lang.most_common(6); total = sum(lang.values()); other = total - sum(v for _, v in top)
items = top + ([("Other", other)] if other > 0 else []); x = 30; seg = leg2 = ""
for i, (k, v) in enumerate(items):
    ww = 840 * v / total; col = LC.get(k, "#8b94b3")
    seg += f'<rect x="{x:.1f}" y="66" width="{max(ww-2,2):.1f}" height="18" rx="5" fill="{col}"/>'; x += ww
    lx = 30 + (i % 4) * 215; ly = 118 + (i // 4) * 30
    leg2 += f'<circle cx="{lx+6}" cy="{ly}" r="6" fill="{col}"/><text x="{lx+20}" y="{ly+4}" {F} font-size="14" fill="#e8ecf8" font-weight="600">{E(k)}</text><text x="{lx+20+len(k)*8.4+8:.0f}" y="{ly+4}" {M} font-size="12" fill="#8b94b3">{v*100/total:.1f}%</text>'
w("langs", f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 {190 if len(items)>4 else 160}" width="100%"><defs>{GR}</defs><rect width="900" height="{190 if len(items)>4 else 160}" rx="18" fill="#0b1020"/>
<text x="30" y="42" {F} font-size="20" font-weight="800" fill="url(#g)">Languages by code volume</text>{seg}{leg2}
<rect x="1" y="1" width="898" height="{188 if len(items)>4 else 158}" rx="17" fill="none" stroke="#fff" stroke-opacity=".08"/></svg>''')
print("generated:", {"repos": user["public_repos"], "followers": user["followers"], "stars": stars, "contrib": cal["totalContributions"], "langs": [(k, round(v*100/total,1)) for k, v in top]})

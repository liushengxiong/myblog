const q={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function a(r){return r.replace(/[&<>"']/g,e=>q[e]??e)}function x(r){return a(r)}function L(r){const e=r.trim();return e&&(/^mailto:/i.test(e)||/^https?:\/\//i.test(e)||e.startsWith("/")&&!e.startsWith("//"))?e:""}function y(r){const e=[];let t=r.replace(/`([^`\n]+)`/g,(c,l)=>{const u=e.length;return e.push(`<code>${a(l)}</code>`),`\0CODE${u}\0`});return t=t.replace(/\*\*([^*\n]+)\*\*/g,"<strong>$1</strong>"),t=t.replace(/__([^_\n]+)__/g,"<strong>$1</strong>"),t=t.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g,"$1<em>$2</em>"),t=t.replace(/(^|[^_])_([^_\n]+)_(?!_)/g,"$1<em>$2</em>"),t=t.replace(/\[([^\]\n]+)\]\(([^)\n\s]+)\)/g,(c,l,u)=>{const o=L(u);return o?`<a href="${x(o)}" target="_blank" rel="noopener noreferrer">${a(l)}</a>`:a(l)}),t=t.replace(/\u0000CODE(\d+)\u0000/g,(c,l)=>e[Number(l)]??""),t}function B(r){if(!r)return"";const e=r.replace(/\r\n?/g,`
`),t=[];let c=e.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g,(i,n,f)=>{const k=t.length,w=n?` class="language-${x(n)}"`:"";return t.push(`<pre><code${w}>${a(f.replace(/\n$/,""))}</code></pre>`),`\0BLOCK${k}\0`});c=c.split(/(\u0000BLOCK\d+\u0000)/g).map(i=>/^\u0000BLOCK\d+\u0000$/.test(i)?i:a(i)).join("");const u=c.split(`
`),o=[];let g=[],s=null,d=[],$=[];const b=()=>{g.length&&(o.push(`<p>${y(g.join("<br/>"))}</p>`),g=[])},h=()=>{if(s&&d.length){const i=s==="ul"?"ul":"ol";o.push(`<${i}>${d.map(n=>`<li>${y(n)}</li>`).join("")}</${i}>`)}s=null,d=[]},_=()=>{$.length&&(o.push(`<blockquote>${y($.join(" "))}</blockquote>`),$=[])},p=()=>{b(),h(),_()};for(const i of u){const n=i;if(/^\u0000BLOCK\d+\u0000$/.test(n)){p();const m=n.match(/BLOCK(\d+)/);m&&o.push(t[Number(m[1])]??"");continue}if(/^\s*---+\s*$/.test(n)||/^\s*\*\*\*+\s*$/.test(n)){p(),o.push("<hr/>");continue}const f=n.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);if(f){p();const m=f[1].length;o.push(`<h${m}>${y(f[2])}</h${m}>`);continue}const k=n.match(/^>\s?(.*)$/);if(k){b(),h(),$.push(k[1]);continue}const w=n.match(/^[-*]\s+(.+)$/);if(w){b(),_(),s&&s!=="ul"&&h(),s="ul",d.push(w[1]);continue}const C=n.match(/^\d+\.\s+(.+)$/);if(C){b(),_(),s&&s!=="ol"&&h(),s="ol",d.push(C[1]);continue}if(/^\s*$/.test(n)){p();continue}h(),_(),g.push(n)}return p(),o.join(`
`)}function O(r){return`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    line-height: 1.7;
    padding: 1.5rem;
    color: #0f172a;
    background: #fff;
    margin: 0;
  }
  @media (prefers-color-scheme: dark) {
    body { color: #e2e8f0; background: #0f172a; }
    a { color: #93c5fd; }
    code, pre { background: #1e293b; }
  }
  h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin: 1.2em 0 0.6em; font-weight: 700; }
  h1 { font-size: 1.875rem; }
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.25rem; }
  p, ul, ol, blockquote, pre { margin: 0.6em 0; }
  ul, ol { padding-left: 1.4em; }
  code { padding: 0.1em 0.3em; border-radius: 4px; background: #f1f5f9; font-size: 0.9em; }
  pre { padding: 0.8em 1em; border-radius: 8px; overflow-x: auto; }
  pre code { padding: 0; background: transparent; }
  blockquote { padding: 0.4em 1em; border-left: 3px solid #cbd5e1; color: #475569; }
  @media (prefers-color-scheme: dark) { blockquote { color: #94a3b8; border-color: #475569; } }
  a { color: #1d4ed8; text-decoration: underline; }
  hr { border: 0; border-top: 1px solid #e2e8f0; margin: 1.2em 0; }
  img { max-width: 100%; height: auto; border-radius: 12px; }
</style>
</head>
<body>
${r}
</body>
</html>`}export{B as r,O as w};

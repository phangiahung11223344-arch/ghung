const $ = id => document.getElementById(id);
let connected = false;
const headers = () => ({ "x-panel-password": $("password").value });
async function api(url, options={}) {
  const res = await fetch(url, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
function notice(text, bad=false) { $("notice").textContent=text; $("notice").style.color=bad?"#ff9db0":""; }
function lock(on) { connected=on; $("upload").disabled=!on; $("refresh").disabled=!on; }
function esc(s) { return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
async function refresh() {
  const [s, f] = await Promise.all([api("/api/status"), api("/api/files")]);
  $("status").textContent="ONLINE";
  $("status").style.color="var(--mint)";
  $("runtime").textContent=`Node ${s.runtimes.node} • Upload execution disabled`;
  $("count").textContent=String(f.files.length);
  const host=$("files");
  if (!f.files.length) { host.textContent="Chưa có file nào."; return; }
  host.innerHTML="";
  for (const file of f.files) {
    const row=document.createElement("div"); row.className="file";
    row.innerHTML=`<span>📄</span><span class="name">${esc(file.name)}<br><small>${(file.size/1024).toFixed(1)} KB • ${esc(file.modified)}</small></span><button class="delete" type="button">Xóa</button>`;
    row.querySelector("button").addEventListener("click", async()=>{
      if(!confirm(`Xóa ${file.name}?`)) return;
      try { await api("/api/files/"+encodeURIComponent(file.name),{method:"DELETE"}); await refresh(); notice("Đã xóa file."); }
      catch(e){notice(e.message,true);}
    });
    host.appendChild(row);
  }
}
$("connect").addEventListener("click", async()=>{
  try { await refresh(); lock(true); notice("Kết nối thành công."); }
  catch(e){ lock(false); $("status").textContent="LOCKED"; notice(e.message,true); }
});
$("refresh").addEventListener("click", async()=>{try{await refresh();notice("Đã cập nhật.");}catch(e){notice(e.message,true);}});
$("uploadForm").addEventListener("submit", async e=>{
  e.preventDefault();
  const file=$("file").files[0]; if(!file) return;
  if(!/\.(py|js)$/i.test(file.name)){notice("Chỉ nhận file .py hoặc .js.",true);return;}
  const form=new FormData(); form.append("tool",file);
  try {
    const res=await fetch("/api/upload",{method:"POST",headers:headers(),body:form});
    const data=await res.json(); if(!res.ok) throw new Error(data.error||"Upload failed");
    $("file").value=""; await refresh(); notice("Tải lên thành công. File chưa được thực thi.");
  } catch(err){notice(err.message,true);}
});
lock(false);

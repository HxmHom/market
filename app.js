// =========================
// Seed Admin + Boot Migrations
// =========================
(function initSeedAdmin(){
  const ADMIN_EMAIL = 'admin@local';
  const ADMIN_PW = '1234';
  let users = JSON.parse(localStorage.getItem('users')||'[]');
  if (!users.find(u => u.email === ADMIN_EMAIL)) {
    users.push({ email: ADMIN_EMAIL, pw: ADMIN_PW, role: 'admin' });
    localStorage.setItem('users', JSON.stringify(users));
  }
})();

function migrateProductIds(){
  const all = JSON.parse(localStorage.getItem('products')||'[]');
  let changed = false;
  const next = all.map(p=>{
    if (!p.id) {
      changed = true;
      return { ...p, id: 'p_'+Math.random().toString(36).slice(2)+'_'+Date.now() };
    }
    return p;
  });
  if (changed) localStorage.setItem('products', JSON.stringify(next));
}
migrateProductIds();

// =========================
// Utils
// =========================
function getUsers(){ return JSON.parse(localStorage.getItem('users')||'[]'); }
function setUsers(arr){ localStorage.setItem('users', JSON.stringify(arr)); }
function getCurrentEmail(){ return localStorage.getItem('user') || null; }
function getUserRole(email){
  const u = getUsers().find(x=>x.email===email);
  return u?.role || 'guest';
}
function isAdmin(){
  const email = getCurrentEmail();
  return !!email && getUserRole(email) === 'admin';
}
function updateAdminNav(){
  const btn = document.getElementById('adminTab');
  if (!btn) return;
  if (isAdmin()) btn.classList.remove('hidden');
  else btn.classList.add('hidden');
}

// =========================
// Router
// =========================
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const page = document.getElementById(pageId);
  if (!page) return;

  if (pageId === 'admin' && !isAdmin()) {
    alert('จำกัดเฉพาะผู้ดูแลระบบ');
    return;
  }
  page.classList.remove('hidden');

  if (pageId === 'products') loadProducts();
  if (pageId === 'upload') loadUploadForm();
  if (pageId === 'auth') loadAuth();
  if (pageId === 'admin') loadAdmin();
}

// =========================
// Auth
// =========================
function loadAuth() {
  updateAdminNav();
  const container = document.getElementById('auth');
  const email = getCurrentEmail();

  if (email) {
    const role = getUserRole(email);
    container.innerHTML = `
      <div class="card" style="max-width:420px">
        <h4>สวัสดีคุณ ${email} ${role==='admin' ? '👑' : ''}</h4>
        <p>สถานะบัญชี: <b>${role}</b></p>
        <button class="danger" onclick="logout()">ออกจากระบบ</button>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="form-grid">
        <div class="card" style="max-width:420px">
          <h4>เข้าสู่ระบบ</h4>
          <p style="margin:0 0 8px 0">ทดสอบ: admin@local / 1234</p>
          <input id="loginEmail" placeholder="อีเมล" class="input"><br>
          <input id="loginPw" placeholder="รหัสผ่าน" class="input" type="password"><br>
          <button onclick="login()">เข้าสู่ระบบ</button>
        </div>
        <div class="card" style="max-width:420px">
          <h4>สมัครสมาชิก</h4>
          <input id="regEmail" placeholder="อีเมล" class="input"><br>
          <input id="regPw" placeholder="รหัสผ่าน" class="input" type="password"><br>
          <button onclick="register()">สมัครสมาชิก</button>
        </div>
      </div>
    `;
  }
}

function register() {
  const email = document.getElementById('regEmail').value.trim();
  const pw = document.getElementById('regPw').value.trim();

  if (!email || !pw) return alert('กรอกข้อมูลให้ครบ');

  let users = getUsers();
  if (users.find(u => u.email === email)) return alert('อีเมลนี้ถูกใช้แล้ว');

  users.push({ email, pw, role: 'user' });
  setUsers(users);
  alert('สมัครสำเร็จ กรุณาเข้าสู่ระบบ');
  showPage('auth');
}

function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const pw = document.getElementById('loginPw').value;

  let users = getUsers();
  const ok = users.find(u => u.email === email && u.pw === pw);
  if (ok) {
    localStorage.setItem('user', email);
    alert('เข้าสู่ระบบสำเร็จ');
    updateAdminNav();
    showPage('products');
  } else {
    alert('อีเมลหรือรหัสผ่านผิด');
  }
}

function logout() {
  localStorage.removeItem('user');
  updateAdminNav();
  showPage('auth');
}

// =========================
// Products
// =========================
function loadProducts() {
  updateAdminNav();
  migrateProductIds(); // เผื่อมีของเก่าที่ไม่มี id
  const container = document.getElementById('products');
  const all = JSON.parse(localStorage.getItem('products') || '[]');

  const sellers = [...new Set(all.map(p => p.email))];
  let sellerFilter = `<option value="">ทั้งหมด</option>`;
  sellers.forEach(email => {
    sellerFilter += `<option value="${email}">${email}</option>`;
  });

  container.innerHTML = `
    <div class="card" style="max-width:1024px">
      <h4>สินค้าทั้งหมด</h4>
      <label>กรองตามผู้ขาย:
        <select onchange="filterProducts(this.value)" class="input">
          ${sellerFilter}
        </select>
      </label>
      <div class="product-grid" id="product-list" style="margin-top:8px"></div>
    </div>
  `;

  renderProducts(all);
}

function canManageProduct(p){
  const email = getCurrentEmail();
  return isAdmin() || (!!email && p.email === email);
}

function renderProducts(list) {
  const productList = document.getElementById('product-list');
  productList.innerHTML = '';

  list.forEach(p => {
    productList.innerHTML += `
      <div class="card">
        <img src="${p.image_url}" alt="${p.name}" />
        <h4 title="${p.name}">${p.name}</h4>
        <p>🌿 <strong>ราคา:</strong> ${p.price}</p>

        <p>📄 <strong>รายละเอียด:</strong></p>
        <div class="detail-box">${p.detail || '-'}</div>

        <p>👤 <strong>ผู้ขาย:</strong> ${p.email}</p>
        ${p.line_url ? `<a href="${p.line_url}" target="_blank"><button class="line">💬 Line</button></a>` : ''}
        ${p.facebook_url ? `<a href="${p.facebook_url}" target="_blank"><button class="facebook">📞 Facebook</button></a>` : ''}

        ${canManageProduct(p) ? `<button class="danger" onclick="deleteProduct('${p.id||''}')">🗑️ ลบสินค้า</button>` : ''}
      </div>
    `;
  });
}

function toggleDetail(btn){
  const detail = btn.previousElementSibling; // p.detail
  if (!detail) return;
  const expanded = detail.classList.toggle('expanded');
  btn.textContent = expanded ? 'ย่อ' : 'อ่านต่อ';
}

function filterProducts(email) {
  const all = JSON.parse(localStorage.getItem('products') || '[]');
  const filtered = email ? all.filter(p => p.email === email) : all;
  renderProducts(filtered);
}

// =========================
// Upload (UI แยกชัดเจน)
// =========================
function loadUploadForm() {
  updateAdminNav();
  const container = document.getElementById('upload');
  const user = getCurrentEmail();

  if (!user) {
    container.innerHTML = `<div class="card" style="max-width:520px"><p>⚠️ กรุณาเข้าสู่ระบบก่อนลงขายสินค้า</p></div>`;
    return;
  }

  container.innerHTML = `
    <div class="card" style="max-width:520px">
      <h4>ลงขายสินค้า</h4>
      <label>ชื่อสินค้า</label>
      <input id="prodName" class="input" placeholder="เช่น มะม่วงน้ำดอกไม้">

      <label>ราคา</label>
      <input id="prodPrice" class="input" placeholder="เช่น 120 บาท/กก.">

      <label>รายละเอียดสินค้า</label>
      <textarea id="prodDetail" class="input" rows="4" placeholder="คำอธิบายสั้น ๆ"></textarea>

      <label>ลิงก์รูปภาพ</label>
      <input id="prodImage" class="input" placeholder="https://...">

      <div class="two-col">
        <div>
          <label>ลิงก์ Line (ถ้ามี)</label>
          <input id="prodLine" class="input" placeholder="https://line.me/ti/p/...">
        </div>
        <div>
          <label>ลิงก์ Facebook (ถ้ามี)</label>
          <input id="prodFB" class="input" placeholder="https://facebook.com/...">
        </div>
      </div>

      <button onclick="submitProduct()">อัปलोड</button>
    </div>
  `;
}

function submitProduct() {
  const name = document.getElementById('prodName').value.trim();
  const price = document.getElementById('prodPrice').value.trim();
  const detail = document.getElementById('prodDetail').value.trim();
  const image_url = document.getElementById('prodImage').value.trim();
  const line_url = document.getElementById('prodLine').value.trim();
  const facebook_url = document.getElementById('prodFB').value.trim();
  const email = getCurrentEmail();

  if (!name || !price || !image_url) {
    alert('กรุณากรอกชื่อ ราคา และลิงก์รูปภาพ');
    return;
  }

  const newProduct = {
    id: 'p_' + Math.random().toString(36).slice(2) + '_' + Date.now(),
    name, price, detail, image_url, line_url, facebook_url, email
  };
  const all = JSON.parse(localStorage.getItem('products') || '[]');
  all.push(newProduct);
  localStorage.setItem('products', JSON.stringify(all));
  alert('✅ อัปโหลดเรียบร้อยแล้ว');
  showPage('products');
}

// =========================
// Delete (รองรับของเก่าที่ไม่มี id)
// =========================
function deleteProduct(id){
  let all = JSON.parse(localStorage.getItem('products')||'[]');

  if (!id) {
    alert('รายการนี้ไม่มีรหัสสินค้า (ข้อมูลเก่า) กรุณาลบจากหน้าแอดมินหลังล้างข้อมูลเก่า หรือเพิ่มสินค้าใหม่อีกครั้ง');
    return;
  }

  if (!isAdmin()) {
    const target = all.find(p=>p.id===id);
    if (target && target.email !== getCurrentEmail()) {
      alert('คุณไม่มีสิทธิ์ลบสินค้านี้');
      return;
    }
  }

  if (!confirm('ยืนยันการลบสินค้า?')) return;

  const next = all.filter(p=>p.id!==id);
  localStorage.setItem('products', JSON.stringify(next));

  if (!document.getElementById('products').classList.contains('hidden')) loadProducts();
  if (!document.getElementById('admin').classList.contains('hidden')) loadAdmin();
}

// =========================
// Admin
// =========================
function loadAdmin(){
  const wrap = document.getElementById('admin');
  const all = JSON.parse(localStorage.getItem('products')||'[]');
  wrap.innerHTML = `
    <div class="card" style="max-width:1100px">
      <h4>แผงควบคุมผู้ดูแลระบบ</h4>
      <div class="admin-tools">
        <button class="danger" onclick="clearAllProducts()">🧹 ลบสินค้าทั้งหมด</button>
      </div>
      <div class="table" style="margin-top:8px">
        <div class="tr th">
          <div>รูป</div><div>ชื่อ</div><div>ราคา</div><div>ผู้ขาย</div><div>ดำเนินการ</div>
        </div>
        ${all.map(p=>`
          <div class="tr">
            <div><img src="${p.image_url}" class="thumb" alt="${p.name}"/></div>
            <div class="ellipsis" title="${p.name}">${p.name}</div>
            <div>${p.price}</div>
            <div class="ellipsis" title="${p.email}">${p.email}</div>
            <div><button class="danger sm" onclick="deleteProduct('${p.id||''}')">ลบ</button></div>
          </div>`).join('')}
      </div>
    </div>
  `;
}

function clearAllProducts(){
  if (!isAdmin()) return alert('เฉพาะผู้ดูแลระบบ');
  if (!confirm('ยืนยันลบทั้งหมด?')) return;
  localStorage.setItem('products', JSON.stringify([]));
  loadAdmin();
  loadProducts();
}

// =========================
// Boot
// =========================
showPage('auth');     // เริ่มหน้าเข้าระบบให้ชัดเจน
updateAdminNav();

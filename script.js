let posts = [];
let postCounter = 0;

// ===== ระบบผู้ใช้ (Login / Register) =====
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let isRegistering = false;

// เก็บ/โหลด users และ devContents (content ของหน้าอื่น)
let usersCache = JSON.parse(localStorage.getItem("users")) || [];
let devContents = JSON.parse(localStorage.getItem("devContents") || "{}"); // { center1: {title,body,image}, ... }

let currentSection = "community";

// อัปเดตปุ่มผู้ใช้
function updateUserButton() {
    const btn = document.getElementById("userBtn");
    const label = document.getElementById("currentUserLabel");
    const profileBtn = document.getElementById("profileBtn");
    const profilePic = document.getElementById("profilePic");

    if (currentUser) {
        btn.innerText = `🚪 ออกจากระบบ (${currentUser.username})`;
        label.innerText = (currentUser.displayName || currentUser.username) + (currentUser.role === "admin" ? " 👑" : "");
        profileBtn.style.display = "block";
        profilePic.textContent = (currentUser.displayName || currentUser.username || "คุณ").charAt(0);

        btn.onclick = () => {
            localStorage.removeItem("currentUser");
            currentUser = null;
            alert("ออกจากระบบแล้ว");
            location.reload();
        };
    } else {
        btn.innerText = "🔑 สมัคร / เข้าสู่ระบบ";
        label.innerText = "คุณ";
        profileBtn.style.display = "none";
        profilePic.textContent = "คุณ";
        btn.onclick = () => showAuthModal(false);
    }
}
document.addEventListener("DOMContentLoaded", updateUserButton);

// ===== Modal Logic =====
const modal = document.getElementById("authModal");
const closeBtn = document.querySelector("#authModal .close");
const authTitle = document.getElementById("authTitle");
const authAction = document.getElementById("authAction");
const toggleAuth = document.getElementById("toggleAuth");

if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
window.onclick = (e) => { 
    if (e.target === modal) modal.style.display = "none";
    if (e.target === document.getElementById("profileModal")) document.getElementById("profileModal").style.display = "none";
};

if (toggleAuth) {
    toggleAuth.onclick = () => {
        isRegistering = !isRegistering;
        renderAuthForm();
    };
}

function showAuthModal(registerMode) {
    isRegistering = registerMode;
    renderAuthForm();
    modal.style.display = "flex";
}

function renderAuthForm() {
    authTitle.innerText = isRegistering ? "สมัครสมาชิก" : "เข้าสู่ระบบ";
    authAction.innerText = isRegistering ? "สมัครสมาชิก" : "เข้าสู่ระบบ";
    toggleAuth.innerText = isRegistering ? "มีบัญชีแล้ว? เข้าสู่ระบบ" : "ยังไม่มีบัญชี? สมัครสมาชิก";
}

// ===== ฟังก์ชัน login/register =====
if (authAction) {
    authAction.onclick = () => {
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!username || !password) {
            alert("กรุณากรอกข้อมูลให้ครบ");
            return;
        }

        let users = JSON.parse(localStorage.getItem("users")) || [];

        if (isRegistering) {
            if (users.find(u => u.username === username)) {
                alert("มีผู้ใช้นี้แล้ว");
                return;
            }
            users.push({ 
                username, password, role: "user",
                profile: { displayName: username, bio: "", avatarDataUrl: "" }
            });
            localStorage.setItem("users", JSON.stringify(users));
            alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
            showAuthModal(false);
        } else {
            // ====== admin-only login (ตามที่ขอ) ======
            // username: admin, password: "1234 addmin" (มีช่องว่างตรงกลาง)
            if (username === "admin" && password === "1234 addmin") {
                if (!users.find(u => u.username === "admin")) {
                    users.push({ username: "admin", password: "1234 addmin", role: "admin",
                        profile: { displayName: "ผู้ดูแลระบบ", bio: "", avatarDataUrl: "" } });
                    localStorage.setItem("users", JSON.stringify(users));
                }
                currentUser = { username: "admin", role: "admin", displayName: "ผู้ดูแลระบบ" };
                localStorage.setItem("currentUser", JSON.stringify(currentUser));
                alert("เข้าสู่ระบบ Admin สำเร็จ");
                location.reload();
                return;
            }

            const found = users.find(u => u.username === username && u.password === password);
            if (found) {
                currentUser = { username: found.username, role: found.role, displayName: found.profile?.displayName || found.username };
                localStorage.setItem("currentUser", JSON.stringify(currentUser));
                alert(`ยินดีต้อนรับ ${currentUser.displayName || found.username}`);
                location.reload();
            } else {
                alert("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
            }
        }
    };
}

// ==============================
// ระบบเมนู (โครงสร้างเดิม) + ระบุ section ที่เลือก
// ==============================
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.menu-item').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const section = this.dataset.section;
            currentSection = section || "community";

            if (section === 'community') {
                document.getElementById('community-section').style.display = 'block';
                document.getElementById('other-sections').style.display = 'none';
            } else {
                document.getElementById('community-section').style.display = 'none';
                document.getElementById('other-sections').style.display = 'block';
                renderOtherSection(); // แสดงเนื้อหาหน้าอื่น
            }
        });
    });

    // เพิ่มโพสต์ตัวอย่างเมื่อโหลดหน้า
    addExamplePost();
});

// ==============================
// โปรไฟล์ผู้ใช้ (ตามโครงสร้างเดิม)
// ==============================
const profileBtn = document.getElementById("profileBtn");
const profileModal = document.getElementById("profileModal");
const profileClose = document.getElementById("profileClose");
const avatarInput = document.getElementById("avatarInput");
const avatarPreview = document.getElementById("avatarPreview");
const displayNameInput = document.getElementById("displayNameInput");
const bioInput = document.getElementById("bioInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");

if (profileBtn) profileBtn.onclick = () => {
    if (!currentUser) return alert("กรุณาเข้าสู่ระบบก่อน");
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const u = users.find(x => x.username === currentUser.username);
    displayNameInput.value = u?.profile?.displayName || currentUser.username;
    bioInput.value = u?.profile?.bio || "";
    if (u?.profile?.avatarDataUrl) {
        avatarPreview.style.backgroundImage = `url(${u.profile.avatarDataUrl})`;
        avatarPreview.textContent = "";
    } else {
        avatarPreview.style.backgroundImage = "none";
        avatarPreview.textContent = "👤";
    }
    profileModal.style.display = "flex";
};
if (profileClose) profileClose.onclick = () => profileModal.style.display = "none";

if (avatarInput) {
    avatarInput.addEventListener("change", e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            avatarPreview.style.backgroundImage = `url(${reader.result})`;
            avatarPreview.textContent = "";
            avatarPreview.dataset.dataUrl = reader.result; // เก็บไว้ตอนกดบันทึก
        };
        reader.readAsDataURL(file);
    });
}

if (saveProfileBtn) {
    saveProfileBtn.onclick = () => {
        if (!currentUser) return;
        let users = JSON.parse(localStorage.getItem("users")) || [];
        const u = users.find(x => x.username === currentUser.username);
        if (!u) return;
        u.profile = u.profile || {};
        u.profile.displayName = displayNameInput.value.trim() || currentUser.username;
        u.profile.bio = bioInput.value.trim();
        if (avatarPreview.dataset.dataUrl) {
            u.profile.avatarDataUrl = avatarPreview.dataset.dataUrl;
        }
        localStorage.setItem("users", JSON.stringify(users));
        currentUser.displayName = u.profile.displayName;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        alert("บันทึกโปรไฟล์เรียบร้อย");
        profileModal.style.display = "none";
        updateUserButton();
        renderPosts();
    };
}

// ==============================
// โพสต์ (+ Like) — โครงสร้างเดิม
// ==============================
function createPost() {
    if (!currentUser) {
        alert("กรุณาเข้าสู่ระบบก่อนโพสต์");
        return;
    }

    const content = document.getElementById('postContent').value.trim();
    const imageUrl = document.getElementById('imageUrl').value.trim();
    
    if (!content) {
        alert('กรุณาใส่เนื้อหาโพสต์');
        return;
    }

    postCounter++;
    const post = {
        id: postCounter,
        author: currentUser.username,
        content: content,
        image: imageUrl || null,
        time: new Date().toLocaleString('th-TH'),
        comments: [],
        likes: [] // เพิ่มฟิลด์ likes
    };

    posts.unshift(post);
    renderPosts();
    clearForm();
}

function renderPosts() {
    const container = document.getElementById('posts-container');
    container.innerHTML = '';

    posts.forEach(post => {
        const postElement = createPostElement(post);
        container.appendChild(postElement);
    });
}

function createPostElement(post) {
    // ชื่อแสดงจากโปรไฟล์
    let displayName = post.author;
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const u = users.find(x => x.username === post.author);
    if (u?.profile?.displayName) displayName = u.profile.displayName;

    const youLiked = currentUser ? post.likes.includes(currentUser.username) : false;
    const likeText = youLiked ? '❤️ ถูกใจ' : '👍 ถูกใจ';

    const postDiv = document.createElement('div');
    postDiv.className = 'post-card';
    
    postDiv.innerHTML = `
        <div class="post-header">
            <div class="profile-pic">${displayName.charAt(0)}</div>
            <div>
                <div class="post-author">${displayName}${post.author==='admin' ? ' 👑' : ''}</div>
                <div class="post-time">${post.time}</div>
            </div>
        </div>
        
        <div class="post-content">${post.content}</div>
        
        ${post.image ? `<img src="${post.image}" class="post-image" onerror="this.style.display='none'">` : ''}
        
        <div class="post-actions">
            <button class="action-btn" onclick="toggleComments(${post.id})">
                💬 ความคิดเห็น (${post.comments.length})
            </button>
            <button class="action-btn" onclick="toggleLike(${post.id})">
                ${likeText} (${post.likes.length})
            </button>
            <button class="action-btn" onclick="sharePage()">📤 แชร์</button>
            ${currentUser && currentUser.role === "admin" ? 
                `<button class="action-btn" onclick="deletePost(${post.id})">❌ ลบ</button>` : ''}
        </div>
        
        <div class="comments-section" id="comments-${post.id}" style="display: none;">
            <div id="comments-list-${post.id}">
                ${post.comments.map((comment, i) => `
                    <div class="comment">
                        <div class="comment-author">${getDisplayName(comment.author)}</div>
                        <div class="comment-text">${comment.text}</div>
                        ${currentUser && currentUser.role==="admin" ? 
                            `<button class="action-btn" style="margin-top:6px;" onclick="deleteComment(${post.id}, ${i})">ลบความคิดเห็น</button>` : ""}
                    </div>
                `).join('')}
            </div>
            
            <div class="comment-form">
                <input type="text" class="comment-input" id="comment-input-${post.id}" placeholder="เขียนความคิดเห็น..." onkeypress="handleCommentKeyPress(event, ${post.id})">
                <button class="comment-btn" onclick="addComment(${post.id})">ส่ง</button>
            </div>
        </div>
    `;
    
    return postDiv;
}

function handleCommentKeyPress(event, postId) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addComment(postId);
    }
}

function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
}

function addComment(postId) {
    if (!currentUser) {
        alert("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น");
        return;
    }

    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();
    
    if (!text) return;

    const post = posts.find(p => p.id === postId);
    if (post) {
        post.comments.push({
            author: currentUser.username,
            text: text
        });
        
        renderPosts();
        setTimeout(() => {
            document.getElementById(`comments-${postId}`).style.display = 'block';
        }, 100);
    }
}

function deleteComment(postId, index){
    if(!(currentUser && currentUser.role==="admin")) return;
    const post = posts.find(p => p.id === postId);
    if(!post) return;
    post.comments.splice(index, 1);
    renderPosts();
}

// ===== เพิ่ม: Like =====
function toggleLike(postId){
    if(!currentUser){
        alert("กรุณาเข้าสู่ระบบก่อน");
        return;
    }
    const post = posts.find(p => p.id === postId);
    if(!post) return;
    const i = post.likes.indexOf(currentUser.username);
    if(i >= 0){
        post.likes.splice(i,1);
    }else{
        post.likes.push(currentUser.username);
    }
    renderPosts();
}

function sharePage(){
    const url = location.href.split('#')[0];
    if(navigator.clipboard){
        navigator.clipboard.writeText(url).then(()=>alert('คัดลอกลิงก์หน้าแล้ว')).catch(()=>alert('คัดลอกไม่สำเร็จ'));
    }else{
        prompt('คัดลอกลิงก์นี้:', url);
    }
}

function clearForm() {
    document.getElementById('postContent').value = '';
    document.getElementById('imageUrl').value = '';
}

function addExamplePost() {
    const examplePost = {
        id: ++postCounter,
        author: 'ฮ่องปลิด',
        content: 'คำอธิบายโพสต์สำคัญ',
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&h=300&fit=crop',
        time: new Date().toLocaleString('th-TH'),
        comments: [],
        likes: []
    };
    
    posts.push(examplePost);
    renderPosts();
}

function deletePost(postId) {
    posts = posts.filter(p => p.id !== postId);
    renderPosts();
}

// Ctrl+Enter เพื่อโพสต์
document.addEventListener('DOMContentLoaded', function() {
    const postContent = document.getElementById('postContent');
    if (postContent) {
        postContent.addEventListener('keydown', function(event) {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                createPost();
            }
        });
    }
});

// ===== Helper ชื่อแสดงจากโปรไฟล์ =====
function getDisplayName(username){
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const u = users.find(x => x.username === username);
    return u?.profile?.displayName || username;
}

// ==============================
// เนื้อหาหน้าอื่น (ยังคง "อยู่ระหว่างพัฒนา" แต่ admin ใส่หัวข้อ/เนื้อหา/รูปได้)
// ==============================
function renderOtherSection(){
    const tools = document.getElementById("dev-admin-tools");
    const titleEl = document.getElementById("devTitle");
    const bodyEl  = document.getElementById("devBody");
    const imgEl   = document.getElementById("devImage");
    const prev    = document.getElementById("devPreview");

    // โชว์ฟอร์มเฉพาะ admin
    tools.style.display = currentUser && currentUser.role === "admin" ? "block" : "none";

    // โหลดค่าที่เคยเซฟของ section นี้
    const data = devContents[currentSection] || { title:"", body:"", image:"" };
    if (titleEl) titleEl.value = data.title || "";
    if (bodyEl)  bodyEl.value  = data.body  || "";
    if (imgEl)   imgEl.value   = data.image || "";

    // ตัวอย่างแสดงผล
    let html = "";
    if (data.title || data.body || data.image){
        html += `<div class="post-card"><div class="post-header"><div><div class="post-author">${data.title || "(ไม่มีหัวข้อ)"}</div></div></div>`;
        if (data.image) html += `<img class="post-image" src="${data.image}" onerror="this.style.display='none'">`;
        if (data.body)  html += `<div class="post-content" style="margin-top:8px;">${data.body}</div>`;
        html += `</div>`;
    }
    prev.innerHTML = html;
}

// สำหรับปุ่มในฟอร์ม admin
function saveDevContent(){
    const titleEl = document.getElementById("devTitle");
    const bodyEl  = document.getElementById("devBody");
    const imgEl   = document.getElementById("devImage");
    devContents[currentSection] = {
        title: titleEl.value.trim(),
        body:  bodyEl.value.trim(),
        image: imgEl.value.trim()
    };
    localStorage.setItem("devContents", JSON.stringify(devContents));
    alert("บันทึกแล้ว");
    renderOtherSection();
}
function clearDevForm(){
    document.getElementById("devTitle").value = "";
    document.getElementById("devBody").value  = "";
    document.getElementById("devImage").value = "";
}

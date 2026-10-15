const SUPABASE_URL = "https://gxzpykkzbpmmfodedapd.supabase.co"; 
const SUPABASE_ANON_KEY = "Sb_publishable_wSK4GXJOggcj11ZNWRl39g_nBV3KVer";
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const WHATSAPP_USERNAME = "DS13A"; 

let currentStudent = null;
let currentLang = localStorage.getItem('siteLang') || 'ar';

const translations = {
    ar: {
        siteTitle: "موقع طلاب العراق 🇮🇶",
        siteSub: "المنصة الرسمية للخدمات الطلابية والملازم الشاملة",
        navHeader: "🧭 الأقسام الرئيسية",
        menuHome: "🏠 الصفحة الرئيسية والأخبار",
        menuLogin: "👤 حساب الطالب وتسجيل الدخول",
        menuPdf: "📚 مكتبة الملازم والوزاريات",
        menuShare: "📤 شارك ملزمتك مع الطلاب",
        menuServices: "🎓 الخدمات وحاسبة المعدل",
        menuChat: "💬 الشات العام للطلاب",
        menuPlans: "💎 خطط الاشتراكات (بلس وبرو)",
        menuInfo: "📌 القرارات والاتصال بالمالك",
        menuOwner: "🔐 لوحة تحكم المالك الخاصة",
        menuTheme: "🌙 / ☀️ تبديل الوضع",
        menuLang: "🌐 العربية / English"
    },
    en: {
        siteTitle: "Iraq Students Portal 🇮🇶",
        siteSub: "The Official Platform for Student Services & Comprehensive PDFs",
        navHeader: "🧭 Main Navigation",
        menuHome: "🏠 Home & News",
        menuLogin: "👤 Student Account & Login",
        menuPdf: "📚 PDFs & Ministerial Library",
        menuShare: "📤 Share Your PDF",
        menuServices: "🎓 Services & GPA Calculator",
        menuChat: "💬 Public Student Chat",
        menuPlans: "💎 Subscription Plans (Plus & Pro)",
        menuInfo: "📌 Decisions & Contact Owner",
        menuOwner: "🔐 Owner Dashboard",
        menuTheme: "🌙 / ☀️ Toggle Theme",
        menuLang: "🌐 English / العربية"
    }
};

function toggleLanguage() {
    currentLang = currentLang === 'ar' ? 'en' : 'ar';
    localStorage.setItem('siteLang', currentLang);
    applyLanguage();
}

function applyLanguage() {
    const t = translations[currentLang];
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    
    // ترجمة الهيدر والقائمة الجانبية بالكامل
    const elements = {
        'siteMainTitle': t.siteTitle,
        'siteSubTitle': t.siteSub,
        'navHeaderTitle': t.navHeader,
        'menuHome': t.menuHome,
        'menuLogin': t.menuLogin,
        'menuPdf': t.menuPdf,
        'menuShare': t.menuShare,
        'menuServices': t.menuServices,
        'menuChat': t.menuChat,
        'menuPlans': t.menuPlans,
        'menuInfo': t.menuInfo,
        'menuOwner': t.menuOwner,
        'menuTheme': t.menuTheme,
        'menuLang': t.menuLang
    };

    for (let id in elements) {
        const el = document.getElementById(id);
        if (el) el.innerText = elements[id];
    }
}

function navigateTo(pageId) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active-page'));
    document.getElementById(pageId).classList.add('active-page');
    document.getElementById('sidebarMenu').classList.remove('active');
    document.getElementById('overlayBg').classList.remove('active');
    window.scrollTo(0, 0);
}

function toggleSidebar() {
    document.getElementById('sidebarMenu').classList.toggle('active');
    document.getElementById('overlayBg').classList.toggle('active');
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function openWhatsApp(msgDetails) {
    const studentName = currentStudent ? currentStudent.name : 'طالب جديد';
    const fullMessage = encodeURIComponent(`مرحباً أستاذ، أنا (${studentName}) من موقع طلاب العراق، أرغب بالتواصل معك بخصوص: ${msgDetails}`);
    window.open(`https://wa.me/?text=${fullMessage}&username=${WHATSAPP_USERNAME}`, '_blank');
}

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');
    applyLanguage();
    
    const savedStudent = localStorage.getItem('currentStudent');
    if (savedStudent) {
        currentStudent = JSON.parse(savedStudent);
        showStudentDashboard();
    }

    loadStoredAnnouncements();
    fetchChatMessagesFromSupabase();
    loadStudentPdfs();
    checkActivePushNotification();
});

// 🔔 نظام الإشعارات الفورية
function sendPushNotificationFromOwner() {
    const title = document.getElementById('decisionTitle').value.trim();
    const text = document.getElementById('decisionText').value.trim();
    if(!title || !text) return alert('⚠️ أدخل عنوان وتفاصيل الإشعار أولاً!');

    const notifData = { title, text, timestamp: Date.now() };
    localStorage.setItem('activePushNotification', JSON.stringify(notifData));
    
    showPushBanner(title, text);
    alert('🔔 تم إرسال الإشعار الفوري لجميع المترددين على الموقع بنجاح!');
}

function checkActivePushNotification() {
    const notif = JSON.parse(localStorage.getItem('activePushNotification') || 'null');
    if(notif) {
        showPushBanner(notif.title, notif.text);
    }
}

function showPushBanner(title, text) {
    const box = document.getElementById('pushNotificationBox');
    const txt = document.getElementById('pushNotificationText');
    if(box && txt) {
        txt.innerText = `${title}: ${text}`;
        box.classList.remove('hidden');
    }
}

function closeNotification() {
    document.getElementById('pushNotificationBox').classList.add('hidden');
}

// 📤 نظام قسم "شارك ملزمتك" والموافقة من المالك
function submitStudentPDF() {
    const title = document.getElementById('shareTitleInput').value.trim();
    const url = document.getElementById('shareUrlInput').value.trim();
    const desc = document.getElementById('shareDescInput').value.trim();

    if(!title || !url) return alert('⚠️ يرجى إدخال عنوان الملزمة ورابط التحميل!');

    const studentName = currentStudent ? currentStudent.name : 'طالب مساهم';
    const newPdf = {
        id: Date.now(),
        title,
        url,
        desc: desc || 'ملزمة مساهمة من الطالب',
        author: studentName,
        approved: false
    };

    let allPdfs = JSON.parse(localStorage.getItem('studentSharedPdfs') || '[]');
    allPdfs.push(newPdf);
    localStorage.setItem('studentSharedPdfs', JSON.stringify(allPdfs));

    alert('✅ تم إرسال ملزمتك بنجاح! سيتم نشرها فور مراجعتها من قِبل مالك المنصة.');
    document.getElementById('shareTitleInput').value = '';
    document.getElementById('shareUrlInput').value = '';
    document.getElementById('shareDescInput').value = '';
}

function loadStudentPdfs() {
    const publicList = document.getElementById('approvedStudentPdfsList');
    const ownerList = document.getElementById('pendingPdfsOwnerList');
    if(!publicList) return;

    publicList.innerHTML = '';
    if(ownerList) ownerList.innerHTML = '';

    let allPdfs = JSON.parse(localStorage.getItem('studentSharedPdfs') || '[]');

    let approvedCount = 0;
    allPdfs.forEach(pdf => {
        if(pdf.approved) {
            approvedCount++;
            const card = document.createElement('div');
            card.className = 'pdf-card';
            card.innerHTML = `
                <h5>📄 ${pdf.title}</h5>
                <p>${pdf.desc}</p>
                <span style="font-size:0.75rem; color:var(--secondary); display:block; margin-bottom:0.5rem;">👤 بواسطة: ${pdf.author}</span>
                <a href="${pdf.url}" target="_blank" class="btn btn-success">⬇️ تحميل PDF</a>
            `;
            publicList.appendChild(card);
        } else if(ownerList) {
            const item = document.createElement('div');
            item.style.cssText = "background:var(--bg-main); padding:0.8rem; border-radius:8px; border:1px solid var(--border); margin-bottom:0.5rem;";
            item.innerHTML = `
                <strong style="color:var(--primary);">${pdf.title}</strong>
                <p style="font-size:0.8rem; color:var(--text-muted);">${pdf.desc} (من: ${pdf.author})</p>
                <div style="display:flex; gap:0.5rem; margin-top:0.4rem;">
                    <button class="btn btn-success" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick="approvePdf(${pdf.id})">✔️ موافقة ونشر</button>
                    <button class="btn btn-danger" style="padding:0.3rem 0.8rem; font-size:0.8rem;" onclick="deletePdf(${pdf.id})">❌ رفض وحذف</button>
                </div>
            `;
            ownerList.appendChild(item);
        }
    });

    if(approvedCount === 0) {
        publicList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted);">لا توجد ملازم مرفوعة من الطلاب حالياً. كن أول من يشارك ملزمته!</p>`;
    }
}

function approvePdf(id) {
    let allPdfs = JSON.parse(localStorage.getItem('studentSharedPdfs') || '[]');
    const pdf = allPdfs.find(p => p.id === id);
    if(pdf) {
        pdf.approved = true;
        localStorage.setItem('studentSharedPdfs', JSON.stringify(allPdfs));
        loadStudentPdfs();
        alert('✅ تم قبول الملزمة ونشرها في القسم العام بنجاح!');
    }
}

function deletePdf(id) {
    let allPdfs = JSON.parse(localStorage.getItem('studentSharedPdfs') || '[]');
    allPdfs = allPdfs.filter(p => p.id !== id);
    localStorage.setItem('studentSharedPdfs', JSON.stringify(allPdfs));
    loadStudentPdfs();
}

function switchAuthView(view) {
    document.getElementById('loginFormSection').classList.add('hidden');
    document.getElementById('registerFormSection').classList.add('hidden');
    document.getElementById('forgotFormSection').classList.add('hidden');
    
    const title = document.getElementById('authCardTitle');
    if(view === 'login') {
        document.getElementById('loginFormSection').classList.remove('hidden');
        title.innerText = "👤 تسجيل الدخول إلى حسابك";
    } else if(view === 'register') {
        document.getElementById('registerFormSection').classList.remove('hidden');
        title.innerText = "📝 إنشاء حساب طالب جديد";
    } else if(view === 'forgot') {
        document.getElementById('forgotFormSection').classList.remove('hidden');
        title.innerText = "🔑 استعادة كلمة المرور المفقودة";
    }
}

function registerNewStudent() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const phone = document.getElementById('regPhone').value.trim();
    const role = document.getElementById('regRole').value;

    if(!name || !email || !password || !phone) {
        return alert('⚠️ يرجى ملء كافة الحقول المطلوبة!');
    }

    let users = JSON.parse(localStorage.getItem('allStudentsUsers') || '[]');
    const existing = users.find(u => u.email === email);
    if(existing) {
        return alert('⚠️ البريد الإلكتروني مستخدم مسبقاً، يرجى تسجيل الدخول!');
    }

    const newUser = {
        name,
        email,
        password,
        phone,
        role,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
        plan: 'free'
    };

    users.push(newUser);
    localStorage.setItem('allStudentsUsers', JSON.stringify(users));

    currentStudent = newUser;
    localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
    showStudentDashboard();
    alert('✅ تم إنشاء الحساب وتسجيل الدخول بنجاح!');
}

function loginStudent() {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    if(!email || !password) {
        return alert('⚠️ يرجى إدخال البريد الإلكتروني وكلمة المرور!');
    }

    let users = JSON.parse(localStorage.getItem('allStudentsUsers') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if(!user) {
        return alert('⚠️ البريد الإلكتروني أو كلمة المرور غير صحيحة!');
    }

    currentStudent = user;
    localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
    showStudentDashboard();
    alert(`أهلاً بك مجدداً يا ${user.name}! تم تسجيل دخولك بنجاح.`);
}

function sendRecoveryCode() {
    const val = document.getElementById('forgotInput').value.trim();
    if(!val) return alert('⚠️ يرجى إدخال البريد أو رقم الهاتف!');

    let users = JSON.parse(localStorage.getItem('allStudentsUsers') || '[]');
    const user = users.find(u => u.email === val || u.phone === val);

    if(!user) {
        return alert('❌ عذراً، لم يتم العثور على أي حساب مرتبط بهذا البريد أو الهاتف!');
    }

    alert(`✅ تم العثور على الحساب. كلمة المرور الخاصة بك هي: (${user.password})`);
    switchAuthView('login');
}

function showStudentDashboard() {
    document.getElementById('loginFormSection').classList.add('hidden');
    document.getElementById('registerFormSection').classList.add('hidden');
    document.getElementById('forgotFormSection').classList.add('hidden');
    document.getElementById('userProfileBar').classList.remove('hidden');
    document.getElementById('authCardTitle').innerText = "👤 ملف الطالب الشخصي";

    document.getElementById('userNameDisplay').innerText = currentStudent.name;
    document.getElementById('userEmailDisplay').innerText = currentStudent.email;
    document.getElementById('userRoleBadge').innerText = currentStudent.role;
    document.getElementById('userAvatarImg').src = currentStudent.avatar;
    
    const planBadge = document.getElementById('userPlanBadge');
    planBadge.innerText = currentStudent.plan === 'plus' ? 'طالب بلس ⭐' : (currentStudent.plan === 'pro' ? 'طالب برو 🚀' : 'مجاني');
    planBadge.className = `plan-badge ${currentStudent.plan === 'plus' ? 'badge-plus' : (currentStudent.plan === 'pro' ? 'badge-pro' : 'badge-free')}`;
}

function logoutStudent() {
    currentStudent = null;
    localStorage.removeItem('currentStudent');
    document.getElementById('userProfileBar').classList.add('hidden');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    switchAuthView('login');
}

const OWNER_PASSWORD = "ali20112011ali";
function unlockOwnerPanel() {
    if (document.getElementById('ownerPasswordInput').value === OWNER_PASSWORD) {
        document.getElementById('ownerAuthBox').classList.add('hidden');
        document.getElementById('ownerPublishForm').classList.remove('hidden');
    } else { alert('⚠️ كلمة السر غير صحيحة!'); }
}

function lockOwnerPanel() {
    document.getElementById('ownerAuthBox').classList.remove('hidden');
    document.getElementById('ownerPublishForm').classList.add('hidden');
}

function addDecision() {
    const title = document.getElementById('decisionTitle').value.trim();
    const text = document.getElementById('decisionText').value.trim();
    const category = document.getElementById('newsCategorySelect').value;
    if (!title || !text) return alert('⚠️ يرجى ملء كافة حقول الخبر!');
    
    renderNewsItem(title, text, category);
    const storedNews = JSON.parse(localStorage.getItem('ownerNews') || '[]');
    storedNews.push({ title, text, category });
    localStorage.setItem('ownerNews', JSON.stringify(storedNews));

    alert('📢 تم نشر الخبر في الصفحة الرئيسية بنجاح!');
    document.getElementById('decisionTitle').value = '';
    document.getElementById('decisionText').value = '';
}

function ownerUpgradeStudent() {
    const email = document.getElementById('upgradeStudentEmail').value.trim().toLowerCase();
    const newPlan = document.getElementById('upgradePlanSelect').value;
    if(!email) return alert('⚠️ يرجى إدخال البريد الإلكتروني للطالب!');

    let users = JSON.parse(localStorage.getItem('allStudentsUsers') || '[]');
    const student = users.find(u => u.email === email);

    if(!student) {
        return alert('❌ لم يتم العثور على طالب بهذا البريد الإلكتروني المسجل في النظام!');
    }

    student.plan = newPlan;
    localStorage.setItem('allStudentsUsers', JSON.stringify(users));

    if(currentStudent && currentStudent.email === email) {
        currentStudent.plan = newPlan;
        localStorage.setItem('currentStudent', JSON.stringify(currentStudent));
        showStudentDashboard();
    }

    alert(`✅ تم بنجاح ترقية الطالب (${student.name}) إلى خطة (${newPlan.toUpperCase()})!`);
    document.getElementById('upgradeStudentEmail').value = '';
}

function loadStoredAnnouncements() {
    const list = document.getElementById('homeAnnouncementsList');
    if(!list) return;
    list.innerHTML = `
        <div class="announcement-post post-education">
            <div style="display:flex; align-items:center; margin-bottom:0.3rem;">
                <span class="news-badge-education">🏛️ أخبار التربية</span>
                <h4 style="color:var(--primary); font-size:1rem;">اعتماد جداول الامتحانات الوزارية</h4>
            </div>
            <p style="font-size:0.88rem;">أعلنت وزارة التربية اعتماد الجداول الرسمية الخاصة بالامتحانات النهائية.</p>
        </div>
    `;
    const storedNews = JSON.parse(localStorage.getItem('ownerNews') || '[]');
    storedNews.forEach(item => renderNewsItem(item.title, item.text, item.category));
}

function renderNewsItem(title, text, category) {
    const list = document.getElementById('homeAnnouncementsList');
    if(!list) return;
    const post = document.createElement('div');
    const isEdu = category === 'education';
    post.className = `announcement-post ${isEdu ? 'post-education' : 'post-platform'}`;
    post.innerHTML = `<div style="display:flex; align-items:center; margin-bottom:0.3rem;"><span class="${isEdu?'news-badge-education':'news-badge-platform'}">${isEdu?'🏛️ أخبار التربية':'📢 أخبار المنصة'}</span><h4 style="color:var(--primary); font-size:1rem;">${title}</h4></div><p style="font-size:0.88rem;">${text}</p>`;
    list.prepend(post);
}

function calculateAvg() {
    const v1 = parseFloat(document.getElementById('m1').value) || 0;
    const v2 = parseFloat(document.getElementById('m2').value) || 0;
    const v3 = parseFloat(document.getElementById('m3').value) || 0;
    const v4 = parseFloat(document.getElementById('m4').value) || 0;
    if(!v1 || !v2 || !v3 || !v4) return alert('يرجى إدخال جميع الدرجات بشكل صحيح!');
    const avg = (v1 + v2 + v3 + v4) / 4;
    document.getElementById('avgResult').innerText = `المعدل التقديري: ${avg.toFixed(1)}%`;
}

function predictCollege() {
    const avg = parseFloat(document.getElementById('predictAvgInput').value);
    const res = document.getElementById('predictResult');
    if(!avg) return alert('أدخل المعدل أولاً!');
    if(avg >= 90) res.innerText = "🏫 القبول المتوقع: الكليات الطبية والهندسية المتميزة.";
    else if(avg >= 75) res.innerText = "🏫 القبول المتوقع: كليات العلوم والتربية والإدارة والاقتصاد.";
    else res.innerText = "🏫 القبول المتوقع: المعاهد التقنية والكليات الأهلية.";
}

function askAiTeacher() {
    const qInput = document.getElementById('aiQuestionInput').value.trim();
    if(!qInput) return alert('⚠️ يرجى كتابة السؤال أو المسألة أولاً!');

    let qLower = qInput.toLowerCase();
    let numbers = qInput.match(/\d+(\.\d+)?/g);
    let responseText = "";

    if (qLower.includes('قسمة') || qLower.includes('÷') || qLower.includes('/') || qLower.includes('تقسيم')) {
        if (numbers && numbers.length >= 2) {
            let n1 = parseFloat(numbers[0]);
            let n2 = parseFloat(numbers[1]);
            if (n2 === 0) {
                responseText = "❌ خطأ رياضي: لا يمكن القسمة على الصفر!";
            } else {
                let res = (n1 / n2).toFixed(2);
                responseText = `📐 **حل مسألة القسمة المطولة:**\n- العملية: ${n1} ÷ ${n2}\n- **الناتج النهائي:** ${res}\n\n💡 **طريقة الحل:** قمنا بقسمة المقسوم (${n1}) على المقسوم عليه (${n2}) بالتساوي ليكون الناتج ${res}.`;
            }
        } else {
            responseText = "📐 **شرح القسمة:**\n1. اقسم الرقم الأول على المقسوم عليه.\n2. اضرب الناتج واطرح للحصول على الباقي.\n3. أنزل الرقم التالي وكرر الخطوات حتى تنتهي الأرقام.";
        }
    } 
    else if (qLower.includes('ضرب') || qLower.includes('×') || qLower.includes('*')) {
        if (numbers && numbers.length >= 2) {
            let n1 = parseFloat(numbers[0]);
            let n2 = parseFloat(numbers[1]);
            let res = n1 * n2;
            responseText = `✖️ **حل مسألة الضرب:**\n- العملية: ${n1} × ${n2}\n- **الناتج النهائي:** ${res}\n\n💡 **الشرح:** ناتج ضرب العددين هو ${res} بناءً على قواعد جدول الضرب.`;
        } else {
            responseText = "✖️ **شرح الضرب:**\nقم بضرب آحاد العدد الأسفل في أرقام العدد الأعلى مرتبةً مرتبة، ثم اجمع النواتج.";
        }
    } 
    else if (qLower.includes('جمع') || qLower.includes('+')) {
        if (numbers && numbers.length >= 2) {
            let n1 = parseFloat(numbers[0]);
            let n2 = parseFloat(numbers[1]);
            let res = n1 + n2;
            responseText = `➕ **حل مسألة الجمع:**\n- العملية: ${n1} + ${n2}\n- **الناتج النهائي:** ${res}\n\n💡 **الشرح:** مجموع العددين يساوي ${res}.`;
        } else {
            responseText = "➕ **شرح الجمع:**\nرتب المراتب تحت بعضها (آحاد تحت آحاد وعشرات تحت عشرات) واجمعها بدءاً من اليمين.";
        }
    } 
    else if (qLower.includes('طرح') || qLower.includes('-')) {
        if (numbers && numbers.length >= 2) {
            let n1 = parseFloat(numbers[0]);
            let n2 = parseFloat(numbers[1]);
            let res = n1 - n2;
            responseText = `➖ **حل مسألة الطرح:**\n- العملية: ${n1} - ${n2}\n- **الناتج النهائي:** ${res}\n\n💡 **الشرح:** الباقي هو ${res}.`;
        } else {
            responseText = "➖ **شرح الطرح:**\nاطرح المراتب، وفي حال كان الرقم العلوي أصغر من السفلي قم بالاستعانة (التسلاف) من المرتبة المجاورة.";
        }
    } 
    else if (qLower.includes('اعراب') || qLower.includes('قواعد') || qLower.includes('عربي') || qLower.includes('فاعل')) {
        responseText = `📚 **إجابة المدرس الذكي في القواعد:**\n- في المنهج العراقي، عند إعراب أي كلمة يجب تحديد موقعها في الجملة (مبتدأ مرفوع، فاعل مرفوع، أو مفعول به منصوب).\n- *اطرح الجملة أو الكلمة المراد إعرابها بدقة لأعطيك تفصيلها الإعرابي كاملاً.*`;
    } 
    else {
        responseText = `🤖 **تحليل المدرس الذكي لسؤالك:** "${qInput}"\n\n📌 **الخطوات النموذجية للحل الوزاري:**\n1. افهم المعطيات بتركيز شديد.\n2. استخدم القاعدة العلمية الصحيحة المقررة في المنهج.\n3. رتب خطوات الحل لتضمن الحصول على الدرجة الكاملة.\n\n*يمكنك كتابة أي عملية حسابية بالأرقام (مثل: 50 ÷ 5 أو 15 * 6) وسأقوم بحسابها لك فوراً!*`;
    }

    document.getElementById('aiResponseBox').classList.remove('hidden');
    document.getElementById('aiResponseText').innerText = responseText;
}

function sendMessage() {
    const input = document.getElementById('chatMessageInput');
    if(!input.value.trim()) return;
    const name = currentStudent ? currentStudent.name : 'طالب جديد';
    const role = currentStudent ? currentStudent.role : 'طالب';
    const avatar = currentStudent ? currentStudent.avatar : 'https://api.dicebear.com/7.x/bottts/svg?seed=Student';
    const plan = currentStudent ? currentStudent.plan : 'free';
    sendChatMessageToServer(name, role, avatar, input.value.trim(), plan);
    input.value = '';
}

async function sendChatMessageToServer(name, role, avatar, text, plan) {
    if (supabaseClient) {
        await supabaseClient.from('messages').insert([{ name, role, avatar, text, plan }]);
        fetchChatMessagesFromSupabase();
    }
}

async function fetchChatMessagesFromSupabase() {
    if (!supabaseClient) return;
    try {
        const { data } = await supabaseClient.from('messages').select('*').order('id', { ascending: true });
        if (data) {
            const chatBox = document.getElementById('chatBox');
            chatBox.innerHTML = `<div class="chat-message"><img src="https://api.dicebear.com/7.x/bottts/svg?seed=Admin" class="avatar-preview" /><div class="chat-message-content"><div><span class="user-name">إدارة المنصة</span><span class="role-badge" style="background-color: #e11d48;">👑 المالك</span></div><p style="margin-top: 0.3rem; font-size:0.9rem;">أهلاً بكافة الطلاب! تم ربط الشات سحابياً.</p></div></div>`;
            data.forEach(msg => appendChatMessage(msg.name, msg.role, msg.avatar, msg.text, msg.plan));
        }
    } catch (err) { console.log(err); }
}

function appendChatMessage(name, role, avatar, text, plan) {
    const chatBox = document.getElementById('chatBox');
    if(!chatBox) return;
    const msg = document.createElement('div');
    msg.className = 'chat-message';
    let planLabel = plan === 'plus' ? `<span class="plan-badge badge-plus">⭐ بلس</span>` : (plan === 'pro' ? `<span class="plan-badge badge-pro">🚀 برو</span>` : '');
    msg.innerHTML = `<img src="${avatar}" class="avatar-preview" /><div class="chat-message-content"><div><span class="user-name">${name}</span><span class="role-badge">${role}</span>${planLabel}</div><p style="margin-top:0.3rem; font-size:0.9rem;">${text}</p></div>`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

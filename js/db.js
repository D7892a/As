/* ============================================
   طبقة البيانات — تخزين محلي + بيانات أولية
   ============================================ */

const DB_KEY = 'iq_cashier_db_v1';

/* ----- بيانات أولية لمطعم عراقي ----- */
function seedData() {
    return {
        settings: {
            restaurantName: 'مطعم بغداد الذهبي',
            restaurantLogo: '',
            restaurantCover: '',
            slogan: 'أصالة المطبخ العراقي',
            phone: '0770 123 4567',
            address: 'بغداد - شارع الرشيد - مقابل ساحة التحرير',
            currency: 'د.ع',
            taxRate: 5,            // نسبة الضريبة
            serviceCharge: 0,      // رسوم خدمة %
            footerMessage: 'شكراً لزيارتكم — نسعد بخدمتكم دائماً',
            cashierName: 'أحمد الكاشير',
            cashierRole: 'كاشير رئيسي',
            enableTax: true,
            enablePoints: true,    // نقاط الولاء
            pointsPerDinar: 1,     // نقطة لكل ألف دينار
            receiptFooter: 'نتمنى لكم وجبة هنية 🌹',
            lowStockAlert: true,
            printAuto: false,
            theme: 'classic'
        },
        categories: [
            { id: 'c1', name: 'المشاوي العراقية', icon: '🍢', color: '#c1272d' },
            { id: 'c2', name: 'الأطباق الرئيسية', icon: '🍛', color: '#d4af37' },
            { id: 'c3', name: 'المقبلات', icon: '🥗', color: '#1a5d3a' },
            { id: 'c4', name: 'المشروبات', icon: '🥤', color: '#2563eb' },
            { id: 'c5', name: 'الحلويات', icon: '🍮', color: '#7c3aed' },
            { id: 'c6', name: 'الخبز والمخبوزات', icon: '🫓', color: '#d97706' }
        ],
        products: [
            { id: 'p1', name: 'كباب عراقي', price: 12000, categoryId: 'c1', image: '', emoji: '🍢', description: 'كباب لحم ضأن مشوي على الفحم مع الخضار', available: true },
            { id: 'p2', name: 'تيكه لحم', price: 10000, categoryId: 'c1', image: '', emoji: '🍖', description: 'قطع لحم متبلة ومشوية', available: true },
            { id: 'p3', name: 'شيش طاووق', price: 9000, categoryId: 'c1', image: '', emoji: '🍗', description: 'دجاج متبل ومشوي', available: true },
            { id: 'p4', name: 'قوزي', price: 18000, categoryId: 'c2', image: '', emoji: '🍚', description: 'قوزي لحم مع رز ومكسرات', available: true },
            { id: 'p5', name: 'مرقة باذنجان', price: 8500, categoryId: 'c2', image: '', emoji: '🍆', description: 'مرقة باذنجان عراقية أصيلة', available: true },
            { id: 'p6', name: 'دولمة عراقية', price: 7500, categoryId: 'c2', image: '', emoji: '🍇', description: 'دولمة ورق العنب بالخضار', available: true },
            { id: 'p7', name: 'دجاج محشي', price: 16000, categoryId: 'c2', image: '', emoji: '🍗', description: 'دجاج محشي بالرز والخضار', available: true },
            { id: 'p8', name: 'باجة', price: 7000, categoryId: 'c3', image: '', emoji: '🥣', description: 'باجة عراقية تقليدية', available: true },
            { id: 'p9', name: 'سمبوسة', price: 3000, categoryId: 'c3', image: '', emoji: '🥟', description: 'سمبوسة لحم وخضار', available: true },
            { id: 'p10', name: 'تبولة', price: 4500, categoryId: 'c3', image: '', emoji: '🥗', description: 'سلطة تبولة طازجة', available: true },
            { id: 'p11', name: 'فتوش', price: 4500, categoryId: 'c3', image: '', emoji: '🥙', description: 'سلطة فتوش بالخبز المحمص', available: true },
            { id: 'p12', name: 'شاي أحمر', price: 1000, categoryId: 'c4', image: '', emoji: '🫖', description: 'شاي عراقي بالاستكانة', available: true },
            { id: 'p13', name: 'عيران', price: 1500, categoryId: 'c4', image: '', emoji: '🥛', description: 'لبن مخفوق بالنعناع', available: true },
            { id: 'p14', name: 'ليموناضة', price: 2500, categoryId: 'c4', image: '', emoji: '🍋', description: 'عصير ليمون منعش', available: true },
            { id: 'p15', name: 'مشروب غازي', price: 2000, categoryId: 'c4', image: '', emoji: '🥤', description: 'بيبسي / كوكا كولا', available: true },
            { id: 'p16', name: 'كنافة', price: 5000, categoryId: 'c5', image: '', emoji: '🍮', description: 'كنافة بالقشطة والفستق', available: true },
            { id: 'p17', name: 'زلابية', price: 2500, categoryId: 'c5', image: '', emoji: '🍯', description: 'زلابية عراقية بالشيرة', available: true },
            { id: 'p18', name: 'بقلاوة', price: 4500, categoryId: 'c5', image: '', emoji: '🥮', description: 'بقلاوة بالفستق الحلبي', available: true },
            { id: 'p19', name: 'خبز تنور', price: 500, categoryId: 'c6', image: '', emoji: '🫓', description: 'خبز تنور عراقي طازج', available: true },
            { id: 'p20', name: 'صمون', price: 500, categoryId: 'c6', image: '', emoji: '🥖', description: 'خبز صمون طازج', available: true }
        ],
        customers: [
            { id: 'cu1', name: 'عميل نقدي', phone: '-', points: 0, createdAt: Date.now() },
            { id: 'cu0', name: 'محمد عبد الله', phone: '0780 111 2222', points: 120, createdAt: Date.now() },
            { id: 'cu2', name: 'زينب حسن', phone: '0771 333 4444', points: 85, createdAt: Date.now() },
            { id: 'cu3', name: 'علي كاظم', phone: '0790 555 6666', points: 240, createdAt: Date.now() }
        ],
        orders: [],
        orderCounter: 1000,
        meta: { createdAt: Date.now() }
    };
}

/* توليد طلبات تجريبية واقعية (آخر 7 أيام) */
function generateSeedOrders() {
    const custs = ['cu0', 'cu2', 'cu3', 'cu1', 'cu1', 'cu1'];
    const custNames = { cu0: 'محمد عبد الله', cu2: 'زينب حسن', cu3: 'علي كاظم', cu1: 'عميل نقدي' };
    const custPhones = { cu0: '0780 111 2222', cu2: '0771 333 4444', cu3: '0790 555 6666', cu1: '-' };
    const types = ['dine', 'dine', 'take', 'delivery', 'take'];
    const typeLabels = { dine: 'صالة', take: 'سفري', delivery: 'توصيل' };
    const pays = ['cash', 'cash', 'cash', 'card', 'online'];
    const payLabel = { cash: 'كاش', card: 'بطاقة', online: 'إلكتروني' };
    const menus = [
        [['p1', 12000, 'كباب عراقي', 2], ['p12', 1000, 'شاي أحمر', 2], ['p9', 3000, 'سمبوسة', 1]],
        [['p4', 18000, 'قوزي', 1], ['p13', 1500, 'عيران', 1], ['p16', 5000, 'كنافة', 1]],
        [['p3', 9000, 'شيش طاووق', 2], ['p11', 4500, 'فتوش', 1], ['p14', 2500, 'ليموناضة', 2]],
        [['p2', 10000, 'تيكه لحم', 1], ['p10', 4500, 'تبولة', 1], ['p12', 1000, 'شاي أحمر', 1]],
        [['p5', 8500, 'مرقة باذنجان', 1], ['p19', 500, 'خبز تنور', 2], ['p15', 2000, 'مشروب غازي', 1]],
        [['p6', 7500, 'دولمة عراقية', 2], ['p13', 1500, 'عيران', 1]],
        [['p7', 16000, 'دجاج محشي', 1], ['p18', 4500, 'بقلاوة', 1], ['p14', 2500, 'ليموناضة', 1]],
        [['p1', 12000, 'كباب عراقي', 1], ['p8', 7000, 'باجة', 1], ['p20', 500, 'صمون', 2]]
    ];
    const orders = [];
    const now = Date.now();
    let num = 1001;
    for (let d = 6; d >= 0; d--) {
        const perDay = 2 + Math.floor(Math.random() * 3); // 2-4 طلبات يومياً
        for (let k = 0; k < perDay; k++) {
            const menu = menus[Math.floor(Math.random() * menus.length)];
            const items = menu.map(([pid, price, name, qty]) => ({ productId: pid, name, price, qty }));
            const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
            const tax = Math.round(subtotal * 0.05);
            const discount = Math.random() > 0.75 ? Math.round(subtotal * 0.1) : 0;
            const total = subtotal + tax - discount;
            const method = pays[Math.floor(Math.random() * pays.length)];
            const cid = custs[Math.floor(Math.random() * custs.length)];
            const hour = 11 + Math.floor(Math.random() * 10);
            const min = Math.floor(Math.random() * 60);
            const created = new Date(now - d * 86400000);
            created.setHours(hour, min, 0, 0);
            orders.push({
                id: 'seed_' + num,
                number: num,
                items, subtotal, tax, service: 0, discount,
                total, paid: method === 'cash' ? Math.ceil(total / 1000) * 1000 : total,
                change: method === 'cash' ? Math.ceil(total / 1000) * 1000 - total : 0,
                orderType: types[Math.floor(Math.random() * types.length)],
                customerId: cid, customerName: custNames[cid], customerPhone: custPhones[cid],
                paymentMethod: method, notes: '',
                status: Math.random() > 0.2 ? 'completed' : 'preparing',
                cashierName: 'أحمد الكاشير',
                createdAt: created.getTime()
            });
            num++;
        }
    }
    return orders.sort((a, b) => b.createdAt - a.createdAt);
}

/* ----- تحميل / حفظ ----- */
function loadDB() {
    try {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) { console.warn('DB load error', e); }
    const seed = seedData();
    // توليد طلبات تجريبية وضبط عدّاد الطلبات
    const seedOrders = generateSeedOrders();
    seed.orders = seedOrders;
    seed.orderCounter = seedOrders.reduce((m, o) => Math.max(m, o.number), 1000);
    saveDB(seed);
    return seed;
}
function saveDB(db) {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
        console.error('DB save error', e);
        toast('تعذّر الحفظ — قد تكون الذاكرة ممتلئة (الصور كبيرة)', 'error');
    }
}

let DB = loadDB();

/* ----- أدوات ----- */
const uid = (p = 'id') => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const money = (n) => Number(n || 0).toLocaleString('en-US') + ' ' + DB.settings.currency;
const moneyNum = (n) => Number(n || 0).toLocaleString('en-US');
const fmtDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('ar-IQ', { year: 'numeric', month: '2-digit', day: '2-digit' });
};
const fmtDateTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString('ar-IQ', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};
const fmtTime = (ts) => new Date(ts).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

/* ----- وصول مبسّط ----- */
const getSettings = () => DB.settings;
const getCategories = () => DB.categories;
const getProducts = () => DB.products;
const getProduct = (id) => DB.products.find(p => p.id === id);
const getCategory = (id) => DB.categories.find(c => c.id === id);
const getCustomers = () => DB.customers;
const getCustomer = (id) => DB.customers.find(c => c.id === id) || { id: 'cu1', name: 'عميل نقدي', phone: '-' };
const getOrders = () => DB.orders;
const getOrder = (id) => DB.orders.find(o => o.id === id);
const nextOrderNumber = () => { DB.orderCounter += 1; return DB.orderCounter; };

function persist() { saveDB(DB); }

/* ----- عمليات CRUD ----- */
const api = {
    // الفئات
    addCategory(data) {
        const c = { id: uid('c'), icon: '🍴', color: '#c1272d', ...data };
        DB.categories.push(c); persist(); return c;
    },
    updateCategory(id, data) {
        const c = getCategory(id); if (!c) return;
        Object.assign(c, data); persist();
    },
    deleteCategory(id) {
        const inUse = DB.products.some(p => p.categoryId === id);
        if (inUse) { toast('لا يمكن حذف قسم يحتوي على منتجات', 'error'); return false; }
        DB.categories = DB.categories.filter(c => c.id !== id); persist(); return true;
    },
    // المنتجات
    addProduct(data) {
        const p = { id: uid('p'), emoji: '🍽️', available: true, image: '', ...data };
        DB.products.push(p); persist(); return p;
    },
    updateProduct(id, data) {
        const p = getProduct(id); if (!p) return;
        Object.assign(p, data); persist();
    },
    deleteProduct(id) {
        DB.products = DB.products.filter(p => p.id !== id); persist();
    },
    // العملاء
    addCustomer(data) {
        const c = { id: uid('cu'), points: 0, createdAt: Date.now(), phone: '-', ...data };
        DB.customers.push(c); persist(); return c;
    },
    updateCustomer(id, data) {
        const c = getCustomer(id); if (!c) return;
        Object.assign(c, data); persist();
    },
    deleteCustomer(id) {
        if (id === 'cu1') { toast('لا يمكن حذف العميل النقدي الافتراضي', 'error'); return false; }
        DB.customers = DB.customers.filter(c => c.id !== id); persist(); return true;
    },
    // الطلبات
    addOrder(order) {
        order.id = uid('ord');
        order.number = nextOrderNumber();
        order.createdAt = Date.now();
        order.cashierName = getSettings().cashierName;
        DB.orders.unshift(order);
        // تحديث نقاط العميل
        if (order.customerId && order.customerId !== 'cu1' && getSettings().enablePoints) {
            const cust = getCustomer(order.customerId);
            if (cust) {
                const earned = Math.floor(order.total / 1000) * (getSettings().pointsPerDinar || 1);
                cust.points = (cust.points || 0) + earned;
            }
        }
        persist();
        return order;
    },
    updateOrderStatus(id, status) {
        const o = getOrder(id); if (!o) return;
        o.status = status; persist();
    },
    deleteOrder(id) {
        DB.orders = DB.orders.filter(o => o.id !== id); persist();
    },
    // الإعدادات
    saveSettings(data) {
        Object.assign(DB.settings, data); persist();
    },
    resetAll() {
        localStorage.removeItem(DB_KEY);
        DB = loadDB();
    }
};

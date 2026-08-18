/* ============================================
   طبقة البيانات — تخزين محلي + بيانات أولية
   ============================================ */

const DB_KEY = 'iq_cashier_db_v1';
const SESSION_KEY = 'iq_cashier_session_v1';

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
            theme: 'classic',
            /* ----- إعدادات جديدة ----- */
            requirePin: true,        // طلب الرمز السري عند الدخول
            trackStock: true,        // تتبّع المخزون وخصمه تلقائياً
            lowStockQty: 5,          // حد التنبيه لنقص المخزون
            blockOutOfStock: false,  // منع بيع المنتج عند نفاد الكمية
            enableTables: true,      // تفعيل قسم الطاولات
            enableOffers: true,      // تفعيل قسم العروض
            enableShifts: true,      // تفعيل الورديات
            /* ----- إعدادات الأقسام الجديدة ----- */
            enableDelivery: true,    // تفعيل قسم الدليفري والسائقين
            enableReservations: true,// تفعيل الحجوزات
            enableSuppliers: true,   // تفعيل الموردين والمشتريات
            enablePayroll: true,     // تفعيل رواتب الموظفين
            enableWaste: true,       // تفعيل سجل الهدر
            enableFeedback: true,    // تفعيل تقييمات العملاء
            defaultDeliveryFee: 3000,// أجرة توصيل افتراضية
            driverCommission: 2000,  // عمولة السائق لكل طلب
            requireDeliveryZone: true, // لا يسمح للكاشير بإكمال التوصيل بلا منطقة
            requireDeliveryAddress: true,
            enableCashOnDelivery: true,// التحصيل عند التسليم والتسوية مع السائق
            maxDeliveryDiscount: 0,   // حد خصم أجرة التوصيل (0 = لا خصم للكاشير)
            tierBronze: 0,           // حدود مستويات الولاء (بالإنفاق)
            tierSilver: 150000,
            tierGold: 400000,
            tierVip: 1000000,
            tierDiscountSilver: 3,   // خصم تلقائي لكل مستوى %
            tierDiscountGold: 5,
            tierDiscountVip: 10
        },
        users: [
            { id: 'u_admin', name: 'مدير النظام', role: 'admin', pin: '1234', avatar: '👑', jobTitle: 'المدير العام', active: true, perms: {}, payCycle: 'monthly', salaryRate: 1500000, shiftHours: 8, createdAt: Date.now() },
            { id: 'u_cashier', name: 'أحمد الكاشير', role: 'cashier', pin: '1111', avatar: '🧑‍🍳', jobTitle: 'كاشير رئيسي', active: true, perms: {}, payCycle: 'monthly', salaryRate: 800000, shiftHours: 8, createdAt: Date.now() }
        ],
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
        offers: [
            { id: 'of1', name: 'وجبة العائلة', emoji: '👨‍👩‍👧‍👦', image: '', description: 'كباب + شيش طاووق + تبولة + خبز تنور + مشروبين', items: [{ productId: 'p1', qty: 1 }, { productId: 'p3', qty: 1 }, { productId: 'p10', qty: 1 }, { productId: 'p19', qty: 2 }, { productId: 'p15', qty: 2 }], price: 30000, badge: 'الأكثر طلباً', active: true, startDate: '', endDate: '', days: [], sold: 0, createdAt: Date.now() },
            { id: 'of2', name: 'عرض الغداء السريع', emoji: '⚡', image: '', description: 'مرقة باذنجان + خبز تنور + شاي', items: [{ productId: 'p5', qty: 1 }, { productId: 'p19', qty: 1 }, { productId: 'p12', qty: 1 }], price: 8500, badge: 'وفّر 1500', active: true, startDate: '', endDate: '', days: [], sold: 0, createdAt: Date.now() },
            { id: 'of3', name: 'عرض الحلويات', emoji: '🍮', image: '', description: 'كنافة + بقلاوة + شاي', items: [{ productId: 'p16', qty: 1 }, { productId: 'p18', qty: 1 }, { productId: 'p12', qty: 2 }], price: 9500, badge: 'جديد', active: true, startDate: '', endDate: '', days: [], sold: 0, createdAt: Date.now() }
        ],
        tables: [
            { id: 't1', name: 'طاولة 1', seats: 4, zone: 'الصالة', status: 'free', orderId: null, openedAt: null },
            { id: 't2', name: 'طاولة 2', seats: 4, zone: 'الصالة', status: 'free', orderId: null, openedAt: null },
            { id: 't3', name: 'طاولة 3', seats: 6, zone: 'الصالة', status: 'free', orderId: null, openedAt: null },
            { id: 't4', name: 'طاولة 4', seats: 2, zone: 'الصالة', status: 'free', orderId: null, openedAt: null },
            { id: 't5', name: 'طاولة 5', seats: 8, zone: 'العائلات', status: 'free', orderId: null, openedAt: null },
            { id: 't6', name: 'طاولة 6', seats: 6, zone: 'العائلات', status: 'free', orderId: null, openedAt: null },
            { id: 't7', name: 'طاولة 7', seats: 4, zone: 'الحديقة', status: 'free', orderId: null, openedAt: null },
            { id: 't8', name: 'طاولة 8', seats: 4, zone: 'الحديقة', status: 'free', orderId: null, openedAt: null }
        ],
        expenses: [],
        shifts: [],
        activity: [],

        /* ============ البيانات الجديدة ============ */
        drivers: [
            { id: 'dr1', name: 'حسين الدليفري', phone: '0770 900 1122', vehicle: 'دراجة نارية', plate: 'بغداد 12345', commission: 2000, active: true, createdAt: Date.now() },
            { id: 'dr2', name: 'كرار التوصيل', phone: '0781 400 5566', vehicle: 'سيارة', plate: 'بغداد 67890', commission: 3000, active: true, createdAt: Date.now() }
        ],
        zones: [
            { id: 'z1', name: 'الكرادة', fee: 3000, minutes: 20, minimumOrder: 10000, freeAbove: 50000, active: true, color: '#2563eb' },
            { id: 'z2', name: 'الجادرية', fee: 4000, minutes: 25, minimumOrder: 10000, freeAbove: 60000, active: true, color: '#7c3aed' },
            { id: 'z3', name: 'المنصور', fee: 5000, minutes: 35, minimumOrder: 15000, freeAbove: 75000, active: true, color: '#d97706' },
            { id: 'z4', name: 'الأعظمية', fee: 6000, minutes: 45, minimumOrder: 15000, freeAbove: 90000, active: true, color: '#c1272d' }
        ],
        deliveries: [],
        driverSettlements: [],
        suspendedCarts: [],
        reservations: [],
        suppliers: [
            { id: 'sp1', name: 'شركة اللحوم الذهبية', phone: '0770 222 3333', contact: 'أبو علي', category: 'لحوم', balance: 0, note: '', active: true, createdAt: Date.now() },
            { id: 'sp2', name: 'مخازن الخضار المركزية', phone: '0781 444 5555', contact: 'أبو زينب', category: 'خضار', balance: 0, note: '', active: true, createdAt: Date.now() },
            { id: 'sp3', name: 'موزع المشروبات', phone: '0790 666 7777', contact: 'حيدر', category: 'مشروبات', balance: 0, note: '', active: true, createdAt: Date.now() }
        ],
        purchases: [],
        payroll: [],
        attendance: [],
        salaryAdvances: [],
        recipes: {},
        wastes: [],
        feedback: [],
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

/* ----- ترقية قاعدة البيانات (للنسخ القديمة) ----- */
function migrateDB(db) {
    const fresh = seedData();
    // إعدادات ناقصة
    Object.keys(fresh.settings).forEach(k => {
        if (db.settings[k] === undefined) db.settings[k] = fresh.settings[k];
    });
    // مجموعات جديدة
    ['users', 'offers', 'tables', 'expenses', 'shifts', 'activity',
     'drivers', 'zones', 'deliveries', 'driverSettlements', 'suspendedCarts',
     'reservations', 'suppliers', 'purchases', 'payroll', 'attendance',
     'salaryAdvances', 'wastes', 'feedback'].forEach(k => {
        if (!Array.isArray(db[k])) db[k] = fresh[k] ? JSON.parse(JSON.stringify(fresh[k])) : [];
    });
    if (!db.recipes || typeof db.recipes !== 'object' || Array.isArray(db.recipes)) db.recipes = {};
    if (!db.users.length) db.users = fresh.users;
    // ضمان وجود مدير واحد على الأقل
    if (!db.users.some(u => u.role === 'admin')) db.users.unshift(fresh.users[0]);
    // حقول جديدة على المنتجات
    db.products.forEach(p => {
        if (p.stock === undefined) p.stock = 50;
        if (p.cost === undefined) p.cost = Math.round((p.price || 0) * 0.55);
        if (p.sku === undefined) p.sku = '';
    });
    db.tables.forEach(t => { if (t.status === undefined) t.status = 'free'; });
    db.users.forEach(u => {
        if (!u.payCycle) u.payCycle = 'monthly';
        if (u.salaryRate === undefined) u.salaryRate = Number(u.salary || 0);
        if (u.shiftHours === undefined) u.shiftHours = 8;
    });
    db.zones.forEach(z => {
        if (z.active === undefined) z.active = true;
        if (z.minimumOrder === undefined) z.minimumOrder = 0;
        if (z.freeAbove === undefined) z.freeAbove = 0;
        if (!z.color) z.color = '#2563eb';
    });
    db.deliveries.forEach(d => {
        if (!d.collectionStatus) d.collectionStatus = d.paymentMethod === 'cod' ? 'due' : 'prepaid';
        if (d.cashToCollect === undefined) d.cashToCollect = d.paymentMethod === 'cod' ? Number(d.total || 0) : 0;
        if (!d.priority) d.priority = 'normal';
    });
    if (!db.meta) db.meta = { createdAt: Date.now() };
    return db;
}

/* ----- تحميل / حفظ ----- */
function loadDB() {
    try {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) return migrateDB(JSON.parse(raw));
    } catch (e) { console.warn('DB load error', e); }
    const seed = seedData();
    // توليد طلبات تجريبية وضبط عدّاد الطلبات
    const seedOrders = generateSeedOrders();
    seed.orders = seedOrders;
    seed.orderCounter = seedOrders.reduce((m, o) => Math.max(m, o.number), 1000);
    migrateDB(seed);
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
const getUsers = () => DB.users;
const getUser = (id) => DB.users.find(u => u.id === id);
const getOffers = () => DB.offers;
const getOffer = (id) => DB.offers.find(o => o.id === id);
const getTables = () => DB.tables;
const getTable = (id) => DB.tables.find(t => t.id === id);
const getExpenses = () => DB.expenses;
const getShifts = () => DB.shifts;
const getOpenShift = () => DB.shifts.find(s => s.status === 'open');

/* ----- وصول الأقسام الجديدة ----- */
const getDrivers = () => DB.drivers || (DB.drivers = []);
const getDriver = (id) => getDrivers().find(d => d.id === id);
const getZones = () => DB.zones || (DB.zones = []);
const getZone = (id) => getZones().find(z => z.id === id);
const getDeliveries = () => DB.deliveries || (DB.deliveries = []);
const getDelivery = (id) => getDeliveries().find(d => d.id === id);
const getDriverSettlements = () => DB.driverSettlements || (DB.driverSettlements = []);
const getSuspendedCarts = () => DB.suspendedCarts || (DB.suspendedCarts = []);
const getReservations = () => DB.reservations || (DB.reservations = []);
const getReservation = (id) => getReservations().find(r => r.id === id);
const getSuppliers = () => DB.suppliers || (DB.suppliers = []);
const getSupplier = (id) => getSuppliers().find(s => s.id === id);
const getPurchases = () => DB.purchases || (DB.purchases = []);
const getPurchase = (id) => getPurchases().find(p => p.id === id);
const getPayroll = () => DB.payroll || (DB.payroll = []);
const getAttendance = () => DB.attendance || (DB.attendance = []);
const getSalaryAdvances = () => DB.salaryAdvances || (DB.salaryAdvances = []);
const getWastes = () => DB.wastes || (DB.wastes = []);
const getFeedback = () => DB.feedback || (DB.feedback = []);
const getRecipes = () => DB.recipes || (DB.recipes = {});
const getRecipe = (productId) => getRecipes()[productId] || null;

/* ----- مستويات الولاء ----- */
const LOYALTY_TIERS = [
    { key: 'vip', label: 'VIP ماسي', icon: '💎', color: '#7c3aed', minKey: 'tierVip', discKey: 'tierDiscountVip' },
    { key: 'gold', label: 'ذهبي', icon: '🥇', color: '#d4af37', minKey: 'tierGold', discKey: 'tierDiscountGold' },
    { key: 'silver', label: 'فضي', icon: '🥈', color: '#94a3b8', minKey: 'tierSilver', discKey: 'tierDiscountSilver' },
    { key: 'bronze', label: 'برونزي', icon: '🥉', color: '#b45309', minKey: 'tierBronze', discKey: null }
];
/* إجمالي إنفاق العميل */
function customerSpent(customerId) {
    return DB.orders.filter(o => o.customerId === customerId && o.status !== 'cancelled')
        .reduce((s, o) => s + Number(o.total || 0), 0);
}
/* مستوى العميل حسب الإنفاق */
function customerTier(customerId) {
    const s = getSettings();
    const spent = customerSpent(customerId);
    const t = LOYALTY_TIERS.find(t => spent >= Number(s[t.minKey] || 0)) || LOYALTY_TIERS[LOYALTY_TIERS.length - 1];
    return { ...t, spent, discount: t.discKey ? Number(s[t.discKey] || 0) : 0 };
}
/* السعر الأصلي للعرض قبل التخفيض */
const offerOriginalPrice = (offer) => (offer.items || []).reduce((s, it) => {
    const p = getProduct(it.productId);
    return s + (p ? p.price * (it.qty || 1) : 0);
}, 0);
const offerSaving = (offer) => Math.max(0, offerOriginalPrice(offer) - Number(offer.price || 0));
/* هل العرض ساري اليوم؟ */
function isOfferLive(offer) {
    if (!offer.active) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (offer.startDate && new Date(offer.startDate).setHours(0, 0, 0, 0) > today.getTime()) return false;
    if (offer.endDate && new Date(offer.endDate).setHours(23, 59, 59, 0) < Date.now()) return false;
    if (Array.isArray(offer.days) && offer.days.length && !offer.days.includes(new Date().getDay())) return false;
    return true;
}
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
        order.cashierName = (typeof currentUser === 'function' && currentUser()) ? currentUser().name : getSettings().cashierName;
        order.cashierId = (typeof currentUser === 'function' && currentUser()) ? currentUser().id : '';
        const sh = getOpenShift();
        order.shiftId = sh ? sh.id : null;
        DB.orders.unshift(order);
        // خصم المخزون + احتساب مبيعات العروض
        applyStockForOrder(order, -1);
        (order.items || []).forEach(i => {
            if (i.isOffer) { const of = getOffer(i.offerId); if (of) of.sold = (of.sold || 0) + i.qty; }
        });
        // ربط الطاولة
        if (order.tableId) {
            const t = getTable(order.tableId);
            if (t) { t.status = 'busy'; t.orderId = order.id; t.openedAt = Date.now(); }
        }
        // تحديث نقاط العميل
        if (order.customerId && order.customerId !== 'cu1' && getSettings().enablePoints) {
            const cust = getCustomer(order.customerId);
            if (cust) {
                const earned = Math.floor(order.total / 1000) * (getSettings().pointsPerDinar || 1);
                cust.points = (cust.points || 0) + earned;
            }
        }
        logActivity('order', `طلب جديد #${order.number} بمبلغ ${moneyNum(order.total)}`);
        persist();
        return order;
    },
    updateOrderStatus(id, status) {
        const o = getOrder(id); if (!o) return;
        o.status = status;
        // تحرير الطاولة عند الإكمال أو الإلغاء
        if ((status === 'completed' || status === 'cancelled') && o.tableId) {
            const t = getTable(o.tableId);
            if (t && t.orderId === o.id) { t.status = 'free'; t.orderId = null; t.openedAt = null; }
        }
        // إرجاع المخزون عند الإلغاء
        if (status === 'cancelled' && !o.stockReturned) { applyStockForOrder(o, +1); o.stockReturned = true; }
        logActivity('order', `تحديث حالة الطلب #${o.number} إلى ${status}`);
        persist();
    },
    deleteOrder(id) {
        const o = getOrder(id);
        if (o && o.tableId) {
            const t = getTable(o.tableId);
            if (t && t.orderId === o.id) { t.status = 'free'; t.orderId = null; t.openedAt = null; }
        }
        DB.orders = DB.orders.filter(o => o.id !== id);
        logActivity('order', `حذف الطلب #${o ? o.number : id}`);
        persist();
    },

    /* ============ المستخدمون والصلاحيات ============ */
    addUser(data) {
        const u = { id: uid('u'), role: 'cashier', pin: '0000', avatar: '🧑‍🍳', jobTitle: 'كاشير', active: true, perms: {}, createdAt: Date.now(), ...data };
        DB.users.push(u); logActivity('user', `إضافة مستخدم: ${u.name}`); persist(); return u;
    },
    updateUser(id, data) {
        const u = getUser(id); if (!u) return;
        Object.assign(u, data); logActivity('user', `تعديل المستخدم: ${u.name}`); persist();
    },
    deleteUser(id) {
        const u = getUser(id);
        if (!u) return false;
        if (u.role === 'admin' && DB.users.filter(x => x.role === 'admin').length <= 1) { toast('لا يمكن حذف آخر مدير في النظام', 'error'); return false; }
        if (typeof currentUser === 'function' && currentUser() && currentUser().id === id) { toast('لا يمكنك حذف حسابك أثناء استخدامه', 'error'); return false; }
        DB.users = DB.users.filter(x => x.id !== id); logActivity('user', `حذف المستخدم: ${u.name}`); persist(); return true;
    },

    /* ============ العروض ============ */
    addOffer(data) {
        const o = { id: uid('of'), emoji: '🎁', image: '', items: [], price: 0, badge: '', active: true, startDate: '', endDate: '', days: [], sold: 0, createdAt: Date.now(), ...data };
        DB.offers.push(o); logActivity('offer', `إضافة عرض: ${o.name}`); persist(); return o;
    },
    updateOffer(id, data) { const o = getOffer(id); if (!o) return; Object.assign(o, data); persist(); },
    deleteOffer(id) { DB.offers = DB.offers.filter(o => o.id !== id); persist(); },

    /* ============ الطاولات ============ */
    addTable(data) {
        const t = { id: uid('t'), seats: 4, zone: 'الصالة', status: 'free', orderId: null, openedAt: null, ...data };
        DB.tables.push(t); persist(); return t;
    },
    updateTable(id, data) { const t = getTable(id); if (!t) return; Object.assign(t, data); persist(); },
    deleteTable(id) { DB.tables = DB.tables.filter(t => t.id !== id); persist(); },

    /* ============ المصروفات ============ */
    addExpense(data) {
        const sh = getOpenShift();
        const e = {
            id: uid('ex'), category: 'أخرى', amount: 0, note: '', createdAt: Date.now(),
            userName: (typeof currentUser === 'function' && currentUser()) ? currentUser().name : '-',
            shiftId: sh ? sh.id : null, ...data
        };
        DB.expenses.unshift(e); logActivity('expense', `مصروف: ${e.title} (${moneyNum(e.amount)})`); persist(); return e;
    },
    updateExpense(id, data) { const e = DB.expenses.find(x => x.id === id); if (!e) return; Object.assign(e, data); persist(); },
    deleteExpense(id) { DB.expenses = DB.expenses.filter(e => e.id !== id); persist(); },

    /* ============ الورديات ============ */
    openShift(openingCash, note = '') {
        if (getOpenShift()) { toast('توجد وردية مفتوحة بالفعل', 'warning'); return null; }
        const u = (typeof currentUser === 'function' && currentUser()) ? currentUser() : { id: '', name: getSettings().cashierName };
        const s = { id: uid('sh'), userId: u.id, userName: u.name, openedAt: Date.now(), closedAt: null, openingCash: Number(openingCash) || 0, closingCash: 0, note, status: 'open' };
        DB.shifts.unshift(s); logActivity('shift', `فتح وردية برصيد ${moneyNum(s.openingCash)}`); persist(); return s;
    },
    closeShift(closingCash, note = '') {
        const s = getOpenShift(); if (!s) return null;
        s.closedAt = Date.now();
        s.closingCash = Number(closingCash) || 0;
        s.note = note || s.note;
        s.status = 'closed';
        const sum = shiftSummary(s);
        s.summary = sum;
        s.difference = s.closingCash - sum.expectedCash;
        logActivity('shift', `إغلاق وردية — الفرق ${moneyNum(s.difference)}`);
        persist(); return s;
    },

    /* ============ الدليفري والسائقون ============ */
    addDriver(data) {
        const d = { id: uid('dr'), name: '', phone: '', vehicle: 'دراجة نارية', plate: '', commission: getSettings().driverCommission || 0, active: true, createdAt: Date.now(), ...data };
        DB.drivers.push(d); logActivity('delivery', `إضافة سائق: ${d.name}`); persist(); return d;
    },
    updateDriver(id, data) { const d = getDriver(id); if (!d) return; Object.assign(d, data); logActivity('delivery', `تحديث سائق: ${d.name}`); persist(); },
    deleteDriver(id) {
        if (getDeliveries().some(x => x.driverId === id && x.status !== 'delivered' && x.status !== 'cancelled')) {
            toast('لا يمكن حذف سائق لديه طلبات جارية', 'error'); return false;
        }
        DB.drivers = DB.drivers.filter(d => d.id !== id); persist(); return true;
    },
    addZone(data) { const z = { id: uid('z'), name: '', fee: 0, minutes: 30, minimumOrder: 0, freeAbove: 0, active: true, color: '#2563eb', ...data }; DB.zones.push(z); logActivity('delivery', `إضافة منطقة توصيل: ${z.name}`); persist(); return z; },
    updateZone(id, data) { const z = getZone(id); if (!z) return; Object.assign(z, data); logActivity('delivery', `تحديث تسعيرة منطقة ${z.name}: ${moneyNum(z.fee)}`); persist(); },
    deleteZone(id) {
        const z = getZone(id); if (!z) return false;
        if (getDeliveries().some(d => d.zoneId === id)) { toast('لا يمكن حذف منطقة مرتبطة بطلبات سابقة — أوقفها بدلاً من ذلك للحفاظ على التقارير', 'warning'); return false; }
        DB.zones = DB.zones.filter(x => x.id !== id); logActivity('delivery', `حذف منطقة: ${z.name}`); persist(); return true;
    },

    addDelivery(data) {
        const d = {
            id: uid('dl'), orderId: null, orderNumber: null, driverId: null, zoneId: null,
            address: '', phone: '', customerName: '', fee: 0, total: 0,
            paymentMethod: 'cash', cashToCollect: 0, collectionStatus: 'prepaid',
            priority: 'normal', promisedAt: null, attempts: 0,
            status: 'pending', // pending | assigned | onway | delivered | cancelled
            createdAt: Date.now(), assignedAt: null, pickedAt: null, deliveredAt: null, note: '', ...data
        };
        DB.deliveries.unshift(d); logActivity('delivery', `طلب توصيل جديد #${d.orderNumber || '-'}`); persist(); return d;
    },
    updateDelivery(id, data) { const d = getDelivery(id); if (!d) return; Object.assign(d, data); persist(); },
    setDeliveryStatus(id, status) {
        const d = getDelivery(id); if (!d) return;
        d.status = status;
        if (status === 'assigned') d.assignedAt = Date.now();
        if (status === 'onway') d.pickedAt = Date.now();
        if (status === 'delivered') {
            d.deliveredAt = Date.now();
            if (d.paymentMethod === 'cod' && d.collectionStatus === 'due') d.collectionStatus = 'collected';
            const o = d.orderId ? getOrder(d.orderId) : null;
            if (o && o.status !== 'completed') o.status = 'completed';
        }
        logActivity('delivery', `تحديث توصيل #${d.orderNumber || '-'} إلى ${status}`);
        persist();
    },
    assignDriver(deliveryId, driverId) {
        const d = getDelivery(deliveryId); if (!d) return;
        d.driverId = driverId; d.status = 'assigned'; d.assignedAt = Date.now();
        const dr = getDriver(driverId);
        logActivity('delivery', `إسناد الطلب #${d.orderNumber || '-'} إلى ${dr ? dr.name : '-'}`);
        persist();
    },
    deleteDelivery(id) { DB.deliveries = DB.deliveries.filter(d => d.id !== id); persist(); },

    settleDriver(driverId, deliveryIds, amount, note = '') {
        const ids = Array.isArray(deliveryIds) ? deliveryIds : [];
        const list = getDeliveries().filter(d => ids.includes(d.id) && d.driverId === driverId && d.collectionStatus === 'collected');
        if (!list.length) return null;
        const expected = list.reduce((s, d) => s + Number(d.cashToCollect || 0), 0);
        const dr = getDriver(driverId);
        const st = {
            id: uid('dst'), driverId, driverName: dr?.name || '-', deliveryIds: list.map(d => d.id),
            expected, amount: Number(amount || 0), difference: Number(amount || 0) - expected,
            commission: list.length * Number(dr?.commission || 0), note,
            createdAt: Date.now(), userName: (typeof currentUser === 'function' && currentUser()) ? currentUser().name : '-'
        };
        DB.driverSettlements.unshift(st);
        list.forEach(d => { d.collectionStatus = 'settled'; d.settlementId = st.id; d.settledAt = st.createdAt; });
        logActivity('delivery', `تسوية تحصيل السائق ${st.driverName}: ${moneyNum(st.amount)} (${list.length} طلب)`);
        persist(); return st;
    },

    /* ============ الطلبات المعلّقة في الكاشير ============ */
    addSuspendedCart(data) {
        const h = { id: uid('hold'), label: '', items: [], createdAt: Date.now(), userId: '', userName: '', ...data };
        DB.suspendedCarts.unshift(h); logActivity('order', `تعليق طلب: ${h.label || h.id}`); persist(); return h;
    },
    deleteSuspendedCart(id) { DB.suspendedCarts = DB.suspendedCarts.filter(x => x.id !== id); persist(); },

    /* ============ الحجوزات ============ */
    addReservation(data) {
        const r = {
            id: uid('rs'), customerName: '', phone: '', guests: 2, tableId: null,
            date: new Date().toISOString().slice(0, 10), time: '20:00', note: '',
            status: 'booked', // booked | seated | done | noshow | cancelled
            deposit: 0, createdAt: Date.now(), ...data
        };
        DB.reservations.unshift(r); logActivity('reservation', `حجز جديد: ${r.customerName} (${r.guests} أشخاص)`); persist(); return r;
    },
    updateReservation(id, data) { const r = getReservation(id); if (!r) return; Object.assign(r, data); persist(); },
    setReservationStatus(id, status) {
        const r = getReservation(id); if (!r) return;
        r.status = status;
        const t = r.tableId ? getTable(r.tableId) : null;
        if (t) {
            if (status === 'booked') t.status = 'reserved';
            else if (status === 'seated') { t.status = 'busy'; t.openedAt = Date.now(); }
            else if (['done', 'cancelled', 'noshow'].includes(status) && !t.orderId) { t.status = 'free'; t.openedAt = null; }
        }
        logActivity('reservation', `حجز ${r.customerName}: ${status}`);
        persist();
    },
    deleteReservation(id) {
        const r = getReservation(id);
        if (r && r.tableId) { const t = getTable(r.tableId); if (t && t.status === 'reserved' && !t.orderId) t.status = 'free'; }
        DB.reservations = DB.reservations.filter(x => x.id !== id); persist();
    },

    /* ============ الموردون والمشتريات ============ */
    addSupplier(data) {
        const s = { id: uid('sp'), name: '', phone: '', contact: '', category: 'عام', balance: 0, note: '', active: true, createdAt: Date.now(), ...data };
        DB.suppliers.push(s); logActivity('supplier', `إضافة مورد: ${s.name}`); persist(); return s;
    },
    updateSupplier(id, data) { const s = getSupplier(id); if (!s) return; Object.assign(s, data); persist(); },
    deleteSupplier(id) { DB.suppliers = DB.suppliers.filter(s => s.id !== id); persist(); },

    addPurchase(data) {
        const p = {
            id: uid('pu'), supplierId: null, supplierName: '', invoiceNo: '',
            items: [], total: 0, paid: 0, status: 'unpaid', // unpaid | partial | paid
            note: '', addToStock: true, createdAt: Date.now(),
            userName: (typeof currentUser === 'function' && currentUser()) ? currentUser().name : '-', ...data
        };
        p.total = p.items.reduce((s, i) => s + Number(i.qty || 0) * Number(i.cost || 0), 0) || Number(p.total) || 0;
        p.status = p.paid >= p.total ? 'paid' : p.paid > 0 ? 'partial' : 'unpaid';
        DB.purchases.unshift(p);
        // إضافة الكميات إلى المخزون وتحديث التكلفة
        if (p.addToStock) {
            p.items.forEach(i => {
                const prod = getProduct(i.productId);
                if (prod) {
                    prod.stock = Math.max(0, (Number(prod.stock) || 0) + Number(i.qty || 0));
                    if (Number(i.cost) > 0) prod.cost = Number(i.cost);
                }
            });
        }
        // رصيد المورد (المتبقي عليه)
        const sup = getSupplier(p.supplierId);
        if (sup) sup.balance = (Number(sup.balance) || 0) + (p.total - p.paid);
        logActivity('purchase', `فاتورة شراء ${p.invoiceNo || ''} بمبلغ ${moneyNum(p.total)}`);
        persist(); return p;
    },
    payPurchase(id, amount) {
        const p = getPurchase(id); if (!p) return;
        const amt = Math.max(0, Math.min(Number(amount) || 0, p.total - p.paid));
        p.paid += amt;
        p.status = p.paid >= p.total ? 'paid' : p.paid > 0 ? 'partial' : 'unpaid';
        const sup = getSupplier(p.supplierId);
        if (sup) sup.balance = Math.max(0, (Number(sup.balance) || 0) - amt);
        logActivity('purchase', `دفعة للمورد ${p.supplierName}: ${moneyNum(amt)}`);
        persist();
    },
    deletePurchase(id) { DB.purchases = DB.purchases.filter(p => p.id !== id); persist(); },

    /* ============ الرواتب ============ */
    addPayroll(data) {
        const p = {
            id: uid('pr'), userId: null, userName: '', month: new Date().toISOString().slice(0, 7),
            base: 0, bonus: 0, deduction: 0, advance: 0, net: 0, paid: false, paidAt: null, note: '',
            createdAt: Date.now(), ...data
        };
        p.net = Number(p.base || 0) + Number(p.bonus || 0) - Number(p.deduction || 0) - Number(p.advance || 0);
        DB.payroll.unshift(p); logActivity('payroll', `قيد راتب: ${p.userName} (${p.month})`); persist(); return p;
    },
    updatePayroll(id, data) {
        const p = DB.payroll.find(x => x.id === id); if (!p) return;
        Object.assign(p, data);
        p.net = Number(p.base || 0) + Number(p.bonus || 0) - Number(p.deduction || 0) - Number(p.advance || 0);
        persist();
    },
    payPayroll(id) {
        const p = DB.payroll.find(x => x.id === id); if (!p) return;
        if (p.paid) { toast('هذا المستحق مصروف مسبقاً', 'warning'); return p; }
        p.paid = true; p.paidAt = Date.now();
        (p.advanceIds || []).forEach(aid => {
            const a = getSalaryAdvances().find(x => x.id === aid);
            if (a) { a.recovered = true; a.recoveredAt = Date.now(); a.payrollId = p.id; }
        });
        // تسجيلها كمصروف تلقائياً
        api.addExpense({ title: `راتب ${p.userName} — ${p.month}`, category: 'رواتب', amount: p.net, note: 'قيد آلي من كشف الرواتب' });
        logActivity('payroll', `صرف راتب ${p.userName}: ${moneyNum(p.net)}`);
        persist();
    },
    deletePayroll(id) { DB.payroll = DB.payroll.filter(p => p.id !== id); persist(); },

    /* ============ الحضور والسلف ============ */
    addAttendance(data) {
        const a = { id: uid('att'), userId: null, userName: '', date: new Date().toISOString().slice(0, 10), checkIn: '', checkOut: '', status: 'present', lateMinutes: 0, overtimeMinutes: 0, note: '', createdAt: Date.now(), ...data };
        DB.attendance.unshift(a); logActivity('attendance', `حضور ${a.userName}: ${a.date}`); persist(); return a;
    },
    updateAttendance(id, data) { const a = getAttendance().find(x => x.id === id); if (!a) return; Object.assign(a, data); persist(); },
    deleteAttendance(id) { DB.attendance = DB.attendance.filter(x => x.id !== id); persist(); },
    addSalaryAdvance(data) {
        const a = { id: uid('adv'), userId: null, userName: '', amount: 0, date: new Date().toISOString().slice(0, 10), recovered: false, note: '', createdAt: Date.now(), ...data };
        DB.salaryAdvances.unshift(a);
        const ex = api.addExpense({ title: `سلفة موظف — ${a.userName}`, category: 'سلف موظفين', amount: a.amount, note: a.note || 'قيد آلي من الموارد البشرية' });
        a.expenseId = ex?.id || null;
        logActivity('payroll', `سلفة ${a.userName}: ${moneyNum(a.amount)}`); persist(); return a;
    },
    deleteSalaryAdvance(id) {
        const a = getSalaryAdvances().find(x => x.id === id); if (!a || a.recovered) return false;
        DB.salaryAdvances = DB.salaryAdvances.filter(x => x.id !== id);
        if (a.expenseId) DB.expenses = DB.expenses.filter(e => e.id !== a.expenseId);
        logActivity('payroll', `حذف سلفة ${a.userName}: ${moneyNum(a.amount)}`); persist(); return true;
    },

    /* ============ الهدر والتالف ============ */
    addWaste(data) {
        const w = {
            id: uid('ws'), productId: null, productName: '', qty: 1, reason: 'تالف',
            cost: 0, note: '', createdAt: Date.now(),
            userName: (typeof currentUser === 'function' && currentUser()) ? currentUser().name : '-', ...data
        };
        DB.wastes.unshift(w);
        const p = getProduct(w.productId);
        if (p) {
            p.stock = Math.max(0, (Number(p.stock) || 0) - Number(w.qty || 0));
            if (!w.cost) w.cost = Number(p.cost || 0) * Number(w.qty || 0);
        }
        logActivity('waste', `هدر: ${w.productName} ×${w.qty} (${w.reason})`);
        persist(); return w;
    },
    deleteWaste(id) { DB.wastes = DB.wastes.filter(w => w.id !== id); persist(); },

    /* ============ تقييمات العملاء ============ */
    addFeedback(data) {
        const f = {
            id: uid('fb'), orderId: null, orderNumber: null, customerName: '',
            rating: 5, food: 5, service: 5, speed: 5, comment: '', createdAt: Date.now(), ...data
        };
        DB.feedback.unshift(f); persist(); return f;
    },
    deleteFeedback(id) { DB.feedback = DB.feedback.filter(f => f.id !== id); persist(); },

    /* ============ الوصفات (المكوّنات) ============ */
    setRecipe(productId, items) {
        if (!DB.recipes) DB.recipes = {};
        DB.recipes[productId] = items || [];
        logActivity('recipe', `تحديث وصفة: ${getProduct(productId)?.name || productId}`);
        persist();
    },
    deleteRecipe(productId) { if (DB.recipes) delete DB.recipes[productId]; persist(); },

    /* ============ المخزون ============ */
    setStock(productId, qty, reason = 'تعديل يدوي') {
        const p = getProduct(productId); if (!p) return;
        p.stock = Math.max(0, Number(qty) || 0);
        logActivity('stock', `${reason}: ${p.name} = ${p.stock}`);
        persist();
    },
    addStock(productId, qty, reason = 'إضافة مخزون') {
        const p = getProduct(productId); if (!p) return;
        p.stock = Math.max(0, (Number(p.stock) || 0) + (Number(qty) || 0));
        logActivity('stock', `${reason}: ${p.name} (+${qty})`);
        persist();
    },

    /* ============ أدوات المدير — التصفير ============ */
    resetOrders(alsoCounter = false) {
        DB.orders = [];
        DB.tables.forEach(t => { t.status = 'free'; t.orderId = null; t.openedAt = null; });
        if (alsoCounter) DB.orderCounter = 1000;
        logActivity('danger', 'تصفير جميع الطلبات');
        persist();
    },
    resetTodayOrders() {
        const start = new Date().setHours(0, 0, 0, 0);
        const before = DB.orders.length;
        DB.orders = DB.orders.filter(o => o.createdAt < start);
        logActivity('danger', `حذف طلبات اليوم (${before - DB.orders.length})`);
        persist();
        return before - DB.orders.length;
    },
    resetCancelledOrders() {
        const before = DB.orders.length;
        DB.orders = DB.orders.filter(o => o.status !== 'cancelled');
        persist();
        return before - DB.orders.length;
    },
    resetProducts() { DB.products = []; logActivity('danger', 'تصفير جميع الوجبات'); persist(); },
    restoreDefaultMenu() {
        const fresh = seedData();
        DB.products = fresh.products.map(p => ({ ...p, stock: 50, cost: Math.round(p.price * 0.55), sku: '' }));
        DB.categories = fresh.categories;
        logActivity('danger', 'استعادة القائمة الافتراضية');
        persist();
    },
    resetCategories() { DB.categories = []; DB.products = []; logActivity('danger', 'تصفير الأقسام والوجبات'); persist(); },
    resetOffers() { DB.offers = []; logActivity('danger', 'تصفير العروض'); persist(); },
    resetCustomers() {
        DB.customers = DB.customers.filter(c => c.id === 'cu1');
        logActivity('danger', 'تصفير العملاء');
        persist();
    },
    resetPoints() { DB.customers.forEach(c => c.points = 0); logActivity('danger', 'تصفير نقاط الولاء'); persist(); },
    resetExpenses() { DB.expenses = []; logActivity('danger', 'تصفير المصروفات'); persist(); },
    resetShifts() { DB.shifts = []; logActivity('danger', 'تصفير الورديات'); persist(); },
    resetCounter(startAt = 1000) { DB.orderCounter = Number(startAt) || 1000; logActivity('danger', `ضبط عدّاد الطلبات على ${DB.orderCounter}`); persist(); },
    resetStock(qty = 0) { DB.products.forEach(p => p.stock = Number(qty) || 0); logActivity('danger', 'تصفير المخزون'); persist(); },
    resetActivity() { DB.activity = []; persist(); },
    resetDeliveries() { DB.deliveries = []; logActivity('danger', 'تصفير سجل التوصيل'); persist(); },
    resetReservations() {
        DB.reservations = [];
        DB.tables.forEach(t => { if (t.status === 'reserved') t.status = 'free'; });
        logActivity('danger', 'تصفير الحجوزات'); persist();
    },
    resetPurchases() { DB.purchases = []; DB.suppliers.forEach(s => s.balance = 0); logActivity('danger', 'تصفير المشتريات'); persist(); },
    resetPayroll() { DB.payroll = []; logActivity('danger', 'تصفير كشوف الرواتب'); persist(); },
    resetAttendance() { DB.attendance = []; logActivity('danger', 'تصفير سجل الحضور'); persist(); },
    resetWastes() { DB.wastes = []; logActivity('danger', 'تصفير سجل الهدر'); persist(); },
    resetFeedback() { DB.feedback = []; logActivity('danger', 'تصفير التقييمات'); persist(); },
    // الإعدادات
    saveSettings(data) {
        Object.assign(DB.settings, data); persist();
    },
    resetAll() {
        localStorage.removeItem(DB_KEY);
        localStorage.removeItem(SESSION_KEY);
        DB = loadDB();
    }
};

/* ----- خصم/إرجاع المخزون لطلب كامل ----- */
function applyStockForOrder(order, sign) {
    if (!getSettings().trackStock) return;
    (order.items || []).forEach(line => {
        if (line.isOffer) {
            const of = getOffer(line.offerId);
            (of?.items || []).forEach(it => {
                const p = getProduct(it.productId);
                if (p && p.stock !== undefined) p.stock = Math.max(0, (Number(p.stock) || 0) + sign * (it.qty || 1) * line.qty);
            });
        } else {
            const p = getProduct(line.productId);
            if (p && p.stock !== undefined) p.stock = Math.max(0, (Number(p.stock) || 0) + sign * line.qty);
        }
    });
}

/* ----- ملخّص وردية ----- */
function shiftSummary(shift) {
    const from = shift.openedAt;
    const to = shift.closedAt || Date.now();
    const orders = DB.orders.filter(o => o.createdAt >= from && o.createdAt <= to && o.status !== 'cancelled');
    const expenses = DB.expenses.filter(e => e.createdAt >= from && e.createdAt <= to);
    const by = (m) => orders.reduce((sum, o) => {
        if (Array.isArray(o.payments) && o.payments.length) return sum + o.payments.filter(p => p.method === m).reduce((x, p) => x + Number(p.amount || 0), 0);
        return sum + (o.paymentMethod === m ? Number(o.total || 0) : 0);
    }, 0);
    const cash = by('cash'), card = by('card'), online = by('online');
    const total = orders.reduce((s, o) => s + Number(o.total || 0), 0);
    const expTotal = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    return {
        orders: orders.length, items: orders.reduce((n, o) => n + o.items.reduce((x, i) => x + i.qty, 0), 0),
        cash, card, online, total, expenses: expTotal,
        expectedCash: (Number(shift.openingCash) || 0) + cash - expTotal,
        net: total - expTotal
    };
}

/* ----- سجل النشاط ----- */
function logActivity(type, text) {
    if (!Array.isArray(DB.activity)) DB.activity = [];
    DB.activity.unshift({
        id: uid('a'), type, text, at: Date.now(),
        user: (typeof currentUser === 'function' && currentUser()) ? currentUser().name : 'النظام'
    });
    if (DB.activity.length > 300) DB.activity.length = 300;
}

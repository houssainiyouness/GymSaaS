import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  fr: {
    translation: {
      navigation: {
        dashboard: "Dashboard",
        members: "Membres",
        plans: "Formules",
        subscriptions: "Abonnements",
        payments: "Paiements",
        attendances: "Présences",
        coaches: "Coachs",
        courses: "Cours",
        reports: "Rapports",
        audit: "Journal d’activité",
        logout: "Déconnexion",
        managementSpace: "Espace de gestion",
      },
      topbar: {
        managementSpace: "Espace de gestion",
        administration: "Administration GymSaaS",
      },
      roles: {
        SUPER_ADMIN: "Super-administrateur",
        COORDINATOR: "Coordinateur",
        MEMBER: "Adhérent",
      },
      dashboard: {
        title: "Dashboard",
        description: "Vue d’ensemble calculée directement par le backend GymSaaS.",
        addMember: "Ajouter un membre",
        activeMembers: "Adhérents actifs",
        membersTotal: "{{count}} adhérents au total",
        activeSubscriptions: "Abonnements actifs",
        suspended: "{{count}} suspendu(s)",
        monthlyRevenue: "Revenus du mois",
        totalRevenue: "Total enregistré : {{amount}} DH",
        expiringSoon: "Expirations bientôt",
        nextSevenDays: "Dans les 7 prochains jours",
        subscriptionSituation: "Situation des abonnements",
        djangoAggregated: "Données agrégées par Django",
        manage: "Gérer",
        active: "Actifs",
        renewalSoon: "À renouveler bientôt",
        expired: "Expirés",
        suspendedLabel: "Suspendus",
        recentPayments: "Paiements récents",
        lastPayments: "Les 5 derniers paiements",
        seeAll: "Voir tous",
        noPayment: "Aucun paiement enregistré.",
        attendanceToday: "Présences aujourd’hui",
        attendanceApi: "Résumé fourni par l’API de présence",
        seeAttendances: "Voir les présences",
        entries: "Entrées",
        currentlyPresent: "Présents maintenant",
        exits: "Sorties",
        uniqueMembers: "Membres uniques",
        pointsToWatch: "Points à surveiller",
        backendIndicators: "Indicateurs issus du résumé backend",
        inactiveMembers: "Adhérents inactifs",
        expiredSubscriptions: "Abonnements expirés",
        suspendedSubscriptions: "Abonnements suspendus",
        seeDetails: "Voir le détail",
        revenue12Months: "Revenus sur 12 mois",
        revenueEvolution: "Évolution mensuelle du CA",
        newMembers: "Nouveaux adhérents",
        registrations12Months: "Inscriptions sur 12 mois",
        attendance: "Fréquentation",
        lastSevenDays: "7 derniers jours",
        popularPlans: "Formules populaires",
        retry: "Réessayer",
        loading: "Chargement du dashboard…",
        member: "Membre",
        plan: "Formule",
      },
      clientNavigation: {
        memberSpace: "Espace adhérent",
        home: "Mon espace",
        subscription: "Mon abonnement",
        payments: "Mes paiements",
        attendances: "Mes présences",
        qr: "Mon QR",
        profile: "Mon profil",
      },
      client: {
        member: "Adhérent",
        hello: "Bonjour {{name}}",
      },
      common: {
        close: "Fermer",
        save: "Enregistrer",
        cancel: "Annuler",
        edit: "Modifier",
        active: "Actif",
        inactive: "Inactif",
        languageChoice: "Choix de la langue",
      },
    },
  },

  ar: {
    translation: {
      navigation: {
        dashboard: "لوحة التحكم",
        members: "الأعضاء",
        plans: "العروض",
        subscriptions: "الاشتراكات",
        payments: "المدفوعات",
        attendances: "الحضور",
        coaches: "المدربون",
        courses: "الحصص الرياضية",
        reports: "التقارير",
        audit: "سجل النشاط",
        logout: "تسجيل الخروج",
        managementSpace: "فضاء الإدارة",
      },
      topbar: {
        managementSpace: "فضاء الإدارة",
        administration: "إدارة GymSaaS",
      },
      roles: {
        SUPER_ADMIN: "المشرف العام",
        COORDINATOR: "المنسق",
        MEMBER: "العضو",
      },
      dashboard: {
        title: "لوحة التحكم",
        description: "نظرة عامة محسوبة مباشرة من نظام GymSaaS.",
        addMember: "إضافة عضو",
        activeMembers: "الأعضاء النشطون",
        membersTotal: "إجمالي الأعضاء: {{count}}",
        activeSubscriptions: "الاشتراكات النشطة",
        suspended: "{{count}} اشتراك موقوف",
        monthlyRevenue: "إيرادات الشهر",
        totalRevenue: "إجمالي الإيرادات: {{amount}} درهم",
        expiringSoon: "اشتراكات ستنتهي قريباً",
        nextSevenDays: "خلال الأيام السبعة القادمة",
        subscriptionSituation: "حالة الاشتراكات",
        djangoAggregated: "بيانات محسوبة من النظام",
        manage: "إدارة",
        active: "نشطة",
        renewalSoon: "تحتاج إلى التجديد قريباً",
        expired: "منتهية",
        suspendedLabel: "موقوفة",
        recentPayments: "آخر المدفوعات",
        lastPayments: "آخر 5 مدفوعات",
        seeAll: "عرض الكل",
        noPayment: "لا توجد مدفوعات مسجلة.",
        attendanceToday: "حضور اليوم",
        attendanceApi: "ملخص حضور اليوم",
        seeAttendances: "عرض الحضور",
        entries: "الدخول",
        currentlyPresent: "الموجودون حالياً",
        exits: "الخروج",
        uniqueMembers: "أعضاء مختلفون",
        pointsToWatch: "نقاط تحتاج إلى الانتباه",
        backendIndicators: "مؤشرات النظام",
        inactiveMembers: "الأعضاء غير النشطين",
        expiredSubscriptions: "الاشتراكات المنتهية",
        suspendedSubscriptions: "الاشتراكات الموقوفة",
        seeDetails: "عرض التفاصيل",
        revenue12Months: "الإيرادات خلال 12 شهراً",
        revenueEvolution: "تطور الإيرادات الشهرية",
        newMembers: "الأعضاء الجدد",
        registrations12Months: "التسجيلات خلال 12 شهراً",
        attendance: "معدل الحضور",
        lastSevenDays: "آخر 7 أيام",
        popularPlans: "العروض الأكثر استخداماً",
        retry: "إعادة المحاولة",
        loading: "جاري تحميل لوحة التحكم…",
        member: "عضو",
        plan: "العرض",
      },
      clientNavigation: {
        memberSpace: "فضاء العضو",
        home: "مساحتي",
        subscription: "اشتراكي",
        payments: "مدفوعاتي",
        attendances: "حضوري",
        qr: "رمز QR الخاص بي",
        profile: "ملفي الشخصي",
      },
      client: {
        member: "عضو",
        hello: "مرحباً {{name}}",
      },
      common: {
        close: "إغلاق",
        save: "حفظ",
        cancel: "إلغاء",
        edit: "تعديل",
        active: "نشط",
        inactive: "غير نشط",
        languageChoice: "اختيار اللغة",
      },
    },
  },
};

const savedLanguage = localStorage.getItem("gymsaas_language") || "fr";

function normalizeLanguage(language) {
  return String(language || "fr").toLowerCase().startsWith("ar") ? "ar" : "fr";
}

function applyLanguage(language) {
  const normalized = normalizeLanguage(language);

  document.documentElement.lang = normalized;
  document.documentElement.dir = normalized === "ar" ? "rtl" : "ltr";
  document.body?.setAttribute("data-language", normalized);

  localStorage.setItem("gymsaas_language", normalized);
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: normalizeLanguage(savedLanguage),
    fallbackLng: "fr",
    supportedLngs: ["fr", "ar"],
    load: "languageOnly",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

applyLanguage(savedLanguage);

i18n.on("languageChanged", applyLanguage);

export default i18n;

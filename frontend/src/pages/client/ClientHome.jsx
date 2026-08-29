import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router";

import {
  useTranslation,
} from "react-i18next";

import api from "../../services/api";
import {
  useAuth,
} from "../../context/AuthContext";

import "../../styles/client-portal.css";


function ClientHome() {
  const {
    user,
  } = useAuth();

  const {
    i18n,
  } = useTranslation();

  const isArabic =
    String(
      i18n.resolvedLanguage ||
      i18n.language ||
      "fr",
    )
      .toLowerCase()
      .startsWith("ar");

  const copy =
    isArabic
      ? {
          mySpace: "مساحتي",
          welcome: "مرحباً، {{name}}.",
          overview:
            "اطلع على أهم معلومات تجربتك في GymSaaS في مكان واحد.",
          showQr:
            "عرض رمز QR الخاص بي",
          loading:
            "جاري تحميل مساحتك…",
          loadError:
            "تعذر تحميل فضاء العضو.",
          mySubscription:
            "اشتراكي",
          noPlan:
            "لا يوجد",
          noActiveSubscription:
            "لا يوجد اشتراك نشط",
          daysRemaining:
            "الأيام المتبقية",
          until:
            "حتى {{date}}",
          totalPaid:
            "إجمالي المدفوع",
          payment:
            "دفعة",
          payments:
            "دفعات",
          attendances:
            "الحضور",
          recordedVisits:
            "زيارات مسجلة",
          subscription:
            "الاشتراك",
          start:
            "البداية",
          end:
            "النهاية",
          choosePlan:
            "تواصل مع الاستقبال لاختيار الاشتراك المناسب.",
          seeSubscription:
            "عرض اشتراكي",
          lastVisits:
            "آخر الزيارات",
          myAttendances:
            "حضوري",
          seeAll:
            "عرض الكل",
          noAttendance:
            "لا توجد أي زيارات مسجلة.",
          present:
            "حاضر",
          minute:
            "دقيقة",
          minutes:
            "دقائق",
          quickPayments:
            "مدفوعاتي",
          quickPaymentsText:
            "عرض سجل المدفوعات",
          quickAttendances:
            "حضوري",
          quickAttendancesText:
            "عرض سجل الحضور",
          quickQr:
            "رمز QR الخاص بي",
          quickQrText:
            "عرض رمز التعريف الخاص بي",
          quickProfile:
            "ملفي الشخصي",
          quickProfileText:
            "عرض معلوماتي الشخصية",
          active:
            "نشط",
          suspended:
            "موقوف",
          expired:
            "منتهي",
          cancelled:
            "ملغى",
          pending:
            "قيد الانتظار",
          unknownStatus:
            "غير محدد",
          member:
            "العضو",
        }
      : {
          mySpace:
            "MON ESPACE",
          welcome:
            "Bienvenue, {{name}}.",
          overview:
            "Retrouvez l’essentiel de votre expérience GymSaaS en un coup d’œil.",
          showQr:
            "Afficher mon QR",
          loading:
            "Chargement de votre espace…",
          loadError:
            "Impossible de charger votre espace adhérent.",
          mySubscription:
            "Mon abonnement",
          noPlan:
            "Aucun",
          noActiveSubscription:
            "Pas d’abonnement actif",
          daysRemaining:
            "Jours restants",
          until:
            "Jusqu’au {{date}}",
          totalPaid:
            "Total payé",
          payment:
            "paiement",
          payments:
            "paiements",
          attendances:
            "Présences",
          recordedVisits:
            "Passages enregistrés",
          subscription:
            "ABONNEMENT",
          start:
            "Début",
          end:
            "Fin",
          choosePlan:
            "Contactez l’accueil pour choisir une formule.",
          seeSubscription:
            "Voir mon abonnement",
          lastVisits:
            "DERNIÈRES VISITES",
          myAttendances:
            "Mes présences",
          seeAll:
            "Voir tout",
          noAttendance:
            "Aucune présence enregistrée.",
          present:
            "Présent",
          minute:
            "min",
          minutes:
            "min",
          quickPayments:
            "Mes paiements",
          quickPaymentsText:
            "Consulter mon historique",
          quickAttendances:
            "Mes présences",
          quickAttendancesText:
            "Voir mes passages",
          quickQr:
            "Mon QR",
          quickQrText:
            "Afficher mon identifiant",
          quickProfile:
            "Mon profil",
          quickProfileText:
            "Voir mes informations",
          active:
            "Actif",
          suspended:
            "Suspendu",
          expired:
            "Expiré",
          cancelled:
            "Annulé",
          pending:
            "En attente",
          unknownStatus:
            "Non défini",
          member:
            "adhérent",
        };


  const [
    member,
    setMember,
  ] = useState(null);

  const [
    subscription,
    setSubscription,
  ] = useState(null);

  const [
    payments,
    setPayments,
  ] = useState([]);

  const [
    attendances,
    setAttendances,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    hasError,
    setHasError,
  ] = useState(false);


  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setHasError(false);

    Promise.all([
      api.get("/me/"),
      api.get("/me/subscription/"),
      api.get("/me/payments/"),
      api.get("/me/attendances/"),
    ])
      .then(
        ([
          memberResponse,
          subscriptionResponse,
          paymentsResponse,
          attendancesResponse,
        ]) => {
          if (cancelled) {
            return;
          }

          setMember(
            memberResponse.data,
          );

          setSubscription(
            subscriptionResponse.data
              ?.subscription ||
              null,
          );

          setPayments(
            paymentsResponse.data
              ?.payments ||
              [],
          );

          setAttendances(
            attendancesResponse.data
              ?.attendances ||
              [],
          );
        },
      )
      .catch(() => {
        if (!cancelled) {
          setHasError(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);


  const totalPaid =
    useMemo(
      () =>
        payments.reduce(
          (
            sum,
            payment,
          ) =>
            sum +
            Number(
              payment.amount ||
                0,
            ),
          0,
        ),
      [payments],
    );


  const firstName =
    user?.first_name ||
    member?.first_name ||
    user?.username ||
    member?.full_name ||
    copy.member;


  if (loading) {
    return (
      <div className="client-page">
        <div className="client-empty">
          {copy.loading}
        </div>
      </div>
    );
  }


  return (
    <div className="client-page">

      {/* ===============================================
          BIENVENUE
      =============================================== */}

      <section className="client-welcome">

        <div>

          <span className="eyebrow">
            {copy.mySpace}
          </span>


          <h1>
            {copy.welcome.replace(
              "{{name}}",
              firstName,
            )}
          </h1>


          <p>
            {copy.overview}
          </p>

        </div>


        <Link
          className="btn btn-primary"
          to="/client/qr-code"
        >
          {copy.showQr}
        </Link>

      </section>


      {hasError && (
        <div className="client-error">
          {copy.loadError}
        </div>
      )}


      {/* ===============================================
          STATISTIQUES
      =============================================== */}

      <section className="client-stat-grid">

        <ClientStat
          label={
            copy.mySubscription
          }
          value={
            subscription?.plan_name ||
            copy.noPlan
          }
          detail={
            subscription
              ? getStatusLabel(
                  subscription,
                  copy,
                )
              : copy.noActiveSubscription
          }
        />


        <ClientStat
          label={
            copy.daysRemaining
          }
          value={
            subscription
              ? subscription.days_remaining
              : 0
          }
          detail={
            subscription?.end_date
              ? copy.until.replace(
                  "{{date}}",
                  formatDate(
                    subscription.end_date,
                    isArabic,
                  ),
                )
              : "—"
          }
        />


        <ClientStat
          label={
            copy.totalPaid
          }
          value={`${formatMoney(
            totalPaid,
            isArabic,
          )} DH`}
          detail={`${formatNumber(
            payments.length,
            isArabic,
          )} ${
            payments.length > 1
              ? copy.payments
              : copy.payment
          }`}
        />


        <ClientStat
          label={
            copy.attendances
          }
          value={
            formatNumber(
              attendances.length,
              isArabic,
            )
          }
          detail={
            copy.recordedVisits
          }
        />

      </section>


      {/* ===============================================
          PANNEAUX
      =============================================== */}

      <section className="client-home-grid">

        <article className="client-panel client-subscription-highlight">

          <div className="client-panel-heading">

            <div>

              <span className="eyebrow">
                {copy.subscription}
              </span>


              <h2>
                {subscription?.plan_name ||
                  copy.noActiveSubscription}
              </h2>

            </div>


            {subscription && (
              <span
                className={`client-status status-${
                  subscription.status
                    ?.toLowerCase() ||
                  ""
                }`}
              >
                {getStatusLabel(
                  subscription,
                  copy,
                )}
              </span>
            )}

          </div>


          {subscription ? (
            <>

              <div className="subscription-progress">
                <div
                  style={{
                    width: `${progressFor(
                      subscription,
                    )}%`,
                  }}
                />
              </div>


              <div className="subscription-dates">

                <span>
                  {copy.start}

                  <strong>
                    {formatDate(
                      subscription.start_date,
                      isArabic,
                    )}
                  </strong>
                </span>


                <span>
                  {copy.end}

                  <strong>
                    {formatDate(
                      subscription.end_date,
                      isArabic,
                    )}
                  </strong>
                </span>

              </div>

            </>
          ) : (
            <p className="muted">
              {copy.choosePlan}
            </p>
          )}


          <Link
            className="client-inline-link"
            to="/client/subscription"
          >
            {copy.seeSubscription}
            {" "}
            {isArabic ? "←" : "→"}
          </Link>

        </article>


        <article className="client-panel">

          <div className="client-panel-heading">

            <div>

              <span className="eyebrow">
                {copy.lastVisits}
              </span>


              <h2>
                {copy.myAttendances}
              </h2>

            </div>


            <Link
              className="client-inline-link"
              to="/client/attendances"
            >
              {copy.seeAll}
            </Link>

          </div>


          <div className="client-compact-list">

            {attendances
              .slice(0, 4)
              .map(
                (attendance) => (
                  <div
                    key={attendance.id}
                  >

                    <span>
                      {formatDateTime(
                        attendance.check_in,
                        isArabic,
                      )}
                    </span>


                    <strong>
                      {attendance.attendance_status ===
                      "present"
                        ? copy.present
                        : `${formatNumber(
                            attendance.duration_minutes ||
                              0,
                            isArabic,
                          )} ${
                            Number(
                              attendance.duration_minutes ||
                                0,
                            ) > 1
                              ? copy.minutes
                              : copy.minute
                          }`}
                    </strong>

                  </div>
                ),
              )}


            {!attendances.length && (
              <div className="client-empty small">
                {copy.noAttendance}
              </div>
            )}

          </div>

        </article>

      </section>


      {/* ===============================================
          ACCÈS RAPIDES
      =============================================== */}

      <section className="client-quick-actions">

        <QuickLink
          to="/client/payments"
          title={copy.quickPayments}
          text={copy.quickPaymentsText}
          isArabic={isArabic}
        />


        <QuickLink
          to="/client/attendances"
          title={copy.quickAttendances}
          text={copy.quickAttendancesText}
          isArabic={isArabic}
        />


        <QuickLink
          to="/client/qr-code"
          title={copy.quickQr}
          text={copy.quickQrText}
          isArabic={isArabic}
        />


        <QuickLink
          to="/client/profile"
          title={copy.quickProfile}
          text={copy.quickProfileText}
          isArabic={isArabic}
        />

      </section>

    </div>
  );
}


function ClientStat({
  label,
  value,
  detail,
}) {
  return (
    <article className="client-stat">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {detail}
      </small>

    </article>
  );
}


function QuickLink({
  to,
  title,
  text,
  isArabic,
}) {
  return (
    <Link
      className="client-quick-card"
      to={to}
    >

      <strong>
        {title}
      </strong>

      <span>
        {text}
      </span>

      <b aria-hidden="true">
        {isArabic ? "←" : "→"}
      </b>

    </Link>
  );
}


function getStatusLabel(
  subscription,
  copy,
) {
  const status =
    String(
      subscription?.status ||
        "",
    ).toLowerCase();

  if (status === "active") {
    return copy.active;
  }

  if (status === "suspended") {
    return copy.suspended;
  }

  if (status === "expired") {
    return copy.expired;
  }

  if (status === "cancelled") {
    return copy.cancelled;
  }

  if (status === "pending") {
    return copy.pending;
  }

  return (
    subscription?.status_display ||
    copy.unknownStatus
  );
}


function progressFor(
  subscription,
) {
  if (
    !subscription?.start_date ||
    !subscription?.end_date
  ) {
    return 0;
  }

  const start =
    new Date(
      subscription.start_date,
    ).getTime();

  const end =
    new Date(
      subscription.end_date,
    ).getTime();

  const now = Date.now();

  if (end <= start) {
    return 100;
  }

  return Math.max(
    0,
    Math.min(
      100,
      ((now - start) /
        (end - start)) *
        100,
    ),
  );
}


function formatMoney(
  value,
  isArabic,
) {
  return new Intl.NumberFormat(
    isArabic
      ? "ar-MA"
      : "fr-FR",
    {
      maximumFractionDigits: 2,
    },
  ).format(
    Number(value || 0),
  );
}


function formatNumber(
  value,
  isArabic,
) {
  return new Intl.NumberFormat(
    isArabic
      ? "ar-MA"
      : "fr-FR",
    {
      maximumFractionDigits: 0,
    },
  ).format(
    Number(value || 0),
  );
}


function formatDate(
  value,
  isArabic,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    isArabic
      ? "ar-MA"
      : "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(value),
  );
}


function formatDateTime(
  value,
  isArabic,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    isArabic
      ? "ar-MA"
      : "fr-FR",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(
    new Date(value),
  );
}


export default ClientHome;

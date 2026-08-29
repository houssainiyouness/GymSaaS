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

import AnalyticsCharts from "../components/AnalyticsCharts";

import api, {
  getApiError,
} from "../services/api";

import "../styles/dashboard.css";
import "../styles/admin-tools.css";


function Dashboard() {
  const {
    t,
    i18n,
  } = useTranslation();

  const [summary, setSummary] =
    useState(null);

  const [
    attendanceSummary,
    setAttendanceSummary,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const locale =
    String(
      i18n.resolvedLanguage ||
        i18n.language,
    )
      .toLowerCase()
      .startsWith("ar")
      ? "ar-MA"
      : "fr-MA";


  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [
        dashboardResponse,
        attendanceResponse,
      ] = await Promise.all([
        api.get("/dashboard/"),
        api.get(
          "/attendances/summary/",
        ),
      ]);

      setSummary(
        dashboardResponse.data,
      );

      setAttendanceSummary(
        attendanceResponse.data,
      );
    } catch (requestError) {
      setError(
        getApiError(
          requestError,
          t(
            "dashboard.loadingError",
            {
              defaultValue:
                "Impossible de charger le dashboard.",
            },
          ),
        ),
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadDashboard();
  }, []);


  const subscriptionDistribution =
    useMemo(() => {
      const subscriptions =
        summary?.subscriptions;

      if (!subscriptions) {
        return [];
      }

      return [
        {
          label: t(
            "dashboard.active",
          ),
          value:
            subscriptions.active ||
            0,
        },

        {
          label: t(
            "dashboard.renewalSoon",
          ),
          value:
            subscriptions.expiring_soon ||
            0,
        },

        {
          label: t(
            "dashboard.expired",
          ),
          value:
            subscriptions.expired ||
            0,
        },

        {
          label: t(
            "dashboard.suspendedLabel",
          ),
          value:
            subscriptions.suspended ||
            0,
        },
      ];
    }, [
      summary,
      t,
      i18n.language,
    ]);


  if (loading) {
    return (
      <div className="dashboard-page">
        <div
          className="dashboard-loading"
          role="status"
        >
          {t(
            "dashboard.loading",
          )}
        </div>
      </div>
    );
  }


  return (
    <div className="dashboard-page">
      {/* =========================
          En-tête
      ========================== */}

      <div className="dashboard-heading">
        <div>
          <h1>
            {t(
              "dashboard.title",
            )}
          </h1>

          <p>
            {t(
              "dashboard.description",
            )}
          </p>
        </div>

        <Link
          className="dashboard-primary-button"
          to="/members/new"
        >
          <PlusIcon />

          {t(
            "dashboard.addMember",
          )}
        </Link>
      </div>


      {/* =========================
          Erreur
      ========================== */}

      {error && (
        <div className="dashboard-error">
          <span>
            {error}
          </span>

          <button
            type="button"
            className="action-button"
            onClick={
              loadDashboard
            }
          >
            {t(
              "dashboard.retry",
            )}
          </button>
        </div>
      )}


      {summary && (
        <>
          {/* =========================
              Cartes principales
          ========================== */}

          <section className="dashboard-stats">
            <MetricCard
              icon={<UsersIcon />}
              label={t(
                "dashboard.activeMembers",
              )}
              value={
                summary.members
                  ?.active ?? 0
              }
              helper={t(
                "dashboard.membersTotal",
                {
                  count:
                    summary.members
                      ?.total ?? 0,
                },
              )}
            />


            <MetricCard
              icon={
                <CalendarIcon />
              }
              label={t(
                "dashboard.activeSubscriptions",
              )}
              value={
                summary
                  .subscriptions
                  ?.active ?? 0
              }
              helper={t(
                "dashboard.suspended",
                {
                  count:
                    summary
                      .subscriptions
                      ?.suspended ??
                    0,
                },
              )}
            />


            <MetricCard
              icon={
                <WalletIcon />
              }
              label={t(
                "dashboard.monthlyRevenue",
              )}
              value={`${formatMoney(
                summary.revenue
                  ?.current_month,
                locale,
              )} DH`}
              helper={t(
                "dashboard.totalRevenue",
                {
                  amount:
                    formatMoney(
                      summary
                        .revenue
                        ?.total,
                      locale,
                    ),
                },
              )}
            />


            <MetricCard
              icon={
                <ClockIcon />
              }
              label={t(
                "dashboard.expiringSoon",
              )}
              value={
                summary
                  .subscriptions
                  ?.expiring_soon ??
                0
              }
              helper={t(
                "dashboard.nextSevenDays",
              )}
              warning
            />
          </section>


          {/* =========================
              Graphiques analytiques
          ========================== */}

          <AnalyticsCharts
            analytics={
              summary.analytics
            }
          />


          {/* =========================
              Abonnements + paiements
          ========================== */}

          <section className="dashboard-main-grid">
            <div className="dashboard-panel chart-panel">
              <div className="panel-header">
                <div>
                  <h2>
                    {t(
                      "dashboard.subscriptionSituation",
                    )}
                  </h2>

                  <p>
                    {t(
                      "dashboard.djangoAggregated",
                    )}
                  </p>
                </div>

                <Link to="/subscriptions">
                  {t(
                    "dashboard.manage",
                  )}
                </Link>
              </div>

              <SubscriptionBars
                data={
                  subscriptionDistribution
                }
              />
            </div>


            <div className="dashboard-panel recent-panel">
              <div className="panel-header">
                <div>
                  <h2>
                    {t(
                      "dashboard.recentPayments",
                    )}
                  </h2>

                  <p>
                    {t(
                      "dashboard.lastPayments",
                    )}
                  </p>
                </div>

                <Link to="/payments">
                  {t(
                    "dashboard.seeAll",
                  )}
                </Link>
              </div>


              <div className="recent-list">
                {(
                  summary
                    .recent_payments ||
                  []
                ).map(
                  (payment) => (
                    <div
                      className="recent-member"
                      key={
                        payment.id
                      }
                    >
                      <Avatar
                        name={
                          payment.member_name
                        }
                      />

                      <div className="recent-member-info">
                        <strong>
                          {payment.member_name ||
                            t(
                              "dashboard.member",
                            )}
                        </strong>

                        <span>
                          {payment.plan_name ||
                            t(
                              "dashboard.plan",
                            )}
                        </span>
                      </div>

                      <div className="recent-member-plan">
                        <strong>
                          {formatMoney(
                            payment.amount,
                            locale,
                          )}{" "}
                          DH
                        </strong>

                        <span>
                          {formatDateTime(
                            payment.paid_at,
                            locale,
                          )}
                        </span>
                      </div>
                    </div>
                  ),
                )}


                {!summary
                  .recent_payments
                  ?.length && (
                  <EmptyState
                    text={t(
                      "dashboard.noPayment",
                    )}
                  />
                )}
              </div>
            </div>
          </section>


          {/* =========================
              Présences + alertes
          ========================== */}

          <section className="dashboard-bottom-grid">
            <div className="dashboard-panel compact-panel">
              <div className="panel-header">
                <div>
                  <h2>
                    {t(
                      "dashboard.attendanceToday",
                    )}
                  </h2>

                  <p>
                    {t(
                      "dashboard.attendanceApi",
                    )}
                  </p>
                </div>

                <Link to="/attendances">
                  {t(
                    "dashboard.seeAttendances",
                  )}
                </Link>
              </div>


              <div className="dashboard-summary-cards">
                <SummaryItem
                  label={t(
                    "dashboard.entries",
                  )}
                  value={
                    attendanceSummary
                      ?.today
                      ?.total_check_ins ??
                    0
                  }
                />

                <SummaryItem
                  label={t(
                    "dashboard.currentlyPresent",
                  )}
                  value={
                    attendanceSummary
                      ?.today
                      ?.currently_present ??
                    0
                  }
                />

                <SummaryItem
                  label={t(
                    "dashboard.exits",
                  )}
                  value={
                    attendanceSummary
                      ?.today
                      ?.checked_out ??
                    0
                  }
                />

                <SummaryItem
                  label={t(
                    "dashboard.uniqueMembers",
                  )}
                  value={
                    attendanceSummary
                      ?.today
                      ?.unique_members ??
                    0
                  }
                />
              </div>
            </div>


            <div className="dashboard-panel compact-panel">
              <div className="panel-header">
                <div>
                  <h2>
                    {t(
                      "dashboard.pointsToWatch",
                    )}
                  </h2>

                  <p>
                    {t(
                      "dashboard.backendIndicators",
                    )}
                  </p>
                </div>
              </div>


              <div className="expiration-list">
                <SummaryLine
                  label={t(
                    "dashboard.inactiveMembers",
                  )}
                  value={
                    summary.members
                      ?.inactive ?? 0
                  }
                  to="/members"
                  detailsText={t(
                    "dashboard.seeDetails",
                  )}
                />

                <SummaryLine
                  label={t(
                    "dashboard.expiredSubscriptions",
                  )}
                  value={
                    summary
                      .subscriptions
                      ?.expired ?? 0
                  }
                  to="/subscriptions"
                  detailsText={t(
                    "dashboard.seeDetails",
                  )}
                />

                <SummaryLine
                  label={t(
                    "dashboard.suspendedSubscriptions",
                  )}
                  value={
                    summary
                      .subscriptions
                      ?.suspended ??
                    0
                  }
                  to="/subscriptions"
                  detailsText={t(
                    "dashboard.seeDetails",
                  )}
                />
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}


/* =====================================================
   Composants
===================================================== */

function MetricCard({
  icon,
  label,
  value,
  helper,
  warning = false,
}) {
  return (
    <article
      className={`metric-card ${
        warning
          ? "metric-warning"
          : ""
      }`}
    >
      <div className="metric-icon">
        {icon}
      </div>

      <div className="metric-content">
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {helper}
        </small>
      </div>
    </article>
  );
}


function SubscriptionBars({
  data,
}) {
  const max = Math.max(
    ...data.map(
      (item) =>
        Number(
          item.value || 0,
        ),
    ),
    1,
  );

  return (
    <div className="dashboard-subscription-bars">
      {data.map((item) => (
        <div
          className="dashboard-subscription-row"
          key={item.label}
        >
          <div>
            <span>
              {item.label}
            </span>

            <strong>
              {item.value}
            </strong>
          </div>

          <div className="dashboard-subscription-track">
            <i
              style={{
                width: `${
                  (
                    Number(
                      item.value ||
                        0,
                    ) /
                    max
                  ) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}


function SummaryItem({
  label,
  value,
}) {
  return (
    <div className="dashboard-summary-item">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}


function SummaryLine({
  label,
  value,
  to,
  detailsText,
}) {
  return (
    <Link
      className="expiration-row dashboard-summary-line"
      to={to}
    >
      <div>
        <strong>
          {label}
        </strong>

        <span>
          {detailsText}
        </span>
      </div>

      <b>
        {value}
      </b>
    </Link>
  );
}


function Avatar({
  name,
}) {
  const initials =
    String(name || "?")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0],
      )
      .join("")
      .toUpperCase();

  return (
    <div className="member-avatar">
      {initials || "?"}
    </div>
  );
}


function EmptyState({
  text,
}) {
  return (
    <div className="dashboard-empty">
      {text}
    </div>
  );
}


/* =====================================================
   Formatage
===================================================== */

function formatMoney(
  value,
  locale,
) {
  return new Intl.NumberFormat(
    locale,
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    Number(value || 0),
  );
}


function formatDateTime(
  value,
  locale,
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    locale,
    {
      dateStyle: "short",
      timeStyle: "short",
    },
  ).format(
    new Date(value),
  );
}


/* =====================================================
   Icônes
===================================================== */

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}


function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}


function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 5h18v16H3zM16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}


function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M3 7h18v13H3zM16 11h5v5h-5a2.5 2.5 0 0 1 0-5zM5 7V4h13v3" />
    </svg>
  );
}


function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 7v5l3 2" />
    </svg>
  );
}


export default Dashboard;
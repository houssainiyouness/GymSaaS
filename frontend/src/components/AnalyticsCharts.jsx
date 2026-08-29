import {
  useTranslation,
} from "react-i18next";


function AnalyticsCharts({
  analytics,
}) {
  const {
    t,
    i18n,
  } = useTranslation();


  const locale =
    String(
      i18n.resolvedLanguage ||
        i18n.language,
    )
      .toLowerCase()
      .startsWith("ar")
      ? "ar-MA"
      : "fr-MA";


  const monthly =
    analytics?.monthly || [];

  const attendance =
    analytics?.attendance || [];

  const plans =
    analytics
      ?.plan_distribution ||
    [];


  return (
    <>
      {/* =========================
          Revenus + membres
      ========================== */}

      <section className="analytics-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>
                {t(
                  "dashboard.revenue12Months",
                )}
              </h2>

              <p>
                {t(
                  "dashboard.revenueEvolution",
                )}
              </p>
            </div>
          </div>

          <LineChart
            data={monthly}
            valueKey="revenue"
            locale={locale}
            money
          />
        </div>


        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>
                {t(
                  "dashboard.newMembers",
                )}
              </h2>

              <p>
                {t(
                  "dashboard.registrations12Months",
                )}
              </p>
            </div>
          </div>

          <LineChart
            data={monthly}
            valueKey="new_members"
            locale={locale}
          />
        </div>
      </section>


      {/* =========================
          Présences + formules
      ========================== */}

      <section className="analytics-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>
                {t(
                  "dashboard.attendance",
                )}
              </h2>

              <p>
                {t(
                  "dashboard.lastSevenDays",
                )}
              </p>
            </div>
          </div>

          <BarChart
            data={attendance}
            locale={locale}
          />
        </div>


        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>
                {t(
                  "dashboard.popularPlans",
                )}
              </h2>
            </div>
          </div>


          <div className="analytics-plan-list">
            {plans.map(
              (plan) => (
                <div
                  key={
                    plan.plan__name
                  }
                  className="analytics-plan-row"
                >
                  <span>
                    {plan.plan__name}
                  </span>

                  <strong>
                    {plan.count}
                  </strong>
                </div>
              ),
            )}


            {plans.length === 0 && (
              <div className="dashboard-empty">
                —
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}


/* =====================================================
   Graphique ligne
===================================================== */

function LineChart({
  data,
  valueKey,
  locale,
  money = false,
}) {
  const values =
    data.map(
      (item) =>
        Number(
          item[valueKey] || 0,
        ),
    );


  const max =
    Math.max(
      ...values,
      1,
    );


  const width = 600;
  const height = 220;
  const padding = 25;

  const usableWidth =
    width - padding * 2;

  const usableHeight =
    height - padding * 2;


  const points =
    data
      .map(
        (
          item,
          index,
        ) => {
          const x =
            padding +
            (
              index /
              Math.max(
                data.length - 1,
                1,
              )
            ) *
              usableWidth;

          const y =
            height -
            padding -
            (
              Number(
                item[valueKey] ||
                  0,
              ) /
              max
            ) *
              usableHeight;

          return `${x},${y}`;
        },
      )
      .join(" ");


  return (
    <div className="analytics-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Lignes horizontales */}
        {[0.25, 0.5, 0.75].map(
          (position) => (
            <line
              key={position}
              x1={padding}
              x2={
                width -
                padding
              }
              y1={
                padding +
                usableHeight *
                  position
              }
              y2={
                padding +
                usableHeight *
                  position
              }
              stroke="#252c34"
              strokeWidth="1"
              strokeDasharray="4 5"
            />
          ),
        )}


        {/* Courbe */}
        <polyline
          points={points}
          fill="none"
          stroke="#ff5a1f"
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />


        {/* Points */}
        {data.map(
          (
            item,
            index,
          ) => {
            const x =
              padding +
              (
                index /
                Math.max(
                  data.length -
                    1,
                  1,
                )
              ) *
                usableWidth;

            const y =
              height -
              padding -
              (
                Number(
                  item[
                    valueKey
                  ] || 0,
                ) /
                max
              ) *
                usableHeight;


            return (
              <circle
                key={`${item.month}-${valueKey}`}
                cx={x}
                cy={y}
                r="5"
                fill="#ff5a1f"
              >
                <title>
                  {formatMonth(
                    item.month,
                    locale,
                  )}
                  {" : "}
                  {formatValue(
                    item[
                      valueKey
                    ],
                    locale,
                    money,
                  )}
                </title>
              </circle>
            );
          },
        )}
      </svg>


      <div className="analytics-labels">
        {data.map(
          (item) => (
            <span
              key={
                item.month
              }
            >
              {formatMonth(
                item.month,
                locale,
              )}
            </span>
          ),
        )}
      </div>
    </div>
  );
}


/* =====================================================
   Graphique barres
===================================================== */

function BarChart({
  data,
  locale,
}) {
  const max =
    Math.max(
      ...data.map(
        (item) =>
          Number(
            item.count || 0,
          ),
      ),
      1,
    );


  return (
    <div className="analytics-bars">
      {data.map(
        (item) => {
          const value =
            Number(
              item.count ||
                0,
            );

          const height =
            Math.max(
              (
                value /
                max
              ) *
                150,
              5,
            );


          return (
            <div
              className="analytics-bar-item"
              key={
                item.date
              }
            >
              <strong>
                {value}
              </strong>

              <div
                className="analytics-bar"
                style={{
                  height: `${height}px`,
                }}
                title={`${formatFullDate(
                  item.date,
                  locale,
                )}: ${value}`}
              />

              <span>
                {formatWeekDay(
                  item.date,
                  locale,
                )}
              </span>
            </div>
          );
        },
      )}
    </div>
  );
}


/* =====================================================
   Fonctions de formatage
===================================================== */

function formatMonth(
  value,
  locale,
) {
  if (!value) {
    return "—";
  }


  const [
    year,
    month,
  ] = value
    .split("-")
    .map(Number);


  if (
    !year ||
    !month
  ) {
    return value;
  }


  const date =
    new Date(
      year,
      month - 1,
      1,
    );


  return new Intl.DateTimeFormat(
    locale,
    {
      month: "short",
    },
  ).format(date);
}


function formatWeekDay(
  value,
  locale,
) {
  if (!value) {
    return "—";
  }


  return new Intl.DateTimeFormat(
    locale,
    {
      weekday: "short",
    },
  ).format(
    new Date(
      `${value}T12:00:00`,
    ),
  );
}


function formatFullDate(
  value,
  locale,
) {
  if (!value) {
    return "—";
  }


  return new Intl.DateTimeFormat(
    locale,
    {
      dateStyle: "medium",
    },
  ).format(
    new Date(
      `${value}T12:00:00`,
    ),
  );
}


function formatValue(
  value,
  locale,
  money,
) {
  if (money) {
    return `${new Intl.NumberFormat(
      locale,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(
      Number(value || 0),
    )} DH`;
  }


  return new Intl.NumberFormat(
    locale,
  ).format(
    Number(value || 0),
  );
}


export default AnalyticsCharts;
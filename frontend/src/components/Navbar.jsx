import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router";

import {
  useTranslation,
} from "react-i18next";

import LanguageSwitcher from "./LanguageSwitcher";


function Navbar() {
  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    compact,
    setCompact,
  ] = useState(false);

  const location =
    useLocation();

  const {
    t,
  } = useTranslation();


  /* =====================================================
     NAVBAR COMPACTE AU SCROLL
  ===================================================== */

  useEffect(() => {
    const onScroll =
      () => {
        setCompact(
          window.scrollY > 24,
        );
      };


    onScroll();


    window.addEventListener(
      "scroll",
      onScroll,
      {
        passive: true,
      },
    );


    return () => {
      window.removeEventListener(
        "scroll",
        onScroll,
      );
    };
  }, []);


  /* =====================================================
     FERMER LE MENU APRÈS CHANGEMENT DE PAGE
  ===================================================== */

  useEffect(() => {
    setOpen(false);
  }, [
    location.pathname,
  ]);


  /* =====================================================
     FERMETURE AVEC ESCAPE
  ===================================================== */

  useEffect(() => {
    if (!open) {
      return undefined;
    }


    const onKeyDown =
      (event) => {
        if (
          event.key === "Escape"
        ) {
          setOpen(false);
        }
      };


    window.addEventListener(
      "keydown",
      onKeyDown,
    );


    return () => {
      window.removeEventListener(
        "keydown",
        onKeyDown,
      );
    };
  }, [
    open,
  ]);


  /* =====================================================
     HELPERS
  ===================================================== */

  const close =
    () => {
      setOpen(false);
    };


  const homeSectionHref =
    (section) =>
      location.pathname === "/"
        ? `#${section}`
        : `/#${section}`;


  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <header
      className={
        `public-navbar ${
          compact
            ? "compact"
            : ""
        }`
      }
    >

      <div className="public-nav-inner">

        {/* =================================================
            LOGO
        ================================================= */}

        <Link
          className="brand public-brand"
          to="/"
          onClick={close}
        >
          GYM
          <span>
            SAAS
          </span>
        </Link>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav
          className={
            `public-nav-links ${
              open
                ? "is-open"
                : ""
            }`
          }
          aria-label={
            t(
              "publicNavigation.mainNavigation",
            )
          }
        >

          <a
            href={
              homeSectionHref(
                "activities",
              )
            }
            onClick={close}
          >
            {t(
              "publicNavigation.activities",
            )}
          </a>


          <a
            href={
              homeSectionHref(
                "coaching",
              )
            }
            onClick={close}
          >
            {t(
              "publicNavigation.coaching",
            )}
          </a>


          {/*
            IMPORTANT :
            "Coachs" a volontairement été supprimé
            de la navbar.

            La page /nos-coachs reste accessible
            depuis la section Coaching de Home.jsx.
          */}


          <a
            href={
              homeSectionHref(
                "plans",
              )
            }
            onClick={close}
          >
            {t(
              "publicNavigation.plans",
            )}
          </a>


          <a
            href={
              homeSectionHref(
                "gym",
              )
            }
            onClick={close}
          >
            {t(
              "publicNavigation.gym",
            )}
          </a>


          <a
            href={
              homeSectionHref(
                "contact",
              )
            }
            onClick={close}
          >
            {t(
              "publicNavigation.contact",
            )}
          </a>


          {/* =================================================
              ACTIONS MOBILE
          ================================================= */}

          <Link
            className="mobile-login-link"
            to="/login"
            onClick={close}
          >
            {t(
              "publicNavigation.memberLogin",
            )}
          </Link>


          <Link
            className="btn btn-primary mobile-join-link"
            to="/register"
            onClick={close}
          >
            {t(
              "publicNavigation.register",
            )}
          </Link>

        </nav>


        {/* =================================================
            ACTIONS DESKTOP
        ================================================= */}

        <div className="public-nav-actions">

          <LanguageSwitcher />


          <Link
            className="nav-login"
            to="/login"
          >
            {t(
              "publicNavigation.login",
            )}
          </Link>


          <Link
            className="btn btn-primary"
            to="/register"
          >
            {t(
              "publicNavigation.register",
            )}
          </Link>


          {/* =================================================
              MENU MOBILE
          ================================================= */}

          <button
            className="mobile-menu-button"
            type="button"
            aria-label={
              open
                ? t(
                    "publicNavigation.closeMenu",
                  )
                : t(
                    "publicNavigation.openMenu",
                  )
            }
            aria-expanded={
              open
            }
            onClick={
              () => {
                setOpen(
                  (value) =>
                    !value,
                );
              }
            }
          >
            <span />
            <span />
            <span />
          </button>

        </div>

      </div>

    </header>
  );
}


export default Navbar;
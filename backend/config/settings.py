import os
from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent

# Charge gymsaas/.env en développement.
# Sur Render, les variables d'environnement sont fournies par le service.
load_dotenv(PROJECT_ROOT / ".env")


def get_env_bool(name, default=False):
    value = os.getenv(name)

    if value is None:
        return default

    normalized_value = value.strip().lower()

    if normalized_value in ("1", "true", "yes", "on"):
        return True

    if normalized_value in ("0", "false", "no", "off"):
        return False

    raise ImproperlyConfigured(
        f"La variable {name} doit être une valeur booléenne."
    )


def get_env_list(name, default=""):
    value = os.getenv(name, default)

    return [
        item.strip()
        for item in value.split(",")
        if item.strip()
    ]


# ---------------------------------------------------------------------
# Sécurité générale
# ---------------------------------------------------------------------

DEVELOPMENT_SECRET_KEY = (
    "django-insecure-development-only-change-this-key"
)

SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    DEVELOPMENT_SECRET_KEY,
)

DEBUG = get_env_bool(
    "DJANGO_DEBUG",
    True,
)

if not DEBUG and SECRET_KEY == DEVELOPMENT_SECRET_KEY:
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY doit être définie en production."
    )


ALLOWED_HOSTS = get_env_list(
    "DJANGO_ALLOWED_HOSTS",
    "127.0.0.1,localhost",
)


# Render transmet le protocole HTTPS à Django avec cet en-tête.
SECURE_PROXY_SSL_HEADER = (
    "HTTP_X_FORWARDED_PROTO",
    "https",
)

SECURE_SSL_REDIRECT = get_env_bool(
    "DJANGO_SECURE_SSL_REDIRECT",
    not DEBUG,
)

SESSION_COOKIE_SECURE = get_env_bool(
    "DJANGO_SESSION_COOKIE_SECURE",
    not DEBUG,
)

CSRF_COOKIE_SECURE = get_env_bool(
    "DJANGO_CSRF_COOKIE_SECURE",
    not DEBUG,
)


# ---------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------

INSTALLED_APPS = [
    # Applications Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Applications externes
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",

    # Applications GymSaaS
    "accounts",
    "gyms",
    "members",
    "contacts",
    "dashboard",
    "attendances",
    "reports",
    "auditlogs",
    "courses.apps.CoursesConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",

    # WhiteNoise doit être placé juste après SecurityMiddleware.
    "whitenoise.middleware.WhiteNoiseMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "config.urls"


TEMPLATES = [
    {
        "BACKEND": (
            "django.template.backends.django."
            "DjangoTemplates"
        ),
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                (
                    "django.template.context_processors."
                    "request"
                ),
                (
                    "django.contrib.auth."
                    "context_processors.auth"
                ),
                (
                    "django.contrib.messages."
                    "context_processors.messages"
                ),
            ],
        },
    },
]


WSGI_APPLICATION = "config.wsgi.application"


# ---------------------------------------------------------------------
# Base de données
# ---------------------------------------------------------------------

DATABASE_ENGINE = os.getenv(
    "DB_ENGINE",
    "sqlite",
).strip().lower()


if DATABASE_ENGINE == "sqlite":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

elif DATABASE_ENGINE in (
    "postgres",
    "postgresql",
):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv(
                "DB_NAME",
                "gymsaas",
            ),
            "USER": os.getenv(
                "DB_USER",
                "gymsaas",
            ),
            "PASSWORD": os.getenv(
                "DB_PASSWORD",
                "",
            ),
            "HOST": os.getenv(
                "DB_HOST",
                "127.0.0.1",
            ),
            "PORT": os.getenv(
                "DB_PORT",
                "5432",
            ),
            "CONN_MAX_AGE": int(
                os.getenv(
                    "DB_CONN_MAX_AGE",
                    "60",
                )
            ),
            "CONN_HEALTH_CHECKS": True,
        }
    }

    database_sslmode = os.getenv(
        "DB_SSLMODE",
        "",
    ).strip()

    if database_sslmode:
        DATABASES["default"]["OPTIONS"] = {
            "sslmode": database_sslmode,
        }

else:
    raise ImproperlyConfigured(
        "DB_ENGINE doit être 'sqlite' ou 'postgresql'."
    )


# ---------------------------------------------------------------------
# Validation des mots de passe
# ---------------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# ---------------------------------------------------------------------
# Internationalisation
# ---------------------------------------------------------------------

LANGUAGE_CODE = "fr-fr"

TIME_ZONE = "Africa/Casablanca"

USE_I18N = True
USE_TZ = True


# ---------------------------------------------------------------------
# Fichiers statiques et médias
# ---------------------------------------------------------------------

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


STORAGES = {
    "default": {
        "BACKEND": (
            "django.core.files.storage."
            "FileSystemStorage"
        ),
    },
    "staticfiles": {
        "BACKEND": (
            "whitenoise.storage."
            "CompressedManifestStaticFilesStorage"
        ),
    },
}


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ---------------------------------------------------------------------
# Utilisateur personnalisé
# ---------------------------------------------------------------------

AUTH_USER_MODEL = "accounts.User"


# ---------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        (
            "rest_framework_simplejwt.authentication."
            "JWTAuthentication"
        ),
        (
            "rest_framework.authentication."
            "SessionAuthentication"
        ),
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        (
            "rest_framework.permissions."
            "IsAuthenticated"
        ),
    ],
}


# ---------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=15,
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=7,
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "CHECK_REVOKE_TOKEN": True,
    "AUTH_HEADER_TYPES": (
        "Bearer",
    ),
    "SIGNING_KEY": os.getenv(
        "JWT_SIGNING_KEY",
        SECRET_KEY,
    ),
}


# ---------------------------------------------------------------------
# CORS et CSRF
# ---------------------------------------------------------------------

CORS_ALLOWED_ORIGINS = get_env_list(
    "CORS_ALLOWED_ORIGINS",
    (
        "http://localhost:3000,"
        "http://127.0.0.1:3000,"
        "http://localhost:5173,"
        "http://127.0.0.1:5173"
    ),
)


CSRF_TRUSTED_ORIGINS = get_env_list(
    "CSRF_TRUSTED_ORIGINS",
    (
        "http://localhost:3000,"
        "http://127.0.0.1:3000,"
        "http://localhost:5173,"
        "http://127.0.0.1:5173"
    ),
)


LOGIN_REDIRECT_URL = "/api/"
LOGOUT_REDIRECT_URL = "/api-auth/login/"
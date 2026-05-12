import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent

# Load environment variables from the .env file
from dotenv import load_dotenv
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-replace-me-in-production")
DEBUG = os.getenv("DEBUG", "True") == "True"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'core',
    'storages',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'wsgi.application'

# MongoDB Config using djongo
MONGO_HOST = os.getenv('MONGO_HOST', 'mongodb://localhost:27017/cyberportal')
DATABASES = {
    'default': {
        'ENGINE': 'djongo',
        'NAME': 'cyberportal',
        'ENFORCE_SCHEMA': False,
        'CLIENT': {'host': MONGO_HOST}
    }
}

AUTH_USER_MODEL = 'core.Employee'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_TZ = True

STATIC_URL = '/static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
CORS_ALLOW_ALL_ORIGINS = True

# Cloudflare R2 / AWS S3 Configuration
CF_R2_BUCKET = os.getenv('CF_R2_BUCKET')

if CF_R2_BUCKET:
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    AWS_ACCESS_KEY_ID = os.getenv('CF_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('CF_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = CF_R2_BUCKET
    AWS_S3_ENDPOINT_URL = f"https://{os.getenv('CF_ACCOUNT_ID')}.r2.cloudflarestorage.com"
    AWS_S3_REGION_NAME = 'auto'
    
    AWS_S3_SIGNATURE_VERSION = 's3v4'
    # R2 does not support ACLs, so this is required to avoid AccessDenied errors
    AWS_DEFAULT_ACL = None
    
    # CRITICAL: Disables security signatures on URLs so Cloudflare can serve them publicly
    AWS_QUERYSTRING_AUTH = False
    AWS_S3_FILE_OVERWRITE = False
    
    if os.getenv('CF_R2_PUBLIC_URL'):
        AWS_S3_CUSTOM_DOMAIN = os.getenv('CF_R2_PUBLIC_URL').replace('https://', '').rstrip('/')
from .base import *  # noqa

DEBUG = True

# Development database optimizations
DATABASES['default'].update({
    'CONN_MAX_AGE': 600,  # 10 minutes for development
})

# Reduce database connection overhead in dev
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',  # Only show warnings, not all queries
        },
    },
}

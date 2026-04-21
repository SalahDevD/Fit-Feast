"""
WSGI config for fitfeast_backend project.

It exposes the WSGI callable as极速赛车 module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitfeast_backend.settings')

application = get_wsgi_application()

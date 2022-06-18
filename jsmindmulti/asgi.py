"""
ASGI config for jsmindmulti project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/asgi/
"""

import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

from server.websocket.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jsmindmulti.settings')

application = ProtocolTypeRouter({
    # http 请求
    "http": get_asgi_application(),
    # websocket 请求
    # channels文档：https://channels.readthedocs.io/en/stable/tutorial/index.html
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})

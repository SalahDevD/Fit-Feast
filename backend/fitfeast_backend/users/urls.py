from django.urls import path
from . import views

urlpatterns = [
    path('', views.UserList.as_view(), name='user-list'),
    path('me/', views.UserDetail.as_view(), name='user-detail'),
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
]

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from core.views import (
    LoginView, ChangePasswordView, EmployeeViewSet, CyberComplaintViewSet,
    AdvFeeViewSet, CyberFeeViewSet, DashboardStatsView
)

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'complaints', CyberComplaintViewSet, basename='complaint')
router.register(r'fees/adv', AdvFeeViewSet, basename='adv_fees')
router.register(r'fees/cyber', CyberFeeViewSet, basename='cyber_fees')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('api/', include(router.urls)),
]
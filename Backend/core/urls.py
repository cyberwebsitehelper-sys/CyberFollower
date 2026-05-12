from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView, ChangePasswordView, DashboardStatsView,
    EmployeeViewSet, CyberComplaintViewSet, AdvFeeViewSet, CyberFeeViewSet,
)

router = DefaultRouter()
router.register(r"employees", EmployeeViewSet, basename="employees")
router.register(r"complaints", CyberComplaintViewSet, basename="complaints")
router.register(r"fees/adv", AdvFeeViewSet, basename="adv-fees")
router.register(r"fees/cyber", CyberFeeViewSet, basename="cyber-fees")

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("", include(router.urls)),
]

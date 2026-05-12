from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken

# Import Decimal128 for Atlas compatibility
try:
    from bson import Decimal128
except ImportError:
    Decimal128 = None

from .models import Employee, CyberComplaint, AdvFeeEntry, CyberFeeEntry
from .serializers import (
    LoginSerializer, EmployeeSerializer, EmployeeCreateSerializer,
    ChangePasswordSerializer,
    CyberComplaintSerializer, AdvFeeEntrySerializer, CyberFeeEntrySerializer,
    DashboardStatsSerializer,
)

class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and (request.user.is_superuser or getattr(request.user, "is_super_role", False)))

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.validated_data["user"]
        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": EmployeeSerializer(user).data,
        })

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by("-date_joined")
    permission_classes = [IsSuperUser]

    def get_serializer_class(self):
        if self.action == 'create':
            return EmployeeCreateSerializer
        return EmployeeSerializer

class OwnedQuerysetMixin:
    """Employees see their own rows; super role sees all."""
    owner_field = "employee"

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if getattr(user, "is_super_role", False) or user.is_superuser:
            return qs
        return qs.filter(**{self.owner_field: user})

class CyberComplaintViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet):
    queryset = CyberComplaint.objects.all().order_by("-created_at")
    serializer_class = CyberComplaintSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)

    @action(detail=False, methods=["get"], url_path="active")
    def active(self, request):
        try:
            qs = self.get_queryset().filter(is_complete=False)
            return Response(self.get_serializer(qs, many=True).data)
        except Exception:
            all_qs = list(self.get_queryset())
            active_list = [obj for obj in all_qs if not obj.is_complete]
            return Response(self.get_serializer(active_list, many=True).data)

    @action(detail=False, methods=["get"], url_path="closed")
    def closed(self, request):
        try:
            qs = self.get_queryset().filter(is_complete=True)
            return Response(self.get_serializer(qs, many=True).data)
        except Exception:
            all_qs = list(self.get_queryset())
            closed_list = [obj for obj in all_qs if obj.is_complete]
            return Response(self.get_serializer(closed_list, many=True).data)

    @action(detail=True, methods=["post"], url_path="close")
    def close(self, request, pk=None):
        pwd = request.data.get("password_confirm")
        if not pwd or not request.user.check_password(pwd):
            return Response({"password_confirm": "Password confirmation failed."},
                            status=status.HTTP_400_BAD_REQUEST)
        complaint = self.get_object()
        complaint.is_complete = True
        complaint.completed_at = timezone.now()
        complaint.save(update_fields=["is_complete", "completed_at"])
        return Response(self.get_serializer(complaint).data)

class AdvFeeViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet):
    queryset = AdvFeeEntry.objects.all().order_by("-created_at")
    serializer_class = AdvFeeEntrySerializer

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)

class CyberFeeViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet):
    queryset = CyberFeeEntry.objects.all().order_by("-created_at")
    serializer_class = CyberFeeEntrySerializer

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)

def clean_decimal(value):
    if value is None:
        return Decimal("0.00")
    if Decimal128 and isinstance(value, Decimal128):
        return value.to_decimal()
    try:
        return Decimal(str(value))
    except:
        return Decimal("0.00")

class DashboardStatsView(APIView):
    def get(self, request):
        user = request.user
        is_super = getattr(user, "is_super_role", False) or user.is_superuser

        c_qs = CyberComplaint.objects.all() if is_super else CyberComplaint.objects.filter(employee=user)
        a_qs = AdvFeeEntry.objects.all() if is_super else AdvFeeEntry.objects.filter(employee=user)
        y_qs = CyberFeeEntry.objects.all() if is_super else CyberFeeEntry.objects.filter(employee=user)

        try:
            active_count = c_qs.filter(is_complete=False).count()
            closed_count = c_qs.filter(is_complete=True).count()
        except:
            all_c = list(c_qs)
            active_count = len([obj for obj in all_c if not obj.is_complete])
            closed_count = len([obj for obj in all_c if obj.is_complete])

        try:
            adv_total_raw = a_qs.aggregate(s=Sum("fees"))["s"]
            cyb_total_raw = y_qs.aggregate(s=Sum("fees"))["s"]
            adv_total = clean_decimal(adv_total_raw)
            cyb_total = clean_decimal(cyb_total_raw)
        except:
            adv_total = sum(obj.fees for obj in a_qs)
            cyb_total = sum(obj.fees for obj in y_qs)

        data = {
            "active_count": active_count,
            "closed_count": closed_count,
            "adv_fee_total": adv_total,
            "cyber_fee_total": cyb_total,
            "grand_total_fees": adv_total + cyb_total,
        }
        return Response(DashboardStatsSerializer(data).data)

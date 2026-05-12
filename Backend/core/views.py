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
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': EmployeeSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'detail': 'Password updated successfully.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by("-date_joined")
    permission_classes = [permissions.IsAuthenticated, IsSuperUser]

    def get_serializer_class(self):
        if self.action == 'create':
            return EmployeeCreateSerializer
        return EmployeeSerializer

    @action(detail=True, methods=['post'], url_path='change-password')
    def change_password(self, request, pk=None):
        employee = self.get_object()
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            employee.set_password(serializer.validated_data['new_password'])
            employee.save()
            return Response({'status': 'password set'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OwnedQuerysetMixin:
    def get_queryset(self):
        user = self.request.user
        if getattr(user, "is_super_role", False) or user.is_superuser:
            return self.queryset
        return self.queryset.filter(employee=user)

class CyberComplaintViewSet(OwnedQuerysetMixin, viewsets.ModelViewSet):
    queryset = CyberComplaint.objects.all().order_by("-created_at")
    serializer_class = CyberComplaintSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)

    @action(detail=False, methods=['get'])
    def active(self, request):
        try:
            qs = self.get_queryset().filter(is_complete=False)
            serializer = self.get_serializer(qs, many=True)
            return Response(serializer.data)
        except:
            # Djongo boolean filter fallback
            all_objs = list(self.get_queryset())
            filtered = [obj for obj in all_objs if not obj.is_complete]
            serializer = self.get_serializer(filtered, many=True)
            return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def closed(self, request):
        try:
            qs = self.get_queryset().filter(is_complete=True)
            serializer = self.get_serializer(qs, many=True)
            return Response(serializer.data)
        except:
            # Djongo boolean filter fallback
            all_objs = list(self.get_queryset())
            filtered = [obj for obj in all_objs if obj.is_complete]
            serializer = self.get_serializer(filtered, many=True)
            return Response(serializer.data)

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
    permission_classes = [permissions.IsAuthenticated]

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
            adv_total = sum((clean_decimal(obj.fees) for obj in a_qs), Decimal("0.00"))
            cyb_total = sum((clean_decimal(obj.fees) for obj in y_qs), Decimal("0.00"))

        data = {
            "active_count": active_count,
            "closed_count": closed_count,
            "adv_fee_total": adv_total,
            "cyber_fee_total": cyb_total,
            "grand_total_fees": adv_total + cyb_total,
        }

        serializer = DashboardStatsSerializer(data)
        return Response(serializer.data)

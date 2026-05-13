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

def has_uploaded_file(file_obj):
    if not file_obj:
        return False
    size = getattr(file_obj, "size", None)
    if size is None:
        return True
    return size > 0

def complaint_has_noc(complaint):
    file_obj = getattr(complaint, "noc_file", None)
    if not file_obj:
        return False
    file_name = getattr(file_obj, "name", None)
    if file_name:
        return bool(str(file_name).strip())
    return True

def complaint_ready_for_close(complaint):
    required_text_fields = [
        "bank_name",
        "ack_number",
        "ifsc_code",
        "state_name",
        "district",
        "layer",
    ]
    for field in required_text_fields:
        value = getattr(complaint, field, "")
        if not str(value or "").strip():
            return False

    try:
        txn_amount = Decimal(str(getattr(complaint, "txn_amount", 0) or 0))
        dispute_amount = Decimal(str(getattr(complaint, "dispute_amount", 0) or 0))
    except Exception:
        return False

    if txn_amount <= 0 or dispute_amount < 0:
        return False

    return complaint_has_noc(complaint)

def extract_password_confirm(request):
    pwd = request.data.get("password_confirm")
    if not pwd:
        pwd = request.query_params.get("password_confirm")
    return pwd

def persist_noc_file(complaint, uploaded_file):
    if not has_uploaded_file(uploaded_file):
        return
    try:
        uploaded_file.seek(0)
    except Exception:
        pass
    complaint.noc_file.save(uploaded_file.name, uploaded_file, save=False)

def is_marked_complete(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    if isinstance(value, (int, float)):
        return value != 0
    return str(value).strip().lower() in ("1", "true", "yes", "y", "on")

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
        # Prefer request.FILES for djongo/file-field reliability.
        noc_file = self.request.FILES.get('noc_file') or serializer.validated_data.get('noc_file')
        valid_noc_file = noc_file if has_uploaded_file(noc_file) else None
        instance = serializer.save(employee=self.request.user)
        # Fallback for environments where serializer-save may not persist file.
        if valid_noc_file and not getattr(instance, "noc_file", None):
            persist_noc_file(instance, valid_noc_file)
            instance.save()

        is_complete = complaint_ready_for_close(instance)
        instance.is_complete = is_complete
        instance.completed_at = timezone.now() if is_complete else None
        instance.save()

    def perform_update(self, serializer):
        # Update logic to handle auto-completion
        instance = self.get_object()
        # If new file is uploaded OR it already had a file
        noc_file = self.request.FILES.get('noc_file') or serializer.validated_data.get('noc_file')
        valid_noc_file = noc_file if has_uploaded_file(noc_file) else None
        updated_instance = serializer.save()
        # Fallback only when file did not persist after serializer.save().
        if valid_noc_file and not getattr(updated_instance, "noc_file", None):
            persist_noc_file(updated_instance, valid_noc_file)
            updated_instance.save()

        should_complete = complaint_ready_for_close(updated_instance)
        updated_instance.is_complete = should_complete
        updated_instance.completed_at = timezone.now() if should_complete else None
        updated_instance.save()

    def destroy(self, request, *args, **kwargs):
        pwd = extract_password_confirm(request)
        if not pwd or not request.user.check_password(pwd):
            return Response({"detail": "Password confirmation failed to delete."}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        complaint = self.get_object()
        pwd = extract_password_confirm(request)
        if not pwd or not request.user.check_password(pwd):
            return Response({"detail": "Password confirmation failed."}, status=status.HTTP_400_BAD_REQUEST)

        # Closing requires all required data + NOC.
        if not complaint_ready_for_close(complaint):
            return Response({"detail": "Complete required fields and upload NOC before closing."}, status=status.HTTP_400_BAD_REQUEST)

        complaint.is_complete = True
        complaint.completed_at = timezone.now()
        complaint.save(update_fields=['is_complete', 'completed_at'])
        return Response({"status": "complaint closed"})

    @action(detail=True, methods=['post'], url_path='upload-noc')
    def upload_noc(self, request, pk=None):
        complaint = self.get_object()
        pwd = extract_password_confirm(request)
        if not pwd or not request.user.check_password(pwd):
            return Response({"detail": "Password confirmation failed."}, status=status.HTTP_400_BAD_REQUEST)

        noc_file = request.FILES.get("noc_file")
        if not has_uploaded_file(noc_file):
            return Response({"detail": "noc_file is required."}, status=status.HTTP_400_BAD_REQUEST)

        persist_noc_file(complaint, noc_file)
        complaint.is_complete = complaint_ready_for_close(complaint)
        complaint.completed_at = timezone.now() if complaint.is_complete else None
        complaint.save()

        return Response(self.get_serializer(complaint).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def active(self, request):
        # Keep filtering in Python: djongo can fail on OR/isnull SQL translation.
        all_objs = list(self.get_queryset())
        # Active = anything not fully ready for close.
        filtered = [obj for obj in all_objs if not complaint_ready_for_close(obj)]
        serializer = self.get_serializer(filtered, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def closed(self, request):
        all_objs = list(self.get_queryset())
        # Closed = fully completed with all required data + NOC.
        filtered = [obj for obj in all_objs if complaint_ready_for_close(obj)]
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

        all_c = list(c_qs)
        active_count = len([obj for obj in all_c if not is_marked_complete(getattr(obj, "is_complete", False))])
        closed_count = len([obj for obj in all_c if is_marked_complete(getattr(obj, "is_complete", False))])

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

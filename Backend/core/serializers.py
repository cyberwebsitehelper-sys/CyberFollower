from decimal import Decimal
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Employee, CyberComplaint, AdvFeeEntry, CyberFeeEntry


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ["id", "phone_number", "full_name", "is_super_role", "is_active"]
        read_only_fields = ["id"]


class EmployeeCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Employee
        fields = ["id", "phone_number", "full_name", "password", "is_super_role"]

    def create(self, validated_data):
        return Employee.objects.create_user(**validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=4)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class LoginSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(phone_number=attrs["phone_number"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid phone number or password.")
        attrs["user"] = user
        return attrs


class CyberComplaintSerializer(serializers.ModelSerializer):
    password_confirm = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = CyberComplaint
        fields = [
            "id", "bank_name", "ack_number", "ifsc_code", "state_name", "district", "layer",
            "txn_amount", "dispute_amount", "utr_number", "police_station", "vendor_name",
            "noc_file", "is_complete", "created_at", "completed_at", "employee",
            "password_confirm",
        ]
        read_only_fields = ["is_complete", "created_at", "completed_at", "employee"]

    def validate_txn_amount(self, v):
        if v <= 0:
            raise serializers.ValidationError("txn_amount must be positive.")
        return v

    def validate_dispute_amount(self, v):
        if v < 0:
            raise serializers.ValidationError("dispute_amount must be non-negative.")
        return v

    def validate_ack_number(self, v):
        qs = CyberComplaint.objects.filter(ack_number=v)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("ack_number must be unique.")
        return v

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.method in ("POST", "PATCH", "PUT"):
            pwd = attrs.pop("password_confirm", None)
            if not pwd or not request.user.check_password(pwd):
                raise serializers.ValidationError({"password_confirm": "Password confirmation failed."})
        return attrs


class FeeEntrySerializerBase(serializers.ModelSerializer):
    password_confirm = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        fields = ["id", "name", "fees", "created_at", "employee", "password_confirm"]
        read_only_fields = ["created_at", "employee"]

    def validate_fees(self, v):
        if v < 0:
            raise serializers.ValidationError("fees must be non-negative.")
        return v

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.method in ("POST", "PATCH", "PUT"):
            pwd = attrs.pop("password_confirm", None)
            if not pwd or not request.user.check_password(pwd):
                raise serializers.ValidationError({"password_confirm": "Password confirmation failed."})
        return attrs


class AdvFeeEntrySerializer(FeeEntrySerializerBase):
    class Meta(FeeEntrySerializerBase.Meta):
        model = AdvFeeEntry


class CyberFeeEntrySerializer(FeeEntrySerializerBase):
    class Meta(FeeEntrySerializerBase.Meta):
        model = CyberFeeEntry


class DashboardStatsSerializer(serializers.Serializer):
    active_count = serializers.IntegerField()
    closed_count = serializers.IntegerField()
    adv_fee_total = serializers.DecimalField(max_digits=16, decimal_places=2)
    cyber_fee_total = serializers.DecimalField(max_digits=16, decimal_places=2)
    grand_total_fees = serializers.DecimalField(max_digits=16, decimal_places=2)

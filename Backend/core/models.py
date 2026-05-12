from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class EmployeeManager(BaseUserManager):
    def create_user(self, phone_number, full_name, password=None, **extra):
        if not phone_number:
            raise ValueError("phone_number is required")
        user = self.model(phone_number=phone_number, full_name=full_name, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, full_name, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("is_super_role", True)
        return self.create_user(phone_number, full_name, password, **extra)


class Employee(AbstractBaseUser, PermissionsMixin):
    phone_number = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    # 'Super' role: can see all data
    is_super_role = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = EmployeeManager()

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = ["full_name"]

    def __str__(self):
        return f"{self.full_name} ({self.phone_number})"


class CyberComplaint(models.Model):
    bank_name = models.CharField(max_length=150)
    ack_number = models.CharField(max_length=100, unique=True)
    ifsc_code = models.CharField(max_length=20)
    state_name = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    layer = models.CharField(max_length=50)
    txn_amount = models.DecimalField(max_digits=14, decimal_places=2)
    dispute_amount = models.DecimalField(max_digits=14, decimal_places=2)
    utr_number = models.CharField(max_length=100, blank=True, default="")
    police_station = models.CharField(max_length=150, blank=True, default="")
    vendor_name = models.CharField(max_length=150, blank=True, default="")
    noc_file = models.FileField(upload_to="noc/", blank=True, null=True)
    is_complete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="complaints")

    def __str__(self):
        return f"{self.ack_number} - {self.bank_name}"


class AdvFeeEntry(models.Model):
    name = models.CharField(max_length=150)
    fees = models.DecimalField(max_digits=14, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="adv_fees")


class CyberFeeEntry(models.Model):
    name = models.CharField(max_length=150)
    fees = models.DecimalField(max_digits=14, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="cyber_fees")

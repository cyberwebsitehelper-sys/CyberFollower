from django.contrib import admin
from .models import Employee, CyberComplaint, AdvFeeEntry, CyberFeeEntry

admin.site.register(Employee)
admin.site.register(CyberComplaint)
admin.site.register(AdvFeeEntry)
admin.site.register(CyberFeeEntry)

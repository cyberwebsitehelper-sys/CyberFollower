import os
from django.core.management.base import BaseCommand
from core.models import Employee

class Command(BaseCommand):
    help = 'Creates a default admin user'

    def handle(self, *args, **kwargs):
        phone_number = os.getenv('DEFAULT_ADMIN_PHONE', '1234567890')
        password = os.getenv('DEFAULT_ADMIN_PASSWORD', 'password123')
        
        if not Employee.objects.filter(phone_number=phone_number).exists():
            Employee.objects.create_superuser(
                phone_number=phone_number,
                full_name='Admin User',
                password=password
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created default admin! Phone: {phone_number} | Password: {password}'))
        else:
            self.stdout.write(self.style.WARNING(f'Admin user with phone number {phone_number} already exists.'))
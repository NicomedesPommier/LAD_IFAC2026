from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workspace', '0002_custommesh'),
    ]

    operations = [
        migrations.AddField(
            model_name='canvas',
            name='connect_to_qcar',
            field=models.BooleanField(default=False),
        ),
    ]

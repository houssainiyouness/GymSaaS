import uuid

from django.db import migrations


def populate_member_qr_codes(apps, schema_editor):
    Member = apps.get_model("members", "Member")

    for member in Member.objects.filter(
        qr_code__isnull=True,
    ).iterator():
        member.qr_code = uuid.uuid4()
        member.save(
            update_fields=("qr_code",),
        )


class Migration(migrations.Migration):
    dependencies = [
    ("members", "0003_add_member_qr_code"),
]

    operations = [
        migrations.RunPython(
            populate_member_qr_codes,
            migrations.RunPython.noop,
        ),
    ]
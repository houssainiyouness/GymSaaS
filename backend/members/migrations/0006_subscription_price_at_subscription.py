from django.db import migrations, models


def copy_existing_subscription_prices(apps, schema_editor):
    Subscription = apps.get_model(
        "members",
        "Subscription",
    )

    subscriptions = Subscription.objects.select_related(
        "plan",
    ).all()

    for subscription in subscriptions.iterator():
        subscription.price_at_subscription = (
            subscription.plan.price
        )
        subscription.save(
            update_fields=(
                "price_at_subscription",
            ),
        )


class Migration(migrations.Migration):
    dependencies = [
        (
            "members",
            "0005_require_member_qr_code",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="subscription",
            name="price_at_subscription",
            field=models.DecimalField(
                decimal_places=2,
                editable=False,
                max_digits=10,
                null=True,
                verbose_name="Prix à la souscription",
            ),
        ),
        migrations.RunPython(
            copy_existing_subscription_prices,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="subscription",
            name="price_at_subscription",
            field=models.DecimalField(
                decimal_places=2,
                editable=False,
                max_digits=10,
                verbose_name="Prix à la souscription",
            ),
        ),
    ]

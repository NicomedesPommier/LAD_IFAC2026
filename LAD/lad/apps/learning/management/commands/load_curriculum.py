"""
Management command to load curriculum data (units, levels, objectives) into the database.
Usage: python manage.py load_curriculum
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction
from apps.learning.models import Unit, Level, Objective


class Command(BaseCommand):
    help = 'Load curriculum data (units, levels, objectives) from fixtures'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing curriculum data before loading',
        )
        parser.add_argument(
            '--fixture',
            type=str,
            default='fixtures/curriculum_data.json',
            help='Fixture file path (default: fixtures/curriculum_data.json)',
        )

    def handle(self, *args, **options):
        clear = options['clear']
        fixture = options['fixture']

        if clear:
            self.stdout.write(
                self.style.WARNING('Clearing existing curriculum data...')
            )
            with transaction.atomic():
                # Delete in order due to foreign key constraints
                Objective.objects.all().delete()
                Level.objects.all().delete()
                Unit.objects.all().delete()
            self.stdout.write(
                self.style.SUCCESS('SUCCESS: Curriculum data cleared')
            )

        self.stdout.write(f'Loading curriculum from {fixture}...')

        try:
            call_command('loaddata', fixture)

            # Display statistics
            unit_count = Unit.objects.count()
            level_count = Level.objects.count()
            objective_count = Objective.objects.count()

            self.stdout.write(
                self.style.SUCCESS(f'\nSUCCESS: Successfully loaded curriculum data!')
            )
            self.stdout.write(f'  - Units: {unit_count}')
            self.stdout.write(f'  - Levels: {level_count}')
            self.stdout.write(f'  - Objectives: {objective_count}')

            # Display units structure
            self.stdout.write('\nCurriculum structure:')
            for unit in Unit.objects.prefetch_related('levels').order_by('order'):
                level_count = unit.levels.count()
                self.stdout.write(
                    f'  {unit.order}. {unit.title} ({level_count} levels)'
                )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'ERROR: Error loading curriculum: {str(e)}')
            )
            raise

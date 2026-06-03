from django.apps import AppConfig


class AAcademicoConfig(AppConfig):
    name = 'a_academico'

    def ready(self):
        import a_academico.signals

from django.db import migrations


def converter_docs_para_documentos(apps, schema_editor):
    file_model = apps.get_model('a_academico', 'ArquivoMateriaClassroom')
    file_model.objects.filter(selected_folder='docs').update(selected_folder='documentos')

    config_model = apps.get_model('a_academico', 'ConfiguracaoGeralClassroom')
    for config_item in config_model.objects.all():
        if 'docs' in config_item.folder_options:
            folders_list = [f.strip() for f in config_item.folder_options.split(',') if f.strip()]
            updated_folders = ['documentos' if f == 'docs' else f for f in folders_list]
            config_item.folder_options = ','.join(updated_folders)
            config_item.save()


class Migration(migrations.Migration):

    dependencies = [
        ('a_academico', '0009_remove_arquivomateriaclassroom_is_downloaded'),
    ]

    operations = [
        migrations.RunPython(converter_docs_para_documentos),
    ]

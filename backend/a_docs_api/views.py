from django.shortcuts import render

def scalar_docs(request):
    return render(request, "scalar.html", {
        "schema_url": "schema" 
    })

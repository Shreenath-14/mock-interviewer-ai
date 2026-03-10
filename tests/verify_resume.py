
import requests
import base64
import io

# Robust "Hello World" PDF
pdf_base64 = "JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogICUgcGFnZXMKPDwKICAvVHlwZSAvUGFnZXwKICAvTWVkaWFCb3ggWyAwIDAgNTk1LjI4IDg0MS44OSBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqICAlIHBhZ2UKPDwKICAvVHlwZSAvUGFnZQogIC9QYXJlbnQgMiAwIFIKICAvUmVzb3VyY2VzIDw8CiAgICAvRm9udCA8ZAogICAgICAvRjEgNCAwIFIKICAgID4+CiAgPj4KICAvQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqICAlIGZvbnQKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iagoKNSAwIG9iaiAgJSBwYWdlIGNvbnRlbnQKPDwKICAvTGVuZ3RoIDUzCj4+CnN0cmVhbQpCVAovRjEgMjQgVGlmCjEwMCA3MDAgVGQKKHRESVMgSVMgQSBURVNUIFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDE1NyAwMDAwMCBuIAowMDAwMDAwMjY0IDAwMDAwIG4gCjAwMDAwMDAzNTIgMDAwMDAgbiAKdHJhaWxlcgo8ZAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNTA3CiUlRU9GCg=="

try:
    pdf_bytes = base64.b64decode(pdf_base64)
    files = {'resume': ('test.pdf', pdf_bytes, 'application/pdf')}
    
    print("Uploading mocked PDF...")
    res = requests.post('http://localhost:5000/api/resume/upload', files=files)
    
    print(f"Status: {res.status_code}")
    if res.status_code == 200:
        print("Response:", res.json())
    else:
        print("Error:", res.text)

except Exception as e:
    print(f"FAILED: {e}")

import requests

files = [
    ("files", ("test.pdf", open("test.pdf", "rb"), "application/pdf")),
    ("files", ("test2.pdf", open("test.pdf", "rb"), "application/pdf")),
]

resp = requests.post("http://127.0.0.1:8000/upload/", files=files)
print(resp.status_code)
print(resp.text)

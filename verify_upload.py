import os

def test_upload():
    # 1. Create a dummy image
    with open("test_image.png", "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82")

    # 2. Upload it via curl (simulated via urllib)
    import urllib.request
    import urllib.parse
    import json

    url = "http://localhost:3000/api/upload"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    
    # MIME Types
    content_type = "multipart/form-data; boundary={}".format(boundary)
    
    # Read file
    with open("test_image.png", "rb") as f:
        file_content = f.read()

    # Build body
    body = []
    body.append(f"--{boundary}".encode())
    body.append(f'Content-Disposition: form-data; name="file"; filename="test_image.png"'.encode())
    body.append(f'Content-Type: image/png'.encode())
    body.append(b"")
    body.append(file_content)
    body.append(f"--{boundary}--".encode())
    body.append(b"")
    
    body_bytes = b"\r\n".join(body)

    req = urllib.request.Request(url, data=body_bytes, headers={'Content-Type': content_type})
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            resp_body = response.read().decode('utf-8')
            print(f"Status Code: {status}")
            print(f"Response: {resp_body}")
            
            if status == 200:
                 json_resp = json.loads(resp_body)
                 if 'url' in json_resp and json_resp['url'].startswith('http'):
                     print("SUCCESS: Image uploaded and URL returned.")
                 else:
                     print("FAILURE: Invalid response format.")
            else:
                print("FAILURE: Upload status not 200.")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_upload()

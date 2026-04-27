import requests

BASE_URL = "http://51.21.201.21:8000"

def test_flow():
    # 1. Try to register
    print("Registering...")
    res = requests.post(f"{BASE_URL}/register", json={
        "username": "bot4",
        "email": "bot4@test.com",
        "password": "pass"
    })
    print("Register:", res.status_code, res.text)
    
    # 2. Login
    print("Logging in...")
    res = requests.post(f"{BASE_URL}/token", data={
        "username": "bot4",
        "password": "pass"
    })
    print("Login:", res.status_code, res.text)
    
    if res.status_code == 200:
        token = res.json()["access_token"]
        print("Got token:", token)
        
        # 3. Test /me endpoint
        print("Testing /me...")
        headers = {"Authorization": f"Bearer {token}"}
        res2 = requests.get(f"{BASE_URL}/me", headers=headers)
        print("Me:", res2.status_code, res2.text)
        
        # 4. Test /documents/
        print("Testing /documents/...")
        res3 = requests.get(f"{BASE_URL}/documents/", headers=headers)
        print("Documents:", res3.status_code, res3.text)

if __name__ == "__main__":
    test_flow()

import requests

API_URL = 'http://127.0.0.1:8000'

# register
# requests.post(f'{API_URL}/register', json={'username': 'testuser2', 'email': 'test2@example.com', 'password': 'password'})

# login
res = requests.post(f'{API_URL}/token', data={'username': 'testuser2', 'password': 'password'})
print('Login:', res.status_code, res.text)

if res.status_code == 200:
    token = res.json()['access_token']
    # get me
    headers = {'Authorization': f'Bearer {token}'}
    res2 = requests.get(f'{API_URL}/me', headers=headers)
    print('Me:', res2.status_code, res2.text)

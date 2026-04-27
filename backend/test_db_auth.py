import requests

API_URL = 'http://127.0.0.1:8000'

# Try to register
res_reg = requests.post(f'{API_URL}/register', json={'username': 'test_admin', 'email': 'admin@example.com', 'password': 'password123'})
print('Register:', res_reg.status_code, res_reg.text)

# Try to login
res_log = requests.post(f'{API_URL}/token', data={'username': 'test_admin', 'password': 'password123'})
print('Login:', res_log.status_code, res_log.text)

if res_log.status_code == 200:
    token = res_log.json()['access_token']
    # Try to access protected endpoint
    headers = {'Authorization': f'Bearer {token}'}
    res_me = requests.get(f'{API_URL}/me', headers=headers)
    print('Me endpoint:', res_me.status_code, res_me.text)

import requests

BASE_URL = "http://localhost:8085/api"

# Login as a normal user
def login(email, password="password"):
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if res.status_code == 200:
        return res.json()['data']['token']
    return None

# Mật khẩu của thanh@gmail.com hoặc admin@hourlink.vn
token = login("baoheo@gmail.com", "123456") # usually test password
if not token:
    # Try another user
    token = login("admin@hourlink.vn", "admin123")

if not token:
    # We will register a new user
    res = requests.post(f"{BASE_URL}/auth/register", json={
        "email": "test_user_for_reg@hourlink.vn",
        "password": "password123",
        "fullName": "Test User"
    })
    token = res.json()['data']['token']

print("Token:", token[:20] + "...")

# Get activities
res = requests.get(f"{BASE_URL}/community/activities", headers={"Authorization": f"Bearer {token}"})
activities = res.json()['data']['content']
if not activities:
    print("No activities found!")
else:
    act_id = activities[0]['id']
    print(f"Found activity: {act_id} - {activities[0]['title']} - Status: {activities[0]['status']}")
    
    # Try to register
    reg_res = requests.post(f"{BASE_URL}/community/activities/{act_id}/register", headers={"Authorization": f"Bearer {token}"})
    print("Register Status Code:", reg_res.status_code)
    print("Register Response:", reg_res.text)

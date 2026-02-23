import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

# --- GET /activities ---
def test_get_activities():
    # Arrange
    # (client is already arranged)
    # Act
    response = client.get("/activities")
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]

# --- POST /activities/{activity_name}/signup ---
def test_signup_success():
    # Arrange
    activity = "Chess Club"
    email = "testuser1@mergington.edu"
    # Act
    response = client.post(f"/activities/{activity}/signup?email={email}")
    # Assert
    assert response.status_code == 200
    assert f"Signed up {email}" in response.json()["message"]
    # Cleanup
    client.post(f"/activities/{activity}/unregister?email={email}")

def test_signup_duplicate():
    # Arrange
    activity = "Chess Club"
    email = "testuser2@mergington.edu"
    client.post(f"/activities/{activity}/signup?email={email}")
    # Act
    response = client.post(f"/activities/{activity}/signup?email={email}")
    # Assert
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]
    # Cleanup
    client.post(f"/activities/{activity}/unregister?email={email}")

def test_signup_invalid_email():
    # Arrange
    activity = "Chess Club"
    email = "notanemail@gmail.com"
    # Act
    response = client.post(f"/activities/{activity}/signup?email={email}")
    # Assert
    assert response.status_code == 400
    assert "Invalid email address" in response.json()["detail"]

def test_signup_full_activity():
    # Arrange
    activity = "Tennis Club"
    # Fill up the activity
    for i in range(10):
        email = f"fulluser{i}@mergington.edu"
        client.post(f"/activities/{activity}/signup?email={email}")
    # Act
    response = client.post(f"/activities/{activity}/signup?email=overflow@mergington.edu")
    # Assert
    assert response.status_code == 400
    assert "Activity is full" in response.json()["detail"]
    # Cleanup
    for i in range(10):
        email = f"fulluser{i}@mergington.edu"
        client.post(f"/activities/{activity}/unregister?email={email}")

def test_signup_activity_not_found():
    # Arrange
    activity = "Nonexistent Club"
    email = "ghost@mergington.edu"
    # Act
    response = client.post(f"/activities/{activity}/signup?email={email}")
    # Assert
    assert response.status_code == 404
    assert "Activity not found" in response.json()["detail"]

# --- POST /activities/{activity_name}/unregister ---
def test_unregister_success():
    # Arrange
    activity = "Programming Class"
    email = "unreguser@mergington.edu"
    client.post(f"/activities/{activity}/signup?email={email}")
    # Act
    response = client.post(f"/activities/{activity}/unregister?email={email}")
    # Assert
    assert response.status_code == 200
    assert f"Unregistered {email}" in response.json()["message"]

def test_unregister_not_signed_up():
    # Arrange
    activity = "Programming Class"
    email = "notregistered@mergington.edu"
    # Act
    response = client.post(f"/activities/{activity}/unregister?email={email}")
    # Assert
    assert response.status_code == 400
    assert "not signed up" in response.json()["detail"]

def test_unregister_activity_not_found():
    # Arrange
    activity = "Ghost Club"
    email = "ghost@mergington.edu"
    # Act
    response = client.post(f"/activities/{activity}/unregister?email={email}")
    # Assert
    assert response.status_code == 404
    assert "Activity not found" in response.json()["detail"]

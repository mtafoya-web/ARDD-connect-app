from pydantic import BaseModel, ConfigDict
from datetime import datetime

class UserOut(BaseModel):
    id: int
    username: str
    followers_count: int = 0
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class MockUser:
    def __init__(self, id, username, created_at):
        self.id = id
        self.username = username
        self.created_at = created_at

user = MockUser(1, "test", datetime.now())
try:
    out = UserOut.model_validate(user)
    print(out.model_dump())
except Exception as e:
    print(f"Error: {e}")

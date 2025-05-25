from fastapi import FastAPI
from user import router as user_router
from admin import router as admin_router

app = FastAPI(root_path='/api')
    
app.include_router(user_router.router, prefix='/api/user', tags=['user'])
app.include_router(admin_router.router, prefix='/api/admin', tags=['admin'])
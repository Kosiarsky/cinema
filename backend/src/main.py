from fastapi import FastAPI
from user import router as user_router
from admin import router as admin_router
from movie import router as movie_router

app = FastAPI(root_path='/api')
    
app.include_router(user_router.router, prefix='/user', tags=['user'])
app.include_router(admin_router.router, prefix='/admin', tags=['admin'])
app.include_router(movie_router.router, prefix='/movie', tags=['movie'])
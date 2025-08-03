from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from user import router as user_router
from admin import router as admin_router
from movie import router as movie_router
from general import router as general_router

app = FastAPI(root_path='/api')

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:3000", "*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
    
app.include_router(general_router.router, prefix='/general', tags=['general'])
app.include_router(user_router.router, prefix='/user', tags=['user'])
app.include_router(admin_router.router, prefix='/admin', tags=['admin'])
app.include_router(movie_router.router, prefix='/movie', tags=['movie'])
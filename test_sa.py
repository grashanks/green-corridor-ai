import os
os.environ["DISABLE_SQLALCHEMY_C_EXTENSIONS"] = "1"
import sqlalchemy
print("SQLAlchemy version:", sqlalchemy.__version__)

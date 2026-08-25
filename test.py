from dotenv import load_dotenv, find_dotenv
import os


load_dotenv(find_dotenv())

x = os.environ.get("GROQ_API_KEY")
print(x)
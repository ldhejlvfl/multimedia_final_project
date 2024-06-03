from flask import Flask, request, render_template, url_for
import os
import mysql.connector
from datetime import datetime

app = Flask(__name__)
app.template_folder = 'templates'
app.static_folder = 'static'

@app.route("/")
def index():
	return render_template("index.html")

# @app.route('/upload', methods=["POST"])
# def upload_file():
# 	return True


if __name__ == "__main__":
	app.run(debug=True)
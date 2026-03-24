from api.index import app


if __name__ == "__main__":
    # Local development server for the main monitoring dashboard.
    # Visit http://127.0.0.1:5000/ in your browser.
    app.run(debug=True, host="127.0.0.1", port=5000)


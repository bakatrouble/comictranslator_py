from bottle import *
import sqlite3
import os
from lang import ru as lang
from json import dumps
import webbrowser

app = Bottle()

main_db = sqlite3.connect("db.sqlite3")
main_db_c = main_db.cursor()

@app.route("/")
@view("index")
def index():
    main_db_c.execute("SELECT * FROM comics")
    return {"lang": lang, "comics_list": main_db_c.fetchall()}


@app.route("/<cid:int>")
@app.route("/<cid:int>/<pid:int>")
@view("page")
def page(cid, pid=None):
    main_db_c.execute("SELECT * FROM comics WHERE id=?", (cid,))
    comic = main_db_c.fetchone()
    if not comic:
        abort(404, lang["no_comics"])
    comic_db = sqlite3.connect(os.path.join("comics", comic[1], "db.sqlite3"))
    comic_db_c = comic_db.cursor()
    if not pid:
        comic_db_c.execute("SELECT value FROM stats WHERE name='curr_page'")
        pid = comic_db_c.fetchone()[0]
    comic_db_c.execute("SELECT * FROM images WHERE id=?", (pid,))
    page = comic_db_c.fetchone()
    if not page:
        abort(404, lang["no_page"])

    comic_db_c.execute("SELECT value FROM stats WHERE name='total_pages'")
    total = comic_db_c.fetchone()[0]

    comic_db.execute("UPDATE stats SET value=? WHERE name='curr_page'", (pid,))
    comic_db.commit()
    comic_db.close()

    return {"lang": lang, "comic": comic, "page": page, "total": total}


@app.route("/update")
def update(alone=False):
    main_db.execute("DROP TABLE IF EXISTS comics")
    main_db.execute("CREATE TABLE comics (id INTEGER PRIMARY KEY, folder TEXT, title TEXT)")
    for entry in os.listdir("comics"):
        if not os.path.isdir(os.path.join("comics", entry)):
            continue
        main_db.execute("INSERT INTO comics VALUES (NULL, ?, ?)", (entry, entry))
        if os.path.exists(os.path.join("comics", entry, "db.sqlite3")):
            continue
        comic_db = sqlite3.connect(os.path.join("comics", entry, "db.sqlite3"))
        comic_db.execute("CREATE TABLE images (id INTEGER PRIMARY KEY, filename TEXT)")
        comic_db.execute("CREATE TABLE notes (id INTEGER PRIMARY KEY, image_id INTEGER, x REAL, "
                         "y REAL, width REAL, height REAL, text TEXT)")
        comic_db.execute("CREATE TABLE stats (name TEXT, value INTEGER)")
        i = 0
        for file in os.listdir(os.path.join("comics", entry)):
            if file.endswith((".jpg", ".png", ".gif")):
                comic_db.execute("INSERT INTO images VALUES (NULL, ?)", (file,))
                i += 1
        comic_db.executemany("INSERT INTO stats VALUES (?, ?)", [("curr_page", 1), ("total_pages", i)])
        comic_db.commit()
        comic_db.close()
    main_db.commit()
    if not alone:
        redirect("/")


@app.post("/ajax/rename")
def rename():
    cid = int(request.params.cid)
    title = str(request.params.title)
    if cid and title:
        main_db.execute("UPDATE comics SET title=? WHERE id=?", (title, cid,))
        return dumps({"status": "success"})
    return dumps({"status": "error"})


@app.post("/ajax/add_note")
def add_note():
    out = dict()

    cid = int(request.params.cid)

    main_db_c.execute("SELECT * FROM comics WHERE id=?", (cid,))
    comic = main_db_c.fetchone()
    if not comic:
        out["error"] = "not_found"
        return dumps(out)
    out["error"] = None
    comic_db = sqlite3.connect(os.path.join("comics", comic[1], "db.sqlite3"))
    comic_db_c = comic_db.cursor()
    comic_db_c.execute("INSERT INTO notes VALUES (NULL, -1, 0, 0, 0, 0, '')")
    comic_db.commit()
    out["id"] = comic_db_c.lastrowid
    return dumps(out)

@app.route("/ajax/get_notes/<cid:int>/<pid:int>")
def get_notes(cid, pid):
    out = dict()
    main_db_c.execute("SELECT * FROM comics WHERE id=?", (cid,))
    comic = main_db_c.fetchone()
    if not comic:
        out["error"] = "not_found"
        return dumps(out)
    out["error"] = None
    out["notes"] = list()
    comic_db = sqlite3.connect(os.path.join("comics", comic[1], "db.sqlite3"))
    comic_db_c = comic_db.cursor()
    comic_db_c.execute("SELECT * FROM notes WHERE image_id=?", (pid,))
    for note in comic_db_c.fetchall():
        if note[1] == -1:
            continue
        out["notes"].append(dict(
            id=note[0],
            x=note[2]*100,
            y=note[3]*100,
            width=note[4]*100,
            height=note[5]*100,
            text=note[6]
        ))
    return dumps(out)


@app.post("/ajax/edit_notes")
def edit_notes():
    cid = int(request.params.cid)
    pid = int(request.params.pid)
    nid = int(request.params.nid)
    x = float(request.params.x)
    y = float(request.params.y)
    width = float(request.params.width)
    height = float(request.params.height)
    text = str(request.params.text)
    out = dict()

    if not cid or not nid or not x or not y or not width or not height or not text:
        out["error"] = "wrong_data"
        return dumps(out)

    main_db_c.execute("SELECT * FROM comics WHERE id=?", (cid,))
    comic = main_db_c.fetchone()
    if not comic:
        out["error"] = "not_found"
        return dumps(out)
    out["error"] = None
    comic_db = sqlite3.connect(os.path.join("comics", comic[1], "db.sqlite3"))
    comic_db.execute("UPDATE notes SET image_id=?, x=?, y=?, width=?, height=?, text=? WHERE id=?",
                     (pid, x/100, y/100, width/100, height/100, text, nid,))
    comic_db.commit()
    out["status"] = "success"
    return dumps(out)


@app.post("/ajax/delete_note")
def delete_note():
    cid = int(request.params.cid)
    nid = int(request.params.nid)
    out = dict()

    if not cid or not nid:
        out["error"] = "wrong_data"
        return dumps(out)

    main_db_c.execute("SELECT * FROM comics WHERE id=?", (cid,))
    comic = main_db_c.fetchone()
    if not comic:
        out["error"] = "not_found"
        return dumps(out)
    out["error"] = None
    comic_db = sqlite3.connect(os.path.join("comics", comic[1], "db.sqlite3"))
    comic_db.execute("DELETE FROM notes WHERE id=?", (nid,))
    comic_db.commit()
    out["status"] = "success"
    return dumps(out)



@app.route('/css/<filepath:path>')
@app.route('/img/<filepath:path>')
@app.route('/js/<filepath:path>')
def static_assets(filepath):
    return static_file(filepath, "assets")


@app.route('/comics/<filepath:path>')
def static_comics(filepath):
    return static_file(filepath, "comics")

update(True)
webbrowser.open("http://localhost:5000/", 1)
app.run(host='localhost', port=5000, debug=True)
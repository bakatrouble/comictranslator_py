var App = {};
App.tmp = null;

function limit(val, min, max){
    return val > min ? val < max ? val : max : min;
}

function pageInit(cid, pid){
    App.cid = cid;
    App.pid = pid;
    App.isDragging = false;
    App.imageSize = [$("#page-pic").width(), $("#page-pic").height()];
    App.noteContainer = $("#note-container");
    App.noteBoxPrototype = $("#note-box-prototype").children().first();
    App.newNoteArea = $("#new-note-area");
    App.notes = [];
    $.ajax("/ajax/get_notes/"+App.cid+"/"+App.pid).done(function(data){
        var obj = JSON.parse(data);
        if(!obj.error){
            for(i=0; i<obj.notes.length; i++){
                App.notes.push(new Note(obj.notes[i].id, obj.notes[i].x, obj.notes[i].y, obj.notes[i].width, obj.notes[i].height, obj.notes[i].text, false));
            }
        }
    });
    App.noteContainer.on("mousedown", newNoteListeners.onMouseDownContainer);
}

var newNoteListeners = {
    initData: null,
    onMouseDownContainer: function(e){
        e.preventDefault();
        if(e.target.id != "note-container")
            return;
        App.isDragging = true;
        App.newNoteArea.css({
            left: e.pageX - App.noteContainer.offset().left+"px",
            top: e.pageY - App.noteContainer.offset().top+"px",
            width: 0,
            height: 0
        });
        App.newNoteArea.removeClass("hidden");
        newNoteListeners.initData = {
            x: e.pageX - App.noteContainer.offset().left,
            y: e.pageY - App.noteContainer.offset().top,
            pageX: e.pageX,
            pageY: e.pageY
        };
        App.noteContainer.off("mousedown", newNoteListeners.onMouseDownContainer);
        $(document.body).on("mousemove", newNoteListeners.onMouseMoveContainer);
        $(document.body).on("mouseup", newNoteListeners.onMouseUpContainer);
    },
    onMouseMoveContainer: function(e){
        e.preventDefault();
        App.newNoteArea.css({
            width: limit(e.pageX - newNoteListeners.initData.pageX, 0, App.imageSize[0] - newNoteListeners.initData.x)+"px",
            height: limit(e.pageY - newNoteListeners.initData.pageY, 0, App.imageSize[1] - newNoteListeners.initData.y)+"px"
        });
    },
    onMouseUpContainer: function(e){
        e.preventDefault();
        App.newNoteArea.addClass("hidden");
        var width = limit(e.pageX - newNoteListeners.initData.pageX, 0, App.imageSize[0] - newNoteListeners.initData.x);
        var height = limit(e.pageY - newNoteListeners.initData.pageY, 0, App.imageSize[1] - newNoteListeners.initData.y);
        if(width > 20 && height > 20)
            App.notes.push(new Note(
                -1,
                newNoteListeners.initData.x / App.imageSize[0] * 100,
                newNoteListeners.initData.y / App.imageSize[1] * 100,
                width / App.imageSize[0] * 100,
                height / App.imageSize[1] * 100,
                "&lt;Note text goes here&gt;",
                true
            ));
        $(document.body).off("mousemove", newNoteListeners.onMouseMoveContainer);
        $(document.body).off("mouseup", newNoteListeners.onMouseUpContainer);
        App.noteContainer.on("mousedown", newNoteListeners.onMouseDownContainer);
        App.isDragging = false;
    }
};

$(document).ready(
    function(){
        $(".btn-rename").each(
            function(i, el){
                $(el).click(
                    function(){
                        App.current = $(this).attr("data-id");
                        bootbox.prompt(
                            {
                                title: "Name",
                                value: $(this).attr("data-title"),
                                callback: function(result){
                                    if(result){
                                        $.post(
                                            "/ajax/rename",
                                            {
                                                cid: App.current,
                                                title: result
                                            },
                                            function(){
                                                location.reload();
                                            }
                                        );
                                    }
                                }
                            }
                        );
                    }
                );
            }
        );
    }
);

function Note(id, x, y, width, height, text, create){
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;

    this.new = create;

    this.setProps = function(x, y, width, height, suffix){
        this.noteBox.css({"left": x+suffix, "top": y+suffix, "width": width+suffix, "height": height+suffix});
        this.noteText.html(this.text);
    };

    this.sendProps = function(){
        $.post("/ajax/edit_notes", {
            cid: App.cid,
            pid: App.pid,
            nid: this.id,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            text: this.text
        })
    };

    this.editing = {
        x: 0, y: 0, width: 0, height: 0, startX: 0, startY: 0
    };

    this.noteBox = App.noteBoxPrototype.clone().appendTo(App.noteContainer);
    this.noteResize = this.noteBox.find(".note-resize");
    this.noteText = this.noteBox.find(".note-text");

    this.setProps(this.x, this.y, this.width, this.height, "%");
    this.noteText.html(text);

    this.listeners = {
        onMouseDownBox: function(e){
            e.preventDefault();
            if(App.isDragging)
                return;
            if(e.button == 0){
                App.isDragging = true;
                e.data.noteBox.addClass("active");
                e.data.noteBox.off("mousedown", e.data.listeners.onMouseDownBox);
                e.data.editing.startX = e.pageX;
                e.data.editing.startY = e.pageY;
                e.data.editing.x = e.data.x / 100 * App.imageSize[0];
                e.data.editing.y = e.data.y / 100 * App.imageSize[1];
                e.data.editing.width = e.data.width / 100 * App.imageSize[0];
                e.data.editing.height = e.data.height / 100 * App.imageSize[1];
                e.data.setProps(e.data.editing.x, e.data.editing.y, e.data.editing.width, e.data.editing.height, "px");
                $(document.body).on("mousemove", e.data, e.data.listeners.onMouseMoveBox);
                $(document.body).on("mouseup", e.data, e.data.listeners.onMouseUpBox);
            }
        },
        onMouseMoveBox: function(e){
            e.preventDefault();
            e.data.setProps(
                limit(e.data.editing.x + (e.pageX - e.data.editing.startX), 0, App.imageSize[0]-e.data.editing.width),
                limit(e.data.editing.y + (e.pageY - e.data.editing.startY), 0, App.imageSize[1]-e.data.editing.height),
                e.data.editing.width,
                e.data.editing.height,
                "px");
        },
        onMouseUpBox: function(e){
            e.preventDefault();
            e.data.x = limit(e.data.x + (e.pageX - e.data.editing.startX) / App.imageSize[0] * 100, 0, 100-e.data.width);
            e.data.y = limit(e.data.y + (e.pageY - e.data.editing.startY) / App.imageSize[1] * 100, 0, 100-e.data.height);
            e.data.setProps(e.data.x, e.data.y, e.data.width, e.data.height, "%");
            e.data.sendProps();
            $(document.body).off("mousemove", e.data.listeners.onMouseMoveBox);
            $(document.body).off("mouseup", e.data.listeners.onMouseUpBox);
            e.data.noteBox.on("mousedown", e.data, e.data.listeners.onMouseDownBox);
            e.data.noteBox.removeClass("active");
            App.isDragging = false;
        },
        onMouseDownResize: function(e){
            e.preventDefault();
            if(App.isDragging)
                return;
            if(e.button == 0){
                App.isDragging = true;
                e.data.noteBox.addClass("active");
                e.data.noteBox.off("mousedown", e.data.listeners.onMouseDownResize);
                e.data.editing.startX = e.pageX;
                e.data.editing.startY = e.pageY;
                e.data.editing.x = e.data.x / 100 * App.imageSize[0];
                e.data.editing.y = e.data.y / 100 * App.imageSize[1];
                e.data.editing.width = e.data.width / 100 * App.imageSize[0];
                e.data.editing.height = e.data.height / 100 * App.imageSize[1];
                e.data.setProps(e.data.editing.x, e.data.editing.y, e.data.editing.width, e.data.editing.height, "px");
                $(document.body).on("mousemove", e.data, e.data.listeners.onMouseMoveResize);
                $(document.body).on("mouseup", e.data, e.data.listeners.onMouseUpResize);
            }
        },
        onMouseMoveResize: function(e){
            e.preventDefault();
            e.data.setProps(
                e.data.editing.x,
                e.data.editing.y,
                limit(e.data.editing.width + (e.pageX - e.data.editing.startX), 20, App.imageSize[0]-e.data.editing.x),
                limit(e.data.editing.height + (e.pageY - e.data.editing.startY), 20, App.imageSize[1]-e.data.editing.y),
                "px");
        },
        onMouseUpResize: function(e){
            e.preventDefault();
            e.data.width = limit(e.data.width + (e.pageX - e.data.editing.startX) / App.imageSize[0] * 100, 20 / App.imageSize[0], 100-e.data.x);
            e.data.height = limit(e.data.height + (e.pageY - e.data.editing.startY) / App.imageSize[1] * 100, 20 / App.imageSize[1], 100-e.data.y);
            e.data.setProps(e.data.x, e.data.y, e.data.width, e.data.height, "%");
            e.data.sendProps();
            $(document.body).off("mousemove", e.data.listeners.onMouseMoveResize);
            $(document.body).off("mouseup", e.data.listeners.onMouseUpResize);
            e.data.noteResize.on("mousedown", e.data, e.data.listeners.onMouseDownResize);
            e.data.noteBox.removeClass("active");
            App.isDragging = false;
        },
        onDblClickBox: function(e){
            e.preventDefault();
            App.current = e.data;
            bootbox.dialog({
                title: "New note text:",
                message: "<div class=\"summernote\">"+ e.data.text+"</div>",
                buttons: {
                    delete: {
                        label: "Delete",
                        className: "btn-danger",
                        callback: function(){
                            bootbox.confirm("Are you sure?", function(res){
                                if(res){
                                    $.post("/ajax/delete_note", {
                                        cid: App.cid,
                                        nid: App.current.id
                                    });
                                    App.current.noteBox.remove();
                                }
                            });
                            $(".summernote").destroy();
                        }
                    },
                    cancel: {
                        label: "Cancel",
                        className: "btn-default",
                        callback: function(){
                            $(".summernote").destroy();
                        }
                    },
                    ok: {
                        label: "OK",
                        className: "btn-primary",
                        callback: function(){
                            App.current.text = App.textField.html();
                            App.current.setProps();
                            if(App.current.new){
                                $.post("/ajax/add_note", {
                                    cid: App.cid
                                }, function(data){
                                    obj = JSON.parse(data);
                                    App.current.id = obj.id;
                                    App.current.new = false;
                                    App.current.sendProps();
                                });
                            }else{
                                App.current.sendProps();
                            }
                            $(".summernote").destroy();
                        }
                    }
                }
            });
            App.textField = $(".summernote").summernote({
                airMode: true,
                airPopover: [
                    ['style', ['bold', 'italic', 'underline', 'strikethrough']]
                ],
                focus: true
            });
        }
    };

    this.noteResize.on("mousedown", this, this.listeners.onMouseDownResize);
    this.noteBox.on("mousedown", this, this.listeners.onMouseDownBox);
    this.noteBox.on("dblclick", this, this.listeners.onDblClickBox);
}
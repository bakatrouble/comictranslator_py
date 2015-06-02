(function(){
    window.ajaxQueue = {};
    window.ajaxQueue.Query = function(method, url, data, callbackBefore, callbackAfter){
        this.method = method;
        this.url = url;
        this.data = data;
        this.callbackBefore = callbackBefore;
        this.callbackAfter = callbackAfter;
    };
    window.ajaxQueue.queue = [];
    window.ajaxQueue.xhr = new XMLHttpRequest();
    window.ajaxQueue.addQuery = function(method, url, data, callbackBefore, callbackAfter){
        if(method != "GET" && method != "POST")
            return;
        this.queue.push(new this.Query(method, url, data.join("&"), callbackBefore, callbackAfter));
        if(this.queue.length === 1)
            this.execQuery();
    };
    window.ajaxQueue.execQuery = function(){
        if(this.queue.length === 0)
            return;
        if(this.queue[0].callbackBefore)
            this.queue[0].callbackBefore();
        this.xhr.open(this.queue[0].method, this.queue[0].url, true);
        if(this.queue[0].method == "POST")
            this.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        this.xhr.onreadystatechange = function(){
            if(window.ajaxQueue.xhr.readyState == 4){
                if(window.ajaxQueue.queue[0].callbackAfter)
                    window.ajaxQueue.queue[0].callbackAfter(window.ajaxQueue.xhr);
                window.ajaxQueue.queue.shift();
                window.ajaxQueue.execQuery();
            }
        };
        this.xhr.send(window.ajaxQueue.queue[0].data);
    };
})();
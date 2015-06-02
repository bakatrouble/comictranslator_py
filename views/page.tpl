% rebase("base.tpl", title=comic[2]+" - "+str(page[0])+"/"+str(total))
<nav class="navbar navbar-default navbar-fixed-top">
    <ul class="nav navbar-nav navbar-left">
        <li class="primary"><a href="/"><span class="fa fa-arrow-left fa-lg"></span> {{lang['to_list']}}</a></li>
    </ul>
    <div class="container text-center">
        <a href="/{{comic[0]}}/1" class="btn btn-default navbar-btn" title="{{lang['first_page']}}">
            <span class="fa fa-angle-double-left fa-lg"></span>
        </a>
        <a href="/{{comic[0]}}/{{page[0]-1 if page[0]-1 >= 1 else 1}}" class="btn btn-default navbar-btn" title="{{lang['prev_page']}}">
            <span class="fa fa-angle-left fa-lg"></span>
        </a>
        <span class="navbar-text-custom">{{page[0]}}/{{total}}</span>
        <a href="/{{comic[0]}}/{{page[0]+1 if page[0]+1 <= total else total}}" class="btn btn-default navbar-btn align-right" title="{{lang['next_page']}}">
            <span class="fa fa-angle-right fa-lg"></span>
        </a>
        <a href="/{{comic[0]}}/{{total}}" class="btn btn-default navbar-btn" title="{{lang['last_page']}}">
            <span class="fa fa-angle-double-right fa-lg"></span>
        </a>
    </div>
</nav>
<div class="container page-body">
    <div class="panel panel-default">
        <div class="panel-body text-center">
            <div id="note-container" style="background-image: url('/comics/{{comic[1]}}/{{page[1]}}');">
                <img id="page-pic" src="/comics/{{comic[1]}}/{{page[1]}}"/>
                <div id="new-note-area" class="hidden"></div>
            </div>
        </div>
    </div>
</div>
<div class="hidden">
    <div id="note-box-prototype">
        <div class="note-box">
            <div class="note-resize"></div>
            <div class="note-text"></div>
        </div>
    </div>
</div>
<script>
    pageInit({{comic[0]}}, {{page[0]}});
</script>
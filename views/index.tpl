% rebase("base.tpl", title=lang["index_title"])
<h1>{{lang["index_title"]}}</h1>
<table class="table table-striped table-hover">
    <thead>
        <tr>
            <th>{{lang["index_h_title"]}}</th>
            <th class="text-right col-xs-2">{{lang["index_h_actions"]}}</th>
        </tr>
    </thead>
    <tbody>
    % for row in comics_list:
        <tr>
          <td class="vert-align"><a href="/{{row[0]}}">{{row[2]}}</a></td>
          <td class="text-right">
              <button type="button" data-id="{{row[0]}}" data-title="{{row[2]}}" class="btn btn-default btn-xs btn-rename">
                  <span class="fa fa-pencil"></span> {{lang["index_rename"]}}
              </button>
          </td>
        </tr>
    % end
    </tbody>
    <tfoot>
        <tr>
            <td colspan="2" class="align-right">
                <a class="btn btn-default btn-xs btn-refresh" href="/update">
                    <span class="fa fa-refresh"></span> {{lang["index_refresh"]}}
                </a>
            </td>
        </tr>
    </tfoot>
</table>
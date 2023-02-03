$.getJSON("https://spreadsheets.google.com/feeds/list/1fMXuc1NynI3IncXzPLefj2OETDnF0NGAVKqIojP-GlY/od6/public/values?alt=json", function(data) {
  var table = $("#sheetData");
  var rows = data.feed.entry;
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var cells = row.content.$t.split(", ");
    var tr = $("<tr></tr>");
    for (var j = 0; j < cells.length; j++) {
      var td = $("<td>" + cells[j].split(":")[1] + "</td>");
      tr.append(td);
    }
    table.append(tr);
  }
});

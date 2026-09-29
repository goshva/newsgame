/* Integration panel for demo pages: shows widget events. The widget does not depend on this file. */
(function () {
  var log = document.getElementById("ng-log");
  if (!log) return;
  document.addEventListener("newsgame:event", function (e) {
    var d = e.detail;
    var empty = log.querySelector(".empty");
    if (empty) empty.remove();
    var li = document.createElement("li");
    var ty = document.createElement("span");
    ty.className = "ty";
    ty.textContent = d.type;
    li.appendChild(document.createTextNode(d.time.slice(11, 19) + "  "));
    li.appendChild(ty);
    var rest = { gameId: d.gameId, sessionId: d.sessionId, payload: d.payload };
    li.appendChild(document.createTextNode("  " + JSON.stringify(rest, function (k, v) { return v === undefined ? undefined : v; })));
    log.insertBefore(li, log.firstChild);
  });
})();

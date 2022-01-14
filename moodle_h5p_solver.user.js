// ==UserScript==
// @name         Moodle H5P Solver
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Moodle H5P Solver solves the H5P interactions and obtains the full score without knowing the correct answers.
// @author       khanxbahria
// @match        https://*/grade/report/user/index.php?*
// @icon         https://moodle.org/pluginfile.php/50/local_plugins/plugin_logo/1678/h5p-logo-box.png?preview=thumb
// @grant        none
// ==/UserScript==

(function() {
	'use strict';

	var table = document.querySelector("#region-main > div > table")
	var grade_col;
	for (var j = 0, col; col = table.rows[0].cells[j]; j++) {
		if (col.id == 'grade') {
			grade_col = j;
			break
		}
	}

	var vids = [];
	for (var i = 2, row; row = table.rows[i]; i++) {
		if (row.cells.length == 0) continue;
		if (row.cells[grade_col].getInnerHTML() != "-") continue;
		if (row.cells[0].childNodes.length == 0 || row.cells[0].childNodes[0].href == undefined) continue;

		var url_string = row.cells[0].childNodes[0].href
		//console.log(url_string);
		var url = new URL(url_string);
		if (url.pathname != "/mod/hvp/grade.php") continue;
		var vid = url.searchParams.get('id');
		vids.push(vid)

	}


	console.log(vids)
	if (vids.length > 0 && confirm(vids.length + " unwatched videos.\n Click OK to resolve.")) {
		var start_time = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

		function getStringBetween(str, start, end) {
			const result = str.match(new RegExp(start + "(.*?)" + end));

			return result[1];
		}
		for (let i = 0, vid; vid = vids[i]; i++) {
			let xhr = new XMLHttpRequest();
			xhr.open("GET", "/mod/hvp/view.php?id=" + vid, true);
			xhr.onload = function(e) {
				if (xhr.readyState === 4) {
					if (xhr.status === 200) {
						let data = xhr.responseText
						let cid = getStringBetween(data, "cid-", '"')

						i = data.indexOf("token=")
						let token = getStringBetween(data, "token=", "&")

						let finalxhr = new XMLHttpRequest();


						finalxhr.open("POST", "/mod/hvp/ajax.php?contextId=" + vid + "&token=" + token + "&action=set_finished", true);
						finalxhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
						finalxhr.onreadystatechange = function() {
							if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
								if (vid == vids[vids.length - 1]) {
									alert("All done!")
									window.location.reload();

								}
							}
						}
						finalxhr.send("contentId=" + cid + "&score=1&maxScore=1&opened=" + String(start_time) + "&finished=" + String(start_time + 10 * 60));
					} else {
						console.error(xhr.statusText);
					}
				}
			};
			xhr.send(null)


			start_time += 10 * 60
		}



	}
})();

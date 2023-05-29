// ==UserScript==
// @name         Moodle H5P Solver
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Moodle H5P Solver solves the H5P interactions and obtains the full score without knowing the correct answers.
// @author       khanxbahria
// @match        https://*/grade/report/user/index.php?*
// @icon         https://moodle.org/pluginfile.php/50/local_plugins/plugin_logo/1678/h5p-logo-box.png?preview=thumb
// @grant        none
// ==/UserScript==

"use strict";

const extractVideoID = tr => {
    const aTag = tr.querySelector('th.item > a, th.column-itemname > a');
    const tdTag = tr.querySelector('td.column-grade');
    if (!aTag || !aTag.href.includes('hvp') || tdTag.innerText !== "-")
        return;
    const url = new URL(aTag.href);
    return url.searchParams.get('id')
};

const processTable = () => {
    const table = document.querySelector('#region-main > div > table');
    const tbody = table.tBodies[0];
    const rows = tbody.querySelectorAll('tr');
    const videoIDs = Array.from(rows)
        .map(extractVideoID)
        .filter(Boolean);
    return videoIDs;

};

const getStringBetween = (str, start, end) => {
    const betweenExp = new RegExp(`${start}(.*?)${end}`);
    return str.match(betweenExp)[1];
};

const fetchVideoData = async videoID => {
    const path = `/mod/hvp/view.php?id=${videoID}`
    const resp = await fetch(path);
    const content = await resp.text();
    const cid = getStringBetween(content, 'cid-', '"');
    const token = getStringBetween(content, 'token=', '&');
    return {
        contextId: videoID,
        contentId: cid,
        token: token
    }
};

const updateScore = async (videoData) => {
    const score = 1;
    const maxScore = 1;
    const finished = Math.floor(Date.now() / 1000);
    //opened 10 minutes earlier than now
    const opened = finished - 10 * 60;

    const body = `contentId=${videoData.contentId}
&score=${score}&maxScore=${maxScore}
&opened=${opened}&finished=${finished}`;

    const path = `/mod/hvp/ajax.php?contextId=
${videoData.contextId}&token=${videoData.token}
&action=set_finished`;

    const resp = await fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
    });
    return await resp.text();
}

const solveOne = async (videoID) => {
    const videoData = await fetchVideoData(videoID);
    return await updateScore(videoData);
}

const main = async () => {
    const videoIDs = processTable();
    console.log(videoIDs);
    const prompt = `${videoIDs.length} unwatched videos.\nClick OK to resolve.`
    if (videoIDs.length > 0 && confirm(prompt)) {
        const promises = videoIDs.map(solveOne);
        const results = await Promise.allSettled(promises);
        console.log(results);
        alert("All done!");
        window.location.reload();
    }
}



main();

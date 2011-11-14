var treeNames = [
    "offensive",
    "defensive",
    "support",
];
var treeOffsets = [
    0,
    data[0].length,
    data[0].length + data[1].length
];
var MAX_POINTS = 30;
var state = [{}, {}, {}];
var treePoints = [0, 0, 0];
var totalPoints = 0;
var buttonClasses = ["unavailable", "available", "full"];
var rankClasses = ["num-available", "num-full"];

function drawCalculator() {
    for (i=0; i<3; i++) {
        for (j=0; j<data[i].length; j++) {
            drawButton(i, j);
        }
        var pos = masteryButtonPosition(i, 0);
        $("#calculator")
            .contextmenu(function(event){ event.preventDefault() })
            .append(
                $("<div>")
                    .addClass("tree-label")
                    .attr("data-idx",  i)
                    .css({
                        left: pos.x + "px",
                        bottom: "5px",
                    })
                    .append(
                        $("<span>")
                            .text(treeNames[i].toUpperCase() + ": ")
                    )
                    .append(
                        $("<span>")
                            .addClass("count")
                            .text("0")
                    )
            );
    }

    $("#points>.count").text(MAX_POINTS);
}

function drawButton(tree, index) {
    var spritePos = masterySpritePos(tree, index)-2;
    var buttonPos = masteryButtonPosition(tree, index);
    var status = data[tree][index].index < 5 ? "available" : "unavailable";
    var rank = 0;
    $("#calculator").append(
        $("<div>")
            .addClass("button")
            .addClass(status)
            .css({
                left: buttonPos.x+"px",
                top: buttonPos.y+"px",
                backgroundPosition: "-2px "+spritePos+"px",
            })
            .append(
                $("<div>")
                    .addClass("tooltip")
                    .append(
                        $("<strong>")
                            .addClass(treeNames[tree])
                    )
                    .append(
                        $("<div>")
                            .addClass("rank")
                    )
                    .append(
                        $("<div>")
                            .addClass("req")
                    )
                    .append(
                        $("<p>")
                            .addClass("tooltip-text")
                            .addClass("first")
                    )
                    .append(
                        $("<p>")
                            .addClass("tooltip-text")
                            .addClass("second")
                            .append(
                                $("<div>")
                                    .addClass("nextRank")
                                    .text("Next rank:")
                            )
                            .append(
                                $("<div>")
                                    .addClass("content")
                            )
                    )
            )
            .append(
                $("<div>")
                    .addClass("counter")
                    .addClass("num-"+status)
                    .text("0/" + data[tree][index].ranks)
            )
            .mouseover(function(event){
                var tooltipText = masteryTooltip(tree, index, rank);
                var tooltip = $(this).find(".tooltip");
                formatTooltip(tooltip, tooltipText);
                tooltip.show().css({
                    left: event.pageX - parseInt($(this).css("left")) + 5,
                    top: event.pageY - parseInt($(this).css("top")) + 5,
                });
                $(this).data("hover", true);
            })
            .mousemove(function(event){
                $(this).find(".tooltip").css({
                    left: event.pageX - parseInt($(this).css("left")) + 5,
                    top: event.pageY - parseInt($(this).css("top")) + 5,
                });
            })
            .mouseout(function(){
                $(this).find(".tooltip").hide();
                $(this).data("hover", false);
            })
            .mousedown(function(event){
                switch (event.which) {
                    case 1:
                        // Left click
                        if (isValidState(tree, index, rank, +1)) {
                            setState(tree, index, rank++, +1);
                        }
                        break;
                    case 3:
                        // Right click
                        if (isValidState(tree, index, rank, -1)) {
                            setState(tree, index, rank--, -1);
                        }
                        break;
                }
            })
            .data("update", function() {
                if (rank == data[tree][index].ranks) {
                    status = "full";
                } else {
                    //check if available
                    if (masteryPointReq(tree, index) <= treePoints[tree] && masteryParentReq(tree, index))
                        status = "available";
                    else
                        status = "unavailable";
                }
                // change status class
                $(this).removeClass(buttonClasses.join(" "));
                $(this).addClass(status);
                // adjust counter
                $(this).find(".counter")
                    .removeClass(rankClasses.join(" "))
                    .addClass("num-"+status)
                    .text(rank + "/" + data[tree][index].ranks);
                // force tooltip redraw
                if ($(this).data("hover")) {
                    $(this).mouseover();
                }
            })
    );
}

function formatTooltip(tooltip, tooltipText) {
    tooltip.find("strong").text(tooltipText.header);
    tooltip.find(".rank").each(function(){
        $(this)
            .removeClass(rankClasses.join(" "))
            .addClass(tooltipText.rankClass)
            .text(tooltipText.rank);
    });
    tooltip.find(".req").each(function(){
        if (tooltipText.req == null)
            $(this).hide();
    });
    tooltip.find("p.first").html(tooltipText.body);
    tooltip.find("p.second").each(function(){
        if (tooltipText.bodyNext == null) {
            $(this).hide();
        } else {
            $(this)
                .show()
                .find(".content")
                    .html(tooltipText.bodyNext);
        }
    });
}

function masteryTooltip(tree, index, rank) {
    var mastery = data[tree][index];
    // second flags whether there are two tooltips (one for next rank)
    var showNext = !(rank < 1 || rank >= mastery.ranks);

    // parse text
    var text = {
        header: mastery.name,
        rank: "Rank: " + rank + "/" + mastery.ranks,
        rankClass: (rank < mastery.ranks ? rankClasses[0] : rankClasses[1]),
        req: null,
        body: masteryTooltipBody(mastery, rank),
        bodyNext: showNext ? masteryTooltipBody(mastery, rank+1) : null,
    };

    return text;
}

function masteryTooltipBody(mastery, rank)  {
    // Rank 1 is index 0, but Rank 0 is also index 0
    rank = Math.max(0, rank - 1);
    var desc = mastery.desc;
    desc = desc.replace(/#/, mastery.rankInfo[rank]);
    desc = desc.replace(/\n/g, "<br>");
    desc = desc.replace(/\|(.+?)\|/g, "<span class='highlight'>$1</span>");
    if (mastery.perlevel) {
        desc = desc.replace(/#/, Math.round(mastery.rankInfo[rank]*180)/10);
    }
    if (mastery.rankInfo2) {
        desc = desc.replace(/#/, mastery.rankInfo2[rank]);
    }
    return desc;
}

function masteryButtonPosition(tree, index) {
    var idx = data[tree][index].index - 1;
    var ix = idx % 4;
    var iy = Math.floor(idx / 4);
    var x=0, y=0;

    // padding for tree
    x += 305 * tree;
    // base padding
    x += 18;
    y += 10;
    // padding for spacing
    x += ix * (59 + 12);
    y += iy * (59 + 23.5);

    return {x: x, y: y};
}

function masterySpritePos(tree, index) {
    return 0 - 58 * (treeOffsets[tree] + index);
}

function masteryPointReq(tree, index) {
    return Math.floor((data[tree][index].index-1) / 4) * 4;
}

function masteryParentReq(tree, index) {
    var parent = data[tree][index].parent;
    if (parent && (state[tree][parent] || 0) < data[tree][parent].ranks)
        return false;
    return true;
}


function isValidState(tree, index, rank, mod) {
    var mastery = data[tree][index];
    rank = rank + mod;
    if (rank < 0 || rank > mastery.ranks)
        return false;

    // Check max points
    if (totalPoints + mod > MAX_POINTS)
        return false;

    // Check this mastery's rank requirements: use current treePoint value
    // because we don't want to let you take rank 2 at 7 points (8 <= 7+1)
    if (masteryPointReq(tree, index) > treePoints[tree])
        return false;

    // Check this mastery's parent requirements
    if (!masteryParentReq(tree, index))
        return false;

    // Check tree rank requirements
    for (var i in state[tree])
        if (i != index)
            // Figure out tier, multiply by 4 to get req points
            if (state[tree][i] > 0 && masteryPointReq(tree, i) >= treePoints[tree] + mod)
                return false;

    // Check child requirements
    for (var i in state[tree])
        if (i != index)
            if (state[tree][i] > 0 && data[tree][i].parent == index)
                return false;

    return true;
}

function setState(tree, index, rank, mod) {
    state[tree][index] = rank + mod;
    treePoints[tree] += mod;
    totalPoints += mod;
    $("#calculator .button").each(function(){
        $(this).data("update").apply(this);
    });
    $("div[data-idx="+tree+"]>.count").text(treePoints[tree]);
    $("#points>.count").text(MAX_POINTS - totalPoints);
}

function exportMasteries() {
}

drawCalculator();

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
                formatTooltip($(this).find(".tooltip").show(), tooltipText);
                $(this).data("hover", true);
                $(this).mousemove();
            })
            .mousemove(function(event){
                var tip = $(this).find(".tooltip");
                // check if right facing
                var offsetX=10, offsetY=10;
                if (event.pageX + tip.width() > $(document).width() - 30)
                    offsetX = -tip.width() - 10;
                var outer = $("#calculator").position();
                var button = $(this).position();
                tip.css({
                    left: event.pageX - outer.left - button.left + offsetX,
                    top: event.pageY - outer.top - button.top + offsetY,
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
            .data("update", function(newRank) {
                if (newRank != undefined)
                    rank = newRank;
                if (rank == data[tree][index].ranks) {
                    status = "full";
                } else {
                    // check if available
                    if (masteryPointReq(tree, index) <= treePoints[tree] && masteryParentReq(tree, index))
                        status = "available";
                    else
                        status = "unavailable";

                    // check if points spent
                    if (totalPoints >= MAX_POINTS)
                        if (rank > 0)
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
    if (rank+mod < 0 || rank+mod > mastery.ranks)
        return false;

    // Incrementing
    if (mod > 0) {
        // Check max points
        if (totalPoints + mod > MAX_POINTS)
            return false;

        // Check this mastery's rank requirements: never account for current rank
        if (masteryPointReq(tree, index) > treePoints[tree] - rank)
            return false;

        // Check this mastery's parent requirements
        if (!masteryParentReq(tree, index))
            return false;
    }

    // Decrementing
    if (mod < 0) {
        // Check tree rank requirements
        for (var i in state[tree])
            if (i != index)
                // Figure out tier, multiply by 4 to get req points
                if (state[tree][i] > 0 && 
                    masteryPointReq(tree, i) > treePoints[tree] + mod - (state[tree][i] || 0))
                    return false;

        // Check child requirements
        for (var i in state[tree])
            if (i != index)
                if (state[tree][i] > 0 && data[tree][i].parent == index)
                    return false;
    }

    return true;
}

function setState(tree, index, rank, mod) {
    state[tree][index] = rank + mod;
    treePoints[tree] += mod;
    totalPoints += mod;
    $("#calculator .button").each(function(){
        $(this).data("update").call(this);
    });
    updateLabels();
    updateLink();
}

function resetStates() {
    totalPoints = 0;
    for (var tree=0; tree<3; tree++) {
        treePoints[tree] = 0;
        for (var index in state[tree])
            state[tree][index] = 0;
    }
    $("#calculator .button").each(function(){
        $(this).data("update").call(this, 0);
    });
    updateLabels();
    updateLink();
}

function updateLabels() {
    for (var tree=0; tree<3; tree++) {
        $("div[data-idx="+tree+"]>.count").text(treePoints[tree]);
        $("#points>.count").text(MAX_POINTS - totalPoints);
    }
}

function updateLink() {
    $("#exportUrl").val(document.location.origin + document.location.pathname + "#" + exportMasteries());
}

// There are max 4 points per mastery, or 3 bits each. There is a 1 bit padding
// that is a flag to determine whether the following 5 bits are a sequence of
// mastery codes or an index increase. We greedily take masteries until the next
// one would put us over capacity, at which point we flush the buffer. You will
// always flush at the end of a tree.
var exportChars = "WvlgUCsA7pGZ3zSjakbP2x0mTB6htH8JuKMq1yrnwEQDLY5IVNXdcioe9fF4OR_-"; //ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
function exportMasteries() {
    var str = "";
    var bits = 0;
    var collected = 0; // number of bits collected in this substr
    var tree, jumpStart = -1; // jumpStart is the start of the index, which we can turn to a bool by comparing >-1
    var flush = function() {
        if (jumpStart > -1) {
            console.log("JUMP: " + bits);
        } else {
            console.log("FLUSH: " + collected + " -> " + ((jumpStart>-1) << 5 | bits));
        }
        str += exportChars[(jumpStart>-1) << 5 | bits];
        bits = 0;
        collected = 0;
        jumpStart = -1;
    }
    var bitlen = function(ranks) {
        return Math.floor(ranks/2)+1;
    }
    for (tree = 0; tree < 3; tree++) {
        for (var index = 0; index < data[tree].length; index++) {
            // check if we should flush
            if (collected + bitlen(data[tree][index].ranks) > 5)
                flush();

            // if we are collecting or the condition is right for collecting:
            // - if we are jumping and this is 0, SKIP. 
            if (jumpStart > -1 && !(state[tree][index] > 0))
                continue;
            // otherwise:
            // - either we were collecting already (and haven't flushed)
            // - or we can collect this index
            // - or the next index can be collected and bundled with this one
            //    (thus negating the need for a jump)
            if (collected > 0 || 
                state[tree][index] > 0 || 
                ((state[tree][index+1] > 0) && (index+1 < data[tree].length) && (bitlen(data[tree][index].ranks) + bitlen(data[tree][index+1].ranks) <= 5))) {
                // check if we are at the end of a jump
                if (jumpStart > -1) {
                    bits = index - jumpStart;
                    flush();
                }
                    
                // collect more
                var len = bitlen(data[tree][index].ranks);
                bits = (bits << len) | (state[tree][index] || 0);
                collected += len;
            } else if(jumpStart < 0) {
                // this is the start of a jump
                // check for flush
                if (collected > 0)
                    flush();
                jumpStart = index;
            }
        }
        // before switching trees, flush unless we just did
        if (jumpStart > -1) {
            bits = index - jumpStart;
            flush();
        } else if (collected > 0) {
            flush();
        }
    }

    return str;
}

function importMasteries(str) {

}

$(function(){
    // Calculator
    drawCalculator();

    // Panel
    $("#return").click(function() {
        if (totalPoints > 0) {
            //confirm?
            resetStates();
        }
    });
    $("#exportUrl").click(function() {
        $(this).focus().select();
    });
});

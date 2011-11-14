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

function drawCalculator() {
    for (i=0; i<3; i++) {
        for (j=0; j<data[i].length; j++) {
            drawButton(i, j);
        }
        var pos = masteryButtonPosition(i, 0);
        $("#calculator").append(
            $("<div>")
                .addClass("tree-label")
                .text(treeNames[i].toUpperCase() + ": 0")
                .css({
                    left: pos.x + "px",
                    bottom: "5px",
                })
        );
    }
}

function drawButton(tree, index) {
    var spritePos = masterySpritePos(tree, index)-2;
    var buttonPos = masteryButtonPosition(tree, index);
    var status = data[tree][index].index < 5 ? "available" : "unavailable";
    $("#calculator").append(
        $("<div>")
            .data("tree", tree)
            .data("index", index)
            .data("rank", 0)
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
                    )
            )
            .append(
                $("<div>")
                    .addClass("counter")
                    .addClass("num-"+status)
                    .text("0/" + data[tree][index].ranks)
            )
            .mouseover(function(event){
                var tooltipText = masteryTooltip(tree, index, 0);
                var tooltip = $(this).find(".tooltip");
                formatTooltip(tooltip, tooltipText);
                tooltip.show().css({
                    left: event.pageX - parseInt($(this).css("left")) + 5,
                    top: event.pageY - parseInt($(this).css("top")) + 5,
                });
            })
            .mousemove(function(event){
                $(this).find(".tooltip").css({
                    left: event.pageX - parseInt($(this).css("left")) + 5,
                    top: event.pageY - parseInt($(this).css("top")) + 5,
                });
            })
            .mouseout(function(){
                $(this).find(".tooltip").hide();
            })
            .contextmenu(function(event){ event.preventDefault() })
            .mousedown(function(event){
                var cur = $(this).data("rank");
                switch (event.which) {
                    case 1:
                        // Left click
                        if (isValidState(tree, index, cur+1))
                            setState(tree, index, cur+1);
                        break;
                    case 3:
                        // Right click
                        if (isValidState(tree, index, cur-1))
                            setState(tree, index, cur-1);
                        break;
                }
            })
    );
}

function formatTooltip(tooltip, tooltipText) {
    tooltip.find("strong").text(tooltipText.header);
    tooltip.find(".rank").each(function(){
        $(this)
            .removeClass()
            .addClass("rank")
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
                .html(tooltipText.bodyNext);
        }
    });
}

function masteryTooltip(tree, index, rank) {
    var mastery = data[tree][index];
    // second flags whether there are two tooltips (one for next rank)
    var showNext = rank < 1 || rank > mastery.ranks ? false : true;

    // parse text
    var text = {
        header: mastery.name,
        rank: "Rank: " + rank + "/" + mastery.ranks,
        rankClass: (rank < mastery.ranks ? "num-available" : "num-full"),
        req: null,
        body: masteryTooltipBody(mastery, rank),
        bodyNext: showNext ? masteryTooltipBody(mastery, rank+1) : null,
    };

    return text;
}

function masteryTooltipBody(mastery, rank)  {
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


function isValidState(tree, index, rank) {
    var mastery = data[tree][index];
    if (rank < 0 || rank > mastery.ranks)
        return false;

    return true;
}

function setState(tree, index, rank) {
    

}

drawCalculator();

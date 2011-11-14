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
    }
}

function drawButton(tree, index) {
    var spritePos = masterySpritePos(tree, index);
    var buttonPos = masteryButtonPosition(tree, index);
    $("#calculator").append(
        $("<div>")
            .addClass("button")
            .css({
                left: buttonPos[0]+"px",
                top: buttonPos[1]+"px",
                backgroundImage: "url(icon-sprite-bw.png)",
                backgroundPosition: "0px "+spritePos+"px",
            })
            .append(
                $("<div>")
                    .addClass("tooltip")
                    .append(
                        $("<strong>")
                            .addClass(treeNames[tree])
                    )
                    .append(
                        $("<span>")
                            .addClass("rank")
                    )
                    .append(
                        $("<span>")
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
                    .text("0/" + data[tree][index].ranks)
            )
            .mouseover(function(event){
                var tooltipText = masteryTooltip(tree, index, 0);
                var tooltip = $(this).find(".tooltip");
                formatTooltip(tooltip, tooltipText);
                tooltip.show().css({
                    left: event.offsetX + 5,
                    top: event.offsetY + 5,
                });
            })
            .mouseout(function(){
                $(this).find(".tooltip").hide();
            })
    );
}

function formatTooltip(tooltip, tooltipText) {
    tooltip.find("strong").text(tooltipText.header);
    tooltip.find("p.first").text(tooltipText.body);
    if (tooltipText.bodyNext == "") {
        tooltip.find("p.second").hide();
    } else {
        tooltip.find("p.second").show();
        tooltip.find("p.second").text(tooltipText.bodyNext);
    }
}

function masteryTooltip(tree, index, points) {
    var mastery = data[tree][index];
    // second flags whether there are two tooltips (one for next rank)
    var showNext = points < 1 || points > mastery.ranks ? false : true;

    // parse text
    var text = {
        header: mastery.name,
        body: masteryTooltipBody(mastery, points),
        //mastery.desc.replace("#", rankInfo[points]),
        bodyNext: showNext ? masteryTooltipBody(mastery, points+1) : "",
    };

    return text;
}

function masteryTooltipBody(mastery, points)  {
    var desc = mastery.desc;
    desc = desc.replace("#", mastery.rankInfo[points]);
    //per level TODO
    return desc;
}

function masteryButtonPosition(tree, index) {
    var idx = data[tree][index].index - 1;
    var ix = idx % 4;
    var iy = Math.floor(idx / 4);
    var x=0, y=0;

    // padding for tree
    x += 306 * tree;
    // base padding
    x += 18;
    y += 10;
    // padding for spacing
    x += ix * (59 + 12);
    y += iy * (59 + 24);

    return [x, y];
}

function masterySpritePos(tree, index) {
    return 0 - 58 * (treeOffsets[tree] + index);
}

drawCalculator();

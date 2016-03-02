define([ "message-bus", "d3" ], function(bus) {

	var svg = null;
	var pan = {
		"x" : 0,
		"y" : 0
	};

	function showState(d) {
		console.log("boh");
		bus.send("show-board", d.board);
	}

	function updateLinks(selection) {
		selection//
		.attr("d", d3.svg.diagonal().projection(function(d) {
			return [ pan.x + d.x + d3.select("#game-tree").node().getBoundingClientRect().width / 2, pan.y + d.y ];
		}));
	}

	function updateNodes(selection) {
		selection//
		.attr("r", 10)//
		.style("fill", function(d) {
			return d.best ? "red" : "black";
		})//
		.attr("transform", function(d) {
			var x = pan.x + d.x + d3.select("#game-tree").node().getBoundingClientRect().width / 2;
			return "translate(" + x + "," + (pan.y + d.y) + ")";
		})//
		.on("click", showState);
	}

	function updateNodeTexts(selection) {
		selection//
		.attr("stroke", "#fff")//
		.attr("fill", "#fff")//
		.attr("font-size", "10px")//
		.style("text-anchor", "middle")//
		.style("dominant-baseline", "central")//
		.html(function(d) {
			return d.value;
		}).attr("transform", function(d) {
			var x = pan.x + d.x + d3.select("#game-tree").node().getBoundingClientRect().width / 2;
			return "translate(" + x + "," + (pan.y + d.y) + ")";
		})//
		.on("click", showState);
	}

	var createSVG = function() {
		if (svg == null) {
			svg = d3.select("body").append("div").attr("id", "game-tree").append("svg")//
			.attr("id", "game-tree-svg")//
			.append("g")//
			.attr("id", "game-tree-g");

			var drag = d3.behavior.drag();
			drag.on("drag", function() {
				pan.x += d3.event.dx;
				pan.y += d3.event.dy;
				updateLinks(d3.selectAll(".link"));
			});
			drag.on("dragend", function() {
				updateLinks(d3.selectAll(".link"));
				updateNodes(d3.selectAll(".node"));
				updateNodeTexts(d3.selectAll(".node-text"));
			});
			d3.select("#game-tree-svg").call(drag);
		}
	};

	bus.listen("move-tree", function(e, root) {
		createSVG();
		var tree = d3.layout.tree().nodeSize([ 20, 30 ]);
		var nodes = tree.nodes(root);
		var links = tree.links(nodes);

		var link = svg.selectAll(".link").data(links);
		link.enter().append("svg:path").attr("class", "link");
		link.exit().remove();
		updateLinks(link);

		var node = svg.selectAll(".node").data(nodes);
		node.enter().append("svg:circle").attr("class", "node");
		node.exit().remove();
		updateNodes(node);

		var nodeText = svg.selectAll(".node-text").data(nodes);
		nodeText.enter().append("svg:text").attr("class", "node-text");
		nodeText.exit().remove();
		updateNodeTexts(nodeText);
	});

});
define([ "message-bus", "boardConf", "hex", "plyAutomata", "d3" ], function(bus, boardConf, hex, ply) {

	var mode = "game"; // "map"
	var playerColors = [ "red", "blue", "green" ];
	var sideLength = 40;
	var board = null;
	var svg = null;
	var hexIndices = null;

	bus.listen("start-game", function(e, newBoard) {
		board = newBoard;

		bus.send("side-length-set", [ sideLength ]);

		hexIndices = [];
		for (var u = 0; u < board.rows * board.cols; u++) {
			hexIndices.push(u);
		}

		svg = d3.select("body").insert("div", ":first-child").attr("id", "allscreen").append("svg")//
		.attr("id", "board-svg")//
		.append("g")//
		.attr("id", "board");

		refresh();
	});

	bus.listen("refresh", function() {
		refresh();
	});

	bus.listen("show-board", function(e, newBoard) {
		board = newBoard;
		refresh();
	});

	function refresh() {
		// Hexagons
		var selection = svg.selectAll(".hexagon").data(hexIndices);
		selection.exit().remove();
		selection.enter().append("path").attr("class", "hexagon");
		updateHexagon(selection);

		// Hexagon owner
		var selection = svg.selectAll(".hexagon-owner").data(hexIndices);
		selection.exit().remove();
		selection.enter().append("path").attr("class", "hexagon-owner");
		updateHexagonOwner(selection);

		// Hexagon labels
		selection = svg.selectAll(".label").data(hexIndices);
		selection.exit().remove();
		selection.enter().append("text").attr("class", "label");
		updateHexagonLabel(selection);

		// armies
		selection = svg.selectAll(".army").data(board.armies);
		selection.exit().remove();
		selection.enter().append("circle").attr("class", "army");
		updateArmy(selection);

		// army labels
		selection = svg.selectAll(".army-label").data(board.armies);
		selection.exit().remove();
		selection.enter().append("text").attr("class", "army-label");
		updateArmyLabel(selection);
	}

	function updateHexagon(selection) {
		selection//
		.attr("fill", function(d) {
			var type = board.types[d];
			if (type == boardConf.TERRAIN_TYPE_FLAT) {
				return "#A56A6A";
			} else if (type == boardConf.TERRAIN_TYPE_MOUNTAIN) {
				return "#dddddd";
			} else if (type == boardConf.TERRAIN_TYPE_WATER) {
				return "#0077ff";
			} else if (type == boardConf.TERRAIN_TYPE_PORT) {
				return "#7777dd";
			} else if (type == boardConf.TERRAIN_TYPE_CITY) {
				return "green";
			}
		})//
		.attr("stroke", "#000000")//
		.attr("stroke-width", "1")//
		.on("click", function(d) {
			if (mode == "map") {
				board.types[d] = (board.types[d] + 1) % 5;
				updateHexagon(d3.select(this));
				console.log(board.types);
			} else if (mode == "game") {
				bus.send("transition", [ {
					"type" : ply.CLICKONHEX,
					"position" : d
				} ])
			}
		})//
		.attr("d", function(d) {
			return hex.getHexPath(hex.getCenter(d), sideLength);
		});
	}

	function updateHexagonOwner(selection) {
		selection//
		.attr("fill", "none")//
		.attr("stroke", function(d) {
			var owner = board.owners[d];
			if (owner == -1) {
				return "none";
			} else {
				return playerColors[owner];
			}
		})//
		.attr("stroke-width", function(d) {
			var owner = board.owners[d];
			if (owner == -1) {
				return "1";
			} else {
				return "5";
			}
		})//
		.attr("d", function(d) {
			return hex.getHexPath(hex.getCenter(d), sideLength - 3);
		});
	}

	function updateHexagonLabel(selection) {
		selection.attr("fill", "none")//
		.attr("stroke", "#000000")//
		.attr("x", function(d) {
			return hex.getCenter(d).x + 10;
		})//
		.attr("y", function(d) {
			return hex.getCenter(d).y - 28;
		})//
		.attr("font-size", "10px")//
		.html(function(d) {
			return d;
		});
	}

	function updateArmy(selection) {
		selection.attr("fill", "white")//
		.attr("stroke", "#000000")//
		.attr("cx", function(d) {
			return hex.getCenter(d.position).x;
		})//
		.attr("cy", function(d) {
			return hex.getCenter(d.position).y;
		})//
		.attr("r", sideLength / 2)//
		.on("click", function(d) {
			var action = {
				"type" : ply.CLICKONARMY,
				"position" : d.position
			}
			bus.send("transition", [ action ]);
		});
	}

	function updateArmyLabel(selection) {
		selection.attr("fill", "none")//
		.attr("stroke", "#000000")//
		.attr("x", function(d) {
			return hex.getCenter(d.position).x;
		})//
		.attr("y", function(d) {
			return hex.getCenter(d.position).y;
		})//
		.attr("font-size", "10px")//
		.style("text-anchor", "middle")//
		.style("dominant-baseline", "central")//
		.html(function(d) {
			return d.amount;
		});
	}
});
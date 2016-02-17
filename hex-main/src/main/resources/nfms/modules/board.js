define([ "message-bus", "hex", "plyAutomata", "d3" ], function(bus, hex, ply) {

	var mode = "game"; // "map"
	var playerColors = [ "red", "blue", "green" ];

	var board = {
		TERRAIN_TYPE_FLAT : 0,
		TERRAIN_TYPE_MOUNTAIN : 1,
		TERRAIN_TYPE_WATER : 2,
		TERRAIN_TYPE_PORT : 3,
		TERRAIN_TYPE_CITY : 4,
		cols : 10,
		rows : 10,
		players : [ "ai", "human" ],
		owners : [ 0, 0, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
				-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
				-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
				-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 1 ],
		types : [ 4, 0, 3, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 2, 4, 2, 2, 0, 0, 0, 0, 0, 2, 2, 0, 0, 2, 0, 4, 0, 2, 2, 0, 0,
				2, 2, 2, 3, 2, 0, 0, 3, 0, 3, 2, 2, 2, 2, 0, 0, 4, 0, 1, 1, 2, 4, 0, 0, 0, 0, 0, 0, 1, 2, 2, 1, 0, 0,
				1, 0, 0, 0, 1, 2, 3, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4 ],
		armies : [ {
			player : 0,
			position : 1,
			amount : 50
		}, {
			player : 1,
			position : 2,
			amount : 250
		} ],

		getCenter : function(i) {
			var row = Math.floor(i / board.cols);
			var col = Math.floor(i % board.cols);
			var x = col * 1.5 * sideLength + sideLength
			var y = row * 2 * sideLength + sideLength;
			if (col % 2 == 0) {
				y += sideLength;
			}

			return {
				x : x,
				y : y
			};
		},
		getArmyIndex : function(position) {
			for (var i = 0; i < board.armies.length; i++) {
				if (board.armies[i].position == position) {
					return i;
				}
			}

			return null;
		},
		getArmy : function(position) {
			var index = board.getArmyIndex(position);
			if (index != null) {
				return board.armies[index];
			} else {
				return null;
			}
		},
		moveArmy : function(sourcePosition, targetPosition) {
			var army = board.getArmy(sourcePosition);
			army.position = targetPosition;
			board.owners[targetPosition] = army.player;
		},
		getDefenseMultiplier : function(sourcePosition, targetPosition) {
			var sourceType = board.types[sourcePosition];
			var targetType = board.types[targetPosition];
			if ((sourceType == board.TERRAIN_TYPE_FLAT && targetType == board.TERRAIN_TYPE_CITY)
					|| (sourceType == board.TERRAIN_TYPE_WATER && targetType == board.TERRAIN_TYPE_PORT)) {
				return 4;
			} else {
				return 1;
			}
		},
		battle : function(sourcePosition, targetPosition) {
			var sourceArmyIndex = board.getArmyIndex(sourcePosition);
			var targetArmyIndex = board.getArmyIndex(targetPosition);
			var sourceArmy = board.armies[sourceArmyIndex];
			var targetArmy = board.armies[targetArmyIndex];
			var defenseMultiplier = board.getDefenseMultiplier(sourcePosition, targetPosition);
			console.log(defenseMultiplier);
			var squareDiff = sourceArmy.amount * sourceArmy.amount - defenseMultiplier * defenseMultiplier
					* targetArmy.amount * targetArmy.amount;
			var alive = Math.round(Math.sqrt(Math.abs(squareDiff / 2)));
			if (squareDiff > 0) {
				sourceArmy.amount = alive;
				board.armies.splice(targetArmyIndex, 1);
			} else if (squareDiff == 0) {
				board.armies.splice(Math.max(sourceArmyIndex, targetArmyIndex), 1);
				board.armies.splice(Math.min(sourceArmyIndex, targetArmyIndex), 1);
			} else {
				targetArmy.amount = Math.trunc(alive / defenseMultiplier);
				board.armies.splice(sourceArmyIndex, 1);
			}
		}
	}
	bus.send("start-game", [ board ]);

	bus.listen("move-army", function(e, sourcePosition, targetPosition) {
		var sourceArmy = board.getArmy(sourcePosition);
		var targetArmy = board.getArmy(targetPosition);

		if (sourceArmy != null) {
			if (targetArmy != null) {
				console.log("battle!");
				board.battle(sourcePosition, targetPosition);
				if (board.getArmy(targetPosition) == null && board.getArmy(sourcePosition) != null) {
					console.log("defeated");
					board.moveArmy(sourcePosition, targetPosition);
				}
			} else {
				board.moveArmy(sourcePosition, targetPosition);
			}
			var armyFilter = function(d) {
				return d.position == targetPosition || d.position == sourcePosition;
			};
			// updateArmy(d3.selectAll(".army").filter(armyFilter));
			// updateArmyLabel(d3.selectAll(".army-label").filter(armyFilter));
		}

		// updateHexagonOwner(d3.selectAll(".hexagon-owner").filter(function(d)
		// {
		// return d == targetPosition;
		// }));
		refresh();
	});

	var sideLength = 40;

	var hexIndices = [];
	for (var u = 0; u < board.rows * board.cols; u++) {
		hexIndices.push(u);
	}

	var svg = d3.select("body").append("div").attr("id", "allscreen").append("svg")//
	.attr("id", "board-svg")//
	.append("g")//
	.attr("id", "board");

	refresh();

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
			if (type == board.TERRAIN_TYPE_FLAT) {
				return "#A56A6A";
			} else if (type == board.TERRAIN_TYPE_MOUNTAIN) {
				return "#dddddd";
			} else if (type == board.TERRAIN_TYPE_WATER) {
				return "#0077ff";
			} else if (type == board.TERRAIN_TYPE_PORT) {
				return "#7777dd";
			} else if (type == board.TERRAIN_TYPE_CITY) {
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
			return hex.getHexPath(board.getCenter(d), sideLength);
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
			return hex.getHexPath(board.getCenter(d), sideLength - 3);
		});
	}

	function updateHexagonLabel(selection) {
		selection.attr("fill", "none")//
		.attr("stroke", "#000000")//
		.attr("x", function(d) {
			return board.getCenter(d).x + 10;
		})//
		.attr("y", function(d) {
			return board.getCenter(d).y - 28;
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
			return board.getCenter(d.position).x;
		})//
		.attr("cy", function(d) {
			return board.getCenter(d.position).y;
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
			return board.getCenter(d.position).x;
		})//
		.attr("y", function(d) {
			return board.getCenter(d.position).y;
		})//
		.attr("font-size", "10px")//
		.style("text-anchor", "middle")//
		.style("dominant-baseline", "central")//
		.html(function(d) {
			return d.amount;
		});
	}
});
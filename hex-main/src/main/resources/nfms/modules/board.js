define([ "message-bus", "boardConf", "army", "plyAutomata", "d3" ], function(bus, boardConf, army, ply) {

	var mode = "game"; // "map"
	var playerColors = [ "red", "blue", "green" ];

	var board = {
		cols : boardConf.cols,
		rows : boardConf.rows,
		players : [ "ai", "human" ],
		owners : new Array(boardConf.cellTypes.length),
		types : boardConf.cellTypes,
		armies : [],
	}

	function moveArmy(b, sourcePosition, targetPosition) {
		var army = b.getArmy(sourcePosition);
		army.position = targetPosition;
		b.owners[targetPosition] = army.player;
	}

	function getDefenseMultiplier(sourceType, targetType) {
		if ((sourceType == boardConf.TERRAIN_TYPE_FLAT && targetType == boardConf.TERRAIN_TYPE_CITY)
				|| (sourceType == boardConf.TERRAIN_TYPE_WATER && targetType == boardConf.TERRAIN_TYPE_PORT)) {
			return 4;
		} else {
			return 1;
		}
	}

	function battle(b, sourcePosition, targetPosition) {
		var sourceArmyIndex = b.getArmyIndex(sourcePosition);
		var targetArmyIndex = b.getArmyIndex(targetPosition);
		var sourceArmy = b.armies[sourceArmyIndex];
		var targetArmy = b.armies[targetArmyIndex];
		var defenseMultiplier = getDefenseMultiplier(b.types[sourcePosition], b.types[targetPosition]);
		var squareDiff = sourceArmy.amount * sourceArmy.amount - defenseMultiplier * defenseMultiplier
				* targetArmy.amount * targetArmy.amount;
		var alive = Math.round(Math.sqrt(Math.abs(squareDiff / 2)));
		if (squareDiff > 0) {
			sourceArmy.amount = alive;
			b.armies.splice(targetArmyIndex, 1);
		} else if (squareDiff == 0) {
			b.armies.splice(Math.max(sourceArmyIndex, targetArmyIndex), 1);
			b.armies.splice(Math.min(sourceArmyIndex, targetArmyIndex), 1);
		} else {
			targetArmy.amount = Math.trunc(alive / defenseMultiplier);
			b.armies.splice(sourceArmyIndex, 1);
		}
	}

	function decorate(b) {
		b.getPlayerCount = function() {
			return b.players.length;
		};
		b.isAIPlayer = function(index) {
			return b.players[index] == "ai";
		};
		b.getPlayerCells = function(playerIndex) {
			var ret = [];
			for (var i = 0; i < b.owners.length; i++) {
				if (b.owners[i] == playerIndex) {
					ret.push({
						position : i,
						type : b.types[i]
					});
				}
			}

			return ret;
		};
		b.putArmy = function(player, position, amount) {
			if (player >= b.players.length) {
				throw "player index out of bounds";
			}
			for (var i = 0; i < b.armies.length; i++) {
				if (b.armies[i].position == position) {
					throw "the cell has already a position";
				}
			}
			b.owners[position] = player;
			b.armies.push(army.createArmy(player, position, amount));
		};
		b.getPlayerArmyPositions = function(player) {
			var positions = [];
			for (var i = 0; i < b.armies.length; i++) {
				if (b.armies[i].player== player) {
					positions.push(b.armies[i].position);
				}
			}

			return positions;
		};
		b.getArmyIndex = function(position) {
			for (var i = 0; i < b.armies.length; i++) {
				if (b.armies[i].position == position) {
					return i;
				}
			}

			return null;
		};
		b.getArmy = function(position) {
			var index = b.getArmyIndex(position);
			if (index != null) {
				return b.armies[index];
			} else {
				return null;
			}
		};
		b.moveArmy = function(sourcePosition, targetPosition) {
			var sourceArmy = b.getArmy(sourcePosition);
			var targetArmy = b.getArmy(targetPosition);

			if (sourceArmy != null) {
				if (targetArmy != null) {
					battle(b, sourcePosition, targetPosition);
					if (b.getArmy(targetPosition) == null && b.getArmy(sourcePosition) != null) {
						moveArmy(b, sourcePosition, targetPosition);
					}
				} else {
					moveArmy(b, sourcePosition, targetPosition);
				}
			}
		};

		b.clone = function() {
			var ret = {
				cols : b.cols,
				rows : b.rows,
				players : b.players.slice(0),
				owners : b.owners.slice(0),
				types : b.types.slice(0)
			}
			ret.armies = new Array(b.armies.length);
			for (var i = 0; i < b.armies.length; i++) {
				ret.armies[i] = b.armies[i].clone();
			}
			return decorate(ret);
		}

		return b;
	}

	decorate(board);

	bus.listen("modules-loaded", function() {
		bus.send("start-game", [ board ]);
	});
});
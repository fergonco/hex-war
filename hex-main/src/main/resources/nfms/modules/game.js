define([ "message-bus", "plyAutomata", "boardConf" ], function(bus, ply, boardConf) {

	var WAITFORCLICK = 0, WAITFORDESTINATION = 1;

	var board = null;
	var currentPlayer;

	var sourcePosition;
	var status;

	bus.listen("start-game", function(e, theBoard) {
		board = theBoard;
		board.putArmy(0, 0, 50);
		board.putArmy(1, 24, 50);
		currentPlayer = -1;
		sourcePosition = null;
		status = WAITFORCLICK;
		nextPly();
	});

	bus.listen("endply", function() {
		nextPly();
		bus.send("refresh");
	});

	function nextPlayer(player) {
		return (player + 1) % board.getPlayerCount();
	}

	function nextPly() {
		currentPlayer = nextPlayer(currentPlayer);
		if (currentPlayer == 0) {
			for (var i = 0; i < board.getPlayerCount(); i++) {
				var playerCells = board.getPlayerCells(i);
				var cities = [];
				var armies = 0;
				for (var j = 0; j < playerCells.length; j++) {
					var cell = playerCells[j];
					var city = cell.type == boardConf.TERRAIN_TYPE_CITY;
					if (!city) {
						armies = armies + 1;
					} else if (city && !isCityBesieged(cell.position)) {
						cities.push(cell.position);
						armies = armies + 5;
					}
				}
				armyForEachCity = Math.floor(armies / cities.length);
				for (var j = 0; j < cities.length; j++) {
					var cityPosition = cities[j];
					var existingArmy = board.getArmy(cityPosition);
					if (existingArmy == null) {
						board.putArmy(i, cityPosition, armyForEachCity);
					} else {
						existingArmy.amount += armyForEachCity;
					}
				}
			}
		}
		bus.send("turn", [ currentPlayer ]);
		if (board.isAIPlayer(currentPlayer)) {
			aimove(currentPlayer);
			nextPly();
		} else {
			// go out, it will be called in response to user transitions
		}
	}

	bus.listen("transition", function(e, action) {
		switch (status) {
		case WAITFORCLICK:
			switch (action.type) {
			case ply.CLICKONARMY:
				var clickedPlayer = board.owners[action.position];
				if (clickedPlayer == currentPlayer) {
					sourcePosition = action.position;
					status = WAITFORDESTINATION;
				}
				break;
			case ply.ENDPLY:
				nextPly();
				status = AIMOVE;
				break;
			}
			var validTargets = getValidTargets(sourcePosition);
			break;
		case WAITFORDESTINATION:
			switch (action.type) {
			case ply.CLICKONHEX:
				var validTargets = getValidTargets(sourcePosition);
				if (validTargets.indexOf(action.position) != -1) {
					board.moveArmy(sourcePosition, action.position);
					status = WAITFORCLICK;
					bus.send("refresh");
				}
				break;
			case ply.ENDPLY:
				nextPly();
				status = AIMOVE;
				break;
			}
			break;
		}
	});

	function isCityBesieged(position) {
		var isCity = board.types[position] == boardConf.TERRAIN_TYPE_CITY;
		var playerOwner = board.owners[position];
		var targets = getValidTargets(position);
		for (var i = 0; i < targets.length; i++) {
			var army = board.getArmy(targets[i]);
			if (army != null && army.player != playerOwner) {
				return true;
			}
		}

		return false;
	}

	function pushIfValid(array, sourcePosition, targetPosition) {
		var validMoves = [];
		validMoves[boardConf.TERRAIN_TYPE_FLAT] = [ boardConf.TERRAIN_TYPE_FLAT, boardConf.TERRAIN_TYPE_CITY,
				boardConf.TERRAIN_TYPE_PORT ];
		validMoves[boardConf.TERRAIN_TYPE_CITY] = [ boardConf.TERRAIN_TYPE_FLAT, boardConf.TERRAIN_TYPE_CITY,
				boardConf.TERRAIN_TYPE_PORT ];
		validMoves[boardConf.TERRAIN_TYPE_PORT] = [ boardConf.TERRAIN_TYPE_FLAT, boardConf.TERRAIN_TYPE_CITY,
				boardConf.TERRAIN_TYPE_PORT, boardConf.TERRAIN_TYPE_WATER ];
		validMoves[boardConf.TERRAIN_TYPE_WATER] = [ boardConf.TERRAIN_TYPE_PORT, boardConf.TERRAIN_TYPE_WATER ];
		validMoves[boardConf.TERRAIN_TYPE_MOUNTAIN] = [];
		var targetType = board.types[targetPosition];
		var sourceType = board.types[sourcePosition];
		if (validMoves[sourceType].indexOf(targetType) != -1) {
			array.push(targetPosition);
		}
	}

	function getValidNextAndPrevious(sourcePosition, relativePosition) {
		var ret = [];
		if ((relativePosition + 1) % board.cols != 0) {
			pushIfValid(ret, sourcePosition, relativePosition + 1);
		}
		if (relativePosition % board.cols != 0) {
			pushIfValid(ret, sourcePosition, relativePosition - 1);
		}
		return ret;
	}

	function getValidTargets(position) {
		var ret = getValidNextAndPrevious(position, position);
		var column = position % board.cols;
		if (position - board.cols >= 0) {
			pushIfValid(ret, position, position - board.cols);

			if (column % 2 != 0) {
				ret = ret.concat(getValidNextAndPrevious(position, position - board.cols));
			}
		}
		if (position + board.cols < board.cols * board.rows) {
			pushIfValid(ret, position, position + board.cols);
			if (column % 2 == 0) {
				ret = ret.concat(getValidNextAndPrevious(position, position + board.cols));
			}
		}
		return ret;
	}

	function createMoveAction(position, target) {
		return function(state) {
			state.moveArmy(position, target);
		}
	}

	function getValidActions(currentState, currentPlayer) {
		// TODO actions should include the end turn increase if it is the last
		// player

		var ret = [];

		// TODO add all the possible moves from all armies and combine them
		var armyPositions = currentState.getPlayerArmyPositions(currentPlayer);
		for (var i = 0; i < armyPositions.length; i++) {
			var position = armyPositions[i];
			var army = currentState.getArmy(position);
			var validTargets = getValidTargets(position);
			for (var j = 0; j < validTargets.length; j++) {
				ret.push({
					"name" : "move to " + validTargets[j],
					"apply" : createMoveAction(position, validTargets[j])
				});
			}
		}

		// no op
		ret.push({
			"name" : "don't move",
			"apply" : function(state) {
			}
		});

		return ret;
	}

	function cutoff(depth, state) {
		if (depth > 5) {
			return true;
		} else {
			return false;
		}
		// all armies belong to one player
		// the state is quiescent
		// No negative singular extensions (free path to a city or so)
		// explore positive singular
	}

	function evaluate(state, player) {
		// TODO implement properly
		var positions = state.getPlayerArmyPositions(player);
		var acum = 0;
		for (var i = 0; i < positions.length; i++) {
			acum += state.getArmy(positions[i].amount);
		}

		acum += state.getPlayerCells(player).length;
		
		return acum;
	}

	function aimove(aiPlayer) {
		var actions = getValidActions(board, aiPlayer);
		var max = null;
		var argMax = null;
		for (var i = 0; i < actions.length; i++) {
			var state = board.clone();
			actions[i].apply(state);
			var value = min(1, nextPlayer(aiPlayer), state);
			if (max == null || value > max) {
				max = value;
				argMax = actions[i];
			}
		}

		if (argMax != null) {
			console.log(argMax.name);
			argMax.apply(board);
		}
	}

	function min(depth, aiPlayer, state) {
		if (cutoff(depth, state)) {
			return evaluate(state, aiPlayer);
		}
		var actions = getValidActions(state, aiPlayer);
		var min = null;
		for (var i = 0; i < actions.length; i++) {
			var newState = state.clone();
			actions[i].apply(newState);
			var value = max(depth + 1, nextPlayer(aiPlayer), newState);
			if (min == null || value < min) {
				min = value;
			}
		}
		return min;
	}

	function max(depth, aiPlayer, state) {
		if (cutoff(depth, state)) {
			return evaluate(state, aiPlayer);
		}
		var actions = getValidActions(state, aiPlayer);
		var max = null;
		for (var i = 0; i < actions.length; i++) {
			var newState = state.clone();
			actions[i].apply(newState);
			var value = min(depth + 1, nextPlayer(aiPlayer), newState);
			if (max == null || value > max) {
				max = value;
			}
		}
		return max;
	}
});
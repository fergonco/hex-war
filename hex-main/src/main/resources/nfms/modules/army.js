define(function() {

	function decorate(army) {
		army.clone = function() {
			return decorate(createArmy(army.player, army.position, army.amount));
		}

		return army;
	}

	function createArmy(player, position, amount) {
		var army = {
			"player" : player,
			"position" : position,
			"amount" : amount,
		};

		return decorate(army);
	}

	return {
		createArmy : createArmy,
	}
});
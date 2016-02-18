define(function() {
	return {
		TERRAIN_TYPE_FLAT : 0,
		TERRAIN_TYPE_MOUNTAIN : 1,
		TERRAIN_TYPE_WATER : 2,
		TERRAIN_TYPE_PORT : 3,
		TERRAIN_TYPE_CITY : 4,
		cols : 5,
		rows : 5,
		cellTypes : [ //
		4, 0, 3, 0, 2, //
		0, 0, 2, 2, 4, //
		0, 0, 2, 2, 0, //
		2, 2, 0, 0, 2, //
		0, 3, 0, 3, 4 ]
	}
});
/*jshint node: true*/
module.exports = {

	showTables: function(db) {
		return ("SHOW FULL TABLES" +
				(typeof db === 'string' ? ' IN ' + db : '') +
			" WHERE Table_Type = 'BASE TABLE';");
	},

	showFields: function(db, table) {
		return ('SELECT ' +
					"c.column_name as field, " +
					"c.data_type as type, " +
					"c.character_maximum_length as length,  " +
					"c.numeric_precision as precision ,  " +
					"c.is_nullable as allowNull,  " +
					"c.column_default as defaultValue,  " +
					"c.chart_set_name as charSetName," +
					"c.extra as extra",
					"c.column_key as key, " +
					"CASE WHEN extra = 'auto_increment' THEN 1 ELSE 0 END as autoIncrement " +
				"FROM   " +
					"information_schema.columns c " +
				"WHERE " +
					" c.table_schema = '" + db + "' " +
					" AND c.table_name = '"+table+"';");
	},

	showForeignKeys: function(db, table) {
		return ('SELECT  ' +
					'TABLE_NAME as `table`, COLUMN_NAME as field, CONSTRAINT_NAME as `name`, REFERENCED_TABLE_NAME as `referencedTable`, REFERENCED_COLUMN_NAME as `referencedField` ' +
				'FROM ' +
					'INFORMATION_SCHEMA.KEY_COLUMN_USAGE ' +
				"WHERE TABLE_SCHEMA = '"+db+"' " +
					" AND TABLE_NAME = '"+table+"' AND REFERENCED_TABLE_NAME IS NOT NULL;");
	},

	showViews: function(db) {
		return ('SELECT TABLE_NAME AS `name`,' +
						'VIEW_DEFINITION AS `definition`, ' +
						'TABLE_SCHEMA AS `schema` ' +
				'FROM information_schema.views ' + 
				"WHERE TABLE_SCHEMA = '"+db+"'");
	},

	showRoutines: function(db, type) {
		return ( 'select ' +
					'ROUTINE_NAME as `name`, '+
					'ROUTINE_DEFINITION as `definition`, '+
					'ROUTINE_SCHEMA as `schema`,  '+
					'CREATED as `created`, '+
					'LAST_ALTERED as `lastAltered` , '+
					'routine_type as `type`'+
			'FROM information_schema.routines  '+
			"WHERE routine_type = '" + type + "' " + 
				"AND ROUTINE_SCHEMA = '"+db+"' " +
			   	"AND Left(Routine_Name, 3) NOT IN ('sp_', 'xp_', 'ms_')");
	},
	
	showFunctions: function(db, name) {
		return this.showRoutines(db, 'FUNCTION');
	},
	
	showProcedures: function(db, name) {
		return this.showRoutines(db, 'PROCEDURE');
	},

	getCacheForHints: function(db) {
		return ("select distinct from information_schema.columns WHERE TABLE_SCHEMA = '"+db+"'");
	}
};

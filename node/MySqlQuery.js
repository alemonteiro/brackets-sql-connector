/*jshint node: true*/
module.exports = {

	showTables: function(db) {
		return ("SHOW FULL TABLES" +
				(typeof db === 'string' ? ' IN ' + db : '') +
			" WHERE Table_Type = 'BASE TABLE';");
	},

	showFields: function(db, table) {
		return ('SELECT ' +
					"c.column_name as `name`, " +
					"c.DATA_TYPE as `type`, " +
					"c.CHARACTER_MAXIMUM_LENGTH as `length`,  " +
					"c.NUMERIC_PRECISION as `precision`,  " +
					"c.IS_NULLABLE as `allowNull`,  " +
					"c.COLUMN_DEFAULT as `defaultValue`,  " +
					"c.CHARACTER_SET_NAME as `charSetName`, " +
					"c.EXTRA as `extra`, " +
					"c.COLUMN_KEY as `key`, " +
					"CASE WHEN c.COLUMN_KEY = 'PRI' THEN 1 ELSE 0 END as primaryKey, " +
					"CASE WHEN extra = 'auto_increment' THEN 1 ELSE 0 END as `autoIncrement` " +
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

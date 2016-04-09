/*jshint node: true*/
module.exports = {

	showTables: function(db) {
		return ("SHOW FULL TABLES" +
				(typeof db === 'string' ? ' IN ' + db : '') +
			" WHERE Table_Type = 'BASE TABLE';");
	},

	showFields: function(db, table) {
		return 'SHOW Columns FROM ' + table + ';';
	},

	showForeignKeys: function(db, table) {
		return ('SELECT  ' +
					'TABLE_NAME as `Table`, COLUMN_NAME as Field, CONSTRAINT_NAME as `Name`, REFERENCED_TABLE_NAME as `ReferencedTable`,REFERENCED_COLUMN_NAME as `ReferencedField` ' +
				'FROM ' +
					'INFORMATION_SCHEMA.KEY_COLUMN_USAGE ' +
				"WHERE TABLE_SCHEMA = '"+db+"' " +
					" AND TABLE_NAME = '"+table+"' AND REFERENCED_TABLE_NAME IS NOT NULL;");
	},

	showViews: function(db) {
		return ('SELECT TABLE_NAME AS `name`,' +
						'VIEW_DEFINITION AS `Definition`, ' + 
						'TABLE_SCHEMA AS `Schema` ' + 
				'FROM information_schema.views ' + 
				"WHERE TABLE_SCHEMA = '"+db+"'");
	},

	showRoutines: function(db, type) {
		return ( 'select ' +
					'ROUTINE_NAME as `Name`, '+
					'ROUTINE_DEFINITION as `Definition`, '+
					'ROUTINE_SCHEMA as `Schema`,  '+
					'CREATED as `Created`, '+
					'LAST_ALTERED as `LastAltered` , '+
					'routine_type as `Type`'+
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
	}
};
